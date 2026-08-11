import { fileURLToPath } from 'node:url';

/** @type {import('stylelint').Config} */
export default {
	extends: [ './stylistic', './scss' ].map( ( m ) =>
		fileURLToPath( import.meta.resolve( m ) )
	),
	rules: {
		'@stylistic/block-opening-brace-space-before': 'always',
		'@stylistic/block-closing-brace-newline-after': [
			'always',
			{
				ignoreAtRules: [ 'if', 'else' ],
			},
		],
		'@stylistic/at-rule-name-space-after': 'always',
	},
};
