/**
 * External dependencies
 */
import * as core from '@actions/core';
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';

/**
 * Internal dependencies
 */
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
const { mockGetContext, mockAPI, mockReaddir, mockReadFile } = vi.hoisted(
	() => ( {
		mockGetContext: vi.fn(),
		mockAPI: {
			fetchAllIssuesLabeledFlaky: vi.fn(),
			findMergeBaseCommit: vi.fn(),
			updateIssue: vi.fn(),
			createIssue: vi.fn(),
			createCommentOnPR: vi.fn(),
			createCommentOnCommit: vi.fn(),
		},
		mockReaddir: vi.fn< ( path: string ) => Promise< string[] > >(),
		mockReadFile:
			vi.fn< ( path: string, encoding: string ) => Promise< string > >(),
	} )
);

vi.mock( import( '@actions/github' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	get context() {
		return mockGetContext();
	},
} ) );

vi.mock( import( '@actions/core' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	error: vi.fn(),
	info: vi.fn(),
	getInput: vi.fn(),
} ) );

vi.mock( import( '../github-api' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		GitHubAPI: vi.fn(
			class MockGitHubAPI {
				constructor() {
					return mockAPI;
				}
			}
		) as unknown as typeof original.GitHubAPI,
	};
} );

vi.mock( import( 'fs/promises' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		readdir: mockReaddir as unknown as typeof original.readdir,
		readFile: mockReadFile as unknown as typeof original.readFile,
	};
} );

const mockedGetInput = vi.mocked( core.getInput );

beforeAll( () => {
	vi.useFakeTimers();
	vi.setSystemTime( new Date( '2020-05-10' ) );
} );

afterAll( () => {
	vi.useRealTimers();
} );

describe( 'Report flaky tests', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		mockGetContext.mockImplementation( () => mockPullRequestEventContext );
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

		mockedGetInput
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

		mockReaddir.mockImplementationOnce( () =>
			Promise.resolve( [
				`${ existingFlakyTest.title }.json`,
				`${ newFlakyTest.title }.json`,
			] )
		);
		mockReadFile
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

		mockedGetInput
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

		mockReaddir.mockImplementationOnce( () =>
			Promise.resolve( [
				`${ existingFlakyTest.title }.json`,
				`${ newFlakyTest.title }.json`,
			] )
		);
		mockReadFile
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
	} );

	it( 'should skip for outdated branches', async () => {
		const flakyTest = await import(
			'../__fixtures__/should copy only partial selection of text blocks.json'
		).then( ( json ) => json.default );
		const flakyIssues = await import(
			'../__fixtures__/flaky-issues.json'
		).then( ( json ) => json.default );

		mockedGetInput
			.mockReturnValueOnce( 'repo-token' )
			.mockReturnValueOnce( 'flaky-tests-report' )
			.mockReturnValueOnce( '[Type] Flaky Test' );

		// Replacing the cwd for the test for consistent snapshot results.
		flakyTest.path = flakyTest.path.replace(
			'/home/runner/work/gutenberg/gutenberg',
			process.cwd()
		);

		mockReaddir.mockImplementationOnce( () =>
			Promise.resolve( [ `${ flakyTest.title }.json` ] )
		);
		mockReadFile.mockImplementationOnce( () =>
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
