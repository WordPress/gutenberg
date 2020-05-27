/**
 * External dependencies
 */
const fs = require( 'fs' );
const rimraf = require( 'rimraf' );
const semver = require( 'semver' );

/**
 * Internal dependencies
 */
const { log, formats } = require( '../lib/logger' );
const { runStep, readJSONFile } = require( '../lib/utils' );
const git = require( '../lib/git' );
const config = require( '../config' );

/**
 * Clone the repository and returns the working directory.
 *
 * @param {string} abortMessage Abort message.
 *
 * @return {Promise<string>} Repository local path.
 */
async function runGitRepositoryCloneStep( abortMessage ) {
	// Cloning the repository
	let gitWorkingDirectoryPath;
	await runStep( 'Cloning the Git repository', abortMessage, async () => {
		log( '>> Cloning the Git repository' );
		gitWorkingDirectoryPath = await git.clone( config.gitRepositoryURL );
		log(
			'>> The Git repository has been successfully cloned in the following temporary folder: ' +
				formats.success( gitWorkingDirectoryPath )
		);
	} );

	return gitWorkingDirectoryPath;
}

/**
 * Clean the working directories.
 *
 * @param {string[]} folders      Folders to clean.
 * @param {string}   abortMessage Abort message.
 */
async function runCleanLocalFoldersStep( folders, abortMessage ) {
	await runStep( 'Cleaning the temporary folders', abortMessage, async () => {
		await Promise.all(
			folders.map( async ( directoryPath ) => {
				if ( fs.existsSync( directoryPath ) ) {
					await rimraf( directoryPath, ( err ) => {
						if ( err ) {
							throw err;
						}
					} );
				}
			} )
		);
	} );
}

/**
 * Finds the name of the current release branch based on the version in
 * the package.json file.
 *
 * @param {string} packageJsonPath Path to the package.json file.
 *
 * @return {string} Name of the release branch.
 */
function findReleaseBranchName( packageJsonPath ) {
	const masterPackageJson = readJSONFile( packageJsonPath );
	const masterParsedVersion = semver.parse( masterPackageJson.version );

	return (
		'release/' + masterParsedVersion.major + '.' + masterParsedVersion.minor
	);
}

module.exports = {
	runGitRepositoryCloneStep,
	runCleanLocalFoldersStep,
	findReleaseBranchName,
};
