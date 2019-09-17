'use strict';

module.exports = {
	plugins: [ 'stylelint-declaration-strict-value' ],
	rules: {
		'scale-unlimited/declaration-strict-value': [ [
			'/color/',
			'/z-index/',
			'/background/',
			'/border-color/',
		], { ignoreKeywords: [
			'transparent',
			'inherit',
			'currentColor',
			'0',
		] } ],
	},
};
