import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SafetyQualityPanelProps {
  biasCount: number;
  hallucinationFlagRate: number;
  ethicalViolationCount: number;
  trustworthinessScore: number;
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit?: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-2.5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className={cn('shrink-0', colorClass)}>{icon}</span>
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-xl font-mono font-bold', colorClass)}>{value}</span>
        {unit && (
          <span className="text-[10px] font-mono text-muted-foreground/50">{unit}</span>
        )}
      </div>
    </div>
  );
}

function TrustworthinessGauge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'oklch(0.65 0.18 145)'
      : score >= 50
      ? 'oklch(0.75 0.18 55)'
      : 'oklch(0.62 0.22 25)';

  const textColor =
    score >= 80 ? 'text-green-400' : score >= 50 ? 'text-amber' : 'text-red-400';

  const label =
    score >= 80 ? 'Trustworthy' : score >= 50 ? 'Caution' : 'Low Trust';

  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Shield size={12} className={textColor} />
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Trustworthiness Score
        </span>
      </div>
      <div className="flex items-center gap-3">
        {/* Circular gauge */}
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="oklch(0.28 0.04 220)"
              strokeWidth="4"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeDasharray={`${(score / 100) * 125.66} 125.66`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold" style={{ color }}>
              {score}
            </span>
          </div>
        </div>
        <div>
          <p className={cn('text-sm font-mono font-bold', textColor)}>{label}</p>
          <p className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">
            Score out of 100
          </p>
          <div className="mt-1.5 w-24">
            <Progress value={score} className="h-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SafetyQualityPanel({
  biasCount,
  hallucinationFlagRate,
  ethicalViolationCount,
  trustworthinessScore,
}: SafetyQualityPanelProps) {
  const biasColor =
    biasCount === 0 ? 'text-green-400' : biasCount <= 3 ? 'text-amber' : 'text-red-400';
  const hallucinationColor =
    hallucinationFlagRate === 0
      ? 'text-green-400'
      : hallucinationFlagRate <= 20
      ? 'text-amber'
      : 'text-red-400';
  const violationColor =
    ethicalViolationCount === 0
      ? 'text-green-400'
      : ethicalViolationCount <= 3
      ? 'text-amber'
      : 'text-red-400';

  return (
    <div className="flex flex-col gap-2 p-3 h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          icon={<AlertTriangle size={11} />}
          label="Bias Incidents"
          value={biasCount}
          colorClass={biasColor}
        />
        <MetricCard
          icon={<AlertCircle size={11} />}
          label="Hallucination Rate"
          value={Math.round(hallucinationFlagRate)}
          unit="%"
          colorClass={hallucinationColor}
        />
        <MetricCard
          icon={<ShieldAlert size={11} />}
          label="Ethical Violations"
          value={ethicalViolationCount}
          colorClass={violationColor}
        />
        <TrustworthinessGauge score={trustworthinessScore} />
      </div>
    </div>
  );
}
