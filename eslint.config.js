/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;
const { join } = require( 'path' );
const globals = require( 'globals' );
const comments = require( '@eslint-community/eslint-plugin-eslint-comments/configs' );
const storybook = require( 'eslint-plugin-storybook' );
const jestDom = require( 'eslint-plugin-jest-dom' );
const testingLibrary = require( 'eslint-plugin-testing-library' );
const jest = require( 'eslint-plugin-jest' );
const tseslint = require( 'typescript-eslint' );
const ssrFriendly = require( 'eslint-plugin-ssr-friendly' );
const { fixupConfigRules, fixupPluginRules } = require( '@eslint/compat' );

/**
 * Internal dependencies
 */
const { version } = require( './package' );
/**
 * WordPress dependencies
 */
const wordPress = require( '@wordpress/eslint-plugin' );
const react = require( 'eslint-plugin-react' );

/**
 * Regular expression string matching a SemVer string with equal major/minor to
 * the current package version. Used in identifying deprecations.
 *
 * @type {string}
 */
const majorMinorRegExp =
	version.replace( /\.\d+$/, '' ).replace( /[\\^$.*+?()[\]{}|]/g, '\\$&' ) +
	'(\\.\\d+)?';

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
];

/**
 * The list of patterns matching Playwright files.
 *
 * @type {string[]}
 */
const playwrightFiles = [
	'test/e2e/**/*.[tj]s',
	'test/performance/**/*.[tj]s',
	'packages/e2e-test-utils-playwright/**/*.[tj]s',
];

// All files from packages that have types provided with TypeScript.
const typedFiles = glob( 'packages/*/package.json' )
	.filter( ( fileName ) => require( join( __dirname, fileName ) ).types )
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
];

const restrictedSyntax = [
	// NOTE: We can't include the forward slash in our regex or
	// we'll get a `SyntaxError` (Invalid regular expression: \ at end of pattern)
	// here. That's why we use \\u002F in the regexes below.
	{
		selector:
			'ImportDeclaration[source.value=/^@wordpress\\u002F.+\\u002F/]',
		message: 'Path access on WordPress dependencies is not allowed.',
	},
	{
		selector:
			'CallExpression[callee.name="deprecated"] Property[key.name="version"][value.value=/' +
			majorMinorRegExp +
			'/]',
		message:
			'Deprecated functions must be removed before releasing this version.',
	},
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
		message:
			'Do not use string literals for IDs; use withInstanceId instead.',
	},
	{
		// Discourage the usage of `Math.random()` as it's a code smell
		// for UUID generation, for which we already have a higher-order
		// component: `withInstanceId`.
		selector:
			'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
		message:
			'Do not use Math.random() to generate unique IDs; use withInstanceId instead. (If you’re not generating unique IDs: ignore this message.)',
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
	// @TODO The following rules moved from react-native-editor ESLint config. Need to do check do we have any issue with them.
	{
		selector:
			'CallExpression[callee.name=/^(__|_x|_n|_nx)$/] Literal[value=/\\.{3}/]',
		message: 'Use ellipsis character (…) in place of three dots',
	},
	{
		selector:
			'ImportDeclaration[source.value="lodash"] Identifier.imported[name="memoize"]',
		message: 'Use memize instead of Lodash’s memoize',
	},
];

/** `no-restricted-syntax` rules for components. */
const restrictedSyntaxComponents = [
	{
		selector:
			'JSXOpeningElement[name.name="Button"]:not(:has(JSXAttribute[name.name="accessibleWhenDisabled"])) JSXAttribute[name.name="disabled"]',
		message:
			'`disabled` used without the `accessibleWhenDisabled` prop. Disabling a control without maintaining focusability can cause accessibility issues, by hiding their presence from screen reader users, or preventing focus from returning to a trigger element. (Ignore this error if you truly mean to disable.)',
	},
];

