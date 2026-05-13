/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	__experimentalRequestDistributedEditingRecoveryDryRun,
	__experimentalRequestDistributedEditingServerStateRefetch,
	__experimentalRequestDistributedEditingStaleBaseRejection,
	getDistributedEditingRecoveryEndpointPath,
	getDistributedEditingServerStateEndpointPath,
	getDistributedEditingStaleBaseEndpointPath,
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

	it( 'builds the current stale-base endpoint path', () => {
		expect(
			getDistributedEditingStaleBaseEndpointPath( {
				postId: 42,
			} )
		).toBe( '/wp/v2/posts/42/distributed-editing/stale-base' );
	} );

	it( 'builds the current server-state endpoint path', () => {
		expect(
			getDistributedEditingServerStateEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42' );
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

	it( 'requests stale-base rejection without exposing save or retry behavior', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/pages\/42\/distributed-editing\/stale-base/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				client_base_version: '4',
				server_version: '6',
				pending_change_count: 2,
				remote_change_count: 3,
				can_attempt_local_rebase: false,
			} );

			throw {
				code: 'stale_base_version_rejected',
				message: 'Distributed Editing rejected a stale base.',
				data: {
					status: 409,
					reason_code: 'stale_base_version_rejected',
				},
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingStaleBaseRejection( {
				postId: 42,
				restBase: 'pages',
				clientBaseVersion: '4',
				serverVersion: '6',
				pendingChangeCount: 2,
				remoteChangeCount: 3,
			} )
		).rejects.toMatchObject( {
			code: 'stale_base_version_rejected',
		} );
	} );

	it( 'requests server state for stale-base refetch without write data', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\?context=edit/
			);
			expect( options.method ).toBe( 'GET' );
			expect( options.data ).toBeUndefined();

			return {
				id: 42,
				modified_gmt: '2026-05-13T12:00:00',
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingServerStateRefetch( {
				postId: 42,
			} )
		).resolves.toEqual( {
			id: 42,
			modified_gmt: '2026-05-13T12:00:00',
		} );
	} );
} );
