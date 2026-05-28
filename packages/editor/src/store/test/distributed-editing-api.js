/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	__experimentalRequestDistributedEditingRecoveryDryRun,
	__experimentalRequestDistributedEditingFreshReviewDecision,
	__experimentalRequestDistributedEditingFreshReviewRetrySaveHandoffValidation,
	__experimentalRequestDistributedEditingHistory,
	__experimentalRequestDistributedEditingHistoryPlan,
	__experimentalRequestDistributedEditingPresenceHeartbeat,
	__experimentalRequestDistributedEditingPresenceSnapshot,
	__experimentalRequestDistributedEditingPresenceStorageReadiness,
	__experimentalRequestDistributedEditingRetrySave,
	__experimentalRequestDistributedEditingRetrySaveReviewApprovalProof,
	__experimentalRequestDistributedEditingRetrySubmitProbe,
	__experimentalRequestDistributedEditingServerStateRefetch,
	__experimentalRequestDistributedEditingStaleBaseRejection,
	getDistributedEditingFreshReviewConsumeEndpointPath,
	getDistributedEditingFreshReviewDecisionEndpointPath,
	getDistributedEditingHistoryEndpointPath,
	getDistributedEditingHistoryPlanEndpointPath,
	getDistributedEditingPresenceHeartbeatEndpointPath,
	getDistributedEditingPresenceEndpointPath,
	getDistributedEditingPresenceStorageReadinessEndpointPath,
	getDistributedEditingRecoveryEndpointPath,
	getDistributedEditingRetrySaveEndpointPath,
	getDistributedEditingRetrySaveReviewApprovalEndpointPath,
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

	it( 'builds the current document-history endpoint paths', () => {
		expect(
			getDistributedEditingHistoryEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/history' );
		expect(
			getDistributedEditingHistoryPlanEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/history/plan' );
	} );

	it( 'builds the current retry-save review approval endpoint path', () => {
		expect(
			getDistributedEditingRetrySaveReviewApprovalEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/review-approval' );
	} );

	it( 'builds the current fresh-review decision endpoint path', () => {
		expect(
			getDistributedEditingFreshReviewDecisionEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/fresh-review-decision' );
	} );

	it( 'builds the current fresh-review consume endpoint path', () => {
		expect(
			getDistributedEditingFreshReviewConsumeEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/fresh-review-consume' );
	} );

	it( 'builds the current server-state endpoint path', () => {
		expect(
			getDistributedEditingServerStateEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing' );
	} );

	it( 'builds the current presence snapshot endpoint path', () => {
		expect(
			getDistributedEditingPresenceEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/presence' );
	} );

	it( 'builds the current presence heartbeat endpoint path', () => {
		expect(
			getDistributedEditingPresenceHeartbeatEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/presence/heartbeat' );
	} );

	it( 'builds the current presence storage readiness endpoint path', () => {
		expect(
			getDistributedEditingPresenceStorageReadinessEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe(
			'/wp/v2/pages/42/distributed-editing/presence/storage-readiness'
		);
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

	it( 'requests a presence snapshot without write data or polling', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/pages\/42\/distributed-editing\/presence/
			);
			expect( options.method ).toBe( 'GET' );
			expect( options.data ).toBeUndefined();

			return {
				result: 'presence_roster_snapshot',
				rest_route: 'post_presence_roster',
				presence_roster: {
					status: 'recent',
					entries: [
						{
							key: 'presence-mira',
							displayName: 'Mira',
							freshness: 'recent',
						},
					],
				},
				read_only: true,
				records_presence_heartbeat: false,
				enables_repeated_client_refresh: false,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingPresenceSnapshot( {
				postId: 42,
				restBase: 'pages',
			} )
		).resolves.toEqual(
			expect.objectContaining( {
				result: 'presence_roster_snapshot',
				read_only: true,
				records_presence_heartbeat: false,
				enables_repeated_client_refresh: false,
			} )
		);
	} );

	it( 'requests a presence snapshot with only the opaque current session key in the query string', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			const url = new URL( options.path, 'https://example.test' );
			expect( url.pathname ).toBe(
				'/wp/v2/pages/42/distributed-editing/presence'
			);
			expect( url.searchParams.get( 'session_key' ) ).toBe(
				'turn-0198-current-tab'
			);
			expect( options.method ).toBe( 'GET' );
			expect( options.data ).toBeUndefined();

			return {
				result: 'presence_roster_snapshot',
				rest_route: 'post_presence_roster',
				accepts_current_session_key: true,
				current_session_key_compared_by_hash: true,
				raw_session_key_included: false,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingPresenceSnapshot( {
				postId: 42,
				restBase: 'pages',
				sessionKey: 'turn-0198-current-tab',
			} )
		).resolves.toEqual(
			expect.objectContaining( {
				result: 'presence_roster_snapshot',
				accepts_current_session_key: true,
				current_session_key_compared_by_hash: true,
				raw_session_key_included: false,
			} )
		);
	} );

	it( 'sends a presence heartbeat without content, cursor, selection, or save data', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/pages\/42\/distributed-editing\/presence\/heartbeat/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				session_key: 'turn-0173-session',
			} );
			expect( options.data ).not.toHaveProperty(
				'proposed_post_content'
			);
			expect( options.data ).not.toHaveProperty( 'cursor_offset' );
			expect( options.data ).not.toHaveProperty( 'selection' );

			return {
				result: 'presence_heartbeat_recorded',
				rest_route: 'post_presence_heartbeat',
				writes_presence: true,
				records_presence_heartbeat: true,
				calls_save: false,
				mutates_post_content: false,
				changes_post_lock: false,
				claims_saved: false,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingPresenceHeartbeat( {
				postId: 42,
				restBase: 'pages',
				sessionKey: 'turn-0173-session',
			} )
		).resolves.toEqual(
			expect.objectContaining( {
				result: 'presence_heartbeat_recorded',
				writes_presence: true,
				records_presence_heartbeat: true,
				calls_save: false,
			} )
		);
	} );

	it( 'sends content-free document state with a presence heartbeat', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/pages\/42\/distributed-editing\/presence\/heartbeat/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				session_key: 'turn-0173-session',
				confirmed_base_version: '12',
				confirmed_state_hash:
					'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				has_pending_changes: true,
				confirmed_at_gmt: '2026-05-20T12:00:00.000Z',
			} );
			expect( options.data ).not.toHaveProperty(
				'proposed_post_content'
			);
			expect( options.data ).not.toHaveProperty( 'cursor_offset' );
			expect( options.data ).not.toHaveProperty( 'selection' );

			return {
				result: 'presence_heartbeat_recorded',
				rest_route: 'post_presence_heartbeat',
				document_state_recorded: true,
				document_state: {
					available: true,
					confirmedBaseVersion: '12',
					confirmedStateHash:
						'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
					hasPendingChanges: true,
					confirmedAtGmt: '2026-05-20 12:00:00',
					authoritativeForSave: false,
					claimsSaved: false,
					exposesRawContent: false,
				},
				calls_save: false,
				mutates_post_content: false,
				changes_post_lock: false,
				claims_saved: false,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingPresenceHeartbeat( {
				postId: 42,
				restBase: 'pages',
				sessionKey: 'turn-0173-session',
				confirmedBaseVersion: '12',
				confirmedStateHash:
					'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				hasPendingChanges: true,
				confirmedAtGmt: '2026-05-20T12:00:00.000Z',
			} )
		).resolves.toEqual(
			expect.objectContaining( {
				result: 'presence_heartbeat_recorded',
				document_state_recorded: true,
				calls_save: false,
			} )
		);
	} );

	it( 're-checks presence storage readiness without write data or polling', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/pages\/42\/distributed-editing\/presence\/storage-readiness/
			);
			expect( options.method ).toBe( 'GET' );
			expect( options.data ).toBeUndefined();

			return {
				result: 'presence_storage_ready',
				rest_route: 'post_presence_storage_readiness',
				status: 'ready',
				tableExists: true,
				schemaCurrent: true,
				setupRequired: false,
				contentFree: true,
				diagnosticOnly: true,
				installsPresenceTable: false,
				recordsPresenceHeartbeat: false,
				writesPresence: false,
				startsPolling: false,
				callsSave: false,
				mutatesPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingPresenceStorageReadiness( {
				postId: 42,
				restBase: 'pages',
			} )
		).resolves.toEqual(
			expect.objectContaining( {
				result: 'presence_storage_ready',
				status: 'ready',
				contentFree: true,
				installsPresenceTable: false,
				recordsPresenceHeartbeat: false,
				callsSave: false,
			} )
		);
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

	it( 'requests document history without write data', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			const url = new URL( options.path, 'https://example.test' );

			expect( url.pathname ).toBe(
				'/wp/v2/pages/42/distributed-editing/history'
			);
			expect( options.method ).toBe( 'GET' );
			expect( options.data ).toBeUndefined();

			return {
				result: 'history_loaded',
				history_items: [
					{
						revision_id: 0,
						is_current: true,
					},
				],
				saves_post: false,
				mutates_post_content: false,
				claims_saved: false,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingHistory( {
				postId: 42,
				restBase: 'pages',
			} )
		).resolves.toEqual(
			expect.objectContaining( {
				result: 'history_loaded',
				saves_post: false,
				mutates_post_content: false,
				claims_saved: false,
			} )
		);
	} );

	it( 'requests a document-history action plan without claiming a save', async () => {
		const selectedContentHash =
			'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

		apiFetch.setFetchHandler( async ( options ) => {
			const url = new URL( options.path, 'https://example.test' );

			expect( url.pathname ).toBe(
				'/wp/v2/posts/42/distributed-editing/history/plan'
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				history_action: 'restore',
				revision_id: 123,
				selected_content_hash: selectedContentHash,
			} );
			expect( options.data.proposed_post_content ).toBeUndefined();

			return {
				result: 'history_restore_planned',
				candidate_post_content:
					'<!-- wp:paragraph --><p>Restore this.</p><!-- /wp:paragraph -->',
				requires_save: true,
				saves_post: false,
				mutates_post_content: false,
				claims_saved: false,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingHistoryPlan( {
				postId: 42,
				historyAction: 'restore',
				revisionId: 123,
				selectedContentHash,
			} )
		).resolves.toEqual(
			expect.objectContaining( {
				result: 'history_restore_planned',
				requires_save: true,
				saves_post: false,
				mutates_post_content: false,
				claims_saved: false,
			} )
		);
	} );

	it( 'requests retry-save with proposed content and accepted proof evidence', async () => {
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Retry-save proposed content.</p><!-- /wp:paragraph -->';
		const proposedPostContentHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		const candidatePostContentHash =
			'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
		const reviewedBlockHash =
			'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

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
				accepted_review_approval_proof: {
					type: 'unfiltered_html_retry_save_review_approval',
					status: 'approved_by_unfiltered_html_reviewer',
					post_id: 42,
					post_type: 'post',
					reviewer_user_id: 1,
					low_privileged_saver_user_id: 7,
					reviewer_capability: 'unfiltered_html',
					review_scope: 'collaborative_post_content',
					server_version: '8',
					previous_server_version: '7',
					client_base_version: '8',
					accepted_proof_server_version: '8',
					rebased_from_version: '5',
					proposed_post_content_hash: proposedPostContentHash,
					reviewed_proposed_content_hash: proposedPostContentHash,
					candidate_post_content_hash: candidatePostContentHash,
					reviewed_candidate_content_hash: candidatePostContentHash,
					requires_unfiltered_html_saver: false,
					reviewed_block_items: [
						{
							id: 'risk-html-approved',
							block_client_id: '',
							block_name: 'core/html',
							block_label: '',
							block_path: [],
							change_kind: '',
							risk_reason: '',
							base_content_hash: null,
							proposed_content_hash: reviewedBlockHash,
							reviewed_proposed_content_hash: reviewedBlockHash,
							kses_filtered_content_hash: null,
							review_status: 'approved_for_retry_save',
							review_evidence_type: 'kses_block_hash_only_change',
							content_review_policy: 'kses',
							raw_content_included: false,
							exposes_raw_content: false,
						},
					],
					reviewed_block_item_count: 1,
					proof_signature:
						'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
					issued_at: 1893456000,
					expires_at: 1893456300,
					site_id: 1,
					site_url: 'http://example.test',
					raw_content_included: false,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
			} );
			expect( options.data.mode ).toBeUndefined();
			expect(
				JSON.stringify( options.data.accepted_review_approval_proof )
			).not.toContain( 'raw-review-content-must-not-send' );

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
				acceptedReviewApprovalProof: {
					type: 'unfiltered_html_retry_save_review_approval',
					status: 'approved_by_unfiltered_html_reviewer',
					postId: 42,
					postType: 'post',
					reviewerUserId: 1,
					lowPrivilegedSaverUserId: 7,
					reviewerCapability: 'unfiltered_html',
					reviewScope: 'collaborative_post_content',
					serverVersion: '8',
					previousServerVersion: '7',
					clientBaseVersion: '8',
					acceptedProofServerVersion: '8',
					rebasedFromVersion: '5',
					proposedPostContentHash,
					reviewedProposedContentHash: proposedPostContentHash,
					candidatePostContentHash,
					reviewedCandidateContentHash: candidatePostContentHash,
					reviewedBlockItems: [
						{
							id: 'risk-html-approved',
							blockName: 'core/html',
							proposedContentHash: reviewedBlockHash,
							reviewedProposedContentHash: reviewedBlockHash,
							reviewStatus: 'approved_for_retry_save',
							rawContent: 'raw-review-content-must-not-send',
						},
					],
					reviewedBlockItemCount: 1,
					proofSignature:
						'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
					issuedAt: '1893456000',
					expiresAt: '1893456300',
					siteId: '1',
					siteUrl: 'http://example.test',
					rawContentIncluded: false,
					savesPost: false,
					mutatesPostContent: false,
					createsRevision: false,
					claimsSaved: false,
				},
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

	it( 'requests retry-save with content-free block identity proof', async () => {
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Retry-save inserted block.</p><!-- /wp:paragraph -->';
		const proposedPostContentHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		const insertedHash =
			'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\/retry-save/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toMatchObject( {
				client_base_version: '41',
				accepted_proof_server_version: '41',
				rebased_from_version: '41',
				pending_change_count: 1,
				proposed_post_content: proposedPostContent,
				proposed_post_content_hash: proposedPostContentHash,
				block_identity_request_proof: {
					client_base_version: '41',
					proposed_post_content_hash: proposedPostContentHash,
					proposed_block_map: [
						{
							block_uid: 'block-a',
							block_name: 'core/paragraph',
							ordinal_path: [ 0 ],
							serialized_hash:
								'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						},
						{
							inserted_block_nonce: 'inserted-1-bbbbbbbbbbbbbbbb',
							block_name: 'core/paragraph',
							ordinal_path: [ 1 ],
							serialized_hash: insertedHash,
						},
					],
					retained_block_uids: [ 'block-a' ],
					inserted_block_nonces: [ 'inserted-1-bbbbbbbbbbbbbbbb' ],
					deleted_block_uids: [],
					moved_block_uids: [],
				},
			} );
			expect(
				options.data.block_identity_request_proof.proposed_post_content
			).toBeUndefined();
			expect(
				options.data.block_identity_request_proof.raw_content
			).toBeUndefined();
			expect(
				options.data.block_identity_request_proof.client_id
			).toBeUndefined();
			expect(
				JSON.stringify( options.data.block_identity_request_proof )
			).not.toMatch(
				/postContent|rawContent|raw_content|blockContent|block_content|clientId|client_id/
			);

			return {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySave( {
				postId: 42,
				clientBaseVersion: '41',
				acceptedProofServerVersion: '41',
				rebasedFromVersion: '41',
				pendingChangeCount: 1,
				proposedPostContent,
				proposedPostContentHash,
				blockIdentityRequestProof: {
					clientBaseVersion: '41',
					proposedPostContentHash,
					proposedBlockMap: [
						{
							blockUid: 'block-a',
							blockName: 'core/paragraph',
							ordinalPath: [ 0 ],
							serializedHash:
								'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						},
						{
							insertedBlockNonce: 'inserted-1-bbbbbbbbbbbbbbbb',
							blockName: 'core/paragraph',
							ordinalPath: [ 1 ],
							serializedHash: insertedHash,
						},
					],
					retainedBlockUids: [ 'block-a' ],
					insertedBlockNonces: [ 'inserted-1-bbbbbbbbbbbbbbbb' ],
					deletedBlockUids: [],
					movedBlockUids: [],
				},
			} )
		).resolves.toEqual( {
			result: 'retry_save_applied',
			retry_save_accepted: true,
		} );
	} );

	it( 'requests retry-save with native Yjs update evidence', async () => {
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Yjs edited content.</p><!-- /wp:paragraph -->';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\/retry-save/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toMatchObject( {
				client_base_version: '12',
				accepted_proof_server_version: '12',
				proposed_post_content: proposedPostContent,
				yjs_client_update: {
					format: 'native-yjs-php-update-v0',
					operations: [
						{
							type: 'delete',
							index: 28,
							length: 4,
							actor: 'editor-42',
							sequence: 0,
							id: 'editor-42:0',
						},
						{
							type: 'insert',
							index: 28,
							text: 'edited',
							actor: 'editor-42',
							sequence: 1,
							id: 'editor-42:1',
						},
					],
					stateVector: {
						'editor-42': 2,
					},
				},
			} );
			expect(
				options.data.yjs_client_update.post_content
			).toBeUndefined();
			expect(
				options.data.yjs_client_update.postContent
			).toBeUndefined();

			return {
				result: 'retry_save_applied',
				retry_save_accepted: true,
				yjs_update_applied: true,
				yjs_encoding: 'native-yjs-php-update-v0',
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySave( {
				postId: 42,
				clientBaseVersion: '12',
				acceptedProofServerVersion: '12',
				proposedPostContent,
				yjsClientUpdate: {
					format: 'native-yjs-php-update-v0',
					operations: [
						{
							type: 'delete',
							index: 28,
							length: 4,
							actor: 'editor-42',
							sequence: 0,
							id: 'editor-42:0',
						},
						{
							type: 'insert',
							index: 28,
							text: 'edited',
							actor: 'editor-42',
							sequence: 1,
							id: 'editor-42:1',
						},
					],
					stateVector: {
						'editor-42': 2,
					},
				},
			} )
		).resolves.toEqual( {
			result: 'retry_save_applied',
			retry_save_accepted: true,
			yjs_update_applied: true,
			yjs_encoding: 'native-yjs-php-update-v0',
		} );
	} );

	it( 'omits retry-save block identity proof containing clientId evidence', async () => {
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Retry-save inserted block.</p><!-- /wp:paragraph -->';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\/retry-save/
			);
			expect( options.data.block_identity_request_proof ).toBeUndefined();

			return {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySave( {
				postId: 42,
				clientBaseVersion: '41',
				acceptedProofServerVersion: '41',
				proposedPostContent,
				blockIdentityRequestProof: {
					clientBaseVersion: '41',
					proposedPostContentHash:
						'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
					proposedBlockMap: [
						{
							blockUid: 'block-a',
							blockName: 'core/paragraph',
							ordinalPath: [ 0 ],
							serializedHash:
								'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
							clientId: 'transient-gutenberg-client-id',
						},
					],
					retainedBlockUids: [ 'block-a' ],
					insertedBlockNonces: [],
					deletedBlockUids: [],
					movedBlockUids: [],
				},
			} )
		).resolves.toEqual( {
			result: 'retry_save_applied',
			retry_save_accepted: true,
		} );
	} );

	it( 'requests retry-save with an opaque review approval proof token envelope', async () => {
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Opaque token retry-save content.</p><!-- /wp:paragraph -->';
		const opaqueTokenEnvelope = {
			proof_envelope_type: 'opaque_review_approval_proof_token',
			token: 'de-rtc-review-token.turn-0077',
			token_version: 1,
			issued_at: 1893456000,
			expires_at: 1893456300,
			post: {
				id: 42,
				type: 'post',
			},
		};

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\/retry-save/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toMatchObject( {
				client_base_version: '8',
				accepted_proof_server_version: '8',
				rebased_from_version: '5',
				pending_change_count: 1,
				proposed_post_content: proposedPostContent,
				accepted_review_approval_proof: opaqueTokenEnvelope,
			} );
			expect(
				options.data.accepted_review_approval_proof.proof
			).toBeUndefined();
			expect(
				options.data.accepted_review_approval_proof.proof_signature
			).toBeUndefined();
			expect(
				options.data.accepted_review_approval_proof.reviewed_block_items
			).toBeUndefined();

			return {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySave( {
				postId: 42,
				clientBaseVersion: '8',
				acceptedProofServerVersion: '8',
				rebasedFromVersion: '5',
				proposedPostContent,
				acceptedReviewApprovalProof: opaqueTokenEnvelope,
			} )
		).resolves.toEqual( {
			result: 'retry_save_applied',
			retry_save_accepted: true,
		} );
	} );

	it( 'requests retry-save with a field-based review approval proof envelope', async () => {
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Field envelope retry-save content.</p><!-- /wp:paragraph -->';
		const proposedPostContentHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		const candidatePostContentHash =
			'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
		const fieldProofEnvelope = {
			proof_envelope_type: 'field_based_review_approval_proof',
			proof: {
				type: 'unfiltered_html_retry_save_review_approval',
				status: 'approved_by_unfiltered_html_reviewer',
				postId: 42,
				postType: 'post',
				reviewerUserId: 1,
				reviewerCapability: 'unfiltered_html',
				reviewScope: 'collaborative_post_content',
				serverVersion: '8',
				clientBaseVersion: '8',
				acceptedProofServerVersion: '8',
				rebasedFromVersion: '5',
				proposedPostContentHash,
				reviewedProposedContentHash: proposedPostContentHash,
				candidatePostContentHash,
				reviewedCandidateContentHash: candidatePostContentHash,
				proofSignature:
					'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
				issuedAt: '1893456000',
				expiresAt: '1893456300',
				siteId: '1',
				siteUrl: 'http://example.test',
				rawContentIncluded: false,
				savesPost: false,
				mutatesPostContent: false,
				createsRevision: false,
				claimsSaved: false,
			},
		};

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\/retry-save/
			);
			expect(
				options.data.accepted_review_approval_proof.proof_envelope_type
			).toBe( 'field_based_review_approval_proof' );
			expect(
				options.data.accepted_review_approval_proof.proof
			).toMatchObject( {
				post_id: 42,
				post_type: 'post',
				server_version: '8',
				proposed_post_content_hash: proposedPostContentHash,
				candidate_post_content_hash: candidatePostContentHash,
				proof_signature:
					'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
				raw_content_included: false,
			} );

			return {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySave( {
				postId: 42,
				clientBaseVersion: '8',
				acceptedProofServerVersion: '8',
				rebasedFromVersion: '5',
				proposedPostContent,
				acceptedReviewApprovalProof: fieldProofEnvelope,
			} )
		).resolves.toEqual( {
			result: 'retry_save_applied',
			retry_save_accepted: true,
		} );
	} );

	it( 'requests retry-save with accepted fresh-review consume validation evidence', async () => {
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Fresh-review validated retry-save content.</p><!-- /wp:paragraph -->';
		const proposedHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		const candidateHash =
			'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\/retry-save/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toMatchObject( {
				client_base_version: '12',
				accepted_proof_server_version: '12',
				rebased_from_version: '7',
				pending_change_count: 1,
				proposed_post_content: proposedPostContent,
				proposed_post_content_hash: proposedHash,
				accepted_fresh_review_decision: {
					type: 'fresh_review_decision_consumption_validation',
					status: 'eligible_for_retry_save_handoff',
					result: 'fresh_review_decision_eligible_for_retry_save_handoff',
					rest_route: 'post_fresh_review_consume',
					fresh_review_request_record_id: 'fresh-review-request-123',
					fresh_review_request_status: 'decision_recorded',
					fresh_review_decision_status: 'approved',
					client_base_version: '7',
					server_version: '12',
					proposed_post_content_hash: proposedHash,
					reviewed_proposed_content_hash: proposedHash,
					candidate_post_content_hash: candidateHash,
					reviewed_candidate_content_hash: candidateHash,
					reviewed_block_item_count: 1,
					hash_evidence_status: 'accepted',
					fresh_review_decision_consumption_validated: true,
					fresh_review_decision_eligible_for_retry_save: true,
					raw_content_included: false,
					exposes_raw_content: false,
					exposes_reviewer_ids: false,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
			} );
			expect(
				options.data.accepted_fresh_review_decision.raw_content
			).toBeUndefined();
			expect(
				options.data.accepted_fresh_review_decision.reviewer_user_id
			).toBeUndefined();
			expect(
				options.data.accepted_fresh_review_decision.proof_signature
			).toBeUndefined();

			return {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySave( {
				postId: 42,
				clientBaseVersion: '12',
				acceptedProofServerVersion: '12',
				rebasedFromVersion: '7',
				proposedPostContent,
				proposedPostContentHash: proposedHash,
				acceptedFreshReviewConsumeValidation: {
					type: 'fresh_review_decision_consumption_validation',
					status: 'eligible_for_retry_save_handoff',
					result: 'fresh_review_decision_eligible_for_retry_save_handoff',
					restRoute: 'post_fresh_review_consume',
					freshReviewRequestRecordId: 'fresh-review-request-123',
					freshReviewRequestStatus: 'decision_recorded',
					freshReviewDecisionStatus: 'approved',
					clientBaseVersion: '7',
					serverVersion: '12',
					proposedPostContentHash: proposedHash,
					candidatePostContentHash: candidateHash,
					reviewedBlockItemCount: 1,
					hashEvidenceStatus: 'accepted',
					freshReviewDecisionConsumptionValidated: true,
					freshReviewDecisionEligibleForRetrySave: true,
					rawContentIncluded: false,
					reviewerUserId: 9,
					proofSignature: 'must-not-send-proof-signature',
				},
			} )
		).resolves.toEqual( {
			result: 'retry_save_applied',
			retry_save_accepted: true,
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

	it( 'requests retry-save review approval with hash-only evidence', async () => {
		const proposedHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		const candidateHash =
			'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
		const reviewedBlockHash =
			'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/pages\/42\/distributed-editing\/review-approval/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				client_base_version: '11',
				accepted_proof_server_version: '11',
				pending_change_count: 2,
				review_action: 'request_unfiltered_html_reviewer',
				review_required_capability: 'unfiltered_html',
				reviewer_capability: 'unfiltered_html',
				review_scope: 'collaborative_post_content',
				proposed_post_content_hash: proposedHash,
				reviewed_proposed_content_hash: proposedHash,
				candidate_post_content_hash: candidateHash,
				reviewed_candidate_content_hash: candidateHash,
				reviewed_block_items: [
					{
						id: 'risk-html-approve',
						block_client_id: 'server-block-0',
						block_name: 'core/html',
						block_label: 'HTML',
						block_path: [ 0 ],
						change_kind: 'added_block',
						risk_reason: 'kses_would_remove_script',
						base_content_hash:
							'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						proposed_content_hash: reviewedBlockHash,
						reviewed_proposed_content_hash: reviewedBlockHash,
						kses_filtered_content_hash:
							'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
						review_status: 'approved_for_retry_save',
						review_evidence_type: 'kses_block_hash_only_change',
						content_review_policy: 'kses',
						raw_content_included: false,
						exposes_raw_content: false,
					},
				],
			} );
			expect( options.data.proposed_post_content ).toBeUndefined();
			expect( options.data.raw_content ).toBeUndefined();
			expect(
				options.data.reviewed_block_items[ 0 ].raw_content
			).toBeUndefined();
			expect(
				options.data.reviewed_block_items[ 0 ].raw_content_included
			).toBe( false );

			return {
				result: 'review_approval_accepted_for_retry_save',
				review_approval_accepted: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingRetrySaveReviewApprovalProof(
				{
					postId: 42,
					restBase: 'pages',
					clientBaseVersion: '11',
					acceptedProofServerVersion: '11',
					pendingChangeCount: 2,
					reviewAction: 'request_unfiltered_html_reviewer',
					reviewRequiredCapability: 'unfiltered_html',
					reviewerCapability: 'unfiltered_html',
					reviewScope: 'collaborative_post_content',
					proposedPostContentHash: proposedHash,
					candidatePostContentHash: candidateHash,
					reviewedBlockItems: [
						{
							id: 'risk-html-approve',
							blockClientId: 'server-block-0',
							blockName: 'core/html',
							blockLabel: 'HTML',
							blockPath: [ 0 ],
							changeKind: 'added_block',
							riskReason: 'kses_would_remove_script',
							baseContentHash:
								'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
							proposedContentHash: reviewedBlockHash,
							reviewedProposedContentHash: reviewedBlockHash,
							ksesFilteredContentHash:
								'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
							reviewStatus: 'approved_for_retry_save',
							reviewEvidenceType: 'kses_block_hash_only_change',
							contentReviewPolicy: 'kses',
							rawContent: 'raw-review-content-must-not-send',
							rawContentIncluded: true,
						},
					],
				}
			)
		).resolves.toEqual( {
			result: 'review_approval_accepted_for_retry_save',
			review_approval_accepted: true,
		} );
	} );

	it( 'requests fresh-review decisions with hash-only evidence', async () => {
		const proposedHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		const reviewedBlockHash =
			'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/pages\/42\/distributed-editing\/fresh-review-decision/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				fresh_review_decision: 'approved',
				reviewed_block_items: [
					{
						id: 'fresh-review-html',
						block_name: 'core/html',
						block_label: 'HTML',
						change_kind: 'added_block',
						content_review_policy: 'kses',
						risk_reason: 'kses_would_remove_script',
						proposed_content_hash: reviewedBlockHash,
						reviewed_proposed_content_hash: reviewedBlockHash,
						review_status: 'approved_for_retry_save',
						review_evidence_type: 'kses_block_hash_only_change',
						raw_content_included: false,
						exposes_raw_content: false,
					},
				],
				fresh_review_request_record_id: 'fresh-review-request-123',
				client_base_version: '7',
				server_version: '12',
				proposed_post_content_hash: proposedHash,
				reviewed_proposed_content_hash: proposedHash,
			} );
			expect( options.data.proposed_post_content ).toBeUndefined();
			expect( options.data.raw_content ).toBeUndefined();
			expect(
				options.data.reviewed_block_items[ 0 ].raw_content
			).toBeUndefined();

			return {
				result: 'fresh_review_decision_approved_for_retry_save',
				fresh_review_decision_accepted: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingFreshReviewDecision( {
				postId: 42,
				restBase: 'pages',
				freshReviewRequestRecordId: 'fresh-review-request-123',
				clientBaseVersion: '7',
				serverVersion: '12',
				freshReviewDecision: 'approved',
				proposedPostContentHash: proposedHash,
				reviewedBlockItems: [
					{
						id: 'fresh-review-html',
						blockName: 'core/html',
						blockLabel: 'HTML',
						changeKind: 'added_block',
						riskReason: 'kses_would_remove_script',
						proposedContentHash: reviewedBlockHash,
						reviewedProposedContentHash: reviewedBlockHash,
						reviewStatus: 'approved_for_retry_save',
						rawContent: 'raw-fresh-review-content-must-not-send',
						rawContentIncluded: true,
					},
				],
			} )
		).resolves.toEqual( {
			result: 'fresh_review_decision_approved_for_retry_save',
			fresh_review_decision_accepted: true,
		} );
	} );

	it( 'validates fresh-review retry-save handoff with hash-only evidence', async () => {
		const proposedHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		const candidateHash =
			'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/pages\/42\/distributed-editing\/fresh-review-consume/
			);
			expect( options.method ).toBe( 'POST' );
			expect( options.data ).toEqual( {
				fresh_review_request_record_id: 'fresh-review-request-123',
				client_base_version: '7',
				server_version: '12',
				proposed_post_content_hash: proposedHash,
				reviewed_proposed_content_hash: proposedHash,
				candidate_post_content_hash: candidateHash,
				reviewed_candidate_content_hash: candidateHash,
			} );
			expect( options.data.proposed_post_content ).toBeUndefined();
			expect( options.data.raw_content ).toBeUndefined();
			expect( options.data.reviewed_block_items ).toBeUndefined();
			expect( options.data.review_approval_proof ).toBeUndefined();

			return {
				result: 'fresh_review_decision_eligible_for_retry_save_handoff',
				fresh_review_decision_consumption_validated: true,
				fresh_review_decision_eligible_for_retry_save: true,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingFreshReviewRetrySaveHandoffValidation(
				{
					postId: 42,
					restBase: 'pages',
					freshReviewRequestRecordId: 'fresh-review-request-123',
					clientBaseVersion: '7',
					serverVersion: '12',
					proposedPostContentHash: proposedHash,
					candidatePostContentHash: candidateHash,
				}
			)
		).resolves.toEqual( {
			result: 'fresh_review_decision_eligible_for_retry_save_handoff',
			fresh_review_decision_consumption_validated: true,
			fresh_review_decision_eligible_for_retry_save: true,
		} );
	} );

	it( 'requests server state for stale-base refetch without write data', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\?_envelope=1(?:&_locale=user)?$/
			);
			expect( options.method ).toBe( 'GET' );
			expect( options.data ).toBeUndefined();
			expect( options.parse ).toBe( false );

			return {
				status: 200,
				headers: {
					ETag: '"snapshot-hash"',
				},
				body: {
					id: 42,
					modified_gmt: '2026-05-13T12:00:00',
				},
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingServerStateRefetch( {
				postId: 42,
			} )
		).resolves.toEqual( {
			id: 42,
			modified_gmt: '2026-05-13T12:00:00',
			state_hash: 'snapshot-hash',
		} );
	} );

	it( 'requests server state conditionally with the last post state hash', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\?_envelope=1(?:&_locale=user)?$/
			);
			expect( options.method ).toBe( 'GET' );
			expect( options.headers ).toEqual( {
				'If-None-Match': '"abc123"',
			} );
			expect( options.parse ).toBe( false );

			return {
				status: 304,
				headers: {
					ETag: '"abc123"',
				},
				body: null,
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingServerStateRefetch( {
				postId: 42,
				stateHash: 'abc123',
			} )
		).resolves.toEqual( {
			result: 'distributed_editing_post_not_modified',
			not_modified: true,
			state_hash: 'abc123',
		} );
	} );

	it( 'normalizes an apiFetch-rejected not-modified server state response', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\?_envelope=1(?:&_locale=user)?$/
			);
			expect( options.method ).toBe( 'GET' );
			expect( options.headers ).toEqual( {
				'If-None-Match': '"abc123"',
			} );
			expect( options.parse ).toBe( false );

			throw {
				status: 304,
				headers: {
					get: ( headerName ) =>
						headerName === 'ETag' ? '"abc123"' : null,
				},
				json: async () => {
					throw new Error( '304 responses should not be parsed.' );
				},
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingServerStateRefetch( {
				postId: 42,
				stateHash: 'abc123',
			} )
		).resolves.toEqual( {
			result: 'distributed_editing_post_not_modified',
			not_modified: true,
			state_hash: 'abc123',
		} );
	} );

	it( 'rejects an enveloped server-state error body', async () => {
		apiFetch.setFetchHandler( async ( options ) => {
			expect( options.path ).toMatch(
				/^\/wp\/v2\/posts\/42\/distributed-editing\?_envelope=1(?:&_locale=user)?$/
			);
			expect( options.method ).toBe( 'GET' );
			expect( options.parse ).toBe( false );

			return {
				status: 409,
				headers: {},
				body: {
					code: 'de_rtc_rebase_failed',
					message: 'The server copy needs review.',
					data: {
						status: 409,
					},
				},
			};
		} );

		await expect(
			__experimentalRequestDistributedEditingServerStateRefetch( {
				postId: 42,
			} )
		).rejects.toEqual( {
			code: 'de_rtc_rebase_failed',
			message: 'The server copy needs review.',
			data: {
				status: 409,
			},
		} );
	} );
} );
