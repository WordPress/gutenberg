/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	__experimentalRequestDistributedEditingRecoveryDryRun,
	getDistributedEditingRecoveryEndpointPath,
} from '../distributed-editing-api';

describe( 'distributed editing REST helpers', () => {
	it( 'builds the current post recovery endpoint path', () => {
		expect(
			getDistributedEditingRecoveryEndpointPath( {
				postId: '42',
			} )
		).toBe( '/wp/v2/posts/42/distributed-editing/recovery' );
	} );

	it( 'builds the current page recovery endpoint path', () => {
		expect(
			getDistributedEditingRecoveryEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/recovery' );
	} );

	it( 'rejects unsupported REST bases until WordPress exposes them', () => {
		expect( () =>
			getDistributedEditingRecoveryEndpointPath( {
				postId: 42,
				restBase: 'blocks',
			} )
		).toThrow(
			'Distributed Editing recovery currently supports posts and pages REST bases only.'
		);
	} );

	it( 'requests dry-run recovery without exposing apply mode', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\/recovery/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				mode: 'dry_run',
				candidate_post_content_hash:
					'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
			} );

			return {
				mode: 'dry_run',
				result: 'candidate_update_valid',
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRecoveryDryRun( {
				postId: 42,
				candidatePostContentHash:
					'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
			} )
		).resolves.toEqual( {
			mode: 'dry_run',
			result: 'candidate_update_valid',
		} );
	} );
} );
