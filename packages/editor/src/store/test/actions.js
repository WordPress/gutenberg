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
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE,
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

	describe( 'savePost()', () => {
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
