import debug from '../../debug.ts';
import getAssociatedPullRequest from '../../get-associated-pull-request.ts';
import type { GitHub, Milestone, WebhookPayloadPush } from '../../types.ts';

/**
 * Number of expected days elapsed between releases.
 */
const DAYS_PER_RELEASE = 14;

/**
 * Returns true if the given error object represents a duplicate entry error, or
 * false otherwise.
 *
 * @param requestError Error to test.
 *
 * @return Whether error is a duplicate validation request error.
 */
const isDuplicateValidationError = ( requestError: unknown ): boolean => {
	// The included version of RequestError provides no way to access the
	// full 'errors' array that the github REST API returns. Hopefully they
	// resolve this soon!
	const errorMessage =
		requestError &&
		typeof requestError === 'object' &&
		'message' in requestError &&
		requestError.message;
	return (
		typeof errorMessage === 'string' &&
		errorMessage.includes( 'already_exists' )
	);
};

/**
 * Returns a promise resolving to a milestone by a given title, if exists.
 *
 * @param octokit Initialized Octokit REST client.
 * @param owner   Repository owner.
 * @param repo    Repository name.
 * @param title   Milestone title.
 *
 * @return Promise resolving to milestone, if exists.
 */
async function getMilestoneByTitle(
	octokit: GitHub,
	owner: string,
	repo: string,
	title: string
): Promise< Milestone | void > {
	const responses = octokit.paginate.iterator(
		octokit.rest.issues.listMilestones,
		{
			owner,
			repo,
			state: 'all',
			sort: 'due_on',
			direction: 'desc',
		}
	);

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
 * @param payload Push event payload.
 * @param octokit Initialized Octokit REST client.
 */
async function addMilestone(
	payload: WebhookPayloadPush,
	octokit: GitHub
): Promise< void > {
	if ( payload.ref !== 'refs/heads/trunk' ) {
		debug( 'add-milestone: Commit is not to `trunk`. Aborting' );
		return;
	}

	const prNumber = getAssociatedPullRequest( payload.commits[ 0 ] );
	if ( ! prNumber ) {
		debug( 'add-milestone: Commit is not a squashed PR. Aborting' );
		return;
	}

	const owner = payload.repository.owner?.login;
	if ( ! owner ) {
		debug(
			'add-milestone: Push payload is missing a repository owner. Aborting'
		);
		return;
	}
	const repo = payload.repository.name;
	debug( 'add-milestone: Fetching current milestone' );

	const {
		data: { milestone: pullMilestone },
	} = await octokit.rest.issues.get( {
		owner,
		repo,
		issue_number: prNumber,
	} );

	if ( pullMilestone ) {
		debug(
			'add-milestone: Pull request already has a milestone. Aborting'
		);
		return;
	}

	debug( 'add-milestone: Fetching `package.json` contents' );

	const {
		// The types for the `getContent` response are incorrect.
		// see https://github.com/octokit/rest.js/issues/32
		// @ts-expect-error The `getContent` response is a union that may be a directory listing.
		data: { content, encoding },
	} = await octokit.rest.repos.getContent( {
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
	// If the last milestone has no due date, the next one is due a release
	// cycle from today.
	const dueDate = new Date( lastMilestone.due_on || new Date() );
	dueDate.setUTCDate( dueDate.getUTCDate() + DAYS_PER_RELEASE );

	debug(
		`add-milestone: Creating 'Gutenberg ${ major }.${ minor }' milestone, due on ${ dueDate.toISOString() }`
	);

	try {
		await octokit.rest.issues.createMilestone( {
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

	const milestone = await getMilestoneByTitle( octokit, owner, repo, title );

	if ( ! milestone ) {
		throw new Error( 'Could not rediscover milestone by title: ' + title );
	}

	debug(
		`add-milestone: Adding issue #${ prNumber } to milestone #${ milestone.number }`
	);

	await octokit.rest.issues.update( {
		owner,
		repo,
		issue_number: prNumber,
		milestone: milestone.number,
	} );
}

export default addMilestone;
