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

module.exports = {
	root: true,
	extends: [
		'./eslint/config.js',
		'plugin:jest/recommended'
	],
	env: {
		'jest/globals': true,
	},
	globals: {
		wpApiSettings: true,
	},
	plugins: [
		'jest',
	],
	rules: {
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
				selector: 'ImportDeclaration[source.value=/^api-fetch(\\u002F|$)/]',
				message: 'Use @wordpress/api-fetch as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^blob(\\u002F|$)/]',
				message: 'Use @wordpress/blob as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^block-serialization-spec-parser(\\u002F|$)/]',
				message: 'Use @wordpress/block-serialization-spec-parser as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^blocks(\\u002F|$)/]',
				message: 'Use @wordpress/blocks as import path instead.',
			},{
				selector: 'ImportDeclaration[source.value=/^components(\\u002F|$)/]',
				message: 'Use @wordpress/components as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^data(\\u002F|$)/]',
				message: 'Use @wordpress/data as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^date(\\u002F|$)/]',
				message: 'Use @wordpress/date as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^deprecated(\\u002F|$)/]',
				message: 'Use @wordpress/deprecated as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^dom(\\u002F|$)/]',
				message: 'Use @wordpress/dom as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^editor(\\u002F|$)/]',
				message: 'Use @wordpress/editor as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^element(\\u002F|$)/]',
				message: 'Use @wordpress/element as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^keycodes(\\u002F|$)/]',
				message: 'Use @wordpress/keycodes as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^nux(\\u002F|$)/]',
				message: 'Use @wordpress/nux as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^utils(\\u002F|$)/]',
				message: 'Use @wordpress/utils as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^edit-post(\\u002F|$)/]',
				message: 'Use @wordpress/edit-post as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^viewport(\\u002F|$)/]',
				message: 'Use @wordpress/viewport as import path instead.',
			},
			{
				selector: 'ImportDeclaration[source.value=/^plugins(\\u002F|$)/]',
				message: 'Use @wordpress/plugins as import path instead.',
			},
			{
				"selector": "ImportDeclaration[source.value=/^core-data$/]",
				"message": "Use @wordpress/core-data as import path instead."
			},
			{
				"selector": "ImportDeclaration[source.value=/^core-blocks$/]",
				"message": "Use @wordpress/core-blocks as import path instead."
			},
			{
				selector: 'CallExpression[callee.name="deprecated"] Property[key.name="version"][value.value=/' + majorMinorRegExp + '/]',
				message: 'Deprecated functions must be removed before releasing this version.',
			},
			{
				selector: 'CallExpression[callee.name=/^(invokeMap|get|has|hasIn|invoke|result|set|setWith|unset|update|updateWith)$/] > Literal:nth-child(2)',
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
				message: 'Prefer page.waitForSelector instead.'
			}
		],
	},
	overrides: [
		{
			files: [ 'test/e2e/**/*.js' ],
			globals: {
				page: true,
				browser: true,
			},
		},
	],
};
