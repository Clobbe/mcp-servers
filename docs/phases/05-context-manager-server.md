# Phase 5: Context Manager Server

**Timeline**: Day 2 Afternoon (2 hours)
**Focus**: Context bundle management and loading

## Objectives

- Implement 9 context management tools
- JSON parsing and bundle management
- File operations and context loading
- Comprehensive tests

## Tools to Implement (9 total)

### 1. `context_create_bundle` - Create new context bundle

### 2. `context_add_file` - Add file to context

### 3. `context_remove_file` - Remove file from context

### 4. `context_list_bundles` - List available bundles

### 5. `context_load_bundle` - Load context bundle

### 6. `context_save_bundle` - Save context bundle

### 7. `context_merge_bundles` - Merge multiple bundles

### 8. `context_search_context` - Search within context

### 9. `context_get_stats` - Get context statistics

## Directory Structure

```
context-manager/
├── src/
│   ├── index.ts
│   ├── tools/
│   │   ├── create-bundle.ts
│   │   ├── add-file.ts
│   │   ├── remove-file.ts
│   │   ├── list-bundles.ts
│   │   ├── load-bundle.ts
│   │   ├── save-bundle.ts
│   │   ├── merge-bundles.ts
│   │   ├── search-context.ts
│   │   └── get-stats.ts
│   └── utils/
│       ├── types.ts
│       ├── bundle-manager.ts
│       └── file-loader.ts
└── __tests__/
```

## Tool Schemas

```typescript
// Context bundle structure
export interface ContextBundle {
  name: string;
  description: string;
  files: ContextFile[];
  metadata: {
    created: string;
    modified: string;
    totalSize: number;
    fileCount: number;
  };
}

export interface ContextFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

// Tool 1: Create Bundle
export const createBundleSchema = {
  name: 'context_create_bundle',
  description: 'Create a new context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      files: { type: 'array', items: { type: 'string' } },
    },
    required: ['name'],
  },
};

// Tool 2: Add File
export const addFileSchema = {
  name: 'context_add_file',
  description: 'Add file to context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: { type: 'string' },
      file_path: { type: 'string' },
    },
    required: ['bundle_name', 'file_path'],
  },
};

// Tool 3: Remove File
export const removeFileSchema = {
  name: 'context_remove_file',
  description: 'Remove file from context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: { type: 'string' },
      file_path: { type: 'string' },
    },
    required: ['bundle_name', 'file_path'],
  },
};

// Tool 4: List Bundles
export const listBundlesSchema = {
  name: 'context_list_bundles',
  description: 'List all available context bundles',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

// Tool 5: Load Bundle
export const loadBundleSchema = {
  name: 'context_load_bundle',
  description: 'Load a context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: { type: 'string' },
    },
    required: ['bundle_name'],
  },
};

// Tool 6: Save Bundle
export const saveBundleSchema = {
  name: 'context_save_bundle',
  description: 'Save context bundle to disk',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: { type: 'string' },
      output_path: { type: 'string' },
    },
    required: ['bundle_name'],
  },
};

// Tool 7: Merge Bundles
export const mergeBundlesSchema = {
  name: 'context_merge_bundles',
  description: 'Merge multiple context bundles',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_names: { type: 'array', items: { type: 'string' } },
      output_name: { type: 'string' },
    },
    required: ['bundle_names', 'output_name'],
  },
};

// Tool 8: Search Context
export const searchContextSchema = {
  name: 'context_search_context',
  description: 'Search within context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: { type: 'string' },
      query: { type: 'string' },
      case_sensitive: { type: 'boolean', default: false },
    },
    required: ['bundle_name', 'query'],
  },
};

// Tool 9: Get Stats
export const getStatsSchema = {
  name: 'context_get_stats',
  description: 'Get statistics about context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: { type: 'string' },
    },
    required: ['bundle_name'],
  },
};
```

## Commit Strategy (27 commits)

```bash
# Utilities
git commit -m "feat: add context bundle types"
git commit -m "feat: add bundle manager utility"
git commit -m "feat: add file loader utility"

# Tools (3 commits each x 9 tools = 27)
git commit -m "feat: implement context_create_bundle"
git commit -m "test: add tests for create_bundle"
git commit -m "feat: register create_bundle in server"

# ... repeat for all 9 tools

# Final
git commit -m "docs: add README for context-manager"
git commit -m "test: verify 80%+ coverage"
```

## Time Breakdown

- Shared utilities: 30 min
- Tools 1-3 + tests: 30 min
- Tools 4-6 + tests: 30 min
- Tools 7-9 + tests: 20 min
- Integration: 5 min
- Documentation: 5 min
- **Total**: ~2 hours

## Next Steps

Proceed to [Phase 6: Ollama Integration](06-ollama-integration.md)
