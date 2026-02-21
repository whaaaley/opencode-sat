## Git Workflow

### Commit Format

Use conventional commits: type(scope): description. Type and description start lowercase.
No trailing punctuation. Maximum 72 characters. Present tense imperative voice.

Allowed types: feat for features, fix for bugs, refactor for restructuring, test for test
changes, docs for documentation, style for formatting, chore for maintenance, build for
build system changes, ci for CI configuration, perf for performance, revert for rollbacks.

### Scopes

Use predefined scopes only: api, client, server, database, auth, config, docker, ci. Do
not invent new scopes without team discussion.

### Pre-Commit Workflow

Review staged changes with git diff --staged before every commit. Check recent commit
messages with git log --oneline -5 to match the existing style. If the commit fails
validation, read the error message and fix the format — do not bypass hooks.

### Safety Rules

Never run git restore under any circumstances. It permanently deletes uncommitted work
with no recovery path.

Never force push to main or master. If a force push is needed on a feature branch, confirm
with the user first.

Never include Co-Authored-By lines or AI attribution in commit messages. Commit history
should reflect human contributors only.

Move tracked files with git mv to preserve rename detection in history. Use regular mv only
for new untracked files.

### Commit Discipline

Make atomic commits — one logical change per commit. A commit that mixes a feature addition
with an unrelated refactor is two commits.

Skip the commit body unless specifically requested. Most changes are self-explanatory from
the subject line and the diff.

Do not commit generated files, build artifacts, or environment files (.env, .env.local).
These belong in .gitignore.
