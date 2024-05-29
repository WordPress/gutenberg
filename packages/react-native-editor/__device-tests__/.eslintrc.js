module.exports = {
	extends: '../.eslintrc.js',
	globals: {
		// Defined in 'jest_ui_test_environment.js'
		editorPage: true,
		e2eTestData: true,
		e2eUtils: true,
	},
	rules: {
		'jest/expect-expect': 'off',
	},
};
