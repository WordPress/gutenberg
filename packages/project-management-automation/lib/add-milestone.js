/**
 * Internal dependencies
 */
const debug = require( './debug' );

// Milestone due dates are calculated from a known due date:
// 6.3, which was due on August 12 2019.
const REFERENCE_MAJOR = 6;
const REFERENCE_MINOR = 3;
const REFERENCE_DATE = '2019-08-12';

// Releases are every 14 days.
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
 * @param {Error} error Error to test.
 *
 * @return {boolean} Whether error is a duplicate validation request error.
 */
const isDuplicateValidationError = ( error ) =>
	Array.isArray( error.errors ) &&
	error.errors.some( ( { code } ) => code === 'already_exists' );

/**
 * Assigns the correct milestone to PRs once merged.
 *
 * @param {Object} payload Push event payload, see https://developer.github.com/v3/activity/events/types/#pushevent.
 * @param {Object} octokit Initialized Octokit REST client, see https://octokit.github.io/rest.js/.
 */
async function addMilestone( payload, octokit ) {
	if ( payload.ref !== 'refs/heads/master' ) {
		debug( 'add-milestone: Commit is not to `master`. Aborting' );
		return;
	}

	const match = payload.commits[ 0 ].message.match( /\(#(\d+)\)$/m );
	const prNumber = match && match[ 1 ];
	if ( ! prNumber ) {
		debug( 'add-milestone: Commit is not a squashed PR. Aborting' );
		return;
	}

	debug( 'add-milestone: Fetching current milestone' );

	const {
		data: { milestone },
	} = await octokit.issues.get( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
		issue_number: prNumber,
	} );

	if ( milestone ) {
		debug(
			'add-milestone: Pull request already has a milestone. Aborting'
		);
		return;
	}

	debug( 'add-milestone: Fetching `package.json` contents' );

	const {
		data: { content, encoding },
	} = await octokit.repos.getContents( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
		path: 'package.json',
	} );

	const { version } = JSON.parse(
		Buffer.from( content, encoding ).toString()
	);

	let [ major, minor ] = version.split( '.' ).map( Number );

	debug( `add-milestone: Current plugin version is ${ major }.${ minor }` );

	if ( minor === 9 ) {
		major += 1;
		minor = 0;
	} else {
		minor += 1;
	}

	const numVersionsElapsed =
		( major - REFERENCE_MAJOR ) * 10 + ( minor - REFERENCE_MINOR );
	const numDaysElapsed = numVersionsElapsed * DAYS_PER_RELEASE;

	// Using UTC for the calculation ensures it's not affected by daylight savings.
	const dueDate = new Date( REFERENCE_DATE );
	dueDate.setUTCDate( dueDate.getUTCDate() + numDaysElapsed );

	debug(
		`add-milestone: Creating 'Gutenberg ${ major }.${ minor }' milestone, due on ${ dueDate.toISOString() }`
	);

	try {
		await octokit.issues.createMilestone( {
			owner: payload.repository.owner.login,
			repo: payload.repository.name,
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

	const { data: milestones } = await octokit.issues.listMilestonesForRepo( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
	} );

	const [ { number } ] = milestones.filter(
		( { title } ) => title === `Gutenberg ${ major }.${ minor }`
	);

	debug(
		`add-milestone: Adding issue #${ prNumber } to milestone #${ number }`
	);

	await octokit.issues.update( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
		issue_number: prNumber,
		milestone: number,
	} );
}

module.exports = addMilestone;
