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
 * Assigns the correct milestone to PRs once merged.
 *
 * @param {Object} payload Pull request event payload, see https://developer.github.com/v3/activity/events/types/#pullrequestevent.
 * @param {Object} octokit Initialized Octokit REST client, see https://octokit.github.io/rest.js/.
 */
async function addMilestone( payload, octokit ) {
	if ( ! payload.pull_request.merged ) {
		debug( 'add-milestone: Pull request is not merged. Aborting' );
		return;
	}

	if ( payload.pull_request.base.ref !== 'master' ) {
		debug( 'add-milestone: Pull request is not based on `master`. Aborting' );
		return;
	}

	debug( 'add-milestone: Fetching current milestone' );

	const { data: { milestone } } = await octokit.issues.get( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
		issue_number: payload.pull_request.number,
	} );

	if ( milestone ) {
		debug( 'add-milestone: Pull request already has a milestone. Aborting' );
		return;
	}

	debug( 'add-milestone: Fetching `package.json` contents' );

	const { data: { content, encoding } } = await octokit.repos.getContents( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
		path: 'package.json',
	} );

	const { version } = JSON.parse( Buffer.from( content, encoding ).toString() );

	let [ major, minor ] = version.split( '.' ).map( Number );

	debug( `add-milestone: Current plugin version is ${ major }.${ minor }` );

	if ( minor === 9 ) {
		major += 1;
		minor = 0;
	} else {
		minor += 1;
	}

	const numVersionsElapsed = ( ( major - REFERENCE_MAJOR ) * 10 ) + ( minor - REFERENCE_MINOR );
	const numDaysElapsed = numVersionsElapsed * DAYS_PER_RELEASE;

	// Using UTC for the calculation ensures it's not affected by daylight savings.
	const dueDate = new Date( REFERENCE_DATE );
	dueDate.setUTCDate( dueDate.getUTCDate() + numDaysElapsed );

	debug( `add-milestone: Creating 'Gutenberg ${ major }.${ minor }' milestone, due on ${ dueDate.toISOString() }` );

	await octokit.issues.createMilestone( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
		title: `Gutenberg ${ major }.${ minor }`,
		due_on: dueDate.toISOString(),
	} );

	debug( 'add-milestone: Fetching all milestones' );

	const { data: milestones } = await octokit.issues.listMilestonesForRepo( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
	} );

	const [ { number } ] = milestones.filter(
		( { title } ) => title === `Gutenberg ${ major }.${ minor }`
	);

	debug( `add-milestone: Adding issue #${ payload.pull_request.number } to milestone #${ number }` );

	await octokit.issues.update( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
		issue_number: payload.pull_request.number,
		milestone: number,
	} );
}

module.exports = addMilestone;
