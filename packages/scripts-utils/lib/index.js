/**
 * Internal dependencies
 */
const {
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
} = require( './cli' );
const { fromProjectRoot, hasProjectFile } = require( './file' );
const { hasPackageProp } = require( './package' );

module.exports = {
	fromProjectRoot,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	hasPackageProp,
	hasProjectFile,
};
