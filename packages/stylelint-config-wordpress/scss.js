'use strict';

module.exports = {
	extends: [
		'./',
	].map( require.resolve ),

	plugins: [
		'stylelint-scss',
	],

	rules: {

		// stylelint-config-wordpress css overrides
		'at-rule-no-unknown': null,
		'at-rule-empty-line-before': [ 'always', {
			except: ['blockless-after-blockless'],
			ignore: ['after-comment'],
			ignoreAtRules: ['else'],
		} ],

		'block-opening-brace-space-before': 'always',
		'block-closing-brace-newline-after': [
			'always', {
				ignoreAtRules: [ 'if', 'else' ],
			},
		],
		'at-rule-name-space-after': 'always',
		'scss/at-else-closing-brace-newline-after': 'always-last-in-chain',
		'scss/at-else-closing-brace-space-after': 'always-intermediate',
		'scss/at-else-empty-line-before': 'never',
		'scss/at-rule-no-unknown': true,
		'scss/at-if-closing-brace-newline-after': 'always-last-in-chain',
		'scss/at-if-closing-brace-space-after': 'always-intermediate',
		'scss/selector-no-redundant-nesting-selector': true,
	},
};
