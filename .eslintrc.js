/**
 * External dependencies
 */
const { escapeRegExp } = require( 'lodash' );
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
	escapeRegExp( version.replace( /\.\d+$/, '' ) ) + '(\\.\\d+)?';

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

module.exports = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended',
		'plugin:eslint-comments/recommended',
	],
	globals: {
		wp: 'off',
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
		'@wordpress/dependency-group': 'error',
		'@wordpress/is-gutenberg-plugin': 'error',
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
				paths: [
					{
						name: 'framer-motion',
						message:
							'Please use the Framer Motion API through `@wordpress/components` instead.',
					},
					{
						name: 'lodash',
						importNames: [
							'chunk',
							'clamp',
							'compact',
							'concat',
							'countBy',
							'defaults',
							'defaultTo',
							'delay',
							'differenceWith',
							'dropRight',
							'each',
							'extend',
							'findIndex',
							'findKey',
							'findLast',
							'flatMap',
							'flatten',
							'flattenDeep',
							'fromPairs',
							'identity',
							'invoke',
							'isArray',
							'isBoolean',
							'isFinite',
							'isFunction',
							'isMatch',
							'isNil',
							'isNumber',
							'isObject',
							'isObjectLike',
							'isPlainObject',
							'isString',
							'isUndefined',
							'keyBy',
							'keys',
							'lowerCase',
							'memoize',
							'negate',
							'noop',
							'nth',
							'once',
							'overEvery',
							'partialRight',
							'random',
							'reject',
							'repeat',
							'reverse',
							'size',
							'snakeCase',
							'stubFalse',
							'stubTrue',
							'sum',
							'sumBy',
							'take',
							'toString',
							'trim',
							'truncate',
							'uniqueId',
							'uniqWith',
							'values',
							'zip',
						],
						message:
							'This Lodash method is not recommended. Please use native functionality instead. If using `memoize`, please use `memize` instead.',
					},
					{
						name: 'reakit',
						message:
							'Please use Reakit API through `@wordpress/components` instead.',
					},
					{
						name: 'redux',
						importNames: [ 'combineReducers' ],
						message:
							'Please use `combineReducers` from `@wordpress/data` instead.',
					},
					{
						name: 'puppeteer-testing-library',
						message:
							'`puppeteer-testing-library` is still experimental.',
					},
					{
						name: '@emotion/css',
						message:
							'Please use `@emotion/react` and `@emotion/styled` in order to maintain iframe support. As a replacement for the `cx` function, please use the `useCx` hook defined in `@wordpress/components` instead.',
					},
				],
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
		'no-restricted-syntax': [
			'error',
			// NOTE: We can't include the forward slash in our regex or
			// we'll get a `SyntaxError` (Invalid regular expression: \ at end of pattern)
			// here. That's why we use \\u002F in the regexes below.
			{
				selector:
					'ImportDeclaration[source.value=/^@wordpress\\u002F.+\\u002F/]',
				message:
					'Path access on WordPress dependencies is not allowed.',
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
		],
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
			files: [ 'packages/jest*/**/*.js', '**/test/**/*.js' ],
			excludedFiles: [ 'test/e2e/**/*.js' ],
			extends: [ 'plugin:@wordpress/eslint-plugin/test-unit' ],
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
				'packages/e2e-test-utils-playwright/**/*.[tj]s',
			],
			extends: [ 'plugin:eslint-plugin-playwright/playwright-test' ],
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
			},
		},
		{
			files: [ 'bin/**/*.js', 'packages/env/**' ],
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
			excludedFiles: [ 'packages/components/src/**/@(test|stories)/**' ],
			plugins: [ 'ssr-friendly' ],
			extends: [ 'plugin:ssr-friendly/recommended' ],
		},
	],
};
