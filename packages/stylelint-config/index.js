'use strict';

/** @type {import('stylelint').Config} */
module.exports = {
	extends: [ 'stylelint-config-recommended' ].map( require.resolve ),
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
		'length-zero-no-unit': true,
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

		/* Disable new rules from stylelint-config-recommended 7 > 14 */
		'function-no-unknown': null,
		'keyframe-block-no-duplicate-selectors': null,
		'annotation-no-unknown': null,
		'selector-anb-no-unmatchable': null,
		'media-query-no-invalid': null,
	},
};
