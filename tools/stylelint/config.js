// CSS Baseline 2024 stepped-value functions not yet recognized by Stylelint.
const CSS_BASELINE_2024_FUNCTIONS = [ 'round', 'rem', 'mod' ];

/** @type {import('stylelint').Config} */
module.exports = {
	// The rules shared with WordPress Core live in the published config so both
	// projects have a single source for them. Only Gutenberg-specific
	// configuration belongs below.
	extends: '@wordpress/stylelint-config/project',
	plugins: [ 'stylelint-plugin-logical-css' ],
	rules: {
		'declaration-property-value-disallowed-list': [
			{
				'/.*/': [
					'/--wp-components-color-/',
					'/\\$font-weight-regular/',
					'/\\$font-weight-medium/',
				],
				cursor: [ 'pointer' ],
			},
			{
				message: ( property, value ) => {
					if (
						value.includes( '$font-weight-regular' ) ||
						value.includes( '$font-weight-medium' )
					) {
						const variable = value.includes(
							'$font-weight-regular'
						)
							? '$font-weight-regular'
							: '$font-weight-medium';
						return `\`${ variable }\` has been removed. Use \`var(--wpds-typography-font-weight-default)\` or \`var(--wpds-typography-font-weight-emphasis)\` based on the intended emphasis.`;
					}
					if ( property === 'cursor' ) {
						return 'Use the `var( --wpds-cursor-control )` token for interactive non-link controls. If this is for a link, you can disable this rule.';
					}
					return `Avoid using "${ value }" in "${ property }". --wp-components-color-* variables are not ready to be used outside of the components package.`;
				},
			},
		],
	},
	overrides: [
		{
			files: [
				'**/*.module.{css,scss}',
				// Can be removed when all `routes/` stylesheets are converted to CSS modules.
				'routes/**/*.{css,scss}',
			],
			rules: {
				'function-no-unknown': [
					true,
					{ ignoreFunctions: CSS_BASELINE_2024_FUNCTIONS },
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
							'border-bottom',
							'border-top',
							'width',
							'min-width',
							'max-width',
							'height',
							'min-height',
							'max-height',
							'margin-top',
							'margin-bottom',
							'overflow-x',
							'overflow-y',
							'padding-top',
							'padding-bottom',
							'scroll-margin-top',
							'scroll-margin-bottom',
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
				'selector-pseudo-class-no-unknown': [
					true,
					{
						ignorePseudoClasses: [
							// CSS Modules global escape hatch.
							'global',
						],
					},
				],
			},
		},
		{
			// SCSS-only: use the Sass-aware `function-no-unknown` variant.
			files: [ '**/*.module.scss', 'routes/**/*.scss' ],
			rules: {
				'function-no-unknown': null,
				'scss/function-no-unknown': [
					true,
					{
						ignoreFunctions: [
							...CSS_BASELINE_2024_FUNCTIONS,
							// Sass helpers from `@wordpress/base-styles`.
							'z-index',
						],
					},
				],
			},
		},
	],
};
