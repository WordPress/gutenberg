'use strict';

/** @typedef {import('@octokit/rest').IssuesListForRepoResponseItem} IssuesListForRepoResponseItem */

/**
 * Returns a type label for a given issue object, or a default if type cannot
 * be determined.
 *
 * @param {IssuesListForRepoResponseItem} issue Issue object.
 *
 * @return {string} Type label.
 */
function getIssueType( issue ) {
	const typeLabel = issue.labels.find( ( label ) =>
		label.name.startsWith( '[Type] ' )
	);

	return typeLabel ? typeLabel.name.replace( /^\[Type\] /, '' ) : 'Various';
}

/**
 * Returns a formatted changelog entry for a given issue object.
 *
 * @param {IssuesListForRepoResponseItem} issue Issue object.
 *
 * @return {string} Formatted changelog entry.
 */
function getEntry( issue ) {
	let title;
	if ( /### Changelog\r\n\r\n> /.test( issue.body ) ) {
		const bodyParts = issue.body.split( '### Changelog\r\n\r\n> ' );
		const note = bodyParts[ bodyParts.length - 1 ];
		title = note
			// Remove comment prompt
			.replace( /<!---(.*)--->/gm, '' )
			// Remove new lines and whitespace
			.trim();
		if ( ! title.length ) {
			title = `${ issue.title }`;
		} else {
			title = `${ title }`;
		}
	} else {
		title = `${ issue.title }`;
	}
	return `- ${ title } ([${ issue.number }](${ issue.url }))`;
}

module.exports = {
	getIssueType,
	getEntry,
};
