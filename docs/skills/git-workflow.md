# Git Workflow - Version Control Best Practices

**Scope:** workflow
**Trigger:** when working with Git, version control, commits, branches, or team workflows
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Purpose

This skill guides professional use of Git. It covers everything from basic commands to advanced workflows, conventional commits, Git Flow, trunk-based development, conflict resolution, and team best practices.

## When to Use This Skill

- Setting up Git on new projects
- Working in teams with branches
- Writing professional commit messages
- Resolving conflicts
- Doing code reviews via Pull Requests
- Keeping a clean history
- Collaborating on open source

## Fundamentals

### Initial Configuration

```bash
# Configure identity
git config --global user.name "Your Name"
git config --global user.email "you@email.com"

# Default editor
git config --global core.editor "code --wait"  # VS Code
git config --global core.editor "vim"          # Vim

# Useful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# View configuration
git config --list
```

### Basic Commands

```bash
# Initialize repo
git init

# Clone repo
git clone https://github.com/user/repo.git

# Check status
git status

# Stage files
git add file.txt
git add .                # All changes
git add *.js             # Pattern

# Commit
git commit -m "message"
git commit -am "message" # Add + commit (tracked files)

# View history
git log
git log --oneline
git log --graph --all
git log -p              # With diff
git log --author="John"
git log --since="2 weeks ago"

# View changes
git diff               # Working dir vs staged
git diff --staged      # Staged vs last commit
git diff HEAD          # Working dir vs last commit

# Undo changes
git restore file.txt         # Discard working dir changes
git restore --staged file.txt # Unstage
git reset HEAD~1             # Undo last commit (keep changes)
git reset --hard HEAD~1      # Undo last commit (discard changes)
```

## Branches

### Branch Commands

```bash
# Create branch
git branch feature/new-feature

# Switch branches
git checkout feature/new-feature
# or in Git 2.23+
git switch feature/new-feature

# Create and switch (shortcut)
git checkout -b feature/new-feature
git switch -c feature/new-feature

# List branches
git branch           # Local
git branch -r        # Remote
git branch -a        # All

# Delete branch
git branch -d feature/completed  # Safe delete
git branch -D feature/old        # Force delete

# Rename branch
git branch -m old-name new-name

# Latest commit per branch
git branch -v
```

### Merge

```bash
# Merge feature branch into main
git checkout main
git merge feature/new-feature

# Merge with fast-forward disabled (creates a merge commit)
git merge --no-ff feature/new-feature

# Abort a merge with conflicts
git merge --abort
```

### Rebase

```bash
# Rebase feature onto main
git checkout feature/new-feature
git rebase main

# Interactive rebase (reorder, edit commits)
git rebase -i HEAD~3

# Continue after resolving conflicts
git rebase --continue

# Abort rebase
git rebase --abort

# Rebase vs Merge:
# Merge: preserves history, creates merge commits
# Rebase: linear history, no merge commits
```

## Conventional Commits

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting (does not affect code behavior)
refactor: Refactor (neither bug fix nor feature)
perf:     Performance improvements
test:     Add/modify tests
build:    Build system or dependencies
ci:       CI configuration
chore:    Other tasks (gitignore, etc.)
revert:   Revert a previous commit
```

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT authentication"

# Bug fix
git commit -m "fix(api): handle null response from users endpoint"

# Breaking change
git commit -m "feat(api)!: change response format

BREAKING CHANGE: API now returns data in {data, meta} format"

# With scope and body
git commit -m "refactor(database): optimize query performance

- Add index on user_id column
- Remove unnecessary joins
- Use connection pooling"

# Multiple paragraphs
git commit -m "feat(payment): integrate Stripe

Implemented payment processing with the Stripe API.
Includes webhook handlers for payment events.

Closes #123"
```

## Git Flow

### Branches in Git Flow

```
main/master     - Production-ready code
develop         - Integration branch
feature/*       - New features
release/*       - Release preparation
hotfix/*        - Production bug fixes
```

### Workflow

```bash
# 1. Feature development
git checkout develop
git checkout -b feature/user-profile
# ... make changes ...
git add .
git commit -m "feat(profile): add user profile page"

# 2. Finish feature
git checkout develop
git merge --no-ff feature/user-profile
git branch -d feature/user-profile
git push origin develop

# 3. Create release
git checkout develop
git checkout -b release/1.2.0
# ... bump version, changelog ...
git commit -m "chore(release): bump version to 1.2.0"

# 4. Release to production
git checkout main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

git checkout develop
git merge --no-ff release/1.2.0
git branch -d release/1.2.0

# 5. Hotfix
git checkout main
git checkout -b hotfix/critical-bug
# ... fix bug ...
git commit -m "fix(auth): resolve login timeout issue"

git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.2.1 -m "Hotfix 1.2.1"

git checkout develop
git merge --no-ff hotfix/critical-bug
git branch -d hotfix/critical-bug
```

