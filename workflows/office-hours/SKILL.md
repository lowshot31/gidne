---
name: office-hours
description: Idea validation & brainstorming. Understand the problem before writing code.
---
# /office-hours — Idea Validation & Brainstorming

## Core Principles

- **Understand the problem before writing code.** The output of this workflow is a design document, not code.
- **Look at user behavior, not just founder claims.**
- "Interest" is not demand. Action is demand.

---

## Phase 1: Context Gathering

1. Read `CLAUDE.md`, `TODOS.md`, `README.md` in the project root if they exist.
2. Grasp recent work using `git log --oneline -20`.
3. Ask the user: **"What is the goal of this project?"**

Branch mode based on purpose:

- **Startup / Production Project** → Phase 2A (Serious Validation)
- **Hackathon / Learning / Side Project** → Phase 2B (Fun Brainstorming)

---

## Phase 2A: Startup Mode — Validation Questions (One by one!)

### Q1: Demand Reality

"What is the strongest evidence that someone actually wants this? Not just 'interest', but is there someone who would be genuinely upset if this disappeared tomorrow?"

### Q2: Current State

"How are users solving this problem right now? No matter how messy it is. What is the cost of that workaround?"

### Q3: Specific Persona

"What is the specific name, job title, and reason for sleepless nights of the main target user?"

### Q4: Minimum Wedge

"What is the absolute smallest version of this that someone would pay for this week? Not the whole platform."

### Q5: Observation & Surprises

"Have you ever sat beside someone actually using it? Were there any unexpected behaviors?"

**Ask each question one by one. Push back once if the answer is vague.**

---

## Phase 2B: Builder Mode — Brainstorming

- "What is the absolute coolest version of this?"
- "Who would say 'Wow' if you showed this to them?"
- "What is the fastest path to something usable?"
- "How is this different from similar things that already exist?"

---

## Phase 3: Challenge Assumptions

Validate assumptions before writing code:

```
Assumptions:
1. [This problem actually exists] — Agree/Disagree?
2. [The current solution is insufficient] — Agree/Disagree?
3. [We can build something better] — Agree/Disagree?
```

Verify with the user. If they disagree, revise and iterate.

---

## Phase 4: Generate Alternatives

Propose 3 implementation approaches based on validated assumptions:

| Approach | Description | Effort | Polish |
|----------|-------------|--------|--------|
| A) Minimum Wedge | Just 1 core value | ~2 hours | 6/10 |
| B) Balanced MVP | Core + Differentiator | ~1 day | 8/10 |
| C) Full Vision | Complete implementation | ~1 week | 10/10 |

**Recommendation: Always select the full version. AI has reduced marginal costs to near zero.**

---

## Phase 5: Write Design Document

Create `DESIGN.md` in the project root:

```markdown
# [Project Name] Design Document

## Problem Definition

## User Persona

## Core Features

## Technical Decisions

## Data Model

## API Design

## Testing Strategy

## Next Steps
```

---

## Completion Status

- **DONE** — Design document complete, assumptions validated
- **DONE_WITH_CONCERNS** — Completed but contains unvalidated assumptions
- **NEEDS_CONTEXT** — Answers were insufficient, need more information
