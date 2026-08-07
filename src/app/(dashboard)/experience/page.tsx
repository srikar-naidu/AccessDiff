"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Skeleton } from "@/components/ui";
import { PreviewBrowserAgent } from "@/components/voice-assistant/PreviewBrowserAgent";
import styles from "./page.module.css";

type ExperienceMode = "standard" | "screen-reader" | "keyboard" | "protanopia" | "deuteranopia" | "tritanopia" | "monochrome";

interface Project { id: string; name: string; github_repo: string; }
interface RepositoryFile { path: string; type: string; }

const MODES: Array<{ id: ExperienceMode; name: string; description: string }> = [
  { id: "standard", name: "Standard conditions", description: "Original repository preview without simulation." },
  { id: "screen-reader", name: "Screen reader simulation", description: "Shows the accessible elements detected in the imported file." },
  { id: "keyboard", name: "Keyboard navigation", description: "Highlights the imported preview and lists its tab-stop order." },
  { id: "protanopia", name: "Protanopia", description: "Applies a red-vision-deficiency simulation to the preview only." },
  { id: "deuteranopia", name: "Deuteranopia", description: "Applies a green-vision-deficiency simulation to the preview only." },
  { id: "tritanopia", name: "Tritanopia", description: "Applies a blue-vision-deficiency simulation to the preview only." },
  { id: "monochrome", name: "Monochrome", description: "Removes colour information from the preview only." },
];

interface TabStop {
  order: number;
  tag: string;
  role: string;
  label: string;
  issue: string | null;
}

export default function ExperienceModePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [filePath, setFilePath] = useState("");
  const [allFiles, setAllFiles] = useState<RepositoryFile[]>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [mode, setMode] = useState<ExperienceMode>("standard");
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const previewableFiles = useMemo(() => allFiles.filter((f) => /\.(html|jsx|tsx|vue|svelte)$/i.test(f.path)), [allFiles]);

  useEffect(() => {
    void fetch("/api/projects").then(async (response) => {
      const payload: unknown = await response.json();
      const data = isRecord(payload) && Array.isArray(payload.data) ? payload.data : [];
      const imported = data.flatMap((item): Project[] => isProject(item) ? [item] : []);
      setProjects(imported);
      if (imported[0]) setProjectId(imported[0].id);
      if (!imported.length) setError("Import a GitHub repository before opening Experience Mode.");
    }).catch(() => setError("Unable to load your imported repositories."));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    void fetch(`/api/projects/${projectId}/files`).then(async (response) => {
      const payload: unknown = await response.json();
      const fileList = isRecord(payload) && isRecord(payload.data) && Array.isArray(payload.data.files) ? payload.data.files : [];
      const parsed = fileList.flatMap((item): RepositoryFile[] => isFile(item) ? [item] : []);
      setAllFiles(parsed);
      const htmlFiles = parsed.filter((f) => /\.(html|jsx|tsx|vue|svelte)$/i.test(f.path));
      if (htmlFiles[0]) setFilePath(htmlFiles[0].path);
      else if (parsed[0]) setFilePath(parsed[0].path);
      else setFilePath("");
    }).catch(() => setError("Unable to load repository files."));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    setPreviewHtml("");
    setError(null);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !filePath) return;
    void fetch(`/api/projects/${projectId}/preview?path=${encodeURIComponent(filePath)}`, { cache: "no-store" }).then(async (response) => {
      if (!response.ok) {
        const payload: unknown = await response.json();
        const message = isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string"
          ? payload.error.message
          : "Unable to load repository preview.";
        throw new Error(message);
      }
      const html = await response.text();
      setPreviewHtml(html);
      setError(null);
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Unable to load repository preview."));
  }, [filePath, projectId]);

  useEffect(() => {
    if (mode === "keyboard" && iframeRef.current) {
      setTimeout(() => {
        try {
          const iframeDoc = iframeRef.current?.contentDocument;
          if (iframeDoc && iframeDoc.body) {
            iframeRef.current?.focus();
            iframeDoc.body.focus();
          }
        } catch {
          iframeRef.current?.focus();
        }
      }, 300);
    }
  }, [mode, previewHtml]);

  const selectedProject = projects.find((project) => project.id === projectId);
  const summary = useMemo(() => summarizeSource(previewHtml), [previewHtml]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Imported repository preview</p>
          <h1>Accessibility Experience Mode</h1>
          <p>All simulations are limited to the selected repository preview. They never change the AccessDiff dashboard.</p>
        </div>
      </header>

      {error ? <Card className={styles.error}>{error}</Card> : null}

      <Card className={styles.controls}>
        <label>Imported repository
          <select value={projectId} onChange={(event) => { setPreviewHtml(""); setFilePath(""); setProjectId(event.target.value); }}>
            <option value="">Select a repository</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name} — {project.github_repo}</option>)}
          </select>
        </label>
        <label>Preview file
          <select value={filePath} onChange={(event) => setFilePath(event.target.value)} disabled={!previewableFiles.length}>
            <option value="">Select a file</option>
            {previewableFiles.map((file) => <option key={file.path} value={file.path}>{file.path} ({file.type})</option>)}
          </select>
        </label>
      </Card>

      <section className={styles.modeGrid} aria-label="Experience modes">
        {MODES.map((item) => <button key={item.id} type="button" className={mode === item.id ? styles.modeActive : styles.mode} onClick={() => setMode(item.id)}><strong>{item.name}</strong><span>{item.description}</span></button>)}
      </section>

      <Card className={styles.previewCard}>
        <div className={styles.previewHeader}><div><p className={styles.eyebrow}>Live repository preview</p><h2>{selectedProject?.github_repo ?? "Select an imported repository"}</h2><span>{filePath || "No file selected"}</span></div><span className={styles.modeBadge}>{MODES.find((item) => item.id === mode)?.name}</span></div>
        {previewHtml ? <iframe ref={iframeRef} title={`Preview of ${filePath}`} sandbox="allow-scripts" className={`${styles.preview} ${styles[mode]}`} srcDoc={previewHtml} /> : <Skeleton height={360} />}
      </Card>

      <PreviewBrowserAgent iframe={iframeRef} files={allFiles} onOpenFile={setFilePath} />
      <p className={styles.voiceHint}>
        💡 Press <strong>Alt + Shift + V</strong> anywhere on this page to open the microphone for live preview navigation. Press <strong>Alt + Space</strong> to open the assistant without recording.
      </p>

      {(mode === "screen-reader" || mode === "keyboard") && previewHtml ? (
        <Card className={styles.assistCard}>
          <h2>{mode === "screen-reader" ? "Screen reader transcript" : "Keyboard tab order"}</h2>
          {mode === "screen-reader" ? (
            <p>{summary.announcements}</p>
          ) : (
            <KeyboardTabOrder data={summary.tabStops as TabStop[]} />
          )}
        </Card>
      ) : null}
    </div>
  );
}

