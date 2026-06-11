/**
 * External dependencies
 */
import { createRequire } from 'module';
import { join, resolve } from 'path';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments';
import storybookPlugin from 'eslint-plugin-storybook';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import rawJestDomPlugin from 'eslint-plugin-jest-dom';
import rawTestingLibraryPlugin from 'eslint-plugin-testing-library';
import jestPlugin from 'eslint-plugin-jest';
import tseslint from 'typescript-eslint';
import wpBuildConfig from '../../packages/wp-build/eslint-overrides.cjs';

// Wrap plugins that don't yet support ESLint v10's rule context API.
const jestDomPlugin = {
	...rawJestDomPlugin,
	rules: fixupPluginRules( rawJestDomPlugin ).rules,
};
const testingLibraryPlugin = {
	...rawTestingLibraryPlugin,
	rules: fixupPluginRules( rawTestingLibraryPlugin ).rules,
};

const require = createRequire( import.meta.url );
const rootDir = resolve( import.meta.dirname, '../..' );
const wpPlugin = require( '@wordpress/eslint-plugin' );

/**
 * ESLint v10 forbids redefining a plugin under the same key unless the
 * reference is strictly identical. Because the @wordpress/eslint-plugin
 * configs are assembled from separate sub-configs that each carry their own
 * copy of the plugin object, we normalise them here so that every occurrence
 * of the same plugin name resolves to a single shared reference.
 *
 * @param {Object[]} configs Flat config array.
 * @return {Object[]} The same array with plugin references deduplicated.
 */
function dedupePlugins( configs ) {
	/** @type {Record<string,Object>} */
	const seen = Object.create( null );
	for ( const config of configs ) {
		if ( ! config.plugins ) {
			continue;
		}
		for ( const name of Object.keys( config.plugins ) ) {
			if ( name in seen ) {
				config.plugins[ name ] = seen[ name ];
			} else {
				seen[ name ] = config.plugins[ name ];
			}
		}
	}
	return configs;
}

/**
 * The list of patterns matching files used only for development purposes.
 *
 * @type {string[]}
 */
const developmentFiles = [
	'**/benchmark/**/*.js',
	'**/@(__mocks__|__tests__|test)/**/*.[tj]s?(x)',
	'**/@(storybook|stories)/**/*.[tj]s?(x)',
	'packages/babel-preset-default/bin/**/*.js',
	'packages/theme/bin/**/*.[tj]s?(x)',
	'packages/theme/terrazzo.config.ts',
];

// All files from packages that have types provided with TypeScript.
const glob = require( 'glob' ).sync;
const typedFiles = glob( 'packages/*/package.json', { cwd: rootDir } )
	.filter( ( fileName ) => require( join( rootDir, fileName ) ).types )
	.map( ( fileName ) => fileName.replace( 'package.json', '**/*.js' ) );

const restrictedImports = [
	{
		name: 'framer-motion',
		message:
			'Please use the Framer Motion API through `@wordpress/components` instead.',
	},
	{
		name: 'lodash',
		message: 'Please use native functionality instead.',
	},
	{
		name: '@ariakit/react',
		message:
			'Please use Ariakit API through `@wordpress/components` instead.',
	},
	{
		name: 'redux',
		importNames: [ 'combineReducers' ],
		message: 'Please use `combineReducers` from `@wordpress/data` instead.',
	},
	{
		name: '@emotion/css',
		message:
			'Please use `@emotion/react` and `@emotion/styled` in order to maintain iframe support. As a replacement for the `cx` function, please use the `useCx` hook defined in `@wordpress/components` instead.',
	},
	{
		name: '@wordpress/edit-post',
		message:
			"edit-post is a WordPress top level package that shouldn't be imported into other packages",
	},
	{
		name: '@wordpress/edit-site',
		message:
			"edit-site is a WordPress top level package that shouldn't be imported into other packages",
	},
	{
		name: '@wordpress/edit-widgets',
		message:
			"edit-widgets is a WordPress top level package that shouldn't be imported into other packages",
	},
	{
		name: 'classnames',
		message:
			"Please use `clsx` instead. It's a lighter and faster drop-in replacement for `classnames`.",
	},
	{
		name: '@base-ui/react',
		message:
			'Avoid using Base UI directly. Consider a new `@wordpress/ui` component instead.',
	},
];

