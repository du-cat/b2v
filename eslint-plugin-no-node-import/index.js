/**
 * ESLint plugin to prevent importing Node.js-specific modules in browser code
 */

module.exports = {
  rules: {
    "no-node-import": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow importing Node.js-specific modules in browser code",
          category: "Possible Errors",
          recommended: true
        },
        fixable: null,
        schema: [
          {
            type: "object",
            properties: {
              allowedFiles: {
                type: "array",
                items: { type: "string" }
              },
              disallowedImports: {
                type: "array",
                items: { type: "string" }
              }
            },
            additionalProperties: false
          }
        ],
        messages: {
          noNodeImport: "Importing Node.js-specific module '{{moduleName}}' is not allowed in browser code. Use this only in Node.js scripts."
        }
      },
      create(context) {
        const options = context.options[0] || {};
        const allowedFiles = options.allowedFiles || ["scripts/**/*", "vite.config.ts"];
        const disallowedImports = options.disallowedImports || [
          "fs", "path", "os", "child_process", "crypto", "http", "https", 
          "net", "dgram", "dns", "stream", "util", "events", "assert",
          "dotenv", "node-fetch"
        ];
        
        // Check if current file is in allowed list
        const isAllowedFile = (filePath) => {
          return allowedFiles.some(pattern => {
            if (pattern.includes('*')) {
              const regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*\*/g, '.*')
                .replace(/\*/g, '[^/]*');
              return new RegExp(regexPattern).test(filePath);
            }
            return filePath.includes(pattern);
          });
        };
        
        return {
          ImportDeclaration(node) {
            const filePath = context.getFilename();
            
            // Skip checking for allowed files
            if (isAllowedFile(filePath)) {
              return;
            }
            
            const importSource = node.source.value;
            
            // Check if import is a Node.js module
            const isNodeModule = disallowedImports.some(module => {
              if (typeof importSource === 'string') {
                return importSource === module || 
                       importSource.startsWith(`${module}/`) ||
                       importSource === `node:${module}`;
              }
              return false;
            });
            
            if (isNodeModule) {
              context.report({
                node,
                messageId: "noNodeImport",
                data: {
                  moduleName: importSource
                }
              });
            }
          }
        };
      }
    }
  }
};