/**
 * Fails if any job in the current workflow run concluded as anything other than
 * `success` or `skipped`, so one always-running job can be a workflow's only
 * required status check while the rest of it is path-filtered.
 *
 * `skipped` passes: a job skipped because an upstream `needs` failed is joined
 * in the same run by that upstream job's own `failure`, which this script sees.
 *
 * The run's job list can report a job as `in_progress` for many minutes after
 * it completed, so every job it lists as unfinished is read again from that
 * job's own endpoint, which reports the completion and its conclusion sooner.
 *
 * Usage:
 *
 *     node tools/monorepo/scripts/ci-status-check.mts --ignore '<job name>[,<job name>]...'
 *
 * `--ignore` exempts a job, and must name the job running this script plus any
 * job still running alongside it; repeat the flag for a name containing a
 * comma. Anything else left unfinished fails the status check rather than
 * pass unevaluated.
 */

import { parseArgs } from 'node:util';

type Job = {
	id: number;
	name: string;
	status: string;
	conclusion: string | null;
	html_url: string;
};

type JobsResponse = {
	jobs: Job[];
	total_count: number;
};

const PASSING_CONCLUSIONS = [ 'success', 'skipped' ];
const COMPLETED = 'completed';

// A job that just finished can still read as running even on its own
// endpoint, so let the API settle.
const ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 3000;

/**
 * The delay before an attempt, doubling each time: 3s, 6s, 12s, 24s.
 *
 * @param attempt The attempt that just failed, counting from 1.
 * @return Delay in milliseconds.
 */
function retryDelay( attempt: number ): number {
	return RETRY_BASE_DELAY_MS * 2 ** ( attempt - 1 );
}

const { GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_TOKEN } = process.env;
const ACTIONS_API_URL = `https://api.github.com/repos/${ GITHUB_REPOSITORY }/actions`;

let ignoredJobs: string[] = [];

/**
 * Reads the exempt job names off the command line.
 *
 * @param args The command-line arguments, without `node` and the script path.
 * @return The job names.
 */
function parseIgnoredJobs( args: string[] ): string[] {
	const { values } = parseArgs( {
		args,
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
 * @param ms Delay in milliseconds.
 * @return Resolves once the delay has elapsed.
 */
function sleep( ms: number ): Promise< void > {
	return new Promise( ( resolve ) => {
		setTimeout( resolve, ms );
	} );
}

/**
 * Fetches a GitHub REST API URL as JSON.
 *
 * @param url         The URL.
 * @param description What the request does, e.g. `read job 123`.
 * @return The response body.
 */
async function fetchApi< T >( url: string, description: string ): Promise< T > {
	const response = await fetch( url, {
		headers: {
			accept: 'application/vnd.github+json',
			authorization: `Bearer ${ GITHUB_TOKEN }`,
			'x-github-api-version': '2022-11-28',
		},
	} );

	if ( ! response.ok ) {
		const error = Object.assign(
			new Error(
				`Could not ${ description }: ${ response.status } ${ response.statusText }.`
			),
			{ retryable: response.status >= 500 || response.status === 429 }
		);
		throw error;
	}

	return response.json();
}

/**
 * Fetches every job of the current run, following pagination.
 *
 * @return The jobs.
 */
async function fetchJobs(): Promise< Job[] > {
	const jobs: Job[] = [];

	for ( let page = 1; ; page++ ) {
		const body = await fetchApi< JobsResponse >(
			`${ ACTIONS_API_URL }/runs/${ GITHUB_RUN_ID }/jobs?per_page=100&page=${ page }`,
			`list the jobs of run ${ GITHUB_RUN_ID }`
		);
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
 * Reads again, from each job's own endpoint, every job the run's job list
 * reports as unfinished, since that list lags behind.
 *
 * @param jobs The listed jobs.
 * @return The jobs, the unfinished ones re-read.
 */
function refreshJobs( jobs: Job[] ): Promise< Job[] > {
	return Promise.all(
		jobs.map( ( job ) => {
			if ( job.status === COMPLETED ) {
				return job;
			}

			return fetchApi< Job >(
				`${ ACTIONS_API_URL }/jobs/${ job.id }`,
				`read job ${ job.id }`
			);
		} )
	);
}

/**
 * Fetches the jobs this run is evaluated on, once none of them is still
 * running.
 *
 * @return The jobs.
 */
async function fetchEvaluatedJobs(): Promise< Job[] > {
	for ( let attempt = 1; ; attempt++ ) {
		const lastAttempt = attempt === ATTEMPTS;
		let jobs: Job[];

		try {
			const listed = ( await fetchJobs() ).filter(
				( job ) => ! ignoredJobs.includes( job.name )
			);
			jobs = await refreshJobs( listed );
		} catch ( error ) {
			const apiError = error as Error & { retryable?: boolean };
			if ( lastAttempt || apiError.retryable === false ) {
				throw error;
			}
			console.log( `${ apiError.message } Retrying.` );
			await sleep( retryDelay( attempt ) );
			continue;
		}

		const running = jobs.filter( ( job ) => job.status !== COMPLETED );

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
					`::error::${ job.name } still reads as ${ job.status } after re-checking it, so it was never evaluated. Either it is missing from this job's \`needs\` (add it there, or pass it as \`--ignore\`), or the GitHub API is still lagging, and re-running this status check will clear it: ${ job.html_url }`
				);
			}
			throw new Error( `${ running.length } job(s) had not finished.` );
		}

		await sleep( retryDelay( attempt ) );
	}
}

/**
 * Evaluates every job of the current run, throwing if any did not pass.
 *
 * @param args The command-line arguments, without `node` and the script path.
 */
export async function main( args: string[] ): Promise< void > {
	if ( ! GITHUB_REPOSITORY || ! GITHUB_RUN_ID || ! GITHUB_TOKEN ) {
		throw new Error(
			'GITHUB_REPOSITORY, GITHUB_RUN_ID and GITHUB_TOKEN must all be set.'
		);
	}

	ignoredJobs = parseIgnoredJobs( args );

	if ( ignoredJobs.length === 0 ) {
		throw new Error(
			'Pass at least `--ignore` with the name of the job running this script.'
		);
	}

	const jobs = await fetchEvaluatedJobs();
	const failed = jobs.filter(
		( job ) => ! PASSING_CONCLUSIONS.includes( job.conclusion ?? '' )
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

if ( import.meta.main ) {
	main( process.argv.slice( 2 ) ).catch( ( error ) => {
		console.log( `::error::${ error.message }` );
		process.exitCode = 1;
	} );
}