// Common `no-restricted-imports` configuration for `@wordpress/ui` paths,
// which occur across multiple override configs. The exclusion here allows
// Base UI to be imported directly in `@wordpress/ui`, which is the intended
// abstraction layer for BaseUI components.
const UI_RESTRICTED_IMPORTS = {
	paths: restrictedImports.filter(
		( { name } ) => name !== '@base-ui/react'
	),
	patterns: [],
};

const restrictedSyntax = [
	{
		selector:
			'CallExpression[callee.object.name="page"][callee.property.name="waitFor"]',
		message:
			'This method is deprecated. You should use the more explicit API methods available.',
	},
	{
		selector:
			'CallExpression[callee.object.name="page"][callee.property.name="waitForTimeout"]',
		message: 'Prefer page.waitForSelector instead.',
	},
	{
		selector: 'JSXAttribute[name.name="id"][value.type="Literal"]',
		message: 'Do not use string literals for IDs; use useId hook instead.',
	},
	{
		selector: 'JSXAttribute[name.name="__nextHasNoMarginBottom"]',
		message: 'The `__nextHasNoMarginBottom` prop is no longer needed.',
	},
	{
		selector:
			'CallExpression[callee.name="withDispatch"] > :function > BlockStatement > :not(VariableDeclaration,ReturnStatement)',
		message:
			'withDispatch must return an object with consistent keys. Avoid performing logic in `mapDispatchToProps`.',
	},
	{
		selector:
			'LogicalExpression[operator="&&"][left.property.name="length"][right.type="JSXElement"]',
		message:
			'Avoid truthy checks on length property rendering, as zero length is rendered verbatim.',
	},
	{
		selector:
			'CallExpression[callee.name=/^(__|_x|_n|_nx)$/] > Literal[value=/toggle\\b/i]',
		message: "Avoid using the verb 'Toggle' in translatable strings",
	},
	{
		selector:
			'CallExpression[callee.name=/^(__|_x|_n|_nx)$/] > Literal[value=/(?<![-\\w])sidebar(?![-\\w])/i]',
		message:
			"Avoid using the word 'sidebar' in translatable strings. Consider using 'panel' instead.",
	},
];

