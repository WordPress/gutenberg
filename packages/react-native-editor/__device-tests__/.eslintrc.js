module.exports = {
	extends: '../.eslintrc.js',
	globals: {
		editorPage: true, // Defined in 'jest_ui_test_environment.js'
	},
	rules: {
		'jest/expect-expect': 'off',
	},
};
