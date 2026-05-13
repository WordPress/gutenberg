/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	__experimentalRequestDistributedEditingRecoveryDryRun,
	__experimentalRequestDistributedEditingRetrySave,
	__experimentalRequestDistributedEditingRetrySubmitProbe,
	__experimentalRequestDistributedEditingServerStateRefetch,
	__experimentalRequestDistributedEditingStaleBaseRejection,
	getDistributedEditingRecoveryEndpointPath,
	getDistributedEditingRetrySaveEndpointPath,
	getDistributedEditingRetrySubmitEndpointPath,
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

	it( 'builds the current retry-submit endpoint path', () => {
		expect(
			getDistributedEditingRetrySubmitEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/retry-submit' );
	} );

	it( 'builds the current retry-save endpoint path', () => {
		expect(
			getDistributedEditingRetrySaveEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/retry-save' );
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

	it( 'requests retry-submit proof without raw content or save behavior', async () => {
		const proposedPostContentHash =
			'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\/retry-submit/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				client_base_version: '7',
				rebased_from_version: '4',
				pending_change_count: 2,
				proposed_post_content_hash: proposedPostContentHash,
			} );
			expect( options.data.content ).toBeUndefined();
			expect( options.data.mode ).toBeUndefined();

			return {
				result: 'retry_submit_accepted_for_future_save',
				retry_submit_accepted: true,
				saves_post: false,
				mutates_post_content: false,
				claims_saved: false,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySubmitProbe( {
				postId: 42,
				clientBaseVersion: '7',
				rebasedFromVersion: '4',
				pendingChangeCount: 2,
				proposedPostContentHash,
			} )
		).resolves.toEqual( {
			result: 'retry_submit_accepted_for_future_save',
			retry_submit_accepted: true,
			saves_post: false,
			mutates_post_content: false,
			claims_saved: false,
		} );
	} );

	it( 'requests retry-save with proposed content and accepted proof evidence', async () => {
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Retry-save proposed content.</p><!-- /wp:paragraph -->';
		const proposedPostContentHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\/retry-save/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				client_base_version: '8',
				accepted_proof_server_version: '8',
				rebased_from_version: '5',
				pending_change_count: 2,
				proposed_post_content: proposedPostContent,
				proposed_post_content_hash: proposedPostContentHash,
				accepted_proof_saves_post: false,
				accepted_proof_mutates_post_content: false,
				accepted_proof_creates_revision: false,
				accepted_proof_claims_saved: false,
			} );
			expect( options.data.mode ).toBeUndefined();

			return {
				result: 'retry_save_applied',
				retry_save_accepted: true,
				saves_post: true,
				mutates_post_content: true,
				creates_revision: true,
				claims_saved: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySave( {
				postId: 42,
				clientBaseVersion: '8',
				acceptedProofServerVersion: '8',
				rebasedFromVersion: '5',
				pendingChangeCount: 2,
				proposedPostContent,
				proposedPostContentHash,
			} )
		).resolves.toEqual( {
			result: 'retry_save_applied',
			retry_save_accepted: true,
			saves_post: true,
			mutates_post_content: true,
			creates_revision: true,
			claims_saved: true,
		} );
	} );

	it( 'requests retry-save with page routes and default accepted proof fields', async () => {
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Retry-save page content.</p><!-- /wp:paragraph -->';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/pages\/42\/distributed-editing\/retry-save/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				client_base_version: '11',
				accepted_proof_server_version: '11',
				pending_change_count: 1,
				proposed_post_content: proposedPostContent,
				accepted_proof_saves_post: false,
				accepted_proof_mutates_post_content: false,
				accepted_proof_creates_revision: false,
				accepted_proof_claims_saved: false,
			} );
			expect( options.data.rebased_from_version ).toBeUndefined();
			expect( options.data.proposed_post_content_hash ).toBeUndefined();
			expect( options.data.mode ).toBeUndefined();

			return {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySave( {
				postId: 42,
				restBase: 'pages',
				clientBaseVersion: '11',
				acceptedProofServerVersion: '11',
				proposedPostContent,
			} )
		).resolves.toEqual( {
			result: 'retry_save_applied',
			retry_save_accepted: true,
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
