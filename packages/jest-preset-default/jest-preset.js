module.exports = {
	moduleNameMapper: {
		'\\.(scss|css)$': require.resolve(
			'@wordpress/jest-preset-default/scripts/style-mock.js'
		),
		// See https://github.com/facebook/jest/issues/11100#issuecomment-967161978
		'@eslint/eslintrc': '@eslint/eslintrc/dist/eslintrc-universal.cjs',
	},
	modulePaths: [ '<rootDir>' ],
	setupFiles: [
		require.resolve(
			'@wordpress/jest-preset-default/scripts/setup-globals.js'
		),
	],
	setupFilesAfterEnv: [
		require.resolve(
			'@wordpress/jest-preset-default/scripts/setup-test-framework.js'
		),
	],
	testEnvironment: 'jsdom',
	testMatch: [
		'**/__tests__/**/*.[jt]s?(x)',
		'**/test/*.[jt]s?(x)',
		'**/?(*.)test.[jt]s?(x)',
	],
	testPathIgnorePatterns: [ '/node_modules/', '<rootDir>/vendor/' ],
	transform: {
		'\\.[jt]sx?$': require.resolve( 'babel-jest' ),
	},
};
