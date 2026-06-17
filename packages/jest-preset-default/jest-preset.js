module.exports = {
	moduleNameMapper: {
		'\\.(scss|css)$': require.resolve( './scripts/style-mock.js' ),
	},
	modulePaths: [ '<rootDir>' ],
	setupFiles: [ require.resolve( './scripts/setup-globals.js' ) ],
	setupFilesAfterEnv: [
		require.resolve( './scripts/setup-test-framework.js' ),
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
