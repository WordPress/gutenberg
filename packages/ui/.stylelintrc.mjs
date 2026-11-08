/** @type {import('stylelint').Config} */
export default {
	extends: '@wordpress/stylelint-tools/config',
	rules: {
		// `@wordpress/stylelint-config` forbids `--_gcd-*` and `--_wp-*` via `custom-property-pattern`. Disable that rule here so this package can keep using those private tokens.
		'custom-property-pattern': null,
	},
};
