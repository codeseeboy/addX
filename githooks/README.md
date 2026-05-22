# Git hooks (optional)

Keeps **Cursor** off GitHub contributors by removing `Co-authored-by: Cursor` from commit messages.

One-time setup in this repo:

```bash
git config core.hooksPath githooks
```

On Windows, use **Git Bash** for commits if the hook does not run in PowerShell.
