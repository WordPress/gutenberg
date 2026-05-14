/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */

import * as actions from '../actions';
import {
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES,
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS,
	DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES,
	DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE,
	getDistributedEditingLocalUpdatesExportPayload,
} from '../distributed-editing';
import { store as editorStore } from '..';

const postId = 44;

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
};

const postTypeEntity = {
	slug: 'post',
	rest_base: 'posts',
	labels: {
		item_updated: 'Updated Post',
		item_published: 'Post published',
		item_reverted_to_draft: 'Post reverted to draft.',
		item_trashed: 'Post trashed.',
	},
};

function createRegistryWithStores() {
	// Create a registry.
	const registry = createRegistry();

	// Register stores.
	registry.register( blockEditorStore );
	registry.register( coreStore );
	registry.register( editorStore );
	registry.register( noticesStore );
	registry.register( preferencesStore );

	// Register post type entity.
	registry.dispatch( coreStore ).addEntities( [ postTypeConfig ] );

	// Store post type entity.
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	return registry;
}

const getMethod = ( options ) =>
	options.headers?.[ 'X-HTTP-Method-Override' ] || options.method || 'GET';

describe( 'Post actions', () => {
	describe( '__experimentalOpenDistributedEditingRiskyBlockReview()', () => {
		it( 'opens the pre-publish sidebar when risky-block policy requires review', async () => {
			const registry = createRegistryWithStores();

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-added',
							blockClientId: 'block-risk-html-added',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
						},
					],
					riskyBlockReviewPendingCount: 1,
					riskyBlockReviewPrePublishPanelRequired: true,
				} );

			expect(
				registry.select( editorStore ).isPublishSidebarOpened()
			).toBe( false );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalOpenDistributedEditingRiskyBlockReview();

			expect( result ).toMatchObject( {
				status: 'pre_publish_review_opened',
				opensPublishSidebar: true,
				focusesReviewPanel: true,
				reviewPanel: 'distributed_editing_risky_block_review',
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect(
				registry.select( editorStore ).isPublishSidebarOpened()
			).toBe( true );
		} );

		it( 'does not open the pre-publish sidebar when review is not required', async () => {
			const registry = createRegistryWithStores();

			const result = await registry
				.dispatch( editorStore )
				.__experimentalOpenDistributedEditingRiskyBlockReview();

			expect( result ).toMatchObject( {
				status: 'pre_publish_review_not_required',
				opensPublishSidebar: false,
				savesPost: false,
				callsNormalSavePost: false,
			} );
			expect(
				registry.select( editorStore ).isPublishSidebarOpened()
			).toBe( false );
		} );

		it( 'requests review-approval proof after risky-block review is resolved', async () => {
			const proposedPostContentHash =
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const candidatePostContentHash =
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
			const approvedBlockHash =
				'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
			const filteredBlockHash =
				'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			let apiCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				apiCalls++;
				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/review-approval`
					)
				);
				expect( data ).toMatchObject( {
					client_base_version: '12',
					accepted_proof_server_version: '12',
					pending_change_count: 2,
					proposed_post_content_hash: proposedPostContentHash,
					reviewed_proposed_content_hash: proposedPostContentHash,
					candidate_post_content_hash: candidatePostContentHash,
					reviewed_candidate_content_hash: candidatePostContentHash,
					reviewed_block_items: [
						{
							id: 'risk-html-approve',
							proposed_content_hash: approvedBlockHash,
							reviewed_proposed_content_hash: approvedBlockHash,
							kses_filtered_content_hash: filteredBlockHash,
							review_status: 'approved_for_retry_save',
							review_evidence_type: 'kses_block_hash_only_change',
							content_review_policy: 'kses',
						},
					],
				} );
				expect( data.reviewed_block_items ).toHaveLength( 1 );
				expect(
					data.reviewed_block_items[ 0 ].raw_content
				).toBeUndefined();
				expect(
					data.reviewed_block_items[ 0 ].raw_content_included
				).toBe( false );
				expect( JSON.stringify( data ) ).not.toContain(
					'<script>unsafe</script>'
				);

				return {
					result: 'review_approval_accepted_for_retry_save',
					review_approval_accepted: true,
					server_version: '12',
					previous_server_version: '12',
					client_base_version: '12',
					accepted_proof_server_version: '12',
					pending_change_count: 2,
					reviewed_block_items: data.reviewed_block_items,
					reviewed_block_item_count: 1,
					block_review_status: 'approved_for_retry_save',
					proposed_post_content_hash: proposedPostContentHash,
					candidate_post_content_hash: candidatePostContentHash,
					can_export_local_updates: true,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					serverVersion: '12',
					pendingChangeCount: 2,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySaveReviewProposedContentHash: proposedPostContentHash,
					retrySaveReviewCandidateContentHash:
						candidatePostContentHash,
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_RESOLVED,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-approve',
							blockClientId: 'block-risk-html-approve',
							blockName: 'core/html',
							blockLabel: 'Custom HTML approval',
							proposedContentHash: approvedBlockHash,
							ksesFilteredContentHash: filteredBlockHash,
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
							rawContent: '<script>unsafe</script>',
						},
						{
							id: 'risk-html-reject',
							blockClientId: 'block-risk-html-reject',
							blockName: 'core/html',
							blockLabel: 'Custom HTML rejection',
							proposedContentHash:
								'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
							ksesFilteredContentHash:
								'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
							rawContent: '<script>unsafe</script>',
						},
					],
					riskyBlockReviewItemCount: 2,
					riskyBlockReviewPendingCount: 0,
					riskyBlockReviewApprovedCount: 1,
					riskyBlockReviewRejectedCount: 1,
					riskyBlockReviewPrePublishPanelRequired: false,
					riskyBlockReviewCanExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview()
			).resolves.toMatchObject( {
				status: 'review_approval_proof_accepted',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				opensPrePublishReview: false,
				callsReviewApprovalProofEndpoint: true,
				reviewApprovalProofAccepted: true,
				reviewedBlockItemCount: 1,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( apiCalls ).toBe( 1 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveReviewApprovalProofStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
				retrySaveReviewApprovalAccepted: true,
				retrySaveReviewApprovalReviewedBlockItemCount: 1,
				canExportLocalUpdates: true,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );
	} );

	describe( '__experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview()', () => {
		it( 'opens pre-publish review and blocks normal save when the enabled Save policy requires review', async () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-added',
							blockClientId: 'block-risk-html-added',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
						},
					],
					riskyBlockReviewPendingCount: 1,
					riskyBlockReviewPrePublishPanelRequired: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview();

			expect( result ).toMatchObject( {
				status: 'pre_publish_review_opened',
				reason: 'risky_block_review_required',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				opensPrePublishReview: true,
				opensPublishSidebar: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect(
				registry.select( editorStore ).isPublishSidebarOpened()
			).toBe( true );
		} );

		it( 'falls back to normal save when Distributed Editing is disabled', async () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: false,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-added',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
						},
					],
					riskyBlockReviewPendingCount: 1,
					riskyBlockReviewPrePublishPanelRequired: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview()
			).resolves.toMatchObject( {
				status: 'normal_save_fallback',
				allowsNormalSaveFallback: true,
				blocksNormalSavePost: false,
				opensPrePublishReview: false,
			} );
			expect(
				registry.select( editorStore ).isPublishSidebarOpened()
			).toBe( false );
		} );

		it( 'blocks normal save when stale review state requires refetch', async () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.STALE_AFTER_REVIEW,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-stale',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.STALE_AFTER_REVIEW,
						},
					],
					riskyBlockReviewRequiresServerStateRefetch: true,
					riskyBlockReviewCurrentServerVersion: '26',
					riskyBlockReviewReviewedServerVersion: '25',
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview()
			).resolves.toMatchObject( {
				status: 'risky_block_review_refetch_required',
				reason: 'risky_block_review_stale',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				opensPrePublishReview: false,
				requiresServerStateRefetch: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect(
				registry.select( editorStore ).isPublishSidebarOpened()
			).toBe( false );
		} );
	} );

	describe( '__experimentalFocusDistributedEditingRiskyBlockReviewItem()', () => {
		it( 'returns a no-write block focus handoff for a review item', async () => {
			const registry = createRegistryWithStores();

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-added',
							blockClientId: 'block-risk-html-added',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
						},
					],
					riskyBlockReviewPendingCount: 1,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalFocusDistributedEditingRiskyBlockReviewItem(
					'risk-html-added'
				);

			expect( result ).toMatchObject( {
				status: 'review_item_block_focused',
				reviewItemId: 'risk-html-added',
				blockClientId: 'block-risk-html-added',
				selectsBlock: true,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
		} );
	} );

	describe( '__experimentalResolveDistributedEditingRiskyBlockReviewItem()', () => {
		it( 'records reviewer approval and rejection without writing', async () => {
			const registry = createRegistryWithStores();

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewItems: [
						{
							id: 'risk-approve',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
						},
						{
							id: 'risk-reject',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
						},
					],
					riskyBlockReviewPendingCount: 2,
					riskyBlockReviewPrePublishPanelRequired: true,
				} );

			const approval = await registry
				.dispatch( editorStore )
				.__experimentalResolveDistributedEditingRiskyBlockReviewItem( {
					reviewItemId: 'risk-approve',
					decision: 'approved',
				} );
			const rejection = await registry
				.dispatch( editorStore )
				.__experimentalResolveDistributedEditingRiskyBlockReviewItem( {
					reviewItemId: 'risk-reject',
					decision: 'rejected',
					rejectionReason: 'unsafe_script_change',
				} );

			expect( approval ).toMatchObject( {
				status: 'review_item_resolved',
				reviewItemId: 'risk-approve',
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( rejection ).toMatchObject( {
				status: 'review_item_resolved',
				reviewItemId: 'risk-reject',
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
				pendingReviewItemCount: 0,
				approvedReviewItemCount: 1,
				rejectedReviewItemCount: 1,
				saveClickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
				savesPost: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingRiskyBlockReviewState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_RESOLVED,
				pendingReviewItemCount: 0,
				approvedReviewItemCount: 1,
				rejectedReviewItemCount: 1,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSavePolicyState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE,
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
				savesPost: false,
				shouldCallNormalSavePost: false,
				shouldCallRetrySaveEndpoint: false,
			} );
		} );
	} );

	describe( '__experimentalRefreshDistributedEditingRecoveryDryRun()', () => {
		it( 'requests a dry run for the current post and keeps success inert', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/recovery`
					)
				);
				expect( data ).toEqual( {
					mode: 'dry_run',
				} );

				return {
					mode: 'dry_run',
					result: 'candidate_update_valid',
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingRecoveryDryRun()
			).resolves.toEqual( {
				mode: 'dry_run',
				result: 'candidate_update_valid',
			} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toEqual( DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE );
		} );

		it( 'normalizes feature-disabled errors before rethrowing', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			const error = {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
				message: 'Distributed Editing is not enabled for this post.',
			};

			apiFetch.setFetchHandler( async () => {
				throw error;
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingRecoveryDryRun()
			).rejects.toBe( error );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_FEATURE_DISABLED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
				hasPendingChanges: false,
				isAwaitingServerConfirmation: false,
			} );
		} );
	} );

	describe( '__experimentalRefreshDistributedEditingStaleBaseRejection()', () => {
		it( 'normalizes stale-base REST errors before rethrowing', async () => {
			const baseContent =
				'<!-- wp:paragraph --><p>Base.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			const error = {
				code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				message:
					'Distributed Editing rejected the update because the client base version is stale.',
				data: {
					status: 409,
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: '4',
					server_version: '6',
					pending_change_count: 2,
					remote_change_count: 3,
					requires_server_state_refetch: true,
					can_attempt_local_rebase: false,
					can_export_local_updates: true,
				},
			};

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/stale-base`
					)
				);
				expect( data ).toEqual( {
					client_base_version: '4',
					server_version: '6',
					pending_change_count: 2,
					remote_change_count: 3,
					can_attempt_local_rebase: false,
				} );

				throw error;
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingStaleBaseRejection(
						{
							clientBaseVersion: '4',
							serverVersion: '6',
							pendingChangeCount: 2,
							remoteChangeCount: 3,
							clientBaseContent: baseContent,
						}
					)
			).rejects.toBe( error );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				clientBaseVersion: '4',
				serverVersion: '6',
				clientBaseContent: baseContent,
				pendingChangeCount: 2,
				remoteChangeCount: 3,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				requiresServerStateRefetch: true,
				canAttemptLocalRebase: false,
				canExportLocalUpdates: true,
			} );
		} );
	} );

	describe( '__experimentalRefreshDistributedEditingServerStateAfterStaleBase()', () => {
		it( 'refetches server state without applying it over local edits', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			const serverResponse = {
				id: postId,
				type: 'post',
				content: {
					raw: 'remote bar',
				},
				distributed_editing: {
					server_version: '7',
				},
			};

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				expect( method ).toBe( 'GET' );
				expect( path ).toMatch(
					new RegExp( `^/wp/v2/posts/${ postId }\\?context=edit` )
				);
				expect( data ).toBeUndefined();

				return serverResponse;
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'local bar',
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '6',
					pendingChangeCount: 2,
					remoteChangeCount: 3,
					requiresServerStateRefetch: true,
					canExportLocalUpdates: true,
				} );

			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingServerStateAfterStaleBase()
			).resolves.toBe( serverResponse );

			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'local bar' );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				clientBaseVersion: '4',
				serverVersion: '7',
				refetchedServerContent: 'remote bar',
				pendingChangeCount: 2,
				remoteChangeCount: 3,
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				canAttemptLocalRebase: true,
				canExportLocalUpdates: true,
			} );
		} );

		it( 'refetches after blocked retry-save without saving, notices, locks, or dropping local changes', async () => {
			const clientBaseContent =
				'<!-- wp:paragraph --><p>Base.</p><!-- /wp:paragraph -->';
			const localContent =
				'<!-- wp:paragraph --><p>Local edits.</p><!-- /wp:paragraph -->';
			const refetchedServerContent =
				'<!-- wp:paragraph --><p>Server edits.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: clientBaseContent,
				status: 'draft',
			};
			const serverResponse = {
				id: postId,
				type: 'post',
				content: {
					raw: refetchedServerContent,
				},
				distributed_editing: {
					server_version: '8',
				},
			};
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				apiFetchCallCount++;
				const { path, method, data } = options;

				expect( method ).toBe( 'GET' );
				expect( path ).toMatch(
					new RegExp( `^/wp/v2/posts/${ postId }\\?context=edit` )
				);
				expect( data ).toBeUndefined();

				return serverResponse;
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: localContent,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '7',
					clientBaseContent,
					pendingChangeCount: 2,
					remoteChangeCount: 1,
					requiresServerStateRefetch: true,
					canExportLocalUpdates: true,
					retrySaveHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
					retrySaveHandoffReason:
						DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
					retrySaveHandoffBlocksNormalSave: true,
				} );

			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect(
				registry.select( editorStore ).isPostAutosavingLocked()
			).toBe( false );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingServerStateAfterStaleBase()
			).resolves.toBe( serverResponse );

			expect( apiFetchCallCount ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( localContent );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect(
				registry.select( editorStore ).isPostAutosavingLocked()
			).toBe( false );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				clientBaseVersion: '4',
				serverVersion: '8',
				clientBaseContent,
				refetchedServerContent,
				pendingChangeCount: 2,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				canAttemptLocalRebase: true,
				mustOfferLocalCopy: true,
				canExportLocalUpdates: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				retrySaveHandoffBlocksNormalSave: true,
			} );
		} );
	} );

	describe( '__experimentalPlanDistributedEditingLocalRebaseAfterStaleBase()', () => {
		it( 'plans a local rebase without fetching, applying, saving, or retrying', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async () => {
				apiFetchCallCount++;
				throw new Error(
					'Local rebase planning must not call apiFetch.'
				);
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'local bar',
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 2,
					remoteChangeCount: 3,
					requiresServerStateRefetch: false,
					refetchedServerState: true,
					canAttemptLocalRebase: true,
					canExportLocalUpdates: true,
				} );

			const plannedState = await registry
				.dispatch( editorStore )
				.__experimentalPlanDistributedEditingLocalRebaseAfterStaleBase();

			expect( apiFetchCallCount ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'local bar' );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect( plannedState ).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				clientBaseVersion: '4',
				serverVersion: '7',
				pendingChangeCount: 2,
				refetchedServerState: true,
				canAttemptLocalRebase: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				readyToRetrySubmit: false,
				canExportLocalUpdates: true,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( plannedState );
		} );

		it( 'records that planning still needs server state before refetch', async () => {
			const registry = createRegistryWithStores();

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '6',
					pendingChangeCount: 2,
					requiresServerStateRefetch: true,
				} );

			const plannedState = await registry
				.dispatch( editorStore )
				.__experimentalPlanDistributedEditingLocalRebaseAfterStaleBase();

			expect( plannedState ).toMatchObject( {
				requiresServerStateRefetch: true,
				refetchedServerState: false,
				canAttemptLocalRebase: false,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NEEDS_SERVER_STATE,
				readyToRetrySubmit: false,
			} );
		} );
	} );

	describe( '__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase()', () => {
		it( 'applies a serialized-block local rebase without fetching, saving, or retrying', async () => {
			const baseContent =
				'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
			const serverContent =
				'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->';
			const localContent =
				'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: baseContent,
				status: 'draft',
			};
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async () => {
				apiFetchCallCount++;
				throw new Error( 'Local rebase must not call apiFetch.' );
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: localContent,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					remoteChangeCount: 1,
					requiresServerStateRefetch: false,
					refetchedServerState: true,
					canAttemptLocalRebase: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					canExportLocalUpdates: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase(
					{
						clientBaseContent: baseContent,
						serverContent,
					}
				);

			expect( apiFetchCallCount ).toBe( 0 );
			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				hasCandidatePostContent: true,
				readyToRetrySubmit: true,
				requiresManualConflictResolution: false,
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe(
				'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->'
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				canAttemptLocalRebase: false,
				readyToRetrySubmit: true,
				requiresManualConflictResolution: false,
			} );
		} );

		it( 'keeps local content untouched when serialized-block rebase conflicts', async () => {
			const baseContent =
				'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->';
			const localContent =
				'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: baseContent,
				status: 'draft',
			};
			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: localContent,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					refetchedServerState: true,
					pendingChangeCount: 1,
					canAttemptLocalRebase: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					canExportLocalUpdates: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase(
					{
						clientBaseContent: baseContent,
						serverContent:
							'<!-- wp:paragraph --><p>Remote alpha</p><!-- /wp:paragraph -->',
					}
				);

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				hasCandidatePostContent: false,
				readyToRetrySubmit: false,
				requiresManualConflictResolution: true,
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( localContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				readyToRetrySubmit: false,
				requiresManualConflictResolution: true,
				canExportLocalUpdates: true,
			} );
		} );

		it( 'uses remembered base and refetched server content for serialized-block local rebase', async () => {
			const baseContent =
				'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
			const serverContent =
				'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->';
			const localContent =
				'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: baseContent,
				status: 'draft',
			};
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async () => {
				apiFetchCallCount++;
				throw new Error(
					'Remembered local rebase must not call apiFetch.'
				);
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: localContent,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '7',
					clientBaseContent: baseContent,
					refetchedServerContent: serverContent,
					pendingChangeCount: 1,
					remoteChangeCount: 1,
					requiresServerStateRefetch: false,
					refetchedServerState: true,
					canAttemptLocalRebase: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					canExportLocalUpdates: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase();

			expect( apiFetchCallCount ).toBe( 0 );
			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				hasCandidatePostContent: true,
				readyToRetrySubmit: true,
				sessionState: {
					clientBaseContent: baseContent,
					refetchedServerContent: serverContent,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				},
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe(
				'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->'
			);
		} );
	} );

	describe( '__experimentalImportDistributedEditingLocalUpdates()', () => {
		const approvedPostContent =
			'<!-- wp:html --><script>approved</script><!-- /wp:html -->';
		const approvedPostContentHash =
			'7e479a6c51c9e8167f1542af0c730ae0009236c4936876ebbf85bcd7c3ab7dd0';
		const mismatchedPostContentHash =
			'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
		const candidatePostContentHash =
			'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
		const proofSignature =
			'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
		const originalCrypto = globalThis.crypto;
		const originalTextEncoder = globalThis.TextEncoder;

		beforeEach( () => {
			const { TextEncoder } = require( 'util' );

			Object.defineProperty( globalThis, 'TextEncoder', {
				configurable: true,
				value: originalTextEncoder || TextEncoder,
			} );
			Object.defineProperty( globalThis, 'crypto', {
				configurable: true,
				value: {
					subtle: {
						digest: jest.fn( async ( _algorithm, bytes ) => {
							const postContent = Buffer.from( bytes ).toString();
							const hash =
								postContent === approvedPostContent
									? approvedPostContentHash
									: mismatchedPostContentHash;

							return Uint8Array.from(
								( hash.match( /.{2}/g ) || [] ).map( ( byte ) =>
									parseInt( byte, 16 )
								)
							).buffer;
						} ),
					},
				},
			} );
		} );

		afterEach( () => {
			if ( originalTextEncoder ) {
				Object.defineProperty( globalThis, 'TextEncoder', {
					configurable: true,
					value: originalTextEncoder,
				} );
			} else {
				delete globalThis.TextEncoder;
			}

			if ( originalCrypto ) {
				Object.defineProperty( globalThis, 'crypto', {
					configurable: true,
					value: originalCrypto,
				} );
			} else {
				delete globalThis.crypto;
			}
		} );

		function getValidLocalUpdatesImportPayload( options = {} ) {
			return getDistributedEditingLocalUpdatesExportPayload( {
				currentPost: {
					id: options.postId ?? postId,
					type: options.postType ?? 'post',
				},
				editedPostContent: options.postContent ?? approvedPostContent,
				sessionState: {
					serverVersion: '12',
					clientBaseVersion: '7',
					pendingChangeCount: 1,
					retrySaveReviewApprovalProofStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
					retrySaveReviewApprovalAccepted: true,
					retrySaveReviewApprovalPostId: String(
						options.proofPostId ?? options.postId ?? postId
					),
					retrySaveReviewApprovalPostType:
						options.proofPostType ?? options.postType ?? 'post',
					retrySaveReviewApprovalServerVersion: '12',
					retrySaveReviewApprovalRebasedFromVersion: '7',
					retrySaveReviewApprovalProposedContentHash:
						options.proposedPostContentHash ??
						approvedPostContentHash,
					retrySaveReviewApprovalCandidateContentHash:
						candidatePostContentHash,
					retrySaveReviewApprovalProofSignature: proofSignature,
					retrySaveReviewApprovalIssuedAt: '1893456000',
					retrySaveReviewApprovalExpiresAt: '1893456300',
					retrySaveReviewApprovalSiteId: '1',
					retrySaveReviewApprovalSiteUrl: 'http://example.test',
				},
			} );
		}

		function setupImportEditor( initialContent = 'original content' ) {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: initialContent,
				status: 'draft',
			};
			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: initialContent,
			} );

			return registry;
		}

		it( 'imports a validated payload into local editor content without saving or transport', async () => {
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async () => {
				apiFetchCallCount++;
				throw new Error(
					'Local-updates import must not call apiFetch.'
				);
			} );

			const registry = setupImportEditor();
			const result = await registry
				.dispatch( editorStore )
				.__experimentalImportDistributedEditingLocalUpdates(
					JSON.stringify( getValidLocalUpdatesImportPayload() )
				);

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
				hasPostContent: true,
				mutatesEditorContent: true,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				dispatchesNotice: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( apiFetchCallCount ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( approvedPostContent );
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect(
				registry.select( editorStore ).isPostAutosavingLocked()
			).toBe( false );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
				localUpdatesImportHasPostContent: true,
				localUpdatesImportHasAcceptedReviewApprovalProof: true,
				localUpdatesImportVerifiedPostContentHash:
					approvedPostContentHash,
				retrySaveReviewApprovalIssuedAt: '1893456000',
				retrySaveReviewApprovalExpiresAt: '1893456300',
				retrySaveReviewApprovalSiteUrl: 'http://example.test',
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				canExportLocalUpdates: true,
				mustOfferLocalCopy: true,
				retrySubmitSavesPost: false,
				retrySubmitClaimsSaved: false,
			} );
		} );

		it.each( [
			[
				'malformed payload',
				'{not-json',
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MALFORMED_PAYLOAD,
			],
			[
				'hash mismatch',
				JSON.stringify(
					getValidLocalUpdatesImportPayload( {
						postContent:
							'<!-- wp:html --><script>changed</script><!-- /wp:html -->',
					} )
				),
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_CONTENT_HASH_MISMATCH,
			],
			[
				'route mismatch',
				JSON.stringify(
					getValidLocalUpdatesImportPayload( {
						postId: postId + 1,
					} )
				),
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_ROUTE_MISMATCH,
			],
			[
				'missing proof',
				JSON.stringify(
					getDistributedEditingLocalUpdatesExportPayload( {
						currentPost: {
							id: postId,
							type: 'post',
						},
						editedPostContent: approvedPostContent,
						sessionState: {
							serverVersion: '12',
						},
					} )
				),
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_REVIEW_APPROVAL_PROOF,
			],
			[
				'fresh review required handoff',
				JSON.stringify(
					getDistributedEditingLocalUpdatesExportPayload( {
						currentPost: {
							id: postId,
							type: 'post',
						},
						editedPostContent: approvedPostContent,
						sessionState: {
							serverVersion: '12',
							clientBaseVersion: '7',
							pendingChangeCount: 1,
							retrySaveStatus:
								DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
							retrySaveReason:
								'unknown_retry_save_review_approval_proof_token',
						},
					} )
				),
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			],
		] )(
			'blocks %s before changing editor content',
			async ( _label, payload, reason ) => {
				let apiFetchCallCount = 0;

				apiFetch.setFetchHandler( async () => {
					apiFetchCallCount++;
					throw new Error(
						'Blocked local-updates import must not call apiFetch.'
					);
				} );

				const registry = setupImportEditor();
				const result = await registry
					.dispatch( editorStore )
					.__experimentalImportDistributedEditingLocalUpdates(
						payload
					);

				expect( result ).toMatchObject( {
					status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					reason,
					hasPostContent: false,
					mutatesEditorContent: false,
					callsRetrySaveEndpoint: false,
					callsNormalSavePost: false,
					dispatchesNotice: false,
					changesPostLock: false,
					claimsSaved: false,
				} );
				expect( apiFetchCallCount ).toBe( 0 );
				expect(
					registry.select( editorStore ).getEditedPostContent()
				).toBe( 'original content' );
				expect(
					registry.select( editorStore ).isPostSavingLocked()
				).toBe( false );
				expect(
					registry.select( editorStore ).isPostAutosavingLocked()
				).toBe( false );
				expect( registry.select( noticesStore ).getNotices() ).toEqual(
					[]
				);
				expect(
					registry
						.select( editorStore )
						.getDistributedEditingSessionState()
				).toMatchObject( {
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason: reason,
					localUpdatesImportHasPostContent: false,
					localUpdatesImportHasAcceptedReviewApprovalProof: false,
				} );
			}
		);

		it( 'blocks fresh-review handoff import while preserving existing exportable local state', async () => {
			const registry = setupImportEditor();
			const payload = getDistributedEditingLocalUpdatesExportPayload( {
				currentPost: {
					id: postId,
					type: 'post',
				},
				editedPostContent: approvedPostContent,
				sessionState: {
					serverVersion: '12',
					clientBaseVersion: '7',
					pendingChangeCount: 1,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
					retrySaveReason:
						'unknown_retry_save_review_approval_proof_token',
				},
			} );

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					pendingChangeCount: 2,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalImportDistributedEditingLocalUpdates(
					JSON.stringify( payload )
				);

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
				hasPostContent: false,
				requiresFreshReview: true,
				reviewRequestActionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
				mutatesEditorContent: false,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				dispatchesNotice: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'original content' );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				pendingChangeCount: 2,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				localUpdatesImportReason:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
				localUpdatesImportRequiresFreshReview: true,
				localUpdatesImportReviewActionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
			} );
		} );
	} );

	describe( '__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase()', () => {
		it( 'prepares retry-submit handoff without fetching or saving', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content:
					'<!-- wp:paragraph --><p>Rebased</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async () => {
				apiFetchCallCount++;
				throw new Error( 'Retry handoff must not call apiFetch.' );
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: post.content,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					pendingChangeCount: 1,
					refetchedServerState: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
					readyToRetrySubmit: true,
					canExportLocalUpdates: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase();

			expect( apiFetchCallCount ).toBe( 0 );
			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
				reason: null,
				consumesReadyToRetrySubmit: true,
				submitsToServer: false,
				savesPost: false,
				mutatesPersistedPostContent: false,
				claimsSaved: false,
				sessionState: {
					readyToRetrySubmit: false,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
				},
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( post.content );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				readyToRetrySubmit: false,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
				retrySubmitHandoffReason: null,
				retrySubmitPrepared: true,
			} );
		} );

		it( 'blocks retry-submit handoff for unresolved local rebase conflicts', async () => {
			const registry = createRegistryWithStores();

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					pendingChangeCount: 1,
					refetchedServerState: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultReason: 'block_reordered',
					requiresManualConflictResolution: true,
					canExportLocalUpdates: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase();

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.BLOCKED,
				reason: DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS.MANUAL_CONFLICT_REQUIRED,
				consumesReadyToRetrySubmit: false,
				submitsToServer: false,
				savesPost: false,
				mutatesPersistedPostContent: false,
				claimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				localRebaseResultReason: 'block_reordered',
				readyToRetrySubmit: false,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.BLOCKED,
				retrySubmitHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS.MANUAL_CONFLICT_REQUIRED,
				retrySubmitPrepared: false,
			} );
		} );
	} );

	describe( '__experimentalRefreshDistributedEditingRetrySubmitProof()', () => {
		it( 'normalizes accepted retry-submit proof without saving', async () => {
			const proposedPostContentHash =
				'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content:
					'<!-- wp:paragraph --><p>Rebased</p><!-- /wp:paragraph -->',
				status: 'draft',
			};

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				);
				expect( data ).toEqual( {
					client_base_version: '7',
					rebased_from_version: '4',
					pending_change_count: 2,
					proposed_post_content_hash: proposedPostContentHash,
				} );
				expect( data.content ).toBeUndefined();

				return {
					result: 'retry_submit_accepted_for_future_save',
					retry_submit_accepted: true,
					save_path_required: true,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: post.content,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 2,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingRetrySubmitProof( {
						proposedPostContentHash,
					} )
			).resolves.toMatchObject( {
				result: 'retry_submit_accepted_for_future_save',
				retry_submit_accepted: true,
			} );

			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( post.content );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				reasonCode: null,
				pendingChangeCount: 2,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSavesPost: false,
				retrySubmitMutatesPostContent: false,
				retrySubmitCreatesRevision: false,
				retrySubmitClaimsSaved: false,
				canExportLocalUpdates: true,
			} );
		} );

		it( 'normalizes stale retry-submit proof errors before rethrowing', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			const error = {
				code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				message:
					'Distributed Editing rejected the retry because the server advanced again.',
				data: {
					status: 409,
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: '7',
					server_version: '8',
					pending_change_count: 1,
					remote_change_count: 1,
				},
			};

			apiFetch.setFetchHandler( async () => {
				throw error;
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					refetchedServerState: true,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingRetrySubmitProof()
			).rejects.toBe( error );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				clientBaseVersion: '7',
				serverVersion: '8',
				requiresServerStateRefetch: true,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
				retrySubmitPrepared: false,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED,
				retrySubmitProofReason:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				canExportLocalUpdates: true,
			} );
		} );
	} );

	describe( '__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof()', () => {
		it( 'prepares accepted retry-submit proof without fetching or saving', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content:
					'<!-- wp:paragraph --><p>Rebased</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async () => {
				apiFetchCallCount++;
				throw new Error(
					'Retry-submit save preparation must not call apiFetch.'
				);
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: post.content,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					pendingChangeCount: 2,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					canExportLocalUpdates: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof();

			expect( apiFetchCallCount ).toBe( 0 );
			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				reason: null,
				consumesAcceptedProof: true,
				submitsToServer: false,
				savesPost: false,
				mutatesPersistedPostContent: false,
				claimsSaved: false,
				sessionState: {
					hasPendingChanges: true,
					isAwaitingServerConfirmation: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSavePrepared: true,
					retrySubmitSaveReady: true,
					canExportLocalUpdates: true,
				},
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( post.content );
		} );

		it( 'blocks retry-submit save preparation when proof was denied', async () => {
			const registry = createRegistryWithStores();

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_PERMISSION_DENIED,
					retrySubmitProofReason:
						DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
					canExportLocalUpdates: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof();

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
				reason: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.PERMISSION_DENIED,
				consumesAcceptedProof: false,
				submitsToServer: false,
				savesPost: false,
				mutatesPersistedPostContent: false,
				claimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
				retrySubmitSaveReason:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.PERMISSION_DENIED,
				retrySubmitSavePrepared: false,
				retrySubmitSaveReady: false,
				canExportLocalUpdates: true,
			} );
		} );
	} );

	describe( '__experimentalSaveDistributedEditingRetryAfterProof()', () => {
		it( 'normalizes confirmed retry-save writes and clears pending state', async () => {
			const proposedPostContent =
				'<!-- wp:paragraph --><p>Rebased and saved</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: proposedPostContent,
				status: 'draft',
			};

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				);
				expect( data ).toEqual( {
					client_base_version: '7',
					accepted_proof_server_version: '7',
					rebased_from_version: '4',
					pending_change_count: 2,
					proposed_post_content: proposedPostContent,
					accepted_proof_saves_post: false,
					accepted_proof_mutates_post_content: false,
					accepted_proof_creates_revision: false,
					accepted_proof_claims_saved: false,
					proposed_post_content_hash: proposedPostContentHash,
				} );

				return {
					result: 'retry_save_applied',
					retry_save_accepted: true,
					previous_server_version: '7',
					server_version: '8',
					pending_change_count: 2,
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
					revision_created: true,
					created_revision_ids: [ 7002 ],
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: post.content,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 2,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSaveDistributedEditingRetryAfterProof( {
						proposedPostContentHash,
					} )
			).resolves.toMatchObject( {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			} );

			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( proposedPostContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				reasonCode: null,
				pendingChangeCount: 0,
				hasPendingChanges: false,
				isAwaitingServerConfirmation: false,
				retrySubmitSavePathRequired: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '8',
				retrySavePreviousServerVersion: '7',
				retrySaveSavesPost: true,
				retrySaveMutatesPostContent: true,
				retrySaveCreatesRevision: true,
				retrySaveClaimsSaved: true,
				retrySaveRevisionCreated: true,
				retrySaveCreatedRevisionIds: [ 7002 ],
				canExportLocalUpdates: false,
			} );
		} );

		it( 'passes accepted review approval proof into retry-save requests', async () => {
			const proposedPostContent =
				'<!-- wp:html --><script>approved</script><!-- /wp:html -->';
			const proposedPostContentHash =
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const candidatePostContentHash =
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
			const reviewedBlockHash =
				'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: proposedPostContent,
				status: 'draft',
			};

			apiFetch.setFetchHandler( async ( options ) => {
				expect( options.data ).toMatchObject( {
					client_base_version: '12',
					accepted_proof_server_version: '12',
					rebased_from_version: '9',
					pending_change_count: 1,
					proposed_post_content: proposedPostContent,
					proposed_post_content_hash: proposedPostContentHash,
					accepted_review_approval_proof: {
						type: 'unfiltered_html_retry_save_review_approval',
						status: 'approved_by_unfiltered_html_reviewer',
						reviewer_capability: 'unfiltered_html',
						review_scope: 'collaborative_post_content',
						server_version: '12',
						previous_server_version: '11',
						client_base_version: '12',
						accepted_proof_server_version: '12',
						proposed_post_content_hash: proposedPostContentHash,
						reviewed_proposed_content_hash: proposedPostContentHash,
						candidate_post_content_hash: candidatePostContentHash,
						reviewed_candidate_content_hash:
							candidatePostContentHash,
						reviewed_block_item_count: 1,
						raw_content_included: false,
						saves_post: false,
						mutates_post_content: false,
						creates_revision: false,
						claims_saved: false,
					},
				} );
				expect(
					options.data.accepted_review_approval_proof
						.reviewed_block_items
				).toEqual( [
					expect.objectContaining( {
						id: 'risk-html-approved',
						proposed_content_hash: reviewedBlockHash,
						review_status: 'approved_for_retry_save',
					} ),
				] );

				return {
					result: 'retry_save_applied',
					retry_save_accepted: true,
					previous_server_version: '12',
					server_version: '13',
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
					review_approval_proof_consumed: true,
					reviewed_block_item_count: 1,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: post.content,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '9',
					serverVersion: '12',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					retrySaveReviewApprovalProofStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
					retrySaveReviewApprovalAccepted: true,
					retrySaveReviewApprovalServerVersion: '12',
					retrySaveReviewApprovalPreviousServerVersion: '11',
					retrySaveReviewApprovalReviewerCapability:
						'unfiltered_html',
					retrySaveReviewApprovalScope: 'collaborative_post_content',
					retrySaveReviewApprovalProposedContentHash:
						proposedPostContentHash,
					retrySaveReviewApprovalCandidateContentHash:
						candidatePostContentHash,
					retrySaveReviewApprovalReviewedBlockItems: [
						{
							id: 'risk-html-approved',
							blockName: 'core/html',
							proposedContentHash: reviewedBlockHash,
							reviewedProposedContentHash: reviewedBlockHash,
							reviewStatus: 'approved_for_retry_save',
						},
					],
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSaveDistributedEditingRetryAfterProof( {
						proposedPostContentHash,
					} )
			).resolves.toMatchObject( {
				result: 'retry_save_applied',
				review_approval_proof_consumed: true,
				reviewed_block_item_count: 1,
			} );
		} );

		it( 'builds retry-save requests from edited page content and default proof fields', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original page.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:paragraph --><p>Edited page retry-save.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
			const page = {
				id: postId,
				type: 'page',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/pages/${ postId }/distributed-editing/retry-save`
					)
				);
				expect( data ).toEqual( {
					client_base_version: '12',
					accepted_proof_server_version: '12',
					rebased_from_version: '9',
					pending_change_count: 3,
					proposed_post_content: editedPostContent,
					accepted_proof_saves_post: false,
					accepted_proof_mutates_post_content: false,
					accepted_proof_creates_revision: false,
					accepted_proof_claims_saved: false,
					proposed_post_content_hash: proposedPostContentHash,
				} );

				return {
					result: 'retry_save_applied',
					retry_save_accepted: true,
					previous_server_version: '12',
					server_version: '13',
					pending_change_count: 3,
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
					revision_created: true,
					created_revision_ids: [ 7013 ],
				};
			} );

			const registry = createRegistryWithStores();

			registry.dispatch( coreStore ).addEntities( [
				{
					...postTypeConfig,
					name: 'page',
					baseURL: '/wp/v2/pages',
				},
			] );
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'root', 'postType', [
					{
						...postTypeEntity,
						slug: 'page',
						rest_base: 'pages',
					},
				] );
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'page', page );
			registry.dispatch( editorStore ).setupEditor( page, {
				content: originalPostContent,
			} );
			registry.dispatch( editorStore ).editPost( {
				content: editedPostContent,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '9',
					serverVersion: '12',
					pendingChangeCount: 3,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSaveDistributedEditingRetryAfterProof( {
						proposedPostContentHash,
					} )
			).resolves.toMatchObject( {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			} );

			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( editedPostContent );
		} );

		it( 'passes accepted proof persistence flags into retry-save requests', async () => {
			const proposedPostContent =
				'<!-- wp:paragraph --><p>Rejected proof flags.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: proposedPostContent,
				status: 'draft',
			};
			const error = {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
				message:
					'Distributed Editing rejected retry save because accepted proof claimed persistence.',
				data: {
					status: 409,
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
					detail: 'retry_save_proof_claimed_persistence',
					pending_change_count: 1,
				},
			};

			apiFetch.setFetchHandler( async ( options ) => {
				const { data } = options;

				expect( data ).toMatchObject( {
					client_base_version: '15',
					accepted_proof_server_version: '15',
					rebased_from_version: '14',
					pending_change_count: 1,
					proposed_post_content: proposedPostContent,
					accepted_proof_saves_post: true,
					accepted_proof_mutates_post_content: true,
					accepted_proof_creates_revision: true,
					accepted_proof_claims_saved: true,
				} );

				throw error;
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: proposedPostContent,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '14',
					serverVersion: '15',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					retrySubmitSavesPost: true,
					retrySubmitMutatesPostContent: true,
					retrySubmitCreatesRevision: true,
					retrySubmitClaimsSaved: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSaveDistributedEditingRetryAfterProof()
			).rejects.toBe( error );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
				canExportLocalUpdates: true,
			} );
		} );

		it( 'normalizes retry-save stale errors before rethrowing', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content:
					'<!-- wp:paragraph --><p>Rebased</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			const error = {
				code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				message:
					'Distributed Editing rejected retry save because the server advanced again.',
				data: {
					status: 409,
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: '7',
					server_version: '8',
					pending_change_count: 1,
				},
			};

			apiFetch.setFetchHandler( async () => {
				throw error;
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: post.content,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSaveDistributedEditingRetryAfterProof()
			).rejects.toBe( error );

			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( post.content );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				serverVersion: '8',
				pendingChangeCount: 1,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				requiresServerStateRefetch: true,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				canExportLocalUpdates: true,
			} );
		} );

		it( 'normalizes live retry-save unfiltered HTML review errors with reviewer metadata', async () => {
			const rawContentToken = 'live-review-raw-content-must-not-leak';
			const proposedContentHash =
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const filteredProposedContentHash =
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
			const candidateContentHash =
				'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
			const filteredCandidateContentHash =
				'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content:
					'<!-- wp:paragraph --><p>Rebased with script review</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			const error = {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				message:
					'Distributed Editing rejected the update because collaborative content changes require unfiltered HTML review.',
				data: {
					status: 403,
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
					detail: 'collaborative_unfiltered_html_review_required',
					pending_change_count: 2,
					server_version: '7',
					requires_unfiltered_html: true,
					unfiltered_html_allowed: false,
					authorship_review_required: true,
					content_capability_review_required: true,
					requires_reviewer_escalation: true,
					review_action: 'request_unfiltered_html_reviewer',
					review_required_capability: 'unfiltered_html',
					review_scope: 'collaborative_post_content',
					review_status: 'requires_reviewer_escalation',
					reviewer_capability: 'unfiltered_html',
					escalation_required: true,
					escalation_reason:
						'proposed_content_and_retry_save_candidate_would_change_by_kses',
					content_filter: 'wp_filter_post_kses',
					content_filter_context: 'content_save_pre',
					content_would_change_by_kses: true,
					proposed_content_hash: proposedContentHash,
					kses_filtered_proposed_content_hash:
						filteredProposedContentHash,
					candidate_content_hash: candidateContentHash,
					kses_filtered_candidate_content_hash:
						filteredCandidateContentHash,
					raw_content: rawContentToken,
					raw_content_included: false,
					review_contract: {
						status: 'requires_reviewer_escalation',
						type: 'unfiltered_html_content_capability_review',
						reviewer_capability: 'unfiltered_html',
						escalation_required: true,
						escalation_reason:
							'proposed_content_and_retry_save_candidate_would_change_by_kses',
						content_would_change_by_kses: true,
						proposed_content_would_change_by_kses: true,
						candidate_content_would_change_by_kses: true,
						raw_content: rawContentToken,
						raw_content_included: false,
					},
					recovery_actions: [
						'export_local_updates',
						'request_unfiltered_html_reviewer',
						'refetch_server_state',
					],
					requires_manual_conflict_resolution: true,
					can_export_local_updates: true,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
			};

			apiFetch.setFetchHandler( async () => {
				throw error;
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: post.content,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 2,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSaveDistributedEditingRetryAfterProof()
			).rejects.toBe( error );

			const sessionState = registry
				.select( editorStore )
				.getDistributedEditingSessionState();
			const retrySaveDescriptor = registry
				.select( editorStore )
				.getDistributedEditingNoticeDescriptors()
				.find(
					( descriptor ) =>
						descriptor.kind ===
						DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE
				);
			const retrySaveFlow = registry
				.select( editorStore )
				.getDistributedEditingRetrySaveFlowState();

			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( post.content );
			expect( sessionState ).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				serverVersion: '7',
				pendingChangeCount: 2,
				hasPendingChanges: true,
				requiresServerStateRefetch: true,
				requiresManualConflictResolution: true,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				retrySaveReviewStatus: 'requires_reviewer_escalation',
				retrySaveReviewAction: 'request_unfiltered_html_reviewer',
				retrySaveReviewRequiredCapability: 'unfiltered_html',
				retrySaveReviewerCapability: 'unfiltered_html',
				retrySaveReviewScope: 'collaborative_post_content',
				retrySaveReviewContractType:
					'unfiltered_html_content_capability_review',
				retrySaveRequiresReviewerEscalation: true,
				retrySaveReviewEscalationRequired: true,
				retrySaveReviewEscalationReason:
					'proposed_content_and_retry_save_candidate_would_change_by_kses',
				retrySaveReviewRequiresUnfilteredHtml: true,
				retrySaveReviewUnfilteredHtmlAllowed: false,
				retrySaveReviewAuthorshipRequired: true,
				retrySaveReviewContentCapabilityRequired: true,
				retrySaveReviewContentFilter: 'wp_filter_post_kses',
				retrySaveReviewContentFilterContext: 'content_save_pre',
				retrySaveReviewContentWouldChangeByKses: true,
				retrySaveReviewProposedContentWouldChangeByKses: true,
				retrySaveReviewCandidateContentWouldChangeByKses: true,
				retrySaveReviewProposedContentHash: proposedContentHash,
				retrySaveReviewFilteredProposedContentHash:
					filteredProposedContentHash,
				retrySaveReviewCandidateContentHash: candidateContentHash,
				retrySaveReviewFilteredCandidateContentHash:
					filteredCandidateContentHash,
				retrySaveReviewRawContentIncluded: false,
				retrySaveReviewRecoveryActions: [
					'export_local_updates',
					'request_unfiltered_html_reviewer',
					'refetch_server_state',
				],
				canExportLocalUpdates: true,
			} );
			expect( sessionState ).not.toHaveProperty( 'raw_content' );
			expect( JSON.stringify( sessionState ) ).not.toContain(
				rawContentToken
			);
			expect( retrySaveDescriptor ).toMatchObject( {
				retrySaveReviewAction: 'request_unfiltered_html_reviewer',
				retrySaveReviewRequiredCapability: 'unfiltered_html',
				retrySaveReviewerCapability: 'unfiltered_html',
				retrySaveReviewScope: 'collaborative_post_content',
				retrySaveReviewEscalationReason:
					'proposed_content_and_retry_save_candidate_would_change_by_kses',
				retrySaveReviewProposedContentHash: proposedContentHash,
				retrySaveReviewFilteredCandidateContentHash:
					filteredCandidateContentHash,
				retrySaveReviewRawContentIncluded: false,
			} );
			expect( JSON.stringify( retrySaveDescriptor ) ).not.toContain(
				rawContentToken
			);
			expect( retrySaveFlow ).toMatchObject( {
				hasProtectedLocalChanges: true,
				requiresServerStateRefetch: true,
				requiresManualConflictResolution: true,
				retrySaveReviewAction: 'request_unfiltered_html_reviewer',
				retrySaveReviewRequiredCapability: 'unfiltered_html',
				retrySaveReviewerCapability: 'unfiltered_html',
				retrySaveReviewRawContentIncluded: false,
			} );
			expect( JSON.stringify( retrySaveFlow ) ).not.toContain(
				rawContentToken
			);
		} );
	} );

	describe( 'savePost()', () => {
		it( 'routes experimental savePost through guarded retry-save when policy is ready', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:paragraph --><p>Rebased savePost.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'9999999999999999999999999999999999999999999999999999999999999999';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let retrySaveRequestData = null;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				) {
					retrySaveCalls++;
					retrySaveRequestData = data;

					return {
						result: 'retry_save_applied',
						retry_save_accepted: true,
						previous_server_version: '7',
						server_version: '8',
						pending_change_count: 2,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						revision_created: true,
						created_revision_ids: [ 7002 ],
					};
				}

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					normalSaveCalls++;
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: editedPostContent,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 2,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost( {
					__experimentalUseDistributedEditingRetrySave: true,
					proposedPostContentHash,
				} )
			).resolves.toMatchObject( {
				status: 'retry_save_submitted',
				callsRetrySaveAction: true,
				callsNormalSavePost: false,
				claimsSaved: true,
				hasRetrySaveSavedStateEvidence: true,
				sessionState: {
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					retrySaveServerVersion: '8',
					retrySaveSavesPost: true,
					retrySaveMutatesPostContent: true,
					retrySaveClaimsSaved: true,
					canExportLocalUpdates: false,
				},
				response: {
					result: 'retry_save_applied',
					retry_save_accepted: true,
				},
			} );

			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( retrySaveRequestData ).toEqual( {
				client_base_version: '7',
				accepted_proof_server_version: '7',
				rebased_from_version: '4',
				pending_change_count: 2,
				proposed_post_content: editedPostContent,
				accepted_proof_saves_post: false,
				accepted_proof_mutates_post_content: false,
				accepted_proof_creates_revision: false,
				accepted_proof_claims_saved: false,
				proposed_post_content_hash: proposedPostContentHash,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				canExportLocalUpdates: false,
			} );
		} );

		it( 'routes setting-enabled savePost to risky-block review before normal save', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:html --><script>risky()</script><!-- /wp:html -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			let apiCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				apiCalls++;
				const method = getMethod( options );
				const { path } = options;

				throw {
					code: 'unexpected_path',
					message: `Unexpected path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: editedPostContent,
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-added',
							blockClientId: 'block-risk-html-added',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
						},
					],
					riskyBlockReviewPendingCount: 1,
					riskyBlockReviewPrePublishPanelRequired: true,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'pre_publish_review_opened',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				opensPrePublishReview: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( apiCalls ).toBe( 0 );
			expect(
				registry.select( editorStore ).isPublishSidebarOpened()
			).toBe( true );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( editedPostContent );
		} );

		it( 'routes resolved risky-block savePost through review-approval proof before normal save', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:html --><script>risky()</script><!-- /wp:html -->';
			const proposedPostContentHash =
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const candidatePostContentHash =
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
			const approvedBlockHash =
				'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
			const filteredBlockHash =
				'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			let reviewApprovalCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let reviewApprovalData = null;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/review-approval`
					)
				) {
					reviewApprovalCalls++;
					reviewApprovalData = data;

					return {
						result: 'review_approval_accepted_for_retry_save',
						review_approval_accepted: true,
						server_version: '12',
						previous_server_version: '12',
						client_base_version: '12',
						accepted_proof_server_version: '12',
						pending_change_count: 2,
						reviewed_block_items: data.reviewed_block_items,
						reviewed_block_item_count: 1,
						block_review_status: 'approved_for_retry_save',
						proposed_post_content_hash: proposedPostContentHash,
						candidate_post_content_hash: candidatePostContentHash,
						can_export_local_updates: true,
						saves_post: false,
						mutates_post_content: false,
						creates_revision: false,
						claims_saved: false,
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				) {
					retrySaveCalls++;
				}

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					normalSaveCalls++;
				}

				throw {
					code: 'unexpected_path',
					message: `Unexpected path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: editedPostContent,
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					serverVersion: '12',
					pendingChangeCount: 2,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySaveReviewProposedContentHash: proposedPostContentHash,
					retrySaveReviewCandidateContentHash:
						candidatePostContentHash,
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_RESOLVED,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-approve',
							blockClientId: 'block-risk-html-approve',
							blockName: 'core/html',
							blockLabel: 'Custom HTML approval',
							proposedContentHash: approvedBlockHash,
							ksesFilteredContentHash: filteredBlockHash,
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
							rawContent: editedPostContent,
						},
						{
							id: 'risk-html-reject',
							blockClientId: 'block-risk-html-reject',
							blockName: 'core/html',
							blockLabel: 'Custom HTML rejection',
							proposedContentHash:
								'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
							ksesFilteredContentHash:
								'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
							rawContent: editedPostContent,
						},
					],
					riskyBlockReviewItemCount: 2,
					riskyBlockReviewPendingCount: 0,
					riskyBlockReviewApprovedCount: 1,
					riskyBlockReviewRejectedCount: 1,
					riskyBlockReviewPrePublishPanelRequired: false,
					riskyBlockReviewCanExportLocalUpdates: true,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'review_approval_proof_accepted',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsReviewApprovalProofEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );

			expect( reviewApprovalCalls ).toBe( 1 );
			expect( reviewApprovalData.reviewed_block_items ).toHaveLength( 1 );
			expect( retrySaveCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( editedPostContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveReviewApprovalAccepted: true,
				retrySaveReviewApprovalReviewedBlockItemCount: 1,
				canExportLocalUpdates: true,
			} );
		} );

		it( 'lets savePost continue normally when risky-block review routing is setting-disabled', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'draft',
			};
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					normalSaveCalls++;
					return { ...post, ...data };
				}

				if (
					method === 'GET' &&
					path.startsWith( '/wp/v2/types/post' )
				) {
					return {
						json: () => Promise.resolve( {} ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: false,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-added',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
						},
					],
					riskyBlockReviewPendingCount: 1,
					riskyBlockReviewPrePublishPanelRequired: true,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toBeUndefined();

			expect( normalSaveCalls ).toBe( 1 );
			expect(
				registry.select( editorStore ).isPublishSidebarOpened()
			).toBe( false );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'routes setting-enabled savePost through guarded retry-save after retry-submit save preparation', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:paragraph --><p>Setting gated savePost.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				) {
					retrySaveCalls++;

					return {
						result: 'retry_save_applied',
						retry_save_accepted: true,
						previous_server_version: '7',
						server_version: '8',
						pending_change_count: 1,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
					};
				}

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					normalSaveCalls++;
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: editedPostContent,
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof()
			).resolves.toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				consumesAcceptedProof: true,
				savesPost: false,
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'retry_save_submitted',
				callsRetrySaveAction: true,
				callsNormalSavePost: false,
			} );

			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySubmitSavePrepared: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				canExportLocalUpdates: false,
			} );
		} );

		it( 'uses normal savePost when settings disable the retry-save handoff even after save preparation', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'draft',
			};
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				) {
					retrySaveCalls++;
				}

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					normalSaveCalls++;
					return { ...post, ...data };
				}

				if (
					method === 'GET' &&
					path.startsWith( '/wp/v2/types/post' )
				) {
					return {
						json: () => Promise.resolve( {} ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: false,
					retrySaveHandoff: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof()
			).resolves.toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				consumesAcceptedProof: true,
			} );

			expect(
				registry
					.select( editorStore )
					.shouldUseDistributedEditingRetrySaveForSavePost()
			).toBe( false );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toBeUndefined();

			expect( retrySaveCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 1 );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				canExportLocalUpdates: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.NONE,
				retrySaveHandoffBlocksNormalSave: false,
			} );
		} );

		it( 'lets an explicit retry-save false option bypass the setting gate', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'draft',
			};
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				) {
					retrySaveCalls++;
				}

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					normalSaveCalls++;
					return { ...post, ...data };
				}

				if (
					method === 'GET' &&
					path.startsWith( '/wp/v2/types/post' )
				) {
					return {
						json: () => Promise.resolve( {} ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof()
			).resolves.toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				consumesAcceptedProof: true,
			} );

			expect(
				registry
					.select( editorStore )
					.shouldUseDistributedEditingRetrySaveForSavePost()
			).toBe( true );
			expect(
				registry
					.select( editorStore )
					.shouldUseDistributedEditingRetrySaveForSavePost( {
						__experimentalUseDistributedEditingRetrySave: false,
					} )
			).toBe( false );

			await expect(
				registry.dispatch( editorStore ).savePost( {
					__experimentalUseDistributedEditingRetrySave: false,
				} )
			).resolves.toBeUndefined();

			expect( retrySaveCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 1 );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				canExportLocalUpdates: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.NONE,
				retrySaveHandoffBlocksNormalSave: false,
			} );
		} );

		it( 'blocks setting-enabled savePost normal fallback when prepared retry-save work is already in flight', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			let apiCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				apiCalls++;
				const method = getMethod( options );
				const { path } = options;

				throw {
					code: 'unexpected_path',
					message: `Unexpected path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof()
			).resolves.toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				consumesAcceptedProof: true,
			} );

			registry
				.dispatch( editorStore )
				.updateDistributedEditingSessionState( {
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'retry_save_blocked',
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsRetrySaveAction: false,
				callsNormalSavePost: false,
			} );

			expect( apiCalls ).toBe( 0 );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect(
				registry.select( editorStore ).isPostAutosavingLocked()
			).toBe( false );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				mustOfferLocalCopy: true,
				canExportLocalUpdates: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
				retrySaveHandoffBlocksNormalSave: true,
			} );
		} );

		it( 'blocks setting-enabled savePost normal fallback when retry-save already confirmed protected local work', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			let apiCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				apiCalls++;
				const method = getMethod( options );
				const { path } = options;

				throw {
					code: 'unexpected_path',
					message: `Unexpected path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof()
			).resolves.toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				consumesAcceptedProof: true,
			} );

			registry
				.dispatch( editorStore )
				.updateDistributedEditingSessionState( {
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					retrySaveServerVersion: '8',
					retrySaveSavesPost: true,
					retrySaveMutatesPostContent: true,
					retrySaveClaimsSaved: true,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'retry_save_blocked',
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_ALREADY_CONFIRMED,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsRetrySaveAction: false,
				callsNormalSavePost: false,
			} );

			expect( apiCalls ).toBe( 0 );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				mustOfferLocalCopy: true,
				canExportLocalUpdates: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_ALREADY_CONFIRMED,
				retrySaveHandoffBlocksNormalSave: true,
			} );
		} );

		it( 'blocks experimental savePost normal fallback when retry-save policy protects local changes', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			let apiCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				apiCalls++;
				const method = getMethod( options );
				const { path } = options;

				throw {
					code: 'unexpected_path',
					message: `Unexpected path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost( {
					__experimentalUseDistributedEditingRetrySave: true,
				} )
			).resolves.toMatchObject( {
				status: 'retry_save_blocked',
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsRetrySaveAction: false,
				callsNormalSavePost: false,
			} );

			expect( apiCalls ).toBe( 0 );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				mustOfferLocalCopy: true,
				canExportLocalUpdates: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				retrySaveHandoffBlocksNormalSave: true,
			} );
		} );

		it( 'falls back to normal savePost when retry-save policy has no local changes to protect', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'draft',
			};
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				) {
					retrySaveCalls++;
				}

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					normalSaveCalls++;
					return { ...post, ...data };
				}

				if (
					method === 'GET' &&
					path.startsWith( '/wp/v2/types/post' )
				) {
					return {
						json: () => Promise.resolve( {} ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );

			await registry.dispatch( editorStore ).savePost( {
				__experimentalUseDistributedEditingRetrySave: true,
			} );

			expect( retrySaveCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 1 );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'saves a modified post', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'draft',
			};

			// Mock apiFetch response.
			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					return { ...post, ...data };
				} else if (
					// This URL is requested by the actions dispatched in this test.
					// They are safe to ignore and are only listed here to avoid triggeringan error.
					method === 'GET' &&
					path.startsWith( '/wp/v2/types/post' )
				) {
					return {
						json: () => Promise.resolve( {} ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			// Create registry.
			const registry = createRegistryWithStores();

			// Store post.
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );

			// Setup editor with post and initial edits.
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );

			// Check that the post is dirty.
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			// Save the post.
			await registry.dispatch( editorStore ).savePost();

			// Check the new content.
			const content = registry
				.select( editorStore )
				.getEditedPostContent();
			expect( content ).toBe( 'new bar' );

			// Check that the post is no longer dirty.
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);

			// Check that a success notice has been shown.
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{
					status: 'success',
					content: 'Draft saved.',
				},
			] );
		} );
	} );

	describe( 'autosave()', () => {
		it( 'autosaves a modified post', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'draft',
			};

			// Mock apiFetch response.
			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( '/wp/v2/users/me' )
				) {
					return { id: 1 };
				} else if (
					path.startsWith( `/wp/v2/posts/${ postId }/autosaves` )
				) {
					if ( method === 'POST' ) {
						return { ...post, ...data };
					} else if ( method === 'GET' ) {
						return [];
					}
				} else if ( method === 'GET' ) {
					// These URLs are requested by the actions dispatched in this test.
					// They are safe to ignore and are only listed here to avoid triggeringan error.
					if (
						path.startsWith( '/wp/v2/types/post' ) ||
						path.startsWith( `/wp/v2/posts/${ postId }` )
					) {
						return {
							json: () => Promise.resolve( {} ),
						};
					}
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			// Create registry.
			const registry = createRegistryWithStores();

			// Set current user.
			registry.dispatch( coreStore ).receiveCurrentUser( { id: 1 } );

			// Store post.
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );

			// Setup editor with post and initial edits.
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );

			// Check that the post is dirty.
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			// Autosave the post.
			await registry.dispatch( editorStore ).autosave();

			// Check the new content.
			const content = registry
				.select( editorStore )
				.getEditedPostContent();
			expect( content ).toBe( 'new bar' );

			// Check that the post is no longer dirty.
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);

			// Check that no notice has been shown on autosave.
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [] );
		} );
	} );

	describe( 'trashPost()', () => {
		it( 'trashes a post', async () => {
			const post = {
				id: postId,
				type: 'post',
				content: 'foo',
				status: 'publish',
			};

			let gotTrashed = false;

			// Mock apiFetch response.
			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if ( path.startsWith( `/wp/v2/posts/${ postId }` ) ) {
					if ( method === 'DELETE' ) {
						gotTrashed = true;
						return { ...post, status: 'trash' };
					} else if ( method === 'PUT' ) {
						return {
							...post,
							...( gotTrashed && { status: 'trash' } ),
							...data,
						};
					}
					// This URL is requested by the actions dispatched in this test.
					// They are safe to ignore and are only listed here to avoid triggeringan error.
				} else if (
					method === 'GET' &&
					path.startsWith( '/wp/v2/types/post' )
				) {
					return {
						json: () => Promise.resolve( {} ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ path }`,
				};
			} );

			// Create registry.
			const registry = createRegistryWithStores();

			// Store post.
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );

			// Setup editor with post.
			registry.dispatch( editorStore ).setupEditor( post );

			// Trash the post.
			await registry.dispatch( editorStore ).trashPost();

			// Check that there are no notices.
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{
					status: 'success',
					content: 'Post trashed.',
				},
			] );

			// Check the new status.
			const { status } = registry.select( editorStore ).getCurrentPost();
			expect( status ).toBe( 'trash' );
		} );

		it( 'sets deleting state', async () => {
			const post = {
				id: postId,
				type: 'post',
				content: 'foo',
				status: 'publish',
			};

			const dispatch = Object.assign( jest.fn(), {
				savePost: jest.fn(),
			} );
			const select = {
				getCurrentPostType: () => 'post',
				getCurrentPost: () => post,
			};
			const registry = {
				dispatch: () => ( {
					removeNotice: jest.fn(),
					createErrorNotice: jest.fn(),
				} ),
				resolveSelect: () => ( {
					getPostType: () => ( {
						rest_namespace: 'wp/v2',
						rest_base: 'posts',
					} ),
				} ),
			};

			apiFetch.setFetchHandler( async () => {
				return { ...post, status: 'trash' };
			} );

			await actions.trashPost()( { select, dispatch, registry } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REQUEST_POST_DELETE_START',
			} );
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REQUEST_POST_DELETE_FINISH',
			} );
		} );
	} );
} );

describe( 'Editor actions', () => {
	describe( 'setupEditor()', () => {
		it( 'should setup the editor', () => {
			// Create registry.
			const registry = createRegistryWithStores();

			registry
				.dispatch( editorStore )
				.setupEditor( { id: 10, type: 'post' } );
			expect( registry.select( editorStore ).getCurrentPostId() ).toBe(
				10
			);
		} );
	} );

	describe( 'lockPostSaving', () => {
		it( 'should return the LOCK_POST_SAVING action', () => {
			const result = actions.lockPostSaving( 'test' );
			expect( result ).toEqual( {
				type: 'LOCK_POST_SAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'unlockPostSaving', () => {
		it( 'should return the UNLOCK_POST_SAVING action', () => {
			const result = actions.unlockPostSaving( 'test' );
			expect( result ).toEqual( {
				type: 'UNLOCK_POST_SAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'lockPostAutosaving', () => {
		it( 'should return the LOCK_POST_AUTOSAVING action', () => {
			const result = actions.lockPostAutosaving( 'test' );
			expect( result ).toEqual( {
				type: 'LOCK_POST_AUTOSAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'unlockPostAutosaving', () => {
		it( 'should return the UNLOCK_POST_AUTOSAVING action', () => {
			const result = actions.unlockPostAutosaving( 'test' );
			expect( result ).toEqual( {
				type: 'UNLOCK_POST_AUTOSAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'enablePublishSidebar', () => {
		it( 'enables the publish sidebar', () => {
			const registry = createRegistryWithStores();

			// Starts off as `undefined` as a default hasn't been set.
			expect(
				registry.select( editorStore ).isPublishSidebarEnabled()
			).toBe( false );

			registry.dispatch( editorStore ).enablePublishSidebar();

			expect(
				registry.select( editorStore ).isPublishSidebarEnabled()
			).toBe( true );
		} );
	} );

	describe( 'disablePublishSidebar', () => {
		it( 'disables the publish sidebar', () => {
			const registry = createRegistryWithStores();

			// Enable it to start with so that can test it flipping from `true` to `false`.
			registry.dispatch( editorStore ).enablePublishSidebar();
			expect(
				registry.select( editorStore ).isPublishSidebarEnabled()
			).toBe( true );

			registry.dispatch( editorStore ).disablePublishSidebar();

			expect(
				registry.select( editorStore ).isPublishSidebarEnabled()
			).toBe( false );
		} );
	} );

	describe( 'toggleEditorPanelEnabled', () => {
		it( 'toggles panels to be enabled and not enabled', () => {
			const registry = createRegistryWithStores();

			// This will switch it off, since the default is on.
			registry
				.dispatch( editorStore )
				.toggleEditorPanelEnabled( 'control-panel' );

			expect(
				registry
					.select( editorStore )
					.isEditorPanelEnabled( 'control-panel' )
			).toBe( false );

			// Switch it on again.
			registry
				.dispatch( editorStore )
				.toggleEditorPanelEnabled( 'control-panel' );

			expect(
				registry
					.select( editorStore )
					.isEditorPanelEnabled( 'control-panel' )
			).toBe( true );
		} );
	} );

	describe( 'toggleEditorPanelOpened', () => {
		it( 'toggles panels open and closed', () => {
			const registry = createRegistryWithStores();

			// This will open it, since the default is closed.
			registry
				.dispatch( editorStore )
				.toggleEditorPanelOpened( 'control-panel' );

			expect(
				registry
					.select( editorStore )
					.isEditorPanelOpened( 'control-panel' )
			).toBe( true );

			// Close it.
			registry
				.dispatch( editorStore )
				.toggleEditorPanelOpened( 'control-panel' );

			expect(
				registry
					.select( editorStore )
					.isEditorPanelOpened( 'control-panel' )
			).toBe( false );
		} );
	} );

	describe( 'switchEditorMode', () => {
		let registry;

		beforeEach( () => {
			registry = createRegistryWithStores();
		} );

		it( 'to visual', () => {
			// Switch to text first, since the default is visual.
			registry.dispatch( editorStore ).switchEditorMode( 'text' );
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'text'
			);
			registry.dispatch( editorStore ).switchEditorMode( 'visual' );
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);
		} );

		it( 'to text', () => {
			// It defaults to visual.
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);
			// Add a selected client id and make sure it's there.
			const clientId = 'clientId_1';
			registry.dispatch( blockEditorStore ).selectionChange( clientId );
			expect(
				registry.select( blockEditorStore ).getSelectedBlockClientId()
			).toEqual( clientId );

			registry.dispatch( editorStore ).switchEditorMode( 'text' );
			expect(
				registry.select( blockEditorStore ).getSelectedBlockClientId()
			).toBeNull();
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'text'
			);
		} );
		it( 'should turn off distraction free mode when switching to code editor', () => {
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'distractionFree', true );
			registry.dispatch( editorStore ).switchEditorMode( 'text' );
			expect(
				registry
					.select( preferencesStore )
					.get( 'core', 'distractionFree' )
			).toBe( false );
		} );
	} );

	describe( 'toggleDistractionFree', () => {
		it( 'should properly update settings to prevent layout corruption when enabling distraction free mode', () => {
			const registry = createRegistryWithStores();

			// Enable everything that shouldn't be enabled in distraction free mode.
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'fixedToolbar', true );
			registry.dispatch( editorStore ).setIsListViewOpened( true );
			// Initial state is falsy.
			registry.dispatch( editorStore ).toggleDistractionFree();
			expect(
				registry
					.select( preferencesStore )
					.get( 'core', 'fixedToolbar' )
			).toBe( true );
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				false
			);
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				false
			);
			expect(
				registry
					.select( preferencesStore )
					.get( 'core', 'distractionFree' )
			).toBe( true );
		} );
	} );

	describe( 'setIsInserterOpened', () => {
		it( 'should open and close the inserter', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).setIsInserterOpened( true );

			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				true
			);

			registry.dispatch( editorStore ).setIsInserterOpened( false );

			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				false
			);
		} );

		it( 'the list view should close when the inserter is opened', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).setIsListViewOpened( true );
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				false
			);

			registry.dispatch( editorStore ).setIsInserterOpened( true );
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				false
			);
		} );
	} );

	describe( 'setIsListViewOpened', () => {
		it( 'should open and close the list view', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).setIsListViewOpened( true );

			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				true
			);

			registry.dispatch( editorStore ).setIsListViewOpened( false );

			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				false
			);
		} );

		it( 'the inserter should close when the list view is opened', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).setIsInserterOpened( true );
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				false
			);

			registry.dispatch( editorStore ).setIsListViewOpened( true );
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				false
			);
		} );
	} );
} );
