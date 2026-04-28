---
name: merge
description: Merge current feature branch into main and cleanup.
---
# /merge — Merge Feature Branch

// turbo-all

## Phase 1: Pre-flight Check

### 1. Check Current Branch

```bash
git branch --show-current
```

If on `main`, warn "This is not a feature branch to merge" and terminate.

### 2. Check Uncommitted Changes

```bash
git status --short
```

If there are uncommitted changes:

```bash
git add -A
git commit -m "feat: <infer description from current branch>"
```

---

## Phase 2: Build Verification

### 3. Build Test

```bash
npm run build
```

If it fails, STOP. Build errors must be resolved first.

---

## Phase 3: Merge

### 4. Move to main & Update

```bash
git checkout main && git pull origin main
```

### 5. Merge Feature Branch

```bash
git merge feat/<branch_name> --no-ff -m "merge: feat/<branch_name> into main"
```

Report and assist user if merge conflicts occur.

### 6. Push

```bash
git push origin main
```

### 7. Cleanup Feature Branch

```bash
git branch -d feat/<branch_name>
git push origin --delete feat/<branch_name>
```

---

## Phase 4: Ship Report

```
╔═══════════════════════════════════╗
║          MERGE REPORT             ║
╠═══════════════════════════════════╣
║ Branch:    feat/<name>            ║
║ → main:   Merge Complete ✅        ║
║ Build:     Passed ✅               ║
║ Cleanup:   Branch Deleted ✅       ║
╠═══════════════════════════════════╣
║ Status: MERGED                    ║
╚═══════════════════════════════════╝
```

---

## Completion Status

- **DONE** — Merge complete, branch cleaned up
- **BLOCKED** — Build failed or conflicts occurred
