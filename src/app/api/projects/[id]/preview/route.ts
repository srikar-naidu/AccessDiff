import { NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github/client";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: projectId } = await props.params;
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: dbUser } = await admin
      .from("users")
      .select("github_token")
      .eq("id", user.id)
      .single();

    if (!dbUser?.github_token) {
      return NextResponse.json(
        { data: null, error: { message: "GitHub token missing. Please sign in again.", code: "GITHUB_TOKEN_MISSING" } },
        { status: 401 }
      );
    }

    const { data: project } = await admin
      .from("projects")
      .select("github_repo, default_branch")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { data: null, error: { message: "Project not found.", code: "PROJECT_NOT_FOUND" } },
        { status: 404 }
      );
    }

    const [owner, repo] = project.github_repo.split("/");
    const github = new GitHubClient(dbUser.github_token);
    const branchOrRef = project.default_branch ?? "main";

    // 1) Load project tree once
    const tree = await github.getFileTree(owner, repo, branchOrRef);

    // 2) Resolve entry file path
    let entryPath = filePath;
    if (!entryPath) {
      const htmlFile = tree.find((item) => /\.(html|jsx|tsx|vue|svelte)$/i.test(item.path));
      entryPath = htmlFile?.path ?? tree[0]?.path;
    }

    if (!entryPath) {
      return NextResponse.json(
        { data: null, error: { message: "No previewable file selected or found in this project.", code: "NO_ENTRY" } },
        { status: 404 }
      );
    }

    // 3) Validate entryPath exists in tree before fetching content
    const entryExists = tree.some((item) => item.path === entryPath);
    if (!entryExists) {
      return NextResponse.json(
        { data: null, error: { message: `The selected file "${entryPath}" was not found in this project's default branch.`, code: "FILE_NOT_FOUND" } },
        { status: 404 }
      );
    }

    // 4) Load entry file content
    const entryContent = await github.getFileContent(owner, repo, entryPath, branchOrRef);

    // 5) Load all CSS files in the project
    const cssFiles = tree.filter((item) => item.type === "blob" && /\.css$/i.test(item.path));
    const cssPromises = cssFiles.map((cssFile) =>
      github.getFileContent(owner, repo, cssFile.path, branchOrRef).then((content) => ({
        path: cssFile.path,
        content,
      })).catch(() => null)
    );
    const cssResults = (await Promise.all(cssPromises)).filter((item): item is { path: string; content: string } => item !== null);

    // 6) Build combined preview document
    const cssBlocks = cssResults.map((css) => `/* === ${css.path} === */\n${css.content}`).join("\n\n");
    const escapedCss = cssBlocks.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const isHtml = /\.(html|jsx|tsx|vue|svelte)$/i.test(entryPath);
    const bodyContent = isHtml
      ? entryContent
          .replace(/import[^;]+;?/g, "")
          .replace(/className=/g, "class=")
          .replace(/\{[^}]*\}/g, "preview-value")
          .replace(/\son[A-Z][A-Za-z]*=(?:\"[^\"]*\"|'[^']*'|\{[^}]*\})/g, "")
      : `<pre>${entryContent.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c)}</pre>`;

    const previewHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${entryPath} — Live Preview</title>
  <style>
    /* Inlined project CSS */
    ${escapedCss}
  </style>
  <style>
    body { font: 16px system-ui; padding: 24px; color: #151515; background: #fff; }
    button, input, a, select, textarea { margin: 6px; padding: 8px; }
    img { max-width: 100%; height: auto; }
    pre { white-space: pre-wrap; }
  </style>
</head>
<body>
  ${bodyContent.replace(/<script[\s\S]*?<\/script>/gi, "")}
</body>
</html>`;

    return new NextResponse(previewHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (caught: unknown) {
    const message = caught instanceof Error ? caught.message : "Failed to build project preview.";
    return NextResponse.json(
      { data: null, error: { message, code: "PREVIEW_FAILED" } },
      { status: 500 }
    );
  }
}
