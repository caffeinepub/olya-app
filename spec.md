# Specification

## Summary
**Goal:** Enhance the Olya Negotiation Coach frontend to visually reflect a full AI/ML pipeline architecture across all major panels and the app header, using simulated data with realistic model labels and metrics.

**Planned changes:**
- Update `TranscriptInput` / ASR area: animated waveform when mic is active, ASR engine selector labeled "ASR Engine (Whisper / Web Speech / DeepSpeech)", and a simulated transcription confidence indicator alongside interim transcript text
- Upgrade `SemanticAnalysisPanel`: add "NLP: BERT / RoBERTa" model label, keyword highlights with confidence scores, signed sentiment bar (negative to positive with numeric score), and top-3 intent probability bars
- Upgrade `EmotionIntentPanel`: add "Emotion & Intent: Fine-tuned Transformer" label, top-3 ranked intents with probability bars
- Enhance `BeliefStatePanel`: add "Belief Modeling: KG + Bayesian Networks" label, directional labeled edges between speaker nodes (Trust, Conflict, Agreement), Bayesian confidence percentages on each node
- Upgrade `StrategyEnginePanel`: add "Strategy Engine: LLaMA + RL" label, RL reward score and rank badge per strategy, animated "Policy Update" indicator on recalculation, and Exploration vs. Exploitation ratio bar
- Upgrade `EthicsBadge` / `SafetyQualityPanel`: add "Ethics: Bias & Toxicity Detection" label, bias category breakdown bars (gender, racial, socioeconomic), toxicity score gauge (0–100), and Hallucination Risk indicator from `hallucinationGuard`
- Update `AppHeader`: replace current badges with a full pipeline status ribbon showing chips for all 6 stages (ASR, NLP, Emotion & Intent, Belief Modeling, Strategy Engine, Ethics) with model name and active/inactive state; responsive collapsing on smaller screens
- Update Dashboard layout: reorder panels to reflect pipeline sequence (Transcript Input → Emotion & Intent → Semantic/NLP → Belief State → Strategy Engine → Ethics/Safety) with visual flow connectors (arrows or step numbers) between sections
- Update `UserManual` page: add "Architecture Overview" section documenting all 6 pipeline stages with model names, descriptions, and platform constraint notes using existing `Section` and `InfoBox` components, integrated with the i18n system

**User-visible outcome:** Users see the full AI pipeline represented visually across the app — from the ASR input stage through NLP, emotion/intent, belief modeling, strategy generation, and ethics — with model labels, confidence scores, flow indicators, and a header ribbon communicating each active pipeline stage.
