/**
 * External dependencies
 */
const path = require( 'path' );
const SimpleGit = require( 'simple-git/promise' );
const os = require( 'os' );
const { v4: uuid } = require( 'uuid' );

async function clone( repositoryUrl ) {
	const gitWorkingDirectoryPath = path.join( os.tmpdir(), uuid() );
	const simpleGit = SimpleGit();
	await simpleGit.clone( repositoryUrl, gitWorkingDirectoryPath );
	return gitWorkingDirectoryPath;
}

async function commit( gitWorkingDirectoryPath, message, filesToAdd = [] ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.add( filesToAdd );
	const commitData = await simpleGit.commit( message );
	const commitHash = commitData.commit;

	return commitHash;
}

async function createLocalBranch( gitWorkingDirectoryPath, branchName ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.checkoutLocalBranch( branchName );
}

async function checkoutRemoteBranch( gitWorkingDirectoryPath, branchName ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.checkout( branchName );
}

async function createLocalTag( gitWorkingDirectoryPath, tagName ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.addTag( tagName );
}

async function pushBranchToOrigin( gitWorkingDirectoryPath, branchName ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.push( 'origin', branchName );
}

async function pushTagsToOrigin( gitWorkingDirectoryPath ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.pushTags( 'origin' );
}

async function discardLocalChanges( gitWorkingDirectoryPath ) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.reset( 'hard' );
}

async function resetLocalBranchAgainstOrigin(
	gitWorkingDirectoryPath,
	branchName
) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.fetch();
	await simpleGit.checkout( branchName );
	await simpleGit.pull( 'origin', branchName );
}

async function cherrypickCommitIntoBranch(
	gitWorkingDirectoryPath,
	commitHash
) {
	const simpleGit = SimpleGit( gitWorkingDirectoryPath );
	await simpleGit.checkout( 'master' );
	await simpleGit.raw( [ 'cherry-pick', commitHash ] );
}

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
	pushBranchToOrigin,
	pushTagsToOrigin,
	discardLocalChanges,
	resetLocalBranchAgainstOrigin,
	cherrypickCommitIntoBranch,
	replaceContentFromRemoteBranch,
};
