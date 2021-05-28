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
	'**/@(__mocks__|__tests__|test)/**/*.js',
	'**/@(storybook|stories)/**/*.js',
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
	},
	rules: {
		'jest/expect-expect': 'off',
		'@wordpress/dependency-group': 'error',
		'@wordpress/gutenberg-phase': 'error',
		'@wordpress/react-no-unsafe-timeout': 'error',
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'default',
			},
		],
		'@wordpress/no-unsafe-wp-apis': 'off',
		'@wordpress/data-no-store-string-literals': 'warn',
		'import/default': 'error',
		'import/named': 'error',
		'no-restricted-imports': [
			'error',
			{
				paths: [
					{
						name: 'lodash',
						importNames: [ 'memoize' ],
						message: 'Please use `memize` instead.',
					},
					{
						name: 'react',
						message:
							'Please use React API through `@wordpress/element` instead.',
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
					'ImportDeclaration[source.value=/^react-spring(?!\\u002Fweb.cjs)/]',
				message:
					'The react-spring dependency must specify CommonJS bundle: react-spring/web.cjs',
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
				'import/no-extraneous-dependencies': 'off',
				'import/no-unresolved': 'off',
				'import/named': 'off',
				'@wordpress/data-no-store-string-literals': 'off',
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
			files: [ 'packages/jest*/**/*.js' ],
			extends: [ 'plugin:@wordpress/eslint-plugin/test-unit' ],
		},
		{
			files: [ 'packages/e2e-test*/**/*.js' ],
			extends: [ 'plugin:@wordpress/eslint-plugin/test-e2e' ],
			rules: {
				'jest/expect-expect': 'off',
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
	],
};
