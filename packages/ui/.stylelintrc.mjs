/** @type {import('stylelint').Config} */
export default {
	extends: '@wordpress/stylelint-tools/config',
	rules: {
		// `@wordpress/stylelint-config` forbids `--_gcd-*` via `custom-property-pattern`.
		// Disable that rule here so this package can keep using those tokens as its
		// internal global CSS defense bridge.
		'custom-property-pattern': null,
	},
};
