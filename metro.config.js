const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'mjs' to the list of source extensions
config.resolver.sourceExts.push('mjs');

// Force Metro to use the CJS version of tslib instead of the ESM version
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return context.resolveRequest(context, 'tslib/tslib.js', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
