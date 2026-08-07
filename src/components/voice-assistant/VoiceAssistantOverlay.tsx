"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./VoiceAssistantOverlay.module.css";

type SarvamLanguage =
  | "en-IN" | "hi-IN" | "ta-IN" | "te-IN" | "kn-IN"
  | "ml-IN" | "bn-IN" | "gu-IN" | "mr-IN" | "pa-IN" | "or-IN";

const LANGUAGE_OPTIONS: { value: SarvamLanguage; label: string; speechCode: string }[] = [
  { value: "en-IN", label: "English", speechCode: "en-IN" },
  { value: "hi-IN", label: "Hindi", speechCode: "hi-IN" },
  { value: "ta-IN", label: "Tamil", speechCode: "ta-IN" },
  { value: "te-IN", label: "Telugu", speechCode: "te-IN" },
  { value: "kn-IN", label: "Kannada", speechCode: "kn-IN" },
  { value: "ml-IN", label: "Malayalam", speechCode: "ml-IN" },
  { value: "bn-IN", label: "Bengali", speechCode: "bn-IN" },
  { value: "gu-IN", label: "Gujarati", speechCode: "gu-IN" },
  { value: "mr-IN", label: "Marathi", speechCode: "mr-IN" },
  { value: "pa-IN", label: "Punjabi", speechCode: "pa-IN" },
  { value: "or-IN", label: "Odia", speechCode: "or-IN" },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: string;
}

function sendBrowserCommand(query: string): Promise<string | null> {
  return new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    const timeout = window.setTimeout(() => {
      window.removeEventListener("accessdiff:browser-command-response", onResponse);
      resolve(null);
    }, 400);
    function onResponse(event: Event): void {
      const detail = (event as CustomEvent<{ requestId?: string; answer?: string; handled?: boolean }>).detail;
      if (detail?.requestId !== requestId) return;
      window.clearTimeout(timeout);
      window.removeEventListener("accessdiff:browser-command-response", onResponse);
      resolve(detail.handled && detail.answer ? detail.answer : null);
    }
    window.addEventListener("accessdiff:browser-command-response", onResponse);
    window.dispatchEvent(new CustomEvent("accessdiff:browser-command", { detail: { requestId, query } }));
  });
}

