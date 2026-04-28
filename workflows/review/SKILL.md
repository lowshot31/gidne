---
name: review
description: Code review and architectural mentoring. Find production bugs and suggest alternatives.
---
# /review — Code Review & Architectural Mentoring

Passing CI means nothing. Review exists to catch bugs that will explode in production.
**Furthermore, beyond simply fixing bugs, present alternatives to the user and guide decision making.**

---

## Step 1: Understand Changes

```bash
git diff --stat
git diff --name-only
git log --oneline -10
```

Grasp the list of changed files, size of changes, and recent commit history.

---

## Step 2: Diff Analysis

Read the diffs of all changed files. One by one.

Categorize each change:

| Label | Meaning | Action |
|-------|---------|--------|
| 🔴 BUG | Production Bug | Point out issue & present multiple alternatives |
| 🟡 ISSUE | Potential Risk | Ask user & compare alternatives |
| 🟢 NIT | Style/Trivial | Group and mention all at once |
| ✅ GOOD | Good execution | Acknowledge (1-2 max) |

---

## Step 3: Production Bug Pattern Check

### Mandatory Checklist:

- [ ] **Error Handling**: Missing try/catch, swallowed errors, generic catch blocks
- [ ] **Null/Undefined**: Missing optional chaining, no type guards
- [ ] **Race Conditions**: Missing async/await, concurrent shared state mutations
- [ ] **Security**: Unvalidated inputs, SQL injection, XSS vulnerabilities
- [ ] **Performance**: N+1 queries, unnecessary re-renders, memory leaks
- [ ] **Edge Cases**: Empty arrays, empty strings, 0, null, extremely long strings
- [ ] **Tests**: Are there tests for new logic? Are edge cases covered?

---

## Step 4: Present Alternatives & Guide Choice (Mentoring Mode) 💡

The core of this workflow is improving the user's architectural decision-making skills.
If a BUG or ISSUE requiring logic changes is found, DO NOT force a single correct answer. Follow this process:

1. **Suggest at least 2 alternatives**: Propose Option A and Option B (or C). (e.g., "Use Redux" vs "Use Context API", "Apply Caching" vs "Direct DB Indexing")
2. **Pros/Cons Comparison Table**: Clearly compare performance, readability, maintainability, and implementation difficulty for each option.
3. **Guide Choice**: Ask, "Option A is memory efficient, while Option B is much faster to implement. Which direction do you want to take?" to let the user choose.

### AUTO-FIX:

- Typos, unused imports, clear type errors, missing awaits, remove console.logs

### ASK (Ask user for alternatives):

- Bugs requiring significant logic changes
- Portions requiring architecture/performance decisions

---

## Step 5: Completeness Audit

```
╔═══════════════════════════════════════╗
║          REVIEW REPORT                ║
╠═══════════════════════════════════════╣
║ Files Reviewed: N/N Complete          ║
║ 🔴 BUG:       N  (AUTO-FIX: N)       ║
║ 🟡 ISSUE:     N  (ASK: N)            ║
║ 💡 OPTIONS:   N  Pending Decisions   ║
║ 🟢 NIT:       N                      ║
║ Test Coverage: Needs More / Sufficient║
╠═══════════════════════════════════════╣
║ Verdict: APPROVE / REQUEST_CHANGES   ║
╚═══════════════════════════════════════╝
```

### APPROVE Criteria:

- 0 🔴 BUGs
- User confirmation received for all 🟡 ISSUEs
- Tests exist for new logic

### REQUEST_CHANGES:

- 🔴 BUGs present
- Unresolved 🟡 ISSUEs present
- Pending 💡 OPTIONS awaiting user selection

---

## Completion Status

- **DONE** — All files reviewed, no BUGs
- **DONE_WITH_CONCERNS** — Complete, but unhandled ISSUEs require attention
- **BLOCKED** — Diff is too large or lacking context
