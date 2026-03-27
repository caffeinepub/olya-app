import React from "react";
import type { BeliefState, TranscriptEntry } from "../hooks/useDashboardState";

interface PrintAnalysisViewProps {
  sessionId: string | null;
  entries: TranscriptEntry[];
  beliefState: BeliefState;
  latestEntry: TranscriptEntry | null;
}

function fmt(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtTs(ts: number) {
  return new Date(ts).toLocaleTimeString();
}

export default function PrintAnalysisView({
  sessionId,
  entries,
  beliefState,
  latestEntry,
}: PrintAnalysisViewProps) {
  const now = new Date().toLocaleString();
  const dominantEmotion =
    latestEntry?.emotions[0]?.emotionType ??
    entries[entries.length - 1]?.emotions[0]?.emotionType ??
    "—";
  const totalExchanges = entries.length;
  const biasIncidents = entries.reduce(
    (acc, e) => acc + e.toxicityFlags.length,
    0,
  );

  const healthScore = Math.round(
    beliefState.trustLevel * 0.7 +
      (biasIncidents === 0 ? 30 : Math.max(0, 30 - biasIncidents * 5)),
  );

  const allToxicityFlags = entries.flatMap((e) =>
    e.toxicityFlags.map((f) => f.flagType),
  );
  const uniqueFlags = [...new Set(allToxicityFlags)];

  const allStrategies = entries.flatMap((e) => e.strategies);

  return (
    <div
      className="print-only"
      style={{
        display: "none",
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        color: "#111",
        background: "#fff",
        fontSize: "11pt",
        lineHeight: 1.5,
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          borderBottom: "2px solid #111",
          paddingBottom: "12px",
          marginBottom: "20px",
        }}
      >
        <h1
          style={{
            fontSize: "18pt",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          OLYA v4.0 — Strategic Dialogue Intelligence Analysis Report
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "9pt", color: "#555" }}>
          Generated: {now}
          {sessionId ? ` | Session ID: ${sessionId}` : ""}
        </p>
      </div>

      {/* ── SESSION SUMMARY ── */}
      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "13pt",
            fontWeight: 700,
            borderBottom: "1px solid #ccc",
            paddingBottom: "4px",
            marginBottom: "10px",
          }}
        >
          1. Session Summary
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "10pt",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: "4px 8px",
                  fontWeight: 600,
                  width: "35%",
                  background: "#f4f4f4",
                  border: "1px solid #ddd",
                }}
              >
                Health Score
              </td>
              <td style={{ padding: "4px 8px", border: "1px solid #ddd" }}>
                {healthScore}/100
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "4px 8px",
                  fontWeight: 600,
                  background: "#f4f4f4",
                  border: "1px solid #ddd",
                }}
              >
                Total Exchanges
              </td>
              <td style={{ padding: "4px 8px", border: "1px solid #ddd" }}>
                {totalExchanges}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "4px 8px",
                  fontWeight: 600,
                  background: "#f4f4f4",
                  border: "1px solid #ddd",
                }}
              >
                Dominant Emotion
              </td>
              <td style={{ padding: "4px 8px", border: "1px solid #ddd" }}>
                {dominantEmotion}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "4px 8px",
                  fontWeight: 600,
                  background: "#f4f4f4",
                  border: "1px solid #ddd",
                }}
              >
                Bias / Toxicity Incidents
              </td>
              <td style={{ padding: "4px 8px", border: "1px solid #ddd" }}>
                {biasIncidents}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── TRANSCRIPT LOG ── */}
      <section style={{ marginBottom: "24px", breakBefore: "page" as const }}>
        <h2
          style={{
            fontSize: "13pt",
            fontWeight: 700,
            borderBottom: "1px solid #ccc",
            paddingBottom: "4px",
            marginBottom: "10px",
          }}
        >
          2. Transcript Log
        </h2>
        {entries.length === 0 ? (
          <p style={{ color: "#666", fontSize: "9pt" }}>No entries recorded.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "9pt",
            }}
          >
            <thead>
              <tr style={{ background: "#e8e8e8" }}>
                <th
                  style={{
                    padding: "4px 6px",
                    border: "1px solid #ccc",
                    textAlign: "left",
                    fontWeight: 700,
                    width: "8%",
                  }}
                >
                  Time
                </th>
                <th
                  style={{
                    padding: "4px 6px",
                    border: "1px solid #ccc",
                    textAlign: "left",
                    fontWeight: 700,
                    width: "10%",
                  }}
                >
                  Speaker
                </th>
                <th
                  style={{
                    padding: "4px 6px",
                    border: "1px solid #ccc",
                    textAlign: "left",
                    fontWeight: 700,
                    width: "44%",
                  }}
                >
                  Transcript
                </th>
                <th
                  style={{
                    padding: "4px 6px",
                    border: "1px solid #ccc",
                    textAlign: "left",
                    fontWeight: 700,
                    width: "19%",
                  }}
                >
                  Top Emotion
                </th>
                <th
                  style={{
                    padding: "4px 6px",
                    border: "1px solid #ccc",
                    textAlign: "left",
                    fontWeight: 700,
                    width: "19%",
                  }}
                >
                  Top Intent
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, rowIdx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: transcript entries are positionally stable in a print view
                <tr
                  key={entry.timestamp}
                  style={{ background: rowIdx % 2 === 0 ? "#fff" : "#fafafa" }}
                >
                  <td
                    style={{
                      padding: "3px 6px",
                      border: "1px solid #ddd",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtTs(entry.timestamp)}
                  </td>
                  <td
                    style={{
                      padding: "3px 6px",
                      border: "1px solid #ddd",
                      fontWeight: 600,
                    }}
                  >
                    {entry.speaker}
                  </td>
                  <td style={{ padding: "3px 6px", border: "1px solid #ddd" }}>
                    {entry.text}
                  </td>
                  <td style={{ padding: "3px 6px", border: "1px solid #ddd" }}>
                    {entry.emotions[0]
                      ? `${entry.emotions[0].emotionType} (${fmt(entry.emotions[0].confidence)})`
                      : "—"}
                  </td>
                  <td style={{ padding: "3px 6px", border: "1px solid #ddd" }}>
                    {entry.intents[0]
                      ? `${entry.intents[0].intentType} (${fmt(entry.intents[0].confidence)})`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── EMOTION & INTENT ANALYSIS ── */}
      {latestEntry && (
        <section style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "13pt",
              fontWeight: 700,
              borderBottom: "1px solid #ccc",
              paddingBottom: "4px",
              marginBottom: "10px",
            }}
          >
            3. Emotion &amp; Intent Analysis (Latest Entry)
          </h2>
          <div style={{ display: "flex", gap: "32px" }}>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: "10pt",
                  marginBottom: "6px",
                }}
              >
                Emotions
              </h3>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "9pt" }}>
                {latestEntry.emotions.map((e) => (
                  <li key={e.emotionType}>
                    {e.emotionType}: {fmt(e.confidence)}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: "10pt",
                  marginBottom: "6px",
                }}
              >
                Intents
              </h3>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "9pt" }}>
                {latestEntry.intents.map((intent) => (
                  <li key={intent.intentType}>
                    {intent.intentType}: {fmt(intent.confidence)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ── BELIEF STATE ── */}
      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "13pt",
            fontWeight: 700,
            borderBottom: "1px solid #ccc",
            paddingBottom: "4px",
            marginBottom: "10px",
          }}
        >
          4. Belief State
        </h2>
        <table
          style={{ width: "60%", borderCollapse: "collapse", fontSize: "10pt" }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: "4px 8px",
                  fontWeight: 600,
                  background: "#f4f4f4",
                  border: "1px solid #ddd",
                  width: "55%",
                }}
              >
                Trust Level
              </td>
              <td style={{ padding: "4px 8px", border: "1px solid #ddd" }}>
                {beliefState.trustLevel}/100
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "4px 8px",
                  fontWeight: 600,
                  background: "#f4f4f4",
                  border: "1px solid #ddd",
                }}
              >
                Persuasion Score
              </td>
              <td style={{ padding: "4px 8px", border: "1px solid #ddd" }}>
                {beliefState.persuasionScore}/100
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "4px 8px",
                  fontWeight: 600,
                  background: "#f4f4f4",
                  border: "1px solid #ddd",
                }}
              >
                Active Concerns
              </td>
              <td style={{ padding: "4px 8px", border: "1px solid #ddd" }}>
                {beliefState.concerns.length > 0
                  ? beliefState.concerns.join(", ")
                  : "None"}
              </td>
            </tr>
          </tbody>
        </table>

        <h3
          style={{
            fontWeight: 700,
            fontSize: "10pt",
            marginTop: "12px",
            marginBottom: "6px",
          }}
        >
          Speaker State Summary
        </h3>
        <table
          style={{ width: "80%", borderCollapse: "collapse", fontSize: "9pt" }}
        >
          <thead>
            <tr style={{ background: "#e8e8e8" }}>
              <th
                style={{
                  padding: "4px 8px",
                  border: "1px solid #ccc",
                  textAlign: "left",
                }}
              >
                Speaker
              </th>
              <th
                style={{
                  padding: "4px 8px",
                  border: "1px solid #ccc",
                  textAlign: "left",
                }}
              >
                Entry Count
              </th>
              <th
                style={{
                  padding: "4px 8px",
                  border: "1px solid #ccc",
                  textAlign: "left",
                }}
              >
                Dominant Emotion
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(beliefState.speakerStates).map(([role, state]) => (
              <tr key={role}>
                <td
                  style={{
                    padding: "3px 8px",
                    border: "1px solid #ddd",
                    fontWeight: 600,
                  }}
                >
                  {role}
                </td>
                <td style={{ padding: "3px 8px", border: "1px solid #ddd" }}>
                  {state.entryCount}
                </td>
                <td style={{ padding: "3px 8px", border: "1px solid #ddd" }}>
                  {state.dominantEmotion}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── SAFETY & QUALITY ── */}
      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "13pt",
            fontWeight: 700,
            borderBottom: "1px solid #ccc",
            paddingBottom: "4px",
            marginBottom: "10px",
          }}
        >
          5. Safety &amp; Quality
        </h2>
        {uniqueFlags.length === 0 ? (
          <p style={{ fontSize: "10pt", color: "#333" }}>
            ✓ No toxicity or bias flags detected across all exchanges.
          </p>
        ) : (
          <>
            <p style={{ fontSize: "10pt", marginBottom: "6px" }}>
              <strong>{biasIncidents}</strong> toxicity incident(s) detected.
              Flagged categories:
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "16px",
                fontSize: "9pt",
                color: "#c00",
              }}
            >
              {uniqueFlags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ── STRATEGY RECOMMENDATIONS ── */}
      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "13pt",
            fontWeight: 700,
            borderBottom: "1px solid #ccc",
            paddingBottom: "4px",
            marginBottom: "10px",
          }}
        >
          6. Strategy Recommendations
        </h2>
        {allStrategies.length === 0 ? (
          <p style={{ fontSize: "10pt", color: "#555" }}>
            No strategy recommendations generated for this session.
          </p>
        ) : (
          <ol style={{ paddingLeft: "18px", fontSize: "9pt" }}>
            {allStrategies.map((s, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: strategies are positionally stable in a print report
              <li key={`${s.strategy}-${idx}`} style={{ marginBottom: "6px" }}>
                <strong>{s.strategy}</strong>
                {s.rationale ? ` — ${s.rationale}` : ""}
                <span style={{ color: "#555" }}>
                  {" "}
                  (confidence: {fmt(s.confidence)})
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ── FOOTER ── */}
      <div
        style={{
          borderTop: "1px solid #ccc",
          paddingTop: "8px",
          fontSize: "8pt",
          color: "#888",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          OLYA v4.0 — AI-Driven Strategic Dialogue Intelligence System
        </span>
        <span>Generated {now}</span>
      </div>
    </div>
  );
}
