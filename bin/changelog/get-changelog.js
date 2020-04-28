'use strict';

/*
 * External dependencies
 */
const { groupBy } = require( 'lodash' );

/*
 * Internal dependencies
 */
const { getEntry, getPullRequestType } = require( './get-entry' );
const { fetchAllPullRequests } = require( './requests' );

async function getChangelog( token, repository, milestone ) {
	const pullRequests = await fetchAllPullRequests(
		token,
		repository,
		milestone
	);
	if ( ! pullRequests || ! pullRequests.length ) {
		throw new Error(
			"This milestone doesn't have an associated pull request."
		);
	}

	let changelog = '';

	const groupedPullRequests = groupBy( pullRequests, getPullRequestType );
	for ( const group of Object.keys( groupedPullRequests ) ) {
		changelog += '### ' + group + '\n\n';

		const groupPullRequests = groupedPullRequests[ group ];
		for ( const pullRequest of groupPullRequests ) {
			changelog += ( await getEntry( pullRequest ) ) + '\n';
		}

		changelog += '\n';
	}

	return changelog;
}

module.exports = getChangelog;
