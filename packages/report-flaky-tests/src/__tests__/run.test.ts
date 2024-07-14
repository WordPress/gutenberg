/**
 * External dependencies
 */
import * as core from '@actions/core';

/**
 * Internal dependencies
 */
import { run } from '../run';

jest.useFakeTimers( 'modern' ).setSystemTime( new Date( '2020-05-10' ) );

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
	fetchAllIssuesLabeledFlaky: jest.fn(),
	findMergeBaseCommit: jest.fn(),
	updateIssue: jest.fn(),
	createIssue: jest.fn(),
	createCommentOnPR: jest.fn(),
	createCommentOnCommit: jest.fn(),
};
jest.mock( '../github-api', () => ( {
	GitHubAPI: jest.fn( () => mockAPI ),
} ) );

jest.mock( 'fs/promises', () => ( {
	readdir: jest.fn(),
	readFile: jest.fn(),
} ) );

describe( 'Report flaky tests', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should report flaky tests to issue on pull request', async () => {
		const existingFlakyTest = await import(
			'../__fixtures__/should copy only partial selection of text blocks.json'
		).then( ( json ) => json.default );
		const newFlakyTest = await import(
			'../__fixtures__/Should insert new template part on creation.json'
		).then( ( json ) => json.default );
		const flakyIssues = await import(
			'../__fixtures__/flaky-issues.json'
		).then( ( json ) => json.default );

		( core.getInput as jest.Mock )
			// token
			.mockReturnValueOnce( 'repo-token' )
			// artifact-path
			.mockReturnValueOnce( 'flaky-tests' )
			// label
			.mockReturnValueOnce( '[Type] Flaky Test' );

		// Replacing the cwd for the test for consistent snapshot results.
		existingFlakyTest.path = existingFlakyTest.path.replace(
			'/home/runner/work/gutenberg/gutenberg',
			process.cwd()
		);

		const mockedFs = require( 'fs/promises' );
		mockedFs.readdir.mockImplementationOnce( () =>
			Promise.resolve( [
				`${ existingFlakyTest.title }.json`,
				`${ newFlakyTest.title }.json`,
			] )
		);
		mockedFs.readFile
			.mockImplementationOnce( () =>
				Promise.resolve( JSON.stringify( existingFlakyTest ) )
			)
			.mockImplementationOnce( () =>
				Promise.resolve( JSON.stringify( newFlakyTest ) )
			);

		mockAPI.fetchAllIssuesLabeledFlaky.mockImplementationOnce(
			() => flakyIssues
		);

		mockAPI.updateIssue.mockImplementationOnce( () => ( {
			number: 1,
			html_url: 'html_url',
		} ) );

		mockAPI.createIssue.mockImplementationOnce( () => ( {
			number: 2,
			html_url: 'html_url',
		} ) );

		mockAPI.createCommentOnPR.mockImplementationOnce( () => ( {
			html_url: 'comment_html_url',
		} ) );

		await run();

		const existingFlakyIssue = flakyIssues.find(
			( issue ) =>
				issue.title === `[Flaky Test] ${ existingFlakyTest.title }`
		)!;
		expect( mockAPI.updateIssue ).toHaveBeenCalledWith(
			expect.objectContaining( {
				issue_number: existingFlakyIssue.number,
				state: 'open',
			} )
		);
		expect( mockAPI.updateIssue.mock.calls[ 0 ][ 0 ].body ).toMatchSnapshot(
			'Updated existing flaky issue'
		);

		expect( mockAPI.createIssue ).not.toHaveBeenCalled();

		expect( mockAPI.createCommentOnPR ).toHaveBeenCalledTimes( 1 );
		expect( mockAPI.createCommentOnPR.mock.calls[ 0 ][ 0 ] ).toBe( 10 );
		expect( mockAPI.createCommentOnPR.mock.calls[ 0 ][ 1 ] )
			.toMatchInlineSnapshot( `
		"<!-- flaky-tests-report-comment -->
		**Flaky tests detected in headSHA.**
		Some tests passed with failed attempts. The failures may not be related to this commit but are still reported for visibility. See [the documentation](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/testing-overview.md#flaky-tests) for more information.

		🔍  Workflow run URL: https://github.com/WordPress/gutenberg/actions/runs/100
		📝  Reported issues:
		- #1 in \`/test/e2e/specs/editor/various/copy-cut-paste.spec.js\`"
	` );
	} );

	it( 'should report flaky tests to issue on push', async () => {
		mockGetContext.mockImplementation( () => mockPushEventContext );

		const existingFlakyTest = await import(
			'../__fixtures__/should copy only partial selection of text blocks.json'
		).then( ( json ) => json.default );
		const newFlakyTest = await import(
			'../__fixtures__/Should insert new template part on creation.json'
		).then( ( json ) => json.default );
		const flakyIssues = await import(
			'../__fixtures__/flaky-issues.json'
		).then( ( json ) => json.default );

		( core.getInput as jest.Mock )
			// token
			.mockReturnValueOnce( 'repo-token' )
			// artifact-path
			.mockReturnValueOnce( 'flaky-tests' )
			// label
			.mockReturnValueOnce( '[Type] Flaky Test' );

		// Replacing the cwd for the test for consistent snapshot results.
		existingFlakyTest.path = existingFlakyTest.path.replace(
			'/home/runner/work/gutenberg/gutenberg',
			process.cwd()
		);

		const mockedFs = require( 'fs/promises' );
		mockedFs.readdir.mockImplementationOnce( () =>
			Promise.resolve( [
				`${ existingFlakyTest.title }.json`,
				`${ newFlakyTest.title }.json`,
			] )
		);
		mockedFs.readFile
			.mockImplementationOnce( () =>
				Promise.resolve( JSON.stringify( existingFlakyTest ) )
			)
			.mockImplementationOnce( () =>
				Promise.resolve( JSON.stringify( newFlakyTest ) )
			);

		mockAPI.fetchAllIssuesLabeledFlaky.mockImplementationOnce(
			() => flakyIssues
		);

		mockAPI.updateIssue.mockImplementationOnce( () => ( {
			number: 1,
			html_url: 'html_url',
		} ) );

		mockAPI.createIssue.mockImplementationOnce( () => ( {
			number: 2,
			html_url: 'html_url',
		} ) );

		mockAPI.createCommentOnCommit.mockImplementationOnce( () => ( {
			html_url: 'comment_html_url',
		} ) );

		await run();

		const existingFlakyIssue = flakyIssues.find(
			( issue ) =>
				issue.title === `[Flaky Test] ${ existingFlakyTest.title }`
		)!;
		expect( mockAPI.updateIssue ).toHaveBeenCalledWith(
			expect.objectContaining( {
				issue_number: existingFlakyIssue.number,
				state: 'open',
			} )
		);
		expect( mockAPI.updateIssue.mock.calls[ 0 ][ 0 ].body ).toMatchSnapshot(
			'Updated existing flaky issue'
		);

		expect( mockAPI.createIssue ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: `[Flaky Test] ${ newFlakyTest.title }`,
			} )
		);
		expect( mockAPI.createIssue.mock.calls[ 0 ][ 0 ].body ).toMatchSnapshot(
			'Created new flaky issue'
		);

		expect( mockAPI.createCommentOnCommit ).toHaveBeenCalledTimes( 1 );
		expect( mockAPI.createCommentOnCommit.mock.calls[ 0 ][ 0 ] ).toBe(
			'commitSHA'
		);
		expect( mockAPI.createCommentOnCommit.mock.calls[ 0 ][ 1 ] )
			.toMatchInlineSnapshot( `
		"<!-- flaky-tests-report-comment -->
		**Flaky tests detected in commitSHA.**
		Some tests passed with failed attempts. The failures may not be related to this commit but are still reported for visibility. See [the documentation](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/testing-overview.md#flaky-tests) for more information.

		🔍  Workflow run URL: https://github.com/WordPress/gutenberg/actions/runs/100
		📝  Reported issues:
		- #1 in \`/test/e2e/specs/editor/various/copy-cut-paste.spec.js\`
		- #2 in \`specs/site-editor/template-part.test.js\`"
	` );

		mockGetContext.mockImplementation( () => mockPullRequestEventContext );
	} );

	it( 'should skip for outdated branches', async () => {
		const flakyTest = await import(
			'../__fixtures__/should copy only partial selection of text blocks.json'
		).then( ( json ) => json.default );
		const flakyIssues = await import(
			'../__fixtures__/flaky-issues.json'
		).then( ( json ) => json.default );

		( core.getInput as jest.Mock )
			.mockReturnValueOnce( 'repo-token' )
			.mockReturnValueOnce( 'flaky-tests-report' )
			.mockReturnValueOnce( '[Type] Flaky Test' );

		// Replacing the cwd for the test for consistent snapshot results.
		flakyTest.path = flakyTest.path.replace(
			'/home/runner/work/gutenberg/gutenberg',
			process.cwd()
		);

		const mockedFs = require( 'fs/promises' );
		mockedFs.readdir.mockImplementationOnce( () =>
			Promise.resolve( [ `${ flakyTest.title }.json` ] )
		);
		mockedFs.readFile.mockImplementationOnce( () =>
			Promise.resolve( JSON.stringify( flakyTest ) )
		);

		mockAPI.fetchAllIssuesLabeledFlaky.mockImplementationOnce(
			() => flakyIssues
		);

		const latestAncestorDate = new Date( '2022-05-10' );
		mockAPI.findMergeBaseCommit.mockImplementationOnce( () => ( {
			committer: {
				date: latestAncestorDate.toISOString(),
			},
		} ) );

		// The issue is closed after the latest ancestor date,
		// indicating that the code base at this point is outdated.
		const flakyIssue = flakyIssues.find(
			( issue ) => issue.title === `[Flaky Test] ${ flakyTest.title }`
		)!;
		flakyIssue.state = 'closed';
		// @ts-expect-error: "closed_at" hasn't been typed yet.
		flakyIssue.closed_at = new Date( '2022-05-15' ).toISOString();

		await run();

		expect( mockAPI.findMergeBaseCommit ).toHaveBeenCalledTimes( 1 );

		expect( mockAPI.updateIssue ).not.toHaveBeenCalled();

		expect( mockAPI.createCommentOnPR ).not.toHaveBeenCalled();
		expect( mockAPI.createCommentOnCommit ).not.toHaveBeenCalled();
	} );
} );
