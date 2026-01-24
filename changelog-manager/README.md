# Changelog Manager MCP Server

A Model Context Protocol (MCP) server for managing project changelogs following the [Keep a Changelog](https://keepachangelog.com/) format.

## Features

- **Initialize changelogs** - Create new CHANGELOG.md files with proper structure
- **Auto-update** - Analyze git history and uncommitted changes to generate entries
- **Validate** - Check changelog format, consistency, and completeness
- **Quick add** - Manually add single entries without full analysis
- **Symlink support** - Works with external context directories

## Installation

### Build from source

```bash
cd ~/dev/tooling/mcp-servers/changelog-manager
npm install
npm run build
```

### Configure in Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "changelog-manager": {
      "command": "node",
      "args": [
        "/Users/clobbster/dev/tooling/mcp-servers/changelog-manager/build/index.js"
      ]
    }
  }
}
```

### Configure in OpenCode

```bash
opencode mcp add

# Follow prompts:
# Name: changelog-manager
# Command: node
# Args: /Users/clobbster/dev/tooling/mcp-servers/changelog-manager/build/index.js
```

## Available Tools

### `changelog_init`

Initialize a new CHANGELOG.md file for your project.

**Parameters:**
- `location` (optional): Where to create the changelog
  - `"root"` - Create `./CHANGELOG.md` (default for public projects)
  - `"external"` - Create in `~/dev/tooling/claude-code/contexts/[project]/CHANGELOG.md` with symlink (recommended for work projects)
  - `"docs"` - Create `./docs/CHANGELOG.md`
- `project_name` (optional): Project name (auto-detected from directory)

**Example:**

```
Use changelog_init to create a new changelog with external context
```

### `changelog_update`

Analyze recent git changes and update the changelog automatically.

**Parameters:**
- `changelog_path` (optional): Path to CHANGELOG.md (will auto-detect if not provided)
- `description` (optional): Brief description for this entry
- `use_unreleased` (optional): Add to [Unreleased] section instead of today's date (default: false)

**What it does:**
- Detects uncommitted file changes (added, modified, deleted)
- Analyzes recent git commits (last 7 days)
- Categorizes conventional commits (feat: → Added, fix: → Fixed, etc.)
- Creates or updates a dated entry with all changes
- Preserves existing entries

**Example:**

```
Use changelog_update to analyze recent changes and update the changelog
```

### `changelog_validate`

Validate changelog format, consistency, and alignment with git history.

**Parameters:**
- `changelog_path` (optional): Path to CHANGELOG.md (will auto-detect if not provided)

**What it checks:**
- Title and format reference
- Date format (YYYY-MM-DD)
- Chronological order
- Empty sections
- Invalid section names
- Missing [Unreleased] section
- Recent commits not in changelog

**Example:**

```
Use changelog_validate to check the changelog format
```

### `changelog_entry_add`

Quickly add a single entry to the changelog without full analysis.

**Parameters:**
- `entry` (required): The changelog entry description
- `category` (required): One of: Added, Changed, Fixed, Removed, Deprecated, Security, Documentation, Testing, Performance, Dependencies, Breaking Changes
- `changelog_path` (optional): Path to CHANGELOG.md (will auto-detect)
- `use_unreleased` (optional): Add to [Unreleased] section (default: true)

**Example:**

```
Use changelog_entry_add to add "Implement user authentication" to the "Added" category
```

## Usage Workflow

### Starting a New Project

1. **Initialize the changelog:**
   ```
   Use changelog_init with external context
   ```

2. **Start working on features** and commit regularly with conventional commits:
   ```bash
   git commit -m "feat: add user login"
   git commit -m "fix: resolve timeout issue"
   ```

3. **Update changelog periodically:**
   ```
   Use changelog_update to add recent changes
   ```

4. **Validate before releases:**
   ```
   Use changelog_validate to check formatting
   ```

### Quick Manual Entries

For manual entries without git analysis:

```
Use changelog_entry_add to add "Update dependencies to latest versions" to Dependencies
```

### Convert [Unreleased] to Release

The [Unreleased] section accumulates changes between releases. When ready to release:

1. Manually rename `[Unreleased]` to `[YYYY-MM-DD] - Release Name`
2. Add a new empty `[Unreleased]` section at the top
3. Run `changelog_validate` to ensure correctness

## Conventional Commit Mapping

The `changelog_update` tool automatically categorizes conventional commits:

| Commit Type | Changelog Section |
|-------------|-------------------|
| `feat:`, `feature:` | Added |
| `fix:` | Fixed |
| `docs:` | Documentation |
| `refactor:` | Changed |
| `perf:`, `performance:` | Performance |
| `test:` | Testing |
| `chore:` | Changed |
| `build:`, `deps:` | Dependencies |
| `breaking:`, `BREAKING CHANGE` | Breaking Changes |

## Changelog Format

This server follows the [Keep a Changelog](https://keepachangelog.com/) format with date-based versioning:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to date-based versioning.

---

## [Unreleased]

### Added
- New feature X

---

## [2025-01-24] - Feature Release

### Added
- Feature A
- Feature B

### Changed
- Updated component C

### Fixed
- Bug fix D

---
```

## Development

### Project Structure

```
changelog-manager/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/
│   │   ├── changelog-init.ts
│   │   ├── changelog-update.ts
│   │   ├── changelog-validate.ts
│   │   └── changelog-entry-add.ts
│   └── utils/
│       ├── types.ts          # TypeScript types
│       ├── git-ops.ts        # Git operations
│       ├── changelog-parser.ts  # Parse/serialize changelog
│       ├── changelog-validator.ts  # Validation logic
│       └── file-ops.ts       # File I/O operations
├── build/                    # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
npm run build       # Compile TypeScript
npm run watch      # Watch for changes
```

### Testing

```bash
# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# Test with Claude Code
# Restart Claude Code after changes to settings.json
```

## Troubleshooting

### MCP Server Not Found

1. Verify the path in settings.json is correct
2. Ensure the server is built: `npm run build`
3. Test manually: `node build/index.js`
4. Restart Claude Code/OpenCode

### Changelog Not Detected

The server searches for CHANGELOG.md in:
1. `./CHANGELOG.md`
2. `./.claude/CHANGELOG.md`
3. `./docs/CHANGELOG.md`

If using a different location, provide the `changelog_path` parameter.

### Git Commands Fail

Ensure you're in a git repository. The server gracefully handles non-git projects but won't auto-detect changes.

## License

MIT