module.exports = [
	{
		ignores: [
			'.cache/',
			'**/build/',
			'**/build-module/',
			'**/build-types/',
			'**/node_modules/',
			'packages/block-serialization-spec-parser/parser.js',
			'packages/react-native-editor/bundle/',
			'vendor',
			'!**/.*.js',
		],
	},
	...wordPress.configs.recommended,
	comments.recommended,
	...storybook.configs[ 'flat/recommended' ], // @TODO check if subdirectory stories do work https://github.com/storybookjs/eslint-plugin-storybook/issues/135#issuecomment-2198331953
	...tseslint.config( {
		extends: [ tseslint.configs.base ],
		files: [ '**/*.ts', '**/*.tsx' ],
		ignores: [ '**/*.d.ts' ],
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
	} ),
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
			'import/internal-regex': null,
			'import/resolver': require.resolve(
				'./tools/eslint/import-resolver'
			),
		},
		rules: {
			'jest/expect-expect': 'off',
			'react/jsx-boolean-value': 'error',
			'react/jsx-curly-brace-presence': [
				'error',
				{ props: 'never', children: 'never' },
			],
			'@wordpress/dependency-group': 'error',
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
			'import/default': 'error',
			'import/named': 'error',
			'no-restricted-imports': [
				'error',
				{
					paths: restrictedImports,
				},
			],
			'no-restricted-syntax': [ 'error', ...restrictedSyntax ],
			'jsdoc/check-tag-names': [
				'error',
				{
					definedTags: [ 'jest-environment' ],
				},
			],
		},
	},
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
		},
	},
	{
		files: [ 'packages/react-native-editor/**' ],
		plugins: {
			react,
			jest,
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...jest.environments.globals.globals,
				__DEV__: true,
			},
		},
		settings: {
			react: {
				pragma: 'React',
				version: 'detect',
				flowVersion: '0.92.0',
			},
			'import/resolver': require.resolve(
				'./tools/eslint/import-resolver'
			),
		},
		rules: {
			'no-restricted-syntax': [ 'error', ...restrictedSyntax ],
		},
	},
	{
		files: [ 'packages/react-native-editor/__device-tests__/**' ],
		languageOptions: {
			globals: {
				// Defined in 'jest_ui_test_environment.js'
				editorPage: true,
				e2eTestData: true,
				e2eUtils: true,
			},
		},
		rules: {
			'jest/expect-expect': 'off',
		},
	},
	{
		files: [ 'packages/react-native-*/**/*.js' ],
		settings: {
			'import/ignore': [ 'react-native' ], // Workaround for https://github.com/facebook/react-native/issues/28549.
		},
		rules: {
			'import/no-unresolved': 'off',
		},
	},
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
	{
		files: [
			'packages/*/src/**/*.[tj]s?(x)',
			'storybook/stories/**/*.[tj]s?(x)',
		],
		ignores: [ '**/*.native.js' ],
		rules: {
			'no-restricted-syntax': [
				'error',
				...restrictedSyntax,
				...restrictedSyntaxComponents,
			],
		},
	},
	{
		files: [ 'packages/*/src/**/*.[tj]s?(x)' ],
		ignores: [
			'packages/*/src/**/@(test|stories)/**',
			'**/*.@(native|ios|android).js',
		],
		rules: {
			'no-restricted-syntax': [
				'error',
				...restrictedSyntax,
				...restrictedSyntaxComponents,
				// Temporary rules until we're ready to officially deprecate the bottom margins.
				...[
					'BaseControl',
					'CheckboxControl',
					'ComboboxControl',
					'DimensionControl',
					'FocalPointPicker',
					'RangeControl',
					'SearchControl',
					'SelectControl',
					'TextControl',
					'TextareaControl',
					'ToggleControl',
					'ToggleGroupControl',
					'TreeSelect',
				].map( ( componentName ) => ( {
					selector: `JSXOpeningElement[name.name="${ componentName }"]:not(:has(JSXAttribute[name.name="__nextHasNoMarginBottom"]))`,
					message:
						componentName +
						' should have the `__nextHasNoMarginBottom` prop to opt-in to the new margin-free styles.',
				} ) ),
				// Temporary rules until we're ready to officially default to the new size.
				...[
					'BorderBoxControl',
					'BorderControl',
					'BoxControl',
					'ComboboxControl',
					'CustomSelectControl',
					'DimensionControl',
					'FontAppearanceControl',
					'FontFamilyControl',
					'FontSizePicker',
					'FormTokenField',
					'InputControl',
					'LetterSpacingControl',
					'LineHeightControl',
					'NumberControl',
					'RangeControl',
					'SelectControl',
					'TextControl',
					'ToggleGroupControl',
					'UnitControl',
				].map( ( componentName ) => ( {
					// Falsy `__next40pxDefaultSize` without a non-default `size` prop.
					selector: `JSXOpeningElement[name.name="${ componentName }"]:not(:has(JSXAttribute[name.name="__next40pxDefaultSize"][value.expression.value!=false])):not(:has(JSXAttribute[name.name="size"][value.value!="default"]))`,
					message:
						componentName +
						' should have the `__next40pxDefaultSize` prop to opt-in to the new default size.',
				} ) ),
				{
					// Falsy `__next40pxDefaultSize` without a `render` prop.
					selector:
						'JSXOpeningElement[name.name="FormFileUpload"]:not(:has(JSXAttribute[name.name="__next40pxDefaultSize"][value.expression.value!=false])):not(:has(JSXAttribute[name.name="render"]))',
					message:
						'FormFileUpload should have the `__next40pxDefaultSize` prop to opt-in to the new default size.',
				},
				// Temporary rules until all existing components have the `__next40pxDefaultSize` prop.
				...[ 'Button' ].map( ( componentName ) => ( {
					// Not strict. Allows pre-existing __next40pxDefaultSize={ false } usage until they are all manually updated.
					selector: `JSXOpeningElement[name.name="${ componentName }"]:not(:has(JSXAttribute[name.name="__next40pxDefaultSize"])):not(:has(JSXAttribute[name.name="size"]))`,
					message:
						componentName +
						' should have the `__next40pxDefaultSize` prop to opt-in to the new default size.',
				} ) ),
			],
		},
	},
	{
		files: [
			// Components package.
			'packages/components/src/**/*.[tj]s?(x)',
			// Navigation block.
			'packages/block-library/src/navigation/**/*.[tj]s?(x)',
		],
		ignores: [ ...developmentFiles ],
		rules: {
			'react-hooks/exhaustive-deps': 'error',
		},
	},
	...wordPress.configs[ 'test-unit' ].map( ( config ) => ( {
		...config,
		files: [
			'packages/jest*/**/*.js',
			'**/test/**/*.js',
			'packages/block-serialization-spec-parser/shared-tests.js',
		],
		ignores: [ 'test/e2e/**/*.js', 'test/performance/**/*.js' ],
	} ) ),
	...[
		jestDom.configs[ 'flat/recommended' ],
		...fixupConfigRules( testingLibrary.configs[ 'flat/react' ] ),
		jest.configs[ 'flat/recommended' ],
	].map( ( config ) => ( {
		...config,
		files: [ '**/test/**/*.[tj]s?(x)' ],
		ignores: [
			'**/*.@(android|ios|native).[tj]s?(x)',
			'packages/react-native-*/**/*.[tj]s?(x)',
			'test/native/**/*.[tj]s?(x)',
			'test/e2e/**/*.[tj]s?(x)',
			'test/performance/**/*.[tj]s?(x)',
			'test/storybook-playwright/**/*.[tj]s?(x)',
		],
	} ) ),
	{
		...wordPress.configs[ 'test-e2e' ],
		files: [ 'packages/e2e-test*/**/*.js' ],
		ignores: [ 'packages/e2e-test-utils-playwright/**/*.js' ],
		rules: {
			'jest/expect-expect': 'off',
		},
	},
	{
		...wordPress.configs[ 'test-playwright' ],
		files: playwrightFiles,
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
			'react-hooks/rules-of-hooks': 'off', // false positive for React use and Playwright use
		},
	},
	...tseslint.config( {
		extends: [ tseslint.configs.base ],
		files: playwrightFiles,
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: __dirname,
				project: [
					'./test/e2e/tsconfig.json',
					'./test/performance/tsconfig.json',
					'./packages/e2e-test-utils-playwright/tsconfig.json',
				],
			},
		},
		rules: {
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
		},
	} ),
	{
		files: [ 'bin/**/*.js', 'bin/**/*.mjs', 'packages/env/**' ],
		rules: {
			'no-console': 'off',
		},
	},
	{
		files: typedFiles,
		rules: {
			'jsdoc/no-undefined-types': 'off',
			'jsdoc/valid-types': 'off',
		},
	},
	{
		files: [
			'**/@(storybook|stories)/*',
			'packages/components/src/**/*.tsx',
		],
		rules: {
			// Useful to add story descriptions via JSDoc without specifying params,
			// or in TypeScript files where params are likely already documented outside of the JSDoc.
			'jsdoc/require-param': 'off',
		},
	},
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
				...restrictedSyntaxComponents,
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
	{
		// eslint-plugin-ssr-friendly doesn't support ESLint V9 - https://github.com/kopiro/eslint-plugin-ssr-friendly/issues/30
		// consider to move to the @wordpress/eslint-plugin
		files: [ 'packages/components/src/!**' ],
		ignores: [ 'packages/components/src/!**!/@(test|stories)/!**' ],
		plugins: {
			'ssr-friendly': {
				meta: {
					name: 'eslint-plugin-ssr-friendly',
					version: '1.3.0',
				},
				rules: fixupPluginRules( ssrFriendly ).rules,
			},
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		rules: {
			...ssrFriendly.configs.recommended.rules,
		},
	},
	{
		files: [ 'packages/components/src/**' ],
		rules: {
			'no-restricted-imports': [
				'error',
				// The `ariakit` and `framer-motion` APIs are meant to be consumed via
				// the `@wordpress/components` package, hence why importing those
				// dependencies should be allowed in the components package.
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
	{
		files: [ 'packages/interactivity*/src/**' ],
		rules: {
			'react/react-in-jsx-scope': 'error',
		},
	},
	{
		files: [ 'platform-docs/**' ],
		settings: {
			react: {
				pragma: 'React',
				version: 'detect',
				flowVersion: '0.92.0',
			},
			'import/resolver': require.resolve(
				'./tools/eslint/import-resolver'
			),
		},
		rules: {
			'import/no-unresolved': 'off',
		},
	},
];
