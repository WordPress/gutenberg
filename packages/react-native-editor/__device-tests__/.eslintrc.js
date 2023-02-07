module.exports = {
	extends: '../.eslintrc.js',
	globals: {
		// Defined in 'jest_ui_test_environment.js'
		editorPage: true,
		E2ETestData: true,
		E2EUtils: true,
		E2EBlockNames: true,
	},
	rules: {
		'jest/expect-expect': 'off',
	},
};
