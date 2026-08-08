import * as core from '@actions/core';
import { run } from '../run';

const mockPushEventContext = {
	runId: 100,
	repo: {
		owner: 'WordPress',
		repo: 'gutenberg',
	},
	ref: 'refs/heads/trunk',
	sha: 'commitSHA',
	eventName: 'push',
};
const mockPullRequestEventContext = {
	runId: 100,
	repo: {
		owner: 'WordPress',
		repo: 'gutenberg',
	},
	ref: 'refs/pull/10/merge',
	sha: 'mergeSHA',
	eventName: 'pull_request',
	payload: {
		number: 10,
		pull_request: {
			head: {
				ref: 'headBranch',
				sha: 'headSHA',
			},
		},
	},
};
const mockGetContext = jest.fn(
	(): typeof mockPushEventContext | typeof mockPullRequestEventContext =>
		mockPullRequestEventContext
);
jest.mock( '@actions/github', () => ( {
	get context() {
		return mockGetContext();
	},
} ) );

jest.mock( '@actions/core', () => ( {
	error: jest.fn(),
	info: jest.fn(),
	getInput: jest.fn(),
} ) );

const mockAPI = {
	createCommentOnPR: jest.fn(),
};
jest.mock( '../github-api', () => ( {
	GitHubAPI: jest.fn( () => mockAPI ),
} ) );

jest.mock( 'fs/promises', () => ( {
	readdir: jest.fn(),
	readFile: jest.fn(),
} ) );

async function mockFlakyTestsArtifact() {
	const playwrightFlakyTest = await import(
		'../__fixtures__/should copy only partial selection of text blocks.json'
	).then( ( json ) => json.default );
	const jestFlakyTest = await import(
		'../__fixtures__/Should insert new template part on creation.json'
	).then( ( json ) => json.default );

	( core.getInput as jest.Mock )
		// token
		.mockReturnValueOnce( 'repo-token' )
		// artifact-path
		.mockReturnValueOnce( 'flaky-tests' );

	// Replacing the cwd for the test for consistent snapshot results.
	playwrightFlakyTest.path = playwrightFlakyTest.path.replace(
		'/home/runner/work/gutenberg/gutenberg',
		process.cwd()
	);

	const mockedFs = require( 'fs/promises' );
	mockedFs.readdir.mockImplementationOnce( () =>
		Promise.resolve( [
			`${ playwrightFlakyTest.title }.json`,
			`${ jestFlakyTest.title }.json`,
		] )
	);
	mockedFs.readFile
		.mockImplementationOnce( () =>
			Promise.resolve( JSON.stringify( playwrightFlakyTest ) )
		)
		.mockImplementationOnce( () =>
			Promise.resolve( JSON.stringify( jestFlakyTest ) )
		);
}

describe( 'Report flaky tests', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should comment on the pull request', async () => {
		await mockFlakyTestsArtifact();

		mockAPI.createCommentOnPR.mockImplementationOnce( () => ( {
			html_url: 'comment_html_url',
		} ) );

		await run();

		expect( mockAPI.createCommentOnPR ).toHaveBeenCalledTimes( 1 );
		expect( mockAPI.createCommentOnPR.mock.calls[ 0 ][ 0 ] ).toBe( 10 );
		expect(
			mockAPI.createCommentOnPR.mock.calls[ 0 ][ 1 ]
		).toMatchSnapshot();
	} );

	it( 'should skip events other than pull requests', async () => {
		mockGetContext.mockImplementation( () => mockPushEventContext );

		await run();

		// It bails out before even reading the artifact.
		expect( require( 'fs/promises' ).readdir ).not.toHaveBeenCalled();
		expect( mockAPI.createCommentOnPR ).not.toHaveBeenCalled();

		mockGetContext.mockImplementation( () => mockPullRequestEventContext );
	} );

	it( 'should not comment when there are no flaky tests', async () => {
		( core.getInput as jest.Mock )
			.mockReturnValueOnce( 'repo-token' )
			.mockReturnValueOnce( 'flaky-tests' );

		const mockedFs = require( 'fs/promises' );
		mockedFs.readdir.mockImplementationOnce( () => Promise.resolve( [] ) );

		await run();

		expect( mockAPI.createCommentOnPR ).not.toHaveBeenCalled();
	} );
} );
