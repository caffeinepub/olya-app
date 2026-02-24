export interface BeliefNode {
  id: string;
  label: string;
  type: 'speaker' | 'topic' | 'position' | 'interest';
  confidence: number;
  x: number;
  y: number;
}

export interface BeliefEdge {
  from: string;
  to: string;
  label: string;
  confidence: number;
  type: 'supports' | 'opposes' | 'relates' | 'influences';
}

export interface BeliefGraph {
  nodes: BeliefNode[];
  edges: BeliefEdge[];
  trustLevel: number;
  persuasionLevel: number;
  concerns: string[];
}

const SPEAKER_LABELS = ['Party A', 'Party B'];

function extractPositions(text: string): string[] {
  const positions: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes('price') || lower.includes('cost') || lower.includes('budget')) positions.push('Price Point');
  if (lower.includes('timeline') || lower.includes('deadline') || lower.includes('schedule')) positions.push('Timeline');
  if (lower.includes('quality') || lower.includes('standard') || lower.includes('requirement')) positions.push('Quality Standard');
  if (lower.includes('risk') || lower.includes('liability') || lower.includes('exposure')) positions.push('Risk Allocation');
  if (lower.includes('scope') || lower.includes('deliverable') || lower.includes('feature')) positions.push('Scope Definition');
  if (lower.includes('payment') || lower.includes('invoice') || lower.includes('billing')) positions.push('Payment Terms');

  return positions.slice(0, 2);
}

function extractInterests(text: string): string[] {
  const interests: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes('profit') || lower.includes('revenue') || lower.includes('return')) interests.push('Profitability');
  if (lower.includes('trust') || lower.includes('relationship') || lower.includes('partner')) interests.push('Long-term Relationship');
  if (lower.includes('reputation') || lower.includes('brand') || lower.includes('image')) interests.push('Reputation');
  if (lower.includes('efficiency') || lower.includes('speed') || lower.includes('fast')) interests.push('Efficiency');
  if (lower.includes('security') || lower.includes('stable') || lower.includes('certain')) interests.push('Stability');

  return interests.slice(0, 2);
}

export function updateBeliefGraph(
  currentGraph: BeliefGraph,
  text: string,
  entryIndex: number
): BeliefGraph {
  const speakerIdx = entryIndex % 2;
  const speakerLabel = SPEAKER_LABELS[speakerIdx];
  const speakerId = `speaker_${speakerIdx}`;

  const newNodes: BeliefNode[] = [...currentGraph.nodes];
  const newEdges: BeliefEdge[] = [...currentGraph.edges];

  // Ensure speaker nodes exist
  if (!newNodes.find(n => n.id === speakerId)) {
    newNodes.push({
      id: speakerId,
      label: speakerLabel,
      type: 'speaker',
      confidence: 1.0,
      x: speakerIdx === 0 ? 0.2 : 0.8,
      y: 0.5,
    });
  }

  // Extract and add positions
  const positions = extractPositions(text);
  for (const pos of positions) {
    const posId = `pos_${pos.replace(/\s+/g, '_').toLowerCase()}`;
    if (!newNodes.find(n => n.id === posId)) {
      const angle = (newNodes.length * 137.5 * Math.PI) / 180;
      newNodes.push({
        id: posId,
        label: pos,
        type: 'position',
        confidence: 0.6 + Math.random() * 0.3,
        x: 0.5 + 0.25 * Math.cos(angle),
        y: 0.5 + 0.25 * Math.sin(angle),
      });
    }

    // Add edge from speaker to position
    const edgeId = `${speakerId}_${posId}`;
    if (!newEdges.find(e => e.from === speakerId && e.to === posId)) {
      const lower = text.toLowerCase();
      const isOpposing = lower.includes('reject') || lower.includes('refuse') || lower.includes('disagree');
      newEdges.push({
        from: speakerId,
        to: posId,
        label: isOpposing ? 'opposes' : 'holds',
        confidence: 0.65 + Math.random() * 0.25,
        type: isOpposing ? 'opposes' : 'supports',
      });
    }
  }

  // Extract and add interests
  const interests = extractInterests(text);
  for (const interest of interests) {
    const intId = `int_${interest.replace(/\s+/g, '_').toLowerCase()}`;
    if (!newNodes.find(n => n.id === intId)) {
      const angle = (newNodes.length * 137.5 * Math.PI) / 180;
      newNodes.push({
        id: intId,
        label: interest,
        type: 'interest',
        confidence: 0.5 + Math.random() * 0.4,
        x: 0.5 + 0.35 * Math.cos(angle),
        y: 0.5 + 0.35 * Math.sin(angle),
      });
    }

    const edgeId = `${speakerId}_${intId}`;
    if (!newEdges.find(e => e.from === speakerId && e.to === intId)) {
      newEdges.push({
        from: speakerId,
        to: intId,
        label: 'seeks',
        confidence: 0.55 + Math.random() * 0.35,
        type: 'influences',
      });
    }
  }

  // Update trust and persuasion levels
  const lower = text.toLowerCase();
  let trustDelta = 0;
  let persuasionDelta = 0;

  if (lower.includes('agree') || lower.includes('understand') || lower.includes('appreciate')) trustDelta += 0.05;
  if (lower.includes('disagree') || lower.includes('reject') || lower.includes('refuse')) trustDelta -= 0.05;
  if (lower.includes('consider') || lower.includes('think about') || lower.includes('interesting')) persuasionDelta += 0.05;
  if (lower.includes('never') || lower.includes('impossible') || lower.includes('absolutely not')) persuasionDelta -= 0.05;

  const newTrust = Math.max(0.1, Math.min(0.95, currentGraph.trustLevel + trustDelta));
  const newPersuasion = Math.max(0.1, Math.min(0.95, currentGraph.persuasionLevel + persuasionDelta));

  // Update concerns
  const newConcerns = [...currentGraph.concerns];
  if (lower.includes('concern') || lower.includes('worry') || lower.includes('issue')) {
    const words = text.split(/\s+/);
    const concernIdx = words.findIndex(w => ['concern', 'worry', 'issue', 'problem'].includes(w.toLowerCase()));
    if (concernIdx >= 0 && concernIdx < words.length - 1) {
      const concern = words.slice(concernIdx + 1, concernIdx + 4).join(' ').replace(/[^a-zA-Z\s]/g, '');
      if (concern.length > 3 && !newConcerns.includes(concern)) {
        newConcerns.push(concern);
      }
    }
  }

  return {
    nodes: newNodes.slice(0, 12), // Cap nodes for performance
    edges: newEdges.slice(0, 20), // Cap edges
    trustLevel: newTrust,
    persuasionLevel: newPersuasion,
    concerns: newConcerns.slice(0, 5),
  };
}

export function initBeliefGraph(): BeliefGraph {
  return {
    nodes: [],
    edges: [],
    trustLevel: 0.5,
    persuasionLevel: 0.5,
    concerns: [],
  };
}
