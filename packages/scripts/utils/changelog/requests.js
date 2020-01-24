'use strict';

const { REPO } = require( '../../config/changelog.config' );
const { authedGraphql } = require( './get-entry' );

/* eslint no-console: 0 */

const getMilestoneNumber = async ( version ) => {
	const [ owner, repo ] = REPO.split( '/' );
	const query = `
	{
		repository(owner: "${ owner }", name: "${ repo }") {
			milestones(last: 50) {
				nodes {
					title
					number
				}
			}
		}
	}
	`;
	const data = await authedGraphql( query );
	const matchingNode = data.repository.milestones.nodes.find(
		( node ) => node.title === version
	);
	if ( ! matchingNode ) {
		throw new Error(
			`Unable to find a milestone matching the given version ${ version }`
		);
	}
	return matchingNode.number;
};

const getQuery = ( milestoneNumber, before ) => {
	const [ owner, repo ] = REPO.split( '/' );
	const paging = before ? `, before: "${ before }"` : '';
	return `
	{
		repository(owner: "${ owner }", name: "${ repo }") {
			milestone(number: ${ milestoneNumber }) {
				pullRequests(last: 100, states: [MERGED]${ paging }) {
					totalCount
					pageInfo {
						hasPreviousPage
						startCursor
					}
					nodes {
						number
						title
						url
						author {
							login
						}
						body
						labels(last: 10) {
							nodes {
								name
							}
						}
					}
				}
			}
		}
	}
	`;
};

const fetchAllPullRequests = async ( version ) =>
	await ( async () => {
		const milestoneNumber = await getMilestoneNumber( version );
		const fetchResults = async ( before ) => {
			const query = getQuery( milestoneNumber, before );
			const results = await authedGraphql( query );
			if (
				results.repository.milestone.pullRequests.pageInfo
					.hasPreviousPage === false
			) {
				return results.repository.milestone.pullRequests.nodes;
			}

			const nextResults = await fetchResults(
				results.repository.milestone.pullRequests.pageInfo.startCursor
			);
			return results.repository.milestone.pullRequests.nodes.concat(
				nextResults
			);
		};
		return await fetchResults();
	} )();

module.exports = {
	fetchAllPullRequests,
};
