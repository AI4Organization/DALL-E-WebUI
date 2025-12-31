# CLAUDE.md - .github/workflows/

This directory contains GitHub Actions workflow definitions.

## Workflows

### `pr_agent_review.yml`
**Action**: Codium-ai/pr-agent@main

**Triggers**:
- `pull_request` - Runs on every PR
- `issue_comment` - Responds to user comments on PRs

**Purpose**: Automated PR review and analysis using AI

**Environment Variables Required**:
- `OPENAI_KEY` - Set in GitHub repository secrets (Settings → Secrets)

**Permissions Required**:
```yaml
permissions:
  issues: write
  pull-requests: write
  contents: write
```

**Usage**: The PR Agent can analyze code changes, suggest improvements, and respond to comments using the `/review` command or similar PR Agent commands.
