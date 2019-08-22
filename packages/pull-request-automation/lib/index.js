/**
 * GitHub dependencies
 */
const { setFailed, getInput, debug } = require( '@actions/core' );
const { context, GitHub } = require( '@actions/github' );

/**
 * Internal dependencies
 */
const assignFixedIssues = require( './assign-fixed-issues' );
const addFirstTimeContributorLabel = require( './add-first-time-contributor-label' );
const addMilestone = require( './add-milestone' );

( async function main() {
	if ( context.eventName !== 'pull_request' ) {
		setFailed( 'main: Only `pull_request` events are supported' );
		return;
	}

	const octokit = new GitHub( getInput( 'github_token' ) );

	if ( context.action === 'opened' ) {
		try {
			debug( 'assign-fixed-issues' );
			await assignFixedIssues( context, octokit );
		} catch ( error ) {
			setFailed( `assign-fixed-issues: ${ error }` );
			return;
		}

		try {
			debug( 'add-first-time-contributor-label' );
			await addFirstTimeContributorLabel( context, octokit );
		} catch ( error ) {
			setFailed( `add-first-time-contributor-label: ${ error }` );
			return;
		}
	}

	if ( context.action === 'closed' ) {
		try {
			debug( 'add-milestone' );
			await addMilestone( context, octokit );
		} catch ( error ) {
			setFailed( `add-milestone: ${ error }` );
		}
	}
}() );
