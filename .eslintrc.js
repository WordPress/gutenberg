/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const { version } = require( './package' );

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

module.exports = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended',
		'plugin:eslint-comments/recommended',
		'plugin:storybook/recommended',
	],
	globals: {
		wp: 'off',
		globalThis: 'readonly',
	},
	settings: {
		jsdoc: {
			mode: 'typescript',
		},
		'import/internal-regex': null,
		'import/resolver': require.resolve( './tools/eslint/import-resolver' ),
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
		'no-restricted-syntax': [ 'error', ...restrictedSyntax ],
	},
	overrides: [
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
			files: [ 'packages/react-native-*/**/*.js' ],
			settings: {
				'import/ignore': [ 'react-native' ], // Workaround for https://github.com/facebook/react-native/issues/28549.
			},
		},
		{
			files: [ 'packages/**/*.js' ],
			excludedFiles: [
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
			excludedFiles: [ '**/*.native.js' ],
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
			excludedFiles: [
				'packages/components/src/**/@(test|stories)/**',
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
						'DimensionControl',
						'FontSizePicker',
						'ToggleGroupControl',
					].map( ( componentName ) => ( {
						// Falsy `__next40pxDefaultSize` without a non-default `size` prop.
						selector: `JSXOpeningElement[name.name="${ componentName }"]:not(:has(JSXAttribute[name.name="__next40pxDefaultSize"][value.expression.value!=false])):not(:has(JSXAttribute[name.name="size"][value.value!="default"]))`,
						message:
							componentName +
							' should have the `__next40pxDefaultSize` prop to opt-in to the new default size.',
					} ) ),
					// Temporary rules until all existing components have the `__next40pxDefaultSize` prop.
					...[ 'SelectControl', 'TextControl' ].map(
						( componentName ) => ( {
							// Not strict. Allows pre-existing __next40pxDefaultSize={ false } usage until they are all manually updated.
							selector: `JSXOpeningElement[name.name="${ componentName }"]:not(:has(JSXAttribute[name.name="__next40pxDefaultSize"])):not(:has(JSXAttribute[name.name="size"]))`,
							message:
								componentName +
								' should have the `__next40pxDefaultSize` prop to opt-in to the new default size.',
						} )
					),
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
			excludedFiles: [ ...developmentFiles ],
			rules: {
				'react-hooks/exhaustive-deps': 'error',
			},
		},
		{
			files: [ 'packages/jest*/**/*.js', '**/test/**/*.js' ],
			excludedFiles: [ 'test/e2e/**/*.js', 'test/performance/**/*.js' ],
			extends: [ 'plugin:@wordpress/eslint-plugin/test-unit' ],
		},
		{
			files: [ '**/test/**/*.[tj]s?(x)' ],
			excludedFiles: [
				'**/*.@(android|ios|native).[tj]s?(x)',
				'packages/react-native-*/**/*.[tj]s?(x)',
				'test/native/**/*.[tj]s?(x)',
				'test/e2e/**/*.[tj]s?(x)',
				'test/performance/**/*.[tj]s?(x)',
				'test/storybook-playwright/**/*.[tj]s?(x)',
			],
			extends: [
				'plugin:jest-dom/recommended',
				'plugin:testing-library/react',
				'plugin:jest/recommended',
			],
		},
		{
			files: [ 'packages/e2e-test*/**/*.js' ],
			excludedFiles: [ 'packages/e2e-test-utils-playwright/**/*.js' ],
			extends: [ 'plugin:@wordpress/eslint-plugin/test-e2e' ],
			rules: {
				'jest/expect-expect': 'off',
			},
		},
		{
			files: [
				'test/e2e/**/*.[tj]s',
				'test/performance/**/*.[tj]s',
				'packages/e2e-test-utils-playwright/**/*.[tj]s',
			],
			extends: [
				'plugin:@wordpress/eslint-plugin/test-playwright',
				'plugin:@typescript-eslint/base',
			],
			parserOptions: {
				tsconfigRootDir: __dirname,
				project: [
					'./test/e2e/tsconfig.json',
					'./test/performance/tsconfig.json',
					'./packages/e2e-test-utils-playwright/tsconfig.json',
				],
			},
			rules: {
				'@wordpress/no-global-active-element': 'off',
				'@wordpress/no-global-get-selection': 'off',
				'no-restricted-syntax': [
					'error',
					{
						selector: 'CallExpression[callee.property.name="$"]',
						message:
							'`$` is discouraged, please use `locator` instead',
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
				'@typescript-eslint/await-thenable': 'error',
				'@typescript-eslint/no-floating-promises': 'error',
				'@typescript-eslint/no-misused-promises': 'error',
			},
		},
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
			excludedFiles: [
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
			files: [ 'packages/components/src/**' ],
			excludedFiles: [ 'packages/components/src/**/@(test|stories)/**' ],
			plugins: [ 'ssr-friendly' ],
			extends: [ 'plugin:ssr-friendly/recommended' ],
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
								! [
									'@ariakit/react',
									'framer-motion',
								].includes( name )
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
	],
};
