/**
 * External dependencies
 */
const path = require( 'path' );
const os = require( 'os' );
const { v4: uuid } = require( 'uuid' );
const { runShellScript } = require( './utils' );

function checkout( repositoryUrl ) {
	const svnWorkingDirectoryPath = path.join( os.tmpdir(), uuid() );
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