## Trunk-Based Development

### Philosophy

- One main branch (main/trunk)
- Short-lived feature branches (<1 day)
- Continuous integration
- Feature flags for incomplete features

### Workflow

```bash
# 1. Create a short-lived feature branch
git checkout main
git pull origin main
git checkout -b feature/quick-fix

# 2. Make small changes
# ... changes ...
git add .
git commit -m "feat(ui): add loading spinner"

# 3. Sync with main frequently
git checkout main
git pull origin main
git checkout feature/quick-fix
git rebase main

# 4. Push and open a quick PR
git push origin feature/quick-fix
# Open PR, quick code review

# 5. Merge into main
# Delete the branch immediately after merge
```

## Pull Requests

### Creating a Quality PR

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Code Review Best Practices

**As Reviewer:**
- Review quickly (< 24 hours)
- Comment on what is good
- Ask questions, do not demand
- Suggest improvements with examples
- Approve if issues are minor
- Do not nitpick style if a linter already enforces it
- Do not be rude or condescending

**As Author:**
- Keep PRs small (<400 lines)
- Write a descriptive title/description
- Respond to all comments
- Thank reviewers
- Fix issues or explain why not
- Do not take feedback personally
- Do not merge without approval

## Conflicts

### Resolving Conflicts

```bash
# During a merge
git merge feature/branch
# CONFLICT in file.txt

# 1. Check conflicts
git status

# 2. Open the conflicting file
# <<<<<<< HEAD
# Code in your branch
# =======
# Code in the other branch
# >>>>>>> feature/branch

# 3. Edit the file, resolve conflicts

# 4. Mark as resolved
git add file.txt

# 5. Complete the merge
git commit

# During a rebase
git rebase main
# CONFLICT in file.txt

# Resolve and continue
git add file.txt
git rebase --continue

# Or skip the commit if unnecessary
git rebase --skip

# Or abort
git rebase --abort
```

## Tags

```bash
# Create tag
git tag v1.0.0
git tag -a v1.0.0 -m "Version 1.0.0"

# List tags
git tag
git tag -l "v1.*"

# Push tags
git push origin v1.0.0
git push origin --tags  # All tags

# Delete tag
git tag -d v1.0.0               # Local
git push origin --delete v1.0.0  # Remote

# Checkout a tag
git checkout v1.0.0
```

## Advanced Commands

### Stash

```bash
# Temporarily save changes
git stash
git stash save "work in progress"

# List stashes
git stash list

# Apply a stash
git stash apply           # Latest stash, keeps it
git stash pop             # Latest stash, removes it
git stash apply stash@{2} # Specific stash

# Drop a stash
git stash drop stash@{0}
git stash clear  # All
```

### Cherry-pick

```bash
# Apply a specific commit to the current branch
git cherry-pick abc123

# Multiple commits
git cherry-pick abc123 def456

# Without automatic commit
git cherry-pick -n abc123
```

### Reflog

```bash
# View reference history
git reflog

# Recover a "lost" commit
git reflog
git checkout abc123
git checkout -b recovered-branch
```

### Blame

```bash
# See who modified each line
git blame file.txt
git blame -L 10,20 file.txt  # Lines 10-20
```

## .gitignore

```bash
# .gitignore

# Node
node_modules/
npm-debug.log
.env

# Python
__pycache__/
*.py[cod]
venv/
.env

# Java
target/
*.class
*.jar

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.log
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| fatal: not a git repository | No git repo present | git init |
| Please commit or stash | Uncommitted changes | git stash or git commit |
| fatal: refusing to merge unrelated histories | Different histories | git pull --allow-unrelated-histories |
| CONFLICT | Conflicting changes | Resolve manually |

## Daily Checklist

- [ ] Pull before starting work
- [ ] Create a branch for new features
- [ ] Atomic, frequent commits
- [ ] Descriptive commit messages
- [ ] Push at least once a day
- [ ] Sync with main regularly
- [ ] Code review before merge
- [ ] Delete branches after merge

## Best Practices

1. **Commit Often** - Small, frequent commits
2. **Descriptive Messages** - Conventional commits
3. **Branch Strategy** - Git Flow or Trunk-Based
4. **Pull Before Push** - Avoid conflicts
5. **Review Code** - Mandatory PR reviews
6. **Protect Main** - Branch protection rules
7. **Tag Releases** - Version releases
8. **Clean History** - Rebase before merging
9. **.gitignore** - Do not commit unnecessary files
10. **Backup** - Push to remote frequently

---

**Last updated:** Phase 6 - DevOps & Workflow
**Maintainer:** Skills System
