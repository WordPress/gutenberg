/**
 * Internal dependencies
 */
const { getRandomTemporaryPath, runShellScript } = require( './utils' );

function checkout( repositoryUrl ) {
	const svnWorkingDirectoryPath = getRandomTemporaryPath();
	runShellScript(
		'svn checkout ' + repositoryUrl + '/trunk ' + svnWorkingDirectoryPath
	);

	return svnWorkingDirectoryPath;
}

function commit( svnWorkingDirectoryPath, message ) {
	runShellScript(
		'svn commit -m "' + message + '"',
		svnWorkingDirectoryPath
	);
}

function tagTrunk( repositoryUrl, tagName, message ) {
	runShellScript(
		'svn cp ' +
			repositoryUrl +
			'/trunk ' +
			repositoryUrl +
			'/tags/' +
			tagName +
			' -m "' +
			message +
			'"'
	);
}

module.exports = {
	checkout,
	commit,
	tagTrunk,
};
