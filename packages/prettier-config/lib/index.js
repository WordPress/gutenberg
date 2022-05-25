/**
 * External dependencies
 */
const prettierPackage = require( require.resolve( 'prettier/package.json' ) );

/** @typedef {import('prettier').Config} PrettierConfig */

/**
 * @typedef WPPrettierOptions
 *
 * @property {boolean} [parenSpacing=true] Insert spaces inside parentheses.
 */

const isWPPrettier = prettierPackage.name === 'wp-prettier';
const customOptions = isWPPrettier
	? { parenSpacing: true, jsxBracketSameLine: false }
	: { bracketSameLine: false };
const customStyleOptions = isWPPrettier ? { parenSpacing: false } : {};

// Disable reason: The current JSDoc tooling does not yet understand TypeScript
// union types.
/** @type {PrettierConfig & WPPrettierOptions} */
const config = {
	useTabs: true,
	tabWidth: 4,
	printWidth: 80,
	singleQuote: true,
	trailingComma: 'es5',
	bracketSpacing: true,
	semi: true,
	arrowParens: 'always',
	...customOptions,
	overrides: [
		{
			files: '*.{css,sass,scss}',
			options: {
				singleQuote: false,
				...customStyleOptions,
			},
		},
	],
};

module.exports = config;
