/** @flow
 * @format */

const main = require( './jest.config.js' );

module.exports = {
	...main,
	moduleDirectories: [ 'node_modules', 'symlinked-packages-in-parent' ],
};
