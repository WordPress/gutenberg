import { beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from '../run.ts';

const api = vi.hoisted( () => ( {
	getPullRequest: vi.fn(),
	findComments: vi.fn(),
	createComment: vi.fn(),
	updateComment: vi.fn(),
	deleteComment: vi.fn(),
} ) );

vi.mock( import( '../github-api.ts' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		GitHubAPI: vi.fn(
			class MockGitHubAPI {
				constructor() {
					return api;
				}
			}
		) as unknown as typeof original.GitHubAPI,
	};
} );

const HEAD = 'a'.repeat( 40 );

function withInputs( inputs: Record< string, string > ) {
	for ( const [ name, value ] of Object.entries( inputs ) ) {
		process.env[ `INPUT_${ name.toUpperCase() }` ] = value;
	}
}

describe( 'run', () => {
	beforeEach( () => {
		for ( const mock of Object.values( api ) ) {
			mock.mockReset();
		}
		process.env.GITHUB_REPOSITORY = 'WordPress/gutenberg';
		api.getPullRequest.mockResolvedValue( {
			headSha: HEAD,
			baseRef: 'trunk',
		} );
		api.findComments.mockResolvedValue( { retirable: [] } );
		api.createComment.mockResolvedValue( 'https://example.com/comment' );
		api.updateComment.mockResolvedValue( 'https://example.com/comment' );
		withInputs( {
			'repo-token': 'token',
			section: 'labels',
			body: 'Warning.',
			'body-path': '',
			'pr-number': '10',
			'commit-sha': '',
			'run-url': '',
			'retire-comments-matching': '',
			'require-base': '',
		} );
	} );

	it( 'writes the section', async () => {
		await run();

		expect( api.createComment ).toHaveBeenCalledTimes( 1 );
		expect( api.createComment.mock.calls[ 0 ][ 1 ] ).toContain(
			'Warning.'
		);
	} );

	/*
	 * Rendering without the head would drop the "not the current head" footer
	 * from every stale section, presenting old results as current.
	 */
	it( 'writes nothing when the head cannot be read', async () => {
		api.getPullRequest.mockRejectedValue( new Error( 'boom' ) );

		await expect( run() ).rejects.toThrow( 'boom' );

		expect( api.createComment ).not.toHaveBeenCalled();
		expect( api.updateComment ).not.toHaveBeenCalled();
		expect( api.deleteComment ).not.toHaveBeenCalled();
	} );

	it( 'retires the standalone comment once the section is written', async () => {
		withInputs( {
			section: 'props',
			body: 'Props.',
			'retire-comments-matching': 'The following accounts',
		} );
		api.findComments.mockResolvedValue( { retirable: [ 7, 8 ] } );

		await run();

		expect( api.createComment ).toHaveBeenCalledTimes( 1 );
		expect( api.deleteComment.mock.calls.map( ( c ) => c[ 0 ] ) ).toEqual( [
			7, 8,
		] );
	} );

	/* Retiring first would leave nothing behind if the write then failed. */
	it( 'retires nothing when the write is skipped as stale', async () => {
		withInputs( {
			section: 'bundle-size',
			body: 'Size.',
			'commit-sha': 'b'.repeat( 40 ),
			'retire-comments-matching': 'The following accounts',
		} );
		api.findComments.mockResolvedValue( { retirable: [ 7 ] } );

		await run();

		expect( api.createComment ).not.toHaveBeenCalled();
		expect( api.deleteComment ).not.toHaveBeenCalled();
	} );

	/* The section being already in place is exactly when it is safe to retire. */
	it( 'retires the standalone comment when the section is already current', async () => {
		withInputs( {
			section: 'props',
			body: 'Props.',
			'retire-comments-matching': 'The following accounts',
		} );
		api.createComment.mockResolvedValue( 'https://example.com/comment' );

		// Write once to learn the exact body, then present it as already there.
		await run();
		const written = api.createComment.mock.calls[ 0 ][ 1 ];
		api.createComment.mockClear();
		api.deleteComment.mockClear();
		api.findComments.mockResolvedValue( {
			comment: { id: 1, body: written },
			retirable: [ 7 ],
		} );

		await run();

		expect( api.updateComment ).not.toHaveBeenCalled();
		expect( api.deleteComment ).toHaveBeenCalledWith( 7 );
	} );

	/* No contributors is a result too, and it makes the standalone list stale. */
	it( 'retires the standalone comment when the section is cleared', async () => {
		withInputs( {
			section: 'props',
			body: 'Props.',
			'retire-comments-matching': 'The following accounts',
		} );
		await run();
		const written = api.createComment.mock.calls[ 0 ][ 1 ];
		api.deleteComment.mockClear();

		api.findComments.mockResolvedValue( {
			comment: { id: 1, body: written },
			retirable: [ 7 ],
		} );
		withInputs( { body: '' } );

		await run();

		// The unified comment goes, its last section having gone, and so does it.
		expect( api.deleteComment.mock.calls.map( ( c ) => c[ 0 ] ) ).toEqual( [
			1, 7,
		] );
	} );

	it( 'retires the standalone comment when there is nothing to write', async () => {
		withInputs( {
			section: 'props',
			body: '',
			'retire-comments-matching': 'The following accounts',
		} );
		api.findComments.mockResolvedValue( { retirable: [ 7 ] } );

		await run();

		expect( api.createComment ).not.toHaveBeenCalled();
		expect( api.deleteComment ).toHaveBeenCalledWith( 7 );
	} );

	/*
	 * A pull_request_target workflow runs from the default branch whatever the
	 * pull request targets, so without this it reaches release branches whose
	 * own writers still truncate at render.
	 */
	it( 'writes nothing when the pull request targets another branch', async () => {
		api.getPullRequest.mockResolvedValue( {
			headSha: HEAD,
			baseRef: 'wp/7.1',
		} );
		withInputs( { 'require-base': 'trunk' } );

		await run();

		expect( api.createComment ).not.toHaveBeenCalled();
		expect( api.updateComment ).not.toHaveBeenCalled();
		expect( api.deleteComment ).not.toHaveBeenCalled();
	} );

	it( 'writes when the pull request targets the required branch', async () => {
		api.getPullRequest.mockResolvedValue( {
			headSha: HEAD,
			baseRef: 'trunk',
		} );
		withInputs( { 'require-base': 'trunk' } );

		await run();

		expect( api.createComment ).toHaveBeenCalledTimes( 1 );
	} );
} );
