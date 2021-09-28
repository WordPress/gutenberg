// eslint config for markdown documentation

// This configuration is used when parsing JS code blocks
// in documentation. It attempts to allow for snippets of
// codes which may define variables unused, or use variables
// that are assumed to be defined.
module.exports = {
	root: true,
	plugins: [ 'markdown' ],
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	rules: {
		'no-undef': 'off',
		'no-unused-vars': 'off',
	},
};
