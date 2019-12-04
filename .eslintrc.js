/**
 * External dependencies
 */
const { escapeRegExp } = require( 'lodash' );

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
const majorMinorRegExp = escapeRegExp( version.replace( /\.\d+$/, '' ) ) + '(\\.\\d+)?';

/**
 * The list of patterns matching files used only for development purposes.
 *
 * @type {string[]}
 */
const developmentFiles = [
	'**/benchmark/**/*.js',
	'**/@(__mocks__|__tests__|test)/**/*.js',
	'**/@(storybook|stories)/**/*.js',
];

module.exports = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended',
		'plugin:eslint-comments/recommended',
	],
	plugins: [
		'import',
	],
	globals: {
		wp: 'off',
	},
	rules: {
		'@wordpress/dependency-group': 'error',
		'@wordpress/gutenberg-phase': 'error',
		'@wordpress/react-no-unsafe-timeout': 'error',
		'no-restricted-syntax': [
			'error',
			// NOTE: We can't include the forward slash in our regex or
			// we'll get a `SyntaxError` (Invalid regular expression: \ at end of pattern)
			// here. That's why we use \\u002F in the regexes below.
			{
				selector: 'ImportDeclaration[source.value=/^@wordpress\\u002F.+\\u002F/]',
				message: 'Path access on WordPress dependencies is not allowed.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^react-spring(?!\\u002Fweb\.cjs)/]',
				message: 'The react-spring dependency must specify CommonJS bundle: react-spring/web.cjs',
			},
			{
				selector: 'CallExpression[callee.name="deprecated"] Property[key.name="version"][value.value=/' + majorMinorRegExp + '/]',
				message: 'Deprecated functions must be removed before releasing this version.',
			},
			{
				selector: 'CallExpression[callee.name=/^(__|_n|_nx|_x)$/]:not([arguments.0.type=/^Literal|BinaryExpression$/])',
				message: 'Translate function arguments must be string literals.',
			},
			{
				selector: 'CallExpression[callee.name=/^(_n|_nx|_x)$/]:not([arguments.1.type=/^Literal|BinaryExpression$/])',
				message: 'Translate function arguments must be string literals.',
			},
			{
				selector: 'CallExpression[callee.name=_nx]:not([arguments.3.type=/^Literal|BinaryExpression$/])',
				message: 'Translate function arguments must be string literals.',
			},
			{
				selector: 'CallExpression[callee.name=/^(__|_x|_n|_nx)$/] Literal[value=/\\.{3}/]',
				message: 'Use ellipsis character (…) in place of three dots',
			},
			{
				selector: 'ImportDeclaration[source.value="redux"] Identifier.imported[name="combineReducers"]',
				message: 'Use `combineReducers` from `@wordpress/data`',
			},
			{
				selector: 'ImportDeclaration[source.value="lodash"] Identifier.imported[name="memoize"]',
				message: 'Use memize instead of Lodash’s memoize',
			},
			{
				selector: 'CallExpression[callee.object.name="page"][callee.property.name="waitFor"]',
				message: 'Prefer page.waitForSelector instead.',
			},
			{
				selector: 'JSXAttribute[name.name="id"][value.type="Literal"]',
				message: 'Do not use string literals for IDs; use withInstanceId instead.',
			},
			{
				// Discourage the usage of `Math.random()` as it's a code smell
				// for UUID generation, for which we already have a higher-order
				// component: `withInstanceId`.
				selector: 'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
				message: 'Do not use Math.random() to generate unique IDs; use withInstanceId instead. (If you’re not generating unique IDs: ignore this message.)',
			},
			{
				selector: 'CallExpression[callee.name="withDispatch"] > :function > BlockStatement > :not(VariableDeclaration,ReturnStatement)',
				message: 'withDispatch must return an object with consistent keys. Avoid performing logic in `mapDispatchToProps`.',
			},
			{
				selector: 'LogicalExpression[operator="&&"][left.property.name="length"][right.type="JSXElement"]',
				message: 'Avoid truthy checks on length property rendering, as zero length is rendered verbatim.',
			},
		],
	},
	overrides: [
		{
			files: [ 'packages/**/*.js' ],
			excludedFiles: [
				'**/*.@(android|ios|native).js',
				...developmentFiles,
			],
			rules: {
				'import/no-extraneous-dependencies': 'error',
			},
		},
		{
			files: [ 'packages/**/*.js' ],
			excludedFiles: [
				'packages/block-library/src/*/save.js',
				...developmentFiles,
			],
			rules: {
				'react/forbid-elements': [ 'error', {
					forbid: [
						[ 'button', 'Button' ],
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
				} ],
			},
		},
		{
			files: [
				'packages/jest*/**/*.js',
			],
			extends: [
				'plugin:@wordpress/eslint-plugin/test-unit',
			],
		},
		{
			files: [ 'packages/e2e-test*/**/*.js' ],
			extends: [
				'plugin:@wordpress/eslint-plugin/test-e2e',
			],
		},
	],
};
