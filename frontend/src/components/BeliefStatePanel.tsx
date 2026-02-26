import React, { useRef, useEffect } from 'react';
import type { TranscriptEntry, BeliefState } from '../hooks/useDashboardState';

interface BeliefStatePanelProps {
  beliefState: BeliefState;
  entries: TranscriptEntry[];
}

const SPEAKER_CANVAS_COLORS: Record<string, string> = {
  Operator: '#0d9488',   // teal-600
  Subject: '#6366f1',   // indigo-500
  Witness: '#f59e0b',   // amber-500
  Unknown: '#94a3b8',   // slate-400
};

export default function BeliefStatePanel({ beliefState, entries }: BeliefStatePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Trust circle
    const trustRadius = 30 + (beliefState.trustLevel / 100) * 40;
    const trustGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, trustRadius);
    trustGrad.addColorStop(0, '#0d9488');
    trustGrad.addColorStop(1, '#0d948800');
    ctx.beginPath();
    ctx.arc(cx, cy, trustRadius, 0, Math.PI * 2);
    ctx.fillStyle = trustGrad;
    ctx.fill();

    // Central node
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#0d9488';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TRUST', cx, cy);

    // Trust level text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText(`${beliefState.trustLevel}%`, cx, cy + 28);

    // Speaker orbit nodes
    const speakers = Object.entries(beliefState.speakerStates) as [string, { entryCount: number; dominantEmotion: string }][];
    const activeSpeakers = speakers.filter(([, s]) => s.entryCount > 0);

    activeSpeakers.forEach(([speaker, state], idx) => {
      const angle = (idx / Math.max(activeSpeakers.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const orbitR = 80;
      const nx = cx + Math.cos(angle) * orbitR;
      const ny = cy + Math.sin(angle) * orbitR;

      // Orbit line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node
      const nodeColor = SPEAKER_CANVAS_COLORS[speaker] ?? '#94a3b8';
      ctx.beginPath();
      ctx.arc(nx, ny, 14, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();

      // Speaker label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(speaker.slice(0, 3).toUpperCase(), nx, ny - 3);
      ctx.font = '7px sans-serif';
      ctx.fillText(`${state.entryCount}`, nx, ny + 5);
    });

    // Persuasion arc
    if (beliefState.persuasionScore > 0) {
      const arcAngle = (beliefState.persuasionScore / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 95, -Math.PI / 2, -Math.PI / 2 + arcAngle);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Concerns overlay
    if (beliefState.concerns.length > 0) {
      ctx.fillStyle = '#ef444440';
      ctx.beginPath();
      ctx.arc(cx, cy, 110, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [beliefState, entries]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={260}
        height={220}
        className="rounded-lg"
      />
      <div className="grid grid-cols-2 gap-2 w-full text-xs">
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-muted-foreground">Trust Level</p>
          <p className="font-bold text-lg">{beliefState.trustLevel}%</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-muted-foreground">Persuasion</p>
          <p className="font-bold text-lg">{beliefState.persuasionScore}%</p>
        </div>
      </div>
    </div>
  );
}
