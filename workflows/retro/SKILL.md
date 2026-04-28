---
name: retro
description: Weekly retrospective. Review git stats, summarize accomplishments, extract lessons, and plan next week.
---
# /retro — Weekly Retrospective

## Step 1: Data Collection

### Git Statistics

```bash
# Commits this week
git log --since="1 week ago" --oneline --author="$(git config user.name)"

# Lines changed
git log --since="1 week ago" --author="$(git config user.name)" --shortstat

# Changes per file
git log --since="1 week ago" --author="$(git config user.name)" --name-only --format="" | sort | uniq -c | sort -rn | head -20
```

### Project Status

- Check `TODOS.md` (if exists)
- Check open Issues/PRs (if exists)

---

## Step 2: Summary Generation

```
╔═══════════════════════════════════════════╗
║       Weekly Retrospective — YYYY-MM-DD   ║
╠═══════════════════════════════════════════╣
║                                           ║
║  📊 This Week in Numbers                  ║
║  ─────────────────────                    ║
║  Commits:  N                              ║
║  Files:    +NNNN / -NNNN                  ║
║  Tests:    N → N (+N added)               ║
║                                           ║
║  🚀 Shipped Items                         ║
║  ─────────────────────                    ║
║  1. [Feature/Fix 1]                       ║
║  2. [Feature/Fix 2]                       ║
║  3. [Feature/Fix 3]                       ║
║                                           ║
║  📚 Lessons Learned                       ║
║  ─────────────────────                    ║
║  1. [Lesson 1]                            ║
║  2. [Lesson 2]                            ║
║                                           ║
║  ⚠️ Red Flags                             ║
║  ─────────────────────                    ║
║  1. [Tech Debt / Risks]                   ║
║                                           ║
║  🎯 Next Week Plan                        ║
║  ─────────────────────                    ║
║  1. [Task 1]                              ║
║  2. [Task 2]                              ║
║                                           ║
╚═══════════════════════════════════════════╝
```

---

## Step 3: Health Metrics

### Code Health

- **Test Trend**: Is the number of tests increasing or decreasing?
- **Repeated File Modifications**: If the same file was modified 3+ times → Architectural Smell
- **TODO Trend**: Are TODOs increasing or decreasing?

### Growth Opportunities

- The hardest part this week? → Learning opportunity
- Any repetitive tasks? → Automation opportunity
- Common bug patterns caught in review? → Preventable mistakes

---

## Step 4: Update TODOS.md

Reflect retro results in `TODOS.md` (if exists):

- Check off completed items
- Add newly discovered tasks
- Re-adjust priorities
