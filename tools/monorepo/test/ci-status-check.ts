import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';

const REPOSITORY = 'WordPress/gutenberg';
const RUN_ID = '1';
const TOKEN = 'token';
const STATUS_JOB = 'Status check';
const ARGS = [ '--ignore', STATUS_JOB ];

const HTTP_SERVER_ERROR = 500;

const UNIT_JOB_ID = 2;
const UNIT_JOB_NAME = 'Unit tests';
const RUN_JOBS_PATH = `/repos/${ REPOSITORY }/actions/runs/${ RUN_ID }/jobs`;
const UNIT_JOB_PATH = `/repos/${ REPOSITORY }/actions/jobs/${ UNIT_JOB_ID }`;

type Job = {
	id: number;
	name: string;
	status: string;
	conclusion: string | null;
	html_url: string;
};

const STATUS_JOB_RUNNING: Job = {
	id: 1,
	name: STATUS_JOB,
	status: 'in_progress',
	conclusion: null,
	html_url: 'https://github.com/job/1',
};

let main: ( args: string[] ) => Promise< void >;

/**
 * Builds the unit test job as an endpoint reports it.
 *
 * @param status     The job status.
 * @param conclusion The job conclusion.
 * @return The job.
 */
function unitJob( status: string, conclusion: string | null = null ): Job {
	return {
		id: UNIT_JOB_ID,
		name: UNIT_JOB_NAME,
		status,
		conclusion,
		html_url: `https://github.com/job/${ UNIT_JOB_ID }`,
	};
}

/**
 * Stubs `fetch` with a run jobs listing and a single-job endpoint.
 *
 * Each read of the single-job endpoint answers with the next of `reads`, then
 * keeps repeating the last one; a number answers with that HTTP error status,
 * and no reads at all answer 404.
 *
 * @param listed The unit test job as the run listing reports it.
 * @param reads  The unit test job as its own endpoint reports it, read by read.
 * @return The `fetch` mock.
 */
function stubApi( listed: Job, ...reads: Array< Job | number > ) {
	const fetchMock = vi.fn( async ( url: string ) => {
		const { pathname } = new URL( url );

		if ( pathname === RUN_JOBS_PATH ) {
			const jobs = [ STATUS_JOB_RUNNING, listed ];
			return Response.json( { total_count: jobs.length, jobs } );
		}

		if ( pathname !== UNIT_JOB_PATH || reads.length === 0 ) {
			return new Response( null, {
				status: 404,
				statusText: 'Not Found',
			} );
		}

		const read = reads.length > 1 ? reads.shift() : reads[ 0 ];

		if ( typeof read === 'number' ) {
			return new Response( null, { status: read } );
		}

		return Response.json( read );
	} );

	vi.stubGlobal( 'fetch', fetchMock );

	return fetchMock;
}

/**
 * Counts the reads of the unit test job's own endpoint.
 *
 * @param fetchMock The `fetch` mock.
 * @return The number of reads.
 */
function jobReads( fetchMock: ReturnType< typeof stubApi > ) {
	return fetchMock.mock.calls.filter( ( [ url ] ) =>
		url.includes( UNIT_JOB_PATH )
	).length;
}

/**
 * Runs the status check to completion, skipping its retry delays.
 *
 * @return The thrown error, if any, and the logged output.
 */
async function runCheck() {
	const settled = main( ARGS ).then(
		() => undefined,
		( error: Error ) => error
	);

	await vi.runAllTimersAsync();
	const error = await settled;
	const output = vi.mocked( console.log ).mock.calls.flat().join( '\n' );

	// The script reports through `console.log`, so every line is expected.
	if ( output ) {
		expect( console ).toHaveLogged();
	}

	return { error, output };
}

describe( 'ci-status-check', () => {
	beforeAll( async () => {
		vi.stubEnv( 'GITHUB_REPOSITORY', REPOSITORY );
		vi.stubEnv( 'GITHUB_RUN_ID', RUN_ID );
		vi.stubEnv( 'GITHUB_TOKEN', TOKEN );
		( { main } =
			await import( '../../../.github/workflows/scripts/ci-status-check.js' ) );
	} );

	beforeEach( () => {
		vi.useFakeTimers();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'passes when every listed job completed successfully', async () => {
		const fetchMock = stubApi( unitJob( 'completed', 'success' ) );

		const { error } = await runCheck();

		expect( error ).toBeUndefined();
		expect( jobReads( fetchMock ) ).toBe( 0 );
	} );

	it( 'passes when a job listed as running has succeeded', async () => {
		const fetchMock = stubApi(
			unitJob( 'in_progress' ),
			unitJob( 'completed', 'success' )
		);

		const { error } = await runCheck();

		expect( error ).toBeUndefined();
		expect( fetchMock ).toHaveBeenCalledWith(
			expect.stringContaining( UNIT_JOB_PATH ),
			expect.objectContaining( {
				headers: expect.objectContaining( {
					authorization: `Bearer ${ TOKEN }`,
				} ),
			} )
		);
	} );

	it( 'fails when a job listed as running has failed', async () => {
		stubApi( unitJob( 'in_progress' ), unitJob( 'completed', 'failure' ) );

		const { error, output } = await runCheck();

		expect( error?.message ).toBe( '1 job(s) did not pass.' );
		expect( output ).toContain(
			`::error::${ UNIT_JOB_NAME } concluded as failure`
		);
	} );

	it( 'keeps re-reading a running job until it completes', async () => {
		const fetchMock = stubApi(
			unitJob( 'in_progress' ),
			unitJob( 'in_progress' ),
			unitJob( 'completed', 'success' )
		);

		const { error } = await runCheck();

		expect( error ).toBeUndefined();
		expect( jobReads( fetchMock ) ).toBe( 2 );
	} );

	it( 'retries a re-read the API failed to serve', async () => {
		const fetchMock = stubApi(
			unitJob( 'in_progress' ),
			HTTP_SERVER_ERROR,
			unitJob( 'completed', 'success' )
		);

		const { error } = await runCheck();

		expect( error ).toBeUndefined();
		expect( jobReads( fetchMock ) ).toBe( 2 );
	} );

	it( 'fails at once when a job listed as running cannot be re-read', async () => {
		const fetchMock = stubApi( unitJob( 'in_progress' ) );

		const { error } = await runCheck();

		expect( error?.message ).toBe(
			`Could not read job ${ UNIT_JOB_ID }: 404 Not Found.`
		);
		expect( jobReads( fetchMock ) ).toBe( 1 );
	} );

	it( 'fails when a job still reads as running after re-checking', async () => {
		stubApi( unitJob( 'in_progress' ), unitJob( 'in_progress' ) );

		const { error, output } = await runCheck();

		expect( error?.message ).toBe( '1 job(s) had not finished.' );
		expect( output ).toContain(
			`::error::${ UNIT_JOB_NAME } still reads as in_progress after re-checking it, so it was never evaluated. Either it is missing from this job's \`needs\` (add it there, or pass it as \`--ignore\`), or the GitHub API is still lagging, and re-running this status check will clear it: https://github.com/job/${ UNIT_JOB_ID }`
		);
	} );
} );
