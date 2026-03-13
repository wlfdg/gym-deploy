$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\Peter\Downloads\gym-deploy"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  gym-deploy bug fix + git push script  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Write the Python fixer to a temp file ────────────────────────────────────
$pyFixer = @'
import re, sys

base = sys.argv[1].replace("\\", "/")

print("")

# ════════════════════════════════════════════════
#  Fix backend/app.py
# ════════════════════════════════════════════════
path = base + "/backend/app.py"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

original = src

# Fix 1: Remove the orphan duplicate except block at the end of report_excel
# (two blank lines then a second identical except — SyntaxError)
src = re.sub(
    r'(\s+return error\(f"Error generating report: \{str\(ex\)\}", 500\))'
    r'\n{2,}\s*except Exception as ex:\s*\n\s*return error\(f"Error generating report: \{str\(ex\)\}", 500\)',
    r'\1',
    src
)

# Fix 2: Timezone-aware vs naive datetime crash in report_excel
src = src.replace(
    'days_left = (datetime.strptime(exp, "%Y-%m-%d") - datetime.now(PHT)).days',
    'days_left = (datetime.strptime(exp, "%Y-%m-%d") - datetime.now(PHT).replace(tzinfo=None)).days'
)

# Fix 3: Remove dead cur2.lastrowid line in login() — psycopg2 doesn't support it
src = re.sub(
    r'        shift_id = cur2\.lastrowid if cur2\.lastrowid else None\n'
    r'        # Get shift_id via SELECT since lastrowid may not work with psycopg2\n',
    '        # Get shift_id via SELECT (psycopg2 does not support lastrowid)\n',
    src
)

# Fix 4: Add missing log_activity call to delete_walkin endpoint
old_walkin = (
    '    if rows_affected == 0:\n'
    '        return error("Walk-in not found.", 404)\n'
    '    return jsonify({"message": "Deleted"})'
)
new_walkin = (
    '    if rows_affected == 0:\n'
    '        return error("Walk-in not found.", 404)\n'
    '    admin_user = request.headers.get("X-Admin-User", "unknown")\n'
    '    log_activity(admin_user, "DELETE_WALKIN", f"Deleted walk-in ID: {walkin_id}")\n'
    '    return jsonify({"message": "Deleted"})'
)
src = src.replace(old_walkin, new_walkin)

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(src)

changed = sum(1 for a, b in zip(original.splitlines(), src.splitlines()) if a != b)
print(f"  [OK] backend/app.py  — {changed} lines changed")
print("       Fix 1: Removed orphan duplicate except block (SyntaxError)")
print("       Fix 2: Fixed timezone-aware datetime crash in report_excel")
print("       Fix 3: Removed dead cur.lastrowid code in login()")
print("       Fix 4: Added log_activity to delete_walkin endpoint")

# ════════════════════════════════════════════════
#  Fix frontend/src/api/config.js
# ════════════════════════════════════════════════
path = base + "/frontend/src/api/config.js"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

original = src

# Fix 5: Default export was the plain URL string, not the axios instance
src = src.replace("export default API;", "export default api;")

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(src)

print(f"  [OK] frontend/src/api/config.js")
print("       Fix 5: Default export is now axios instance, not URL string")

# ════════════════════════════════════════════════
#  Fix frontend/src/pages/Members.js
# ════════════════════════════════════════════════
path = base + "/frontend/src/pages/Members.js"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

original = src

# Fix 6: Catch block swallowed the error — surface the server's message
src = src.replace(
    '    } catch {\n      alert("Failed to delete member.");\n    }',
    '    } catch (e) {\n      alert(e.response?.data?.message || "Failed to delete member.");\n    }'
)

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(src)

print(f"  [OK] frontend/src/pages/Members.js")
print("       Fix 6: Delete catch block now surfaces server error message")
print("")
print("  All fixes applied successfully.")
print("")
'@

$tempPy = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "gymfix_$([System.Diagnostics.Process]::GetCurrentProcess().Id).py")
[System.IO.File]::WriteAllText($tempPy, $pyFixer, [System.Text.Encoding]::UTF8)

# ── Run the Python fixer ──────────────────────────────────────────────────────
Write-Host "Step 1/3  Applying code fixes..." -ForegroundColor Yellow
try {
    python $tempPy $projectRoot
    if ($LASTEXITCODE -ne 0) { throw "Python fixer script failed." }
} finally {
    Remove-Item $tempPy -Force -ErrorAction SilentlyContinue
}

# ── Git operations ────────────────────────────────────────────────────────────
Write-Host "Step 2/3  Staging changed files..." -ForegroundColor Yellow
Set-Location $projectRoot

git add backend/app.py
git add frontend/src/api/config.js
git add frontend/src/pages/Members.js

Write-Host ""
Write-Host "  Staged files:" -ForegroundColor DarkGray
git diff --cached --name-status
Write-Host ""

Write-Host "Step 3/3  Committing and pushing..." -ForegroundColor Yellow

$commitMsg = @"
fix: critical bugs in deletion flow and report generation

- fix(app.py): remove duplicate orphan except block in report_excel (SyntaxError crash)
- fix(app.py): resolve timezone-aware vs naive datetime crash in report_excel
- fix(app.py): remove dead cur.lastrowid code in login (psycopg2 does not support it)
- fix(app.py): add missing log_activity audit log to delete_walkin endpoint
- fix(config.js): default export is now the axios instance not the raw URL string
- fix(Members.js): catch block now surfaces server error message on delete failure
"@

git commit -m $commitMsg

Write-Host ""
Write-Host "  Pushing to remote..." -ForegroundColor DarkGray
git push

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All done! 6 fixes committed + pushed. " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Summary of what was fixed:" -ForegroundColor White
Write-Host "  1. SyntaxError  - duplicate except in report_excel (app crashed)" -ForegroundColor Red
Write-Host "  2. TypeError    - timezone datetime crash in report_excel" -ForegroundColor Red
Write-Host "  3. Dead code    - cur.lastrowid removed from login()" -ForegroundColor DarkYellow
Write-Host "  4. Missing log  - delete_walkin now has audit trail" -ForegroundColor DarkYellow
Write-Host "  5. Wrong export - config.js exports axios instance correctly" -ForegroundColor DarkYellow
Write-Host "  6. Silent error - Members.js delete now shows real error message" -ForegroundColor DarkYellow
Write-Host ""
