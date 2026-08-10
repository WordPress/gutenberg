import { fileURLToPath } from 'node:url';

/**
 * The set of rules shared by the WordPress projects that lint their own
 * stylesheets — Gutenberg and WordPress Core.
 *
 * It layers on top of `scss-stylistic` and mostly does three things:
 *
 * - Turns off the stylistic and SCSS rules that the existing WordPress
 *   codebases do not follow, so the config can be adopted without a mass
 *   reformat.
 * - Adds the accessibility rules that keep visual, reading, and DOM order in
 *   sync (`order`, reversed `flex-direction`).
 * - Relaxes `selector-class-pattern` to allow BEM-style class names.
 *
 * Project-specific rules do not belong here. Extend this config and add them
 * in the consuming project instead.
 *
 * @type {import('stylelint').Config}
 */
export default {
	extends: [ './scss-stylistic' ].map( ( m ) =>
		fileURLToPath( import.meta.resolve( m ) )
	),
	reportNeedlessDisables: true,
	reportDescriptionlessDisables: true,
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
		'selector-class-pattern': [
			'^[a-z][a-z0-9]*(?:(?:__|--|-)[a-z0-9]+)*$',
			{
				message:
					'Selector should use lowercase class segments separated with hyphens, double hyphens, or double underscores (selector-class-pattern)',
			},
		],
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
};
