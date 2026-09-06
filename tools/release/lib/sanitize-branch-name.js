/**
 * Sanitizes a branch name to be used in a path, a filename or an artifact name.
 *
 * @param {string} branch
 *
 * @return {string} Sanitized branch name.
 */
function sanitizeBranchName( branch ) {
	return branch.replace( /[^a-zA-Z0-9-]/g, '-' );
}

module.exports = { sanitizeBranchName };
