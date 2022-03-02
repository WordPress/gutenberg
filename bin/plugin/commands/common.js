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
	// Cloning the repository.
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
 * Finds the name of the current plugin release branch based on the version in
 * the package.json file.
 *
 * @param {string} gitWorkingDirectoryPath Path to the project's working directory.
 *
 * @return {string} Name of the plugin release branch.
 */
async function findPluginReleaseBranchName( gitWorkingDirectoryPath ) {
	await git.checkoutRemoteBranch( gitWorkingDirectoryPath, 'trunk' );

	const packageJsonPath = gitWorkingDirectoryPath + '/package.json';
	const mainPackageJson = readJSONFile( packageJsonPath );
	const mainParsedVersion = semver.parse( mainPackageJson.version );

	return 'release/' + mainParsedVersion.major + '.' + mainParsedVersion.minor;
}

/**
 * Calculates version bump for the packages based on the content
 * from the provided CHANGELOG file split into individual lines.
 *
 * @param {string[]}                  lines                Changelog content split into lines.
 * @param {('patch'|'minor'|'major')} [minimumVersionBump] Minimum version bump for the package.
 *                                                         Defaults to `patch`.
 *
 * @return {string|null} Version bump when applicable, or null otherwise.
 */
function calculateVersionBumpFromChangelog(
	lines,
	minimumVersionBump = 'patch'
) {
	let changesDetected = false;
	let versionBump = null;
	for ( const line of lines ) {
		const lineNormalized = line.toLowerCase().trimLeft();
		// Detect unpublished changes first.
		if ( lineNormalized.startsWith( '## unreleased' ) ) {
			changesDetected = true;
			continue;
		}

		// Skip all lines until unpublished changes found.
		if ( ! changesDetected ) {
			continue;
		}

		// A previous published version detected. Stop processing.
		if ( lineNormalized.startsWith( '## ' ) ) {
			break;
		}

		// A major version bump required. Stop processing.
		if ( lineNormalized.startsWith( '### breaking change' ) ) {
			versionBump = 'major';
			break;
		}

		// A minor version bump required. Proceed to the next line.
		if (
			lineNormalized.startsWith( '### deprecation' ) ||
			lineNormalized.startsWith( '### enhancement' ) ||
			lineNormalized.startsWith( '### new api' ) ||
			lineNormalized.startsWith( '### new feature' )
		) {
			versionBump = 'minor';
			continue;
		}

		// A version bump required. Found new changelog section.
		if (
			versionBump !== 'minor' &&
			( lineNormalized.startsWith( '### ' ) ||
				lineNormalized.includes( '- ' ) )
		) {
			versionBump = minimumVersionBump;
		}
	}
	return versionBump;
}

module.exports = {
	calculateVersionBumpFromChangelog,
	findPluginReleaseBranchName,
	runGitRepositoryCloneStep,
	runCleanLocalFoldersStep,
};
