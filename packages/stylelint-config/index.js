'use strict';

module.exports = {
	extends: 'stylelint-config-recommended',
	rules: {
		'at-rule-empty-line-before': [
			'always',
			{
				except: [ 'blockless-after-blockless' ],
				ignore: [ 'after-comment' ],
			},
		],
		'at-rule-name-case': 'lower',
		'at-rule-name-space-after': 'always-single-line',
		'at-rule-no-unknown': true,
		'at-rule-semicolon-newline-after': 'always',
		'block-closing-brace-newline-after': 'always',
		'block-closing-brace-newline-before': 'always',
		'block-opening-brace-newline-after': 'always',
		'block-opening-brace-space-before': 'always',
		'color-hex-case': 'lower',
		'color-hex-length': 'short',
		'color-named': 'never',
		'comment-empty-line-before': [
			'always',
			{
				ignore: [ 'stylelint-commands' ],
			},
		],
		'declaration-bang-space-after': 'never',
		'declaration-bang-space-before': 'always',
		'declaration-block-no-duplicate-properties': [
			true,
			{
				ignore: [ 'consecutive-duplicates' ],
			},
		],
		'declaration-block-semicolon-newline-after': 'always',
		'declaration-block-semicolon-space-before': 'never',
		'declaration-block-trailing-semicolon': 'always',
		'declaration-colon-newline-after': 'always-multi-line',
		'declaration-colon-space-after': 'always-single-line',
		'declaration-colon-space-before': 'never',
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
		'function-comma-space-after': 'always',
		'function-comma-space-before': 'never',
		'function-max-empty-lines': 1,
		'function-name-case': [
			'lower',
			{
				ignoreFunctions: [ '/^DXImageTransform.Microsoft.*$/' ],
			},
		],
		'function-parentheses-space-inside': 'never',
		'function-url-quotes': 'never',
		'function-whitespace-after': 'always',
		indentation: 'tab',
		'length-zero-no-unit': true,
		'max-empty-lines': 2,
		'max-line-length': [
			80,
			{
				ignore: 'non-comments',
				ignorePattern: [
					'/(https?://[0-9,a-z]*.*)|(^description\\:.+)|(^tags\\:.+)/i',
				],
			},
		],
		'media-feature-colon-space-after': 'always',
		'media-feature-colon-space-before': 'never',
		'media-feature-range-operator-space-after': 'always',
		'media-feature-range-operator-space-before': 'always',
		'media-query-list-comma-newline-after': 'always-multi-line',
		'media-query-list-comma-space-after': 'always-single-line',
		'media-query-list-comma-space-before': 'never',
		'no-eol-whitespace': true,
		'no-missing-end-of-source-newline': true,
		'number-leading-zero': 'always',
		'number-no-trailing-zeros': true,
		'property-case': 'lower',
		'rule-empty-line-before': [
			'always',
			{
				ignore: [ 'after-comment' ],
			},
		],
		'selector-attribute-brackets-space-inside': 'never',
		'selector-attribute-operator-space-after': 'never',
		'selector-attribute-operator-space-before': 'never',
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
		'selector-combinator-space-after': 'always',
		'selector-combinator-space-before': 'always',
		'selector-list-comma-newline-after': 'always',
		'selector-list-comma-space-before': 'never',
		'selector-max-empty-lines': 0,
		'selector-pseudo-class-case': 'lower',
		'selector-pseudo-class-parentheses-space-inside': 'never',
		'selector-pseudo-element-case': 'lower',
		'selector-pseudo-element-colon-notation': 'double',
		'selector-type-case': 'lower',
		'string-quotes': 'double',
		'unit-case': 'lower',
		'value-keyword-case': 'lower',
		'value-list-comma-newline-after': 'always-multi-line',
		'value-list-comma-space-after': 'always-single-line',
		'value-list-comma-space-before': 'never',
	},
};
