import { beforeEach, describe, expect, it, vi } from 'vitest';
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
const { mockGetContext, mockAPI, mockReaddir, mockReadFile } = vi.hoisted(
	() => ( {
		mockGetContext: vi.fn(),
		mockAPI: {
			createCommentOnPR: vi.fn(),
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

async function mockFlakyTestsArtifact() {
	const playwrightFlakyTest = await import(
		'../__fixtures__/should copy only partial selection of text blocks.json'
	).then( ( json ) => json.default );
	const jestFlakyTest = await import(
		'../__fixtures__/Should insert new template part on creation.json'
	).then( ( json ) => json.default );

	mockedGetInput
		// token
		.mockReturnValueOnce( 'repo-token' )
		// artifact-path
		.mockReturnValueOnce( 'flaky-tests' );

	// Replacing the cwd for the test for consistent snapshot results.
	playwrightFlakyTest.path = playwrightFlakyTest.path.replace(
		'/home/runner/work/gutenberg/gutenberg',
		process.cwd()
	);

	mockReaddir.mockImplementationOnce( () =>
		Promise.resolve( [
			`${ playwrightFlakyTest.title }.json`,
			`${ jestFlakyTest.title }.json`,
		] )
	);
	mockReadFile
		.mockImplementationOnce( () =>
			Promise.resolve( JSON.stringify( playwrightFlakyTest ) )
		)
		.mockImplementationOnce( () =>
			Promise.resolve( JSON.stringify( jestFlakyTest ) )
		);
}

describe( 'Report flaky tests', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		mockGetContext.mockImplementation( () => mockPullRequestEventContext );
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
		expect( mockReaddir ).not.toHaveBeenCalled();
		expect( mockAPI.createCommentOnPR ).not.toHaveBeenCalled();
	} );

	it( 'should not comment when there are no flaky tests', async () => {
		mockedGetInput
			.mockReturnValueOnce( 'repo-token' )
			.mockReturnValueOnce( 'flaky-tests' );

		mockReaddir.mockImplementationOnce( () => Promise.resolve( [] ) );

		await run();

		expect( mockAPI.createCommentOnPR ).not.toHaveBeenCalled();
	} );
} );
