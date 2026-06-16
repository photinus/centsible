const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Enable CSS support for web
config.resolver.sourceExts.push('css');

// ─── Fix: import.meta in Zustand's ESM builds ────────────────────────────────
// Metro's package-exports resolver always injects the "import" condition when
// the importing file uses ES `import` syntax (isESMImport === true). Zustand's
// exports map has "import" → ./esm/index.mjs BEFORE "default" → ./index.js,
// so "import" wins and Metro loads the ESM build. That build uses
// `import.meta.env` throughout — a syntax the Hermes web transformer does not
// handle — landing raw in the bundle and crashing the browser with:
//   "Cannot use 'import.meta' outside a module"
//
// Fix: use a custom resolveRequest to bypass exports resolution for Zustand on
// web and point directly at the CJS build files in the package root.
const zustandRoot = path.dirname(require.resolve('zustand/package.json'));

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
      const subpath = moduleName === 'zustand'
        ? 'index'
        : moduleName.slice('zustand/'.length);
      const cjsPath = path.join(zustandRoot, subpath + '.js');
      // Only override if the CJS file actually exists; otherwise let Metro
      // fall through to its default resolver (catches unknown sub-paths).
      if (fs.existsSync(cjsPath)) {
        return { type: 'sourceFile', filePath: cjsPath };
      }
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

// ─── Prefer browser CJS builds for packages with nested exports ──────────────
// Keeps Firebase resolving to browser/require (CJS) instead of ESM on web.
config.resolver.unstable_conditionNames = ['browser', 'require', 'default'];

module.exports = config;
