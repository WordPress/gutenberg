# Contributing

This document contains information you might need to know when extending or debugging Style Engine code.

## Workflow and build tooling

The Style Engine PHP and Javascript (JS) files exist inside the `style-engine` package. 

In order to use the Style Engine in the Block Editor, these files must be compiled (in the case of JS) and copied to the  build folder.

When running the `npm run dev` script for example, webpack watches out for changes and will recompile/copy files as necessary if any changes are detected according to the rules in  [packages webpack config](https://github.com/WordPress/gutenberg/tree/HEAD/tools/webpack/packages.js).

No other configuration is required for JS: webpack will compile and export the Style Engine code as it does with all dependencies listed in [package.json](https://github.com/WordPress/gutenberg/tree/HEAD/package.json).

The PHP files for packages, however, have a couple of extra steps during the build process:

1. Functions with the `wp_` prefix are replaced with `gutenberg_`. So, for example, `wp_some_function` becomes `gutenberg_some_function` in the build directory. The reason for this is so that the Block Editor can call Style Engine functions that may have evolved since, or have not yet been included in, any WordPress release.
2. 

## Testing
