module.exports = {
	extends: [
		'plugin:jest/recommended',
	],
	env: {
		browser: true,
	},
	globals: {
		browser: 'readonly',
		page: 'readonly',
		wp: 'readonly',
	},
};
