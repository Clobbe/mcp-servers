/**
 * Add File Tool
 */

import { addFileToBundle } from '../utils/bundle-manager.js';
import { loadFile } from '../utils/file-loader.js';

export const addFileSchema = {
  name: 'context_add_file',
  description: 'Add file to context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: {
        type: 'string',
        description: 'Bundle name',
      },
      file_path: {
        type: 'string',
        description: 'Path to file to add',
      },
    },
    required: ['bundle_name', 'file_path'],
  },
};

interface AddFileArgs {
  bundle_name: string;
  file_path: string;
}

interface AddFileResult {
  summary: string;
}

export async function addFileTool(args: AddFileArgs): Promise<AddFileResult> {
  try {
    const file = await loadFile(args.file_path);
    const bundle = await addFileToBundle(args.bundle_name, file);

    return {
      summary:
        `✅ Added "${args.file_path}" to bundle "${args.bundle_name}"\n\n` +
        `Total files: ${bundle.files.length}\n` +
        `Total size: ${bundle.metadata.totalSize} bytes`,
    };
  } catch (error) {
    return {
      summary: `❌ Error adding file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
