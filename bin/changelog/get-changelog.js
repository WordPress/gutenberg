'use strict';

/*
 * External dependencies
 */
const { groupBy } = require( 'lodash' );
const Octokit = require( '@octokit/rest' );

/*
 * Internal dependencies
 */
const { getEntry, getIssueType } = require( './get-entry' );
const { fetchAllPullRequests } = require( './requests' );

/** @typedef {import('./cli').WPChangelogSettings} WPChangelogSettings */

/**
 * Returns a promise resolving to the changelog string for given settings.
 *
 * @param {WPChangelogSettings} settings Changelog settings.
 *
 * @return {Promise<string>} Promise resolving to changelog.
 */
async function getChangelog( settings ) {
	const octokit = new Octokit( {
		auth: settings.token,
	} );

	const pullRequests = await fetchAllPullRequests( octokit, settings );
	if ( ! pullRequests || ! pullRequests.length ) {
		throw new Error(
			"This milestone doesn't have an associated pull request."
		);
	}

	let changelog = '';

	const groupedPullRequests = groupBy( pullRequests, getIssueType );
	for ( const group of Object.keys( groupedPullRequests ) ) {
		changelog += '### ' + group + '\n\n';

		const groupPullRequests = groupedPullRequests[ group ];
		for ( const pullRequest of groupPullRequests ) {
			changelog += getEntry( pullRequest ) + '\n';
		}

		changelog += '\n';
	}

	return changelog;
}

module.exports = getChangelog;
