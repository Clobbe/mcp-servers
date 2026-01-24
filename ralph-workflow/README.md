# Ralph Workflow MCP Server

Automated workflow generation from Product Requirements Documents (PRDs) using the RALPH methodology.

## Features

### Tools

#### `ralph_from_prd`

Generate a structured implementation workflow from a PRD document.

**Parameters:**

- `prd_content` (required): PRD content in markdown format
- `output_format` (optional): Output format - "markdown" or "json" (default: "markdown")

**Returns:**

- Structured workflow with phases and tasks
- Technology stack detection
- Estimated time for each task
- Validation steps for critical features

**Example:**

```typescript
const result = await ralph_from_prd({
  prd_content: `
# E-Commerce Platform

## Description
A modern e-commerce platform...

## Features
- **Product Catalog**: Browse and search products
- **Shopping Cart**: Add items and checkout

## Technical Details
Built with TypeScript and React.
PostgreSQL database.
  `,
  output_format: 'markdown',
});
```

#### `ralph_loop`

Execute workflow tasks iteratively with progress tracking.

**Parameters:**

- `workflow_path` (required): Path to workflow JSON file
- `max_iterations` (optional): Maximum number of iterations (default: 10)
- `auto_commit` (optional): Automatically commit after each task (default: false)

**Returns:**

- Execution results with task status
- Progress tracking
- Completed/failed task counts

## Technology Detection

The server automatically detects technologies mentioned in your PRD:

- **Languages**: TypeScript, JavaScript, Python, Go, Rust, Java
- **Frameworks**: React, Next.js, Vue, Angular, Express, FastAPI, Django, Flask
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, SQLite, DynamoDB
- **Infrastructure**: Docker, Kubernetes, AWS, GCP, Azure, Vercel, Netlify
- **Tools**: Git, GitHub, GitLab, Jest, Playwright, ESLint, Prettier, Webpack, Vite

## Workflow Structure

Generated workflows include these phases:

1. **Project Setup**: Initialize project structure and development environment
2. **Core Features**: Implement high-priority features with validation
3. **Enhanced Features**: Implement medium-priority features
4. **Additional Features**: Implement low-priority features
5. **Testing & QA**: Comprehensive testing with coverage requirements
6. **Deployment**: Build and deploy to production

## Installation

```bash
cd ralph-workflow
npm install
npm run build
```

## Usage with Claude Code

Add to your `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/ralph-workflow/build/index.js"]
    }
  }
}
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Run tests
npm test

# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

## Example Workflow

Given a PRD for an e-commerce platform:

```markdown
# E-Commerce Platform

## Features

- **Product Catalog**: Browse products with search and filters (high priority)
- **Shopping Cart**: Add/remove items (must have)
- **Payment Processing**: Secure checkout (critical)

## Technical Details

TypeScript with React and Next.js
PostgreSQL database
Deployed on AWS
```

The server generates:

- **Technology Stack**: TypeScript, React, Next.js, PostgreSQL, AWS
- **4 Phases** with specific tasks
- **Estimated times** for each task
- **Validation steps** for critical features
- **Commands** to run for setup and deployment

## Architecture

```
ralph-workflow/
├── src/
│   ├── index.ts              # MCP server entry
│   ├── tools/
│   │   ├── ralph-from-prd.ts # PRD → Workflow converter
│   │   └── ralph-loop.ts     # Iterative executor
│   └── utils/
│       ├── types.ts          # TypeScript interfaces
│       ├── tech-detector.ts  # Technology detection
│       ├── prd-parser.ts     # PRD parsing
│       └── task-generator.ts # Task generation
└── __tests__/               # Comprehensive tests
```

## License

MIT
