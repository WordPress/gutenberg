module.exports = {
	moduleNameMapper: {
		'\\.(scss|css)$': require.resolve(
			'@wordpress/jest-preset-default/scripts/style-mock.js'
		),
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
	snapshotSerializers: [ require.resolve( 'enzyme-to-json/serializer.js' ) ],
	testMatch: [
		'**/__tests__/**/*.[jt]s?(x)',
		'**/test/*.[jt]s?(x)',
		'**/?(*.)test.[jt]s?(x)',
	],
	testPathIgnorePatterns: [ '/node_modules/', '<rootDir>/vendor/' ],
	timers: 'fake',
	transform: {
		'\\.[jt]sx?$': require.resolve( 'babel-jest' ),
	},
};
