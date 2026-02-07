# Git setup & usage (Meme Generator)

## If Git isn’t installed

1. Download and install from **https://git-scm.com/** (Windows).
2. Restart your terminal (or Cursor), then run the steps below.

---

## One-time setup in this project

In a terminal, from this project folder:

```powershell
git init
git add .
git commit -m "Initial commit"
```

That creates the repo and saves the current state as the first commit.

---

## Day-to-day usage

| What you want to do | Command |
|---------------------|--------|
| See what changed | `git status` |
| Stage all changes | `git add .` |
| Stage one file | `git add path/to/file` |
| Save a snapshot (commit) | `git commit -m "Short description of what you did"` |
| View commit history | `git log` (or `git log --oneline` for a short list) |

**Typical workflow:** edit files → `git add .` → `git commit -m "Add new meme template"` → repeat.

---

## Optional: push to GitHub

1. Create a **new empty repository** on GitHub (no README, no .gitignore).
2. In this project folder:

   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

3. After that, to send new commits to GitHub: `git push`.

---

## Quick reference

- **Undo changes in a file** (before staging): `git checkout -- filename`
- **Unstage a file** (after `git add`): `git reset HEAD filename`
- **See differences**: `git diff` (unstaged) or `git diff --staged` (staged)
