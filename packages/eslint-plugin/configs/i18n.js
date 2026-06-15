/**
 * Internal dependencies
 */
const wpRules = require( '../rules' );

const wpPlugin = { rules: wpRules };

module.exports = [
	{
		plugins: {
			'@wordpress': wpPlugin,
		},
		rules: {
			'@wordpress/valid-sprintf': 'error',
			'@wordpress/i18n-translator-comments': 'error',
			'@wordpress/i18n-text-domain': 'error',
			'@wordpress/i18n-no-collapsible-whitespace': 'error',
			'@wordpress/i18n-no-placeholders-only': 'error',
			'@wordpress/i18n-no-variables': 'error',
			'@wordpress/i18n-ellipsis': 'error',
			'@wordpress/i18n-no-flanking-whitespace': 'error',
			'@wordpress/i18n-hyphenated-range': 'error',
		},
	},
];
