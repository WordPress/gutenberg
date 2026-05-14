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
	__experimentalRequestDistributedEditingRetrySaveReviewApprovalProof,
	__experimentalRequestDistributedEditingRetrySubmitProbe,
	__experimentalRequestDistributedEditingServerStateRefetch,
	__experimentalRequestDistributedEditingStaleBaseRejection,
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

	it( 'builds the current retry-save review approval endpoint path', () => {
		expect(
			getDistributedEditingRetrySaveReviewApprovalEndpointPath( {
				postId: 42,
				restBase: 'pages',
			} )
		).toBe( '/wp/v2/pages/42/distributed-editing/review-approval' );
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
