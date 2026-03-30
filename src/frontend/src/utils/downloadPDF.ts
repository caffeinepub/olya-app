import type { BeliefState, TranscriptEntry } from "../hooks/useDashboardState";

function fmt(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtTs(ts: number) {
  return new Date(ts).toLocaleTimeString();
}

export async function downloadAnalysisAsPDF(
  sessionId: string | null,
  entries: TranscriptEntry[],
  beliefState: BeliefState,
  latestEntry: TranscriptEntry | null,
): Promise<void> {
  const now = new Date().toLocaleString();

  const biasIncidents = entries.reduce(
    (acc, e) => acc + e.toxicityFlags.length,
    0,
  );
  const healthScore = Math.round(
    beliefState.trustLevel * 0.7 +
      (biasIncidents === 0 ? 30 : Math.max(0, 30 - biasIncidents * 5)),
  );
  const dominantEmotion =
    latestEntry?.emotions[0]?.emotionType ??
    entries[entries.length - 1]?.emotions[0]?.emotionType ??
    "—";

  const entriesHTML =
    entries.length === 0
      ? "<p>No entries recorded.</p>"
      : entries
          .map(
            (entry) => `
      <div class="entry">
        <div class="entry-header">[${fmtTs(entry.timestamp)}] <strong>${entry.speaker}</strong></div>
        <div class="entry-text">${entry.text}</div>
        ${entry.emotions[0] ? `<div class="entry-meta">Emotion: ${entry.emotions[0].emotionType} (${fmt(entry.emotions[0].confidence)}) &nbsp;|&nbsp; Intent: ${entry.intents[0]?.intentType ?? "—"} (${entry.intents[0] ? fmt(entry.intents[0].confidence) : "—"})</div>` : ""}
      </div>
    `,
          )
          .join("");

  const speakerStatesHTML = Object.entries(beliefState.speakerStates)
    .map(
      ([role, state]) =>
        `<tr><td>${role}</td><td>${state.entryCount}</td><td>${state.dominantEmotion}</td></tr>`,
    )
    .join("");

  const allToxicityFlags = entries.flatMap((e) =>
    e.toxicityFlags.map((f) => f.flagType),
  );
  const uniqueFlags = [...new Set(allToxicityFlags)];
  const safetyHTML =
    uniqueFlags.length === 0
      ? "<p class='ok'>✓ No toxicity or bias flags detected.</p>"
      : `<p>${biasIncidents} incident(s) detected:</p><ul>${uniqueFlags.map((f) => `<li>${f}</li>`).join("")}</ul>`;

  const allStrategies = entries.flatMap((e) => e.strategies);
  const strategiesHTML =
    allStrategies.length === 0
      ? "<p>No strategy recommendations generated.</p>"
      : `<ol>${allStrategies.map((s) => `<li><strong>${s.strategy}</strong>${s.rationale ? `<br/><em>${s.rationale}</em>` : ""}<br/>Confidence: ${fmt(s.confidence)}</li>`).join("")}</ol>`;

  const latestEmotionHTML = latestEntry
    ? `<h2>3. Emotion &amp; Intent Analysis (Latest Entry)</h2>
      <h3>Emotions</h3><ul>${latestEntry.emotions.map((e) => `<li>${e.emotionType}: ${fmt(e.confidence)}</li>`).join("")}</ul>
      <h3>Intents</h3><ul>${latestEntry.intents.map((i) => `<li>${i.intentType}: ${fmt(i.confidence)}</li>`).join("")}</ul>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Olya v4.0 Analysis Report</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 24px; font-size: 11px; }
    h1 { font-size: 18px; border-bottom: 2px solid #0d9488; padding-bottom: 8px; margin-bottom: 4px; }
    h2 { font-size: 13px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 20px; color: #0d9488; }
    h3 { font-size: 11px; margin: 8px 0 4px; }
    .meta { color: #666; font-size: 9px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    td, th { padding: 4px 8px; border: 1px solid #ddd; text-align: left; }
    th { background: #f0fdfa; }
    .entry { margin: 8px 0; padding: 8px; border-left: 3px solid #0d9488; background: #f9fafb; }
    .entry-header { font-weight: bold; color: #0d9488; margin-bottom: 3px; }
    .entry-text { margin-bottom: 3px; }
    .entry-meta { color: #666; font-size: 9px; }
    .ok { color: #059669; }
    ul, ol { padding-left: 20px; margin: 4px 0; }
    li { margin: 3px 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>OLYA v4.0 — Strategic Dialogue Intelligence Analysis Report</h1>
  <div class="meta">Generated: ${now}${sessionId ? ` &nbsp;|&nbsp; Session: ${sessionId}` : ""}</div>

  <h2>1. Session Summary</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Health Score</td><td>${healthScore}/100</td></tr>
    <tr><td>Total Exchanges</td><td>${entries.length}</td></tr>
    <tr><td>Dominant Emotion</td><td>${dominantEmotion}</td></tr>
    <tr><td>Bias / Toxicity Incidents</td><td>${biasIncidents}</td></tr>
    <tr><td>Trust Level</td><td>${beliefState.trustLevel}/100</td></tr>
    <tr><td>Persuasion Score</td><td>${beliefState.persuasionScore}/100</td></tr>
  </table>

  <h2>2. Transcript Log</h2>
  ${entriesHTML}

  ${latestEmotionHTML}

  <h2>4. Belief State</h2>
  <table>
    <tr><th>Speaker</th><th>Entries</th><th>Dominant Emotion</th></tr>
    ${speakerStatesHTML}
  </table>
  <p>Active Concerns: ${beliefState.concerns.length > 0 ? beliefState.concerns.join(", ") : "None"}</p>

  <h2>5. Safety &amp; Quality</h2>
  ${safetyHTML}

  <h2>6. Strategy Recommendations</h2>
  ${strategiesHTML}

  <div style="margin-top:24px; padding-top:8px; border-top:1px solid #ccc; color:#999; font-size:8px;">
    OLYA v4.0 — AI-Driven Strategic Dialogue Intelligence System
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => {
      setTimeout(() => {
        win.print();
        URL.revokeObjectURL(url);
      }, 500);
    });
  } else {
    // Fallback: direct download as HTML file
    const a = document.createElement("a");
    a.href = url;
    const filename = `olya-analysis-${sessionId ? sessionId.slice(-8) : "report"}-${Date.now()}.html`;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
