module.exports = {
	setupFilesAfterEnv: [
		//'@wordpress/jest-console',
		'<rootDir>/jest.setup.js',
	],
	testPathIgnorePatterns: [
		'/node_modules/',
		'<rootDir>/wordpress/',
		'e2e-tests/specs/performance/',
	],
};
