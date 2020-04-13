'use strict';

const { groupBy } = require( 'lodash' );
const chalk = require( 'chalk' );
const { getEntry, getPullRequestType } = require( './get-entry' );
const { fetchAllPullRequests } = require( './requests' );

/* eslint no-console: 0*/

const make = async ( token, version ) => {
	const pullRequests = await fetchAllPullRequests( token, version );
	if ( ! pullRequests || ! pullRequests.length ) {
		console.log(
			chalk.yellow( "This version doesn't have any associated PR." )
		);
		return;
	}

	const groupedPullRequests = groupBy( pullRequests, getPullRequestType );
	for ( const group of Object.keys( groupedPullRequests ) ) {
		console.log( '### ' + group + '\n' );
		const groupPullRequests = groupedPullRequests[ group ];
		for ( const PR of groupPullRequests ) {
			console.log( await getEntry( PR ) );
		}
		console.log( '' );
	}
};

module.exports = { make };
