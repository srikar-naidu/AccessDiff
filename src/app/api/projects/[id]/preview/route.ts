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

    const tree = await github.getFileTree(owner, repo, branchOrRef);

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

    const entryExists = tree.some((item) => item.path === entryPath);
    if (!entryExists) {
      return NextResponse.json(
        { data: null, error: { message: `The selected file "${entryPath}" was not found in this project's default branch.`, code: "FILE_NOT_FOUND" } },
        { status: 404 }
      );
    }

    const entryContent = await github.getFileContent(owner, repo, entryPath, branchOrRef);

    const cssFiles = tree.filter((item) => item.type === "blob" && /\.css$/i.test(item.path));
    const cssPromises = cssFiles.map((cssFile) =>
      github.getFileContent(owner, repo, cssFile.path, branchOrRef).then((content) => ({
        path: cssFile.path,
        content,
      })).catch(() => null)
    );
    const cssResults = (await Promise.all(cssPromises)).filter((item): item is { path: string; content: string } => item !== null);

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

    const focusHighlightScript = `<script>
      (function() {
        var style = document.createElement('style');
        style.textContent = '.accessdiff-focus-ring { outline: 3px solid #f97316 !important; outline-offset: 2px !important; box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.25) !important; border-radius: 4px !important; } .accessdiff-focus-info { position: fixed; bottom: 12px; left: 12px; background: rgba(0,0,0,0.85); color: #fff; padding: 6px 12px; border-radius: 6px; font: 12px system-ui; z-index: 99999; pointer-events: none; } .accessdiff-number-badge { position: absolute; top: -10px; left: -10px; background: #f97316; color: #fff; width: 20px; height: 20px; border-radius: 50%; font: bold 11px system-ui; display: flex; align-items: center; justify-content: center; z-index: 99998; pointer-events: none; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }';
        document.head.appendChild(style);
        var info = document.createElement('div');
        info.className = 'accessdiff-focus-info';
        document.body.appendChild(info);
        var focusables = [];
        function updateFocusables() {
          focusables = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex=\\'-1\\'])')).filter(function(el) {
            var cs = window.getComputedStyle(el);
            return cs.display !== 'none' && cs.visibility !== 'hidden';
          });
          focusables.forEach(function(el, idx) {
            el.classList.remove('accessdiff-focus-ring');
            var existing = el.querySelector('.accessdiff-number-badge');
            if (existing) existing.remove();
            if (idx < 9) {
              var badge = document.createElement('span');
              badge.className = 'accessdiff-number-badge';
              badge.textContent = idx + 1;
              el.style.position = el.style.position || 'relative';
              el.appendChild(badge);
            }
          });
        }
        setTimeout(updateFocusables, 300);
        document.addEventListener('focusin', function(e) {
          document.querySelectorAll('.accessdiff-focus-ring').forEach(function(el) { el.classList.remove('accessdiff-focus-ring'); });
          if (e.target && e.target.nodeType === 1) { e.target.classList.add('accessdiff-focus-ring'); }
          var tag = e.target.tagName.toLowerCase();
          var role = e.target.getAttribute('role') || '';
          var label = '';
          if (e.target.tagName === 'A') label = e.target.textContent.trim() || e.target.getAttribute('aria-label') || '';
          else if (e.target.tagName === 'BUTTON') label = e.target.textContent.trim() || e.target.getAttribute('aria-label') || '';
          else if (e.target.tagName === 'INPUT') label = e.target.getAttribute('aria-label') || e.target.getAttribute('placeholder') || '';
          else if (e.target.tagName === 'SELECT') label = e.target.getAttribute('aria-label') || '';
          else if (e.target.tagName === 'TEXTAREA') label = e.target.getAttribute('aria-label') || e.target.getAttribute('placeholder') || '';
          else label = e.target.getAttribute('aria-label') || e.target.textContent.trim() || '';
          info.textContent = (label ? '[' + tag + '] ' + label : tag + (role ? ' role="' + role + '"' : ''));
        });
        document.addEventListener('focusout', function() {
          document.querySelectorAll('.accessdiff-focus-ring').forEach(function(el) { el.classList.remove('accessdiff-focus-ring'); });
          info.textContent = '';
        });
        document.addEventListener('keydown', function(e) {
          if (e.altKey || e.ctrlKey || e.metaKey) return;
          var num = parseInt(e.key, 10);
          if (num >= 1 && num <= 9) {
            e.preventDefault();
            e.stopPropagation();
            updateFocusables();
            if (num <= focusables.length) {
              focusables[num - 1].focus();
            }
          }
        });
        var observer = new MutationObserver(updateFocusables);
        observer.observe(document.body, { childList: true, subtree: true });
      })();
    <\/script>`;

    const browserAgentBridge = `<script>
      (function() {
        function textOf(element) {
          return (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || element.getAttribute('placeholder') || '').replace(/\\s+/g, ' ').trim();
        }
        function interactiveElements() {
          return Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])')).filter(function(element) {
            var styles = window.getComputedStyle(element);
            return styles.display !== 'none' && styles.visibility !== 'hidden';
          });
        }
        function send(requestId, text) { parent.postMessage({ type: 'accessdiff-preview-response', requestId: requestId, text: text }, '*'); }
        function describe() {
          var title = document.title.replace(/\\s*â€”\\s*Live Preview$/, '');
          var headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(textOf).filter(Boolean).slice(0, 5);
          var landmarks = Array.from(document.querySelectorAll('main, nav, header, footer, [role="main"], [role="navigation"]')).map(function(element) { return element.getAttribute('aria-label') || element.tagName.toLowerCase(); });
          return title + '. ' + (headings.length ? 'Headings: ' + headings.join(', ') + '. ' : '') + (landmarks.length ? 'Regions: ' + landmarks.join(', ') + '. ' : '') + 'There are ' + interactiveElements().length + ' interactive elements.';
        }
        function listControls() {
          var items = interactiveElements().map(function(element) { return element.tagName.toLowerCase() + ': ' + (textOf(element) || 'unnamed'); }).slice(0, 20);
          return items.length ? 'Available controls: ' + items.join('; ') + '.' : 'There are no interactive controls in this preview.';
        }
        function activate(target) {
          var wanted = String(target || '').toLowerCase().trim();
          var element = interactiveElements().find(function(candidate) {
            var name = textOf(candidate).toLowerCase();
            return name === wanted || name.includes(wanted) || wanted.includes(name);
          });
          if (!element) return 'I could not find a control named ' + target + ' in this preview.';
          element.focus(); element.click();
          return 'Opened ' + (textOf(element) || element.tagName.toLowerCase()) + '.';
        }
        window.addEventListener('message', function(event) {
          if (event.source !== parent || !event.data || event.data.type !== 'accessdiff-preview-command') return;
          var command = event.data;
          if (command.action === 'describe') send(command.requestId, describe());
          else if (command.action === 'controls') send(command.requestId, listControls());
          else if (command.action === 'activate') send(command.requestId, activate(command.target));
        });
      })();
    <\/script>`;

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
  ${focusHighlightScript}
  ${browserAgentBridge}
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