export default function VoiceAssistantOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<SarvamLanguage>("en-IN");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef("");
  const startRecordingRef = useRef<() => void>(() => undefined);

  // Load chat history when opening
  useEffect(() => {
    if (!isOpen) return;
    async function loadHistory() {
      try {
        const res = await fetch("/api/chat");
        const json = await res.json();
        if (json.data?.messages) {
          setMessages(json.data.messages);
        }
      } catch {
        // ignore
      }
    }
    void loadHistory();
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Alt+Space opens the assistant; Alt+Shift+V opens it and starts the mic.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.altKey || event.ctrlKey) && (event.code === "Space" || event.key === " ")) {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen((prev) => !prev);
      }
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === "v") {
        event.preventDefault();
        setIsOpen(true);
        window.setTimeout(() => startRecordingRef.current(), 0);
      }
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isOpen]);

  const speakText = async (text: string, msgId: string, langCode: SarvamLanguage) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (speakingId === msgId) {
      setSpeakingId(null);
      return;
    }

    setSpeakingId(msgId);

    // Try Sarvam TTS API first
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tts",
          text: text.slice(0, 500),
          language: langCode,
        }),
      });

      const json = await res.json();
      if (json.data?.audioBase64) {
        const audioSrc = `data:audio/wav;base64,${json.data.audioBase64}`;
        const audio = new Audio(audioSrc);
        currentAudioRef.current = audio;

        audio.onended = () => setSpeakingId(null);
        audio.onerror = () => fallbackWebSpeech(text, langCode);
        await audio.play();
        return;
      }
    } catch {
      // ignore and fallback
    }

    // Fallback: Browser Web Speech Synthesis
    fallbackWebSpeech(text, langCode);
  };

  const fallbackWebSpeech = (text: string, langCode: SarvamLanguage) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeakingId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const speechLang = LANGUAGE_OPTIONS.find((l) => l.value === langCode)?.speechCode || "en-IN";
    utterance.lang = speechLang;
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const msg = (textToSend ?? input).trim();
    if (!msg || sending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: msg,
      language,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const browserAnswer = await sendBrowserCommand(msg);
      if (browserAnswer) {
        const newMsgId = crypto.randomUUID();
        setMessages((prev) => [...prev, { id: newMsgId, role: "assistant", content: browserAnswer, language }]);
        if (autoSpeak) void speakText(browserAnswer, newMsgId, language);
        return;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, language }),
      });
      const json = await res.json();

      const reply = json.data?.reply || json.error?.message || "Sorry, I couldn't process that.";
      const newMsgId = crypto.randomUUID();

      const assistantMsg: ChatMessage = {
        id: newMsgId,
        role: "assistant",
        content: reply,
        language,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (autoSpeak) {
        void speakText(reply, newMsgId, language);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
          language: "en-IN",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = () => {
    if (recording) {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        return;
      }
      if (recognitionRef.current) {
        try {
          (recognitionRef.current as { stop: () => void }).stop();
        } catch {
          // ignore
        }
      }
      setRecording(false);
      return;
    }

    if (typeof window === "undefined") return;

    if (navigator.mediaDevices && typeof MediaRecorder !== "undefined") {
      void navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onerror = () => {
          setRecording(false);
          stream.getTracks().forEach((track) => track.stop());
        };
        recorder.onstop = () => {
          setRecording(false);
          stream.getTracks().forEach((track) => track.stop());
          void transcribeWithSarvam(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }), language)
            .then((transcript) => {
              if (!transcript) return;
              setInput(transcript);
              void handleSend(transcript);
            })
            .catch(() => {
              setMessages((previous) => [...previous, {
                id: crypto.randomUUID(), role: "assistant", language: "en-IN",
                content: "I could not transcribe that recording with Sarvam AI. Please try again.",
              }]);
            });
        };
        recorder.start();
        setRecording(true);
      }).catch(() => {
        setMessages((previous) => [...previous, {
          id: crypto.randomUUID(), role: "assistant", language: "en-IN",
          content: "Microphone access is required for Sarvam voice navigation.",
        }]);
      });
      return;
    }

    const SpeechRecognitionWindow =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognitionWindow) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Brave.");
      return;
    }

    try {
      transcriptRef.current = "";
      const recognition = new (SpeechRecognitionWindow as new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: (e: {
          resultIndex: number;
          results: { [key: number]: { transcript: string } }[];
        }) => void;
        onerror: (e: { error: string }) => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      })();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = LANGUAGE_OPTIONS.find((l) => l.value === language)?.speechCode || "en-IN";

      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const transcriptParts: string[] = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcriptParts.push(event.results[i][0].transcript);
        }
        transcriptRef.current = transcriptParts.join("");
        setInput(transcriptRef.current);
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        setRecording(false);
      };

      recognition.onend = () => {
        setRecording(false);
        if (transcriptRef.current.trim()) void handleSend(transcriptRef.current);
      };

      recognition.start();
      setRecording(true);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setRecording(false);
    }
  };
  useEffect(() => {
    startRecordingRef.current = toggleRecording;
  }, [toggleRecording]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        className={styles.fab}
        onClick={() => setIsOpen(true)}
        title="Open Voice Assistant (Alt+Space)"
        aria-label="Open Voice Assistant for Screen Reader Navigation"
        type="button"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      </button>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-label="Voice Assistant">
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.title}>🎙️ Voice Assistant</span>
            <span className={styles.subtitle}>Screen Reader Navigation Helper</span>
          </div>

          <div className={styles.controls}>
            <label className={styles.autoSpeakToggle}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
              />
              Auto-Speak
            </label>

            <select
              className={styles.langSelect}
              value={language}
              onChange={(e) => setLanguage(e.target.value as SarvamLanguage)}
              aria-label="Select language"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close voice assistant"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        <div className={styles.messages}>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🎙️</span>
              <span className={styles.emptyTitle}>Voice Navigation Ready</span>
              <span className={styles.emptyHint}>
                Press Alt+Shift+V to open the microphone, or Alt+Space to open this assistant. In Live Repository Preview, ask what the page is about, list buttons, or open a file or directory.
              </span>
              <div className={styles.suggestions}>
                <button className={styles.suggestionChip} onClick={() => void handleSend("Describe the current page elements.")}>
                  Describe page elements
                </button>
                <button className={styles.suggestionChip} onClick={() => void handleSend("What accessibility issues are present?")}>
                  Find accessibility issues
                </button>
                <button className={styles.suggestionChip} onClick={() => void handleSend("Guide me through the live repository preview.")}>
                  Guide me through preview
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageWrapper} ${
                  msg.role === "user" ? styles.userWrapper : styles.assistantWrapper
                }`}
              >
                <div
                  className={`${styles.message} ${
                    msg.role === "user" ? styles.userMsg : styles.assistantMsg
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === "assistant" && (
                  <div className={styles.msgFooter}>
                    <button
                      className={`${styles.speakBtn} ${
                        speakingId === msg.id ? styles.speakingActive : ""
                      }`}
                      onClick={() => void speakText(msg.content, msg.id, msg.language as SarvamLanguage)}
                      title="Listen to the response"
                      type="button"
                    >
                      {speakingId === msg.id ? "⏸️ Pause" : "🔊 Listen"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {sending && <div className={styles.typing}>Voice assistant is thinking…</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          {recording && (
            <div className={styles.recordingStatus}>
              <span className={styles.recordingDot} />
              🎙️ Listening... Speak now!
            </div>
          )}

          <div className={styles.inputRow}>
            <button
              className={`${styles.voiceBtn} ${recording ? styles.voiceActive : ""}`}
              onClick={toggleRecording}
              title={recording ? "Stop listening" : "Start voice input"}
              aria-label={recording ? "Stop voice listening" : "Start voice listening"}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            <input
              className={styles.chatInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                recording
                  ? "Listening to your voice..."
                  : "Ask about navigating the preview, screen reader tips, or accessibility guidance…"
              }
              disabled={sending}
            />

            <button
              className={styles.sendBtn}
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              title="Send message"
              aria-label="Send message"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function transcribeWithSarvam(audio: Blob, language: SarvamLanguage): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Audio conversion failed."));
    reader.onerror = () => reject(new Error("Audio conversion failed."));
    reader.readAsDataURL(audio);
  });
  const audioBase64 = dataUrl.split(",")[1];
  if (!audioBase64) throw new Error("Audio conversion failed.");
  const response = await fetch("/api/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "stt", audioBase64, language }),
  });
  const payload: unknown = await response.json();
  if (!response.ok || !isVoiceResponse(payload)) throw new Error("Sarvam speech-to-text failed.");
  return payload.data.transcript;
}

function isVoiceResponse(value: unknown): value is { data: { transcript: string } } {
  return typeof value === "object" && value !== null
    && typeof (value as { data?: { transcript?: unknown } }).data?.transcript === "string";
}
