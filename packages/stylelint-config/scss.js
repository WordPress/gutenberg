import { fileURLToPath } from 'node:url';

/** @type {import('stylelint').Config} */
export default {
	extends: [ './', 'stylelint-config-recommended-scss' ].map( ( m ) =>
		fileURLToPath( import.meta.resolve( m ) )
	),

	plugins: [ 'stylelint-scss' ],

	rules: {
		// @wordpress/stylelint-config CSS overrides.
		'at-rule-empty-line-before': [
			'always',
			{
				except: [ 'blockless-after-blockless', 'after-same-name' ],
				ignore: [ 'after-comment', 'first-nested' ],
				ignoreAtRules: [
					'else',
					'if',
					'include',
					'mixin',
					'extend',
					'media',
					'warn',
					'for',
					'each',
					'content',
				],
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
