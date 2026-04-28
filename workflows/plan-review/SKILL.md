---
name: plan-review
description: Comprehensive plan review from CEO, Engineer, and Designer perspectives.
---
# /plan-review — Integrated Plan Review

Evaluate a single plan through three distinct lenses: CEO (Scope & Strategy), Engineer (Architecture & Edge Cases), and Designer (UX & Usability).

---

## Step 1: Context Gathering

1. Read `DESIGN.md`, `README.md`, `CLAUDE.md`
2. Identify recent changes with `git log --oneline -30`
3. Check current branch diff: `git diff --stat`

---

## Step 2: CEO Review (Scope & Strategy)

Evaluate out of 10 points:

| Criteria | Score | 10-Point Benchmark |
|----------|-------|--------------------|
| Problem Clarity | ?/10 | Problem is clear in one sentence |
| User Value | ?/10 | "Aha!" moment on first use |
| Scope Appropriateness | ?/10 | The wedge is extremely sharp |
| Differentiation | ?/10 | Clearly distinct from competitors |
| Market Timing | ?/10 | Why right now? |

**Verdict:**

- 8+/10 → "The plan is solid. Proceed."
- 5-7/10 → "You need to strengthen this area: [Specific Criteria]"
- <5/10 → "Start over from problem definition. Run /office-hours first."

---

## Step 3: Eng Review (Architecture & Tech)

### 3.1: Data Flow Diagram

Draw the data flow using ASCII diagram:

```
[User] → [Frontend] → [API] → [DB]
                       ↓
                [External Services]
```

### 3.2: Edge Case Matrix

| Scenario | Current Handling | Risk Level | Recommendation |
|----------|------------------|------------|----------------|
| Concurrent Access | ? | High/Medium/Low | ? |
| Network Failure | ? | ? | ? |
| Large Dataset | ? | ? | ? |
| Auth Expiration | ? | ? | ? |

### 3.3: Testing Strategy

- Unit Tests: Core business logic
- Integration Tests: API endpoints
- E2E Tests: Core user flows

---

## Step 4: Design Review (UX & Usability)

Evaluate out of 10 points:

| Dimension | Score | To achieve 10 points |
|-----------|-------|----------------------|
| First Impression | ?/10 | Value delivered within 3 seconds |
| Information Hierarchy | ?/10 | Structure grasped at a glance |
| Interaction | ?/10 | Minimum clicks, instant feedback |
| Error Handling UX | ?/10 | Are errors actually helpful? |
| AI Slop Detection | ?/10 | Avoids generic, soulless design |

**AI Slop Checklist:**

- [ ] Meaningless gradients used
- [ ] Lorem ipsum or placeholders left behind
- [ ] Every section has the exact same generic layout
- [ ] Icons do not match their intended meaning

---

## Step 5: Integrated Verdict

```
╔═══════════════════════════════════╗
║        PLAN REVIEW REPORT         ║
╠═══════════════════════════════════╣
║ CEO Review:    [PASS/NEEDS_WORK]  ║
║ Eng Review:    [PASS/NEEDS_WORK]  ║
║ Design Review: [PASS/NEEDS_WORK]  ║
╠═══════════════════════════════════╣
║ Final Verdict: [GO/REVISE/RETHINK]║
║ Key Fix needed: [1-line summary]   ║
╚═══════════════════════════════════╝
```

- **GO** — All three reviews > 7/10. Start implementation.
- **REVISE** — One or more is 5-7/10. Improve weak areas and re-review.
- **RETHINK** — One or more is <5/10. Go back to /office-hours and rethink fundamentals.
