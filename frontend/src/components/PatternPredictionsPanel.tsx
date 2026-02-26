import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock } from 'lucide-react';
import type { TranscriptEntry } from '../hooks/useDashboardState';
import { predictPatterns, buildPatternProfile, type PatternProfile } from '../utils/patternPredictionEngine';

interface PatternPredictionsPanelProps {
  entries: TranscriptEntry[];
  profile?: PatternProfile | null;
}

const DIRECTION_ICONS = {
  escalating: <TrendingUp className="w-4 h-4 text-red-500" />,
  'de-escalating': <TrendingDown className="w-4 h-4 text-green-500" />,
  stable: <Minus className="w-4 h-4 text-yellow-500" />,
};

const DIRECTION_COLORS = {
  escalating: 'text-red-500',
  'de-escalating': 'text-green-500',
  stable: 'text-yellow-500',
};

const RISK_COLORS = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function PatternPredictionsPanel({ entries, profile: profileProp }: PatternPredictionsPanelProps) {
  const prediction = predictPatterns(entries);
  const profile = profileProp ?? buildPatternProfile(entries);

  if (entries.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
        <Clock className="w-6 h-6 opacity-40" />
        <p className="text-sm text-center">
          Building baseline... Add at least 2 entries to see predictions.
        </p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Insufficient data for predictions.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Prediction cards */}
      <div className="grid grid-cols-2 gap-2">
        {/* Next Emotion */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Next Emotion</p>
          <p className="text-sm font-semibold capitalize">{prediction.nextEmotion}</p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{Math.round(prediction.confidence * 100)}%</span>
          </div>
        </div>

        {/* Next Intent */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Next Intent</p>
          <p className="text-sm font-semibold capitalize">{prediction.nextIntent.replace(/-/g, ' ')}</p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{Math.round(prediction.confidence * 100)}%</span>
          </div>
        </div>

        {/* Conversation Direction */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Direction</p>
          <div className="flex items-center gap-1.5">
            {DIRECTION_ICONS[prediction.conversationDirection]}
            <span className={`text-sm font-semibold capitalize ${DIRECTION_COLORS[prediction.conversationDirection]}`}>
              {prediction.conversationDirection}
            </span>
          </div>
        </div>

        {/* Hallucination Risk */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Guard Risk</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[prediction.hallucinationRisk]}`}>
            {prediction.hallucinationRisk === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {prediction.hallucinationRisk} risk
          </span>
        </div>
      </div>

      {/* Action Window */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground font-medium mb-1">Action Window</p>
        <p className="text-xs leading-relaxed">{prediction.actionWindow}</p>
      </div>

      {/* Profile summary */}
      {profile && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Profile:</span>
          <Badge variant="outline" className="text-xs capitalize">{profile.dominantEmotion}</Badge>
          <Badge variant="secondary" className="text-xs capitalize">{profile.dominantIntent.replace(/-/g, ' ')}</Badge>
          <Badge variant="outline" className="text-xs">{profile.entryCount} entries</Badge>
        </div>
      )}
    </div>
  );
}
