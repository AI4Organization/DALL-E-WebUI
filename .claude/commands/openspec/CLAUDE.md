# CLAUDE.md - .claude/commands/openspec/

This file provides guidance to Claude Code (claude.ai/code) when working with OpenSpec custom commands.

## Purpose

This directory contains custom slash commands for the OpenSpec spec-driven development workflow. These commands streamline the process of creating, implementing, and archiving change proposals.

## Command Files

| File | Command | Purpose |
|------|---------|---------|
| `proposal.md` | `/proposal` | Scaffold a new OpenSpec change proposal |
| `apply.md` | `/apply` | Implement an approved OpenSpec change |
| `archive.md` | `/archive` | Archive a completed OpenSpec change |

## Command Details

### `/proposal` - Create Change Proposal

**File:** `proposal.md`

**Purpose:** Scaffold a new OpenSpec change and validate strictly.

**Workflow:**
1. Review `openspec/project.md`, run `openspec list` and `openspec list --specs`
2. Choose a unique verb-led `change-id` (e.g., `add-feature`, `fix-bug`)
3. Scaffold proposal files under `openspec/changes/<id>/`:
   - `proposal.md` - Why, what, impact
   - `tasks.md` - Implementation checklist
   - `design.md` - Technical decisions (optional)
   - `specs/<capability>/spec.md` - Delta changes
4. Draft spec deltas using `## ADDED|MODIFIED|REMOVED Requirements`
5. Validate with `openspec validate <id> --strict`

**Guardrails:**
- Favor straightforward, minimal implementations
- Keep changes tightly scoped
- Identify vague/ambiguous details before editing
- No code implementation during proposal stage

**Output:** A new change proposal ready for review and approval.

### `/apply` - Implement Approved Change

**File:** `apply.md`

**Purpose:** Implement an approved OpenSpec change and keep tasks in sync.

**Workflow:**
1. Read `proposal.md` to understand what's being built
2. Read `design.md` (if exists) for technical decisions
3. Read `tasks.md` for implementation checklist
4. Implement tasks sequentially
5. Confirm completion - ensure every item in `tasks.md` is finished
6. Update checklist - set all tasks to `- [x]` after completion

**Key Points:**
- Do not start implementation until proposal is approved
- Complete tasks in order as listed in `tasks.md`
- Track progress with checkboxes in `tasks.md`
- Update `tasks.md` to reflect reality after work is done

**Output:** Implemented code changes with completed `tasks.md`.

### `/archive` - Archive Completed Change

**File:** `archive.md`

**Purpose:** Archive a deployed OpenSpec change and update specs.

**Workflow:**
1. Move `changes/<id>/` → `changes/archive/YYYY-MM-DD-<id>/`
2. Update `specs/` if capabilities changed
3. Run `openspec validate --strict` to confirm
4. Use `openspec archive <id> --skip-specs --yes` for tooling-only changes

**When to Archive:**
- After deployment to production
- Change is fully implemented and tested
- PR has been merged

**Output:** Archived change with updated specs.

## OpenSpec Workflow Overview

```
┌─────────────┐    approval    ┌─────────────┐    implement    ┌─────────────┐
 │  /proposal  │ ──────────────> │   Review    │ ───────────────> │   /apply    │
 │  (scaffold) │                 │             │                  │  (implement) │
 └─────────────┘                 └─────────────┘                  └─────────────┘
                                                                  │
                                                                  v
                                                            ┌─────────────┐
                                                            │  /archive   │
                                                            │ (after dep.)│
                                                            └─────────────┘
```

## Command Invocation

Commands can be invoked by typing the command name in Claude Code:

```
/proposal
```

Claude Code will read the corresponding Markdown file and execute the instructions defined within it.

## File Format

Each command file follows this format:

```markdown
---
name: Command Name
description: Brief description
category: OpenSpec
tags: [openspec, change]
---

<!-- OPENSPEC:START -->
**Guardrails**
- Guardrail 1
- Guardrail 2

**Steps**
1. Step 1
2. Step 2
<!-- OPENSPEC:END -->
```

## Related Documentation

- `../../../openspec/AGENTS.md` - OpenSpec agent instructions (comprehensive guide)
- `../../../openspec/project.md` - Project conventions
- `../CLAUDE.md` - Claude Code configuration overview

## Notes

- Commands are defined as Markdown files with YAML frontmatter
- The `OPENSPEC:START` and `OPENSPEC:END` blocks are managed by OpenSpec tooling
- Commands integrate with the `openspec` CLI tool
- Always validate changes with `openspec validate --strict` before sharing
