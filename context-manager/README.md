# Context Manager MCP Server

A Model Context Protocol (MCP) server for managing context bundles - organized collections of code files for AI-assisted development.

## Features

- **Bundle Management** - Create, load, save, and merge context bundles
- **File Operations** - Add and remove files from bundles
- **Search** - Search content across all files in a bundle
- **Statistics** - Get detailed analytics about your bundles
- **Language Detection** - Automatic language detection for 30+ file types
- **Persistent Storage** - Bundles saved to `~/.mcp-context-bundles/`

## Installation

### Build from source

```bash
cd ~/dev/tooling/mcp-servers/context-manager
npm install
npm run build
```

### Configure in Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "context-manager": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/context-manager/build/index.js"]
    }
  }
}
```

## Available Tools

### `context_create_bundle`

Create a new context bundle to organize related files.

**Parameters:**

- `name` (required): Bundle name
- `description` (optional): Bundle description
- `files` (optional): Initial files to include (array of file paths)

**Example:**

```
Use context_create_bundle to create a new bundle called "authentication-feature"
Use context_create_bundle with name "api-refactor" and files ["src/api/routes.ts", "src/api/handlers.ts"]
```

**Output:**

```
✅ Created bundle "authentication-feature"

Files: 0
Total size: 0 bytes
```

---

### `context_add_file`

Add a file to an existing bundle.

**Parameters:**

- `bundle_name` (required): Target bundle name
- `file_path` (required): Path to file to add

**Example:**

```
Use context_add_file to add src/auth/login.ts to the "authentication-feature" bundle
```

**Output:**

```
✅ Added "src/auth/login.ts" to bundle "authentication-feature"

Total files: 1
Total size: 2,456 bytes
```

---

### `context_remove_file`

Remove a file from a bundle.

**Parameters:**

- `bundle_name` (required): Bundle name
- `file_path` (required): Path of file to remove

**Example:**

```
Use context_remove_file to remove src/auth/old-login.ts from "authentication-feature"
```

**Output:**

```
✅ Removed "src/auth/old-login.ts" from bundle "authentication-feature"

Remaining files: 4
Total size: 8,920 bytes
```

---

### `context_list_bundles`

List all available context bundles.

**Example:**

```
Use context_list_bundles to see all my bundles
```

**Output:**

```
📦 Found 3 bundles

- authentication-feature
  Files: 5
  Size: 12,450 bytes
  Description: User authentication implementation

- api-refactor
  Files: 12
  Size: 45,890 bytes

- database-migration
  Files: 8
  Size: 23,670 bytes
```

---

### `context_load_bundle`

Load and view the contents of a bundle.

**Parameters:**

- `bundle_name` (required): Bundle name to load

**Example:**

```
Use context_load_bundle to load the "authentication-feature" bundle
```

**Output:**

```
✅ Loaded bundle "authentication-feature"

Description: User authentication implementation

Total files: 5
Total size: 12,450 bytes
Created: 1/24/2026, 2:30:45 PM
Modified: 1/24/2026, 3:15:22 PM

Files:
- src/auth/login.ts (typescript, 2,456 bytes)
- src/auth/register.ts (typescript, 3,120 bytes)
- src/auth/middleware.ts (typescript, 1,890 bytes)
- src/auth/types.ts (typescript, 890 bytes)
- src/auth/utils.ts (typescript, 4,094 bytes)
```

---

### `context_save_bundle`

Save a bundle to a specific location on disk.

**Parameters:**

- `bundle_name` (required): Bundle to save
- `output_path` (optional): Output file path (default: `./{bundle_name}.json`)

**Example:**

```
Use context_save_bundle to save "authentication-feature" to ./context-backup.json
```

**Output:**

```
✅ Saved bundle "authentication-feature" to ./context-backup.json

Files: 5
Size: 15,678 bytes
```

---

### `context_merge_bundles`

Merge multiple bundles into a new bundle.

**Parameters:**

- `bundle_names` (required): Array of bundle names to merge
- `output_name` (required): Name for the merged bundle
- `description` (optional): Description for merged bundle

**Example:**

```
Use context_merge_bundles to merge "authentication-feature" and "user-profile" into "user-management"
```

**Output:**

```
✅ Merged 2 bundles into "user-management"

Source bundles: authentication-feature, user-profile
Total files: 12
Total size: 28,950 bytes
```

---

### `context_search_context`

Search for text within all files in a bundle.

**Parameters:**

- `bundle_name` (required): Bundle to search
- `query` (required): Search query
- `case_sensitive` (optional): Case-sensitive search (default: false)

**Example:**

```
Use context_search_context to search for "JWT" in the "authentication-feature" bundle
Use context_search_context for "password" in "user-management" with case_sensitive true
```

**Output:**

```
✅ Found 8 matches for "JWT"

