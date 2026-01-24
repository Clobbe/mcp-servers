# PRD Generator MCP Server

Generate Product Requirements Documents (PRDs) for software projects with structured input, templates, and validation.

## Features

### Tools

#### `prd_create`

Create a PRD from structured input with features, requirements, and technical details.

**Parameters:**

- `title` (required): Project name
- `description` (required): Project overview
- `features` (required): Array of features (min 1)
  - `name`: Feature name
  - `description`: Feature description
  - `priority`: 'high' | 'medium' | 'low' (default: 'medium')
- `requirements` (optional): Array of requirements
  - `description`: Requirement description
  - `priority`: 'must' | 'should' | 'could' (default: 'should')
- `technicalDetails` (optional): Technology stack
  - `languages`: Programming languages
  - `frameworks`: Frameworks and libraries
  - `databases`: Database systems
  - `infrastructure`: Infrastructure platforms
- `output_format`: 'markdown' | 'json' (default: 'markdown')

**Example:**

```typescript
prd_create({
  title: 'Task Management API',
  description: 'RESTful API for managing tasks and projects',
  features: [
    {
      name: 'User Authentication',
      description: 'JWT-based auth with OAuth2 support',
      priority: 'high',
    },
    {
      name: 'Task CRUD',
      description: 'Create, read, update, delete tasks',
      priority: 'high',
    },
  ],
  technicalDetails: {
    languages: ['TypeScript'],
    frameworks: ['Express', 'Prisma'],
    databases: ['PostgreSQL'],
  },
});
```

#### `prd_from_template`

Create a PRD from a pre-built template for common project types.

**Parameters:**

- `template` (required): Template type
  - `web-app`: Web application
  - `api-service`: RESTful API service
  - `mobile-app`: Mobile application
  - `library`: Reusable library/package
  - `full-stack`: Full-stack application
- `projectName` (required): Project name
- `output_format`: 'markdown' | 'json' (default: 'markdown')

**Example:**

```typescript
prd_from_template({
  template: 'web-app',
  projectName: 'TaskMaster',
});
```

**Templates Include:**

- **web-app**: User Auth, Responsive Design, Dashboard
- **api-service**: RESTful Endpoints, Authentication, DB Integration
- **mobile-app**: User Auth, Offline Support, Push Notifications
- **library**: Public API, Documentation, Testing
- **full-stack**: Frontend UI, Backend API, Database, Authentication

#### `prd_validate`

Validate PRD structure, completeness, and compatibility with ralph-workflow parser.

**Parameters:**

- `prd_content` (required): PRD markdown content
- `check_compatibility`: Check ralph-workflow compatibility (default: true)
- `output_format`: 'markdown' | 'json' (default: 'markdown')

**Validation Checks:**

- Title present (H1 heading)
- Description/Overview section exists
- At least 1 feature defined
- Ralph-workflow parser compatibility
- Technology detection

**Example:**

```typescript
prd_validate({
  prd_content: '# My Project\n\n## Description\n...',
  check_compatibility: true,
  output_format: 'markdown',
});
```

**Markdown Output Includes:**

- ✅ ⚠️ ❌ Status indicators
- Quality score (0-100)
- Errors, warnings, and info messages
- Statistics (sections, features, requirements, word count)
- Compatibility check results

## Installation

```bash
cd prd-generator
npm install
npm run build
```

## Configuration

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "prd-generator": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/prd-generator/build/index.js"]
    }
  }
}
```

### OpenCode

Add to `~/.opencode/settings.json`:

```json
{
  "mcpServers": {
    "prd-generator": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/prd-generator/build/index.js"]
    }
  }
}
```

### Gemini CLI

Add to `~/.gemini/config.json` (same structure as Claude Code)

## Integration with Ralph Workflow

Complete software development lifecycle:

```bash
# 1. Create PRD from template
prd_from_template({
  template: "web-app",
  projectName: "TaskMaster"
})
# → Generates PRD markdown

# 2. Validate PRD
prd_validate({ prd_content: "..." })
# → Returns validation report with ✅ Valid, Score: 95/100

# 3. Generate workflow (ralph-workflow)
ralph_from_prd({ prd_content: "..." })
# → Generates implementation workflow

# 4. Execute tasks (ralph-loop)
ralph_loop({ workflow_path: "./workflow.json" })
# → Executes workflow tasks
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Run tests (16 tests)
npm test

# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

## Architecture

```
prd-generator/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/
│   │   ├── prd-create.ts     # Create from structured input
│   │   ├── prd-from-template.ts # Create from template
│   │   └── prd-validate.ts   # Validate PRD
│   ├── utils/
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── prd-builder.ts    # Build markdown/JSON
│   │   ├── validator.ts      # Validation logic
│   │   └── templates.ts      # Template helper
│   └── templates/
│       ├── web-app.ts        # Web app template
│       ├── api-service.ts    # API service template
│       ├── mobile-app.ts     # Mobile app template
│       ├── library.ts        # Library template
│       └── full-stack.ts     # Full-stack template
└── __tests__/                # Comprehensive tests
```

## Code Reuse

Integrates with ralph-workflow for guaranteed compatibility:

- Reuses `parsePRD()` function from ralph-workflow
- Reuses `ParsedPRD`, `Feature`, `Requirement` types
- Same PRD markdown schema/format
- No schema drift

## Error Handling

All errors return technical messages:

- `title is required`
- `at least one feature is required`
- `invalid priority value`
- `output_format must be 'markdown' or 'json'`
- `prd_content is required`

## License

MIT
