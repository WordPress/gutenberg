/** @type {import('stylelint').Config} */
module.exports = {
	extends: '@wordpress/stylelint-config/scss-stylistic',
	plugins: [ 'stylelint-plugin-logical-css' ],
	rules: {
		'at-rule-empty-line-before': null,
		'at-rule-no-unknown': null,
		'comment-empty-line-before': null,
		'declaration-property-value-disallowed-list': [
			{
				'flex-direction': [ '/-reverse$/' ],
				'/.*/': [ '/--wp-components-color-/' ],
			},
			{
				message: ( property, value ) => {
					switch ( property ) {
						// Don't allow reverse values for flex-direction.
						case 'flex-direction':
							if ( /-reverse$/.test( value ) ) {
								return 'Avoid "-reverse" values for the "flex-direction" property.';
							}
							break;

						// Don't allow --wp-components-color-* variables outside of the components package.
						default:
							if ( /--wp-components-color-/.test( value ) ) {
								return 'Avoid using "--wp-components-color-*" variables outside of the components package.';
							}
							break;
					}

					return `Avoid "${ value }" for "${ property }".`;
				},
			},
		],
		'font-weight-notation': null,
		'@stylistic/max-line-length': null,
		'no-descending-specificity': null,
		'property-disallowed-list': [
			[ 'order' ],
			{
				message:
					'Avoid the order property. For accessibility reasons, visual, reading, and DOM order must match. Only use the order property when it does not affect reading order, meaning, and interaction.',
			},
		],
		'rule-empty-line-before': null,
		'selector-class-pattern': null,
		'value-keyword-case': null,
		'scss/operator-no-unspaced': null,
		'scss/selector-no-redundant-nesting-selector': null,
		'scss/load-partial-extension': null,
		'scss/no-global-function-names': null,
		'scss/comment-no-empty': null,
		'scss/at-extend-no-missing-placeholder': null,
		'scss/operator-no-newline-after': null,
		'scss/at-if-closing-brace-newline-after': null,
		'scss/at-else-empty-line-before': null,
		'scss/at-if-closing-brace-space-after': null,
		'no-invalid-position-at-import-rule': null,
	},
	overrides: [
		{
			files: [ '**/*.module.css' ],
			rules: {
				'function-no-unknown': [
					true,
					{
						ignoreFunctions: [
							// CSS stepped value math functions in Baseline 2024.
							// This rule exception can likely be removed when
							// updating to a more recent version of Stylelint.
							'round',
							'rem',
							'mod',
						],
					},
				],
				'declaration-property-max-values': {
					// Prevents left/right values with shorthand property names (unclear for RTL)
					margin: 3,
					padding: 3,
					'border-width': 3,
					'border-color': 3,
					'border-style': 3,
					'border-radius': 3,
					inset: 3,
				},
				'plugin/use-logical-properties-and-values': [
					true,
					{
						ignore: [
							// Doesn't affect RTL styles
							'width',
							'min-width',
							'max-width',
							'height',
							'min-height',
							'max-height',
							'margin-top',
							'margin-bottom',
							'padding-top',
							'padding-bottom',
							'top',
							'bottom',
						],
					},
				],
				'property-no-unknown': [
					true,
					{
						ignoreProperties: [
							// https://github.com/css-modules/css-modules/blob/master/docs/composition.md
							'composes',
						],
					},
				],
			},
		},
	],
	reportDescriptionlessDisables: true,
};
