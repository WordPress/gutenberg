'use strict';

/** @type {import('stylelint').Config} */
module.exports = {
	extends: [ './', 'stylelint-config-recommended-scss' ].map(
		require.resolve
	),

	plugins: [ 'stylelint-scss' ],

	rules: {
		// @wordpress/stylelint-config CSS overrides.
		'at-rule-empty-line-before': [
			'always',
			{
				except: [ 'blockless-after-blockless' ],
				ignore: [ 'after-comment' ],
				ignoreAtRules: [ 'else' ],
			},
		],

		'scss/at-else-closing-brace-newline-after': 'always-last-in-chain',
		'scss/at-else-closing-brace-space-after': 'always-intermediate',
		'scss/at-else-empty-line-before': 'never',
		'scss/at-if-closing-brace-newline-after': 'always-last-in-chain',
		'scss/at-if-closing-brace-space-after': 'always-intermediate',
		'scss/selector-no-redundant-nesting-selector': true,
		/* This value gets overwritten by stylelint-config-recommended-scss so we need to set it again. */
		'declaration-block-no-duplicate-properties': [
			true,
			{
				ignore: [ 'consecutive-duplicates' ],
			},
		],
	},
};
