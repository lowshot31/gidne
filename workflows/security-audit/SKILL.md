---
name: security-audit
description: Security audit based on OWASP Top 10 + STRIDE threat model.
---
# /security-audit — Security Audit

Zero noise principle. Only report findings with 8/10 or higher confidence. All findings must include a concrete attack scenario.

---

## Step 1: Codebase Scan

### 1.1: Attack Surface Mapping
```bash
# Find API endpoints
grep -r "app\.\(get\|post\|put\|delete\|patch\)" --include="*.ts" --include="*.js" -l
grep -r "@(Get|Post|Put|Delete|Patch)" --include="*.ts" -l
grep -r "router\.\(get\|post\|put\|delete\)" --include="*.py" -l

# Catch env var usage
grep -r "process\.env\|os\.environ\|env\." --include="*.ts" --include="*.js" --include="*.py" -l

# Find secrets pattern
grep -rn "password\|secret\|api_key\|token\|private_key" --include="*.ts" --include="*.js" --include="*.py" --include="*.env"
```

---

## Step 2: OWASP Top 10 Check

| # | Category | Check | Status |
|---|----------|-------|--------|
| A01 | Broken Access Control | RBAC, Auth checks, IDOR | ? |
| A02 | Cryptographic Failures | HTTPS, Hashing, Key mgmt | ? |
| A03 | Injection | SQL, NoSQL, OS Command, XSS | ? |
| A04 | Insecure Design | Threat modeling, Business logic | ? |
| A05 | Security Misconfiguration | CORS, Headers, Defaults | ? |
| A06 | Vulnerable Components | Outdated dependencies, CVEs | ? |
| A07 | Identification & Auth Failures | Session mgmt, Password policy | ? |
| A08 | Software & Data Integrity | Deserialization, CI/CD pipeline | ? |
| A09 | Security Logging & Monitoring | Audit logs, Alerts | ? |
| A10 | SSRF | Forged server-side requests | ? |

---

## Step 3: STRIDE Threat Model

For each component:

| Threat | Question | Mitigation |
|--------|----------|------------|
| **S**poofing | Can auth be bypassed? | ? |
| **T**ampering | Can data be modified? | ? |
| **R**epudiation | Are actions trackable? | ? |
| **I**nfo Disclosure | Are sensitive data exposed? | ? |
| **D**enial of Service | Can resources be exhausted? | ? |
| **E**levation | Can privileges be escalated? | ? |

---

## Step 4: Dependency Security

```bash
# Node.js
npm audit 2>/dev/null || true

# Python
pip audit 2>/dev/null || true
safety check 2>/dev/null || true
```

---

## Step 5: Security Report

### False Positive Filter (Noise Removal)
Do NOT report:
- Hardcoded secrets in local dev environments
- Test secrets in test environments
- Placeholders in .env.example
- Any code inside node_modules

### Report Format

```
╔═══════════════════════════════════════╗
║        SECURITY AUDIT REPORT          ║
╠═══════════════════════════════════════╣
║ Files Scanned: N                      ║
║ Findings:      🔴 N / 🟡 N / 🟢 N      ║
╚═══════════════════════════════════════╝

🔴 HIGH - [Title]
  Location:   path/to/file.ts:42
  Attack:     [Concrete Attack Scenario]
  Fix:        [Concrete Fix Action]
  Confidence: 9/10

🟡 MEDIUM - [Title]
  Location:   path/to/file.ts:88
  Attack:     [Concrete Attack Scenario]
  Fix:        [Concrete Fix Action]
  Confidence: 8/10

╔═══════════════════════════════════════════╗
║ Final Verdict: PASS / NEEDS_FIX / CRITICAL║
╚═══════════════════════════════════════════╝
```

- **PASS** — 0 🔴 HIGH
- **NEEDS_FIX** — 🔴 HIGH exists but not immediately exploitable
- **CRITICAL** — Immediately exploitable vulnerabilities exist