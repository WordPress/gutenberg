/**
 * Internal dependencies
 */
import blockDeprecationWarning from '../';

describe( 'blockDeprecationWarning', () => {
	it( 'does nothing if there is no violation', async () => {
		const payload = {
			number: 22767,
			repository: {
				name: 'Gutenberg',
				owner: {
					login: 'WordPress',
				},
			},
		};
		const octokit = {
			pulls: {
				listFiles: jest.fn().mockReturnValue(
					Promise.resolve( {
						data: require( './fixtures/files-valid.json' ),
					} )
				),
			},
			issues: {
				createComment: jest.fn(),
			},
		};

		await blockDeprecationWarning( payload, octokit );

		expect( octokit.issues.createComment ).not.toHaveBeenCalled();
	} );

	it( 'comments if there is a violation', async () => {
		const payload = {
			number: 22767,
			repository: {
				name: 'Gutenberg',
				owner: {
					login: 'WordPress',
				},
			},
		};
		const octokit = {
			pulls: {
				listFiles: jest.fn().mockReturnValue(
					Promise.resolve( {
						data: require( './fixtures/files-valid.json' ),
					} )
				),
			},
			issues: {
				createComment: jest.fn(),
			},
		};

		await blockDeprecationWarning( payload, octokit );

		expect( octokit.issues.createComment ).not.toHaveBeenCalled();
	} );
} );
