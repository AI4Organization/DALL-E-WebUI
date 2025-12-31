# CLAUDE.md - .github/

This directory contains GitHub-specific configuration files.

## Structure

```
.github/
  workflows/
    pr_agent_review.yml    # PR Agent workflow for automated PR reviews
```

## Workflows

### `pr_agent_review.yml`
Triggers PR-Agent (Codium-ai/pr-agent) on:
- Pull requests
- Issue comments

**Required Secrets**:
- `OPENAI_KEY` - OpenAI API key for PR Agent
- `GITHUB_TOKEN` - Automatically provided by GitHub

**Permissions**: Issues (write), Pull requests (write), Contents (write)
