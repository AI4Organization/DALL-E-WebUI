# CLAUDE.md - .claude/

This file provides guidance to Claude Code (claude.ai/code) when working with Claude Code configuration.

## Purpose

This directory contains Claude Code's configuration settings, including enabled plugins and custom commands.

## File Structure

```
.claude/
├── settings.json          # Claude Code settings (enabled plugins)
└── commands/
    └── openspec/          # OpenSpec custom commands
        ├── proposal.md    # /proposal command
        ├── apply.md       # /apply command
        └── archive.md     # /archive command
```

## Configuration Files

### `settings.json`

Claude Code configuration file that manages enabled plugins and extensions.

**Current Configuration:**
```json
{
  "enabledPlugins": {
    "dev-browser@dev-browser-marketplace": true,
    "frontend-design@claude-plugins-official": true
  }
}
```

**Enabled Plugins:**

| Plugin | Purpose |
|--------|---------|
| `dev-browser@dev-browser-marketplace` | Browser automation for web testing, scraping, and form filling |
| `frontend-design@claude-plugins-official` | Production-grade frontend UI component generation |

### Plugin Usage

#### dev-browser
Used for browser automation tasks. Trigger phrases include:
- "go to [url]"
- "click on [element]"
- "fill out the form"
- "take a screenshot"
- "scrape [data]"
- "automate [workflow]"

#### frontend-design
Used for creating web components and pages. Trigger phrases include:
- "build [component]"
- "create [UI]"
- "design [page]"

## Custom Commands

Custom commands are defined as Markdown files in the `.claude/commands/` directory. Each command file defines a slash command that can be invoked by the user.

### OpenSpec Commands

The `openspec/` subdirectory contains custom commands for the OpenSpec spec-driven development workflow:

| Command | File | Purpose |
|---------|------|---------|
| `/proposal` | `proposal.md` | Create a new OpenSpec change proposal |
| `/apply` | `apply.md` | Implement an approved OpenSpec change |
| `/archive` | `archive.md` | Archive a completed OpenSpec change |

See `./commands/openspec/CLAUDE.md` for detailed documentation of these commands.

## Adding New Commands

To add a new custom command:

1. Create a new Markdown file in `.claude/commands/<category>/<command-name>.md`
2. Add frontmatter with command metadata:
   ```markdown
   ---
   name: Command Name
   description: Brief description of what the command does
   category: Category
   tags: [tag1, tag2]
   ---
   ```
3. Add the command instructions below the frontmatter
4. The command will be available as `/<category>-<command-name>`

## Adding New Plugins

To enable additional plugins:

1. Edit `settings.json`
2. Add the plugin ID to `enabledPlugins`:
   ```json
   {
     "enabledPlugins": {
       "plugin-id@source": true
     }
   }
   ```

## Related Documentation

- `../openspec/AGENTS.md` - OpenSpec agent instructions
- `../openspec/project.md` - Project conventions
- `./commands/openspec/CLAUDE.md` - OpenSpec commands documentation

## Notes

- Plugin configuration is specific to Claude Code
- Commands are defined as Markdown files with YAML frontmatter
- The `openspec` commands integrate with the OpenSpec workflow defined in `../openspec/`
- Changes to `settings.json` take effect on Claude Code restart