export default dedupePlugins( [
	// Global ignores (replaces .eslintignore).
	{
		ignores: [
			'**/.cache/**',
			'**/build/**',
			'**/build-module/**',
			'**/build-types/**',
			'**/build-wp/**',
			'**/node_modules/**',
			'packages/block-serialization-spec-parser/parser.js',
			'packages/global-styles-ui/src/font-library/lib/**',
			'packages/icons/src/library/*.tsx',
			'packages/vips/src/worker-code.ts',
			'**/vendor/**',
			// Generated by @wordpress/create-block during CI build tests.
			'example-*/',
		],
	},

	// Base recommended config from @wordpress/eslint-plugin.
	...wpPlugin.configs.recommended,

	// eslint-comments recommended (manually converted to flat config).
	{
		plugins: {
			'@eslint-community/eslint-comments': eslintCommentsPlugin,
		},
		rules: eslintCommentsPlugin.configs.recommended.rules,
	},

	// Storybook recommended (array of 3).
	...storybookPlugin.configs[ 'flat/recommended' ],

	// React Hooks recommended-latest (includes React Compiler rules).
	reactHooksPlugin.configs.flat[ 'recommended-latest' ],

	// Global settings applicable to all files.
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'error',
		},
		languageOptions: {
			globals: {
				wp: 'off',
				globalThis: 'readonly',
			},
		},
		settings: {
			jsdoc: {
				mode: 'typescript',
			},
			'import/resolver': require.resolve( './import-resolver.cjs' ),
		},
		rules: {
			'react/jsx-boolean-value': 'error',
			'react/jsx-curly-brace-presence': [
				'error',
				{ props: 'never', children: 'never' },
			],
			'@wordpress/wp-global-usage': 'error',
			'@wordpress/react-no-unsafe-timeout': 'error',
			'@wordpress/i18n-hyphenated-range': 'error',
			'@wordpress/i18n-no-flanking-whitespace': 'error',
			'@wordpress/i18n-text-domain': [
				'error',
				{
					allowedTextDomain: 'default',
				},
			],
			'@wordpress/no-unsafe-wp-apis': 'off',
			'@wordpress/data-no-store-string-literals': 'error',
			'@wordpress/use-recommended-components': 'error',
			'@wordpress/use-import-as': [
				'error',
				{
					'@wordpress/components': {
						__experimentalText: 'WCText',
						// wp-ui Autocomplete is not a replacement for wp-components Autocomplete, but we need to avoid name clashes.
						Autocomplete: 'WCAutocomplete',
						Badge: 'WCBadge',
						Icon: 'WCIcon',
						Tooltip: 'WCTooltip',
					},
				},
			],
			'import/default': 'error',
			'import/named': 'error',
			'no-restricted-imports': [
				'error',
				{
					paths: restrictedImports,
				},
			],
			// Note: @typescript-eslint/no-restricted-imports and
			// @typescript-eslint/consistent-type-imports are scoped to
			// TS files below since they require the TypeScript parser.
			'no-restricted-syntax': [ 'error', ...restrictedSyntax ],
			'jsdoc/check-tag-names': [
				'error',
				{
					definedTags: [ 'jest-environment' ],
				},
			],
			'react-hooks/config': [
				'error',
				{
					environment: {
						enableTreatRefLikeIdentifiersAsRefs: true,
						validateRefAccessDuringRender: false,
					},
				},
			],
		},
		plugins: {
			'react-hooks': reactHooksPlugin,
			'@typescript-eslint': tseslint.plugin,
		},
	},

	// TypeScript-specific rules (require TS parser / type information).
	{
		files: [ '**/*.ts', '**/*.tsx' ],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'react',
							message:
								'Please use React API through `@wordpress/element` instead.',
							allowTypeImports: true,
						},
					],
				},
			],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
					disallowTypeAnnotations: false,
				},
			],
		},
	},

	// Override: Development files — disable certain import/data rules.
	{
		files: developmentFiles,
		rules: {
			'import/default': 'off',
			'import/no-extraneous-dependencies': 'off',
			'import/no-unresolved': 'off',
			'import/named': 'off',
			'@wordpress/data-no-store-string-literals': 'off',
		},
	},

	// Override: Package source files — forbid raw SVG elements.
	{
		files: [ 'packages/**/*.js' ],
		ignores: [
			'packages/block-library/src/*/save.js',
			...developmentFiles,
		],
		rules: {
			'react/forbid-elements': [
				'error',
				{
					forbid: [
						[ 'circle', 'Circle' ],
						[ 'g', 'G' ],
						[ 'path', 'Path' ],
						[ 'polygon', 'Polygon' ],
						[ 'rect', 'Rect' ],
						[ 'svg', 'SVG' ],
					].map( ( [ element, componentName ] ) => {
						return {
							element,
							message: `use cross-platform <${ componentName } /> component instead.`,
						};
					} ),
				},
			],
		},
	},

	// Override: React src + storybook — stylesheet and component rules.
	{
		files: [
			'packages/*/src/**/*.[tj]s?(x)',
			'routes/**/*.[tj]s?(x)',
			'widgets/**/*.[tj]s?(x)',
			'storybook/stories/**/*.[tj]s?(x)',
		],
		rules: {
			'@wordpress/no-non-module-stylesheet-imports': 'error',
			'@wordpress/components-no-unsafe-button-disabled': 'error',
			'@wordpress/components-no-missing-40px-size-prop': 'error',
		},
	},

	// Override: Jest test files (unit tests).
	...wpPlugin.configs[ 'test-unit' ].map( ( config ) => ( {
		...config,
		files: [
			'packages/jest*/**/*.js',
			'**/test/**/*.js',
			'**/__tests__/**/*.js',
		],
		ignores: [ 'test/e2e/**/*.js', 'test/performance/**/*.js' ],
	} ) ),

	// Override: Test files — jest-dom, testing-library, jest recommended.
	{
		...rawJestDomPlugin.configs[ 'flat/recommended' ],
		plugins: { 'jest-dom': jestDomPlugin },
		files: [ '**/test/**/*.[tj]s?(x)', '**/__tests__/**/*.[tj]s?(x)' ],
		ignores: [
			'test/e2e/**/*.[tj]s?(x)',
			'test/performance/**/*.[tj]s?(x)',
			'test/storybook-playwright/**/*.[tj]s?(x)',
		],
	},
	{
		...testingLibraryPlugin.configs[ 'flat/react' ],
		plugins: { 'testing-library': testingLibraryPlugin },
		files: [ '**/test/**/*.[tj]s?(x)', '**/__tests__/**/*.[tj]s?(x)' ],
		ignores: [
			'test/e2e/**/*.[tj]s?(x)',
			'test/performance/**/*.[tj]s?(x)',
			'test/storybook-playwright/**/*.[tj]s?(x)',
		],
	},
	{
		...jestPlugin.configs[ 'flat/recommended' ],
		files: [ '**/test/**/*.[tj]s?(x)', '**/__tests__/**/*.[tj]s?(x)' ],
		ignores: [
			'test/e2e/**/*.[tj]s?(x)',
			'test/performance/**/*.[tj]s?(x)',
			'test/storybook-playwright/**/*.[tj]s?(x)',
		],
	},

	// Override: E2E test files (non-Playwright).
	...wpPlugin.configs[ 'test-e2e' ].map( ( config ) => ( {
		...config,
		files: [ 'packages/e2e-test*/**/*.js' ],
		ignores: [ 'packages/e2e-test-utils-playwright/**/*.js' ],
	} ) ),
	{
		files: [ 'packages/e2e-test*/**/*.js' ],
		ignores: [ 'packages/e2e-test-utils-playwright/**/*.js' ],
		rules: {
			'jest/expect-expect': 'off',
		},
	},

	// Override: Playwright tests.
	...wpPlugin.configs[ 'test-playwright' ].map( ( config ) => ( {
		...config,
		files: [
			'test/e2e/**/*.[tj]s',
			'test/performance/**/*.[tj]s',
			'packages/e2e-test-utils-playwright/**/*.[tj]s',
		],
	} ) ),
	{
		...tseslint.configs.base,
		files: [
			'test/e2e/**/*.[tj]s',
			'test/performance/**/*.[tj]s',
			'packages/e2e-test-utils-playwright/**/*.[tj]s',
		],
	},
	{
		files: [
			'test/e2e/**/*.[tj]s',
			'test/performance/**/*.[tj]s',
			'packages/e2e-test-utils-playwright/**/*.[tj]s',
		],
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: rootDir,
				project: [
					'./test/e2e/tsconfig.json',
					'./test/performance/tsconfig.json',
					'./packages/e2e-test-utils-playwright/tsconfig.json',
				],
			},
		},
		rules: {
			'@wordpress/no-global-active-element': 'off',
			'@wordpress/no-global-get-selection': 'off',
			'no-restricted-syntax': [
				'error',
				{
					selector: 'CallExpression[callee.property.name="$"]',
					message: '`$` is discouraged, please use `locator` instead',
				},
				{
					selector: 'CallExpression[callee.property.name="$$"]',
					message:
						'`$$` is discouraged, please use `locator` instead',
				},
				{
					selector:
						'CallExpression[callee.object.name="page"][callee.property.name="waitForTimeout"]',
					message: 'Prefer page.locator instead.',
				},
			],
			'playwright/no-conditional-in-test': 'off',
			// Playwright fixtures use `use()` which is not a React hook.
			'react-hooks/rules-of-hooks': 'off',
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
		},
	},

	// Override: CLI/bin/env files — allow console.
	{
		files: [ '**/{bin,scripts,tools}/**', 'packages/env/**' ],
		rules: {
			'no-console': 'off',
		},
	},

	// Override: Typed packages — disable certain jsdoc rules.
	{
		files: typedFiles,
		rules: {
			'jsdoc/no-undefined-types': 'off',
			'jsdoc/valid-types': 'off',
		},
	},

	// Override: Storybook story files — disable rules-of-hooks for the
	// `render` method pattern (hooks in a lowercase function) and
	// static-components for inline factories used in story setup.
	{
		files: [ '**/@(storybook|stories)/**/*.[tj]s?(x)' ],
		rules: {
			'react-hooks/rules-of-hooks': 'off',
			'react-hooks/static-components': 'off',
		},
	},

	// Override: Storybook + components — enforce JSX file extensions.
	{
		files: [
			'**/@(storybook|stories)/**',
			'packages/components/src/**/*.tsx',
		],
		rules: {
			'react/jsx-filename-extension': [
				'error',
				{ extensions: [ '.jsx', '.tsx' ] },
			],
		},
	},

	// Override: Storybook + components + ui — relax jsdoc require-param.
	{
		files: [
			'**/@(storybook|stories)/**',
			'packages/components/src/**/*.tsx',
			'packages/ui/src/**/*.tsx',
		],
		rules: {
			'jsdoc/require-param': 'off',
		},
	},

	// Override: Components src — restrict admin theme and components color vars.
	{
		files: [ 'packages/components/src/**' ],
		ignores: [
			'packages/components/src/utils/colors-values.js',
			'packages/components/src/theme/**',
		],
		rules: {
			'no-restricted-syntax': [
				'error',
				...restrictedSyntax,
				{
					selector:
						':matches(Literal[value=/--wp-admin-theme-/],TemplateElement[value.cooked=/--wp-admin-theme-/])',
					message:
						'--wp-admin-theme-* variables do not support component theming. Use variables from the COLORS object in packages/components/src/utils/colors-values.js instead.',
				},
				{
					selector:
						// Allow overriding definitions, but not access with var()
						':matches(Literal[value=/var\\(\\s*--wp-components-color-/],TemplateElement[value.cooked=/var\\(\\s*--wp-components-color-/])',
					message:
						'To ensure proper fallbacks, --wp-components-color-* variables should not be used directly. Use variables from the COLORS object in packages/components/src/utils/colors-values.js instead.',
				},
			],
		},
	},

	// Override: Components src — local import checks for button/40px rules.
	{
		files: [ 'packages/components/src/**' ],
		rules: {
			'@wordpress/components-no-unsafe-button-disabled': [
				'error',
				{ checkLocalImports: true },
			],
			'@wordpress/components-no-missing-40px-size-prop': [
				'error',
				{ checkLocalImports: true },
			],
		},
	},

	// Override: UI src — check local imports for unsafe render order rule.
	{
		files: [ 'packages/ui/src/**' ],
		rules: {
			'@wordpress/no-unsafe-render-order': [
				'error',
				{ checkLocalImports: true },
			],
		},
	},

	// Override: Components src (non-test, non-stories) — DOM globals rules.
	{
		files: [ 'packages/components/src/**' ],
		ignores: [ 'packages/components/src/**/@(test|stories)/**' ],
		rules: {
			'@wordpress/no-dom-globals-in-module-scope': 'error',
			'@wordpress/no-dom-globals-in-constructor': 'error',
			'@wordpress/no-dom-globals-in-react-cc-render': 'error',
			'@wordpress/no-dom-globals-in-react-fc': 'error',
		},
	},

	// Override: Components src (non-test, non-stories) — no DS tokens.
	{
		files: [ 'packages/components/src/**' ],
		ignores: [ 'packages/components/src/**/@(test|stories)/**' ],
		rules: {
			'@wordpress/no-ds-tokens': 'error',
		},
	},

	// Override: block-editor, components, dataviews, ui src — enforce display names.
	{
		files: [
			'packages/block-editor/src/**',
			'packages/components/src/**',
			'packages/dataviews/src/**',
			'packages/ui/src/**',
		],
		ignores: [ '**/@(test|stories)/**' ],
		rules: {
			'react/display-name': 'error',
		},
	},

	// Override: Components src — allow ariakit and framer-motion imports.
	{
		files: [ 'packages/components/src/**' ],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: restrictedImports.filter(
						( { name } ) =>
							! [ '@ariakit/react', 'framer-motion' ].includes(
								name
							)
					),
				},
			],
		},
	},

	// Override: UI src — allow base-ui imports.
	{
		files: [ 'packages/ui/src/**' ],
		rules: {
			'no-restricted-imports': [ 'error', UI_RESTRICTED_IMPORTS ],
		},
	},

	// Override: UI stories — prevent barrel imports. Namespace re-exports cause
	// react-docgen-typescript to resolve the wrong component when a story's
	// component is imported via the barrel.
	//
	// See: https://github.com/storybookjs/storybook/issues/32839
	{
		files: [ 'packages/ui/src/**/stories/*.story.@(ts|tsx)' ],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					...UI_RESTRICTED_IMPORTS,
					patterns: UI_RESTRICTED_IMPORTS.patterns.concat( [
						{
							regex: '^\\.\\.(/\\.\\.)+/?$',
							message:
								"Don't import from the `@wordpress/ui` barrel in stories, which break import resolution in Storybook. Use an import from the component's own directory instead (e.g. `import { Icon } from '../icon';`).",
						},
					] ),
				},
			],
		},
	},

	// Override: block-editor — restrict api-fetch and core-data imports.
	{
		files: [ 'packages/block-editor/**' ],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						...restrictedImports,
						{
							name: '@wordpress/api-fetch',
							message:
								"block-editor is a generic package that doesn't depend on a server or WordPress backend. To provide WordPress integration, consider passing settings to the BlockEditorProvider components.",
						},
						{
							name: '@wordpress/core-data',
							message:
								"block-editor is a generic package that doesn't depend on a server or WordPress backend. To provide WordPress integration, consider passing settings to the BlockEditorProvider components.",
						},
					],
				},
			],
		},
	},

	// Override: edit-post, edit-site — restrict interface imports.
	{
		files: [ 'packages/edit-post/**', 'packages/edit-site/**' ],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						...restrictedImports,
						{
							name: '@wordpress/interface',
							message:
								'The edit-post and edit-site package should not directly import the interface package. They should import them from the private APIs of the editor package instead.',
						},
					],
				},
			],
		},
	},

	// Override: block-library save files — no i18n in save.
	{
		files: [ 'packages/block-library/src/*/save.[tj]s?(x)' ],
		rules: {
			'@wordpress/no-i18n-in-save': 'error',
		},
	},

	// Override: Interactivity packages — require react import.
	{
		files: [ 'packages/interactivity*/src/**' ],
		rules: {
			'react/react-in-jsx-scope': 'error',
		},
	},

	// Override: Packages which have eliminated dependency grouping comments
	// and explicitly prevent new additions.
	{
		files: [
			'packages/design-system-mcp/**',
			'packages/ui/**',
			'packages/theme/**',
		],
		rules: {
			'@wordpress/dependency-group': [ 'error', 'never' ],
		},
	},

	// Override: UI package — enforce no-unmerged-classname.
	{
		files: [ 'packages/ui/src/**' ],
		ignores: [ '**/@(test|stories)/**' ],
		rules: {
			'@wordpress/no-unmerged-classname': 'error',
		},
	},

	// Override: eslint-plugin and theme — disable DS token rules.
	{
		files: [ 'packages/eslint-plugin/**', 'packages/theme/**' ],
		rules: {
			'@wordpress/no-setting-ds-tokens': 'off',
			'@wordpress/no-unknown-ds-tokens': 'off',
		},
	},

	// Override: Components package and root Storybook stories — disable use-recommended-components.
	{
		files: [ 'packages/components/**', 'storybook/stories/**' ],
		rules: {
			'@wordpress/use-recommended-components': 'off',
		},
	},

	// --- Merged package-level configs ---

	// From packages/block-serialization-spec-parser/.eslintrc.json:
	// Add test-unit config for shared-tests.js with jest/no-export off.
	...wpPlugin.configs[ 'test-unit' ].map( ( config ) => ( {
		...config,
		files: [ 'packages/block-serialization-spec-parser/shared-tests.js' ],
	} ) ),
	{
		files: [ 'packages/block-serialization-spec-parser/shared-tests.js' ],
		rules: {
			'jest/no-export': 'off',
		},
	},

	// From packages/dependency-extraction-webpack-plugin/lib/.eslintrc.json:
	// Add Node.js globals for the lib directory.
	{
		files: [ 'packages/dependency-extraction-webpack-plugin/lib/**' ],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},

	// Override: Files with pre-existing exhaustive-deps warnings that cannot use
	// inline eslint-disable comments because the React Compiler rules in
	// `react-hooks` flag those as errors.
	{
		files: [
			'packages/block-editor/src/components/inserter/media-tab/hooks.js',
			'packages/block-editor/src/components/use-paste-styles/index.js',
			'packages/block-library/src/pattern/edit.js',
			'packages/components/src/sandbox/index.tsx',
		],
		rules: {
			'react-hooks/exhaustive-deps': 'off',
		},
	},

	// Override: TypeScript declaration merging uses intentional shadowing
	// in `declare module` blocks.
	{
		files: [
			'packages/core-data/src/entity-types/*.ts',
			'packages/data/src/types.ts',
		],
		rules: {
			'@typescript-eslint/no-shadow': 'off',
		},
	},

	// Override: typings — global type declarations require `var` and define
	// the globals that wp-global-usage warns about.
	{
		files: [ 'typings/**/*.d.ts' ],
		rules: {
			'no-var': 'off',
			'@wordpress/wp-global-usage': 'off',
		},
	},

	// Override: Type declaration files intentionally augment third-party
	// modules and must import from them directly.
	{
		files: [ 'packages/ui/src/types/*.d.ts' ],
		rules: {
			'@typescript-eslint/no-restricted-imports': 'off',
		},
	},

	// Package-level configs (kept alongside the code they apply to).
	...wpBuildConfig,
] );
