/**
 * The original version of this file is based on WordPress ESLint rules and shared configs:
 * https://github.com/WordPress-Coding-Standards/eslint-plugin-wordpress.
 */

module.exports = {
	env: {
		es6: true,
	},

	rules: require( './rules/esnext' ),
};
