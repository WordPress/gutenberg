/**
 * External dependencies
 */
const { escapeRegExp, map } = require( 'lodash' );

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

module.exports = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended',
		'plugin:jest/recommended',
	],
	rules: {
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
				selector: 'CallExpression[callee.name="deprecated"] Property[key.name="version"][value.value=/' + majorMinorRegExp + '/]',
				message: 'Deprecated functions must be removed before releasing this version.',
			},
			{
				// Builds a selector which handles CallExpression with path
				// argument at varied position by function.
				//
				// See: https://github.com/WordPress/gutenberg/pull/9615
				selector: map( {
					1: [
						'property',
						'matchesProperty',
						'path',
					],
					2: [
						'invokeMap',
						'get',
						'has',
						'hasIn',
						'invoke',
						'result',
						'set',
						'setWith',
						'unset',
						'update',
						'updateWith',
					],
				}, ( functionNames, argPosition ) => (
					`CallExpression[callee.name=/^(${ functionNames.join( '|' ) })$/] > Literal:nth-child(${ argPosition })`
				) ).join( ',' ),
				message: 'Always pass an array as the path argument',
			},
			{
				selector: 'CallExpression[callee.name=/^(__|_x|_n|_nx)$/] Literal[value=/\\.{3}/]',
				message: 'Use ellipsis character (…) in place of three dots',
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
		'react/forbid-elements': [ 'error', {
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
					message: `use cross-platform <${ componentName }> component instead.`,
				};
			} ),
		} ],
	},
	overrides: [
		{
			files: [ 'packages/e2e-test*/**/*.js' ],
			env: {
				browser: true,
			},
			globals: {
				browser: true,
				page: true,
				wp: true,
			},
		},
	],
};
