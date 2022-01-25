module.exports = {
	plugins: [ '@wordpress' ],
	rules: {
		'@wordpress/valid-sprintf': 'error',
		'@wordpress/i18n-translator-comments': 'error',
		'@wordpress/i18n-text-domain': 'error',
		'@wordpress/i18n-no-collapsible-whitespace': 'error',
		'@wordpress/i18n-no-placeholders-only': 'error',
		'@wordpress/i18n-no-variables': 'error',
		'@wordpress/i18n-ellipsis': 'error',
		'@wordpress/i18n-no-flanking-whitespace': 'error',
		'@wordpress/i18n-range-hyphen': 'error',
	},
};
