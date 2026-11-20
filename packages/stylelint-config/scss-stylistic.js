import { fileURLToPath } from 'node:url';
import { defineStylistic } from '@stylistic/stylelint-plugin';
import { stylisticRules } from './stylistic.js';

/** @type {import('stylelint').Config} */
export default {
	extends: [ './stylistic.js', './scss.js' ].map( ( m ) =>
		fileURLToPath( import.meta.resolve( m ) )
	),
	/*
	 * `@stylistic/stylelint-plugin` checks SCSS only with the rules in its `scss` namespace, so the stylistic rules are configured again as `@stylistic/scss/*`. The `@stylistic/*` rules yield to these copies on the stylesheets they read.
	 */
	rules: defineStylistic( {
		syntax: 'scss',
		rules: {
			...stylisticRules,
			'block-opening-brace-space-before': 'always',
			'block-closing-brace-newline-after': [
				'always',
				{
					ignoreAtRules: [ 'if', 'else' ],
				},
			],
			'at-rule-name-space-after': 'always',
		},
	} ),
};
