/**
 * Remove File Tool
 */

import { removeFileFromBundle } from '../utils/bundle-manager.js';

export const removeFileSchema = {
  name: 'context_remove_file',
  description: 'Remove file from context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: {
        type: 'string',
        description: 'Bundle name',
      },
      file_path: {
        type: 'string',
        description: 'Path of file to remove',
      },
    },
    required: ['bundle_name', 'file_path'],
  },
};

interface RemoveFileArgs {
  bundle_name: string;
  file_path: string;
}

interface RemoveFileResult {
  summary: string;
}

export async function removeFileTool(args: RemoveFileArgs): Promise<RemoveFileResult> {
  try {
    const bundle = await removeFileFromBundle(args.bundle_name, args.file_path);

    return {
      summary:
        `✅ Removed "${args.file_path}" from bundle "${args.bundle_name}"\n\n` +
        `Remaining files: ${bundle.files.length}\n` +
        `Total size: ${bundle.metadata.totalSize} bytes`,
    };
  } catch (error) {
    return {
      summary: `❌ Error removing file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
