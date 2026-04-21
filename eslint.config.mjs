/**
 * External dependencies
 */
import { createRequire } from 'module';
import { join } from 'path';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments';
import storybookPlugin from 'eslint-plugin-storybook';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';
import rawJestDomPlugin from 'eslint-plugin-jest-dom';
import rawTestingLibraryPlugin from 'eslint-plugin-testing-library';
import jestPlugin from 'eslint-plugin-jest';
import tseslint from 'typescript-eslint';
import reactNativeEditorConfig from './packages/react-native-editor/eslint-overrides.cjs';
import wpBuildConfig from './packages/wp-build/eslint-overrides.cjs';
import platformDocsConfig from './platform-docs/eslint-overrides.cjs';

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
const wpPlugin = require( './packages/eslint-plugin' );

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
const typedFiles = glob( 'packages/*/package.json' )
	.filter(
		( fileName ) => require( join( import.meta.dirname, fileName ) ).types
	)
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
			'packages/icons/src/library/*.tsx',
			'packages/react-native-editor/bundle/**',
			'packages/vips/src/worker-code.ts',
			'**/vendor/**',
			// Generated by @wordpress/create-block during CI build tests.
			'example-*/',
		],
	},

	// Base recommended config from @wordpress/eslint-plugin.
	...wpPlugin.configs.recommended,

	// eslint-comments recommended (manually converted to flat config).
	// Register under both names so that existing `eslint-comments/*` rule
	// references (used below) continue to work alongside the canonical
	// `@eslint-community/eslint-comments/*` names from the recommended config.
	{
		plugins: {
			'@eslint-community/eslint-comments': eslintCommentsPlugin,
			'eslint-comments': eslintCommentsPlugin,
		},
		rules: eslintCommentsPlugin.configs.recommended.rules,
	},

	// Storybook recommended (array of 3).
	...storybookPlugin.configs[ 'flat/recommended' ],

	// Global settings applicable to all files.
	{
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
			'import/resolver': require.resolve(
				'./tools/eslint/import-resolver'
			),
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
			'eslint-comments/no-unused-disable': 'error',
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
			'react-compiler/react-compiler': [
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
			'react-compiler': reactCompilerPlugin,
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

	// Override: React Native and development files — disable certain import/data rules.
	{
		files: [
			'**/*.@(android|ios|native).js',
			'packages/react-native-*/**/*.js',
			...developmentFiles,
		],
		rules: {
			'import/default': 'off',
			'import/no-extraneous-dependencies': 'off',
			'import/no-unresolved': 'off',
			'import/named': 'off',
			'@wordpress/data-no-store-string-literals': 'off',
			'react-compiler/react-compiler': 'off',
		},
	},

	// Override: React Native packages — import ignore workaround.
	{
		files: [ 'packages/react-native-*/**/*.js' ],
		settings: {
			'import/ignore': [ 'react-native' ], // Workaround for https://github.com/facebook/react-native/issues/28549.
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

	// Override: Package src + storybook — restricted syntax + unsafe button disabled.
	{
		files: [
			'packages/*/src/**/*.[tj]s?(x)',
			'storybook/stories/**/*.[tj]s?(x)',
		],
		ignores: [ '**/*.@(android|ios|native).[tj]s?(x)' ],
		rules: {
			'no-restricted-syntax': [ 'error', ...restrictedSyntax ],
			'@wordpress/components-no-unsafe-button-disabled': 'error',
		},
	},

	// Override: Package src (non-test, non-stories, non-native) — add 40px size prop rule.
	{
		files: [ 'packages/*/src/**/*.[tj]s?(x)' ],
		ignores: [
			'packages/*/src/**/@(test|stories)/**',
			'**/*.@(android|ios|native).[tj]s?(x)',
		],
		rules: {
			'no-restricted-syntax': [ 'error', ...restrictedSyntax ],
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
			'**/*.@(android|ios|native).[tj]s?(x)',
			'packages/react-native-*/**/*.[tj]s?(x)',
			'test/native/**/*.[tj]s?(x)',
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
			'**/*.@(android|ios|native).[tj]s?(x)',
			'packages/react-native-*/**/*.[tj]s?(x)',
			'test/native/**/*.[tj]s?(x)',
			'test/e2e/**/*.[tj]s?(x)',
			'test/performance/**/*.[tj]s?(x)',
			'test/storybook-playwright/**/*.[tj]s?(x)',
		],
	},
	{
		...jestPlugin.configs[ 'flat/recommended' ],
		files: [ '**/test/**/*.[tj]s?(x)', '**/__tests__/**/*.[tj]s?(x)' ],
		ignores: [
			'**/*.@(android|ios|native).[tj]s?(x)',
			'packages/react-native-*/**/*.[tj]s?(x)',
			'test/native/**/*.[tj]s?(x)',
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
				tsconfigRootDir: import.meta.dirname,
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
		files: [
			'bin/**/*.js',
			'bin/**/*.mjs',
			'packages/env/**',
			'packages/theme/bin/**/*.[tj]s?(x)',
		],
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
		ignores: [ '**/*.@(android|ios|native).[tj]s?(x)' ],
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
		ignores: [ '**/@(test|stories)/**', '*.native.*' ],
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
			'no-restricted-imports': [
				'error',
				{
					paths: restrictedImports.filter(
						( { name } ) => ! [ '@base-ui/react' ].includes( name )
					),
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

	// Override: Interactivity packages — disable react-compiler, require react import.
	{
		files: [ 'packages/interactivity*/src/**' ],
		rules: {
			'react-compiler/react-compiler': 'off',
			'react/react-in-jsx-scope': 'error',
		},
	},

	// Override: UI package — disable dependency-group.
	{
		files: [ 'packages/ui/src/**' ],
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

	// Override: Storybook stories — disable use-recommended-components.
	{
		files: [ 'storybook/stories/**' ],
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

	// Override: Files with __unstable/__experimental prefixed functions that use hooks.
	// react-hooks v5 rejects hook calls in functions not matching useX or PascalCase naming.
	// These are known legacy patterns being phased out.
	{
		files: [
			'packages/block-editor/src/components/block-variation-transforms/index.js',
			'packages/block-editor/src/components/gradients/use-gradient.js',
		],
		rules: {
			'react-hooks/rules-of-hooks': 'off',
		},
	},

	// Override: Files with pre-existing exhaustive-deps warnings that cannot use
	// inline eslint-disable comments (react-compiler flags those as errors).
	{
		files: [
			'packages/block-editor/src/components/inserter/media-tab/hooks.js',
			'packages/block-editor/src/components/use-paste-styles/index.js',
			'packages/block-library/src/pattern/edit.js',
			'packages/components/src/sandbox/index.tsx',
			'packages/components/src/sandbox/index.native.js',
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
	...reactNativeEditorConfig,
	...wpBuildConfig,
	...platformDocsConfig,
] );
