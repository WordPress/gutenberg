import { run } from '../run.ts';
import { GitHubAPI } from '../github-api.ts';

jest.mock( '../github-api.ts', () => ( {
	GitHubAPI: jest.fn(),
} ) );

const HEAD = 'a'.repeat( 40 );

const api = {
	getHeadSha: jest.fn(),
	findComment: jest.fn(),
	createComment: jest.fn(),
	updateComment: jest.fn(),
	deleteComment: jest.fn(),
};

function withInputs( inputs: Record< string, string > ) {
	for ( const [ name, value ] of Object.entries( inputs ) ) {
		process.env[ `INPUT_${ name.toUpperCase() }` ] = value;
	}
}

describe( 'run', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( GitHubAPI as jest.Mock ).mockImplementation( () => api );
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
