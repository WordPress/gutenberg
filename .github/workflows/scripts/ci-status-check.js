/**
 * Fails if any job in the current workflow run concluded as anything other than
 * `success` or `skipped`, so one always-running job can be a workflow's only
 * required status check while the rest of it is path-filtered.
 *
 * `skipped` passes: a job skipped because an upstream `needs` failed is joined
 * in the same run by that upstream job's own `failure`, which this script sees.
 *
 * Usage:
 *
 *     node ci-status-check.js --ignore '<job name>[,<job name>]...'
 *
 * `--ignore` exempts a job, and must name the job running this script plus any
 * job still running alongside it; repeat the flag for a name containing a
 * comma. Anything else left unfinished fails the status check rather than
 * pass unevaluated.
 */

const { parseArgs } = require( 'node:util' );

const PASSING_CONCLUSIONS = [ 'success', 'skipped' ];

// A job that just finished can still read as running, so let the API settle.
const ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 3000;

/**
 * The delay before an attempt, doubling each time: 3s, 6s, 12s, 24s.
 *
 * @param {number} attempt The attempt that just failed, counting from 1.
 * @return {number} Delay in milliseconds.
 */
function retryDelay( attempt ) {
	return RETRY_BASE_DELAY_MS * 2 ** ( attempt - 1 );
}

const { GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_TOKEN } = process.env;

let ignoredJobs = [];

/**
 * Reads the exempt job names off the command line.
 *
 * @return {string[]} The job names.
 */
function parseIgnoredJobs() {
	const { values } = parseArgs( {
		options: {
			ignore: { type: 'string', multiple: true, default: [] },
		},
	} );

	return values.ignore
		.flatMap( ( value ) => value.split( ',' ) )
		.map( ( name ) => name.trim() )
		.filter( Boolean );
}

/**
 * Resolves after the given delay.
 *
 * @param {number} ms Delay in milliseconds.
 * @return {Promise<void>} Resolves once the delay has elapsed.
 */
function sleep( ms ) {
	return new Promise( ( resolve ) => {
		setTimeout( resolve, ms );
	} );
}

/**
 * Fetches every job of the current run, following pagination.
 *
 * @return {Promise<Array<{name: string, status: string, conclusion: string, html_url: string}>>} The jobs.
 */
async function fetchJobs() {
	const jobs = [];

	for ( let page = 1; ; page++ ) {
		const url = `https://api.github.com/repos/${ GITHUB_REPOSITORY }/actions/runs/${ GITHUB_RUN_ID }/jobs?per_page=100&page=${ page }`;
		const response = await fetch( url, {
			headers: {
				accept: 'application/vnd.github+json',
				authorization: `Bearer ${ GITHUB_TOKEN }`,
				'x-github-api-version': '2022-11-28',
			},
		} );

		if ( ! response.ok ) {
			const error = new Error(
				`Could not list the jobs of run ${ GITHUB_RUN_ID }: ${ response.status } ${ response.statusText }.`
			);
			error.retryable = response.status >= 500 || response.status === 429;
			throw error;
		}

		const body = await response.json();
		jobs.push( ...body.jobs );

		if ( jobs.length >= body.total_count ) {
			return jobs;
		}

		// A short list would mean evaluating a run on only some of its jobs.
		if ( body.jobs.length === 0 ) {
			throw new Error(
				`Run ${ GITHUB_RUN_ID } listed ${ jobs.length } of its ${ body.total_count } jobs before running out of pages.`
			);
		}
	}
}

/**
 * Fetches the jobs this run is evaluated on, once none of them is still
 * running.
 *
 * @return {Promise<Array<{name: string, status: string, conclusion: string, html_url: string}>>} The jobs.
 */
async function fetchEvaluatedJobs() {
	for ( let attempt = 1; ; attempt++ ) {
		const lastAttempt = attempt === ATTEMPTS;
		let jobs;

		try {
			jobs = ( await fetchJobs() ).filter(
				( job ) => ! ignoredJobs.includes( job.name )
			);
		} catch ( error ) {
			if ( lastAttempt || error.retryable === false ) {
				throw error;
			}
			console.log( `${ error.message } Retrying.` );
			await sleep( retryDelay( attempt ) );
			continue;
		}

		const running = jobs.filter( ( job ) => job.status !== 'completed' );

		if ( jobs.length > 0 && running.length === 0 ) {
			return jobs;
		}

		if ( lastAttempt ) {
			// This job is in its own run, so an empty list is not that run.
			if ( jobs.length === 0 ) {
				throw new Error(
					`Run ${ GITHUB_RUN_ID } reported no jobs beyond the ignored ones.`
				);
			}

			for ( const job of running ) {
				console.log(
					`::error::${ job.name } is still ${ job.status }, so it was never evaluated. Add it to this job's \`needs\`, or pass it as \`--ignore\`.`
				);
			}
			throw new Error( `${ running.length } job(s) had not finished.` );
		}

		await sleep( retryDelay( attempt ) );
	}
}

async function main() {
	if ( ! GITHUB_REPOSITORY || ! GITHUB_RUN_ID || ! GITHUB_TOKEN ) {
		throw new Error(
			'GITHUB_REPOSITORY, GITHUB_RUN_ID and GITHUB_TOKEN must all be set.'
		);
	}

	ignoredJobs = parseIgnoredJobs();

	if ( ignoredJobs.length === 0 ) {
		throw new Error(
			'Pass at least `--ignore` with the name of the job running this script.'
		);
	}

	const jobs = await fetchEvaluatedJobs();
	const failed = jobs.filter(
		( job ) => ! PASSING_CONCLUSIONS.includes( job.conclusion )
	);

	if ( failed.length > 0 ) {
		for ( const job of failed ) {
			console.log(
				`::error::${ job.name } concluded as ${ job.conclusion }: ${ job.html_url }`
			);
		}
		throw new Error( `${ failed.length } job(s) did not pass.` );
	}

	console.log(
		`All ${ jobs.length } evaluated job(s) in run ${ GITHUB_RUN_ID } passed.`
	);
}

main().catch( ( error ) => {
	console.log( `::error::${ error.message }` );
	process.exitCode = 1;
} );
