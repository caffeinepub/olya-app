import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import type { TranscriptEntry } from '../hooks/useDashboardState';

interface SafetyQualityPanelProps {
  entries: TranscriptEntry[];
}

function computeMetrics(entries: TranscriptEntry[]) {
  if (entries.length === 0) {
    return {
      biasIncidents: 0,
      hallucinationRate: 0,
      ethicalViolations: 0,
      trustworthinessScore: 100,
    };
  }

  const biasIncidents = entries.filter((e) =>
    e.toxicityFlags.some((f) => f.flagType.includes('bias'))
  ).length;

  const ethicalViolations = entries.filter((e) => e.toxicityFlags.length > 0).length;

  const hallucinationRate = Math.round((ethicalViolations / entries.length) * 100);

  // Trustworthiness: start at 100, penalize for violations
  const biaspenalty = biasIncidents * 5;
  const violationPenalty = ethicalViolations * 8;
  const trustworthinessScore = Math.max(0, 100 - biaspenalty - violationPenalty);

  return { biasIncidents, hallucinationRate, ethicalViolations, trustworthinessScore };
}

export default function SafetyQualityPanel({ entries }: SafetyQualityPanelProps) {
  const { biasIncidents, hallucinationRate, ethicalViolations, trustworthinessScore } = computeMetrics(entries);

  const trustColor =
    trustworthinessScore >= 80 ? 'text-green-500' :
    trustworthinessScore >= 50 ? 'text-yellow-500' :
    'text-red-500';

  const biasColor =
    biasIncidents === 0 ? 'text-green-500' :
    biasIncidents <= 3 ? 'text-yellow-500' :
    'text-red-500';

  return (
    <div className="space-y-4">
      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bias Incidents */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Bias Incidents</p>
          </div>
          <p className={`text-2xl font-bold ${biasColor}`}>{biasIncidents}</p>
        </div>

        {/* Hallucination Flag Rate */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Flag Rate</p>
          </div>
          <p className={`text-2xl font-bold ${hallucinationRate > 20 ? 'text-red-500' : hallucinationRate > 10 ? 'text-yellow-500' : 'text-green-500'}`}>
            {hallucinationRate}%
          </p>
        </div>

        {/* Ethical Violations */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Violations</p>
          </div>
          <p className={`text-2xl font-bold ${ethicalViolations === 0 ? 'text-green-500' : ethicalViolations <= 2 ? 'text-yellow-500' : 'text-red-500'}`}>
            {ethicalViolations}
          </p>
        </div>

        {/* Trustworthiness Score */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Trust Score</p>
          </div>
          <p className={`text-2xl font-bold ${trustColor}`}>{trustworthinessScore}</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={biasIncidents === 0 ? 'default' : 'destructive'}
          className="text-xs"
        >
          {biasIncidents === 0 ? 'Bias-Free' : `${biasIncidents} Bias Alert${biasIncidents > 1 ? 's' : ''}`}
        </Badge>
        <Badge
          variant={ethicalViolations === 0 ? 'default' : 'destructive'}
          className="text-xs"
        >
          {ethicalViolations === 0 ? 'Ethics OK' : `${ethicalViolations} Violation${ethicalViolations > 1 ? 's' : ''}`}
        </Badge>
        <Badge
          variant={trustworthinessScore >= 80 ? 'default' : 'secondary'}
          className="text-xs"
        >
          Trust: {trustworthinessScore}/100
        </Badge>
      </div>

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Add transcript entries to see safety metrics.
        </p>
      )}
    </div>
  );
}
