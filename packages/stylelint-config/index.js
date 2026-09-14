import { fileURLToPath } from 'node:url';

/** @type {import('stylelint').Config} */
export default {
	extends: [ 'stylelint-config-recommended' ].map( ( m ) =>
		fileURLToPath( import.meta.resolve( m ) )
	),
	plugins: [
		'@wordpress/theme/stylelint-plugins/no-unknown-ds-tokens',
		'@wordpress/theme/stylelint-plugins/no-setting-wpds-custom-properties',
		'@wordpress/theme/stylelint-plugins/no-token-fallback-values',
	],
	rules: {
		'at-rule-empty-line-before': [
			'always',
			{
				except: [ 'blockless-after-blockless' ],
				ignore: [ 'after-comment' ],
			},
		],
		'at-rule-no-unknown': true,
		'color-hex-length': 'short',
		'color-named': 'never',
		'comment-empty-line-before': [
			'always',
			{
				ignore: [ 'stylelint-commands' ],
			},
		],
		'declaration-block-no-duplicate-properties': [
			true,
			{
				ignore: [ 'consecutive-duplicates' ],
			},
		],
		'declaration-property-unit-allowed-list': {
			'line-height': [ 'px' ],
		},
		'font-family-name-quotes': 'always-where-recommended',
		'font-weight-notation': [
			'numeric',
			{
				ignore: [ 'relative' ],
			},
		],
		'function-name-case': [
			'lower',
			{
				ignoreFunctions: [ '/^DXImageTransform.Microsoft.*$/' ],
			},
		],
		'function-url-quotes': 'never',
		'length-zero-no-unit': [
			true,
			{ ignore: [ 'custom-properties' ], ignoreFunctions: [ 'var' ] },
		],
		'rule-empty-line-before': [
			'always',
			{
				ignore: [ 'after-comment' ],
			},
		],
		'selector-attribute-quotes': 'always',
		'selector-class-pattern': [
			'^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
			{
				message:
					'Selector should use lowercase and separate words with hyphens (selector-class-pattern)',
			},
		],
		'selector-id-pattern': [
			'^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
			{
				message:
					'Selector should use lowercase and separate words with hyphens (selector-id-pattern)',
			},
		],
		'selector-pseudo-element-colon-notation': 'double',
		'selector-type-case': 'lower',
		'value-keyword-case': 'lower',
		'plugin-wpds/no-setting-wpds-custom-properties': true,
		'plugin-wpds/no-token-fallback-values': true,
		'plugin-wpds/no-unknown-ds-tokens': true,

		/* Disable new rules from stylelint-config-recommended 7 > 14 */
		'function-no-unknown': null,
		'keyframe-block-no-duplicate-selectors': null,
		'annotation-no-unknown': null,
		'selector-anb-no-unmatchable': null,
		'media-query-no-invalid': null,
	},
};
