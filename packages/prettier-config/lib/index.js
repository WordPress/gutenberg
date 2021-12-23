/** @typedef {import('prettier').Options} PrettierOptions */

/** @type {PrettierOptions} */
const config = {
	arrowParens: 'always',
	bracketSameLine: false,
	bracketSpacing: true,
	printWidth: 80,
	semi: true,
	singleQuote: true,
	tabWidth: 4,
	trailingComma: 'es5',
	useTabs: true,
};

module.exports = config;
