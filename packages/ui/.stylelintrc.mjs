/** @type {import('stylelint').Config} */
export default {
	extends: '@wordpress/stylelint-tools/config',
	rules: {
		// `--_gcd-*` is the internal global CSS defense bridge for this package.
		'plugin-wpds/no-global-css-defense-custom-properties': null,
	},
};
