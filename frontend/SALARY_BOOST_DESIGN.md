# Salary Boost Experience - UI Draft

## Objectives
- Surface the quantified salary delta tied to resume insights (per skill and combined potential).
- Provide a guided story: current comp -> projected comp -> actions to unlock the delta.
- Tie each suggestion to required effort, proof sources, and Watson-backed rationale.

## Layout Concept
1. **Hero Insight Banner**
   - Gradient card summarizing potential increase (absolute + %), baseline salary, and the top-two accelerators.
   - Micro badges for currency, confidence, and data freshness.
2. **Opportunity Heatmap**
   - Grid of chips grouping opportunities by theme (Cloud, AI, Frontend, etc.) with impact rings.
   - Filters for effort (time to learn) and ROI.
3. **Action Playbooks**
   - For each high-impact skill: card with
     - Impact (USD + %), timeframe, effort score.
     - Recommended resources (2 quick links) + Watson note.
     - Progress tracker (0/3 steps complete) tied to roadmap milestones.
4. **Quick Wins vs Strategic Bets**
   - Two-column comparison showing short-term boosts vs long-term bets.
   - Each row lists skill, expected uplift, hiring signal, and verification status.
5. **Verification Prompt**
   - CTA ribbon prompting MCQ verification for targeted skills to lock-in badge + extra leverage.

## Data Needs
- Current salary (from resume or manual input fallback).
- Aggregated salary boost opportunities already computed in `skillAnalysisService`.
- Watson rationale snippet per suggestion (available via `recommendations` descriptions).
- Verification state per skill (badge + last verified score).

## Implementation Notes
- Build a dedicated component `SalaryInsightsPanel` wrapping the hero, heatmap, action cards, and comparison.
- Accept props: `salaryBoost`, `skillGaps`, `verifiedSkills`, `currentSalary`.
- Use CSS grid with responsive breakpoints, reusing `Card` and `Button` primitives.
- Add small helper util to aggregate total USD impact + categorize boosts.
- Prepare skeleton states for when salary data is missing; prompt user to add baseline compensation.