src/auth/middleware.ts (3 matches):
  Line 12: import { verifyJWT } from './utils';
  Line 45: const token = verifyJWT(authHeader);
  Line 67: // Validate JWT signature

src/auth/utils.ts (5 matches):
  Line 8: export function generateJWT(payload: any): string {
  Line 23: export function verifyJWT(token: string): JWTPayload {
  ... and 3 more matches
```

---

### `context_get_stats`

Get detailed statistics about a bundle.

**Parameters:**

- `bundle_name` (required): Bundle name

**Example:**

```
Use context_get_stats for the "authentication-feature" bundle
```

**Output:**

```
📊 Statistics for "authentication-feature"

## Overview
Files: 5
Total Size: 12,450 bytes
Total Lines: 456
Largest File: src/auth/utils.ts (4,094 bytes)

## Languages
- typescript: 5 files (100.0%)

## Metadata
Created: 1/24/2026, 2:30:45 PM
Modified: 1/24/2026, 3:15:22 PM
```

---

## Usage Workflows

### Feature Development

Organize all files related to a feature:

```
1. Use context_create_bundle to create "payment-integration"
2. Use context_add_file multiple times to add relevant files
3. Use context_search_context to find specific implementations
4. Use context_get_stats to see the scope of changes
```

### Code Review

Prepare context for review:

```
1. Use context_create_bundle for "review-pr-123"
2. Add all changed files from the PR
3. Use context_save_bundle to share with reviewers
4. Use context_search_context to find specific patterns
```

### Refactoring

Track files during refactoring:

```
1. Use context_create_bundle for "refactor-api-layer"
2. Add files that need refactoring
3. Use context_get_stats to understand impact
4. Use context_merge_bundles if refactor touches multiple areas
```

### Documentation

Collect related documentation:

```
1. Use context_create_bundle for "onboarding-docs"
2. Add README files, guides, and examples
3. Use context_search_context to find specific topics
4. Use context_save_bundle to create shareable documentation package
```

## Bundle Storage

Bundles are stored in `~/.mcp-context-bundles/` as JSON files:

```
~/.mcp-context-bundles/
├── authentication-feature.json
├── api-refactor.json
└── database-migration.json
```

Each bundle contains:

- Bundle metadata (name, description, timestamps)
- Full file contents
- File metadata (path, language, size)

## Supported Languages

Automatic language detection for:

- TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`)
- Python (`.py`)
- Java (`.java`)
- C/C++ (`.c`, `.cpp`, `.h`, `.hpp`)
- C# (`.cs`)
- Go (`.go`)
- Rust (`.rs`)
- Ruby (`.rb`)
- PHP (`.php`)
- Swift (`.swift`)
- Kotlin (`.kt`)
- Scala (`.scala`)
- Markdown (`.md`)
- JSON (`.json`)
- YAML (`.yaml`, `.yml`)
- HTML/CSS (`.html`, `.css`, `.scss`)
- SQL (`.sql`)
- Shell scripts (`.sh`, `.bash`, `.zsh`)

## Development

### Project Structure

```
context-manager/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # Tool implementations
│   │   ├── create-bundle.ts
│   │   ├── add-file.ts
│   │   ├── remove-file.ts
│   │   ├── list-bundles.ts
│   │   ├── load-bundle.ts
│   │   ├── save-bundle.ts
│   │   ├── merge-bundles.ts
│   │   ├── search-context.ts
│   │   └── get-stats.ts
│   └── utils/                # Utilities
│       ├── types.ts          # Type definitions
│       ├── bundle-manager.ts # Bundle operations
│       └── file-loader.ts    # File loading
├── build/                    # Compiled output
└── README.md
```

### Building

```bash
npm run build       # Compile TypeScript
npm run watch       # Watch for changes
```

## Tips

1. **Organize by Feature**: Create bundles per feature for better organization
2. **Use Descriptive Names**: Bundle names should clearly indicate their purpose
3. **Regular Cleanup**: Remove outdated bundles with `rm ~/.mcp-context-bundles/old-bundle.json`
4. **Merge for Reviews**: Combine related bundles before code reviews
5. **Search First**: Use search to verify files before adding duplicates

## Troubleshooting

### MCP Server Not Found

1. Verify the path in settings.json is correct
2. Ensure the server is built: `npm run build`
3. Test manually: `node build/index.js`
4. Restart Claude Code/OpenCode

### Bundle Not Found

- Check `~/.mcp-context-bundles/` directory exists
- Verify bundle name is correct (case-sensitive)
- List all bundles with `context_list_bundles`

### File Not Added

- Verify file path exists and is readable
- Check file permissions
- Ensure path is absolute or relative to current directory

## License

MIT
