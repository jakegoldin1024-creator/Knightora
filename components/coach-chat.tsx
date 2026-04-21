"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, isToolUIPart } from "ai";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import styles from "./coach-chat.module.css";

function formatToolOutput(toolType: string, output: unknown): ReactNode {
  if (toolType === "tool-suggest_training" && output && typeof output === "object") {
    const o = output as {
      suggestions?: Array<{ catalogKey: string; headline: string; href: string; howToFind: string }>;
      generalTips?: string[];
    };
    return (
      <>
        {o.suggestions?.length ? (
          <>
            <ul style={{ margin: "6px 0 0", paddingLeft: "1.1rem" }}>
              {o.suggestions.map((s) => (
                <li key={s.catalogKey} style={{ marginBottom: 8 }}>
                  <strong>{s.catalogKey}</strong> — {s.headline}
                  <div style={{ opacity: 0.9, marginTop: 4 }}>{s.howToFind}</div>
                </li>
              ))}
            </ul>
            <p style={{ margin: "10px 0 0" }}>
              <Link href="/quiz">Open Quiz training →</Link>
            </p>
          </>
        ) : null}
        {o.generalTips?.length ? (
          <ul style={{ margin: "8px 0 0", paddingLeft: "1.1rem" }}>
            {o.generalTips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        ) : null}
      </>
    );
  }

  if (toolType === "tool-suggest_resources" && output && typeof output === "object") {
    const o = output as {
      videos?: Array<{ title: string; watchUrl: string; why: string }>;
    };
    return (
      <ul style={{ margin: "6px 0 0", paddingLeft: "1.1rem" }}>
        {o.videos?.map((v) => (
          <li key={v.watchUrl} style={{ marginBottom: 8 }}>
            <a href={v.watchUrl} target="_blank" rel="noreferrer">
              {v.title}
            </a>
            <div style={{ opacity: 0.9, marginTop: 4 }}>{v.why}</div>
          </li>
        ))}
      </ul>
    );
  }

  return <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(output, null, 2)}</pre>;
}

function ToolSummary({ part }: { part: unknown }) {
  const p = part as {
    type: string;
    state: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };

  if (p.state === "input-streaming" || p.state === "input-available") {
    return (
      <div className={styles.toolBlock}>
        <p className={styles.toolTitle}>{p.type.replace("tool-", "").replace(/_/g, " ")}</p>
        <span>Preparing…</span>
      </div>
    );
  }

  if (p.state === "output-error") {
    return (
      <div className={styles.toolBlock}>
        <p className={styles.toolTitle}>Tool</p>
        {p.errorText ?? "Something went wrong."}
      </div>
    );
  }

  if (p.state === "output-available" && p.output != null) {
    return (
      <div className={styles.toolBlock}>
        <p className={styles.toolTitle}>{p.type.replace("tool-", "").replace(/_/g, " ")}</p>
        {formatToolOutput(p.type, p.output)}
      </div>
    );
  }

  return null;
}

export function CoachChat() {
  const [text, setText] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/coach/chat",
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className={styles.wrap}>
      <p className={styles.banner}>
        This is your chess conversation: positions you’re confused by, openings you want to play, how to drill, or what to do next in training.
        Knightneo’s product links come first; outside videos only appear when the coach pulls them from our curated list.
      </p>

      <div className={styles.messages} aria-live="polite">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`${styles.bubble} ${m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}`}
          >
            {m.parts.map((part, index) => {
              if (isTextUIPart(part)) {
                return (
                  <span key={`${m.id}-t-${index}`}>
                    {part.text}
                  </span>
                );
              }
              if (isToolUIPart(part as never)) {
                return <ToolSummary key={`${m.id}-k-${index}`} part={part} />;
              }
              return null;
            })}
          </div>
        ))}
      </div>

      {error ? <p className={styles.error}>{error.message}</p> : null}

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = text.trim();
          if (!trimmed || busy) return;
          void sendMessage({ text: trimmed });
          setText("");
        }}
      >
        <div className={styles.row}>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. I keep messing up rook endgames—where should I start?"
            disabled={busy}
            rows={3}
          />
          <div className={styles.actions}>
            <button type="submit" className={styles.btn} disabled={busy || !text.trim()}>
              Send
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} disabled={!busy} onClick={() => void stop()}>
              Stop
            </button>
          </div>
        </div>
        <p className={styles.hint}>Voice input can plug in later—this MVP is text-first with streaming replies.</p>
      </form>
    </div>
  );
}
