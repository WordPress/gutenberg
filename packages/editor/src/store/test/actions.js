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
	DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES,
	DISTRIBUTED_EDITING_CONFLICT_COMPARISON_ACTION_STATUSES,
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES,
	DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES,
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
	DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES,
	DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES,
	DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES,
	DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS,
	DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES,
	DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES,
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES,
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES,
	DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE,
	getDistributedEditingLocalUpdatesExportPayload,
} from '../distributed-editing';
import { store as editorStore } from '..';

const postId = 44;

const isDistributedEditingPostSnapshotPath = ( path, id = postId ) => {
	if ( typeof path !== 'string' ) {
		return false;
	}

	const [ basePath, queryString = '' ] = path.split( '?' );

	if ( basePath !== `/wp/v2/posts/${ id }/distributed-editing` ) {
		return false;
	}

	if ( ! queryString ) {
		return true;
	}

	const params = new URLSearchParams( queryString );
	const allowedParams = new Set( [ '_locale', '_envelope' ] );

	return Array.from( params.keys() ).every(
		( key ) =>
			allowedParams.has( key ) &&
			( ( key === '_locale' && params.get( key ) === 'user' ) ||
				( key === '_envelope' && params.get( key ) === '1' ) )
	);
};

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

function createDeferred() {
	let resolve;
	let reject;
	const promise = new Promise( ( promiseResolve, promiseReject ) => {
		resolve = promiseResolve;
		reject = promiseReject;
	} );

	return { promise, reject, resolve };
}

function createDistributedEditingPresenceHeartbeatResponse( data = {} ) {
	return {
		result: 'presence_heartbeat_recorded',
		rest_route: 'post_presence_heartbeat',
		writes_presence: true,
		records_presence_heartbeat: true,
		heartbeat_interval_seconds: 30,
		document_state: {
			available: true,
			confirmedBaseVersion: data.confirmed_base_version,
			confirmedStateHash: data.confirmed_state_hash,
			hasPendingChanges: data.has_pending_changes,
			confirmedAtGmt: data.confirmed_at_gmt,
			presenceUpdatedAtGmt: '2026-05-20 12:03:30',
			authoritativeForSave: false,
			claimsSaved: false,
			exposesRawContent: false,
		},
		calls_save: false,
		mutates_post_content: false,
		changes_post_lock: false,
		claims_saved: false,
	};
}

function createDistributedEditingPresenceSnapshotResponse() {
	return {
		result: 'presence_roster_snapshot',
		rest_route: 'post_presence_roster',
		presence_roster: {
			status: 'active',
			freshness: 'current',
			visibleCount: 0,
			totalKnownCount: 0,
			claimsAbsence: false,
			entries: [],
		},
		read_only: true,
		calls_save: false,
		saves_post: false,
		mutates_post_content: false,
		changes_post_lock: false,
		records_presence_heartbeat: false,
		enables_repeated_client_refresh: false,
		claims_saved: false,
	};
}

