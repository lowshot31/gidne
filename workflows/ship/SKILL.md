---
name: ship
description: Release engineering pre-flight checks, testing, and PR creation.
---
# /ship — Release Engineering

## Pre-flight Checks

### 1. Check Branch Status

```bash
git status
git branch --show-current
git log --oneline -5
```

### 2. Sync with main

```bash
git fetch origin
git log --oneline origin/main..HEAD
```

Check if there are any commits ahead of main. If not, report "Nothing to ship."

### 3. Pre-check Conflicts

// turbo

```bash
git diff --stat origin/main...HEAD
```

---

## Run Tests

### 4. Detect Test Framework

Run appropriate tests for the project:

- Note `test` script in `package.json` → `npm test`
- `pytest.ini` or `conftest.py` → `pytest`
- `go.mod` → `go test ./...`

### 5. What if there are no tests?

If no test framework is found, ask the user:

```
No tests found in this project.

A) Install test framework and write core tests (Recommended)
B) Proceed without tests (Not Recommended)
```

**Recommendation: Always choose A. Writing tests is the cheapest task for AI.**

### 6. Coverage Audit

Test result summary:

```
Tests: 42 passed, 0 failed
Coverage: 78% → Areas needing additional coverage: [Specific files]
```

---

## Commit & PR

### 7. Clean up Commits

Verify commits follow Conventional Commits format:

- `feat:` / `fix:` / `chore:` / `docs:` / `test:`

### 8. Create PR

Push the branch and summarize information for PR creation:

```markdown
## PR Summary

### Changes

- [Change 1]
- [Change 2]

### Testing

- [x] Unit tests passed
- [x] Integration tests passed
- [ ] E2E tests (if applicable)

### Checklist

- [ ] Code review completed (/review)
- [ ] Checked if documentation needs updating
- [ ] No breaking changes
```

---

## Post-ship

### 9. Update Documentation

Check if changes affect README or API documentation. Update if necessary.

### 10. Ship Report

```
╔═══════════════════════════════════╗
║          SHIP REPORT              ║
╠═══════════════════════════════════╣
║ Branch:    feature/xxx            ║
║ Commits:   N                      ║
║ Files:     +N / -N                ║
║ Tests:     N Passed / N Failed    ║
║ Coverage:  N%                     ║
║ PR:        #NNN (or Ready)         ║
╠═══════════════════════════════════╣
║ Status: SHIPPED / BLOCKED         ║
╚═══════════════════════════════════╝
```
