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
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  const LINE_H = 6;
  const SECTION_GAP = 8;

  function checkPage(needed = LINE_H) {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function heading1(text: string) {
    checkPage(12);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 8;
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 4;
  }

  function heading2(text: string) {
    checkPage(10);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 7;
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, margin + contentW, y);
    doc.setDrawColor(0, 0, 0);
    y += 4;
  }

  function row(label: string, value: string) {
    checkPage(LINE_H);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 60, y);
    y += LINE_H;
  }

  function bodyText(text: string) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentW);
    for (const line of lines) {
      checkPage();
      doc.text(line, margin, y);
      y += LINE_H;
    }
  }

  const now = new Date().toLocaleString();

  // ── Title ──
  heading1("OLYA v4.0 — Strategic Dialogue Intelligence Analysis Report");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated: ${now}${sessionId ? `  |  Session ID: ${sessionId}` : ""}`,
    margin,
    y,
  );
  doc.setTextColor(0, 0, 0);
  y += SECTION_GAP;

  // ── 1. Session Summary ──
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

  heading2("1. Session Summary");
  row("Health Score", `${healthScore}/100`);
  row("Total Exchanges", `${entries.length}`);
  row("Dominant Emotion", dominantEmotion);
  row("Bias / Toxicity Incidents", `${biasIncidents}`);
  y += SECTION_GAP;

  // ── 2. Transcript Log ──
  heading2("2. Transcript Log");
  if (entries.length === 0) {
    bodyText("No entries recorded.");
  } else {
    for (const entry of entries) {
      checkPage(LINE_H * 2);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`[${fmtTs(entry.timestamp)}] ${entry.speaker}`, margin, y);
      y += LINE_H - 1;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(entry.text, contentW - 4);
      for (const line of lines) {
        checkPage();
        doc.text(line, margin + 4, y);
        y += LINE_H - 1;
      }
      if (entry.emotions[0]) {
        doc.setTextColor(80, 80, 120);
        doc.text(
          `Emotion: ${entry.emotions[0].emotionType} (${fmt(entry.emotions[0].confidence)})  Intent: ${entry.intents[0]?.intentType ?? "—"} (${entry.intents[0] ? fmt(entry.intents[0].confidence) : "—"})`,
          margin + 4,
          y,
        );
        doc.setTextColor(0, 0, 0);
        y += LINE_H;
      }
      y += 2;
    }
  }
  y += SECTION_GAP;

  // ── 3. Emotion & Intent (latest) ──
  if (latestEntry) {
    heading2("3. Emotion & Intent Analysis (Latest Entry)");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Emotions:", margin, y);
    y += LINE_H;
    doc.setFont("helvetica", "normal");
    for (const e of latestEntry.emotions) {
      checkPage();
      doc.text(`  ${e.emotionType}: ${fmt(e.confidence)}`, margin, y);
      y += LINE_H;
    }
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.text("Intents:", margin, y);
    y += LINE_H;
    doc.setFont("helvetica", "normal");
    for (const intent of latestEntry.intents) {
      checkPage();
      doc.text(`  ${intent.intentType}: ${fmt(intent.confidence)}`, margin, y);
      y += LINE_H;
    }
    y += SECTION_GAP;
  }

  // ── 4. Belief State ──
  heading2("4. Belief State");
  row("Trust Level", `${beliefState.trustLevel}/100`);
  row("Persuasion Score", `${beliefState.persuasionScore}/100`);
  row(
    "Active Concerns",
    beliefState.concerns.length > 0 ? beliefState.concerns.join(", ") : "None",
  );
  y += 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Speaker State Summary:", margin, y);
  y += LINE_H;
  doc.setFont("helvetica", "normal");
  for (const [role, state] of Object.entries(beliefState.speakerStates)) {
    checkPage();
    doc.text(
      `  ${role}: ${state.entryCount} entries, dominant emotion: ${state.dominantEmotion}`,
      margin,
      y,
    );
    y += LINE_H;
  }
  y += SECTION_GAP;

  // ── 5. Safety & Quality ──
  heading2("5. Safety & Quality");
  const allToxicityFlags = entries.flatMap((e) =>
    e.toxicityFlags.map((f) => f.flagType),
  );
  const uniqueFlags = [...new Set(allToxicityFlags)];
  if (uniqueFlags.length === 0) {
    bodyText("\u2713 No toxicity or bias flags detected across all exchanges.");
  } else {
    bodyText(
      `${biasIncidents} toxicity incident(s) detected. Flagged categories:`,
    );
    for (const flag of uniqueFlags) {
      checkPage();
      doc.setTextColor(180, 0, 0);
      doc.text(`  \u2022 ${flag}`, margin, y);
      doc.setTextColor(0, 0, 0);
      y += LINE_H;
    }
  }
  y += SECTION_GAP;

  // ── 6. Strategy Recommendations ──
  heading2("6. Strategy Recommendations");
  const allStrategies = entries.flatMap((e) => e.strategies);
  if (allStrategies.length === 0) {
    bodyText("No strategy recommendations generated for this session.");
  } else {
    let idx = 1;
    for (const s of allStrategies) {
      checkPage(LINE_H * 2);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${idx}. ${s.strategy}`, margin, y);
      y += LINE_H;
      doc.setFont("helvetica", "normal");
      if (s.rationale) {
        const lines = doc.splitTextToSize(`   ${s.rationale}`, contentW - 8);
        for (const line of lines) {
          checkPage();
          doc.text(line, margin, y);
          y += LINE_H;
        }
      }
      doc.setTextColor(100, 100, 100);
      doc.text(`   Confidence: ${fmt(s.confidence)}`, margin, y);
      doc.setTextColor(0, 0, 0);
      y += LINE_H + 2;
      idx++;
    }
  }

  // ── Footer ──
  const totalPages = (doc.internal as { pages: unknown[] }).pages.length - 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `OLYA v4.0 — AI-Driven Strategic Dialogue Intelligence System  |  Page ${p} of ${totalPages}`,
      margin,
      doc.internal.pageSize.getHeight() - 8,
    );
    doc.setTextColor(0, 0, 0);
  }

  const filename = `olya-analysis-${sessionId ? sessionId.slice(-8) : "report"}-${Date.now()}.pdf`;
  doc.save(filename);
}