describe( 'Post actions', () => {
	describe( '__experimentalAppendDistributedEditingActionTranscriptEvent()', () => {
		it( 'appends content-free lifecycle events without retaining unsafe entries', async () => {
			const registry = createRegistryWithStores();
			const dispatch = registry.dispatch( editorStore );

			let result =
				await dispatch.__experimentalAppendDistributedEditingActionTranscriptEvent(
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
					}
				);

			expect( result ).toMatchObject( {
				appended: true,
				droppedItemCount: 0,
				callsRest: false,
				callsSave: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			result =
				await dispatch.__experimentalAppendDistributedEditingActionTranscriptEvent(
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED,
						rawContent:
							'<!-- wp:paragraph --><p>Hidden transcript content</p><!-- /wp:paragraph -->',
					}
				);

			expect( result ).toMatchObject( {
				appended: false,
				droppedItemCount: 1,
				callsRest: false,
				callsSave: false,
				claimsSaved: false,
			} );

			result =
				await dispatch.__experimentalAppendDistributedEditingActionTranscriptEvent(
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
						reasonCode:
							DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					}
				);

			const sessionState = registry
				.select( editorStore )
				.getDistributedEditingSessionState();

			expect( result ).toMatchObject( {
				appended: true,
				droppedItemCount: 1,
				callsRest: false,
				callsSave: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( sessionState ).toMatchObject( {
				actionTranscriptItemCount: 2,
				actionTranscriptDroppedItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptExposesRawContent: false,
				actionTranscriptExposesProofInternals: false,
				actionTranscriptExposesActorIds: false,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
			expect( sessionState.actionTranscriptItems[ 1 ].reasonCode ).toBe(
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED
			);
			expect(
				JSON.stringify( sessionState.actionTranscriptItems )
			).not.toMatch( /Hidden transcript content|rawContent/ );
		} );
	} );

	describe( 'Distributed Editing history undo and redo', () => {
		it( 'makes Save actionable after undo clears stale confirmed retry-save evidence', async () => {
			const savedContent =
				'<!-- wp:paragraph --><p>Saved content.</p><!-- /wp:paragraph -->';
			const undoContent =
				'<!-- wp:paragraph --><p>Undo content.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'History post',
				content: savedContent,
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			const dispatch = registry.dispatch( editorStore );
			const select = registry.select( editorStore );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			dispatch.setupEditor( post, {
				content: savedContent,
			} );
			dispatch.updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
				},
			} );
			dispatch.setDistributedEditingSessionState( {
				clientBaseVersion: '7',
				serverVersion: '8',
				clientBaseContent: savedContent,
				pendingChangeCount: 0,
				hasPendingChanges: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '8',
				retrySavePreviousServerVersion: '7',
				retrySaveSavesPost: true,
				retrySaveMutatesPostContent: true,
				retrySaveCreatesRevision: true,
				retrySaveClaimsSaved: true,
				retrySaveRevisionCreated: true,
				retrySaveCreatedRevisionIds: [ 9001 ],
				historyUndoStack: [
					{
						beforeContent: undoContent,
						afterContent: savedContent,
						label: 'Session edits',
						source: 'session',
					},
				],
			} );

			expect(
				select.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_CONFIRMED,
				disabled: true,
				hasRetrySaveSavedStateEvidence: true,
			} );

			expect(
				await dispatch.__experimentalUndoDistributedEditingSessionChange()
			).toBe( true );

			expect( select.getEditedPostContent() ).toBe( undoContent );
			expect(
				select.hasDistributedEditingRetrySaveSavedStateEvidence()
			).toBe( false );
			expect( select.getDistributedEditingSessionState() ).toMatchObject(
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
					retrySaveAccepted: false,
					retrySaveServerVersion: null,
					retrySaveClaimsSaved: false,
					historyLastAction: 'undo',
				}
			);
			expect(
				select.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY,
				disabled: false,
				hasRetrySaveSavedStateEvidence: false,
				hasProtectedLocalChanges: true,
			} );
		} );

		it( 'keeps Save actionable after redo reapplies the local history change', async () => {
			const beforeContent =
				'<!-- wp:paragraph --><p>Before redo.</p><!-- /wp:paragraph -->';
			const afterContent =
				'<!-- wp:paragraph --><p>After redo.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'Redo post',
				content: beforeContent,
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			const dispatch = registry.dispatch( editorStore );
			const select = registry.select( editorStore );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			dispatch.setupEditor( post, {
				content: beforeContent,
			} );
			dispatch.updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
				},
			} );
			dispatch.setDistributedEditingSessionState( {
				clientBaseVersion: '8',
				serverVersion: '8',
				clientBaseContent: beforeContent,
				pendingChangeCount: 0,
				hasPendingChanges: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '8',
				retrySaveSavesPost: true,
				retrySaveMutatesPostContent: true,
				retrySaveClaimsSaved: true,
				historyRedoStack: [
					{
						beforeContent,
						afterContent,
						label: 'Session edits',
						source: 'redo',
					},
				],
			} );

			expect(
				await dispatch.__experimentalRedoDistributedEditingSessionChange()
			).toBe( true );

			expect( select.getEditedPostContent() ).toBe( afterContent );
			expect(
				select.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY,
				disabled: false,
				hasRetrySaveSavedStateEvidence: false,
				hasProtectedLocalChanges: true,
			} );
			expect( select.getDistributedEditingSessionState() ).toMatchObject(
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
					historyLastAction: 'redo',
				}
			);
		} );
	} );

	describe( '__experimentalRefreshDistributedEditingPresenceSnapshot()', () => {
		it( 'reads WordPress presence once and stores a sanitized roster without save side effects', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence post',
				content:
					'<!-- wp:paragraph --><p>Presence.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			let presenceCalls = 0;
			let normalSaveCalls = 0;
			let presenceRequestPath;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				) {
					presenceCalls++;
					presenceRequestPath = path;

					return {
						result: 'presence_roster_snapshot',
						rest_route: 'post_presence_roster',
						presence_roster: {
							status: 'recent',
							freshness: 'recent',
							visibleCount: 1,
							totalKnownCount: 1,
							claimsAbsence: false,
							entries: [
								{
									key: 'presence-mira',
									displayName: 'Mira',
									identityVisibility: 'named',
									relationship: 'other_user',
									freshness: 'recent',
									userId: 42,
									selection: { anchor: 9 },
									rawContent: 'hidden',
								},
							],
						},
						presence_read_contract: {
							source: 'de_rtc_presence_read_snapshot',
							route: `/wp/v2/posts/${ postId }/distributed-editing/presence`,
							cheap_host_polling_guidance: {
								suggested_polling_interval_seconds: 30,
								cheap_host_polling_interval_seconds: 120,
								repeated_client_refresh_enabled_now: false,
							},
						},
						read_only: true,
						calls_save: false,
						saves_post: false,
						mutates_post_content: false,
						changes_post_lock: false,
						records_presence_heartbeat: false,
						enables_repeated_client_refresh: false,
						claims_saved: false,
					};
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
			registry.dispatch( editorStore ).setupEditor( post );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingPresenceSnapshot( {
						sessionKey: 'turn-0198-current-tab',
					} )
			).resolves.toMatchObject( {
				result: 'presence_roster_snapshot',
				read_only: true,
				records_presence_heartbeat: false,
				enables_repeated_client_refresh: false,
			} );

			const sessionState = registry
				.select( editorStore )
				.getDistributedEditingSessionState();
			const presenceState = registry
				.select( editorStore )
				.getDistributedEditingPresenceRosterState();

			expect( presenceCalls ).toBe( 1 );
			const presenceRequestUrl = new URL(
				presenceRequestPath,
				'https://example.test'
			);
			expect( presenceRequestUrl.pathname ).toBe(
				`/wp/v2/posts/${ postId }/distributed-editing/presence`
			);
			expect( presenceRequestUrl.searchParams.get( 'session_key' ) ).toBe(
				'turn-0198-current-tab'
			);
			expect( normalSaveCalls ).toBe( 0 );
			expect( sessionState ).toMatchObject( {
				presenceRosterStatus:
					DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
				presenceRosterVisibleCount: 1,
				presenceRosterRefreshStatus:
					DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED,
				presenceRosterRefreshRequested: true,
				presenceRosterRefreshSucceeded: true,
				presenceRosterRefreshCallsRestEndpoint: true,
				presenceRosterRefreshCallsSave: false,
				presenceRosterRefreshMutatesEditorContent: false,
				presenceRosterRefreshChangesPostLock: false,
				presenceRosterRefreshRecordsPresenceHeartbeat: false,
				presenceRosterRefreshEnablesRepeatedClientRefresh: false,
				presenceRosterRefreshClaimsSaved: false,
				presenceRosterReadContractSource:
					'de_rtc_presence_read_snapshot',
				presenceRosterReadSuggestedPollingIntervalSeconds: 30,
				presenceRosterReadCheapHostPollingIntervalSeconds: 120,
				presenceRosterReadRepeatedClientRefreshEnabled: false,
			} );
			expect( presenceState ).toMatchObject( {
				status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
				visibleCount: 1,
				copy: {
					summary: 'Mira was here recently. Presence may be delayed.',
				},
				callsRestEndpoint: false,
				callsSave: false,
				changesPostLock: false,
				claimsSaved: false,
				exposesRawContent: false,
				exposesSelection: false,
				exposesUserIds: false,
			} );
			expect( JSON.stringify( sessionState ) ).not.toMatch(
				/userId|rawContent|anchor/
			);
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'records presence refresh gate failures without clearing protected local state', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence disabled post',
				content:
					'<!-- wp:paragraph --><p>Presence disabled.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};

			apiFetch.setFetchHandler( async ( options ) => {
				expect( getMethod( options ) ).toBe( 'GET' );
				expect( options.path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				);

				throw {
					code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
					message: 'Distributed Editing is not enabled.',
					data: {
						status: 403,
						detail: 'feature_disabled_for_post',
					},
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					presenceRosterEntries: [
						{
							key: 'presence-existing',
							displayName: 'Mira',
							freshness: 'recent',
						},
					],
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingPresenceSnapshot()
			).rejects.toMatchObject( {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
			} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				presenceRosterVisibleCount: 1,
				presenceRosterRefreshStatus:
					DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.FEATURE_DISABLED,
				presenceRosterRefreshRequested: true,
				presenceRosterRefreshFailed: true,
				presenceRosterRefreshCallsRestEndpoint: true,
				presenceRosterRefreshCallsSave: false,
				presenceRosterRefreshMutatesEditorContent: false,
				presenceRosterRefreshChangesPostLock: false,
				presenceRosterRefreshClaimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'merges late presence refresh responses into the latest protected local state', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Late presence refresh post',
				content:
					'<!-- wp:paragraph --><p>Late presence.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			const deferredPresence = createDeferred();
			const registry = createRegistryWithStores();

			apiFetch.setFetchHandler( ( options ) => {
				expect( getMethod( options ) ).toBe( 'GET' );
				expect( options.path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				);

				return deferredPresence.promise;
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );

			const refreshPromise = registry
				.dispatch( editorStore )
				.__experimentalRefreshDistributedEditingPresenceSnapshot();

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultReason: 'same_block_changed',
					requiresManualConflictResolution: true,
				} );

			deferredPresence.resolve( {
				result: 'presence_roster_snapshot',
				rest_route: 'post_presence_roster',
				presence_roster: {
					status: 'recent',
					entries: [
						{
							key: 'presence-mira',
							displayName: 'Mira',
							identityVisibility: 'named',
							relationship: 'other_user',
							freshness: 'recent',
						},
					],
				},
				presence_read_contract: {
					source: 'de_rtc_presence_read_snapshot',
					cheap_host_polling_guidance: {
						suggested_polling_interval_seconds: 30,
					},
				},
			} );

			await expect( refreshPromise ).resolves.toMatchObject( {
				result: 'presence_roster_snapshot',
			} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				requiresManualConflictResolution: true,
				presenceRosterStatus:
					DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
				presenceRosterRefreshStatus:
					DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED,
				presenceRosterRefreshCallsSave: false,
				presenceRosterRefreshClaimsSaved: false,
			} );
		} );
	} );

	describe( '__experimentalRefreshDistributedEditingPresenceStorageReadiness()', () => {
		it( 're-checks WordPress presence storage readiness once without write side effects', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence storage readiness post',
				content:
					'<!-- wp:paragraph --><p>Presence storage readiness.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			let readinessCalls = 0;
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/storage-readiness`
					)
				) {
					readinessCalls++;

					return {
						result: 'presence_storage_ready',
						rest_route: 'post_presence_storage_readiness',
						status: 'ready',
						tableExists: true,
						schemaCurrent: true,
						expectedStartupHeartbeatStatus: 'sent',
						setupRequired: false,
						setupAction: 'call_wp_de_rtc_install_presence_table',
						diagnosticOnly: true,
						contentFree: true,
						installsPresenceTable: false,
						automaticPerRequestInstall: false,
						writesPresence: false,
						recordsPresenceHeartbeat: false,
						startsPolling: false,
						callsSave: false,
						mutatesPostContent: false,
						mutatesPersistedPostContent: false,
						createsRevision: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						exposesRawContent: false,
						exposesUserIds: false,
						exposesCursorOffset: false,
						exposesSelection: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					};
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
			registry.dispatch( editorStore ).setupEditor( post );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingPresenceStorageReadiness()
			).resolves.toMatchObject( {
				result: 'presence_storage_ready',
				status: 'ready',
				contentFree: true,
				installsPresenceTable: false,
				recordsPresenceHeartbeat: false,
			} );

			const sessionState = registry
				.select( editorStore )
				.getDistributedEditingSessionState();

			expect( readinessCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( sessionState ).toMatchObject( {
				presenceStorageReadinessRecheckStatus:
					DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.READY,
				presenceStorageReadinessRecheckRequested: true,
				presenceStorageReadinessRecheckSucceeded: true,
				presenceStorageReadinessRecheckCallsRestEndpoint: true,
				presenceStorageReadinessRecheckInstallsPresenceTable: false,
				presenceStorageReadinessRecheckRecordsPresenceHeartbeat: false,
				presenceStorageReadinessRecheckWritesPresence: false,
				presenceStorageReadinessRecheckStartsPolling: false,
				presenceStorageReadinessRecheckCallsSave: false,
				presenceStorageReadinessRecheckMutatesEditorContent: false,
				presenceStorageReadinessRecheckChangesPostLock: false,
				presenceStorageReadinessRecheckClaimsAbsence: false,
				presenceStorageReadinessRecheckClaimsSaved: false,
				presenceStorageReadinessRecheckContentFree: true,
				presenceStorageReadinessRecheckExposesRawContent: false,
				presenceStorageReadinessRecheckExposesUserIds: false,
				presenceStorageReadinessRecheckExposesCursorOffset: false,
				presenceStorageReadinessRecheckExposesSelection: false,
				presenceStorageReadinessRecheckCorrectnessIndependentOfTransport: true,
				presenceStorageReadinessRecheckResult: {
					status: 'ready',
					tableExists: true,
					schemaCurrent: true,
					expectedStartupHeartbeatStatus: 'sent',
					setupRequired: false,
				},
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'records readiness re-check gate failures without clearing protected local state', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence storage readiness disabled post',
				content:
					'<!-- wp:paragraph --><p>Presence storage disabled.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};

			apiFetch.setFetchHandler( async ( options ) => {
				expect( getMethod( options ) ).toBe( 'GET' );
				expect( options.path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/presence/storage-readiness`
					)
				);

				throw {
					code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
					message: 'Distributed Editing is not enabled.',
					data: {
						status: 403,
						detail: 'feature_disabled_for_post',
					},
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingPresenceStorageReadiness()
			).rejects.toMatchObject( {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
			} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				presenceStorageReadinessRecheckStatus:
					DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.FEATURE_DISABLED,
				presenceStorageReadinessRecheckRequested: true,
				presenceStorageReadinessRecheckFailed: true,
				presenceStorageReadinessRecheckCallsRestEndpoint: true,
				presenceStorageReadinessRecheckCallsSave: false,
				presenceStorageReadinessRecheckMutatesEditorContent: false,
				presenceStorageReadinessRecheckChangesPostLock: false,
				presenceStorageReadinessRecheckClaimsSaved: false,
				presenceStorageReadinessRecheckContentFree: true,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );
	} );

	describe( '__experimentalConfigureDistributedEditingPresenceRepeatedRefreshRuntime()', () => {
		it( 'keeps repeated presence cadence disabled by default without network or save side effects', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence cadence default-off post',
				content:
					'<!-- wp:paragraph --><p>Presence cadence.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			let apiCalled = false;

			apiFetch.setFetchHandler( async () => {
				apiCalled = true;
				throw {
					code: 'unexpected_path',
				};
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalConfigureDistributedEditingPresenceRepeatedRefreshRuntime(
					{
						hostProfile: 'cheap_shared_host',
						standardPollingIntervalSeconds: 30,
						cheapHostPollingIntervalSeconds: 120,
						heartbeatIntervalSeconds: 120,
					}
				);

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.DISABLED_BY_DEFAULT,
				localConnectionState:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DISABLED,
				selectedIntervalSeconds: 120,
				selectedHeartbeatIntervalSeconds: 120,
				schedulesNextRefresh: false,
				schedulesNextHeartbeat: false,
				callsPresenceReadEndpointNow: false,
				callsHeartbeatEndpointNow: false,
				recordsPresenceHeartbeatNow: false,
				writesHeartbeatNow: false,
				startsPollingImmediately: false,
				dispatchesNotice: false,
				callsSave: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsAbsence: false,
				claimsSaved: false,
				exposesRawContent: false,
				rawSessionKeyIncluded: false,
			} );
			expect( apiCalled ).toBe( false );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				presenceRepeatedRefreshRuntimeStatus:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.DISABLED_BY_DEFAULT,
				presenceRepeatedRefreshRuntimeEnabledByDefault: false,
				presenceRepeatedRefreshExplicitOptIn: false,
				presenceRepeatedRefreshSchedulesNextRefresh: false,
				presenceRepeatedRefreshCallsPresenceReadEndpointNow: false,
				presenceRepeatedRefreshCallsSave: false,
				presenceRepeatedRefreshChangesPostLock: false,
				presenceRepeatedRefreshClaimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'records an explicit cheap-host cadence as scheduled without starting timers', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence cadence opt-in post',
				content:
					'<!-- wp:paragraph --><p>Presence cadence opt in.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			let apiCalled = false;

			apiFetch.setFetchHandler( async () => {
				apiCalled = true;
				throw {
					code: 'unexpected_path',
				};
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					pendingChangeCount: 1,
					canExportLocalUpdates: true,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalConfigureDistributedEditingPresenceRepeatedRefreshRuntime(
					{
						explicitOptIn: true,
						hostProfile: 'cheap_shared_host',
						standardPollingIntervalSeconds: 30,
						cheapHostPollingIntervalSeconds: 120,
						minimumPollingIntervalSeconds: 60,
						heartbeatIntervalSeconds: 120,
					}
				);

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED,
				localConnectionState:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.CONNECTED,
				selectedIntervalSeconds: 120,
				selectedHeartbeatIntervalSeconds: 120,
				schedulesNextRefresh: true,
				schedulesNextHeartbeat: true,
				callsPresenceReadEndpointNow: false,
				callsHeartbeatEndpointNow: false,
				recordsPresenceHeartbeatNow: false,
				writesHeartbeatNow: false,
				startsPollingImmediately: false,
				callsSave: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( result.sessionState ).toMatchObject( {
				pendingChangeCount: 1,
				canExportLocalUpdates: true,
			} );
			expect( apiCalled ).toBe( false );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'records degraded transport as a paused cadence state', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence cadence degraded post',
				content:
					'<!-- wp:paragraph --><p>Presence cadence degraded.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalConfigureDistributedEditingPresenceRepeatedRefreshRuntime(
					{
						explicitOptIn: true,
						serverContact: 'degraded',
						standardPollingIntervalSeconds: 30,
						heartbeatIntervalSeconds: 120,
					}
				);

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT,
				localConnectionState:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DEGRADED,
				selectedIntervalSeconds: 30,
				selectedHeartbeatIntervalSeconds: 120,
				schedulesNextRefresh: false,
				schedulesNextHeartbeat: false,
				callsPresenceReadEndpointNow: false,
				callsHeartbeatEndpointNow: false,
				startsPollingImmediately: false,
				callsSave: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );
	} );

	describe( '__experimentalConfigureDistributedEditingPresenceStartupPolicy()', () => {
		it( 'records slow cheap-host startup policy without endpoint, save, or lock side effects', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence startup policy post',
				content:
					'<!-- wp:paragraph --><p>Presence startup policy.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			let apiCalled = false;

			apiFetch.setFetchHandler( async () => {
				apiCalled = true;
				throw {
					code: 'unexpected_path',
				};
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalConfigureDistributedEditingPresenceStartupPolicy(
					{
						allowAutomaticInitialHeartbeat: true,
						allowSlowAutomaticInitialHeartbeat: true,
						hostProfile: 'cheap_shared_host',
						standardInitialHeartbeatDelaySeconds: 10,
						cheapHostInitialHeartbeatDelaySeconds: 120,
						minimumInitialHeartbeatDelaySeconds: 60,
					}
				);

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED,
				reason: 'cheap_host_slow_startup_allowed',
				maySendInitialHeartbeatAutomatically: true,
				slowAutomaticHeartbeatAllowed: true,
				selectedInitialHeartbeatDelaySeconds: 120,
				callsHeartbeatEndpointNow: false,
				recordsPresenceHeartbeatNow: false,
				writesPresenceNow: false,
				startsPollingNow: false,
				startsTimerNow: false,
				dispatchesNotice: false,
				callsSave: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsAbsence: false,
				claimsSaved: false,
				exposesRawContent: false,
				rawSessionKeyIncluded: false,
			} );
			expect( apiCalled ).toBe( false );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				presenceStartupPolicyStatus:
					DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED,
				presenceStartupPolicySelectedInitialHeartbeatDelaySeconds: 120,
				presenceStartupPolicyCallsHeartbeatEndpointNow: false,
				presenceStartupPolicyStartsTimerNow: false,
				presenceStartupPolicyCallsSave: false,
				presenceStartupPolicyChangesPostLock: false,
				presenceStartupPolicyClaimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );
	} );

	describe( '__experimentalSendDistributedEditingPresenceHeartbeat()', () => {
		it( 'sends one gated heartbeat and stores local status without save side effects', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence heartbeat post',
				content:
					'<!-- wp:paragraph --><p>Presence heartbeat.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			let heartbeatCalls = 0;
			let normalSaveCalls = 0;
			let heartbeatRequestData;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					heartbeatCalls++;
					heartbeatRequestData = data;

					return {
						result: 'presence_heartbeat_recorded',
						rest_route: 'post_presence_heartbeat',
						writes_presence: true,
						records_presence_heartbeat: true,
						heartbeat_interval_seconds: 30,
						calls_save: false,
						mutates_post_content: false,
						changes_post_lock: false,
						claims_saved: false,
					};
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
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSendDistributedEditingPresenceHeartbeat( {
						sessionKey: 'turn-0173-session',
					} )
			).resolves.toMatchObject( {
				result: 'presence_heartbeat_recorded',
				writes_presence: true,
				records_presence_heartbeat: true,
			} );

			expect( heartbeatCalls ).toBe( 1 );
			expect( heartbeatRequestData ).toEqual( {
				session_key: 'turn-0173-session',
			} );
			expect( heartbeatRequestData ).not.toHaveProperty(
				'proposed_post_content'
			);
			expect( heartbeatRequestData ).not.toHaveProperty(
				'cursor_offset'
			);
			expect( heartbeatRequestData ).not.toHaveProperty( 'selection' );
			expect( normalSaveCalls ).toBe( 0 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				presenceHeartbeatStatus:
					DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT,
				presenceHeartbeatRequested: true,
				presenceHeartbeatSucceeded: true,
				presenceHeartbeatCallsRestEndpoint: true,
				presenceHeartbeatRecordsPresenceHeartbeat: true,
				presenceHeartbeatWritesPresence: true,
				presenceHeartbeatCallsSave: false,
				presenceHeartbeatMutatesEditorContent: false,
				presenceHeartbeatChangesPostLock: false,
				presenceHeartbeatClaimsSaved: false,
				presenceHeartbeatRawSessionKeyIncluded: false,
				presenceHeartbeatMarksLocalEditorCurrent: true,
				presenceHeartbeatMarksLocalEditorDelayed: false,
				presenceHeartbeatLocalRosterEntryVisible: true,
				presenceHeartbeatLocalRosterEntryFreshness: 'current',
				presenceHeartbeatSuggestedIntervalSeconds: 30,
				presenceRosterStatus: 'active',
				presenceRosterVisibleCount: 1,
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						relationship: 'current_user_current_tab',
						identityVisibility: 'self',
						freshness: 'current',
						exposesRawContent: false,
						exposesSelection: false,
						exposesCursorOffset: false,
						exposesUserId: false,
					},
				],
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'reports compact document state in a heartbeat without expanding save authority', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence document state heartbeat post',
				content:
					'<!-- wp:paragraph --><p>Presence document state.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			let heartbeatRequestData;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					heartbeatRequestData = data;

					return {
						result: 'presence_heartbeat_recorded',
						rest_route: 'post_presence_heartbeat',
						writes_presence: true,
						records_presence_heartbeat: true,
						heartbeat_interval_seconds: 30,
						document_state: {
							available: true,
							confirmedBaseVersion: data.confirmed_base_version,
							confirmedStateHash: data.confirmed_state_hash,
							hasPendingChanges: data.has_pending_changes,
							confirmedAtGmt: data.confirmed_at_gmt,
							presenceUpdatedAtGmt: '2026-05-20 12:00:30',
							authoritativeForSave: false,
							claimsSaved: false,
							exposesRawContent: false,
						},
						calls_save: false,
						mutates_post_content: false,
						changes_post_lock: false,
						claims_saved: false,
					};
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
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					serverVersion: '12',
					distributedEditingPostStateHash:
						'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
					pendingChangeCount: 1,
					hasPendingChanges: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSendDistributedEditingPresenceHeartbeat( {
						sessionKey: 'turn-0173-session',
					} )
			).resolves.toMatchObject( {
				result: 'presence_heartbeat_recorded',
				writes_presence: true,
				records_presence_heartbeat: true,
			} );

			expect( heartbeatRequestData ).toMatchObject( {
				session_key: 'turn-0173-session',
				confirmed_base_version: '12',
				confirmed_state_hash:
					'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
				has_pending_changes: true,
				confirmed_at_gmt: expect.any( String ),
			} );
			expect( heartbeatRequestData ).not.toHaveProperty(
				'proposed_post_content'
			);
			expect( heartbeatRequestData ).not.toHaveProperty(
				'cursor_offset'
			);
			expect( heartbeatRequestData ).not.toHaveProperty( 'selection' );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				presenceDocumentStateConfirmedBaseVersion: '12',
				presenceDocumentStateConfirmedStateHash:
					'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
				presenceHeartbeatCallsSave: false,
				presenceHeartbeatClaimsSaved: false,
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						documentState: {
							available: true,
							confirmedBaseVersion: '12',
							confirmedStateHash:
								'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
							hasPendingChanges: true,
							authoritativeForSave: false,
							claimsSaved: false,
							exposesRawContent: false,
						},
					},
				],
			} );
		} );

		it( 'does not report pending changes for editor dirty state when content still matches the base', async () => {
			const baseContent =
				'<!-- wp:paragraph --><p>Presence clean base.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence clean dirty flag post',
				content: baseContent,
				status: 'draft',
			};
			let heartbeatRequestData;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					heartbeatRequestData = data;

					return {
						result: 'presence_heartbeat_recorded',
						rest_route: 'post_presence_heartbeat',
						writes_presence: true,
						records_presence_heartbeat: true,
						heartbeat_interval_seconds: 30,
						document_state: {
							available: true,
							confirmedBaseVersion: data.confirmed_base_version,
							confirmedStateHash: data.confirmed_state_hash,
							hasPendingChanges: data.has_pending_changes,
							confirmedAtGmt: data.confirmed_at_gmt,
							presenceUpdatedAtGmt: '2026-05-20 12:00:45',
							authoritativeForSave: false,
							claimsSaved: false,
							exposesRawContent: false,
						},
						calls_save: false,
						mutates_post_content: false,
						changes_post_lock: false,
						claims_saved: false,
					};
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
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '12',
					serverVersion: '12',
					clientBaseContent: baseContent,
					distributedEditingPostStateHash:
						'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
					pendingChangeCount: 0,
					hasPendingChanges: false,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSendDistributedEditingPresenceHeartbeat( {
						isDirty: true,
						localContent: baseContent,
						sessionKey: 'turn-0173-clean-dirty-session',
					} )
			).resolves.toMatchObject( {
				result: 'presence_heartbeat_recorded',
				writes_presence: true,
				records_presence_heartbeat: true,
			} );

			expect( heartbeatRequestData ).toMatchObject( {
				session_key: 'turn-0173-clean-dirty-session',
				confirmed_base_version: '12',
				confirmed_state_hash:
					'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
				has_pending_changes: false,
				confirmed_at_gmt: expect.any( String ),
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				presenceDocumentStateConfirmedBaseVersion: '12',
				presenceDocumentStateConfirmedStateHash:
					'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
				presenceDocumentStatePublishedKey:
					'12:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee:clean:clean',
				presenceHeartbeatClaimsSaved: false,
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						documentState: {
							hasPendingChanges: false,
							claimsSaved: false,
							exposesRawContent: false,
						},
					},
				],
			} );
		} );

		it( 'does not report a newer server hash as confirmed while the local base is stale', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence stale document state heartbeat post',
				content:
					'<!-- wp:paragraph --><p>Presence stale document state.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			let heartbeatRequestData;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					heartbeatRequestData = data;

					return {
						result: 'presence_heartbeat_recorded',
						rest_route: 'post_presence_heartbeat',
						writes_presence: true,
						records_presence_heartbeat: true,
						heartbeat_interval_seconds: 30,
						document_state: {
							available: true,
							confirmedBaseVersion: data.confirmed_base_version,
							confirmedStateHash: data.confirmed_state_hash,
							hasPendingChanges: data.has_pending_changes,
							confirmedAtGmt: data.confirmed_at_gmt,
							presenceUpdatedAtGmt: '2026-05-20 12:01:30',
							authoritativeForSave: false,
							claimsSaved: false,
							exposesRawContent: false,
						},
						calls_save: false,
						mutates_post_content: false,
						changes_post_lock: false,
						claims_saved: false,
					};
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
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					distributedEditingPostStateHash:
						'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
					pendingChangeCount: 1,
					hasPendingChanges: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSendDistributedEditingPresenceHeartbeat( {
						sessionKey: 'turn-0173-stale-session',
					} )
			).resolves.toMatchObject( {
				result: 'presence_heartbeat_recorded',
				writes_presence: true,
				records_presence_heartbeat: true,
			} );

			expect( heartbeatRequestData ).toMatchObject( {
				session_key: 'turn-0173-stale-session',
				confirmed_base_version: '4',
				has_pending_changes: true,
				confirmed_at_gmt: expect.any( String ),
			} );
			expect( heartbeatRequestData ).not.toHaveProperty(
				'confirmed_state_hash'
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				presenceDocumentStateConfirmedBaseVersion: '4',
				presenceDocumentStateConfirmedStateHash: null,
				presenceDocumentStatePublishedKey: '4::pending:clean',
				presenceHeartbeatCallsSave: false,
				presenceHeartbeatClaimsSaved: false,
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						documentState: {
							available: true,
							confirmedBaseVersion: '4',
							confirmedStateHash: null,
							hasPendingChanges: true,
							authoritativeForSave: false,
							claimsSaved: false,
							exposesRawContent: false,
						},
					},
				],
			} );
		} );

		it( 'skips the REST call when Distributed Editing is disabled for the editor', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence heartbeat disabled post',
				content:
					'<!-- wp:paragraph --><p>Presence disabled.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			let apiCalled = false;
			const registry = createRegistryWithStores();

			apiFetch.setFetchHandler( async () => {
				apiCalled = true;
				throw {
					code: 'unexpected_path',
				};
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: false,
				},
			} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSendDistributedEditingPresenceHeartbeat( {
						sessionKey: 'turn-0173-session',
					} )
			).resolves.toMatchObject( {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
				calls_rest_endpoint: false,
			} );

			expect( apiCalled ).toBe( false );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				presenceHeartbeatStatus:
					DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.FEATURE_DISABLED,
				presenceHeartbeatRequested: true,
				presenceHeartbeatFailed: true,
				presenceHeartbeatCallsRestEndpoint: false,
				presenceHeartbeatRecordsPresenceHeartbeat: false,
				presenceHeartbeatWritesPresence: false,
				presenceHeartbeatCallsSave: false,
				presenceHeartbeatChangesPostLock: false,
				presenceHeartbeatClaimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'records heartbeat degradation without clearing protected local state', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Presence heartbeat degraded post',
				content:
					'<!-- wp:paragraph --><p>Presence degraded.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			const registry = createRegistryWithStores();

			apiFetch.setFetchHandler( async ( options ) => {
				expect( getMethod( options ) ).toBe( 'POST' );
				expect( options.path ).toMatch(
					new RegExp(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				);

				throw {
					code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE,
					message: 'Presence storage is unavailable.',
					data: {
						status: 503,
						result: 'presence_storage_unavailable',
						records_presence_heartbeat: false,
						writes_presence: false,
					},
				};
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					presenceRosterEntries: [
						{
							key: 'presence-local-heartbeat-current-tab',
							identityVisibility: 'self',
							relationship: 'current_user_current_tab',
							freshness: 'current',
						},
					],
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSendDistributedEditingPresenceHeartbeat( {
						sessionKey: 'turn-0173-session',
					} )
			).rejects.toMatchObject( {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE,
			} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				presenceHeartbeatStatus:
					DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.STORAGE_UNAVAILABLE,
				presenceHeartbeatRequested: true,
				presenceHeartbeatFailed: true,
				presenceHeartbeatCallsRestEndpoint: true,
				presenceHeartbeatRecordsPresenceHeartbeat: false,
				presenceHeartbeatWritesPresence: false,
				presenceHeartbeatCallsSave: false,
				presenceHeartbeatMutatesEditorContent: false,
				presenceHeartbeatChangesPostLock: false,
				presenceHeartbeatClaimsSaved: false,
				presenceHeartbeatMarksLocalEditorCurrent: false,
				presenceHeartbeatMarksLocalEditorDelayed: true,
				presenceHeartbeatLocalRosterEntryVisible: true,
				presenceHeartbeatLocalRosterEntryFreshness: 'recent',
				presenceRosterStatus: 'recent',
				presenceRosterVisibleCount: 1,
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						relationship: 'current_user_current_tab',
						freshness: 'recent',
						exposesRawContent: false,
						exposesSelection: false,
						exposesCursorOffset: false,
						exposesUserId: false,
					},
				],
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'merges late heartbeat responses into the latest protected local state', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'Late heartbeat post',
				content:
					'<!-- wp:paragraph --><p>Late heartbeat.</p><!-- /wp:paragraph -->',
				status: 'draft',
			};
			const deferredHeartbeat = createDeferred();
			const registry = createRegistryWithStores();

			apiFetch.setFetchHandler( ( options ) => {
				expect( getMethod( options ) ).toBe( 'POST' );
				expect( options.path ).toMatch(
					new RegExp(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				);

				return deferredHeartbeat.promise;
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );

			const heartbeatPromise = registry
				.dispatch( editorStore )
				.__experimentalSendDistributedEditingPresenceHeartbeat( {
					sessionKey: 'late-heartbeat-session',
				} );

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultReason: 'same_block_changed',
					requiresManualConflictResolution: true,
				} );

			deferredHeartbeat.resolve( {
				result: 'presence_heartbeat_recorded',
				rest_route: 'post_presence_heartbeat',
				writes_presence: true,
				records_presence_heartbeat: true,
				heartbeat_interval_seconds: 30,
			} );

			await expect( heartbeatPromise ).resolves.toMatchObject( {
				result: 'presence_heartbeat_recorded',
			} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				requiresManualConflictResolution: true,
				presenceHeartbeatStatus:
					DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT,
				presenceHeartbeatRequested: true,
				presenceHeartbeatCallsSave: false,
				presenceHeartbeatClaimsSaved: false,
				presenceRosterVisibleCount: 1,
			} );
		} );
	} );

	describe( '__experimentalOpenDistributedEditingRiskyBlockReview()', () => {
		it( 'opens the pre-publish sidebar when risky-block policy requires review', async () => {
			const registry = createRegistryWithStores();
			const originalBody = document.body.innerHTML;
			const reviewPanel = document.createElement( 'div' );

			reviewPanel.setAttribute(
				'data-distributed-editing-risky-block-review-panel',
				''
			);
			reviewPanel.scrollIntoView = jest.fn();
			document.body.appendChild( reviewPanel );

			try {
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
					reviewPanelFocusRequested: true,
					reviewPanelFocusedImmediately: true,
					reviewPanel: 'distributed_editing_risky_block_review',
					actionTranscriptItemCount: 1,
					actionTranscriptLatestEventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REVIEW_REQUIRED,
					actionTranscriptEntriesRedacted: true,
					actionTranscriptCallsSave: false,
					actionTranscriptClaimsSaved: false,
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
				expect(
					registry
						.select( editorStore )
						.getDistributedEditingSessionState()
				).toMatchObject( {
					actionTranscriptItemCount: 1,
					actionTranscriptLatestEventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REVIEW_REQUIRED,
					actionTranscriptEntriesRedacted: true,
					actionTranscriptCallsSave: false,
					actionTranscriptClaimsSaved: false,
				} );
				expect( reviewPanel.scrollIntoView ).toHaveBeenCalled();
				expect( reviewPanel ).toHaveAttribute( 'tabindex', '-1' );
				expect( reviewPanel ).toHaveFocus();
			} finally {
				document.body.innerHTML = originalBody;
			}
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

	describe( '__experimentalMaybeHandleDistributedEditingSaveButtonClick()', () => {
		it( 'refetches server state from a Save button click without saving when stale state requires refetch', async () => {
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
					raw: 'remote bar from Save click',
				},
				distributed_editing: {
					server_version: '27',
				},
			};
			let refetchCalls = 0;
			let presenceHeartbeatCalls = 0;
			let presenceSnapshotCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				if ( isDistributedEditingPostSnapshotPath( path ) ) {
					refetchCalls++;
					expect( method ).toBe( 'GET' );
					expect( data ).toBeUndefined();

					return serverResponse;
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					presenceHeartbeatCalls++;
					return createDistributedEditingPresenceHeartbeatResponse(
						data
					);
				}

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				) {
					presenceSnapshotCalls++;
					return createDistributedEditingPresenceSnapshotResponse();
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
				content: 'local bar from Save click',
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '25',
					serverVersion: '26',
					pendingChangeCount: 1,
					remoteChangeCount: 1,
					requiresServerStateRefetch: true,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'server_state_refetched_before_save',
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				requiresRiskyBlockReviewServerStateRefetch: false,
				callsServerStateRefetchEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( refetchCalls ).toBe( 1 );
			expect( presenceHeartbeatCalls ).toBe( 1 );
			expect( presenceSnapshotCalls ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'local bar from Save click' );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				serverVersion: '27',
				refetchedServerContent: 'remote bar from Save click',
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				canExportLocalUpdates: true,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'clears a risky-review-specific refetch gate after a Save button refetch without saving', async () => {
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
					raw: 'remote bar after risky review refetch',
				},
				distributed_editing: {
					server_version: '28',
				},
			};
			let refetchCalls = 0;
			let presenceHeartbeatCalls = 0;
			let presenceSnapshotCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				if ( isDistributedEditingPostSnapshotPath( path ) ) {
					refetchCalls++;
					expect( method ).toBe( 'GET' );
					expect( data ).toBeUndefined();

					return serverResponse;
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					presenceHeartbeatCalls++;
					return createDistributedEditingPresenceHeartbeatResponse(
						data
					);
				}

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				) {
					presenceSnapshotCalls++;
					return createDistributedEditingPresenceSnapshotResponse();
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
				content: 'local risky bar from Save click',
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '25',
					serverVersion: '27',
					pendingChangeCount: 1,
					remoteChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewRequiresServerStateRefetch: true,
					riskyBlockReviewItems: [
						{
							id: 'risk-html-stale',
							reviewStatus:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
						},
					],
					riskyBlockReviewPendingCount: 1,
					riskyBlockReviewPrePublishPanelRequired: false,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'server_state_refetched_before_save',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				requiresRiskyBlockReviewServerStateRefetch: false,
				callsServerStateRefetchEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( refetchCalls ).toBe( 1 );
			expect( presenceHeartbeatCalls ).toBe( 1 );
			expect( presenceSnapshotCalls ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'local risky bar from Save click' );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				serverVersion: '28',
				refetchedServerContent: 'remote bar after risky review refetch',
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				riskyBlockReviewRequiresServerStateRefetch: false,
				riskyBlockReviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
				riskyBlockReviewSaveClickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW,
				canExportLocalUpdates: true,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED,
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW,
				blocksNormalSavePost: true,
			} );
		} );

		it( 'keeps current-base dirty Save ordinary while routing the click through DE-RTC retry-save', async () => {
			const basePostContent =
				'<!-- wp:paragraph --><p>Current base.</p><!-- /wp:paragraph -->';
			const basePostContentWithSyncMeta = `${ basePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script>`;
			const editedPostContent =
				'<!-- wp:paragraph --><p>Current-base local edit.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: basePostContentWithSyncMeta,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let autosaveCalls = 0;
			let retrySubmitRequestData = null;
			let retrySaveRequestData = null;
			const retrySaveDeferred = createDeferred();

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;

					return {
						...post,
						content: {
							raw: basePostContentWithSyncMeta,
						},
						distributed_editing: {
							server_version: '4',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				) {
					retrySubmitCalls++;
					retrySubmitRequestData = data;

					return {
						result: 'retry_submit_accepted_for_future_save',
						retry_submit_accepted: true,
						client_base_version: '4',
						server_version: '4',
						rebased_from_version: '4',
						pending_change_count: 1,
						save_path_required: true,
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
					retrySaveRequestData = data;

					return retrySaveDeferred.promise;
				}

				if (
					method === 'POST' &&
					path.startsWith( `/wp/v2/posts/${ postId }/autosaves` )
				) {
					autosaveCalls++;
				}

				if (
					( method === 'POST' || method === 'PUT' ) &&
					path === `/wp/v2/posts/${ postId }`
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
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY,
				label: 'Update',
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE,
				blocksNormalSavePost: false,
				canExportLocalUpdates: false,
				actionKeys: [],
				claimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSavePolicyState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.UPDATE_READY,
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE,
				blocksNormalSavePost: false,
				canExportLocalUpdates: false,
				saveButtonActionKeys: [],
				claimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveJourneyState( true )
			).toMatchObject( {
				action: 'dirty_save_preflight',
				title: 'Unsaved changes',
				summary: 'Use Save when you are ready.',
				actionHint: null,
				requiresActionBeforeSave: false,
				saveButtonLabel: 'Update',
				saveButtonBlocksNormalSavePost: false,
				dirtyEditorPreflight: true,
				claimsSavedWithoutEvidence: false,
			} );

			const saveClickPromise = registry
				.dispatch( editorStore )
				.__experimentalMaybeHandleDistributedEditingSaveButtonClick();
			for (
				let attempts = 0;
				retrySaveCalls === 0 && attempts < 20;
				attempts++
			) {
				await Promise.resolve();
			}

			expect( retrySaveCalls ).toBe( 1 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS,
				statusText: 'Saving.',
				disabled: true,
				pendingServerConfirmation: true,
				claimsSaved: false,
			} );

			retrySaveDeferred.resolve( {
				result: 'retry_save_applied',
				retry_save_accepted: true,
				previous_server_version: '4',
				server_version: '5',
				pending_change_count: 1,
				saves_post: true,
				mutates_post_content: true,
				creates_revision: true,
				claims_saved: true,
				revision_created: true,
				created_revision_ids: [ 5001 ],
			} );

			await expect( saveClickPromise ).resolves.toMatchObject( {
				status: 'guarded_retry_save_submitted_from_save_click',
				callsServerStateRefetchEndpoint: true,
				callsRetrySubmitEndpoint: true,
				callsRetrySaveEndpoint: true,
				callsNormalSavePost: false,
				allowsNormalSaveFallback: false,
				claimsSaved: true,
				handledFreshProtectedChangesBeforeStatusEdit: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( retrySubmitCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( autosaveCalls ).toBe( 0 );
			expect( retrySubmitRequestData ).toMatchObject( {
				client_base_version: '4',
				rebased_from_version: '4',
				pending_change_count: 1,
			} );
			expect( retrySubmitRequestData.content ).toBeUndefined();
			expect(
				retrySubmitRequestData.proposed_post_content
			).toBeUndefined();
			expect( retrySaveRequestData ).toMatchObject( {
				client_base_version: '4',
				accepted_proof_server_version: '4',
				rebased_from_version: '4',
				pending_change_count: 1,
				proposed_post_content: editedPostContent,
				accepted_proof_saves_post: false,
				accepted_proof_mutates_post_content: false,
				accepted_proof_creates_revision: false,
				accepted_proof_claims_saved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				serverVersion: '5',
				pendingChangeCount: 0,
				hasPendingChanges: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '5',
				retrySavePreviousServerVersion: '4',
				retrySaveSavesPost: true,
				retrySaveMutatesPostContent: true,
				retrySaveClaimsSaved: true,
				canExportLocalUpdates: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveJourneyState()
			).toMatchObject( {
				title: 'Saved',
				summary: 'Ready for new edits.',
				confirmedByWordPress: true,
				claimsSavedWithoutEvidence: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'keeps a same-user two-tab formatting Save simple when retry-submit goes stale once without content drift', async () => {
			const basePostContent =
				'<!-- wp:paragraph --><p>WordPress powers distributed editing.</p><!-- /wp:paragraph -->';
			const basePostContentWithSyncMeta = `${ basePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script>`;
			const editedPostContent =
				'<!-- wp:paragraph --><p><em>WordPress</em> powers distributed editing.</p><!-- /wp:paragraph -->';
			const refetchedPostContentWithSyncMeta = `${ basePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"6"}</script>`;
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: basePostContentWithSyncMeta,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let autosaveCalls = 0;
			let retrySaveRequestData = null;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;

					return {
						...post,
						content: {
							raw:
								serverStateRefetchCalls === 1
									? basePostContentWithSyncMeta
									: refetchedPostContentWithSyncMeta,
						},
						distributed_editing: {
							server_version:
								serverStateRefetchCalls === 1 ? '4' : '6',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				) {
					retrySubmitCalls++;

					if ( retrySubmitCalls === 1 ) {
						throw {
							code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
							message:
								'Distributed Editing rejected the retry because the server advanced again.',
							data: {
								status: 409,
								reason_code:
									DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
								client_base_version: data.client_base_version,
								server_version: '6',
							},
						};
					}

					return {
						result: 'retry_submit_accepted_for_future_save',
						retry_submit_accepted: true,
						client_base_version: '6',
						server_version: '6',
						rebased_from_version: '4',
						pending_change_count: 1,
						save_path_required: true,
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
					retrySaveRequestData = data;

					return {
						result: 'retry_save_applied',
						retry_save_accepted: true,
						previous_server_version: '6',
						server_version: '7',
						pending_change_count: 1,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						revision_created: true,
						created_revision_ids: [ 7001 ],
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					return createDistributedEditingPresenceHeartbeatResponse(
						data
					);
				}

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				) {
					return createDistributedEditingPresenceSnapshotResponse();
				}

				if (
					method === 'POST' &&
					path.startsWith( `/wp/v2/posts/${ postId }/autosaves` )
				) {
					autosaveCalls++;
				}

				if (
					( method === 'POST' || method === 'PUT' ) &&
					path === `/wp/v2/posts/${ postId }`
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
					retrySaveHandoff: true,
				},
			} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'guarded_retry_save_submitted_from_save_click',
				callsServerStateRefetchEndpoint: true,
				callsRetrySubmitEndpoint: true,
				callsRetrySaveEndpoint: true,
				callsNormalSavePost: false,
				allowsNormalSaveFallback: false,
				retriedStaleRetrySubmitProof: true,
				claimsSaved: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 2 );
			expect( retrySubmitCalls ).toBe( 2 );
			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( autosaveCalls ).toBe( 0 );
			expect( retrySaveRequestData ).toMatchObject( {
				client_base_version: '6',
				accepted_proof_server_version: '6',
				rebased_from_version: '4',
				pending_change_count: 1,
				proposed_post_content: editedPostContent,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				serverVersion: '7',
				pendingChangeCount: 0,
				hasPendingChanges: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '7',
				retrySavePreviousServerVersion: '6',
				canExportLocalUpdates: false,
			} );
		} );

		it( 'focuses the visible comparison surface from a Compare changes Save click', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			const originalBody = document.body.innerHTML;
			const comparison = document.createElement( 'div' );

			comparison.setAttribute(
				'data-distributed-editing-conflict-comparison',
				'same-block'
			);
			comparison.scrollIntoView = jest.fn();
			document.body.appendChild( comparison );

			try {
				registry
					.dispatch( coreStore )
					.receiveEntityRecords( 'postType', 'post', post );
				registry.dispatch( editorStore ).setupEditor( post, {
					content: 'local bar',
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
						pendingChangeCount: 1,
						hasPendingChanges: true,
						canExportLocalUpdates: true,
						localRebasePlanStatus:
							DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
						localRebaseResultStatus:
							DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
						localRebaseResultReason: 'same_block_changed',
						requiresManualConflictResolution: true,
						clientBaseContent:
							'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
						refetchedServerContent:
							'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
					} );

				expect(
					registry
						.select( editorStore )
						.getDistributedEditingSavePolicyState()
				).toMatchObject( {
					status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.WORKFLOW_ACTION_REQUIRED,
					clickAction:
						DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.COMPARE_CONFLICTING_CHANGES,
				} );

				await expect(
					registry
						.dispatch( editorStore )
						.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
				).resolves.toMatchObject( {
					status: 'manual_conflict_comparison_required_before_save',
					opensComparison: true,
					comparisonOpenRequested: true,
					focusesComparison: true,
					comparisonActionStatus:
						DISTRIBUTED_EDITING_CONFLICT_COMPARISON_ACTION_STATUSES.OPENED,
					comparisonActionReason: 'comparison_surface_opened',
					comparisonFocusRequested: true,
					comparisonFocusedImmediately: true,
					callsNormalSavePost: false,
					callsAutosaveEndpoint: false,
					callsRetrySaveEndpoint: false,
					mutatesEditorContent: false,
					changesPostLock: false,
					claimsSaved: false,
				} );

				expect( comparison.scrollIntoView ).toHaveBeenCalled();
				expect( comparison ).toHaveAttribute( 'tabindex', '-1' );
				expect( comparison ).toHaveFocus();
				expect(
					registry
						.select( editorStore )
						.getDistributedEditingConflictingChangesComparisonActionState()
				).toMatchObject( {
					status: DISTRIBUTED_EDITING_CONFLICT_COMPARISON_ACTION_STATUSES.OPENED,
					reason: 'comparison_surface_opened',
					action: DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.COMPARE_CONFLICTING_CHANGES,
					requested: true,
					openRequested: true,
					focusRequested: true,
					focusedImmediately: true,
					surfaceOpened: true,
					requiresManualConflictResolution: true,
					hasProtectedLocalChanges: true,
					canExportLocalUpdates: true,
					preservesLocalChanges: true,
					preservesCompareState: true,
					blocksNormalSavePost: true,
					callsRestEndpoint: false,
					callsNormalSavePost: false,
					callsAutosaveEndpoint: false,
					callsRetrySaveEndpoint: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				} );
				expect(
					registry
						.select( editorStore )
						.getDistributedEditingSessionState()
				).toMatchObject( {
					conflictingChangesComparisonActionStatus:
						DISTRIBUTED_EDITING_CONFLICT_COMPARISON_ACTION_STATUSES.OPENED,
					conflictingChangesComparisonActionReason:
						'comparison_surface_opened',
					conflictingChangesComparisonActionRequested: true,
					conflictingChangesComparisonOpenRequested: true,
					conflictingChangesComparisonFocusRequested: true,
					conflictingChangesComparisonFocusedImmediately: true,
					conflictingChangesComparisonSurfaceOpened: true,
					canExportLocalUpdates: true,
					requiresManualConflictResolution: true,
				} );
			} finally {
				document.body.innerHTML = originalBody;
			}
		} );

		it( 'records an explicit Compare action reason when the comparison surface is not mounted', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			const originalBody = document.body.innerHTML;

			document.body.innerHTML = '';

			try {
				registry
					.dispatch( coreStore )
					.receiveEntityRecords( 'postType', 'post', post );
				registry.dispatch( editorStore ).setupEditor( post, {
					content: 'local bar',
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
						pendingChangeCount: 1,
						hasPendingChanges: true,
						canExportLocalUpdates: true,
						localRebasePlanStatus:
							DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
						localRebaseResultStatus:
							DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
						localRebaseResultReason: 'same_block_changed',
						requiresManualConflictResolution: true,
						clientBaseContent:
							'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
						refetchedServerContent:
							'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
					} );

				await expect(
					registry
						.dispatch( editorStore )
						.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
				).resolves.toMatchObject( {
					status: 'manual_conflict_comparison_required_before_save',
					opensComparison: false,
					comparisonOpenRequested: true,
					focusesComparison: true,
					comparisonActionStatus:
						DISTRIBUTED_EDITING_CONFLICT_COMPARISON_ACTION_STATUSES.OPEN_REQUESTED,
					comparisonActionReason:
						'comparison_surface_not_available_yet',
					comparisonFocusRequested: true,
					comparisonFocusedImmediately: false,
					preservesLocalChanges: true,
					preservesCompareState: true,
					callsServerStateRefetchEndpoint: false,
					callsRetrySubmitEndpoint: false,
					callsNormalSavePost: false,
					callsAutosaveEndpoint: false,
					callsRetrySaveEndpoint: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				} );

				expect(
					registry
						.select( editorStore )
						.getDistributedEditingConflictingChangesComparisonActionState()
				).toMatchObject( {
					status: DISTRIBUTED_EDITING_CONFLICT_COMPARISON_ACTION_STATUSES.OPEN_REQUESTED,
					reason: 'comparison_surface_not_available_yet',
					requested: true,
					openRequested: true,
					focusRequested: true,
					focusedImmediately: false,
					surfaceOpened: false,
					requiresManualConflictResolution: true,
					hasProtectedLocalChanges: true,
					canExportLocalUpdates: true,
					preservesLocalChanges: true,
					preservesCompareState: true,
					blocksNormalSavePost: true,
					callsRestEndpoint: false,
					callsServerStateRefetchEndpoint: false,
					callsRetrySubmitEndpoint: false,
					callsNormalSavePost: false,
					callsAutosaveEndpoint: false,
					callsRetrySaveEndpoint: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				} );
				expect(
					registry.select( editorStore ).getEditedPostContent()
				).toBe( 'local bar' );
			} finally {
				document.body.innerHTML = originalBody;
			}
		} );

		it( 'requests active risky-block review approval proof from a Save button click before guarded retry-save', async () => {
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
			let reviewApprovalCalls = 0;
			let retrySaveCalls = 0;
			let reviewApprovalMethod;
			let reviewApprovalRequestData;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/review-approval`
					)
				) {
					reviewApprovalCalls++;
					reviewApprovalMethod = method;
					reviewApprovalRequestData = data;

					return {
						result: 'review_approval_accepted_for_retry_save',
						review_approval_accepted: true,
						server_version: '12',
						previous_server_version: '11',
						client_base_version: '12',
						accepted_proof_server_version: '12',
						pending_change_count: 1,
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
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				) {
					retrySaveCalls++;
				}

				throw new Error( `Unexpected path: ${ method } ${ path }` );
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: false,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					serverVersion: '12',
					pendingChangeCount: 1,
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
					],
					riskyBlockReviewItemCount: 1,
					riskyBlockReviewPendingCount: 0,
					riskyBlockReviewApprovedCount: 1,
					riskyBlockReviewRejectedCount: 0,
					riskyBlockReviewPrePublishPanelRequired: false,
					riskyBlockReviewCanExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'review_approval_proof_accepted',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsReviewApprovalProofEndpoint: true,
				reviewApprovalProofAccepted: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );

			expect( reviewApprovalCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 0 );
			expect( reviewApprovalMethod ).toBe( 'POST' );
			expect( reviewApprovalRequestData ).toMatchObject( {
				client_base_version: '12',
				accepted_proof_server_version: '12',
				pending_change_count: 1,
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
			expect(
				reviewApprovalRequestData.reviewed_block_items
			).toHaveLength( 1 );
			expect(
				reviewApprovalRequestData.reviewed_block_items[ 0 ].raw_content
			).toBeUndefined();
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

		it( 'applies local stale-base changes from a Save button click without ordinary save fallback', async () => {
			const baseContent =
				'<!-- wp:paragraph --><p>Base local</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Shared</p><!-- /wp:paragraph -->';
			const serverContent =
				'<!-- wp:paragraph --><p>Base local</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote</p><!-- /wp:paragraph -->';
			const localContent =
				'<!-- wp:paragraph --><p>Local</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Shared</p><!-- /wp:paragraph -->';
			const expectedMergedContent =
				'<!-- wp:paragraph --><p>Local</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: baseContent,
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			let apiCalls = 0;

			apiFetch.setFetchHandler( async () => {
				apiCalls++;
				throw new Error(
					'Save button local rebase should not call REST.'
				);
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'root', 'postType', postTypeEntity );
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: localContent,
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '25',
					serverVersion: '26',
					pendingChangeCount: 1,
					remoteChangeCount: 1,
					refetchedServerState: true,
					requiresServerStateRefetch: false,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					canAttemptLocalRebase: true,
					clientBaseContent: baseContent,
					refetchedServerContent: serverContent,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'local_changes_applied_before_save',
				reason: 'local_changes_not_applied_before_save',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: true,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( apiCalls ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( expectedMergedContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				readyToRetrySubmit: true,
				canExportLocalUpdates: true,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'prepares retry submit from a Save button click without saving', async () => {
			const registry = createRegistryWithStores();
			let apiCalls = 0;

			apiFetch.setFetchHandler( async () => {
				apiCalls++;
				throw new Error(
					'Save button retry-submit preparation should not call REST.'
				);
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '25',
					serverVersion: '26',
					pendingChangeCount: 1,
					refetchedServerState: true,
					requiresServerStateRefetch: false,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
					readyToRetrySubmit: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'retry_submit_prepared_before_save',
				reason: 'retry_submit_handoff_not_prepared_before_save',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( apiCalls ).toBe( 0 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySubmitPrepared: true,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
				readyToRetrySubmit: false,
				canExportLocalUpdates: true,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'checks retry-submit proof from a Save button click without retry-save or ordinary save', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			let retrySubmitCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				retrySubmitCalls++;
				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				);
				expect( data ).toMatchObject( {
					client_base_version: '26',
					rebased_from_version: '25',
					pending_change_count: 1,
				} );
				expect( data ).not.toHaveProperty( 'content' );

				return {
					result: 'retry_submit_accepted_for_future_save',
					retry_submit_accepted: true,
					pending_change_count: 1,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				};
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'root', 'postType', postTypeEntity );
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'local bar',
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '25',
					serverVersion: '26',
					pendingChangeCount: 1,
					refetchedServerState: true,
					requiresServerStateRefetch: false,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'retry_submit_proof_refreshed_before_save',
				reason: 'retry_submit_proof_not_checked_before_save',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( retrySubmitCalls ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'local bar' );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				canExportLocalUpdates: true,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'prepares accepted retry-submit proof from a Save button click without saving', async () => {
			const registry = createRegistryWithStores();
			let apiCalls = 0;

			apiFetch.setFetchHandler( async () => {
				apiCalls++;
				throw new Error(
					'Prepare Save from the Save button should not call REST.'
				);
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					isAwaitingServerConfirmation: true,
					canExportLocalUpdates: true,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
					retrySubmitSavesPost: false,
					retrySubmitMutatesPostContent: false,
					retrySubmitCreatesRevision: false,
					retrySubmitClaimsSaved: false,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'retry_submit_save_prepared_before_save',
				reason: 'accepted_retry_submit_proof_needs_save_preparation',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSaveReady: true,
			} );

			expect( apiCalls ).toBe( 0 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_PREPARED,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
				canExportLocalUpdates: true,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'confirms a prepared latest-WordPress structural choice from a Save button click without writing again', async () => {
			const basePostContent =
				'<!-- wp:paragraph --><p>Base structural alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base structural beta.</p><!-- /wp:paragraph -->';
			const firstAcceptedPostContent =
				'<!-- wp:paragraph --><p>Base structural alpha.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: `${ basePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script>`,
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			let apiCalls = 0;

			apiFetch.setFetchHandler( async () => {
				apiCalls++;
				throw new Error(
					'Prepared latest-WordPress structural Save confirmation should not call REST.'
				);
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: firstAcceptedPostContent,
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '5',
					clientBaseContent: basePostContent,
					refetchedServerContent: firstAcceptedPostContent,
					pendingChangeCount: 1,
					remoteChangeCount: 1,
					refetchedServerState: true,
					requiresServerStateRefetch: false,
					hasPendingChanges: true,
					isAwaitingServerConfirmation: true,
					canExportLocalUpdates: true,
					mustOfferLocalCopy: true,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultReason: 'block_deleted',
					requiresManualConflictResolution: true,
					staleBaseConflictResolutionStatus:
						DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
					staleBaseConflictResolutionChoice:
						DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
					staleBaseConflictResolutionRequiresFreshProof: false,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSavesPost: false,
					retrySubmitMutatesPostContent: false,
					retrySubmitCreatesRevision: false,
					retrySubmitClaimsSaved: false,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSavePrepared: true,
					retrySubmitSaveReady: true,
				} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSavePolicyState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE,
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
				blocksNormalSavePost: true,
				shouldCallRetrySaveEndpoint: false,
				claimsSaved: false,
			} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'structural_choice_already_authoritative_from_save_click',
				reason: 'structural_choice_already_authoritative',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				createsRevision: false,
				claimsSaved: false,
				authoritativePostAlreadyCurrent: true,
			} );

			expect( apiCalls ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( firstAcceptedPostContent );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				clientBaseVersion: '5',
				serverVersion: '5',
				pendingChangeCount: 0,
				hasPendingChanges: false,
				isAwaitingServerConfirmation: false,
				canExportLocalUpdates: false,
				mustOfferLocalCopy: false,
				requiresManualConflictResolution: false,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.NONE,
				localRebaseResultReason: null,
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.NONE,
				staleBaseConflictResolutionChoice: null,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
				retrySubmitAccepted: false,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
				retrySubmitSaveReady: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				retrySaveClaimsSaved: false,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSavePolicyState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.UPDATE_READY,
				blocksNormalSavePost: false,
				claimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'carries a two-editor non-conflicting visible Save sequence through server-merged retry-save', async () => {
			const basePostContent =
				'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->';
			const basePostContentWithSyncMeta = `${ basePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script>`;
			const localPostContent =
				'<!-- wp:paragraph --><p>Editor B alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->';
			const remotePostContent =
				'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Editor A beta.</p><!-- /wp:paragraph -->';
			const mergedPostContent =
				'<!-- wp:paragraph --><p>Editor B alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Editor A beta.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: basePostContentWithSyncMeta,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let retrySubmitRequestData = null;
			let retrySaveRequestData = null;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;

					if ( serverStateRefetchCalls === 1 ) {
						return {
							...post,
							content: {
								raw: `${ remotePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"7"}</script>`,
							},
							distributed_editing: {
								server_version: '7',
							},
						};
					}

					return {
						...post,
						content: {
							raw: `${ mergedPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"8"}</script>`,
						},
						distributed_editing: {
							server_version: '8',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				) {
					retrySubmitCalls++;
					retrySubmitRequestData = data;

					return {
						result: 'retry_submit_accepted_for_future_save',
						retry_submit_accepted: true,
						client_base_version: '7',
						server_version: '7',
						rebased_from_version: '4',
						pending_change_count: 1,
						save_path_required: true,
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
					retrySaveRequestData = data;

					return {
						result: 'retry_save_server_merged',
						retry_save_accepted: true,
						previous_server_version: '7',
						server_version: '8',
						pending_change_count: 1,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						revision_created: true,
						created_revision_ids: [ 8002 ],
						server_merge_applied: true,
						server_merge: {
							merge_status: 'merged',
							merge_strategy:
								'top_level_serialized_block_three_way',
							base_version: '4',
							server_version: '7',
							block_count: 2,
							server_changed_indexes: [ 1 ],
							local_changed_indexes: [ 0 ],
							merged_stripped_content_hash:
								'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
						},
					};
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
				content: localPostContent,
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				clientBaseVersion: '4',
				serverVersion: '4',
				pendingChangeCount: 0,
				hasPendingChanges: false,
				canExportLocalUpdates: false,
			} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'distributed_editing_normal_save_auto_merged_retry_save_submitted',
				callsServerStateRefetchEndpoint: true,
				callsRetrySubmitEndpoint: true,
				callsRetrySaveEndpoint: true,
				mutatesEditorContent: true,
				allowsNormalSaveFallback: false,
				callsRetrySaveAction: true,
				callsNormalSavePost: false,
				claimsSaved: true,
				handledFreshProtectedChangesBeforeStatusEdit: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 2 );
			expect( retrySubmitCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( retrySubmitRequestData ).toMatchObject( {
				client_base_version: '7',
				rebased_from_version: '4',
				pending_change_count: 1,
			} );
			expect( retrySubmitRequestData.content ).toBeUndefined();
			expect(
				retrySubmitRequestData.proposed_post_content
			).toBeUndefined();
			expect( retrySaveRequestData ).toMatchObject( {
				client_base_version: '7',
				accepted_proof_server_version: '7',
				rebased_from_version: '4',
				pending_change_count: 1,
				proposed_post_content: mergedPostContent,
				accepted_proof_saves_post: false,
				accepted_proof_mutates_post_content: false,
				accepted_proof_creates_revision: false,
				accepted_proof_claims_saved: false,
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( mergedPostContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				pendingChangeCount: 0,
				hasPendingChanges: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '8',
				retrySavePreviousServerVersion: '7',
				retrySaveConfirmedMergedEdits: true,
				retrySaveServerMerged: true,
				retrySaveServerMergeApplied: true,
				retrySaveServerMergeStatus: 'merged',
				retrySaveServerMergeStrategy:
					'top_level_serialized_block_three_way',
				retrySaveServerMergeServerChangedIndexes: [ 1 ],
				retrySaveServerMergeLocalChangedIndexes: [ 0 ],
				canExportLocalUpdates: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'blocks a repeated visible Save click while guarded refetch is pending', async () => {
			const basePostContent =
				'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->';
			const basePostContentWithSyncMeta = `${ basePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script>`;
			const localPostContent =
				'<!-- wp:paragraph --><p>Editor B alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->';
			const remotePostContent =
				'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Editor A beta.</p><!-- /wp:paragraph -->';
			const mergedPostContent =
				'<!-- wp:paragraph --><p>Editor B alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Editor A beta.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: basePostContentWithSyncMeta,
				status: 'draft',
			};
			const firstRefetch = createDeferred();
			const firstRefetchStarted = createDeferred();
			let serverStateRefetchCalls = 0;
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let autosaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;

					if ( serverStateRefetchCalls === 1 ) {
						firstRefetchStarted.resolve();
						await firstRefetch.promise;

						return {
							...post,
							content: {
								raw: `${ remotePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"7"}</script>`,
							},
							distributed_editing: {
								server_version: '7',
							},
						};
					}

					return {
						...post,
						content: {
							raw: `${ mergedPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"8"}</script>`,
						},
						distributed_editing: {
							server_version: '8',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				) {
					retrySubmitCalls++;

					return {
						result: 'retry_submit_accepted_for_future_save',
						retry_submit_accepted: true,
						client_base_version: '7',
						server_version: '7',
						rebased_from_version: '4',
						pending_change_count: 1,
						save_path_required: true,
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

					return {
						result: 'retry_save_server_merged',
						retry_save_accepted: true,
						previous_server_version: '7',
						server_version: '8',
						pending_change_count: 1,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						revision_created: true,
						created_revision_ids: [ 8002 ],
						server_merge_applied: true,
						server_merge: {
							merge_status: 'merged',
							merge_strategy:
								'top_level_serialized_block_three_way',
							base_version: '4',
							server_version: '7',
							block_count: 2,
							server_changed_indexes: [ 1 ],
							local_changed_indexes: [ 0 ],
							merged_stripped_content_hash:
								'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					return createDistributedEditingPresenceHeartbeatResponse(
						options.data
					);
				}

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				) {
					return createDistributedEditingPresenceSnapshotResponse();
				}

				if (
					method === 'POST' &&
					path.startsWith( `/wp/v2/posts/${ postId }/autosaves` )
				) {
					autosaveCalls++;
				}

				if (
					( method === 'POST' || method === 'PUT' ) &&
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
				content: localPostContent,
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );

			const firstSave = registry
				.dispatch( editorStore )
				.__experimentalMaybeHandleDistributedEditingSaveButtonClick();

			await firstRefetchStarted.promise;

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( retrySubmitCalls ).toBe( 0 );
			expect( retrySaveCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( autosaveCalls ).toBe( 0 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				saveButtonClickInFlight: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				retrySaveClaimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSavePolicyState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.IN_FLIGHT,
				reason: 'distributed_editing_save_button_click_in_flight',
				saveButtonDisabled: true,
				saveButtonBusy: false,
				blocksNormalSavePost: true,
				claimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				label: 'Save',
				disabled: true,
				busy: false,
				clickAction: null,
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS,
				blocksNormalSavePost: true,
				shouldCallNormalSavePost: false,
				shouldCallRetrySaveEndpoint: false,
				claimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveJourneyState()
			).toMatchObject( {
				action: 'keep_tab_open',
				saveButtonLabel: 'Save',
				saveButtonDisabled: true,
				saveButtonBusy: false,
				saveButtonBlocksNormalSavePost: true,
				claimsSavedWithoutEvidence: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingRepeatedVisibleSaveProofState( {
						viewport: { width: 1280, height: 720 },
						repeatedClickAttempted: true,
						secondClickFired: false,
						delayedRefetchHeld: true,
						delayedServerStateRefetchCount: serverStateRefetchCalls,
						localProposalPreserved: true,
						dirtyStatePreserved: true,
						normalSaveBlocked: true,
						requestDeltaAfterRepeatedClick: {
							serverStateRefetch: 0,
							retrySubmit: 0,
							retrySave: 0,
							distributedEditing: 0,
							autosave: 0,
							normalPostMutation: 0,
						},
					} )
			).toMatchObject( {
				viewport: { width: 1280, height: 720 },
				repeatedVisibleSaveIdempotency: {
					requestDeltaAfterRepeatedClick: {
						serverStateRefetch: 0,
						retrySubmit: 0,
						retrySave: 0,
						distributedEditing: 0,
						autosave: 0,
						normalPostMutation: 0,
					},
					buttonSnapshot: {
						text: 'Save',
						disabled: true,
						busy: false,
						saveButtonStatus:
							DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS,
						saveButtonClickAction: null,
						saveJourneyAction: 'keep_tab_open',
					},
					duplicateGuardedWritesPrevented: true,
					saveLoopPrevented: true,
				},
				contentFree: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				callsAutosaveEndpoint: false,
				claimsSaved: false,
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( localPostContent );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'distributed_editing_save_button_blocked',
				reason: 'distributed_editing_save_button_click_in_flight',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( retrySubmitCalls ).toBe( 0 );
			expect( retrySaveCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( autosaveCalls ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( localPostContent );

			firstRefetch.resolve();

			await expect( firstSave ).resolves.toMatchObject( {
				status: 'distributed_editing_normal_save_auto_merged_retry_save_submitted',
				callsServerStateRefetchEndpoint: true,
				callsRetrySubmitEndpoint: true,
				callsRetrySaveEndpoint: true,
				allowsNormalSaveFallback: false,
				callsNormalSavePost: false,
				claimsSaved: true,
				handledFreshProtectedChangesBeforeStatusEdit: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 2 );
			expect( retrySubmitCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( autosaveCalls ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( mergedPostContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				saveButtonClickInFlight: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveClaimsSaved: true,
				canExportLocalUpdates: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'falls back to the ordinary Save click when Distributed Editing settings are disabled', async () => {
			const registry = createRegistryWithStores();
			let apiCalls = 0;

			apiFetch.setFetchHandler( async () => {
				apiCalls++;
				throw new Error( 'Disabled Save click should not call REST.' );
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: false,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					pendingChangeCount: 1,
					requiresServerStateRefetch: true,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'normal_save_fallback',
				allowsNormalSaveFallback: true,
				blocksNormalSavePost: false,
				callsServerStateRefetchEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );

			expect( apiCalls ).toBe( 0 );
		} );

		it( 'blocks disabled in-flight Distributed Editing Save button states without fallback', async () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					hasPendingChanges: true,
					pendingChangeCount: 1,
					canExportLocalUpdates: true,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'distributed_editing_save_button_blocked',
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );
		} );

		it( 'allows an explicitly quieted confirmed Save button to fall back to ordinary Save routing when no local DE-RTC work is protected', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				status: 'draft',
			};
			let apiCalls = 0;
			apiFetch.setFetchHandler( () => {
				apiCalls++;
				return {};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					retrySaveServerVersion: '92',
					retrySavePreviousServerVersion: '91',
					retrySaveSavesPost: true,
					retrySaveMutatesPostContent: true,
					retrySaveCreatesRevision: true,
					retrySaveClaimsSaved: true,
					retrySaveRevisionCreated: true,
					hasPendingChanges: false,
					canExportLocalUpdates: false,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'distributed_editing_save_button_blocked',
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_ALREADY_CONFIRMED,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				claimsSaved: true,
			} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick(
						{
							__experimentalAllowDistributedEditingConfirmedSaveNormalFallback: true,
						}
					)
			).resolves.toMatchObject( {
				status: 'normal_save_fallback',
				allowsNormalSaveFallback: true,
				blocksNormalSavePost: false,
				callsServerStateRefetchEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );

			expect( apiCalls ).toBe( 0 );
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

		it( 'uses the safe WordPress copy locally when every risky item is rejected', async () => {
			const registry = createRegistryWithStores();
			const dispatch = registry.dispatch( editorStore );
			const select = registry.select( editorStore );
			const safeContent =
				'<!-- wp:paragraph --><p>Safe content already saved.</p><!-- /wp:paragraph -->';
			const unsafeContent =
				'<!-- wp:html --><script>window.__unsafe = true;</script><!-- /wp:html -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'Risky review post',
				content:
					'<!-- wp:paragraph --><p>Original content.</p><!-- /wp:paragraph -->',
				status: 'publish',
			};

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			dispatch.setupEditor( post, {
				content: post.content,
			} );
			dispatch.editPost( { content: unsafeContent } );
			dispatch.setDistributedEditingSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				clientBaseContent: safeContent,
				clientBaseVersion: '2',
				refetchedServerContent: safeContent,
				refetchedServerState: true,
				serverVersion: '2',
				pendingChangeCount: 1,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				riskyBlockReviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
				riskyBlockReviewItems: [
					{
						id: 'risk-reject',
						reviewStatus:
							DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
					},
				],
				riskyBlockReviewPendingCount: 1,
				riskyBlockReviewPrePublishPanelRequired: true,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			} );

			const rejection = await dispatch.__experimentalResolveDistributedEditingRiskyBlockReviewItem(
				{
					reviewItemId: 'risk-reject',
					decision: 'rejected',
					rejectionReason: 'unsafe_script_change',
				}
			);

			expect( rejection ).toMatchObject( {
				status: 'review_item_resolved',
				reviewItemId: 'risk-reject',
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
				appliesSafeServerContentAfterReject: true,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: true,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( select.getEditedPostContent() ).toBe( safeContent );
			expect( select.isEditedPostDirty() ).toBe( false );
			expect( select.getDistributedEditingSessionState() ).toMatchObject(
				{
					disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
					reasonCode: null,
					pendingChangeCount: 0,
					hasPendingChanges: false,
					isAwaitingServerConfirmation: false,
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NO_REVIEW_REQUIRED,
					riskyBlockReviewItemCount: 0,
					riskyBlockReviewPendingCount: 0,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				}
			);
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
				expect( isDistributedEditingPostSnapshotPath( path ) ).toBe(
					true
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
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
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
				expect( isDistributedEditingPostSnapshotPath( path ) ).toBe(
					true
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

	describe( '__experimentalSyncDistributedEditingWithServer()', () => {
		it( 'publishes the newly confirmed copy and refreshes presence after a clean server sync', async () => {
			const baseContent =
				'<!-- wp:paragraph --><p>Base copy.</p><!-- /wp:paragraph -->';
			const serverContent =
				'<!-- wp:paragraph --><p>Updated WordPress copy.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'Server sync clean presence post',
				content: baseContent,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let heartbeatCalls = 0;
			let presenceSnapshotCalls = 0;
			let normalSaveCalls = 0;
			let autosaveCalls = 0;
			let heartbeatRequestData;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					expect( options.headers ).toEqual( {
						'If-None-Match': '"base-hash"',
					} );
					expect( options.parse ).toBe( false );

					return {
						id: postId,
						type: 'post',
						content: {
							raw: serverContent,
						},
						state_hash: 'hash-5',
						distributed_editing: {
							server_version: '5',
							state_hash: 'hash-5',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					heartbeatCalls++;
					heartbeatRequestData = data;

					return {
						result: 'presence_heartbeat_recorded',
						rest_route: 'post_presence_heartbeat',
						writes_presence: true,
						records_presence_heartbeat: true,
						heartbeat_interval_seconds: 30,
						document_state: {
							available: true,
							confirmedBaseVersion: data.confirmed_base_version,
							confirmedStateHash: data.confirmed_state_hash,
							hasPendingChanges: data.has_pending_changes,
							confirmedAtGmt: data.confirmed_at_gmt,
							presenceUpdatedAtGmt: '2026-05-20 12:02:30',
							authoritativeForSave: false,
							claimsSaved: false,
							exposesRawContent: false,
						},
						calls_save: false,
						mutates_post_content: false,
						changes_post_lock: false,
						claims_saved: false,
					};
				}

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				) {
					presenceSnapshotCalls++;

					return {
						result: 'presence_roster_snapshot',
						rest_route: 'post_presence_roster',
						presence_roster: {
							status: 'active',
							freshness: 'current',
							visibleCount: 1,
							totalKnownCount: 1,
							claimsAbsence: false,
							entries: [
								{
									key: 'presence-remote-current',
									displayName: 'Mira',
									identityVisibility: 'named',
									relationship: 'other_user',
									freshness: 'current',
									documentState: {
										available: true,
										confirmedBaseVersion: '5',
										confirmedStateHash: 'hash-5',
										hasPendingChanges: false,
										authoritativeForSave: false,
										claimsSaved: false,
										exposesRawContent: false,
									},
								},
							],
						},
						read_only: true,
						calls_save: false,
						saves_post: false,
						mutates_post_content: false,
						changes_post_lock: false,
						records_presence_heartbeat: false,
						enables_repeated_client_refresh: false,
						claims_saved: false,
					};
				}

				if ( method === 'PUT' && path === `/wp/v2/posts/${ postId }` ) {
					normalSaveCalls++;
				}

				if ( path.includes( '/autosaves' ) ) {
					autosaveCalls++;
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
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '4',
					clientBaseContent: baseContent,
					distributedEditingPostStateHash: 'base-hash',
					presenceDocumentStatePublishedKey:
						'4:base-hash:clean:clean',
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSyncDistributedEditingWithServer()
			).resolves.toMatchObject( {
				status: 'server_sync_applied_clean',
				serverVersion: '5',
				callsServerStateRefetchEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				callsAutosaveEndpoint: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( heartbeatCalls ).toBe( 1 );
			expect( presenceSnapshotCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( autosaveCalls ).toBe( 0 );
			expect( heartbeatRequestData ).toMatchObject( {
				confirmed_base_version: '5',
				confirmed_state_hash: 'hash-5',
				has_pending_changes: false,
				confirmed_at_gmt: expect.any( String ),
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( serverContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				serverVersion: '5',
				clientBaseVersion: '5',
				clientBaseContent: serverContent,
				distributedEditingPostStateHash: 'hash-5',
				hasPendingChanges: false,
				pendingChangeCount: 0,
				presenceDocumentStateConfirmedBaseVersion: '5',
				presenceDocumentStateConfirmedStateHash: 'hash-5',
				presenceDocumentStatePublishedKey: '5:hash-5:clean:clean',
				presenceHeartbeatStatus:
					DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT,
				presenceHeartbeatCallsSave: false,
				presenceHeartbeatClaimsSaved: false,
				presenceRosterRefreshStatus:
					DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED,
				presenceRosterRefreshCallsSave: false,
				presenceRosterRefreshClaimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'keeps unsafe block review pending when server sync sees the safe body is current', async () => {
			const safeServerContent =
				'<!-- wp:paragraph --><p>Safe author edit.</p><!-- /wp:paragraph --><!-- wp:html -->\n<div>Original HTML.</div>\n<!-- /wp:html -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'Partial-safe review sync post',
				content: safeServerContent,
				status: 'draft',
			};
			let heartbeatRequestData;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					return {
						id: postId,
						type: 'post',
						content: {
							raw: safeServerContent,
						},
						state_hash: 'safe-hash-2',
						distributed_editing: {
							server_version: '2',
							state_hash: 'safe-hash-2',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					heartbeatRequestData = data;

					return {
						result: 'presence_heartbeat_recorded',
						rest_route: 'post_presence_heartbeat',
						writes_presence: true,
						records_presence_heartbeat: true,
						document_state: {
							available: true,
							confirmedBaseVersion: data.confirmed_base_version,
							confirmedStateHash: data.confirmed_state_hash,
							hasPendingChanges: data.has_pending_changes,
							confirmedAtGmt: data.confirmed_at_gmt,
							presenceUpdatedAtGmt: '2026-05-20 12:02:30',
							authoritativeForSave: false,
							claimsSaved: false,
							exposesRawContent: false,
						},
					};
				}

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				) {
					return {
						result: 'presence_roster_snapshot',
						rest_route: 'post_presence_roster',
						presence_roster: {
							status: 'active',
							freshness: 'current',
							visibleCount: 0,
							totalKnownCount: 0,
							claimsAbsence: false,
							entries: [],
						},
					};
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
			registry.dispatch( editorStore ).setupEditor( post );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '2',
					serverVersion: '2',
					clientBaseContent: safeServerContent,
					distributedEditingPostStateHash: 'safe-hash-2',
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
					pendingChangeCount: 1,
					hasPendingChanges: true,
					isAwaitingServerConfirmation: true,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewPendingCount: 1,
					riskyBlockReviewRawContentIncluded: false,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSyncDistributedEditingWithServer()
			).resolves.toMatchObject( {
				status: 'server_sync_current',
				serverVersion: '2',
				callsServerStateRefetchEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				callsAutosaveEndpoint: false,
			} );

			expect( heartbeatRequestData ).toMatchObject( {
				confirmed_base_version: '2',
				confirmed_state_hash: 'safe-hash-2',
				has_pending_changes: true,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				pendingChangeCount: 1,
				hasPendingChanges: true,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				riskyBlockReviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
				riskyBlockReviewPendingCount: 1,
				canExportLocalUpdates: false,
				mustOfferLocalCopy: false,
			} );
		} );

		it( 'refreshes the roster without publishing a false clean heartbeat when sync finds a conflict', async () => {
			const baseContent =
				'<!-- wp:paragraph --><p>Original paragraph.</p><!-- /wp:paragraph -->';
			const localContent =
				'<!-- wp:paragraph --><p>Local paragraph.</p><!-- /wp:paragraph -->';
			const serverContent =
				'<!-- wp:paragraph --><p>Server paragraph.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'Server sync conflict presence post',
				content: baseContent,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let heartbeatCalls = 0;
			let presenceSnapshotCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'GET' &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;

					return {
						id: postId,
						type: 'post',
						content: {
							raw: serverContent,
						},
						state_hash: 'hash-conflict-5',
						distributed_editing: {
							server_version: '5',
							state_hash: 'hash-conflict-5',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					heartbeatCalls++;
					throw {
						code: 'unexpected_heartbeat',
						message:
							'Conflicting Sync must not publish a clean document heartbeat.',
					};
				}

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				) {
					presenceSnapshotCalls++;

					return {
						result: 'presence_roster_snapshot',
						rest_route: 'post_presence_roster',
						presence_roster: {
							status: 'active',
							freshness: 'current',
							visibleCount: 1,
							totalKnownCount: 1,
							claimsAbsence: false,
							entries: [
								{
									key: 'presence-remote-conflict',
									displayName: 'Mira',
									identityVisibility: 'named',
									relationship: 'other_user',
									freshness: 'current',
									documentState: {
										available: true,
										confirmedBaseVersion: '5',
										confirmedStateHash: 'hash-conflict-5',
										hasPendingChanges: false,
										authoritativeForSave: false,
										claimsSaved: false,
										exposesRawContent: false,
									},
								},
							],
						},
						read_only: true,
						calls_save: false,
						saves_post: false,
						mutates_post_content: false,
						changes_post_lock: false,
						records_presence_heartbeat: false,
						enables_repeated_client_refresh: false,
						claims_saved: false,
					};
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
				content: localContent,
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '4',
					clientBaseContent: baseContent,
					distributedEditingPostStateHash: 'base-hash',
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					presenceDocumentStatePublishedKey:
						'4:base-hash:pending:dirty',
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSyncDistributedEditingWithServer( {
						suppressNotices: true,
					} )
			).resolves.toMatchObject( {
				status: 'server_sync_conflict',
				serverVersion: '5',
				callsServerStateRefetchEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				callsAutosaveEndpoint: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( heartbeatCalls ).toBe( 0 );
			expect( presenceSnapshotCalls ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( localContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				clientBaseVersion: '4',
				serverVersion: '4',
				hasPendingChanges: true,
				presenceDocumentStatePublishedKey: '4:base-hash:pending:dirty',
				presenceHeartbeatStatus:
					DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.NONE,
				presenceRosterRefreshStatus:
					DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED,
				presenceRosterRefreshCallsSave: false,
				presenceRosterRefreshClaimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
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
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_APPLIED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
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

		function setupImportEditor(
			initialContent = 'original content',
			{ postType = 'post', restBase = 'posts' } = {}
		) {
			const post = {
				id: postId,
				type: postType,
				title: 'bar',
				content: initialContent,
				status: 'draft',
			};
			const registry = createRegistryWithStores();

			if ( postType !== 'post' ) {
				registry.dispatch( coreStore ).addEntities( [
					{
						...postTypeConfig,
						name: postType,
						baseURL: `/wp/v2/${ restBase }`,
					},
				] );
				registry
					.dispatch( coreStore )
					.receiveEntityRecords( 'root', 'postType', [
						{
							...postTypeEntity,
							slug: postType,
							rest_base: restBase,
						},
					] );
			}

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', postType, post );
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

		it( 'routes imported fresh-review Save through retry-save with vaulted content after consume validation', async () => {
			const receiverContent =
				'<!-- wp:paragraph --><p>Receiving admin draft.</p><!-- /wp:paragraph -->';
			const registry = setupImportEditor( 'server original' );
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
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let retrySaveRequestData = null;

			registry.dispatch( editorStore ).editPost( {
				content: receiverContent,
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
					pendingChangeCount: 1,
					hasPendingChanges: true,
					isAwaitingServerConfirmation: true,
					canExportLocalUpdates: true,
					mustOfferLocalCopy: true,
				} );

			const importResult = await registry
				.dispatch( editorStore )
				.__experimentalImportDistributedEditingLocalUpdates(
					JSON.stringify( payload )
				);
			const importedSessionState = registry
				.select( editorStore )
				.getDistributedEditingSessionState();

			expect( importResult ).toMatchObject( {
				status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
				hasPostContent: false,
				mutatesEditorContent: false,
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( receiverContent );

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					...importedSessionState,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
					localUpdatesImportFreshReviewRequestRecordId:
						'fresh-review-request-123',
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
					localUpdatesImportFreshReviewDecisionStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
					localUpdatesImportFreshReviewDecisionResult:
						'fresh_review_decision_approved_for_retry_save',
					localUpdatesImportFreshReviewDecisionAccepted: true,
					localUpdatesImportFreshReviewDecisionSubmitted: true,
					localUpdatesImportFreshReviewDecisionDecision: 'approved',
					localUpdatesImportFreshReviewRetrySaveHandoffStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
					localUpdatesImportFreshReviewRetrySaveHandoffAccepted: true,
					localUpdatesImportFreshReviewRetrySaveHandoffServerVersion:
						'12',
					localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash:
						approvedPostContentHash,
					localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash:
						candidatePostContentHash,
					retrySaveFreshReviewConsumeValidationAccepted: true,
					retrySaveFreshReviewDecisionConsumptionValidated: true,
					retrySaveFreshReviewDecisionEligibleForRetrySave: true,
					retrySaveFreshReviewRequestRecordId:
						'fresh-review-request-123',
					retrySaveFreshReviewServerVersion: '12',
					retrySaveFreshReviewProposedContentHash:
						approvedPostContentHash,
					retrySaveFreshReviewCandidateContentHash:
						candidatePostContentHash,
					retrySaveFreshReviewHashEvidenceStatus: 'accepted',
				} );

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
						previous_server_version: '12',
						server_version: '13',
						pending_change_count: 0,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						fresh_review_decision_consumed: true,
						fresh_review_request_record_id:
							'fresh-review-request-123',
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

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'retry_save_submitted',
				callsRetrySaveAction: true,
				callsNormalSavePost: false,
			} );

			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( retrySaveRequestData ).toMatchObject( {
				client_base_version: '12',
				accepted_proof_server_version: '12',
				proposed_post_content: approvedPostContent,
				proposed_post_content_hash: approvedPostContentHash,
				accepted_fresh_review_decision: {
					fresh_review_request_record_id: 'fresh-review-request-123',
					server_version: '12',
					proposed_post_content_hash: approvedPostContentHash,
					candidate_post_content_hash: candidatePostContentHash,
					raw_content_included: false,
					exposes_raw_content: false,
					exposes_reviewer_ids: false,
					claims_saved: false,
				},
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( approvedPostContent );
		} );

		it( 'requests fresh admin review for imported local updates using hash-only page route evidence', async () => {
			const registry = setupImportEditor( 'original content', {
				postType: 'page',
				restBase: 'pages',
			} );
			const payload = getDistributedEditingLocalUpdatesExportPayload( {
				currentPost: {
					id: postId,
					type: 'page',
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

			await registry
				.dispatch( editorStore )
				.__experimentalImportDistributedEditingLocalUpdates(
					JSON.stringify( payload )
				);

			let apiCallCount = 0;
			apiFetch.setFetchHandler( async ( options ) => {
				apiCallCount++;

				expect( getMethod( options ) ).toBe( 'POST' );
				expect( options.path ).toContain(
					'/wp/v2/pages/44/distributed-editing/fresh-review-request'
				);
				expect( options.data ).toEqual( {
					client_base_version: '7',
					server_version: '12',
					pending_change_count: 1,
					proposed_post_content_hash: approvedPostContentHash,
					local_updates_import_status:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					local_updates_import_reason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					fresh_review_request_status:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.FRESH_REVIEW_REQUIRED,
					fresh_review_request_action: 'request_admin_review',
				} );
				expect( JSON.stringify( options.data ) ).not.toMatch(
					/proposed_post_content["':]|raw_post_content|proof_signature|reviewer_user_id|low_privileged_saver_user_id|reviewed_block_items/
				);

				return {
					result: 'fresh_review_request_accepted_for_admin_review',
					fresh_review_request_status: 'requested',
					fresh_review_request_action: 'request_admin_review',
					rest_route: 'post_fresh_review_request',
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				};
			} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates();

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
				result: 'fresh_review_request_accepted_for_admin_review',
				requested: true,
				accepted: true,
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
				callsFreshReviewRequestEndpoint: true,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				mutatesEditorContent: false,
				dispatchesNotice: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( apiCallCount ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'original content' );
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				localUpdatesImportReviewRequestStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
				localUpdatesImportReviewActionKey: null,
				localUpdatesImportFreshReviewRequestAccepted: true,
				localUpdatesImportFreshReviewRequestRequested: true,
				localUpdatesImportFreshReviewRequestRestRoute:
					'post_fresh_review_request',
				localUpdatesImportFreshReviewRequestClaimsSaved: false,
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptExposesRawContent: false,
				actionTranscriptExposesProofInternals: false,
				actionTranscriptExposesActorIds: false,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
				retrySaveClaimsSaved: false,
				canExportLocalUpdates: true,
			} );
		} );

		it( 'preserves local state after fresh-review request rejection without saving or content mutation', async () => {
			const registry = setupImportEditor();

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					serverVersion: '12',
					clientBaseVersion: '7',
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportPostId: String( postId ),
					localUpdatesImportPostType: 'post',
					localUpdatesImportVerifiedPostContentHash:
						approvedPostContentHash,
				} );

			let apiCallCount = 0;
			apiFetch.setFetchHandler( async ( options ) => {
				apiCallCount++;
				expect( options.path ).toContain(
					'/wp/v2/posts/44/distributed-editing/fresh-review-request'
				);

				throw {
					code: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
					data: {
						rest_route: 'post_fresh_review_request',
						fresh_review_request_action: 'request_admin_review',
					},
				};
			} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates()
			).rejects.toMatchObject( {
				code: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
			} );

			expect( apiCallCount ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'original content' );
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
				localUpdatesImportReviewRequestStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_PERMISSION_DENIED,
				localUpdatesImportReviewActionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
				localUpdatesImportFreshReviewRequestAccepted: false,
				localUpdatesImportFreshReviewRequestRequested: false,
				localUpdatesImportFreshReviewRequestClaimsSaved: false,
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptExposesRawContent: false,
				actionTranscriptExposesProofInternals: false,
				actionTranscriptExposesActorIds: false,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
				canExportLocalUpdates: true,
				mustOfferLocalCopy: true,
			} );
		} );

		it( 'records requested fresh-review approve and reject decisions without saving or transport', async () => {
			const registry = setupImportEditor();
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async () => {
				apiFetchCallCount++;
				throw new Error(
					'Fresh-review decision actions must not call apiFetch.'
				);
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
				} );

			const loadResult = await registry
				.dispatch( editorStore )
				.__experimentalLoadDistributedEditingFreshReviewDecisionItems( [
					{
						id: 'fresh-approve',
						blockLabel: 'Approve HTML change',
						proposedContentHash: approvedPostContentHash,
						rawBlockContent: '<script>do not leak</script>',
					},
					{
						id: 'fresh-reject',
						blockLabel: 'Reject HTML change',
						proposedContentHash: candidatePostContentHash,
						rawBlockContent:
							'<script>do not leak rejected</script>',
					},
				] );
			const approveResult = await registry
				.dispatch( editorStore )
				.__experimentalResolveDistributedEditingFreshReviewDecisionItem(
					{
						reviewItemId: 'fresh-approve',
						decision: 'approved',
					}
				);
			const rejectResult = await registry
				.dispatch( editorStore )
				.__experimentalResolveDistributedEditingFreshReviewDecisionItem(
					{
						reviewItemId: 'fresh-reject',
						decision: 'rejected',
						rejectionReason: 'unsafe_script_change',
					}
				);

			expect( loadResult ).toMatchObject( {
				status: DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
				loadsDecisionItems: true,
				reviewItemCount: 2,
				pendingReviewItemCount: 2,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( approveResult ).toMatchObject( {
				status: 'fresh_review_decision_item_resolved',
				reviewItemId: 'fresh-approve',
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
				decisionReady: false,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( rejectResult ).toMatchObject( {
				status: 'fresh_review_decision_item_resolved',
				reviewItemId: 'fresh-reject',
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
				pendingReviewItemCount: 0,
				approvedReviewItemCount: 1,
				rejectedReviewItemCount: 1,
				decisionReady: true,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( apiFetchCallCount ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'original content' );
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingFreshReviewDecisionState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY,
				ready: true,
				reviewedBlockItemCount: 2,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );
			expect(
				JSON.stringify(
					registry
						.select( editorStore )
						.getDistributedEditingFreshReviewDecisionState()
				)
			).not.toContain( '<script>do not leak' );
		} );

		it( 'submits a fresh-review decision to the proof endpoint without saving or raw content', async () => {
			const registry = setupImportEditor();

			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					serverVersion: '12',
					clientBaseVersion: '7',
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportPostId: String( postId ),
					localUpdatesImportPostType: 'post',
					localUpdatesImportVerifiedPostContentHash:
						approvedPostContentHash,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
					localUpdatesImportFreshReviewRequestRecordId:
						'fresh-review-request-123',
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
				} );
			await registry
				.dispatch( editorStore )
				.__experimentalLoadDistributedEditingFreshReviewDecisionItems( [
					{
						id: 'fresh-approve',
						blockLabel: 'Approve HTML change',
						proposedContentHash: candidatePostContentHash,
						rawBlockContent: '<script>do not submit raw</script>',
					},
				] );
			await registry
				.dispatch( editorStore )
				.__experimentalResolveDistributedEditingFreshReviewDecisionItem(
					{
						reviewItemId: 'fresh-approve',
						decision: 'approved',
					}
				);

			let apiCallCount = 0;
			apiFetch.setFetchHandler( async ( options ) => {
				apiCallCount++;

				expect( getMethod( options ) ).toBe( 'POST' );
				expect( options.path ).toContain(
					'/wp/v2/posts/44/distributed-editing/fresh-review-decision'
				);
				expect( options.data ).toEqual( {
					fresh_review_decision: 'approved',
					reviewed_block_items: [
						{
							id: 'fresh-approve',
							base_content_hash: null,
							block_label: 'Approve HTML change',
							block_path: [],
							content_review_policy: 'kses',
							kses_filtered_content_hash: null,
							proposed_content_hash: candidatePostContentHash,
							reviewed_proposed_content_hash:
								candidatePostContentHash,
							review_status:
								DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
							review_evidence_type: 'kses_block_hash_only_change',
							raw_content_included: false,
							exposes_raw_content: false,
						},
					],
					fresh_review_request_record_id: 'fresh-review-request-123',
					client_base_version: '7',
					server_version: '12',
					proposed_post_content_hash: approvedPostContentHash,
					reviewed_proposed_content_hash: approvedPostContentHash,
				} );
				expect( JSON.stringify( options.data ) ).not.toMatch(
					/proposed_post_content["':]|raw_post_content|proof_signature|reviewer_user_id|do not submit raw/
				);

				return {
					result: 'fresh_review_decision_approved_for_retry_save',
					fresh_review_decision: 'approved',
					fresh_review_request_status: 'decision_recorded',
					fresh_review_request_record_id: 'fresh-review-request-123',
					rest_route: 'post_fresh_review_decision',
					server_version: '12',
					client_base_version: '7',
					pending_change_count: 1,
					reviewed_block_item_count: 1,
					fresh_review_decision_accepted: true,
				};
			} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalSubmitDistributedEditingFreshReviewDecision();

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
				result: 'fresh_review_decision_approved_for_retry_save',
				decision: 'approved',
				accepted: true,
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
				callsFreshReviewDecisionEndpoint: true,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				savesPost: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( apiCallCount ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'original content' );
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingFreshReviewDecisionState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
				result: 'fresh_review_decision_approved_for_retry_save',
				decision: 'approved',
				accepted: true,
				decisionSubmitted: true,
				ready: true,
				reviewedBlockItemCount: 1,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptExposesRawContent: false,
				actionTranscriptExposesProofInternals: false,
				actionTranscriptExposesActorIds: false,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
		} );

		it( 'prepares fresh-review retry-save handoff validation without transport or saves', async () => {
			const registry = setupImportEditor();
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async () => {
				apiFetchCallCount++;
				throw new Error(
					'Fresh-review retry-save handoff validation must not call apiFetch.'
				);
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					serverVersion: '12',
					clientBaseVersion: '7',
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
					localUpdatesImportFreshReviewRequestRecordId:
						'fresh-review-request-123',
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
					localUpdatesImportFreshReviewDecisionStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
					localUpdatesImportFreshReviewDecisionResult:
						'fresh_review_decision_approved_for_retry_save',
					localUpdatesImportFreshReviewDecisionAccepted: true,
					localUpdatesImportFreshReviewDecisionSubmitted: true,
					localUpdatesImportFreshReviewDecisionDecision: 'approved',
					localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalPrepareDistributedEditingFreshReviewRetrySaveHandoffValidation(
					{
						result: 'fresh_review_decision_handoff_validated_for_retry_save',
						fresh_review_retry_save_handoff_accepted: true,
						raw_content:
							'<script>do not leak validation raw</script>',
						proof_signature: 'do-not-leak-validation-proof',
					}
				);

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
				result: 'fresh_review_decision_handoff_validated_for_retry_save',
				accepted: true,
				callsFreshReviewValidationEndpoint: false,
				callsFreshReviewDecisionEndpoint: false,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				savesPost: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				exposesRawContent: false,
				exposesProofSignature: false,
			} );
			expect( apiFetchCallCount ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'original content' );
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect(
				JSON.stringify(
					registry
						.select( editorStore )
						.getDistributedEditingFreshReviewRetrySaveHandoffState()
				)
			).not.toMatch(
				/do not leak validation raw|do-not-leak-validation-proof/
			);
		} );

		it( 'validates fresh-review retry-save handoff through the server without saving', async () => {
			const proposedHash =
				'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
			const registry = setupImportEditor( 'original content', {
				postType: 'page',
				restBase: 'pages',
			} );
			let apiFetchCallCount = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				apiFetchCallCount++;
				expect( options.path ).toMatch(
					new RegExp(
						`^/wp/v2/pages/${ postId }/distributed-editing/fresh-review-consume`
					)
				);
				expect( options.method ).toBe( 'POST' );
				expect( options.data ).toEqual( {
					fresh_review_request_record_id: 'fresh-review-request-123',
					client_base_version: '12',
					server_version: '12',
					proposed_post_content_hash: proposedHash,
					reviewed_proposed_content_hash: proposedHash,
				} );
				expect( options.data.proposed_post_content ).toBeUndefined();
				expect( options.data.raw_content ).toBeUndefined();
				expect( options.data.review_approval_proof ).toBeUndefined();

				return {
					result: 'fresh_review_decision_eligible_for_retry_save_handoff',
					rest_route: 'post_fresh_review_consume',
					fresh_review_decision_consumption_validated: true,
					fresh_review_decision_eligible_for_retry_save: true,
					client_base_version: '12',
					server_version: '12',
					raw_content:
						'<script>do not leak consume validation raw</script>',
					proof_signature: 'do-not-leak-consume-proof',
				};
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					serverVersion: '12',
					clientBaseVersion: '7',
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportPostId: String( postId ),
					localUpdatesImportPostType: 'page',
					localUpdatesImportVerifiedPostContentHash: proposedHash,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
					localUpdatesImportFreshReviewRequestRecordId:
						'fresh-review-request-123',
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
					localUpdatesImportFreshReviewDecisionStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
					localUpdatesImportFreshReviewDecisionResult:
						'fresh_review_decision_approved_for_retry_save',
					localUpdatesImportFreshReviewDecisionAccepted: true,
					localUpdatesImportFreshReviewDecisionSubmitted: true,
					localUpdatesImportFreshReviewDecisionDecision: 'approved',
					localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
				} );

			const result = await registry
				.dispatch( editorStore )
				.__experimentalValidateDistributedEditingFreshReviewRetrySaveHandoff();

			expect( result ).toMatchObject( {
				status: DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
				result: 'fresh_review_decision_eligible_for_retry_save_handoff',
				accepted: true,
				callsFreshReviewValidationEndpoint: true,
				callsFreshReviewDecisionEndpoint: false,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				savesPost: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				exposesRawContent: false,
				exposesProofSignature: false,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
			expect( result.sessionState ).toMatchObject( {
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptExposesRawContent: false,
				actionTranscriptExposesProofInternals: false,
				actionTranscriptExposesActorIds: false,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
			expect( apiFetchCallCount ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( 'original content' );
			expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
				false
			);
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect(
				JSON.stringify(
					registry
						.select( editorStore )
						.getDistributedEditingFreshReviewRetrySaveHandoffState()
				)
			).not.toMatch(
				/do not leak consume validation raw|do-not-leak-consume-proof/
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
					actionTranscriptItemCount: 1,
					actionTranscriptLatestEventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_STAGED,
					actionTranscriptEntriesRedacted: true,
					actionTranscriptCallsSave: false,
					actionTranscriptClaimsSaved: false,
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
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_STAGED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
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
					client_base_version: '7',
					server_version: '7',
					rebased_from_version: '4',
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
				clientBaseVersion: '4',
				serverVersion: '7',
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
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
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
					actionTranscriptItemCount: 1,
					actionTranscriptLatestEventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_PREPARED,
					actionTranscriptEntriesRedacted: true,
					actionTranscriptCallsSave: false,
					actionTranscriptClaimsSaved: false,
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
				registry.select( editorStore ).getCurrentPost()
			).toMatchObject( {
				content: proposedPostContent,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				reasonCode: null,
				clientBaseVersion: '8',
				clientBaseContent: null,
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
				actionTranscriptItemCount: 2,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
		} );

		it( 'attaches current-base block identity request proof to guarded retry-save', async () => {
			const { createHash, webcrypto } = require( 'crypto' );
			const { TextEncoder } = require( 'util' );
			const originalCrypto = globalThis.crypto;
			const originalTextEncoder = globalThis.TextEncoder;
			const hashContent = ( content ) =>
				createHash( 'sha256' ).update( content ).digest( 'hex' );
			const baseBlocks = [
				'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
				'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
			];
			const insertedBlock =
				'<!-- wp:paragraph -->\n<p>Inserted</p>\n<!-- /wp:paragraph -->';
			const proposedPostContent = [
				baseBlocks[ 0 ],
				insertedBlock,
				baseBlocks[ 1 ],
			].join( '\n\n' );
			const proposedPostContentHash = hashContent( proposedPostContent );
			const insertedBlockHash = hashContent( insertedBlock );
			const acceptedSyncMeta = {
				schema: 'de-rtc-block-identity-v1',
				document_uuid: 'doc-turn-0368',
				version: '41',
				content_hash: hashContent( baseBlocks.join( '\n\n' ) ),
				blocks: baseBlocks.map( ( serializedBlock, index ) => ( {
					block_uid: index === 0 ? 'block-a' : 'block-b',
					parent_uid: null,
					block_name: 'core/paragraph',
					ordinal_path: [ index ],
					serialized_hash: hashContent( serializedBlock ),
				} ) ),
			};
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: baseBlocks.join( '\n\n' ),
				status: 'draft',
			};
			let retrySaveRequestData;

			Object.defineProperty( globalThis, 'TextEncoder', {
				configurable: true,
				value: originalTextEncoder || TextEncoder,
			} );
			Object.defineProperty( globalThis, 'crypto', {
				configurable: true,
				value: webcrypto,
			} );

			try {
				apiFetch.setFetchHandler( async ( options ) => {
					const { path, method, data } = options;

					expect( method ).toBe( 'POST' );
					expect( path ).toMatch(
						new RegExp(
							`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
						)
					);
					retrySaveRequestData = data;
					expect( data ).toMatchObject( {
						client_base_version: '41',
						accepted_proof_server_version: '41',
						rebased_from_version: '37',
						pending_change_count: 1,
						proposed_post_content: proposedPostContent,
						proposed_post_content_hash: proposedPostContentHash,
						block_identity_request_proof: {
							client_base_version: '41',
							proposed_post_content_hash: proposedPostContentHash,
							retained_block_uids: [ 'block-a', 'block-b' ],
							inserted_block_nonces: [
								`inserted-1-${ insertedBlockHash.slice(
									0,
									16
								) }`,
							],
							deleted_block_uids: [],
							moved_block_uids: [ 'block-b' ],
						},
					} );
					expect(
						data.block_identity_request_proof.proposed_block_map
					).toEqual( [
						expect.objectContaining( {
							block_uid: 'block-a',
							block_name: 'core/paragraph',
							ordinal_path: [ 0 ],
						} ),
						expect.objectContaining( {
							inserted_block_nonce: `inserted-1-${ insertedBlockHash.slice(
								0,
								16
							) }`,
							block_name: 'core/paragraph',
							ordinal_path: [ 1 ],
						} ),
						expect.objectContaining( {
							block_uid: 'block-b',
							block_name: 'core/paragraph',
							ordinal_path: [ 2 ],
						} ),
					] );
					expect(
						data.block_identity_request_proof.proposed_post_content
					).toBeUndefined();
					expect(
						data.block_identity_request_proof.raw_content
					).toBeUndefined();
					expect(
						data.block_identity_request_proof.client_id
					).toBeUndefined();
					expect(
						JSON.stringify( data.block_identity_request_proof )
					).not.toMatch(
						/postContent|rawContent|raw_content|blockContent|block_content|clientId|client_id|Alpha|Bravo|Inserted/
					);

					return {
						result: 'retry_save_applied',
						retry_save_accepted: true,
						previous_server_version: '41',
						server_version: '42',
						pending_change_count: 1,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						revision_created: true,
						created_revision_ids: [ 7042 ],
					};
				} );

				const registry = createRegistryWithStores();

				registry
					.dispatch( coreStore )
					.receiveEntityRecords( 'postType', 'post', post );
				registry.dispatch( editorStore ).setupEditor( post, {
					content: post.content,
				} );
				registry.dispatch( editorStore ).editPost( {
					content: proposedPostContent,
				} );
				registry
					.dispatch( editorStore )
					.setDistributedEditingSessionState( {
						clientBaseVersion: '37',
						serverVersion: '41',
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
						.__experimentalSaveDistributedEditingRetryAfterProof( {
							acceptedBlockIdentitySyncMeta: acceptedSyncMeta,
						} )
				).resolves.toMatchObject( {
					result: 'retry_save_applied',
					retry_save_accepted: true,
				} );

				expect( retrySaveRequestData ).toBeTruthy();
				expect(
					registry.select( editorStore ).getEditedPostContent()
				).toBe( proposedPostContent );
			} finally {
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
			}
		} );

		it( 'attaches stale-server block identity request proof when refetched server content still matches the accepted base', async () => {
			const { createHash, webcrypto } = require( 'crypto' );
			const { TextEncoder } = require( 'util' );
			const originalCrypto = globalThis.crypto;
			const originalTextEncoder = globalThis.TextEncoder;
			const hashContent = ( content ) =>
				createHash( 'sha256' ).update( content ).digest( 'hex' );
			const baseBlocks = [
				'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
				'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
			];
			const basePostContent = baseBlocks.join( '\n\n' );
			const insertedBlock =
				'<!-- wp:paragraph -->\n<p>Inserted</p>\n<!-- /wp:paragraph -->';
			const proposedPostContent = [
				baseBlocks[ 0 ],
				insertedBlock,
				baseBlocks[ 1 ],
			].join( '\n\n' );
			const proposedPostContentHash = hashContent( proposedPostContent );
			const insertedBlockHash = hashContent( insertedBlock );
			const acceptedSyncMeta = {
				schema: 'de-rtc-block-identity-v1',
				document_uuid: 'doc-turn-0371',
				version: '41',
				content_hash: hashContent( basePostContent ),
				blocks: baseBlocks.map( ( serializedBlock, index ) => ( {
					block_uid: index === 0 ? 'block-a' : 'block-b',
					parent_uid: null,
					block_name: 'core/paragraph',
					ordinal_path: [ index ],
					serialized_hash: hashContent( serializedBlock ),
				} ) ),
			};
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: basePostContent,
				status: 'draft',
			};
			let retrySaveRequestData;

			Object.defineProperty( globalThis, 'TextEncoder', {
				configurable: true,
				value: originalTextEncoder || TextEncoder,
			} );
			Object.defineProperty( globalThis, 'crypto', {
				configurable: true,
				value: webcrypto,
			} );

			try {
				apiFetch.setFetchHandler( async ( options ) => {
					const { path, method, data } = options;

					expect( method ).toBe( 'POST' );
					expect( path ).toMatch(
						new RegExp(
							`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
						)
					);
					retrySaveRequestData = data;
					expect( data ).toMatchObject( {
						client_base_version: '41',
						accepted_proof_server_version: '41',
						rebased_from_version: '37',
						pending_change_count: 1,
						proposed_post_content: proposedPostContent,
						proposed_post_content_hash: proposedPostContentHash,
						block_identity_request_proof: {
							client_base_version: '41',
							proposed_post_content_hash: proposedPostContentHash,
							retained_block_uids: [ 'block-a', 'block-b' ],
							inserted_block_nonces: [
								`inserted-1-${ insertedBlockHash.slice(
									0,
									16
								) }`,
							],
							deleted_block_uids: [],
							moved_block_uids: [ 'block-b' ],
						},
					} );
					expect(
						data.block_identity_request_proof.proposed_block_map
					).toEqual( [
						expect.objectContaining( {
							block_uid: 'block-a',
							ordinal_path: [ 0 ],
						} ),
						expect.objectContaining( {
							inserted_block_nonce: `inserted-1-${ insertedBlockHash.slice(
								0,
								16
							) }`,
							ordinal_path: [ 1 ],
						} ),
						expect.objectContaining( {
							block_uid: 'block-b',
							ordinal_path: [ 2 ],
						} ),
					] );
					expect(
						JSON.stringify( data.block_identity_request_proof )
					).not.toMatch(
						/postContent|rawContent|raw_content|blockContent|block_content|clientId|client_id|Alpha|Bravo|Inserted/
					);

					return {
						result: 'retry_save_server_merged',
						retry_save_accepted: true,
						previous_server_version: '42',
						server_version: '43',
						pending_change_count: 1,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						revision_created: true,
						created_revision_ids: [ 7043 ],
						server_merge_applied: true,
						server_merge: {
							merge_status: 'merged',
							merge_strategy:
								'top_level_serialized_block_identity_map',
							base_version: '41',
							server_version: '42',
							block_identity_base_current_match: true,
						},
					};
				} );

				const registry = createRegistryWithStores();

				registry
					.dispatch( coreStore )
					.receiveEntityRecords( 'postType', 'post', post );
				registry.dispatch( editorStore ).setupEditor( post, {
					content: post.content,
				} );
				registry.dispatch( editorStore ).editPost( {
					content: proposedPostContent,
				} );
				registry
					.dispatch( editorStore )
					.setDistributedEditingSessionState( {
						clientBaseVersion: '37',
						serverVersion: '42',
						clientBaseContent: basePostContent,
						refetchedServerState: true,
						refetchedServerContent: basePostContent,
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
						.__experimentalSaveDistributedEditingRetryAfterProof( {
							acceptedBlockIdentitySyncMeta: acceptedSyncMeta,
							clientBaseVersion: '41',
							acceptedProofServerVersion: '41',
						} )
				).resolves.toMatchObject( {
					result: 'retry_save_server_merged',
					retry_save_accepted: true,
				} );

				expect( retrySaveRequestData ).toBeTruthy();
			} finally {
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
			}
		} );

		it( 'attaches stale-server block identity request proof for non-conflicting retained block edits', async () => {
			const { createHash, webcrypto } = require( 'crypto' );
			const { TextEncoder } = require( 'util' );
			const originalCrypto = globalThis.crypto;
			const originalTextEncoder = globalThis.TextEncoder;
			const hashContent = ( content ) =>
				createHash( 'sha256' ).update( content ).digest( 'hex' );
			const baseBlocks = [
				'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
				'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
			];
			const basePostContent = baseBlocks.join( '\n\n' );
			const serverEditedBlock =
				'<!-- wp:paragraph -->\n<p><em>Alpha</em></p>\n<!-- /wp:paragraph -->';
			const refetchedServerContent = [
				serverEditedBlock,
				baseBlocks[ 1 ],
			].join( '\n\n' );
			const localEditedBlock =
				'<!-- wp:paragraph -->\n<p><strong>Bravo</strong></p>\n<!-- /wp:paragraph -->';
			const proposedPostContent = [
				baseBlocks[ 0 ],
				localEditedBlock,
			].join( '\n\n' );
			const proposedPostContentHash = hashContent( proposedPostContent );
			const acceptedSyncMeta = {
				schema: 'de-rtc-block-identity-v1',
				document_uuid: 'doc-turn-0500',
				version: '41',
				content_hash: hashContent( basePostContent ),
				blocks: baseBlocks.map( ( serializedBlock, index ) => ( {
					block_uid: index === 0 ? 'block-a' : 'block-b',
					parent_uid: null,
					block_name: 'core/paragraph',
					ordinal_path: [ index ],
					serialized_hash: hashContent( serializedBlock ),
				} ) ),
			};
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: basePostContent,
				status: 'draft',
			};
			let retrySaveRequestData;

			Object.defineProperty( globalThis, 'TextEncoder', {
				configurable: true,
				value: originalTextEncoder || TextEncoder,
			} );
			Object.defineProperty( globalThis, 'crypto', {
				configurable: true,
				value: webcrypto,
			} );

			try {
				apiFetch.setFetchHandler( async ( options ) => {
					const { path, method, data } = options;

					expect( method ).toBe( 'POST' );
					expect( path ).toMatch(
						new RegExp(
							`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
						)
					);
					retrySaveRequestData = data;
					expect( data ).toMatchObject( {
						client_base_version: '41',
						accepted_proof_server_version: '41',
						rebased_from_version: '37',
						pending_change_count: 1,
						proposed_post_content: proposedPostContent,
						proposed_post_content_hash: proposedPostContentHash,
						block_identity_request_proof: {
							client_base_version: '41',
							proposed_post_content_hash: proposedPostContentHash,
							retained_block_uids: [ 'block-a', 'block-b' ],
							inserted_block_nonces: [],
							deleted_block_uids: [],
							moved_block_uids: [],
						},
					} );
					expect(
						data.block_identity_request_proof.proposed_block_map
					).toEqual( [
						expect.objectContaining( {
							block_uid: 'block-a',
							ordinal_path: [ 0 ],
						} ),
						expect.objectContaining( {
							block_uid: 'block-b',
							ordinal_path: [ 1 ],
						} ),
					] );
					expect(
						JSON.stringify( data.block_identity_request_proof )
					).not.toMatch(
						/postContent|rawContent|raw_content|blockContent|block_content|clientId|client_id|Alpha|Bravo|strong|em/
					);

					return {
						result: 'retry_save_server_merged',
						retry_save_accepted: true,
						previous_server_version: '42',
						server_version: '43',
						pending_change_count: 1,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						revision_created: true,
						created_revision_ids: [ 7050 ],
						server_merge_applied: true,
						server_merge: {
							merge_status: 'merged',
							merge_strategy:
								'top_level_serialized_block_identity_map',
							base_version: '41',
							server_version: '42',
							block_identity_base_current_match: false,
							block_identity_base_current_retained_edits_only: true,
							server_changed_indexes: [ 0 ],
							local_changed_indexes: [ 1 ],
						},
					};
				} );

				const registry = createRegistryWithStores();

				registry
					.dispatch( coreStore )
					.receiveEntityRecords( 'postType', 'post', post );
				registry.dispatch( editorStore ).setupEditor( post, {
					content: post.content,
				} );
				registry.dispatch( editorStore ).editPost( {
					content: proposedPostContent,
				} );
				registry
					.dispatch( editorStore )
					.setDistributedEditingSessionState( {
						clientBaseVersion: '37',
						serverVersion: '42',
						clientBaseContent: basePostContent,
						refetchedServerState: true,
						refetchedServerContent,
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
						.__experimentalSaveDistributedEditingRetryAfterProof( {
							acceptedBlockIdentitySyncMeta: acceptedSyncMeta,
							clientBaseVersion: '41',
							acceptedProofServerVersion: '41',
						} )
				).resolves.toMatchObject( {
					result: 'retry_save_server_merged',
					retry_save_accepted: true,
				} );

				expect( retrySaveRequestData ).toBeTruthy();
			} finally {
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
			}
		} );

		it( 'attaches stale-server block identity request proof for refetched distinct-gap insertions', async () => {
			const { createHash, webcrypto } = require( 'crypto' );
			const { TextEncoder } = require( 'util' );
			const originalCrypto = globalThis.crypto;
			const originalTextEncoder = globalThis.TextEncoder;
			const hashContent = ( content ) =>
				createHash( 'sha256' ).update( content ).digest( 'hex' );
			const baseBlocks = [
				'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
				'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
				'<!-- wp:paragraph -->\n<p>Charlie</p>\n<!-- /wp:paragraph -->',
			];
			const basePostContent = baseBlocks.join( '\n\n' );
			const serverInsertedBlock =
				'<!-- wp:paragraph -->\n<p>Server insert</p>\n<!-- /wp:paragraph -->';
			const refetchedServerContent = [
				baseBlocks[ 0 ],
				serverInsertedBlock,
				baseBlocks[ 1 ],
				baseBlocks[ 2 ],
			].join( '\n\n' );
			const localInsertedBlock =
				'<!-- wp:paragraph -->\n<p>Local insert</p>\n<!-- /wp:paragraph -->';
			const proposedPostContent = [
				baseBlocks[ 0 ],
				baseBlocks[ 1 ],
				baseBlocks[ 2 ],
				localInsertedBlock,
			].join( '\n\n' );
			const proposedPostContentHash = hashContent( proposedPostContent );
			const localInsertedBlockHash = hashContent( localInsertedBlock );
			const acceptedSyncMeta = {
				schema: 'de-rtc-block-identity-v1',
				document_uuid: 'doc-turn-0378',
				version: '41',
				content_hash: hashContent( basePostContent ),
				blocks: baseBlocks.map( ( serializedBlock, index ) => ( {
					block_uid: [ 'block-a', 'block-b', 'block-c' ][ index ],
					parent_uid: null,
					block_name: 'core/paragraph',
					ordinal_path: [ index ],
					serialized_hash: hashContent( serializedBlock ),
				} ) ),
			};
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: basePostContent,
				status: 'draft',
			};
			let retrySaveRequestData;

			Object.defineProperty( globalThis, 'TextEncoder', {
				configurable: true,
				value: originalTextEncoder || TextEncoder,
			} );
			Object.defineProperty( globalThis, 'crypto', {
				configurable: true,
				value: webcrypto,
			} );

			try {
				apiFetch.setFetchHandler( async ( options ) => {
					const { path, method, data } = options;

					expect( method ).toBe( 'POST' );
					expect( path ).toMatch(
						new RegExp(
							`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
						)
					);
					retrySaveRequestData = data;
					expect( data ).toMatchObject( {
						client_base_version: '41',
						accepted_proof_server_version: '41',
						rebased_from_version: '37',
						pending_change_count: 1,
						proposed_post_content: proposedPostContent,
						proposed_post_content_hash: proposedPostContentHash,
						block_identity_request_proof: {
							client_base_version: '41',
							proposed_post_content_hash: proposedPostContentHash,
							retained_block_uids: [
								'block-a',
								'block-b',
								'block-c',
							],
							inserted_block_nonces: [
								`inserted-3-${ localInsertedBlockHash.slice(
									0,
									16
								) }`,
							],
							deleted_block_uids: [],
							moved_block_uids: [],
						},
					} );
					expect(
						data.block_identity_request_proof.proposed_block_map
					).toEqual( [
						expect.objectContaining( {
							block_uid: 'block-a',
							ordinal_path: [ 0 ],
						} ),
						expect.objectContaining( {
							block_uid: 'block-b',
							ordinal_path: [ 1 ],
						} ),
						expect.objectContaining( {
							block_uid: 'block-c',
							ordinal_path: [ 2 ],
						} ),
						expect.objectContaining( {
							inserted_block_nonce: `inserted-3-${ localInsertedBlockHash.slice(
								0,
								16
							) }`,
							ordinal_path: [ 3 ],
						} ),
					] );
					expect(
						JSON.stringify( data.block_identity_request_proof )
					).not.toMatch(
						/postContent|rawContent|raw_content|blockContent|block_content|clientId|client_id|Alpha|Bravo|Charlie|Server insert|Local insert/
					);

					return {
						result: 'retry_save_server_merged',
						retry_save_accepted: true,
						previous_server_version: '42',
						server_version: '43',
						pending_change_count: 1,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						revision_created: true,
						created_revision_ids: [ 7045 ],
						server_merge_applied: true,
						server_merge: {
							merge_status: 'merged',
							merge_strategy:
								'top_level_serialized_block_identity_map',
							base_version: '41',
							server_version: '42',
							block_identity_base_current_match: false,
							block_identity_base_current_insertions_only: true,
							block_identity_server_inserted_indexes: [ 1 ],
							block_identity_inserted_indexes: [ 3 ],
						},
					};
				} );

				const registry = createRegistryWithStores();

				registry
					.dispatch( coreStore )
					.receiveEntityRecords( 'postType', 'post', post );
				registry.dispatch( editorStore ).setupEditor( post, {
					content: post.content,
				} );
				registry.dispatch( editorStore ).editPost( {
					content: proposedPostContent,
				} );
				registry
					.dispatch( editorStore )
					.setDistributedEditingSessionState( {
						clientBaseVersion: '37',
						serverVersion: '42',
						clientBaseContent: basePostContent,
						refetchedServerState: true,
						refetchedServerContent,
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
						.__experimentalSaveDistributedEditingRetryAfterProof( {
							acceptedBlockIdentitySyncMeta: acceptedSyncMeta,
							clientBaseVersion: '41',
							acceptedProofServerVersion: '41',
						} )
				).resolves.toMatchObject( {
					result: 'retry_save_server_merged',
					retry_save_accepted: true,
				} );

				expect( retrySaveRequestData ).toBeTruthy();
			} finally {
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
			}
		} );

		it( 'omits stale-server block identity request proof when refetched server content drifted from the accepted base', async () => {
			const { createHash } = require( 'crypto' );
			const hashContent = ( content ) =>
				createHash( 'sha256' ).update( content ).digest( 'hex' );
			const baseBlocks = [
				'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
				'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
			];
			const basePostContent = baseBlocks.join( '\n\n' );
			const refetchedServerContent = [
				baseBlocks[ 0 ],
				'<!-- wp:paragraph -->\n<p>Server drift</p>\n<!-- /wp:paragraph -->',
			].join( '\n\n' );
			const proposedPostContent = [
				baseBlocks[ 0 ],
				'<!-- wp:paragraph -->\n<p>Inserted</p>\n<!-- /wp:paragraph -->',
				baseBlocks[ 1 ],
			].join( '\n\n' );
			const proposedPostContentHash =
				'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
			const acceptedSyncMeta = {
				schema: 'de-rtc-block-identity-v1',
				document_uuid: 'doc-turn-0371',
				version: '41',
				content_hash: hashContent( basePostContent ),
				blocks: baseBlocks.map( ( serializedBlock, index ) => ( {
					block_uid: index === 0 ? 'block-a' : 'block-b',
					parent_uid: null,
					block_name: 'core/paragraph',
					ordinal_path: [ index ],
					serialized_hash: hashContent( serializedBlock ),
				} ) ),
			};
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: basePostContent,
				status: 'draft',
			};
			let retrySaveRequestData;

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				);
				retrySaveRequestData = data;
				expect( data ).toMatchObject( {
					client_base_version: '41',
					accepted_proof_server_version: '41',
					rebased_from_version: '37',
					pending_change_count: 1,
					proposed_post_content: proposedPostContent,
					proposed_post_content_hash: proposedPostContentHash,
				} );
				expect( data.block_identity_request_proof ).toBeUndefined();

				return {
					result: 'retry_save_applied',
					retry_save_accepted: true,
					previous_server_version: '42',
					server_version: '43',
					pending_change_count: 1,
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
					revision_created: true,
					created_revision_ids: [ 7044 ],
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: post.content,
			} );
			registry.dispatch( editorStore ).editPost( {
				content: proposedPostContent,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '37',
					serverVersion: '42',
					clientBaseContent: basePostContent,
					refetchedServerState: true,
					refetchedServerContent,
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
					.__experimentalSaveDistributedEditingRetryAfterProof( {
						acceptedBlockIdentitySyncMeta: acceptedSyncMeta,
						clientBaseVersion: '41',
						acceptedProofServerVersion: '41',
						proposedPostContentHash,
					} )
			).resolves.toMatchObject( {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			} );

			expect( retrySaveRequestData ).toBeTruthy();
		} );

		it( 'refetches confirmed client-side auto-merged retry-save content after stale-base rebase', async () => {
			const localPostContent =
				'<!-- wp:paragraph --><p>Local alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->';
			const proposedPostContent =
				'<!-- wp:paragraph --><p>Local alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'1111111111111111111111111111111111111111111111111111111111111111';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: localPostContent,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					return {
						...post,
						content: {
							raw: `${ proposedPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"8"}</script>`,
						},
						distributed_editing: {
							server_version: '8',
						},
					};
				}

				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				);
				expect( data.proposed_post_content ).toBe(
					proposedPostContent
				);

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
					pendingChangeCount: 1,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
					refetchedServerContent:
						'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta.</p><!-- /wp:paragraph -->',
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
						proposedPostContent,
						proposedPostContentHash,
					} )
			).resolves.toMatchObject( {
				result: 'retry_save_applied',
				retry_save_accepted: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( proposedPostContent );
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

		it( 'aligns confirmed server-merged retry-save writes to refetched post content', async () => {
			const proposedPostContent =
				'<!-- wp:paragraph --><p>Local paragraph.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base paragraph.</p><!-- /wp:paragraph -->';
			const serverMergedPostContent =
				'<!-- wp:paragraph --><p>Local paragraph.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote paragraph.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: proposedPostContent,
				status: 'draft',
			};
			let retrySaveRequestData;
			let serverStateRefetchCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					return {
						...post,
						content: {
							raw: `${ serverMergedPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"8"}</script>`,
						},
						distributed_editing: {
							server_version: '8',
						},
					};
				}

				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				);
				retrySaveRequestData = data;
				expect( data.proposed_post_content ).toBe(
					proposedPostContent
				);

				return {
					result: 'retry_save_server_merged',
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
					server_merge_applied: true,
					server_merge: {
						merge_status: 'merged',
						merge_strategy: 'top_level_serialized_block_three_way',
						base_version: '4',
						server_version: '7',
						block_count: 2,
						server_changed_indexes: [ 1 ],
						local_changed_indexes: [ 0 ],
						merged_stripped_content_hash:
							'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
					},
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
				result: 'retry_save_server_merged',
				retry_save_accepted: true,
				server_merge_applied: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( retrySaveRequestData ).toMatchObject( {
				client_base_version: '7',
				accepted_proof_server_version: '7',
				rebased_from_version: '4',
				pending_change_count: 2,
				proposed_post_content: proposedPostContent,
				proposed_post_content_hash: proposedPostContentHash,
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( serverMergedPostContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				pendingChangeCount: 0,
				hasPendingChanges: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '8',
				retrySavePreviousServerVersion: '7',
				retrySaveServerMerged: true,
				retrySaveServerMergeApplied: true,
				retrySaveServerMergeStatus: 'merged',
				retrySaveServerMergeStrategy:
					'top_level_serialized_block_three_way',
				retrySaveServerMergeServerChangedIndexes: [ 1 ],
				retrySaveServerMergeLocalChangedIndexes: [ 0 ],
				canExportLocalUpdates: false,
			} );
		} );

		it( 'hydrates same-block server-merge conflicts for comparison after retry-save rejection', async () => {
			const basePostContent =
				'<!-- wp:paragraph --><p>Original conflict base.</p><!-- /wp:paragraph -->';
			const localPostContent =
				'<!-- wp:paragraph --><p>Local conflict text.</p><!-- /wp:paragraph -->';
			const localPostContentWithEditorSyncMeta = `${ localPostContent }<!-- wp:freeform --><p><script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script></p><!-- /wp:freeform -->`;
			const serverPostContent =
				'<!-- wp:paragraph --><p>Server conflict text.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: localPostContentWithEditorSyncMeta,
				status: 'draft',
			};
			const error = {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REBASE_FAILED,
				message:
					'Distributed Editing could not merge the retry save automatically.',
				data: {
					status: 409,
					detail: 'retry_save_server_merge_same_serialized_block_changed',
					server_merge_status: 'manual_conflict_required',
					requires_manual_conflict_resolution: true,
					can_export_local_updates: true,
					client_base_version: '4',
					accepted_proof_server_version: '4',
					server_version: '5',
					pending_change_count: 1,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
			};
			let retrySaveCalls = 0;
			let serverStateRefetchCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const { path, method, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					return {
						...post,
						content: {
							raw: `${ serverPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"5"}</script>`,
						},
						distributed_editing: {
							server_version: '5',
						},
					};
				}

				expect( method ).toBe( 'POST' );
				expect( path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				);
				retrySaveCalls++;
				expect( data.proposed_post_content ).toBe( localPostContent );
				expect( data.proposed_post_content_hash ).toBe(
					proposedPostContentHash
				);
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
					serverVersion: '4',
					clientBaseContent: basePostContent,
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
					.__experimentalSaveDistributedEditingRetryAfterProof( {
						proposedPostContentHash,
					} )
			).rejects.toBe( error );

			expect( retrySaveCalls ).toBe( 1 );
			expect( serverStateRefetchCalls ).toBe( 1 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( localPostContentWithEditorSyncMeta );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REBASE_FAILED,
				serverVersion: '5',
				pendingChangeCount: 1,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				requiresServerStateRefetch: false,
				requiresManualConflictResolution: true,
				refetchedServerState: true,
				clientBaseContent: basePostContent,
				refetchedServerContent: serverPostContent,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
				canExportLocalUpdates: true,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REBASE_FAILED,
				retrySaveAccepted: false,
				retrySaveServerVersion: '5',
				retrySaveSavesPost: false,
				retrySaveMutatesPostContent: false,
				retrySaveCreatesRevision: false,
				retrySaveClaimsSaved: false,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
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
					.__experimentalSaveDistributedEditingRetryAfterProof()
			).resolves.toMatchObject( {
				result: 'retry_save_applied',
				review_approval_proof_consumed: true,
				reviewed_block_item_count: 1,
			} );
		} );

		it( 'passes accepted fresh-review consume validation into retry-save requests', async () => {
			const proposedPostContent =
				'<!-- wp:paragraph --><p>Fresh-review validated save.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const candidatePostContentHash =
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
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
					rebased_from_version: '7',
					pending_change_count: 1,
					proposed_post_content: proposedPostContent,
					proposed_post_content_hash: proposedPostContentHash,
					accepted_fresh_review_decision: {
						type: 'fresh_review_decision_consumption_validation',
						status: 'eligible_for_retry_save_handoff',
						result: 'fresh_review_decision_eligible_for_retry_save_handoff',
						rest_route: 'post_fresh_review_consume',
						fresh_review_request_record_id:
							'fresh-review-request-123',
						fresh_review_request_status: 'decision_recorded',
						fresh_review_decision_status: 'approved',
						client_base_version: '7',
						server_version: '12',
						proposed_post_content_hash: proposedPostContentHash,
						reviewed_proposed_content_hash: proposedPostContentHash,
						candidate_post_content_hash: candidatePostContentHash,
						reviewed_candidate_content_hash:
							candidatePostContentHash,
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
					previous_server_version: '12',
					server_version: '13',
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
					fresh_review_decision_consumed: true,
					fresh_review_request_record_id: 'fresh-review-request-123',
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
					clientBaseVersion: '7',
					serverVersion: '12',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportVerifiedPostContentHash:
						proposedPostContentHash,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
					localUpdatesImportFreshReviewRequestRecordId:
						'fresh-review-request-123',
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
					localUpdatesImportFreshReviewDecisionStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
					localUpdatesImportFreshReviewDecisionResult:
						'fresh_review_decision_approved_for_retry_save',
					localUpdatesImportFreshReviewDecisionAccepted: true,
					localUpdatesImportFreshReviewDecisionSubmitted: true,
					localUpdatesImportFreshReviewDecisionDecision: 'approved',
					localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
					localUpdatesImportFreshReviewRetrySaveHandoffStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
					localUpdatesImportFreshReviewRetrySaveHandoffResult:
						'fresh_review_decision_eligible_for_retry_save_handoff',
					localUpdatesImportFreshReviewRetrySaveHandoffRestRoute:
						'post_fresh_review_consume',
					localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion:
						'7',
					localUpdatesImportFreshReviewRetrySaveHandoffServerVersion:
						'12',
					localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash:
						proposedPostContentHash,
					localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash:
						candidatePostContentHash,
					localUpdatesImportFreshReviewRetrySaveHandoffHashEvidenceStatus:
						'accepted',
					retrySaveFreshReviewConsumeValidationStatus:
						'accepted_for_retry_save',
					retrySaveFreshReviewConsumeValidationAccepted: true,
					retrySaveFreshReviewDecisionConsumptionValidated: true,
					retrySaveFreshReviewDecisionEligibleForRetrySave: true,
					retrySaveFreshReviewRequestRecordId:
						'fresh-review-request-123',
					retrySaveFreshReviewRequestStatus: 'decision_recorded',
					retrySaveFreshReviewDecisionStatus: 'approved',
					retrySaveFreshReviewClientBaseVersion: '7',
					retrySaveFreshReviewServerVersion: '12',
					retrySaveFreshReviewProposedContentHash:
						proposedPostContentHash,
					retrySaveFreshReviewCandidateContentHash:
						candidatePostContentHash,
					retrySaveFreshReviewReviewedBlockItemCount: 1,
					retrySaveFreshReviewHashEvidenceStatus: 'accepted',
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSaveDistributedEditingRetryAfterProof()
			).resolves.toMatchObject( {
				result: 'retry_save_applied',
				fresh_review_decision_consumed: true,
			} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingRetrySaveFlowState()
			).toMatchObject( {
				hasAcceptedFreshReviewConsumeValidation: true,
				acceptedFreshReviewRequestRecordId: 'fresh-review-request-123',
				claimsSaved: true,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveFreshReviewDecisionConsumptionValidated: true,
				actionTranscriptItemCount: 3,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
				actionTranscriptLatestEventSource: 'server',
				actionTranscriptEntriesRedacted: true,
				actionTranscriptExposesRawContent: false,
				actionTranscriptExposesProofInternals: false,
				actionTranscriptExposesActorIds: false,
			} );
		} );

		it( 'exposes a browser-callable fresh-review retry-save handoff action', async () => {
			const proposedPostContent =
				'<!-- wp:paragraph --><p>Fresh-review alias save.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const candidatePostContentHash =
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: proposedPostContent,
				status: 'draft',
			};

			apiFetch.setFetchHandler( async ( options ) => {
				expect( options.path ).toMatch(
					new RegExp(
						`^/wp/v2/posts/${ postId }/distributed-editing/retry-save`
					)
				);
				expect( options.data ).toMatchObject( {
					client_base_version: '12',
					accepted_proof_server_version: '12',
					proposed_post_content: proposedPostContent,
					proposed_post_content_hash: proposedPostContentHash,
					accepted_fresh_review_decision: {
						type: 'fresh_review_decision_consumption_validation',
						rest_route: 'post_fresh_review_consume',
						fresh_review_request_record_id:
							'fresh-review-request-123',
						client_base_version: '7',
						server_version: '12',
						proposed_post_content_hash: proposedPostContentHash,
						candidate_post_content_hash: candidatePostContentHash,
						fresh_review_decision_consumption_validated: true,
						fresh_review_decision_eligible_for_retry_save: true,
					},
				} );

				return {
					result: 'retry_save_applied',
					retry_save_accepted: true,
					previous_server_version: '12',
					server_version: '13',
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
					revision_created: true,
					created_revision_ids: [ 8001 ],
					fresh_review_decision_consumed: true,
					fresh_review_request_record_id: 'fresh-review-request-123',
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
					clientBaseVersion: '7',
					serverVersion: '12',
					pendingChangeCount: 1,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportVerifiedPostContentHash:
						proposedPostContentHash,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
					localUpdatesImportFreshReviewRequestRecordId:
						'fresh-review-request-123',
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
					localUpdatesImportFreshReviewDecisionStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
					localUpdatesImportFreshReviewDecisionResult:
						'fresh_review_decision_approved_for_retry_save',
					localUpdatesImportFreshReviewDecisionAccepted: true,
					localUpdatesImportFreshReviewDecisionSubmitted: true,
					localUpdatesImportFreshReviewDecisionDecision: 'approved',
					localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
					localUpdatesImportFreshReviewRetrySaveHandoffStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
					localUpdatesImportFreshReviewRetrySaveHandoffResult:
						'fresh_review_decision_eligible_for_retry_save_handoff',
					localUpdatesImportFreshReviewRetrySaveHandoffRestRoute:
						'post_fresh_review_consume',
					localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion:
						'7',
					localUpdatesImportFreshReviewRetrySaveHandoffServerVersion:
						'12',
					localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash:
						proposedPostContentHash,
					localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash:
						candidatePostContentHash,
					localUpdatesImportFreshReviewRetrySaveHandoffHashEvidenceStatus:
						'accepted',
					retrySaveFreshReviewConsumeValidationStatus:
						'accepted_for_retry_save',
					retrySaveFreshReviewConsumeValidationAccepted: true,
					retrySaveFreshReviewDecisionConsumptionValidated: true,
					retrySaveFreshReviewDecisionEligibleForRetrySave: true,
					retrySaveFreshReviewRequestRecordId:
						'fresh-review-request-123',
					retrySaveFreshReviewRequestStatus: 'decision_recorded',
					retrySaveFreshReviewDecisionStatus: 'approved',
					retrySaveFreshReviewClientBaseVersion: '7',
					retrySaveFreshReviewServerVersion: '12',
					retrySaveFreshReviewProposedContentHash:
						proposedPostContentHash,
					retrySaveFreshReviewCandidateContentHash:
						candidatePostContentHash,
					retrySaveFreshReviewReviewedBlockItemCount: 1,
					retrySaveFreshReviewHashEvidenceStatus: 'accepted',
					canExportLocalUpdates: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalSaveDistributedEditingFreshReviewRetrySaveHandoff(
						{
							clientBaseVersion: 'stale-browser-base',
							acceptedProofServerVersion:
								'stale-browser-proof-version',
							proposedPostContentHash,
						}
					)
			).resolves.toMatchObject( {
				result: 'retry_save_applied',
				fresh_review_decision_consumed: true,
			} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveFreshReviewDecisionConsumptionValidated: true,
				hasPendingChanges: false,
				canExportLocalUpdates: false,
				actionTranscriptItemCount: 3,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
				actionTranscriptLatestEventSource: 'server',
				actionTranscriptEntriesRedacted: true,
				actionTranscriptExposesRawContent: false,
				actionTranscriptExposesProofInternals: false,
				actionTranscriptExposesActorIds: false,
			} );
		} );

		it( 'keeps fresh-review validated retry-save rejections exportable and redacted', async () => {
			const proposedPostContent =
				'<!-- wp:paragraph --><p>Fresh-review validated retry rejection.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const candidatePostContentHash =
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: proposedPostContent,
				status: 'draft',
			};
			const setupFreshReviewValidatedRegistry = () => {
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
						clientBaseVersion: '7',
						serverVersion: '12',
						pendingChangeCount: 1,
						retrySubmitProofStatus:
							DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
						retrySubmitAccepted: true,
						retrySubmitSavePathRequired: true,
						retrySubmitSaveStatus:
							DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
						retrySubmitSaveReady: true,
						localUpdatesImportStatus:
							DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
						localUpdatesImportReason:
							DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
						localUpdatesImportVerifiedPostContentHash:
							proposedPostContentHash,
						localUpdatesImportReviewRequestStatus:
							DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
						localUpdatesImportFreshReviewRequestRecordId:
							'fresh-review-request-123',
						localUpdatesImportFreshReviewRequestAccepted: true,
						localUpdatesImportFreshReviewRequestRequested: true,
						localUpdatesImportFreshReviewDecisionStatus:
							DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
						localUpdatesImportFreshReviewDecisionResult:
							'fresh_review_decision_approved_for_retry_save',
						localUpdatesImportFreshReviewDecisionAccepted: true,
						localUpdatesImportFreshReviewDecisionSubmitted: true,
						localUpdatesImportFreshReviewDecisionDecision:
							'approved',
						localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
						localUpdatesImportFreshReviewRetrySaveHandoffStatus:
							DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
						localUpdatesImportFreshReviewRetrySaveHandoffResult:
							'fresh_review_decision_eligible_for_retry_save_handoff',
						localUpdatesImportFreshReviewRetrySaveHandoffRestRoute:
							'post_fresh_review_consume',
						localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion:
							'7',
						localUpdatesImportFreshReviewRetrySaveHandoffServerVersion:
							'12',
						localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash:
							proposedPostContentHash,
						localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash:
							candidatePostContentHash,
						retrySaveFreshReviewConsumeValidationStatus:
							'accepted_for_retry_save',
						retrySaveFreshReviewConsumeValidationAccepted: true,
						retrySaveFreshReviewDecisionConsumptionValidated: true,
						retrySaveFreshReviewDecisionEligibleForRetrySave: true,
						retrySaveFreshReviewRequestRecordId:
							'fresh-review-request-123',
						retrySaveFreshReviewRequestStatus: 'decision_recorded',
						retrySaveFreshReviewDecisionStatus: 'approved',
						retrySaveFreshReviewClientBaseVersion: '7',
						retrySaveFreshReviewServerVersion: '12',
						retrySaveFreshReviewProposedContentHash:
							proposedPostContentHash,
						retrySaveFreshReviewCandidateContentHash:
							candidatePostContentHash,
						retrySaveFreshReviewReviewedBlockItemCount: 1,
						canExportLocalUpdates: true,
					} );

				return registry;
			};
			const cases = [
				{
					error: {
						code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
						data: {
							reason_code:
								DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
							rest_route:
								'post_retry_save_fresh_review_stale_after_validation',
							server_version: '13',
							pending_change_count: 1,
							fresh_review_request_record_id:
								'fresh-review-request-123',
							fresh_review_decision_consumption_validated: true,
						},
					},
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED,
				},
				{
					error: {
						code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
						data: {
							reason_code:
								DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
							detail: 'fresh_review_decision_not_approved_for_retry_save',
							fresh_review_request_record_id:
								'fresh-review-request-123',
						},
					},
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
				},
				{
					error: {
						code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
						data: {
							reason_code:
								DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
							detail: 'fresh_review_consume_hash_evidence_mismatch',
							fresh_review_request_record_id:
								'fresh-review-request-123',
						},
					},
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				},
				{
					error: {
						code: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
						data: {
							reason_code:
								DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
							detail: 'fresh_review_consume_requires_unfiltered_html_reviewer',
							fresh_review_request_record_id:
								'fresh-review-request-123',
						},
					},
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED,
				},
			];

			for ( const { error, retrySaveStatus } of cases ) {
				apiFetch.setFetchHandler( async () => {
					throw error;
				} );

				const registry = setupFreshReviewValidatedRegistry();

				await expect(
					registry
						.dispatch( editorStore )
						.__experimentalSaveDistributedEditingRetryAfterProof( {
							proposedPostContentHash,
						} )
				).rejects.toBe( error );

				const sessionState = registry
					.select( editorStore )
					.getDistributedEditingSessionState();

				expect( sessionState ).toMatchObject( {
					retrySaveStatus,
					hasPendingChanges: true,
					mustOfferLocalCopy: true,
					canExportLocalUpdates: true,
					retrySaveFreshReviewConsumeValidationStatus:
						error.code ===
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED
							? 'accepted_for_retry_save'
							: 'rejected',
					retrySaveFreshReviewRequestRecordId:
						'fresh-review-request-123',
					retrySaveFreshReviewProposedContentHash:
						proposedPostContentHash,
					retrySaveFreshReviewRawContentIncluded: false,
					retrySaveFreshReviewExposesRawContent: false,
					retrySaveFreshReviewExposesReviewerIds: false,
				} );
				expect( JSON.stringify( sessionState ) ).not.toMatch(
					/reviewer_user_id|reviewerUserId|proof_signature|raw_content/
				);
			}
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

			it( 'applies partial-safe retry-save content to the editor while keeping unsafe review pending', async () => {
				const baseContent =
					'<!-- wp:paragraph --><p>Safe base.</p><!-- /wp:paragraph --><!-- wp:html -->\n<div>Original HTML.</div>\n<!-- /wp:html -->';
				const authorUnsafeContent =
					'<!-- wp:paragraph --><p>Safe author edit.</p><!-- /wp:paragraph --><!-- wp:html -->\n<script>alert("unsafe")</script>\n<!-- /wp:html -->';
				const safeServerContent =
					'<!-- wp:paragraph --><p>Safe author edit.</p><!-- /wp:paragraph --><!-- wp:html -->\n<div>Original HTML.</div>\n<!-- /wp:html -->';
				const safeServerRawContent = `<!-- wp:sync-meta {"format":"yjs"} -->\n<script type="application/json" data-wp-sync-meta="distributed-editing" data-sync-meta-format="yjs">{"schema":"de-rtc-yjs-v1","version":"302"}</script>\n<!-- /wp:sync-meta -->${ safeServerContent }`;
				const post = {
					id: postId,
					type: 'post',
					title: 'bar',
					content: authorUnsafeContent,
					status: 'draft',
				};
					const response = {
						result: 'retry_save_partial_safe_merge',
						reason_code:
							DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
						server_version: '302',
						pending_change_count: 1,
						pre_publish_review_required: true,
						partial_safe_merge_applied: true,
						partial_safe_merge_status: 'safe_subset_persisted',
						safe_server_content_included: true,
						content: {
							raw: safeServerRawContent,
						},
						review_items: [
							{
								id: 'unsafe-html-block',
								block_path: [ 1 ],
								block_name: 'core/html',
								change_kind: 'modified_block',
								review_status: 'pending_review',
								content_review_policy: 'kses',
								review_evidence_type:
									'kses_block_hash_only_change',
								raw_content_included: false,
								exposes_raw_content: false,
							},
						],
						pending_review_item_count: 1,
					};

					apiFetch.setFetchHandler( async () => {
						return response;
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
						clientBaseVersion: '301',
						serverVersion: '301',
						clientBaseContent: baseContent,
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
					).resolves.toBe( response );

				const sessionState = registry
					.select( editorStore )
					.getDistributedEditingSessionState();

				expect(
					registry.select( editorStore ).getEditedPostContent()
				).toBe( authorUnsafeContent );
				expect(
					registry.select( editorStore ).getCurrentPost()
				).toMatchObject( {
					content: safeServerContent,
				} );
				expect( sessionState ).toMatchObject( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
					clientBaseVersion: '302',
					serverVersion: '302',
					clientBaseContent: safeServerContent,
					refetchedServerContent: safeServerContent,
					refetchedServerState: true,
					requiresServerStateRefetch: false,
					pendingChangeCount: 1,
					hasPendingChanges: true,
					isAwaitingServerConfirmation: false,
					requiresManualConflictResolution: false,
					retrySubmitAccepted: false,
					retrySubmitSavePathRequired: false,
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewPendingCount: 1,
					riskyBlockReviewRawContentIncluded: false,
					riskyBlockReviewExposesRawContent: false,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				} );
				expect( JSON.stringify( sessionState ) ).not.toContain(
					'<script>alert("unsafe")</script>'
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

		it( 'keeps status-surface Save preparation no-write until an explicit Save click consumes it', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original ready.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:paragraph --><p>Conflict choice ready.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			const registry = createRegistryWithStores();
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
					.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof(
						{
							requiresExplicitSaveClick: true,
						}
					)
			).resolves.toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				savesPost: false,
				sessionState: {
					retrySubmitSaveReady: true,
					retrySubmitSaveRequiresExplicitSaveClick: true,
				},
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'retry_save_blocked',
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_SAVE_REQUIRES_EXPLICIT_SAVE_CLICK,
				callsRetrySaveAction: false,
				callsNormalSavePost: false,
				allowsNormalSaveFallback: false,
			} );

			expect( retrySaveCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 0 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySubmitSaveReady: true,
				retrySubmitSaveRequiresExplicitSaveClick: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_SAVE_REQUIRES_EXPLICIT_SAVE_CLICK,
				canExportLocalUpdates: true,
			} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalMaybeHandleDistributedEditingSaveButtonClick()
			).resolves.toMatchObject( {
				status: 'guarded_retry_save_submitted_from_save_click',
				callsRetrySaveEndpoint: true,
				callsNormalSavePost: false,
				allowsNormalSaveFallback: false,
				claimsSaved: true,
			} );

			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySubmitSavePrepared: false,
				retrySubmitSaveRequiresExplicitSaveClick: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				canExportLocalUpdates: false,
			} );
		} );

		it( 'confirms an already-authoritative latest-WordPress structural choice in retry-save policy without writing', async () => {
			const basePostContent =
				'<!-- wp:paragraph -->\n<p>Two editor deletion alpha.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Two editor deletion beta.</p>\n<!-- /wp:paragraph -->';
			const firstAcceptedPostContent =
				'<!-- wp:paragraph -->\n<p>Two editor deletion alpha.</p>\n<!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: `${ basePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script>`,
				status: 'draft',
			};
			const registry = createRegistryWithStores();
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

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: firstAcceptedPostContent,
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '5',
					clientBaseContent: basePostContent,
					refetchedServerContent: firstAcceptedPostContent,
					pendingChangeCount: 1,
					remoteChangeCount: 1,
					refetchedServerState: true,
					requiresServerStateRefetch: false,
					hasPendingChanges: true,
					isAwaitingServerConfirmation: true,
					canExportLocalUpdates: true,
					mustOfferLocalCopy: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultReason: 'block_deleted',
					requiresManualConflictResolution: true,
					staleBaseConflictResolutionStatus:
						DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
					staleBaseConflictResolutionChoice:
						DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
					staleBaseConflictResolutionRequiresFreshProof: false,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSavesPost: false,
					retrySubmitMutatesPostContent: false,
					retrySubmitCreatesRevision: false,
					retrySubmitClaimsSaved: false,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSavePrepared: true,
					retrySubmitSaveReady: true,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost( {
					__experimentalUseDistributedEditingRetrySave: true,
					__experimentalAllowDistributedEditingStructuralNoopSave: true,
				} )
			).resolves.toMatchObject( {
				status: 'structural_choice_already_authoritative_from_save_click',
				reason: 'structural_choice_already_authoritative',
				callsRetrySaveAction: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				createsRevision: false,
				claimsSaved: false,
			} );

			expect( apiCalls ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( firstAcceptedPostContent );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				clientBaseVersion: '5',
				serverVersion: '5',
				pendingChangeCount: 0,
				hasPendingChanges: false,
				isAwaitingServerConfirmation: false,
				canExportLocalUpdates: false,
				mustOfferLocalCopy: false,
				requiresManualConflictResolution: false,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.NONE,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
				retrySubmitAccepted: false,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				retrySaveClaimsSaved: false,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'routes a prepared same-block conflict choice through guarded retry-save on setting-enabled savePost', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original conflict base.</p><!-- /wp:paragraph -->';
			const chosenPostContent =
				'<!-- wp:paragraph --><p>Chosen latest WordPress conflict text.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'1212121212121212121212121212121212121212121212121212121212121212';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let serverStateRefetchCalls = 0;
			let retrySaveRequestData = null;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { data } = options;
				const path = options.path ?? '';

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
						pending_change_count: 0,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						revision_created: true,
						created_revision_ids: [ 7008 ],
					};
				}

				if (
					method === 'GET' &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;

					return post;
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence/heartbeat`
					)
				) {
					return createDistributedEditingPresenceHeartbeatResponse(
						data
					);
				}

				if (
					method === 'GET' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/presence`
					)
				) {
					return createDistributedEditingPresenceSnapshotResponse();
				}

				if (
					( method === 'POST' || method === 'PUT' ) &&
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
				content: chosenPostContent,
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
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					refetchedServerState: true,
					staleBaseConflictResolutionStatus:
						'latest_wordpress_selected',
					staleBaseConflictResolutionChoice: 'latest_wordpress',
					staleBaseConflictResolutionRequiresFreshProof: false,
					requiresManualConflictResolution: false,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSavesPost: false,
					retrySubmitMutatesPostContent: false,
					retrySubmitCreatesRevision: false,
					retrySubmitClaimsSaved: false,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
					retrySubmitSavePrepared: true,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost( {
					proposedPostContentHash,
				} )
			).resolves.toMatchObject( {
				status: 'retry_save_submitted',
				callsRetrySaveAction: true,
				callsNormalSavePost: false,
				claimsSaved: true,
				sessionState: {
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					retrySaveServerVersion: '8',
					retrySavePreviousServerVersion: '7',
					retrySaveSavesPost: true,
					retrySaveMutatesPostContent: true,
					retrySaveCreatesRevision: true,
					retrySaveClaimsSaved: true,
					retrySaveRevisionCreated: true,
					retrySaveCreatedRevisionIds: [ 7008 ],
					canExportLocalUpdates: false,
					hasPendingChanges: false,
				},
			} );

			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( serverStateRefetchCalls ).toBe( 0 );
			expect( retrySaveRequestData ).toEqual( {
				client_base_version: '7',
				accepted_proof_server_version: '7',
				rebased_from_version: '4',
				pending_change_count: 1,
				proposed_post_content: chosenPostContent,
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
				retrySaveServerVersion: '8',
				retrySaveRevisionCreated: true,
				retrySaveCreatedRevisionIds: [ 7008 ],
				canExportLocalUpdates: false,
				hasPendingChanges: false,
				staleBaseConflictResolutionChoice: 'latest_wordpress',
			} );
		} );

		it( 'blocks setting-enabled savePost after stale-again conflict proof without normal fallback', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original stale proof base.</p><!-- /wp:paragraph -->';
			const chosenPostContent =
				'<!-- wp:paragraph --><p>Chosen local stale proof text.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'3434343434343434343434343434343434343434343434343434343434343434';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			const staleProofError = {
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
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let serverStateRefetchCalls = 0;
			let retrySubmitRequestData = null;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { data } = options;
				const path = options.path ?? '';

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				) {
					retrySubmitCalls++;
					retrySubmitRequestData = data;

					throw staleProofError;
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
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
				}

				if (
					( method === 'POST' || method === 'PUT' ) &&
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
				content: chosenPostContent,
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
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					refetchedServerState: true,
					staleBaseConflictResolutionStatus: 'local_version_selected',
					staleBaseConflictResolutionChoice: 'local',
					staleBaseConflictResolutionRequiresFreshProof: true,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
				} );

			await expect(
				registry
					.dispatch( editorStore )
					.__experimentalRefreshDistributedEditingRetrySubmitProof( {
						proposedPostContentHash,
					} )
			).rejects.toBe( staleProofError );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REFETCH_REQUIRED,
				label: 'Get latest post',
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE,
				requiresServerStateRefetch: true,
				blocksNormalSavePost: true,
				shouldCallNormalSavePost: false,
				shouldCallRetrySaveEndpoint: false,
				claimsSaved: false,
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'distributed_editing_refetch_required',
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				requiresServerStateRefetch: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );

			expect( retrySubmitCalls ).toBe( 1 );
			expect( retrySubmitRequestData ).toEqual( {
				client_base_version: '7',
				rebased_from_version: '4',
				pending_change_count: 1,
				proposed_post_content_hash: proposedPostContentHash,
			} );
			expect( retrySaveCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( serverStateRefetchCalls ).toBe( 0 );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( chosenPostContent );
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
				pendingChangeCount: 1,
				hasPendingChanges: true,
				requiresServerStateRefetch: true,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED,
				retrySubmitAccepted: false,
				retrySubmitSavePathRequired: false,
				canExportLocalUpdates: true,
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
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REVIEW_REQUIRED,
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
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REVIEW_REQUIRED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
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
			let retrySaveRequestData = null;

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
					retrySaveRequestData = data;

					return {
						result: 'retry_save_applied',
						retry_save_accepted: true,
						previous_server_version: '12',
						server_version: '13',
						pending_change_count: 0,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						review_approval_proof_consumed: true,
					};
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
					clientBaseVersion: '12',
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
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSavePolicyState()
			).toMatchObject( {
				saveButtonStatus:
					DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED,
				saveButtonSource: 'review_approval',
				saveButtonLocalChangesState:
					DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
				saveButtonReviewCheckpointState:
					DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_ACCEPTED,
				saveButtonAuthoritativePostState:
					DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_FOR_GUARDED_UPDATE,
				saveButtonAuthoritativePostUpdated: false,
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'retry_save_submitted',
				callsRetrySaveAction: true,
				callsNormalSavePost: false,
			} );

			expect( reviewApprovalCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( retrySaveRequestData ).toMatchObject( {
				client_base_version: '12',
				accepted_proof_server_version: '12',
				proposed_post_content: editedPostContent,
				proposed_post_content_hash: proposedPostContentHash,
				accepted_review_approval_proof: expect.objectContaining( {
					type: 'unfiltered_html_retry_save_review_approval',
					proposed_post_content_hash: proposedPostContentHash,
					candidate_post_content_hash: candidatePostContentHash,
					raw_content_included: false,
					claims_saved: false,
				} ),
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveReviewApprovalProofStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.NONE,
				retrySaveReviewApprovalAccepted: false,
				riskyBlockReviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NONE,
				riskyBlockReviewItemCount: 0,
				canExportLocalUpdates: false,
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
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					return {
						...post,
						content: {
							raw: post.content,
						},
					};
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

		it( 'retains repaired sync meta returned by normal save without editor noise', async () => {
			const basePostContent =
				'<!-- wp:paragraph --><p>External repair base.</p><!-- /wp:paragraph -->';
			const savedPostContent =
				'<!-- wp:paragraph --><p>External repair saved.</p><!-- /wp:paragraph -->';
			const baseSyncMeta = {
				schema: 'de-rtc-yjs-v1',
				version: '7',
				post_content_hash: 'base-hash',
			};
			const repairedSyncMeta = {
				schema: 'de-rtc-yjs-v1',
				version: '8',
				previous_version: '7',
				post_content_hash: 'saved-hash',
				last_server_update: {
					type: 'external_post_content_repair',
				},
			};
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: `${ basePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="yjs">${ JSON.stringify(
					baseSyncMeta
				) }</script>`,
				status: 'draft',
			};
			const repairedRawContent = `${ savedPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="yjs">${ JSON.stringify(
				repairedSyncMeta
			) }</script>`;
			let normalSaveCalls = 0;
			let retrySaveCalls = 0;

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
					return {
						...post,
						...data,
						content: {
							raw: repairedRawContent,
						},
					};
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
				content: savedPostContent,
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: false,
				},
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toBeUndefined();

			expect( normalSaveCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 0 );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( savedPostContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				serverVersion: '8',
				clientBaseVersion: '8',
				clientBaseContent: savedPostContent,
				clientBaseSyncMeta: repairedSyncMeta,
				hasPendingChanges: false,
				pendingChangeCount: 0,
				canExportLocalUpdates: false,
			} );
			expect(
				registry
					.select( noticesStore )
					.getNotices()
					.some( ( notice ) => notice.status === 'error' )
			).toBe( false );
		} );

		it( 'checks server freshness before setting-enabled normal save fallback and allows content-unchanged edits', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original freshness.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					return {
						...post,
						content: {
							raw: originalPostContent,
						},
						modified_gmt: '2026-05-15T00:00:00',
					};
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
				content: originalPostContent,
				title: 'bar changed',
			} );
			registry.dispatch( editorStore ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
				},
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toBeUndefined();

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 1 );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
					.requiresServerStateRefetch
			).toBe( false );
		} );

		it( 'blocks setting-enabled normal save fallback when the server post changed with a merge conflict', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original freshness stale.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:paragraph --><p>Local freshness stale.</p><!-- /wp:paragraph -->';
			const remotePostContent =
				'<!-- wp:paragraph --><p>Remote freshness stale.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					return {
						...post,
						content: {
							raw: remotePostContent,
						},
						modified_gmt: '2026-05-15T00:01:00',
					};
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
					retrySaveHandoff: true,
				},
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'distributed_editing_normal_save_blocked_merge_conflict',
				reason: 'stale_base_version_rejected',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				canExportLocalUpdates: true,
				requiresServerStateRefetch: false,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
				requiresManualConflictResolution: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
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
				disposition: 'rejected_stale_base_version',
				reasonCode: 'stale_base_version_rejected',
				clientBaseContent: originalPostContent,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
				requiresManualConflictResolution: true,
				canExportLocalUpdates: true,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
		} );

		it( 'routes clean-base content edits through guarded retry-save instead of ordinary save', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Clean base original.</p><!-- /wp:paragraph -->';
			const originalPostContentWithSyncMeta = `${ originalPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script>`;
			const editedPostContent =
				'<!-- wp:paragraph --><p>Clean base edited.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContentWithSyncMeta,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let retrySubmitRequestData = null;
			let retrySaveRequestData = null;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					return {
						...post,
						content: {
							raw: originalPostContent,
						},
						distributed_editing: {
							server_version: '4',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				) {
					retrySubmitCalls++;
					retrySubmitRequestData = data;

					return {
						result: 'retry_submit_accepted_for_future_save',
						retry_submit_accepted: true,
						client_base_version: '4',
						server_version: '4',
						rebased_from_version: '4',
						save_path_required: true,
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
					retrySaveRequestData = data;

					return {
						result: 'retry_save_applied',
						retry_save_accepted: true,
						previous_server_version: '4',
						server_version: '5',
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
					retrySaveHandoff: true,
				},
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'distributed_editing_normal_save_guarded_retry_save_submitted',
				allowsNormalSaveFallback: false,
				callsServerStateRefetchEndpoint: true,
				callsRetrySubmitEndpoint: true,
				callsRetrySaveEndpoint: true,
				callsNormalSavePost: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( retrySubmitCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( retrySubmitRequestData ).toMatchObject( {
				client_base_version: '4',
				rebased_from_version: '4',
				pending_change_count: 1,
			} );
			expect( retrySubmitRequestData.content ).toBeUndefined();
			expect( retrySaveRequestData ).toMatchObject( {
				client_base_version: '4',
				accepted_proof_server_version: '4',
				rebased_from_version: '4',
				pending_change_count: 1,
				proposed_post_content: editedPostContent,
				accepted_proof_saves_post: false,
				accepted_proof_mutates_post_content: false,
				accepted_proof_creates_revision: false,
				accepted_proof_claims_saved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '5',
				retrySavePreviousServerVersion: '4',
				canExportLocalUpdates: false,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
		} );

		it( 'uses the stored client base when the current post record already reflects local edits', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Stored base original.</p><!-- /wp:paragraph -->';
			const originalPostContentWithSyncMeta = `${ originalPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script>`;
			const editedPostContent =
				'<!-- wp:paragraph --><p>Stored base edited.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContentWithSyncMeta,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					return {
						...post,
						content: {
							raw: originalPostContent,
						},
						distributed_editing: {
							server_version: '4',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				) {
					retrySubmitCalls++;

					return {
						result: 'retry_submit_accepted_for_future_save',
						retry_submit_accepted: true,
						client_base_version: '4',
						server_version: '4',
						rebased_from_version: '4',
						save_path_required: true,
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

					return {
						result: 'retry_save_applied',
						retry_save_accepted: true,
						previous_server_version: '4',
						server_version: '5',
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
					code: 'unexpected_path',
					message: `Unexpected path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post, {
				content: originalPostContent,
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
					serverVersion: '4',
					clientBaseContent: originalPostContent,
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				} );
			registry.dispatch( editorStore ).editPost( {
				content: editedPostContent,
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'distributed_editing_normal_save_guarded_retry_save_submitted',
				allowsNormalSaveFallback: false,
				callsServerStateRefetchEndpoint: true,
				callsRetrySubmitEndpoint: true,
				callsRetrySaveEndpoint: true,
				callsNormalSavePost: false,
				claimsSaved: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( retrySubmitCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '5',
				canExportLocalUpdates: false,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED,
			} );
		} );

		it( 'routes a new clean-base edit after a confirmed retry-save through a fresh guarded retry-save', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Saved base original.</p><!-- /wp:paragraph -->';
			const originalPostContentWithSyncMeta = `${ originalPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"5"}</script>`;
			const editedPostContent =
				'<!-- wp:paragraph --><p>Saved base edited again.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContentWithSyncMeta,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'GET' &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					return {
						...post,
						content: {
							raw: originalPostContent,
						},
						distributed_editing: {
							server_version: '5',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				) {
					retrySubmitCalls++;

					return {
						result: 'retry_submit_accepted_for_future_save',
						retry_submit_accepted: true,
						client_base_version: '5',
						server_version: '5',
						rebased_from_version: '5',
						save_path_required: true,
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

					return {
						result: 'retry_save_applied',
						retry_save_accepted: true,
						previous_server_version: '5',
						server_version: '6',
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
					retrySaveHandoff: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '5',
					serverVersion: '5',
					clientBaseContent: originalPostContent,
					pendingChangeCount: 1,
					hasPendingChanges: true,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSavePrepared: true,
					retrySubmitSaveReady: true,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					retrySaveServerVersion: '5',
					retrySavePreviousServerVersion: '4',
					retrySaveSavesPost: true,
					retrySaveMutatesPostContent: true,
					retrySaveClaimsSaved: true,
				} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'distributed_editing_normal_save_guarded_retry_save_submitted',
				allowsNormalSaveFallback: false,
				callsServerStateRefetchEndpoint: true,
				callsRetrySubmitEndpoint: true,
				callsRetrySaveEndpoint: true,
				callsNormalSavePost: false,
				claimsSaved: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 1 );
			expect( retrySubmitCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '6',
				canExportLocalUpdates: false,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED,
			} );
		} );

		it( 'auto-merges non-conflicting stale server changes through retry-save', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Original beta.</p><!-- /wp:paragraph -->';
			const originalPostContentWithSyncMeta = `${ originalPostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"4"}</script>`;
			const editedPostContent =
				'<!-- wp:paragraph --><p>Local alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Original beta.</p><!-- /wp:paragraph -->';
			const remotePostContent =
				'<!-- wp:paragraph --><p>Original alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta.</p><!-- /wp:paragraph -->';
			const mergedPostContent =
				'<!-- wp:paragraph --><p>Local alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContentWithSyncMeta,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let retrySubmitRequestData = null;
			let retrySaveRequestData = null;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
					if ( serverStateRefetchCalls > 1 ) {
						return {
							...post,
							content: {
								raw: mergedPostContent,
							},
							distributed_editing: {
								server_version: '8',
							},
						};
					}

					return {
						...post,
						content: {
							raw: remotePostContent,
						},
						distributed_editing: {
							server_version: '7',
						},
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
					)
				) {
					retrySubmitCalls++;
					retrySubmitRequestData = data;

					return {
						result: 'retry_submit_accepted_for_future_save',
						retry_submit_accepted: true,
						client_base_version: '7',
						server_version: '7',
						rebased_from_version: '4',
						save_path_required: true,
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
					retrySaveRequestData = data;

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
					retrySaveHandoff: true,
				},
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'distributed_editing_normal_save_auto_merged_retry_save_submitted',
				autoMergedLocalChanges: true,
				mergedBlockCount: 2,
				allowsNormalSaveFallback: false,
				callsServerStateRefetchEndpoint: true,
				callsRetrySubmitEndpoint: true,
				callsRetrySaveEndpoint: true,
				callsNormalSavePost: false,
				mutatesEditorContent: true,
				changesPostLock: false,
				claimsSaved: true,
			} );

			expect( serverStateRefetchCalls ).toBe( 2 );
			expect( retrySubmitCalls ).toBe( 1 );
			expect( retrySaveCalls ).toBe( 1 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( retrySubmitRequestData ).toMatchObject( {
				client_base_version: '7',
				rebased_from_version: '4',
				pending_change_count: 1,
			} );
			expect( retrySubmitRequestData.content ).toBeUndefined();
			expect( retrySaveRequestData ).toMatchObject( {
				client_base_version: '7',
				accepted_proof_server_version: '7',
				rebased_from_version: '4',
				pending_change_count: 1,
				proposed_post_content: mergedPostContent,
				accepted_proof_saves_post: false,
				accepted_proof_mutates_post_content: false,
				accepted_proof_creates_revision: false,
				accepted_proof_claims_saved: false,
			} );
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( mergedPostContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				canExportLocalUpdates: false,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} );
		} );

		it( 'routes distinct-gap block identity stale server changes through retry-save without retry-submit', async () => {
			const { createHash, webcrypto } = require( 'crypto' );
			const { TextEncoder } = require( 'util' );
			const originalCrypto = globalThis.crypto;
			const originalTextEncoder = globalThis.TextEncoder;
			const hashContent = ( content ) =>
				createHash( 'sha256' ).update( content ).digest( 'hex' );
			const baseBlocks = [
				'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
				'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
				'<!-- wp:paragraph -->\n<p>Charlie</p>\n<!-- /wp:paragraph -->',
			];
			const basePostContent = baseBlocks.join( '\n\n' );
			const serverInsertedBlock =
				'<!-- wp:paragraph -->\n<p>Server insert</p>\n<!-- /wp:paragraph -->';
			const remotePostContent = [
				baseBlocks[ 0 ],
				serverInsertedBlock,
				baseBlocks[ 1 ],
				baseBlocks[ 2 ],
			].join( '\n\n' );
			const localInsertedBlock =
				'<!-- wp:paragraph -->\n<p>Local insert</p>\n<!-- /wp:paragraph -->';
			const editedPostContent = [
				baseBlocks[ 0 ],
				baseBlocks[ 1 ],
				baseBlocks[ 2 ],
				localInsertedBlock,
			].join( '\n\n' );
			const mergedPostContent = [
				baseBlocks[ 0 ],
				serverInsertedBlock,
				baseBlocks[ 1 ],
				baseBlocks[ 2 ],
				localInsertedBlock,
			].join( '\n\n' );
			const localInsertedBlockHash = hashContent( localInsertedBlock );
			const acceptedSyncMeta = {
				schema: 'de-rtc-block-identity-v1',
				document_uuid: 'doc-turn-0380',
				version: '41',
				content_hash: hashContent( basePostContent ),
				blocks: baseBlocks.map( ( serializedBlock, index ) => ( {
					block_uid: [ 'block-a', 'block-b', 'block-c' ][ index ],
					parent_uid: null,
					block_name: 'core/paragraph',
					ordinal_path: [ index ],
					serialized_hash: hashContent( serializedBlock ),
				} ) ),
			};
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: `${ basePostContent }<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">${ JSON.stringify(
					acceptedSyncMeta
				) }</script>`,
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let retrySubmitCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let retrySaveRequestData = null;

			Object.defineProperty( globalThis, 'TextEncoder', {
				configurable: true,
				value: originalTextEncoder || TextEncoder,
			} );
			Object.defineProperty( globalThis, 'crypto', {
				configurable: true,
				value: webcrypto,
			} );

			try {
				apiFetch.setFetchHandler( async ( options ) => {
					const method = getMethod( options );
					const { path, data } = options;

					if (
						method === 'GET' &&
						path.startsWith( `/wp/v2/posts/${ postId }` ) &&
						isDistributedEditingPostSnapshotPath( path )
					) {
						serverStateRefetchCalls++;
						return {
							...post,
							content: {
								raw: remotePostContent,
							},
							distributed_editing: {
								server_version: '42',
							},
						};
					}

					if (
						method === 'POST' &&
						path.startsWith(
							`/wp/v2/posts/${ postId }/distributed-editing/retry-submit`
						)
					) {
						retrySubmitCalls++;
						throw {
							code: 'unexpected_retry_submit',
							message:
								'Distinct-gap block identity server merge should not require retry-submit.',
						};
					}

					if (
						method === 'POST' &&
						path.startsWith(
							`/wp/v2/posts/${ postId }/distributed-editing/retry-save`
						)
					) {
						retrySaveCalls++;
						retrySaveRequestData = data;

						return {
							result: 'retry_save_server_merged',
							retry_save_accepted: true,
							previous_server_version: '42',
							server_version: '43',
							pending_change_count: 1,
							content: {
								raw: mergedPostContent,
							},
							saves_post: true,
							mutates_post_content: true,
							creates_revision: true,
							claims_saved: true,
							revision_created: true,
							created_revision_ids: [ 7080 ],
							server_merge_applied: true,
							server_merge: {
								merge_status: 'merged',
								merge_strategy:
									'top_level_serialized_block_identity_map',
								base_version: '41',
								server_version: '42',
								block_identity_base_current_match: false,
								block_identity_base_current_insertions_only: true,
								block_identity_server_inserted_indexes: [ 1 ],
								block_identity_inserted_indexes: [ 4 ],
							},
						};
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
						retrySaveHandoff: true,
					},
				} );

				await expect(
					registry.dispatch( editorStore ).savePost()
				).resolves.toMatchObject( {
					status: 'distributed_editing_normal_save_block_identity_server_merge_retry_save_submitted',
					blockIdentityServerMergeCandidate: true,
					allowsNormalSaveFallback: false,
					callsServerStateRefetchEndpoint: true,
					callsRetrySubmitEndpoint: false,
					callsRetrySaveEndpoint: true,
					callsNormalSavePost: false,
					mutatesEditorContent: false,
					changesPostLock: false,
					claimsSaved: true,
				} );

				expect( serverStateRefetchCalls ).toBe( 1 );
				expect( retrySubmitCalls ).toBe( 0 );
				expect( retrySaveCalls ).toBe( 1 );
				expect( normalSaveCalls ).toBe( 0 );
				expect( retrySaveRequestData ).toMatchObject( {
					client_base_version: '41',
					accepted_proof_server_version: '41',
					rebased_from_version: '41',
					pending_change_count: 1,
					proposed_post_content: editedPostContent,
					block_identity_request_proof: {
						client_base_version: '41',
						retained_block_uids: [
							'block-a',
							'block-b',
							'block-c',
						],
						inserted_block_nonces: [
							`inserted-3-${ localInsertedBlockHash.slice(
								0,
								16
							) }`,
						],
						deleted_block_uids: [],
						moved_block_uids: [],
					},
				} );
				expect( retrySaveRequestData.proposed_post_content_hash ).toBe(
					retrySaveRequestData.block_identity_request_proof
						.proposed_post_content_hash
				);
				expect(
					JSON.stringify(
						retrySaveRequestData.block_identity_request_proof
					)
				).not.toMatch(
					/postContent|rawContent|raw_content|blockContent|block_content|clientId|client_id|Alpha|Bravo|Charlie|Server insert|Local insert/
				);
				expect(
					registry.select( editorStore ).getEditedPostContent()
				).toBe( mergedPostContent );
				expect(
					registry
						.select( editorStore )
						.getDistributedEditingSessionState()
				).toMatchObject( {
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					retrySaveServerVersion: '43',
					retrySavePreviousServerVersion: '42',
					retrySaveServerMerged: true,
					retrySaveConfirmedMergedEdits: true,
					canExportLocalUpdates: false,
				} );
			} finally {
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
			}
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

		it( 'routes accepted fresh-review Save semantics to retry-save without review-proof fallback', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Fresh review original.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:paragraph --><p>Fresh review accepted.</p><!-- /wp:paragraph -->';
			const proposedPostContentHash =
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const candidatePostContentHash =
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				status: 'draft',
			};
			let retrySaveCalls = 0;
			let reviewApprovalCalls = 0;
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
						previous_server_version: '12',
						server_version: '13',
						pending_change_count: 1,
						saves_post: true,
						mutates_post_content: true,
						creates_revision: true,
						claims_saved: true,
						fresh_review_decision_consumed: true,
					};
				}

				if (
					method === 'POST' &&
					path.startsWith(
						`/wp/v2/posts/${ postId }/distributed-editing/review-approval`
					)
				) {
					reviewApprovalCalls++;
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
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '7',
					serverVersion: '12',
					pendingChangeCount: 1,
					hasPendingChanges: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
					localUpdatesImportFreshReviewRequestRecordId:
						'fresh-review-request-123',
					localUpdatesImportFreshReviewDecisionStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
					localUpdatesImportFreshReviewDecisionAccepted: true,
					localUpdatesImportFreshReviewDecisionSubmitted: true,
					localUpdatesImportFreshReviewDecisionDecision: 'approved',
					localUpdatesImportFreshReviewRetrySaveHandoffStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
					localUpdatesImportFreshReviewRetrySaveHandoffAccepted: true,
					localUpdatesImportFreshReviewRetrySaveHandoffServerVersion:
						'12',
					localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash:
						proposedPostContentHash,
					localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash:
						candidatePostContentHash,
					retrySaveFreshReviewConsumeValidationAccepted: true,
					retrySaveFreshReviewDecisionConsumptionValidated: true,
					retrySaveFreshReviewDecisionEligibleForRetrySave: true,
					retrySaveFreshReviewRequestRecordId:
						'fresh-review-request-123',
					retrySaveFreshReviewServerVersion: '12',
					retrySaveFreshReviewProposedContentHash:
						proposedPostContentHash,
					retrySaveFreshReviewCandidateContentHash:
						candidatePostContentHash,
					retrySaveFreshReviewHashEvidenceStatus: 'accepted',
					canExportLocalUpdates: true,
				} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSavePolicyState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE,
				saveButtonStatus:
					DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED,
				saveButtonSource: 'fresh_review',
				blocksNormalSavePost: true,
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'retry_save_submitted',
				callsRetrySaveAction: true,
				callsNormalSavePost: false,
			} );

			expect( retrySaveCalls ).toBe( 1 );
			expect( reviewApprovalCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( retrySaveRequestData ).toMatchObject( {
				client_base_version: '12',
				accepted_proof_server_version: '12',
				proposed_post_content: editedPostContent,
				proposed_post_content_hash: proposedPostContentHash,
				accepted_fresh_review_decision: {
					fresh_review_request_record_id: 'fresh-review-request-123',
					server_version: '12',
					proposed_post_content_hash: proposedPostContentHash,
					candidate_post_content_hash: candidatePostContentHash,
					raw_content_included: false,
					exposes_raw_content: false,
					exposes_reviewer_ids: false,
					claims_saved: false,
				},
			} );
			expect(
				retrySaveRequestData.accepted_fresh_review_decision
					.reviewer_user_id
			).toBeUndefined();
			expect(
				retrySaveRequestData.accepted_fresh_review_decision.raw_content
			).toBeUndefined();
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_CONFIRMED,
				claimsSaved: true,
				exposesRawContent: false,
				exposesReviewerIds: false,
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

		it( 'blocks savePost while fresh-review validation is in flight without normal fallback', async () => {
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
					riskyBlockReview: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					mustOfferLocalCopy: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
					localUpdatesImportFreshReviewDecisionStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
					localUpdatesImportFreshReviewDecisionAccepted: true,
					localUpdatesImportFreshReviewDecisionSubmitted: true,
					localUpdatesImportFreshReviewDecisionDecision: 'approved',
					localUpdatesImportFreshReviewRetrySaveHandoffStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING,
					localUpdatesImportFreshReviewRetrySaveHandoffValidating: true,
				} );

			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.FRESH_REVIEW_VALIDATING,
				label: 'Checking review...',
				disabled: true,
				busy: true,
				blocksNormalSavePost: true,
			} );

			await expect(
				registry.dispatch( editorStore ).savePost()
			).resolves.toMatchObject( {
				status: 'fresh_review_validation_in_progress',
				reason: 'fresh_review_handoff_validating',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSaved: false,
			} );

			expect( apiCalls ).toBe( 0 );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSessionState()
			).toMatchObject( {
				hasPendingChanges: true,
				mustOfferLocalCopy: true,
				canExportLocalUpdates: true,
				localUpdatesImportFreshReviewRetrySaveHandoffStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
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
				__experimentalSkipDistributedEditingSaveFreshnessGuard: true,
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
		it( 'skips a queued server autosave when the post is already clean', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'publish',
			};
			const registry = createRegistryWithStores();
			let apiCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				apiCalls++;

				throw {
					code: 'unexpected_path',
					message: `Unexpected path: ${ getMethod( options ) } ${
						options.path
					}`,
				};
			} );

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );

			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);

			await expect(
				registry.dispatch( editorStore ).autosave()
			).resolves.toMatchObject( {
				status: 'autosave_skipped_clean_post',
				callsNormalSavePost: false,
				claimsSaved: false,
			} );
			expect( apiCalls ).toBe( 0 );
		} );

		it( 'blocks current-base dirty Distributed Editing autosave without exposing recovery controls or claiming saved', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Current-base autosave original.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:paragraph --><p>Current-base autosave local edit.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				excerpt: 'crackers',
				status: 'draft',
			};
			const registry = createRegistryWithStores();
			let apiCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				apiCalls++;

				throw {
					code: 'unexpected_path',
					message: `Unexpected path: ${ getMethod( options ) } ${
						options.path
					}`,
				};
			} );

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

			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			await expect(
				registry.dispatch( editorStore ).autosave()
			).resolves.toMatchObject( {
				status: 'distributed_editing_autosave_blocked_for_visible_save',
				reason: 'current_base_dirty_edits_require_visible_save',
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: false,
				callsNormalSavePost: false,
				callsAutosaveEndpoint: false,
				callsRetrySaveEndpoint: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );

			expect( apiCalls ).toBe( 0 );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toBe( editedPostContent );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSaveButtonState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY,
				blocksNormalSavePost: false,
				canExportLocalUpdates: false,
				actionKeys: [],
				claimsSaved: false,
			} );
			expect(
				registry
					.select( editorStore )
					.getDistributedEditingSavePolicyState()
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.UPDATE_READY,
				blocksNormalSavePost: false,
				canExportLocalUpdates: false,
				saveButtonActionKeys: [],
				claimsSaved: false,
			} );
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

		it( 'blocks a queued server autosave while Distributed Editing protects dirty post persistence', async () => {
			const originalPostContent =
				'<!-- wp:paragraph --><p>Original protected autosave.</p><!-- /wp:paragraph -->';
			const editedPostContent =
				'<!-- wp:paragraph --><p>Protected local autosave.</p><!-- /wp:paragraph -->';
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: originalPostContent,
				excerpt: 'crackers',
				status: 'draft',
			};
			let serverStateRefetchCalls = 0;
			let retrySaveCalls = 0;
			let normalSaveCalls = 0;
			let autosaveCalls = 0;

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'GET' &&
					path.startsWith( `/wp/v2/posts/${ postId }` ) &&
					isDistributedEditingPostSnapshotPath( path )
				) {
					serverStateRefetchCalls++;
				}

				if (
					method === 'POST' &&
					path.startsWith( `/wp/v2/posts/${ postId }/autosaves` )
				) {
					autosaveCalls++;
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
					( method === 'POST' || method === 'PUT' ) &&
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
					retrySaveHandoff: true,
				},
			} );
			registry
				.dispatch( editorStore )
				.setDistributedEditingSessionState( {
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					hasPendingChanges: true,
					isAwaitingServerConfirmation: true,
					mustOfferLocalCopy: true,
					canExportLocalUpdates: true,
				} );

			await expect(
				registry.dispatch( editorStore ).autosave()
			).resolves.toBeUndefined();

			expect( serverStateRefetchCalls ).toBe( 0 );
			expect( retrySaveCalls ).toBe( 0 );
			expect( normalSaveCalls ).toBe( 0 );
			expect( autosaveCalls ).toBe( 0 );
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
			expect( registry.select( noticesStore ).getNotices() ).toEqual(
				[]
			);
		} );

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
