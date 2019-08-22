// Milestone due dates are calculated from a known due date:
// 6.3, which was due on August 12 2019.
const REFERENCE_MAJOR = 6;
const REFERENCE_MINOR = 3;
const REFERENCE_DATE = '2019-08-12';

// Releases are every 14 days.
const DAYS_PER_RELEASE = 14;

async function addMilestone( context, octokit ) {
	if ( ! context.payload.pull_request.merged ) {
		return;
	}

	if ( context.payload.pull_request.base.ref !== 'master' ) {
		return;
	}

	const { milestone } = await octokit.issues.get( {
		owner: context.payload.repository.owner.login,
		repo: context.payload.repository.name,
		issue_number: context.payload.pull_request.number,
	} );

	if ( milestone ) {
		return;
	}

	const { content } = await octokit.repos.getContents( {
		owner: context.payload.repository.owner.login,
		repo: context.payload.repository.name,
		path: 'package.json',
	} );

	const { version } = JSON.parse( content );

	let [ major, minor ] = version.split( '.' ).map( Number );

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

	await octokit.issues.createMilestone( {
		owner: context.payload.repository.owner.login,
		repo: context.payload.repository.name,
		title: `Gutenberg ${ major }.${ minor }`,
		due_on: dueDate.toISOString(),
	} );

	const milestones = await octokit.issues.listMilestonesForRepo( {
		owner: context.payload.repository.owner.login,
		repo: context.payload.repository.name,
	} );

	const [ { number } ] = milestones.filter(
		( { title } ) => title === `Gutenberg ${ major }.${ minor }`
	);

	await octokit.issues.update( {
		owner: context.payload.repository.owner.login,
		repo: context.payload.repository.name,
		issue_number: context.payload.pull_request.number,
		milestone: number,
	} );
}

module.exports = addMilestone;
