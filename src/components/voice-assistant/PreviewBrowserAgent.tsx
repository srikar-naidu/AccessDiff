"use client";

import { useEffect, type RefObject } from "react";

interface RepositoryFile {
  path: string;
  type: string;
}

interface PreviewBrowserAgentProps {
  iframe: RefObject<HTMLIFrameElement | null>;
  files: RepositoryFile[];
  onOpenFile: (path: string) => void;
}

interface BrowserCommandDetail {
  query: string;
  requestId: string;
}

interface PreviewResponse {
  type: "accessdiff-preview-response";
  requestId: string;
  text: string;
}

const PREVIEW_COMMAND = "accessdiff-preview-command";

/**
 * A deliberately scoped browser agent for the sandboxed repository preview.
 * It communicates through postMessage so the parent never weakens the iframe
 * sandbox or obtains direct access to imported repository markup.
 */
export function PreviewBrowserAgent({ iframe, files, onOpenFile }: PreviewBrowserAgentProps): null {
  useEffect(() => {
    function respond(requestId: string, answer: string, handled = true): void {
      window.dispatchEvent(new CustomEvent("accessdiff:browser-command-response", {
        detail: { requestId, answer, handled },
      }));
    }

    function findRepositoryFile(query: string): RepositoryFile | undefined {
      const requested = query
        .replace(/^(?:open|go to|show)\s+(?:the\s+)?(?:directory|folder|file)?\s*/i, "")
        .replace(/["']/g, "")
        .trim()
        .toLowerCase();
      if (!requested) return undefined;

      return files.find((file) => file.path.toLowerCase() === requested)
        ?? files.find((file) => file.path.toLowerCase().endsWith(`/${requested}`))
        ?? files.find((file) => file.path.toLowerCase().includes(requested));
    }

    function sendToPreview(requestId: string, action: "describe" | "controls" | "activate", target?: string): void {
      const targetWindow = iframe.current?.contentWindow;
      if (!targetWindow) {
        respond(requestId, "The live repository preview is not ready yet.");
        return;
      }
      targetWindow.postMessage({ type: PREVIEW_COMMAND, requestId, action, target }, "*");
    }

    function handleBrowserCommand(event: Event): void {
      const detail = (event as CustomEvent<BrowserCommandDetail>).detail;
      if (!detail?.query || !detail.requestId) return;
      const normalized = detail.query.trim().toLowerCase();

      if (/^(?:open|go to|show)\s+(?:the\s+)?(?:directory|folder|file)\b/.test(normalized)) {
        const file = findRepositoryFile(detail.query);
        if (!file) {
          respond(detail.requestId, "I could not find that file or directory in the imported repository.");
          return;
        }
        onOpenFile(file.path);
        respond(detail.requestId, `Opening ${file.path} in the live repository preview.`);
        return;
      }

      if (/what (?:is|is this) (?:the )?(?:website|page) about|describe (?:the )?(?:website|page)|what am i (?:looking|viewing)/.test(normalized)) {
        sendToPreview(detail.requestId, "describe");
        return;
      }

      if (/(?:what|which).*(?:buttons|links|controls).*(?:present|available|there|website|page)|what (?:all )?(?:buttons|links|controls)|list (?:the )?(?:buttons|links|controls)|what can i (?:click|use)/.test(normalized)) {
        sendToPreview(detail.requestId, "controls");
        return;
      }

      const activation = detail.query.match(/^(?:open|click|press|select|activate)\s+(?:the\s+)?(.+)/i);
      if (activation?.[1]) {
        sendToPreview(detail.requestId, "activate", activation[1]);
        return;
      }

      respond(detail.requestId, "", false);
    }

    function handlePreviewMessage(event: MessageEvent<unknown>): void {
      if (event.source !== iframe.current?.contentWindow) return;
      const payload = event.data;
      if (!isPreviewResponse(payload)) return;
      respond(payload.requestId, payload.text);
    }

    window.addEventListener("accessdiff:browser-command", handleBrowserCommand);
    window.addEventListener("message", handlePreviewMessage);
    return () => {
      window.removeEventListener("accessdiff:browser-command", handleBrowserCommand);
      window.removeEventListener("message", handlePreviewMessage);
    };
  }, [files, iframe, onOpenFile]);

  return null;
}

function isPreviewResponse(value: unknown): value is PreviewResponse {
  return typeof value === "object" && value !== null
    && (value as Record<string, unknown>).type === "accessdiff-preview-response"
    && typeof (value as Record<string, unknown>).requestId === "string"
    && typeof (value as Record<string, unknown>).text === "string";
}
