# Contributing

This document contains information you might need to know when extending or debugging Style Engine code.

## Workflow and build tooling

The Style Engine PHP and Javascript (JS) files exist inside the `style-engine` package. 

In order to use the Style Engine in the Block Editor, these files must be compiled (in the case of JS) and copied to the build folder.

When running the `npm run dev` script for example, webpack watches out for changes and will recompile/copy files as necessary if any changes are detected according to the rules in the [packages webpack config](https://github.com/WordPress/gutenberg/tree/HEAD/tools/webpack/packages.js).

No other configuration is required for JS: webpack will compile and export the Style Engine code as it does with all dependencies listed in [package.json](https://github.com/WordPress/gutenberg/tree/HEAD/package.json).

The PHP files for packages, however, have a couple of extra steps during the build process:

1. Functions with the `wp_` prefix are replaced with `gutenberg_`. So, for example, `wp_some_function` becomes `gutenberg_some_function` in the build directory. The reason for this is so that the Block Editor can call Style Engine functions that may have evolved since, or have not yet been included in, any WordPress release.
2. For the same reasons, classes are given a `_Gutenberg` suffix: `WP_Style_Engine` becomes `WP_Style_Engine_Gutenberg`. The [packages webpack config](https://github.com/WordPress/gutenberg/tree/HEAD/tools/webpack/packages.js) contains a static list of PHP classes (`bundledPackagesPhpConfig`) that have to be copied and renamed during build. If you create a new PHP class in the Style Engine package, you should add your class name to the `replaceClasses` array.

Remember: all PHP functions and methods inside the Style Engine package should use `wp_/WP_` prefixes. Usage outside of the package in Gutenberg can reference the `gutenberg` prefixes or suffixes from the built files.

When updating existing PHP functions or methods, it's important to check the Block Editor codebase for calls to the equivalent `wp_` functions or classes as they may have to be updated to refer to `gutenberg_` or `_Gutenberg` in order for the updates to take effect.

## Testing

[JS unit tests](https://github.com/WordPress/gutenberg/tree/HEAD/packages/style-engine/src/test) are stored next to the source code in the `style-engine` package directory.

To start the JS unit tests, run:

`npm run test:unit packages/style-engine/src/test/`

[PHP unit tests](https://github.com/WordPress/gutenberg/tree/HEAD/phpunit/style-engine) are located in the root `phpunit` directory. 

In order to test the latest version of the Style Engine and avoid conflicts with existing Core equivalents, all PHP unit tests call the `gutenberg_` functions and `_Gutenberg` classes. 

Therefore, Style Engine PHP source files should be parsed and copied to the build folder before running tests. During development, this will happen as part of the `npm run dev` script. You can also trigger a build by executing `npm run build`.

To start the PHP unit tests, run:

`npm run test:unit:php -- --group style-engine`
