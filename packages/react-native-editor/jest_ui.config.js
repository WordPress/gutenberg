const main = require( './jest.config.js' );

module.exports = {
	...main,
	timers: 'real',
	setupFiles: [],
	testMatch: [ '**/__device-tests__/**/*.test.[jt]s?(x)' ],
	testPathIgnorePatterns: [ '/node_modules/' ],
};
