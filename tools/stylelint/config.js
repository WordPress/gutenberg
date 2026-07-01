// CSS Baseline 2024 stepped-value functions not yet recognized by Stylelint.
const CSS_BASELINE_2024_FUNCTIONS = [ 'round', 'rem', 'mod' ];

const SELECTOR_CLASS_PATTERN = [
	'^[a-z][a-z0-9]*(?:(?:__|--|-)[a-z0-9]+)*$',
	{
		message:
			'Selector should use lowercase class segments separated with hyphens, double hyphens, or double underscores (selector-class-pattern)',
	},
];

/** @type {import('stylelint').Config} */
module.exports = {
	extends: '@wordpress/stylelint-config/scss-stylistic',
	plugins: [
		'stylelint-plugin-logical-css',
		'@wordpress/theme/stylelint-plugins/no-token-fallback-values',
	],
	rules: {
		'at-rule-empty-line-before': null,
		'at-rule-no-unknown': null,
		'comment-empty-line-before': null,
		'declaration-property-value-allowed-list': [
			{
				'flex-direction': '/^(?!(row|column)-reverse).*$/',
			},
			{
				message: ( property, value ) =>
					`Avoid "${ value }" value for the "${ property }" property. For accessibility reasons, visual, reading, and DOM order must match. Only use the reverse values when they do not affect reading order, meaning, and interaction.`,
			},
		],
		'declaration-property-value-disallowed-list': [
			{
				'/.*/': [ '/--wp-components-color-/' ],
				cursor: [ 'pointer' ],
			},
			{
				message: ( property, value ) => {
					if ( property === 'cursor' ) {
						return 'Use the `var( --wpds-cursor-control )` token for interactive non-link controls. If this is for a link, you can disable this rule.';
					}
					return `Avoid using "${ value }" in "${ property }". --wp-components-color-* variables are not ready to be used outside of the components package.`;
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
		'plugin-wpds/no-token-fallback-values': true,
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
		{
			files: [
				'packages/components/src/**/*.module.{css,scss}',
				'packages/theme/src/**/*.module.{css,scss}',
				'packages/ui/src/**/*.module.{css,scss}',
			],
			rules: {
				'selector-class-pattern': SELECTOR_CLASS_PATTERN,
			},
		},
	],
	reportDescriptionlessDisables: true,
};
