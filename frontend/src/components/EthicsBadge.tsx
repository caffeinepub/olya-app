import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { EthicsResult, BiasCategory } from '../utils/ethicsSimulator';
import type { ViolationType } from '../utils/ethicalConstraints';
import { formatViolationType } from '../utils/ethicalConstraints';

interface EthicsBadgeProps {
  result: EthicsResult;
  compact?: boolean;
  biasCategories?: BiasCategory[];
  violationType?: ViolationType;
}

const BIAS_CATEGORY_LABELS: Record<string, string> = {
  gender: 'Gender Bias',
  racial: 'Racial Bias',
  socioeconomic: 'Socioeconomic Bias',
  confirmation: 'Confirmation Bias',
};

export default function EthicsBadge({
  result,
  compact = false,
  biasCategories,
  violationType,
}: EthicsBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  // Merge bias categories from result and prop
  const allBiasCategories = biasCategories ?? result.biasCategories ?? [];

  const config = (() => {
    if (violationType) {
      return {
        icon: <ShieldX size={12} />,
        label: formatViolationType(violationType),
        className: 'bg-red-950/60 text-red-300 border-red-700/60',
      };
    }
    switch (result.status) {
      case 'Clean':
        return {
          icon: <ShieldCheck size={12} />,
          label: 'Safe',
          className: 'bg-green-950/50 text-green-400 border-green-800/50',
        };
      case 'Bias':
      case 'Potential Bias': {
        const uniqueCategories = [...new Set(allBiasCategories.map((b) => b.category))];
        const label =
          uniqueCategories.length > 0
            ? uniqueCategories.length === 1
              ? BIAS_CATEGORY_LABELS[uniqueCategories[0]] ?? 'Bias'
              : `${uniqueCategories.length} Bias Types`
            : 'Bias';
        return {
          icon: <ShieldAlert size={12} />,
          label,
          className: 'bg-amber-950/50 text-amber border-amber/30',
        };
      }
      case 'Toxic Language Detected':
        return {
          icon: <ShieldX size={12} />,
          label: 'Toxic',
          className: 'bg-red-950/50 text-red-400 border-red-800/50',
        };
      default:
        return {
          icon: <ShieldAlert size={12} />,
          label: result.status,
          className: 'bg-amber-950/50 text-amber border-amber/30',
        };
    }
  })();

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono font-medium',
          config.className
        )}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  const hasDetails =
    result.flags.length > 0 || allBiasCategories.length > 0 || !!violationType;

  // Determine the display label for the status text
  const statusLabel = violationType
    ? formatViolationType(violationType)
    : result.status;

  return (
    <div className={cn('rounded border text-xs font-mono', config.className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-2 py-1 w-full text-left"
      >
        {config.icon}
        <span className="font-semibold">{statusLabel}</span>
        {result.severity !== 'Low' && !violationType && (
          <span className="ml-1 opacity-70">[{result.severity}]</span>
        )}
        {hasDetails && (
          expanded ? (
            <ChevronUp size={10} className="ml-auto" />
          ) : (
            <ChevronDown size={10} className="ml-auto" />
          )
        )}
      </button>

      {expanded && hasDetails && (
        <div className="px-2 pb-1.5 text-[10px] opacity-80 border-t border-current/20 pt-1 space-y-1">
          {result.explanation && <p>{result.explanation}</p>}

          {allBiasCategories.length > 0 && (
            <div className="mt-1">
              <p className="font-semibold mb-0.5">Bias Categories:</p>
              {allBiasCategories.map((bc, i) => (
                <div key={i} className="flex items-center gap-1 ml-1">
                  <AlertTriangle size={8} />
                  <span>
                    {BIAS_CATEGORY_LABELS[bc.category] ?? bc.category} [{bc.severity}]
                    {bc.fragment && (
                      <span className="opacity-60"> — "{bc.fragment}"</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {violationType && (
            <div className="mt-1">
              <p className="font-semibold">Violation Type:</p>
              <p className="ml-1">{formatViolationType(violationType)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
