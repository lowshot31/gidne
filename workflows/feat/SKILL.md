---
name: feat
description: Automated feature branch creation.
---
# /feat — Feature Automation

// turbo-all

## Phase 1: Branch Creation

### 1. Update main

```bash
git checkout main && git pull origin main
```

### 2. Create feature branch

Ask the user for the branch name:

```
What feature will you be working on?

Examples:
  - news-catalyst
  - qqq-benchmark
  - tabs-v2

Branch Name (feat/ is automatically prepended):
```

Create the branch based on user response:

```bash
git checkout -b feat/<user_input>
```

### 3. Verification

```bash
git branch --show-current
```

Display: "Starting work on branch feat/<name>. Run `/merge` when finished."

---

## Completion Status

- **DONE** — Branch created successfully, ready to start work
