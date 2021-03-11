/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getAssociatedPullRequest = require( '../../get-associated-pull-request' );

/** @typedef {import('@octokit/rest').HookError} HookError */
/** @typedef {import('@actions/github').GitHub} GitHub */
/** @typedef {import('@octokit/webhooks').WebhookPayloadPush} WebhookPayloadPush */
/** @typedef {import('@octokit/rest').IssuesListMilestonesForRepoResponseItem} OktokitIssuesListMilestonesForRepoResponseItem */

/**
 * Number of expected days elapsed between releases.
 *
 * @type {number}
 */
const DAYS_PER_RELEASE = 14;

/**
 * Returns true if the given error object represents a duplicate entry error, or
 * false otherwise. The error is expected to be (though not verified explicitly
 * as) an instance of Octokit's RequestError (`@octokit/request-error`).
 *
 * @see https://github.com/octokit/rest.js/issues/684
 * @see https://developer.github.com/v3/#client-errors
 * @see https://github.com/octokit/request.js/blob/2a1d768/src/fetch-wrapper.ts#L79-L80
 *
 * @param {HookError} error Error to test.
 *
 * @return {boolean} Whether error is a duplicate validation request error.
 */
const isDuplicateValidationError = ( error ) =>
	Array.isArray( error.errors ) &&
	error.errors.some( ( { code } ) => code === 'already_exists' );

/**
 * Returns a promise resolving to a milestone by a given title, if exists.
 *
 * @param {GitHub} octokit Initialized Octokit REST client.
 * @param {string} owner   Repository owner.
 * @param {string} repo    Repository name.
 * @param {string} title   Milestone title.
 *
 * @return {Promise<OktokitIssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
 */
async function getMilestoneByTitle( octokit, owner, repo, title ) {
	/** @type {Partial<import('@octokit/rest').IssuesListMilestonesForRepoParams>} */
	const params = {
		state: 'all',
		sort: 'due_on',
		direction: 'desc',
	};

	const options = octokit.issues.listMilestonesForRepo.endpoint.merge( {
		owner,
		repo,
		...params,
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListMilestonesForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	for await ( const response of responses ) {
		const milestones = response.data;
		for ( const milestone of milestones ) {
			if ( milestone.title === title ) {
				return milestone;
			}
		}
	}
}

/**
 * Assigns the correct milestone to PRs once merged.
 *
 * @param {WebhookPayloadPush} payload Push event payload.
 * @param {GitHub}             octokit Initialized Octokit REST client.
 */
async function addMilestone( payload, octokit ) {
	if ( payload.ref !== 'refs/heads/trunk' ) {
		debug( 'add-milestone: Commit is not to `trunk`. Aborting' );
		return;
	}

	const prNumber = getAssociatedPullRequest( payload.commits[ 0 ] );
	if ( ! prNumber ) {
		debug( 'add-milestone: Commit is not a squashed PR. Aborting' );
		return;
	}

	debug( 'add-milestone: Fetching current milestone' );
	const owner = payload.repository.owner.login;
	const repo = payload.repository.name;

	const {
		data: { milestone: pullMilestone },
	} = await octokit.issues.get( { owner, repo, issue_number: prNumber } );

	if ( pullMilestone ) {
		debug(
			'add-milestone: Pull request already has a milestone. Aborting'
		);
		return;
	}

	debug( 'add-milestone: Fetching `package.json` contents' );

	const {
		data: { content, encoding },
	} = await octokit.repos.getContents( {
		owner,
		repo,
		path: 'package.json',
	} );

	const { version } = JSON.parse(
		Buffer.from( content, encoding ).toString()
	);

	let [ major, minor ] = version.split( '.' ).map( Number );

	debug( `add-milestone: Current plugin version is ${ major }.${ minor }` );

	const lastTitle = `Gutenberg ${ major }.${ minor }`;
	const lastMilestone = await getMilestoneByTitle(
		octokit,
		owner,
		repo,
		lastTitle
	);

	if ( ! lastMilestone ) {
		throw new Error(
			'Could not find milestone for current version: ' + lastTitle
		);
	}

	if ( minor === 9 ) {
		major += 1;
		minor = 0;
	} else {
		minor += 1;
	}

	// Using UTC for the calculation ensures it's not affected by daylight savings.
	const dueDate = new Date( lastMilestone.due_on );
	dueDate.setUTCDate( dueDate.getUTCDate() + DAYS_PER_RELEASE );

	debug(
		`add-milestone: Creating 'Gutenberg ${ major }.${ minor }' milestone, due on ${ dueDate.toISOString() }`
	);

	try {
		await octokit.issues.createMilestone( {
			owner,
			repo,
			title: `Gutenberg ${ major }.${ minor }`,
			due_on: dueDate.toISOString(),
		} );

		debug( 'add-milestone: Milestone created' );
	} catch ( error ) {
		if ( ! isDuplicateValidationError( error ) ) {
			throw error;
		}

		debug(
			'add-milestone: Milestone already exists, proceeding with assignment'
		);
	}

	debug( 'add-milestone: Fetching all milestones' );

	const title = `Gutenberg ${ major }.${ minor }`;

	const milestone = await getMilestoneByTitle(
		octokit,
		payload.repository.owner.login,
		payload.repository.name,
		title
	);

	if ( ! milestone ) {
		throw new Error( 'Could not rediscover milestone by title: ' + title );
	}

	debug(
		`add-milestone: Adding issue #${ prNumber } to milestone #${ milestone.number }`
	);

	await octokit.issues.update( {
		owner,
		repo,
		issue_number: prNumber,
		milestone: milestone.number,
	} );
}

module.exports = addMilestone;
