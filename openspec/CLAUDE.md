# CLAUDE.md - openspec/

This file provides guidance to Claude Code (claude.ai/code) when working with OpenSpec specifications and change proposals.

## Purpose

This directory contains OpenSpec configuration, specifications, and change proposals for spec-driven development. OpenSpec is used to manage API changes, new features, and architectural decisions through a structured proposal and implementation workflow.

## Directory Structure

```
openspec/
├── AGENTS.md            # Instructions for AI assistants using OpenSpec
├── project.md           # Project conventions and context
├── specs/               # Current truth - what IS built
│   └── image-generation/
│       └── spec.md      # Image generation capability specification
├── changes/             # Proposals - what SHOULD change
│   ├── add-dall-e-2-support/
│   │   ├── proposal.md  # Why, what, impact
│   │   ├── tasks.md     # Implementation checklist
│   │   └── specs/       # Delta changes
│   │       └── image-generation/
│   │           └── spec.md
│   └── archive/         # Completed changes
│       ├── 2026-01-02-add-parallel-image-generation/
│       ├── 2026-01-02-migrate-to-gpt-image-1.5/
│       └── ...
```

## Key Files

### `AGENTS.md`

**Purpose:** Comprehensive instructions for AI coding assistants using OpenSpec.

**Content:**
- Three-stage workflow (Creating Changes, Implementing Changes, Archiving Changes)
- Quick checklist for common operations
- CLI commands reference
- Spec file format requirements
- Best practices and patterns

**When to Read:**
- Before creating any change proposal
- When implementing an approved change
- When unsure about OpenSpec conventions

### `project.md`

**Purpose:** Project context and conventions for OpenSpec changes.

**Content:**
- Tech stack (frontend: Rsbuild/React, backend: Express.js)
- Code style conventions (TypeScript, naming, file organization)
- Architecture patterns (decoupled frontend/backend)
- Domain context (image generation models, formats, theme system)
- Constraints (Node.js version, API limits, browser support)
- Migration history

**When to Read:**
- When creating a new change proposal
- To understand project conventions
- To verify technical decisions align with project patterns

## Directory Contents

### `specs/` - Current Specifications

Contains the authoritative specifications for implemented capabilities.

**Structure:**
- `specs/<capability>/spec.md` - Requirements and scenarios
- `specs/<capability>/design.md` - Technical patterns (optional)

**Current Capabilities:**
- `image-generation/` - Image generation via DALL-E APIs

### `changes/` - Active Proposals

Contains proposed changes that are in progress or awaiting approval.

**Change Structure:**
```
changes/<change-id>/
├── proposal.md     # Why, what, impact
├── tasks.md        # Implementation checklist
├── design.md       # Technical decisions (optional)
└── specs/          # Delta changes
    └── <capability>/
        └── spec.md  # ADDED/MODIFIED/REMOVED requirements
```

**Active Changes:**
- `add-dall-e-2-support/` - DALL-E 2 model support

### `changes/archive/` - Completed Changes

Contains deployed and archived changes, organized by date.

**Naming Convention:** `YYYY-MM-DD-<change-id>/`

**Archived Changes:**
- `2026-01-02-add-parallel-image-generation/` - Parallel image generation
- `2026-01-02-migrate-to-gpt-image-1.5/` - GPT Image 1.5 migration

## OpenSpec Workflow

### Stage 1: Creating Changes

Use when adding features, making breaking changes, or changing architecture.

**Process:**
1. Review `project.md`, `openspec list`, and `openspec list --specs`
2. Choose a unique verb-led `change-id` (e.g., `add-feature`, `fix-bug`)
3. Scaffold proposal files:
   - `proposal.md` - Why, what, impact
   - `tasks.md` - Implementation checklist
   - `design.md` - Technical decisions (optional)
   - `specs/<capability>/spec.md` - Delta changes
4. Validate with `openspec validate <id> --strict`

**Skip for:** Bug fixes, typos, dependency updates, tests.

### Stage 2: Implementing Changes

**Process:**
1. Read `proposal.md` to understand what's being built
2. Read `design.md` (if exists) for technical decisions
3. Read `tasks.md` for implementation checklist
4. Implement tasks sequentially
5. Confirm completion - update `tasks.md` with all items checked

**Important:** Do not start implementation until proposal is approved.

### Stage 3: Archiving Changes

After deployment, move to archive and update specs.

**Process:**
1. Move `changes/<id>/` → `changes/archive/YYYY-MM-DD-<id>/`
2. Update `specs/` if capabilities changed
3. Run `openspec validate --strict` to confirm

## CLI Commands

```bash
# List active changes
openspec list

# List specifications
openspec list --specs

# Show details
openspec show <item>           # Prompts for selection
openspec show <change> --json  # Machine-readable output
openspec show <spec> --type spec

# Validate
openspec validate <id>         # Validate change or spec
openspec validate --strict     # Bulk validation mode

# Archive
openspec archive <change-id> [--yes|-y]  # Archive after deployment

# Initialize/Update
openspec init [path]           # Initialize OpenSpec
openspec update [path]         # Update instruction files
```

## Spec File Format

### Proposal Structure

`proposal.md`:
```markdown
# Change: [Brief description]

## Why
[1-2 sentences on problem/opportunity]

## What Changes
- [Bullet list of changes]
- [Mark breaking changes with **BREAKING**]

## Impact
- Affected specs: [list capabilities]
- Affected code: [key files/systems]
```

### Tasks Structure

`tasks.md`:
```markdown
## 1. Implementation
- [ ] 1.1 Create database schema
- [ ] 1.2 Implement API endpoint
- [ ] 1.3 Add frontend component
- [ ] 1.4 Write tests
```

### Spec Delta Format

`specs/<capability>/spec.md`:
```markdown
## ADDED Requirements
### Requirement: New Feature
The system SHALL provide...

#### Scenario: Success case
- **WHEN** user performs action
- **THEN** expected result

## MODIFIED Requirements
### Requirement: Existing Feature
[Complete modified requirement]

## REMOVED Requirements
### Requirement: Old Feature
**Reason**: [Why removing]
**Migration**: [How to handle]
```

**Important:** Scenarios must use `#### Scenario:` format (4 hashtags).

## Quick Reference

### Stage Indicators
- `changes/` - Proposed, not yet built
- `specs/` - Built and deployed
- `archive/` - Completed changes

### File Purposes
- `proposal.md` - Why and what
- `tasks.md` - Implementation steps
- `design.md` - Technical decisions
- `spec.md` - Requirements and behavior

### Change ID Naming
- Use kebab-case, short and descriptive
- Prefer verb-led prefixes: `add-`, `update-`, `remove-`, `refactor-`
- Ensure uniqueness

### Capability Naming
- Use verb-noun: `user-auth`, `image-generation`
- Single purpose per capability
- 10-minute understandability rule

## Related Documentation

- `../.claude/commands/openspec/CLAUDE.md` - OpenSpec custom commands
- `../CLAUDE.md` - Main project documentation
- `../server/lib/CLAUDE.md` - Backend utilities documentation

## Notes

- Specs are truth. Changes are proposals.
- Keep them in sync by archiving after deployment.
- Always validate with `--strict` flag before sharing proposals.
- Use `openspec show --json --deltas-only` for debugging delta parsing.
- The `OPENSPEC:START` and `OPENSPEC:END` blocks are managed by OpenSpec tooling.
