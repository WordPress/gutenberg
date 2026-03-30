module.exports = {
	root: true,
	extends: [ '../../.eslintrc.js' ],
	rules: {
		// Console should be allowed in a build tool
		'no-console': 'off',
		/*
		 * These rules are designed for source files processed by esbuild, not for the build script itself,
		 * which runs directly in Node.js.
		 */
		'@wordpress/no-wp-process-env': 'off',
		'@wordpress/wp-global-usage': 'off',
	},
};
