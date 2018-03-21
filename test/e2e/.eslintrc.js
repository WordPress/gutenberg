module.exports = {
	root: true,
	extends: [
		'../../eslint/config.js',
	],
	env: {
		jest: true
	},
	globals: {
		page: true,
		browser: true,
	},
};
