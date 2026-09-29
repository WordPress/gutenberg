# Migrating to ESLint v10 with `@wordpress/eslint-plugin`

`@wordpress/eslint-plugin` has been upgraded to support ESLint v10 with flat config. This guide covers how to migrate your project.

## Upstream ESLint migration resources

If you are also upgrading ESLint itself (e.g., coming from ESLint v8), the ESLint project publishes per-version migration guides that complement this document:

-   [Migrate to v9.x](https://eslint.org/docs/latest/use/migrate-to-9.0.0) — flat config as default, removal of legacy formatters, Node.js version requirements, and more.
-   [Migrate to v10.x](https://eslint.org/docs/latest/use/migrate-to-10.0.0) — complete removal of eslintrc, removal of `/* eslint-env */` comments, and other breaking changes.

If you are jumping straight from ESLint v8 to v10, you need to follow **both** upstream guides in order (v8 → v9 → v10), since v10 assumes you have already addressed the v9 breaking changes.

## TL;DR — Breaking changes by ESLint version

### v8 → v9

-   Flat config (`eslint.config.*`) becomes the default, but `.eslintrc.*` is still supported as a fallback.
-   Node.js `^18.18.0 || ^20.9.0 || >=21.1.0` is required.
-   Several formatters moved out of core into separate packages.
-   Some rules were removed or had their defaults changed (see the upstream [v9 migration guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)).

### v9 → v10

-   **`.eslintrc.*` is no longer supported at all** — flat config is mandatory.
-   `/* eslint-env */` comments are no longer supported — configure globals via `languageOptions.globals`.
-   The `--ignore-path` CLI flag was removed — use `ignores` in your flat config.
-   Various rule default changes (see the upstream [v10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)).

### `@wordpress/eslint-plugin` specific changes

-   **Flat config is the default.** The plugin now exports flat config arrays instead of eslintrc objects.
-   **Minimum ESLint version** is `^9.0.0 || ^10.0.0`.
-   **Rule prefix change:** `eslint-comments/*` → `@eslint-community/eslint-comments/*`.
-   **TypeScript ESLint** upgraded from `@typescript-eslint/*` v6 to v8 via the unified `typescript-eslint` package.
-   **`wp-scripts lint-js`** now defaults to flat config detection. The default config path changed from `config/.eslintrc.js` to `config/eslint.config.cjs`.

## Migration steps

### 1. Replace your config file

Replace your `.eslintrc.*` file with `eslint.config.mjs`:

```js
// OLD — .eslintrc.js
module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
};

// NEW — eslint.config.mjs
import wordpress from '@wordpress/eslint-plugin';

export default [ ...wordpress.configs.recommended ];
```

### 2. Convert `overrides` to flat config objects

In eslintrc, you used `overrides` to apply rules to specific files. In flat config, each override becomes a separate config object with a `files` pattern:

```js
// OLD — .eslintrc.js
module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	overrides: [
		{
			files: [ '*.test.js' ],
			rules: {
				'no-console': 'off',
			},
		},
	],
};

// NEW — eslint.config.mjs
import wordpress from '@wordpress/eslint-plugin';

export default [
	...wordpress.configs.recommended,
	{
		files: [ '**/*.test.js' ],
		rules: {
			'no-console': 'off',
		},
	},
];
```

Note that flat config `files` patterns are relative to the config file location, and globs like `*.test.js` only match the current directory. Use `**/*.test.js` to match recursively.

### 3. Replace `env` with `languageOptions.globals`

The `env` key is not supported in flat config. Use the [`globals`](https://www.npmjs.com/package/globals) package instead:

```bash
npm install globals --save-dev
```

```js
// OLD — .eslintrc.js
module.exports = {
	env: {
		browser: true,
		node: true,
	},
};

// NEW — eslint.config.mjs
import globals from 'globals';

export default [
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
];
```

### 4. Move `.eslintignore` to config

Delete your `.eslintignore` file and add the patterns to your config:

```js
// eslint.config.mjs
import wordpress from '@wordpress/eslint-plugin';

export default [
	{
		ignores: [ 'build/', 'vendor/', 'node_modules/' ],
	},
	...wordpress.configs.recommended,
];
```

Note: the `ignores` object should come **before** other config objects to apply globally.

### 5. Update inline comments

#### Rule prefix changes

`eslint-plugin-eslint-comments` has been replaced with `@eslint-community/eslint-plugin-eslint-comments`. Update any inline disable comments:

```diff
- /* eslint-disable eslint-comments/no-unlimited-disable */
+ /* eslint-disable @eslint-community/eslint-comments/no-unlimited-disable */
```

To find all occurrences in your project:

```bash
grep -r "eslint-comments/" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" .
```

#### Remove `/* eslint-env */` comments

ESLint v10 no longer supports `/* eslint-env */` comments. Remove them and configure globals in your config file instead (see step 3).

```diff
- /* eslint-env browser */
```

### 6. Convert `plugins` to direct imports

If you used additional plugins, import them directly:

```js
// OLD — .eslintrc.js
module.exports = {
	plugins: [ 'my-plugin' ],
	rules: {
		'my-plugin/some-rule': 'error',
	},
};

// NEW — eslint.config.mjs
import myPlugin from 'eslint-plugin-my-plugin';

export default [
	{
		plugins: {
			'my-plugin': myPlugin,
		},
		rules: {
			'my-plugin/some-rule': 'error',
		},
	},
];
```

## For `wp-scripts lint-js` users

### What changed

-   `wp-scripts lint-js` now detects `eslint.config.*` files first. If found, it uses flat config mode.
-   If no flat config is found, it falls back to `.eslintrc.*` files. **This fallback is deprecated** and will be removed in a future version.
-   The default config path shipped with `wp-scripts` changed from `config/.eslintrc.js` to `config/eslint.config.cjs`.
-   The `--ignore-path` CLI flag was removed along with the eslintrc system. Use `ignores` arrays in your flat config instead.

### Migrating a custom `wp-scripts` config

If you were extending the default `wp-scripts` ESLint config:

```js
// OLD — .eslintrc.js
const defaultConfig = require( '@wordpress/scripts/config/.eslintrc' );

module.exports = {
	...defaultConfig,
	rules: {
		...defaultConfig.rules,
		'no-console': 'off',
	},
};

// NEW — eslint.config.cjs
const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...defaultConfig,
	{
		rules: {
			'no-console': 'off',
		},
	},
];
```

## Temporary eslintrc compatibility wrapper

If you are using ESLint v9 and are not ready to migrate to flat config, a compatibility wrapper is available:

```js
// .eslintrc.js
const wordpress = require( '@wordpress/eslint-plugin/eslintrc' );

module.exports = wordpress.configs.recommended;
```

All config presets are available (e.g., `wordpress.configs.esnext`, `wordpress.configs[ 'recommended-with-formatting' ]`).

> **This wrapper is deprecated** and will be removed in the next major version. ESLint v10 does not support `.eslintrc.*` files at all. We strongly recommend migrating to flat config.

## TypeScript ESLint changes

`@typescript-eslint/*` has been upgraded from v6 to v8 via the unified `typescript-eslint` package. Most rules remain the same, but some defaults may have changed. See the [typescript-eslint v8 announcement](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8/) for details.

If you were referencing `@typescript-eslint` rules directly in your config, they should continue to work without changes.

## Troubleshooting

### "ESLintrc configuration objects are no longer supported"

You are running ESLint v10 with an `.eslintrc.*` file. ESLint v10 only supports flat config. Migrate your config to `eslint.config.mjs` following the steps above.

### "Cannot find module '@wordpress/eslint-plugin/eslintrc'"

The eslintrc wrapper requires `@wordpress/eslint-plugin` v25+. Update your dependency:

```bash
npm install @wordpress/eslint-plugin@latest --save-dev
```

### "Definition for rule 'eslint-comments/...' was not found"

The rule prefix changed to `@eslint-community/eslint-comments/*`. Update your inline comments and any custom rule configurations to use the new prefix.

### Flat config not being detected by `wp-scripts`

Ensure your config file is named `eslint.config.mjs`, `eslint.config.cjs`, or `eslint.config.js` in your project root. Other names or locations are not auto-detected.
