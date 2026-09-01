import { beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from '../run.ts';

const api = vi.hoisted( () => ( {
	getHeadSha: vi.fn(),
	findComment: vi.fn(),
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
		api.getHeadSha.mockResolvedValue( HEAD );
		api.findComment.mockResolvedValue( undefined );
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
		api.getHeadSha.mockRejectedValue( new Error( 'boom' ) );

		await expect( run() ).rejects.toThrow( 'boom' );

		expect( api.createComment ).not.toHaveBeenCalled();
		expect( api.updateComment ).not.toHaveBeenCalled();
		expect( api.deleteComment ).not.toHaveBeenCalled();
	} );
} );