function KeyboardTabOrder({ data }: { data: TabStop[] }) {
  if (!data.length) {
    return <p style={{ color: "var(--color-text-tertiary)" }}>No interactive elements found in this preview.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--color-border-default)" }}>
            <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--color-text-tertiary)", fontWeight: 600 }}>Tab #</th>
            <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--color-text-tertiary)", fontWeight: 600 }}>Element</th>
            <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--color-text-tertiary)", fontWeight: 600 }}>Accessible name</th>
            <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--color-text-tertiary)", fontWeight: 600 }}>Issue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((stop) => (
            <tr key={stop.order} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)", color: "var(--color-accent)", fontWeight: 700 }}>{stop.order}</td>
              <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                &lt;{stop.tag}
                {stop.role ? <span style={{ color: "var(--color-text-tertiary)" }}> role="{stop.role}"</span> : null}&gt;
              </td>
              <td style={{ padding: "0.5rem", color: "var(--color-text-secondary)" }}>{stop.label || <em style={{ color: "var(--color-text-tertiary)" }}>empty</em>}</td>
              <td style={{ padding: "0.5rem", color: stop.issue ? "var(--color-error)" : "transparent" }}>{stop.issue || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function summarizeSource(html: string) {
  const buttons = (html.match(/<button\b/gi) ?? []).length;
  const inputs = (html.match(/<(input|select|textarea)\b/gi) ?? []).length;
  const links = (html.match(/<a\b/gi) ?? []).length;
  const images = (html.match(/<img\b/gi) ?? []).length;
  const announcements = `Repository preview contains ${buttons} buttons, ${inputs} form controls, ${links} links, and ${images} images.`;

  let tabStops: TabStop[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const focusable = doc.querySelectorAll("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
    const seen = new Set<string>();
    tabStops = Array.from(focusable).map((el, idx) => {
      const tag = el.tagName.toLowerCase();
      const role = (el.getAttribute("role") || "").trim();
      let label = "";
      if (el instanceof HTMLAnchorElement) {
        label = el.textContent?.trim() || el.getAttribute("aria-label") || "";
      } else if (el instanceof HTMLButtonElement) {
        label = el.textContent?.trim() || el.getAttribute("aria-label") || "";
      } else if (el instanceof HTMLInputElement) {
        const associatedLabel = el.id ? doc.querySelector(`label[for="${el.id}"]`) : null;
        label = associatedLabel?.textContent?.trim() || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "";
      } else if (el instanceof HTMLSelectElement) {
        const associatedLabel = el.id ? doc.querySelector(`label[for="${el.id}"]`) : null;
        label = associatedLabel?.textContent?.trim() || el.getAttribute("aria-label") || "";
      } else if (el instanceof HTMLTextAreaElement) {
        const associatedLabel = el.id ? doc.querySelector(`label[for="${el.id}"]`) : null;
        label = associatedLabel?.textContent?.trim() || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "";
      } else {
        label = el.getAttribute("aria-label") || el.textContent?.trim() || "";
      }

      let issue: string | null = null;
      if (!label) {
        if (tag === "a") issue = "Empty link text";
        else if (tag === "button") issue = "Button has no accessible name";
        else if (tag === "input") issue = "Input has no associated label";
        else if (tag === "select") issue = "Select has no associated label";
        else if (tag === "textarea") issue = "Textarea has no associated label";
      }
      if (tag === "a" && !el.getAttribute("href")) issue = "Link without href";

      const key = `${tag}-${label}-${role}`;
      if (seen.has(key)) {
        return null;
      }
      seen.add(key);

      return {
        order: idx + 1,
        tag,
        role: role || "",
        label: label || "",
        issue,
      };
    }).filter((item): item is TabStop => item !== null);
  } catch {
    tabStops = [];
  }

  return { announcements, tabStops };
}

function escapeHtml(value: string): string { return value.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character] ?? character); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isProject(value: unknown): value is Project { return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.github_repo === "string"; }
function isFile(value: unknown): value is RepositoryFile { return isRecord(value) && typeof value.path === "string" && typeof value.type === "string"; }
