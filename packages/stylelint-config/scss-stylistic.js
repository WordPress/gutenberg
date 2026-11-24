import { fileURLToPath } from 'node:url';
import { defineStylistic } from '@stylistic/stylelint-plugin';
import { stylisticRules } from './stylistic.js';

/** @type {import('stylelint').Config} */
export default {
	extends: [ './stylistic.js', './scss.js' ].map( ( m ) =>
		fileURLToPath( import.meta.resolve( m ) )
	),
	/*
	 * `@stylistic/stylelint-plugin` checks SCSS only with the rules in its `scss` namespace, so the stylistic rules are configured again as `@stylistic/scss/*`. The SCSS preset parses every file with `postcss-scss`, plain CSS included, so these copies check all of them. The `@stylistic/*` rules inherited from the Stylistic preset are turned off, so that turning off a `@stylistic/scss/*` rule does not hand the file back to its `@stylistic/*` copy.
	 */
	rules: {
		...defineStylistic( {
			rules: Object.fromEntries(
				Object.keys( stylisticRules ).map( ( name ) => [ name, null ] )
			),
		} ),
		...defineStylistic( {
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
	},
};
