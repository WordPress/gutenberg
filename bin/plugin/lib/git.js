// @ts-nocheck
/**
 * External dependencies
 */
const SimpleGit = require( 'simple-git' );

/**
 * Internal dependencies
 */
const { getRandomTemporaryPath } = require( './utils' );

/**
 * Clones a GitHub repository.
 *
 * @param {string} repositoryUrl
 *
 * @return {Promise<string>} Repository local Path
 */
async function clone( repositoryUrl ) {
	const gitWorkingDirectoryPath = getRandomTemporaryPath();
	const simpleGit = SimpleGit();
	await simpleGit.clone( repositoryUrl, gitWorkingDirectoryPath, [
		'--depth=1',
		'--no-single-branch',
	] );
	return gitWorkingDirectoryPath;
}

/**
 * Fetches changes from the repository.
 *
 * @param {string}          gitWorkingDirectoryPath Local repository path.
 * @param {string[]|Object} options                 Git options to apply.
 */
async function fetch( gitWorkingDirectoryPath, options = [] ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.fetch( options );
}

/**
 * Commits changes to the repository.
 *
 * @param {string}   gitWorkingDirectoryPath Local repository path.
 * @param {string}   message                 Commit message.
 * @param {string[]} filesToAdd              Files to add.
 *
 * @return {Promise<string>} Commit Hash
 */
async function commit( gitWorkingDirectoryPath, message, filesToAdd = [] ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.add( filesToAdd );
	const commitData = await simpleGit.commit( message );
	const commitHash = commitData.commit;

	return commitHash;
}

/**
 * Creates a local branch.
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 * @param {string} branchName              Branch Name
 */
async function createLocalBranch( gitWorkingDirectoryPath, branchName ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.checkoutLocalBranch( branchName );
}

/**
 * Checkout a local branch.
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 * @param {string} branchName              Branch Name
 */
async function checkoutRemoteBranch( gitWorkingDirectoryPath, branchName ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.fetch( 'origin', branchName );
	await simpleGit.checkout( branchName );
}

/**
 * Creates a local tag.
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 * @param {string} tagName                 Tag Name
 */
async function createLocalTag( gitWorkingDirectoryPath, tagName ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.addTag( tagName );
}

/**
 * Pushes a local branch to the origin.
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 * @param {string} branchName              Branch Name
 */
async function pushBranchToOrigin( gitWorkingDirectoryPath, branchName ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.push( 'origin', branchName );
}

/**
 * Pushes tags to the origin.
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 */
async function pushTagsToOrigin( gitWorkingDirectoryPath ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.pushTags( 'origin' );
}

/**
 * Discard local changes.
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 */
async function discardLocalChanges( gitWorkingDirectoryPath ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.reset( 'hard' );
}

/**
 * Reset local branch against the origin.
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 * @param {string} branchName              Branch Name
 */
async function resetLocalBranchAgainstOrigin(
	gitWorkingDirectoryPath,
	branchName
) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.fetch();
	await simpleGit.checkout( branchName );
	await simpleGit.pull( 'origin', branchName );
}

/**
 * Gets the commit hash for the last commit in the current branch.
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 *
 * @return {string} Commit hash.
 */
async function getLastCommitHash( gitWorkingDirectoryPath ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	return await simpleGit.revparse( [ '--short', 'HEAD' ] );
}

/**
 * Cherry-picks a commit into trunk
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 * @param {string} branchName              Branch name.
 * @param {string} commitHash              Commit hash.
 */
async function cherrypickCommitIntoBranch(
	gitWorkingDirectoryPath,
	branchName,
	commitHash
) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.checkout( branchName );
	await simpleGit.raw( [ 'cherry-pick', commitHash ] );
}

/**
 * Replaces the local branch's content with the content from another branch.
 *
 * @param {string} gitWorkingDirectoryPath Local repository path.
 * @param {string} sourceBranchName        Branch Name
 */
async function replaceContentFromRemoteBranch(
	gitWorkingDirectoryPath,
	sourceBranchName
) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.raw( [ 'rm', '-r', '.' ] );
	await simpleGit.raw( [
		'checkout',
		`origin/${ sourceBranchName }`,
		'--',
		'.',
	] );
}

module.exports = {
	clone,
	commit,
	checkoutRemoteBranch,
	createLocalBranch,
	createLocalTag,
	fetch,
	pushBranchToOrigin,
	pushTagsToOrigin,
	discardLocalChanges,
	resetLocalBranchAgainstOrigin,
	getLastCommitHash,
	cherrypickCommitIntoBranch,
	replaceContentFromRemoteBranch,
};
