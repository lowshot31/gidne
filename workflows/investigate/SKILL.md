---
name: investigate
description: Systematic debugging and root cause analysis.
---
# /investigate — Systematic Debugging

## 🔴 Iron Rule

**No fix without root cause investigation.**
Fixing symptoms is "whack-a-mole" debugging. Find the cause, then fix.
**When fixing, ALWAYS explain the 'why' and 'how it works' to the user.**

---

## Phase 1: Root Cause Investigation

### 1.1: Gather Symptoms

- Summarize error messages, stack traces, and reproduction steps
- If information is lacking, ask the user **one by one**

### 1.2: Read Code

- Trace code paths from symptoms to potential causes
- Find all relevant references using `grep`
- Understand logic using `view_file`

### 1.3: Check Recent Changes

```bash
git log --oneline -20 -- <affected_files>
git diff HEAD~5 -- <affected_files>
```

If it worked before, the cause is in the diff.

### 1.4: Reproduction

Is it deterministically reproducible? If not, gather more evidence before Phase 2.

---

## Phase 2: Pattern Analysis

| Pattern | Signature | Where to look |
|---------|-----------|---------------|
| Race Condition | Intermittent, timing dependent | Concurrent access to shared state |
| Null Propagation | TypeError, undefined | Missing optional guards |
| State Pollution | Inconsistent data | Transactions, callbacks, hooks |
| Integration Failure | Timeout, unexpected response | External APIs, service boundaries |
| Config Drift | Local OK, staging fails | Env vars, feature flags |
| Cache Issues | Stale data displayed | Redis, CDN, browser cache |

---

## Phase 3: Hypothesis Testing

### 3-Strike Rule ⚠️

1. **Verify Hypothesis:** Add temporary logs/assertions in suspected areas. Run reproduction. Does the evidence match?
2. **If Hypothesis is Wrong:** Search the web for similar cases (after removing sensitive info). Return to Phase 1 and gather more evidence. No guessing.
3. **If Failed 3 Times → STOP.**

```
3 hypothesis tests completed, all mismatched.
This might be an architectural issue, not a simple bug.

A) Continue investigation — New hypothesis: [Description]
B) Escalate to human — Need someone who knows the system
C) Add logging and wait — Setup instrumentation and catch next occurrence
```

### Red Flags (Stop if you see these)

- "Let's fix it temporarily for now" → There are no temporary fixes. Fix it right or escalate.
- Proposing fixes before tracing data flow → This is guessing.
- Fixing one place breaks another → Looking at the wrong layer.

---

## Phase 4: Implementation & Mentoring

Once root cause is confirmed:

1. **Fix the cause, not the symptom.** Minimal change that actually eliminates the problem.
2. **Technical Explanation (Mandatory):** Do not just spit out code. Clearly explain "why this specific solution was chosen among many" and "how it internally works" so the user can learn.
3. **Minimal diff.** Fewest files, fewest lines. Resist the urge to refactor adjacent code.
4. **Write Regression Test:**
   - **Fails** without the fix (Proves the test is meaningful)
   - **Passes** with the fix (Proves the fix works)
5. **Run entire test suite.** Paste output. Confirm no regressions.
6. **If modifying 5+ files** → Confirm blast radius with the user.

---

## Phase 5: Verification & Reporting

Reproduce original bug scenario → Confirm fix. This is not optional.

```
Debug Report
════════════════════════════════════════
Symptom:       [What the user observed]
Root Cause:    [What actually went wrong]
Fix Applied:   [What was changed, file:line ref]
Reasoning:     [💡Mentoring: Operating principle and knowledge behind this choice]
Evidence:      [Test results, reproduction attempts]
Regression T:  [file:line]
Related:       [Previous bugs in same area, architectural notes]
Status:        DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```
