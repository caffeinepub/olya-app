import React, { useEffect, useRef } from 'react';
import { Network } from 'lucide-react';
import type { TranscriptEntry, BeliefStateData } from '@/hooks/useDashboardState';
import { SPEAKER_COLORS, type SpeakerRole } from '@/components/TranscriptInput';

interface BeliefStatePanelProps {
  beliefState: BeliefStateData;
  entries: TranscriptEntry[];
}

// Speaker node colors (canvas-safe literal values)
const SPEAKER_NODE_COLORS: Record<SpeakerRole, string> = {
  Operator: '#60a5fa',   // blue-400
  Subject: '#fbbf24',    // amber-400
  Witness: '#34d399',    // emerald-400
  Unknown: '#94a3b8',    // slate-400
};

export default function BeliefStatePanel({
  beliefState,
  entries,
}: BeliefStatePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(15, 20, 30, 0.6)';
    ctx.fillRect(0, 0, W, H);

    // ── Nodes ──────────────────────────────────────────────────────────────────
    // Central "Belief" node
    const cx = W / 2;
    const cy = H / 2;

    // Draw trust ring
    const trustRadius = 30 + beliefState.trustLevel * 40;
    ctx.beginPath();
    ctx.arc(cx, cy, trustRadius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(96, 165, 250, ${0.15 + beliefState.trustLevel * 0.3})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Central node
    ctx.beginPath();
    ctx.arc(cx, cy, trustRadius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, trustRadius);
    grad.addColorStop(0, `rgba(96, 165, 250, ${0.4 + beliefState.trustLevel * 0.4})`);
    grad.addColorStop(1, 'rgba(96, 165, 250, 0.05)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BELIEF', cx, cy - 6);
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Trust ${Math.round(beliefState.trustLevel * 100)}%`, cx, cy + 7);

    // ── Speaker nodes ──────────────────────────────────────────────────────────
    // Collect unique speakers from entries
    const speakerMap = new Map<SpeakerRole, number>();
    for (const entry of entries) {
      const sp = entry.speaker as SpeakerRole;
      speakerMap.set(sp, (speakerMap.get(sp) ?? 0) + 1);
    }

    const speakers = Array.from(speakerMap.entries());
    const angleStep = speakers.length > 0 ? (Math.PI * 2) / speakers.length : 0;
    const orbitRadius = Math.min(W, H) * 0.32;

    speakers.forEach(([role, count], idx) => {
      const angle = -Math.PI / 2 + idx * angleStep;
      const nx = cx + Math.cos(angle) * orbitRadius;
      const ny = cy + Math.sin(angle) * orbitRadius;
      const nodeColor = SPEAKER_NODE_COLORS[role] ?? '#94a3b8';
      const nodeRadius = 18 + Math.min(count * 2, 12);

      // Connection line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = `${nodeColor}55`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Node circle
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nodeRadius);
      ng.addColorStop(0, `${nodeColor}99`);
      ng.addColorStop(1, `${nodeColor}22`);
      ctx.fillStyle = ng;
      ctx.fill();
      ctx.strokeStyle = `${nodeColor}88`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(role.toUpperCase(), nx, ny - 4);
      ctx.font = '8px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${count} entr${count === 1 ? 'y' : 'ies'}`, nx, ny + 6);
    });

    // ── Persuasion arc ─────────────────────────────────────────────────────────
    const arcRadius = Math.min(W, H) * 0.44;
    const arcEnd = -Math.PI / 2 + beliefState.persuasionLevel * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, arcRadius, -Math.PI / 2, arcEnd);
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.3 + beliefState.persuasionLevel * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Persuasion label
    ctx.fillStyle = '#fbbf24';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      `Persuasion ${Math.round(beliefState.persuasionLevel * 100)}%`,
      cx,
      H - 18
    );

    // ── Concerns ───────────────────────────────────────────────────────────────
    if (beliefState.concerns.length > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 1;
      const boxH = 14 * beliefState.concerns.length + 8;
      ctx.beginPath();
      ctx.roundRect(8, 8, W - 16, boxH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      beliefState.concerns.forEach((concern, i) => {
        ctx.fillText(`⚠ ${concern}`, 14, 12 + i * 14);
      });
    }
  }, [beliefState, entries]);

  return (
    <div className="flex flex-col h-full">
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
          <Network className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground/60">
            Belief graph will appear here.
          </p>
          <p className="text-xs text-muted-foreground/40 mt-1">
            Add transcript entries to visualize belief state.
          </p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={320}
          height={280}
          className="w-full h-full rounded-lg"
          style={{ imageRendering: 'crisp-edges' }}
        />
      )}
    </div>
  );
}
