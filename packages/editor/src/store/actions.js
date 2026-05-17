/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import deprecated from '@wordpress/deprecated';
import {
	parse,
	synchronizeBlocksWithTemplate,
	__unstableSerializeAndClean,
} from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	applyFilters,
	applyFiltersAsync,
	doActionAsync,
} from '@wordpress/hooks';
import { store as preferencesStore } from '@wordpress/preferences';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { localAutosaveSet } from './local-autosave';
import {
	__experimentalRequestDistributedEditingFreshReviewDecision as requestDistributedEditingFreshReviewDecision,
	__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates as requestDistributedEditingFreshReviewForImportedLocalUpdates,
	__experimentalRequestDistributedEditingFreshReviewRetrySaveHandoffValidation as requestDistributedEditingFreshReviewRetrySaveHandoffValidation,
	__experimentalRequestDistributedEditingPresenceHeartbeat as requestDistributedEditingPresenceHeartbeat,
	__experimentalRequestDistributedEditingPresenceSnapshot as requestDistributedEditingPresenceSnapshot,
	__experimentalRequestDistributedEditingPresenceStorageReadiness as requestDistributedEditingPresenceStorageReadiness,
	__experimentalRequestDistributedEditingRecoveryDryRun as requestDistributedEditingRecoveryDryRun,
	__experimentalRequestDistributedEditingRetrySave as requestDistributedEditingRetrySave,
	__experimentalRequestDistributedEditingRetrySaveReviewApprovalProof as requestDistributedEditingRetrySaveReviewApprovalProof,
	__experimentalRequestDistributedEditingRetrySubmitProbe as requestDistributedEditingRetrySubmitProbe,
	__experimentalRequestDistributedEditingServerStateRefetch as requestDistributedEditingServerStateRefetch,
	__experimentalRequestDistributedEditingStaleBaseRejection as requestDistributedEditingStaleBaseRejection,
	DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} from './distributed-editing-api';
import {
	getDistributedEditingSessionStateForRecoveryDryRunResult,
	getDistributedEditingSessionStateForRetrySaveHandoff,
	getDistributedEditingSessionStateForFreshReviewDecisionItemResolution,
	getDistributedEditingSessionStateForFreshReviewDecisionItems,
	getDistributedEditingSessionStateForFreshReviewDecisionResult,
	getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidation,
	getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidationResult,
	getDistributedEditingSessionStateForFreshReviewRequestResult,
	getDistributedEditingSessionStateForPresenceHeartbeatResult,
	getDistributedEditingSessionStateForPresenceRepeatedRefreshRuntimeConfig,
	getDistributedEditingSessionStateForPresenceStorageReadinessRecheckResult,
	getDistributedEditingSessionStateForPresenceStartupPolicyConfig,
	getDistributedEditingSessionStateForPresenceSnapshotRefreshResult,
	getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult,
	getDistributedEditingSessionStateForRetrySaveRequest,
	getDistributedEditingSessionStateForRetrySaveResult,
	getDistributedEditingSessionStateForRiskyBlockReviewItemResolution,
	getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest,
	getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest,
	getDistributedEditingLocalUpdatesImportResult,
	getDistributedEditingComparablePostContent,
	getDistributedEditingPostContentFromResponse,
	getDistributedEditingPostContentSha256Hash,
	getDistributedEditingBlockIdentityRequestProofDescriptor,
	getDistributedEditingReviewedBlockItemsForFreshReviewDecision,
	getDistributedEditingReviewedBlockItemsForRetrySaveReviewApprovalProof,
	getDistributedEditingServerVersionFromResponse,
	getDistributedEditingSyncMetaFromPostContent,
	getDistributedEditingSessionStateForRetrySubmitHandoff,
	getDistributedEditingSessionStateForRetrySubmitProofResult,
	getDistributedEditingSessionStateForRetrySubmitSavePreparation,
	getDistributedEditingRetrySavePolicyForSessionState,
	getDistributedEditingSessionStateWithActionTranscriptEvent,
	normalizeDistributedEditingSessionState,
	DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES,
	DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES,
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES,
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES,
	DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS,
	DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES,
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES,
	getDistributedEditingStaleBaseLocalRebaseResult,
	getDistributedEditingSessionStateForStaleBaseLocalRebasePlan,
	getDistributedEditingSessionStateForStaleBaseRejectionResult,
	getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult,
	hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState,
} from './distributed-editing';
import {
	getNotificationArgumentsForSaveSuccess,
	getNotificationArgumentsForSaveFail,
	getNotificationArgumentsForTrashFail,
} from './utils/notice-builder';
import { unlock } from '../lock-unlock';

const distributedEditingFreshReviewImportContentVault = new Map();
let distributedEditingPresenceSessionKey;

const DISTRIBUTED_EDITING_STRUCTURAL_NOOP_SAVE_REASONS = new Set( [
	'block_deleted',
	'block_inserted',
	'block_reordered',
] );
const DISTRIBUTED_EDITING_STRUCTURAL_NOOP_SAVE_REASON =
	'structural_choice_already_authoritative';

function getDistributedEditingPresenceSessionKey() {
	if ( ! distributedEditingPresenceSessionKey ) {
		const randomUuid = globalThis.crypto?.randomUUID;
		distributedEditingPresenceSessionKey =
			typeof randomUuid === 'function'
				? randomUuid.call( globalThis.crypto )
				: `de-rtc-presence-${ Date.now() }-${ Math.random()
						.toString( 36 )
						.slice( 2 ) }`;
	}

	return distributedEditingPresenceSessionKey;
}

function getDistributedEditingNormalizedSerializedBlockContent( postContent ) {
	const comparablePostContent =
		getDistributedEditingComparablePostContent( postContent );

	try {
		return __unstableSerializeAndClean( parse( comparablePostContent ) );
	} catch {
		return comparablePostContent;
	}
}

function getDistributedEditingStructuralNoopSaveCandidate( {
	editedPostContent,
	sessionState,
} = {} ) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	if (
		normalized.localRebaseResultStatus !==
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED ||
		! DISTRIBUTED_EDITING_STRUCTURAL_NOOP_SAVE_REASONS.has(
			normalized.localRebaseResultReason
		) ||
		normalized.staleBaseConflictResolutionChoice !==
			DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS ||
		normalized.retrySubmitProofStatus !==
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE ||
		normalized.retrySubmitAccepted !== true ||
		normalized.retrySubmitSavePathRequired !== true ||
		normalized.retrySubmitSaveStatus !==
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY ||
		normalized.retrySubmitSaveReady !== true ||
		typeof normalized.refetchedServerContent !== 'string'
	) {
		return null;
	}

	const comparableRefetchedServerContent =
		getDistributedEditingComparablePostContent(
			normalized.refetchedServerContent
		);
	const normalizedRefetchedServerContent =
		getDistributedEditingNormalizedSerializedBlockContent(
			comparableRefetchedServerContent
		);

	if (
		typeof editedPostContent === 'string' &&
		getDistributedEditingNormalizedSerializedBlockContent(
			editedPostContent
		) !== normalizedRefetchedServerContent
	) {
		return null;
	}

	return {
		comparablePostContent: comparableRefetchedServerContent,
		serverVersion:
			normalized.serverVersion || normalized.clientBaseVersion || null,
	};
}

function getDistributedEditingSessionStateForStructuralNoopSaveConfirmation(
	sessionState,
	{ comparablePostContent, serverVersion } = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return normalizeDistributedEditingSessionState( {
		...normalized,
		disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
		reasonCode: null,
		clientBaseVersion: serverVersion,
		serverVersion,
		clientBaseContent: comparablePostContent ?? null,
		refetchedServerContent: comparablePostContent ?? null,
		pendingChangeCount: 0,
		hasPendingChanges: false,
		isAwaitingServerConfirmation: false,
		remoteChangeCount: 0,
		hasRemoteChanges: false,
		requiresServerStateAcceptance: false,
		requiresServerStateRefetch: false,
		refetchedServerState: false,
		canAttemptLocalRebase: false,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NONE,
		localRebaseResultStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.NONE,
		localRebaseResultReason: null,
		staleBaseConflictResolutionStatus:
			DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.NONE,
		staleBaseConflictResolutionChoice: null,
		staleBaseConflictResolutionRequiresFreshProof: false,
		staleBaseConflictResolutionCallsRest: false,
		staleBaseConflictResolutionCallsSave: false,
		staleBaseConflictResolutionMutatesEditorContent: false,
		staleBaseConflictResolutionMutatesPersistedPostContent: false,
		staleBaseConflictResolutionCreatesRevision: false,
		staleBaseConflictResolutionChangesPostLock: false,
		staleBaseConflictResolutionClaimsSaved: false,
		requiresManualConflictResolution: false,
		readyToRetrySubmit: false,
		retrySubmitHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
		retrySubmitHandoffReason: null,
		retrySubmitPrepared: false,
		retrySubmitProofStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
		retrySubmitProofReason: null,
		retrySubmitAccepted: false,
		retrySubmitSavePathRequired: false,
		retrySubmitSavesPost: false,
		retrySubmitMutatesPostContent: false,
		retrySubmitCreatesRevision: false,
		retrySubmitClaimsSaved: false,
		retrySubmitSaveStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
		retrySubmitSaveReason: null,
		retrySubmitSavePrepared: false,
		retrySubmitSaveReady: false,
		retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
		retrySaveReason: null,
		retrySaveHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.NONE,
		retrySaveHandoffReason: null,
		retrySaveHandoffAllowsNormalSaveFallback: false,
		retrySaveHandoffBlocksNormalSave: false,
		retrySaveAccepted: false,
		retrySaveServerVersion: null,
		retrySavePreviousServerVersion: null,
		retrySaveSavesPost: false,
		retrySaveMutatesPostContent: false,
		retrySaveCreatesRevision: false,
		retrySaveClaimsSaved: false,
		retrySaveRevisionCreated: false,
		retrySaveCreatedRevisionIds: [],
		retrySaveConfirmedMergedEdits: false,
		retrySaveServerMerged: false,
		retrySaveServerMergeApplied: false,
		retrySaveServerMergeStatus: null,
		retrySaveServerMergeStrategy: null,
		retrySaveServerMergeBaseVersion: null,
		retrySaveServerMergeServerVersion: null,
		retrySaveServerMergeBlockCount: 0,
		retrySaveServerMergeServerChangedIndexes: [],
		retrySaveServerMergeLocalChangedIndexes: [],
		retrySaveServerMergeMergedStrippedContentHash: null,
		mustOfferLocalCopy: false,
		canExportLocalUpdates: false,
	} );
}

function applyDistributedEditingStructuralNoopSaveConfirmation( {
	dispatch,
	registry,
	select,
	policy = null,
	sessionState,
	structuralNoopSaveCandidate,
} ) {
	const nextSessionState =
		getDistributedEditingSessionStateWithActionTranscriptEvent(
			getDistributedEditingSessionStateForStructuralNoopSaveConfirmation(
				sessionState,
				structuralNoopSaveCandidate
			),
			{
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
				reasonCode: null,
			}
		);

	applyDistributedEditingConfirmedPostContent( {
		dispatch,
		registry,
		select,
		postContent: structuralNoopSaveCandidate.comparablePostContent,
	} );
	dispatch.setDistributedEditingSessionState( nextSessionState );

	return {
		status: 'structural_choice_already_authoritative_from_save_click',
		reason: DISTRIBUTED_EDITING_STRUCTURAL_NOOP_SAVE_REASON,
		policy,
		allowsNormalSaveFallback: false,
		blocksNormalSavePost: true,
		opensPrePublishReview: false,
		requiresServerStateRefetch: false,
		callsServerStateRefetchEndpoint: false,
		callsRetrySubmitEndpoint: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		callsRetrySaveAction: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		createsRevision: false,
		claimsSaved: false,
		authoritativePostAlreadyCurrent: true,
	};
}

/**
 * Returns an action generator used in signalling that editor has initialized with
 * the specified post object and editor settings.
 *
 * @param {Object} post       Post object.
 * @param {Object} edits      Initial edited attributes object.
 * @param {Array}  [template] Block Template.
 */
export const setupEditor =
	( post, edits, template ) =>
	( { dispatch } ) => {
		dispatch.setEditedPost( post.type, post.id );
		// Apply a template for new posts only, if exists.
		const isNewPost = post.status === 'auto-draft';
		if ( isNewPost && template ) {
			// In order to ensure maximum of a single parse during setup, edits are
			// included as part of editor setup action. Assume edited content as
			// canonical if provided, falling back to post.
			let content;
			if ( 'content' in edits ) {
				content = edits.content;
			} else {
				content = post.content.raw;
			}
			let blocks = parse( content );
			blocks = synchronizeBlocksWithTemplate( blocks, template );
			dispatch.resetEditorBlocks( blocks, {
				__unstableShouldCreateUndoLevel: false,
			} );
		}
		if (
			edits &&
			Object.entries( edits ).some(
				( [ key, edit ] ) =>
					edit !== ( post[ key ]?.raw ?? post[ key ] )
			)
		) {
			dispatch.editPost( edits );
		}
	};

/**
 * Returns an action object signalling that the editor is being destroyed and
 * that any necessary state or side-effect cleanup should occur.
 *
 * @deprecated
 *
 * @return {Object} Action object.
 */
export function __experimentalTearDownEditor() {
	deprecated(
		"wp.data.dispatch( 'core/editor' ).__experimentalTearDownEditor",
		{
			since: '6.5',
		}
	);
	return { type: 'DO_NOTHING' };
}

/**
 * Returns an action object used in signalling that the latest version of the
 * post has been received, either by initialization or save.
 *
 * @deprecated Since WordPress 6.0.
 */
export function resetPost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).resetPost", {
		since: '6.0',
		version: '6.3',
		alternative: 'Initialize the editor with the setupEditorState action',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Returns an action object used in signalling that a patch of updates for the
 * latest version of the post have been received.
 *
 * @return {Object} Action object.
 * @deprecated since Gutenberg 9.7.0.
 */
export function updatePost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).updatePost", {
		since: '5.7',
		alternative: 'Use the core entities store instead',
	} );
	return {
		type: 'DO_NOTHING',
	};
}

/**
 * Setup the editor state.
 *
 * @deprecated
 *
 * @param {Object} post Post object.
 */
export function setupEditorState( post ) {
	deprecated( "wp.data.dispatch( 'core/editor' ).setupEditorState", {
		since: '6.5',
		alternative: "wp.data.dispatch( 'core/editor' ).setEditedPost",
	} );
	return setEditedPost( post.type, post.id );
}

/**
 * Returns an action that sets the current post Type and post ID.
 *
 * @param {string} postType Post Type.
 * @param {string} postId   Post ID.
 *
 * @return {Object} Action object.
 */
export function setEditedPost( postType, postId ) {
	return {
		type: 'SET_EDITED_POST',
		postType,
		postId,
	};
}

/**
 * Returns an action object used in signalling that the distributed editing
 * session state should be replaced.
 *
 * @param {Object} sessionState Distributed editing session state.
 *
 * @return {Object} Action object.
 */
export function setDistributedEditingSessionState( sessionState = {} ) {
	return {
		type: 'SET_DISTRIBUTED_EDITING_SESSION_STATE',
		sessionState,
	};
}

/**
 * Returns an action object used in signalling that the distributed editing
 * session state should be partially updated.
 *
 * @param {Object} sessionState Partial distributed editing session state.
 *
 * @return {Object} Action object.
 */
export function updateDistributedEditingSessionState( sessionState = {} ) {
	return {
		type: 'UPDATE_DISTRIBUTED_EDITING_SESSION_STATE',
		sessionState,
	};
}

/**
 * Returns an action object used in signalling that the distributed editing
 * session state should be reset for the current editor.
 *
 * @return {Object} Action object.
 */
export function resetDistributedEditingSessionState() {
	return {
		type: 'RESET_DISTRIBUTED_EDITING_SESSION_STATE',
	};
}

/**
 * Appends one support-safe Distributed Editing action transcript event. This is
 * an explicit lifecycle handoff, not broad Redux middleware capture.
 *
 * @param {Object} transcriptEvent Candidate transcript event.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalAppendDistributedEditingActionTranscriptEvent =
	( transcriptEvent = {} ) =>
	( { select, dispatch } ) => {
		const sessionState = select.getDistributedEditingSessionState?.() || {};
		const acceptedEventState =
			getDistributedEditingSessionStateWithActionTranscriptEvent(
				{},
				transcriptEvent
			);
		const nextSessionState =
			getDistributedEditingSessionStateWithActionTranscriptEvent(
				sessionState,
				transcriptEvent
			);

		dispatch.setDistributedEditingSessionState( nextSessionState );

		return {
			sessionState: nextSessionState,
			appended: acceptedEventState.actionTranscriptItemCount > 0,
			droppedItemCount: nextSessionState.actionTranscriptDroppedItemCount,
			callsRest: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		};
	};

/**
 * Opens the pre-publish review surface when DE-RTC risky-block policy requires
 * human review. This is a UI handoff only: it does not save, retry-save,
 * dispatch notices, mutate content, or change post locks.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalOpenDistributedEditingRiskyBlockReview =
	() =>
	( { select, dispatch } ) => {
		const savePolicy =
			select.getDistributedEditingSavePolicyState?.() || {};
		const shouldOpenPrePublishReview =
			savePolicy.opensPrePublishReview ||
			savePolicy.clickAction ===
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;

		if ( ! shouldOpenPrePublishReview ) {
			return {
				status: 'pre_publish_review_not_required',
				opensPublishSidebar: false,
				focusesReviewPanel: false,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		}

		dispatch.openPublishSidebar();
		const nextSessionState =
			getDistributedEditingSessionStateWithActionTranscriptEvent(
				select.getDistributedEditingSessionState?.() || {},
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REVIEW_REQUIRED,
					reasonCode:
						savePolicy.reason ||
						savePolicy.saveButtonReason ||
						'risky_block_review_required',
				}
			);

		dispatch.setDistributedEditingSessionState( nextSessionState );

		return {
			status: 'pre_publish_review_opened',
			opensPublishSidebar: true,
			focusesReviewPanel: true,
			reviewPanel: 'distributed_editing_risky_block_review',
			actionTranscriptItemCount:
				nextSessionState.actionTranscriptItemCount,
			actionTranscriptLatestEventType:
				nextSessionState.actionTranscriptLatestEventType,
			actionTranscriptEntriesRedacted:
				nextSessionState.actionTranscriptEntriesRedacted,
			actionTranscriptCallsSave:
				nextSessionState.actionTranscriptCallsSave,
			actionTranscriptClaimsSaved:
				nextSessionState.actionTranscriptClaimsSaved,
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
		};
	};

/**
 * Focuses the editor block represented by a DE-RTC risky-block review item.
 * Selecting a block is allowed for review ergonomics, but this action must not
 * edit block content, save, retry-save, dispatch notices, or change post locks.
 *
 * @param {string} reviewItemId Risky-block review item id.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalFocusDistributedEditingRiskyBlockReviewItem =
	( reviewItemId ) =>
	( { select, registry } ) => {
		const reviewState =
			select.getDistributedEditingRiskyBlockReviewState?.() || {};
		const reviewItem = Array.isArray( reviewState.reviewItems )
			? reviewState.reviewItems.find(
					( item ) => item.id === reviewItemId
			  )
			: null;

		if ( ! reviewItem ) {
			return {
				status: 'review_item_not_found',
				reviewItemId,
				selectsBlock: false,
				savesPost: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		}

		if ( reviewItem.blockClientId ) {
			registry
				.dispatch( blockEditorStore )
				.selectBlock( reviewItem.blockClientId );
		}

		return {
			status: reviewItem.blockClientId
				? 'review_item_block_focused'
				: 'review_item_has_no_block_client_id',
			reviewItemId,
			blockClientId: reviewItem.blockClientId,
			selectsBlock: Boolean( reviewItem.blockClientId ),
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
		};
	};

/**
 * Records a hash-only reviewer decision for one risky-block item. This updates
 * only local DE-RTC session state for a future guarded save handoff.
 *
 * @param {Object} resolution Review decision data.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalResolveDistributedEditingRiskyBlockReviewItem =
	( resolution = {} ) =>
	( { select, dispatch } ) => {
		const reviewItemId = resolution.reviewItemId || resolution.id;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const currentItems = Array.isArray(
			currentSessionState.riskyBlockReviewItems
		)
			? currentSessionState.riskyBlockReviewItems
			: [];
		const currentItem = currentItems.find(
			( item ) => item.id === reviewItemId
		);

		if ( ! currentItem ) {
			return {
				status: 'review_item_not_found',
				reviewItemId,
				decision: resolution.decision || 'approved',
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		}

		const sessionState =
			getDistributedEditingSessionStateForRiskyBlockReviewItemResolution(
				currentSessionState,
				resolution
			);
		const resolvedItem = sessionState.riskyBlockReviewItems.find(
			( item ) => item.id === reviewItemId
		);

		dispatch.setDistributedEditingSessionState( sessionState );

		return {
			status: 'review_item_resolved',
			reviewItemId,
			decision: resolution.decision || 'approved',
			reviewStatus: resolvedItem?.reviewStatus,
			pendingReviewItemCount: sessionState.riskyBlockReviewPendingCount,
			approvedReviewItemCount: sessionState.riskyBlockReviewApprovedCount,
			rejectedReviewItemCount: sessionState.riskyBlockReviewRejectedCount,
			saveClickAction: sessionState.riskyBlockReviewSaveClickAction,
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
			sessionState,
		};
	};

/**
 * Routes a normal Save attempt into the risky-block review surface when DE-RTC
 * policy says unresolved HTML review must happen first. This is the Save-path
 * handoff only: it does not save, retry-save, call REST, dispatch notices,
 * mutate editor content, or change post locks.
 *
 * @param {Object} [options] Save options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview =

		( options = {} ) =>
		async ( { select, dispatch } ) => {
			const savePolicy =
				select.getDistributedEditingSavePolicyState?.() || {};
			const shouldUseRiskyBlockReview =
				select.shouldUseDistributedEditingRiskyBlockReviewForSavePost?.(
					options
				);

			if ( ! shouldUseRiskyBlockReview ) {
				return {
					status: 'normal_save_fallback',
					reason: null,
					policy: savePolicy,
					allowsNormalSaveFallback: true,
					blocksNormalSavePost: false,
					opensPrePublishReview: false,
					requiresServerStateRefetch: false,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			if (
				savePolicy.clickAction ===
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE ||
				savePolicy.requiresServerStateRefetch
			) {
				const isRiskyBlockReviewRefetch =
					savePolicy.saveButtonSource === 'risky_block_review' ||
					savePolicy.reason === 'risky_block_review_stale';

				return {
					status: isRiskyBlockReviewRefetch
						? 'risky_block_review_refetch_required'
						: 'distributed_editing_refetch_required',
					reason:
						savePolicy.reason ||
						DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
					policy: savePolicy,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: false,
					requiresServerStateRefetch: true,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			if (
				savePolicy.saveButtonStatus ===
				DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.FRESH_REVIEW_VALIDATING
			) {
				return {
					status: 'fresh_review_validation_in_progress',
					reason:
						savePolicy.reason ||
						savePolicy.saveButtonReason ||
						'fresh_review_handoff_validating',
					policy: savePolicy,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: false,
					requiresServerStateRefetch: false,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			if (
				savePolicy.opensPrePublishReview ||
				savePolicy.clickAction ===
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW
			) {
				const openResult =
					await dispatch.__experimentalOpenDistributedEditingRiskyBlockReview();

				return {
					...openResult,
					status: openResult.status || 'pre_publish_review_opened',
					reason: savePolicy.reason || 'risky_block_review_required',
					policy: savePolicy,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: true,
					requiresServerStateRefetch: false,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			if (
				savePolicy.status ===
					DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE ||
				savePolicy.clickAction ===
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE
			) {
				const approvedReviewItemCount =
					savePolicy.approvedReviewItemCount ?? 0;
				const hasAcceptedReviewApprovalProof = Boolean(
					savePolicy.saveButton?.hasAcceptedReviewApprovalProof
				);
				const shouldRequestReviewApprovalProof =
					! hasAcceptedReviewApprovalProof &&
					( savePolicy.saveButtonSource === 'risky_block_review' ||
						approvedReviewItemCount > 0 );

				if ( ! shouldRequestReviewApprovalProof ) {
					return {
						status: 'guarded_retry_save_policy_deferred',
						reason:
							savePolicy.reason ||
							savePolicy.saveButtonReason ||
							null,
						policy: savePolicy,
						allowsNormalSaveFallback: true,
						continuesToRetrySavePolicy: true,
						blocksNormalSavePost: Boolean(
							savePolicy.blocksNormalSavePost
						),
						opensPrePublishReview: false,
						requiresServerStateRefetch: false,
						callsReviewApprovalProofEndpoint: false,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: false,
						dispatchesNotice: false,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						changesPostLock: false,
						claimsSaved: false,
					};
				}

				if ( approvedReviewItemCount < 1 ) {
					return {
						status: 'risky_block_review_no_approved_items',
						reason: 'risky_block_review_no_approved_items',
						policy: savePolicy,
						allowsNormalSaveFallback: false,
						blocksNormalSavePost: true,
						opensPrePublishReview: false,
						requiresServerStateRefetch: false,
						callsReviewApprovalProofEndpoint: false,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: false,
						dispatchesNotice: false,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						changesPostLock: false,
						claimsSaved: false,
					};
				}

				try {
					const response =
						await dispatch.__experimentalRefreshDistributedEditingRetrySaveReviewApprovalProof(
							options
						);
					const sessionState =
						select.getDistributedEditingSessionState?.() || {};

					return {
						status: sessionState.retrySaveReviewApprovalAccepted
							? 'review_approval_proof_accepted'
							: 'review_approval_proof_requested',
						reason:
							sessionState.retrySaveReviewApprovalProofReason ||
							null,
						policy: savePolicy,
						response,
						responseResult: response?.result,
						allowsNormalSaveFallback: false,
						blocksNormalSavePost: true,
						opensPrePublishReview: false,
						requiresServerStateRefetch: Boolean(
							sessionState.requiresServerStateRefetch
						),
						callsReviewApprovalProofEndpoint: true,
						reviewApprovalProofAccepted: Boolean(
							sessionState.retrySaveReviewApprovalAccepted
						),
						retrySaveReviewApprovalProofStatus:
							sessionState.retrySaveReviewApprovalProofStatus,
						reviewedBlockItemCount:
							sessionState.retrySaveReviewApprovalReviewedBlockItemCount,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: false,
						dispatchesNotice: false,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						changesPostLock: false,
						claimsSaved: false,
					};
				} catch ( error ) {
					const sessionState =
						select.getDistributedEditingSessionState?.() || {};

					return {
						status: 'review_approval_proof_rejected',
						reason:
							sessionState.retrySaveReviewApprovalProofReason ||
							error?.code ||
							error?.message ||
							'review_approval_proof_rejected',
						policy: savePolicy,
						error,
						allowsNormalSaveFallback: false,
						blocksNormalSavePost: true,
						opensPrePublishReview: false,
						requiresServerStateRefetch: Boolean(
							sessionState.requiresServerStateRefetch
						),
						callsReviewApprovalProofEndpoint: true,
						reviewApprovalProofAccepted: false,
						retrySaveReviewApprovalProofStatus:
							sessionState.retrySaveReviewApprovalProofStatus,
						reviewedBlockItemCount:
							sessionState.retrySaveReviewApprovalReviewedBlockItemCount,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: false,
						dispatchesNotice: false,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						changesPostLock: false,
						claimsSaved: false,
					};
				}
			}

			return {
				status: 'normal_save_fallback',
				reason: null,
				policy: savePolicy,
				allowsNormalSaveFallback: true,
				blocksNormalSavePost: false,
				opensPrePublishReview: false,
				requiresServerStateRefetch: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		};

/**
 * Handles explicit Distributed Editing Save button actions before the button
 * mutates publish status or falls through to the normal save flow.
 *
 * Refetch, retry-submit proof checks, and a ready guarded retry-save are the
 * only transport calls this action owns. Review handoff continues through the
 * existing Save policy actions, and protected states must still block ordinary
 * post save fallback.
 *
 * @param {Object} [options] Save options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalMaybeHandleDistributedEditingSaveButtonClick =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const savePolicy =
			select.getDistributedEditingSavePolicyState?.() || {};
		const initialSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const shouldUseRiskyBlockReview =
			select.shouldUseDistributedEditingRiskyBlockReviewForSavePost?.(
				options
			);
		const shouldUseRetrySave =
			select.shouldUseDistributedEditingRetrySaveForSavePost?.( options );
		const shouldAllowConfirmedSaveNormalFallback = Boolean(
			options.__experimentalAllowDistributedEditingConfirmedSaveNormalFallback &&
				savePolicy.status ===
					DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.RETRY_SAVE_CONFIRMED &&
				savePolicy.saveButton?.hasRetrySaveSavedStateEvidence &&
				savePolicy.saveButton?.authoritativePostUpdated &&
				! savePolicy.saveButton?.hasProtectedLocalChanges &&
				! savePolicy.saveButton?.pendingServerConfirmation
		);
		const shouldHandleDistributedEditingClick =
			( shouldUseRiskyBlockReview || shouldUseRetrySave ) &&
			Boolean( savePolicy.blocksNormalSavePost ) &&
			! shouldAllowConfirmedSaveNormalFallback;

		if (
			! shouldHandleDistributedEditingClick &&
			shouldUseRetrySave &&
			( select.isEditedPostDirty?.() ||
				( initialSessionState.hasPendingChanges &&
					initialSessionState.canExportLocalUpdates ) )
		) {
			const freshnessGuard =
				await dispatch.__experimentalGuardDistributedEditingNormalSaveFreshness(
					options
				);

			if ( ! freshnessGuard.allowsNormalSaveFallback ) {
				return {
					...freshnessGuard,
					status:
						freshnessGuard.status ===
						'distributed_editing_normal_save_guarded_retry_save_submitted'
							? 'guarded_retry_save_submitted_from_save_click'
							: freshnessGuard.status,
					handledFreshProtectedChangesBeforeStatusEdit: true,
					callsNormalSavePost: false,
				};
			}
		}

		if ( ! shouldHandleDistributedEditingClick ) {
			return {
				status: 'normal_save_fallback',
				reason: null,
				policy: savePolicy,
				allowsNormalSaveFallback: true,
				blocksNormalSavePost: false,
				callsServerStateRefetchEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		}

		if (
			savePolicy.status ===
				DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.IN_FLIGHT ||
			savePolicy.status ===
				DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.RETRY_SAVE_CONFIRMED ||
			savePolicy.saveButtonDisabled
		) {
			return {
				status: 'distributed_editing_save_button_blocked',
				reason:
					savePolicy.reason ||
					savePolicy.saveButtonReason ||
					'distributed_editing_save_button_blocked',
				policy: savePolicy,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: Boolean( savePolicy.saveButton?.claimsSaved ),
			};
		}

		if (
			savePolicy.clickAction ===
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE ||
			savePolicy.requiresServerStateRefetch
		) {
			try {
				const response =
					await dispatch.__experimentalRefreshDistributedEditingServerStateAfterStaleBase(
						options
					);
				let sessionState =
					select.getDistributedEditingSessionState?.() || {};

				if (
					savePolicy.saveButtonSource === 'risky_block_review' &&
					sessionState.riskyBlockReviewRequiresServerStateRefetch
				) {
					const hasPendingReviewItems =
						( sessionState.riskyBlockReviewPendingCount ?? 0 ) > 0;

					dispatch.setDistributedEditingSessionState( {
						...sessionState,
						riskyBlockReviewRequiresServerStateRefetch: false,
						riskyBlockReviewStatus: hasPendingReviewItems
							? DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED
							: sessionState.riskyBlockReviewStatus,
						riskyBlockReviewSaveButtonLabel: hasPendingReviewItems
							? 'Review changes'
							: sessionState.riskyBlockReviewSaveButtonLabel,
						riskyBlockReviewSaveClickAction: hasPendingReviewItems
							? DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW
							: sessionState.riskyBlockReviewSaveClickAction,
					} );
					sessionState =
						select.getDistributedEditingSessionState?.() || {};
				}

				return {
					status: 'server_state_refetched_before_save',
					reason:
						savePolicy.reason ||
						savePolicy.saveButtonReason ||
						null,
					policy: savePolicy,
					response,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: false,
					requiresServerStateRefetch: Boolean(
						sessionState.requiresServerStateRefetch
					),
					refetchedServerState: Boolean(
						sessionState.refetchedServerState
					),
					requiresRiskyBlockReviewServerStateRefetch: Boolean(
						sessionState.riskyBlockReviewRequiresServerStateRefetch
					),
					callsServerStateRefetchEndpoint: true,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			} catch ( error ) {
				const sessionState =
					select.getDistributedEditingSessionState?.() || {};

				return {
					status: 'server_state_refetch_failed_before_save',
					reason:
						error?.code ||
						error?.message ||
						savePolicy.reason ||
						savePolicy.saveButtonReason ||
						'server_state_refetch_failed',
					policy: savePolicy,
					error,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: false,
					requiresServerStateRefetch: Boolean(
						sessionState.requiresServerStateRefetch
					),
					refetchedServerState: Boolean(
						sessionState.refetchedServerState
					),
					callsServerStateRefetchEndpoint: true,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}
		}

		if (
			savePolicy.status ===
			DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.WORKFLOW_ACTION_REQUIRED
		) {
			const reason =
				savePolicy.reason ||
				savePolicy.saveButtonReason ||
				'distributed_editing_workflow_action_required';

			if (
				savePolicy.clickAction ===
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.COMPARE_CONFLICTING_CHANGES
			) {
				const sessionState =
					select.getDistributedEditingSessionState?.() || {};

				return {
					status: 'manual_conflict_comparison_required_before_save',
					reason,
					policy: savePolicy,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: false,
					requiresServerStateRefetch: false,
					requiresManualConflictResolution: Boolean(
						sessionState.requiresManualConflictResolution
					),
					canExportLocalUpdates: Boolean(
						savePolicy.canExportLocalUpdates ||
							sessionState.canExportLocalUpdates
					),
					preservesCompareState: true,
					callsServerStateRefetchEndpoint: false,
					callsRetrySubmitEndpoint: false,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			if (
				savePolicy.clickAction ===
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.APPLY_LOCAL_CHANGES
			) {
				const result =
					await dispatch.__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase(
						options
					);

				return {
					status: 'local_changes_applied_before_save',
					reason,
					policy: savePolicy,
					result,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: false,
					requiresServerStateRefetch: false,
					callsServerStateRefetchEndpoint: false,
					callsRetrySubmitEndpoint: false,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: Boolean(
						result?.hasCandidatePostContent
					),
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			if (
				savePolicy.clickAction ===
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.PREPARE_CHANGES
			) {
				const result =
					await dispatch.__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase(
						options
					);

				return {
					status: 'retry_submit_prepared_before_save',
					reason,
					policy: savePolicy,
					result,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: false,
					requiresServerStateRefetch: false,
					callsServerStateRefetchEndpoint: false,
					callsRetrySubmitEndpoint: false,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			if (
				savePolicy.clickAction ===
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CHECK_WITH_WORDPRESS
			) {
				try {
					const response =
						await dispatch.__experimentalRefreshDistributedEditingRetrySubmitProof(
							options
						);

					return {
						status: 'retry_submit_proof_refreshed_before_save',
						reason,
						policy: savePolicy,
						response,
						allowsNormalSaveFallback: false,
						blocksNormalSavePost: true,
						opensPrePublishReview: false,
						requiresServerStateRefetch: false,
						callsServerStateRefetchEndpoint: false,
						callsRetrySubmitEndpoint: true,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: false,
						dispatchesNotice: false,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						changesPostLock: false,
						claimsSaved: false,
					};
				} catch ( error ) {
					return {
						status: 'retry_submit_proof_refresh_failed_before_save',
						reason:
							error?.code ||
							error?.message ||
							reason ||
							'retry_submit_proof_refresh_failed',
						policy: savePolicy,
						error,
						allowsNormalSaveFallback: false,
						blocksNormalSavePost: true,
						opensPrePublishReview: false,
						requiresServerStateRefetch: false,
						callsServerStateRefetchEndpoint: false,
						callsRetrySubmitEndpoint: true,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: false,
						dispatchesNotice: false,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						changesPostLock: false,
						claimsSaved: false,
					};
				}
			}

			return {
				status: 'distributed_editing_save_button_blocked',
				reason,
				policy: savePolicy,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				opensPrePublishReview: false,
				requiresServerStateRefetch: false,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		}

		const riskyBlockReviewRouting =
			await dispatch.__experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview(
				options
			);

		if (
			riskyBlockReviewRouting.status !== 'normal_save_fallback' &&
			! riskyBlockReviewRouting.continuesToRetrySavePolicy
		) {
			return riskyBlockReviewRouting;
		}

		if (
			savePolicy.clickAction ===
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE
		) {
			const currentSessionState =
				select.getDistributedEditingSessionState?.() || {};
			const structuralNoopSaveCandidate =
				getDistributedEditingStructuralNoopSaveCandidate( {
					editedPostContent: select.getEditedPostContent?.(),
					sessionState: currentSessionState,
				} );

			if ( structuralNoopSaveCandidate ) {
				return applyDistributedEditingStructuralNoopSaveConfirmation( {
					dispatch,
					registry,
					select,
					policy: savePolicy,
					sessionState: currentSessionState,
					structuralNoopSaveCandidate,
				} );
			}
		}

		if (
			savePolicy.clickAction ===
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE &&
			savePolicy.saveButtonReason ===
				'accepted_retry_submit_proof_needs_save_preparation'
		) {
			const result =
				await dispatch.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof();
			const sessionState =
				select.getDistributedEditingSessionState?.() || {};

			return {
				status: 'retry_submit_save_prepared_before_save',
				reason: savePolicy.saveButtonReason,
				policy: savePolicy,
				result,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				opensPrePublishReview: false,
				requiresServerStateRefetch: false,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				retrySubmitSaveStatus: sessionState.retrySubmitSaveStatus,
				retrySubmitSaveReady: Boolean(
					sessionState.retrySubmitSaveReady
				),
			};
		}

		if (
			savePolicy.status ===
				DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE ||
			savePolicy.clickAction ===
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE
		) {
			const retrySaveResult =
				await dispatch.__experimentalMaybeSavePostWithDistributedEditingRetryPolicy(
					{
						...options,
						__experimentalAllowDistributedEditingStructuralNoopSave: true,
					}
				);
			const allowsNormalSaveFallback = Boolean(
				retrySaveResult.allowsNormalSaveFallback &&
					! savePolicy.blocksNormalSavePost
			);

			return {
				...retrySaveResult,
				status:
					retrySaveResult.status === 'retry_save_submitted'
						? 'guarded_retry_save_submitted_from_save_click'
						: retrySaveResult.status,
				reason:
					retrySaveResult.reason ||
					savePolicy.reason ||
					savePolicy.saveButtonReason ||
					null,
				saveButtonPolicy: savePolicy,
				allowsNormalSaveFallback,
				blocksNormalSavePost: ! allowsNormalSaveFallback,
				opensPrePublishReview: false,
				callsServerStateRefetchEndpoint: false,
				callsRetrySubmitEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: Boolean(
					retrySaveResult.callsRetrySaveAction
				),
				dispatchesNotice: false,
				changesPostLock: false,
			};
		}

		return dispatch.__experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview(
			options
		);
	};

/**
 * Requests a Distributed Editing recovery dry run and stores inert status.
 *
 * The action does not save, apply recovery, replace post locks, dispatch
 * notices, or persist editor state. API errors are reflected into DE-RTC state
 * before being rethrown for callers that need command-level handling.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingRecoveryDryRun =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;

		try {
			const response = await requestDistributedEditingRecoveryDryRun( {
				postId,
				restBase,
				candidatePostContentHash: options.candidatePostContentHash,
			} );

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForRecoveryDryRunResult(
					response
				)
			);

			return response;
		} catch ( error ) {
			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForRecoveryDryRunResult(
					error
				)
			);

			throw error;
		}
	};

/**
 * Requests a read-only Distributed Editing presence snapshot and stores local
 * roster descriptors. The action is explicit and one-shot: it does not start
 * polling, write heartbeats, save, mutate editor content, dispatch global
 * notices, persist editor state, or change post locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingPresenceSnapshot =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};

		try {
			const response = await requestDistributedEditingPresenceSnapshot( {
				postId,
				restBase,
				sessionKey:
					options.sessionKey ||
					getDistributedEditingPresenceSessionKey(),
			} );
			const latestSessionState =
				select.getDistributedEditingSessionState?.() ||
				currentSessionState;

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
					response,
					latestSessionState
				)
			);

			return response;
		} catch ( error ) {
			const latestSessionState =
				select.getDistributedEditingSessionState?.() ||
				currentSessionState;

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
					error,
					latestSessionState
				)
			);

			throw error;
		}
	};

/**
 * Re-checks read-only Distributed Editing presence storage readiness and stores
 * only local descriptors. The action is explicit and one-shot: it does not
 * install storage, write presence, start polling, save, mutate editor content,
 * dispatch global notices, persist editor state, or change post locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingPresenceStorageReadiness =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};

		try {
			const response =
				await requestDistributedEditingPresenceStorageReadiness( {
					postId,
					restBase,
				} );
			const latestSessionState =
				select.getDistributedEditingSessionState?.() ||
				currentSessionState;

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForPresenceStorageReadinessRecheckResult(
					response,
					latestSessionState
				)
			);

			return response;
		} catch ( error ) {
			const latestSessionState =
				select.getDistributedEditingSessionState?.() ||
				currentSessionState;

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForPresenceStorageReadinessRecheckResult(
					error,
					latestSessionState
				)
			);

			throw error;
		}
	};

/**
 * Sends a one-shot Distributed Editing presence heartbeat and stores local
 * command status. The action is gated by the editor's Distributed Editing
 * setting and does not start polling, save, mutate editor content, dispatch
 * global notices, persist editor state, or change post locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalSendDistributedEditingPresenceHeartbeat =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const editorSettings = select.getEditorSettings?.() || {};
		const distributedEditingEnabled =
			options.distributedEditingEnabled ??
			editorSettings.distributedEditing?.enabled;

		if ( ! distributedEditingEnabled ) {
			const response = {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
				detail: 'feature_disabled_for_post',
				result: 'presence_heartbeat_skipped',
				calls_rest_endpoint: false,
			};
			const latestSessionState =
				select.getDistributedEditingSessionState?.() ||
				currentSessionState;

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForPresenceHeartbeatResult(
					response,
					latestSessionState
				)
			);

			return response;
		}

		try {
			const response = await requestDistributedEditingPresenceHeartbeat( {
				postId,
				restBase,
				sessionKey:
					options.sessionKey ||
					getDistributedEditingPresenceSessionKey(),
			} );
			const latestSessionState =
				select.getDistributedEditingSessionState?.() ||
				currentSessionState;

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForPresenceHeartbeatResult(
					response,
					latestSessionState
				)
			);

			return response;
		} catch ( error ) {
			const latestSessionState =
				select.getDistributedEditingSessionState?.() ||
				currentSessionState;

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForPresenceHeartbeatResult(
					error,
					latestSessionState
				)
			);

			throw error;
		}
	};

/**
 * Stores a local repeated presence cadence runtime configuration.
 *
 * This action is an inert state handoff only. It does not start timers, call
 * REST, write heartbeats, save, mutate editor content, dispatch notices,
 * persist editor state, or change post locks.
 *
 * @param {Object} [runtimeConfig] Runtime cadence configuration.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalConfigureDistributedEditingPresenceRepeatedRefreshRuntime =

		( runtimeConfig = {} ) =>
		( { select, dispatch } ) => {
			const currentSessionState =
				select.getDistributedEditingSessionState?.() || {};
			const sessionState =
				getDistributedEditingSessionStateForPresenceRepeatedRefreshRuntimeConfig(
					runtimeConfig,
					currentSessionState
				);

			dispatch.setDistributedEditingSessionState( sessionState );

			return {
				status: sessionState.presenceRepeatedRefreshRuntimeStatus,
				localConnectionState:
					sessionState.presenceRepeatedRefreshLocalConnectionState,
				selectedIntervalSeconds:
					sessionState.presenceRepeatedRefreshSelectedIntervalSeconds,
				selectedHeartbeatIntervalSeconds:
					sessionState.presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds,
				schedulesNextRefresh:
					sessionState.presenceRepeatedRefreshSchedulesNextRefresh,
				schedulesNextHeartbeat:
					sessionState.presenceRepeatedRefreshSchedulesNextHeartbeat,
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
				sessionState,
			};
		};

/**
 * Stores a local initial-presence startup policy configuration.
 *
 * This action is an inert state handoff only. It does not start timers, call
 * REST, write heartbeats, save, mutate editor content, dispatch notices,
 * persist editor state, or change post locks.
 *
 * @param {Object} [policyConfig] Startup policy configuration.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalConfigureDistributedEditingPresenceStartupPolicy =
	( policyConfig = {} ) =>
	( { select, dispatch } ) => {
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const sessionState =
			getDistributedEditingSessionStateForPresenceStartupPolicyConfig(
				policyConfig,
				currentSessionState
			);

		dispatch.setDistributedEditingSessionState( sessionState );

		return {
			status: sessionState.presenceStartupPolicyStatus,
			reason: sessionState.presenceStartupPolicyReason,
			maySendInitialHeartbeatAutomatically:
				sessionState.presenceStartupPolicyMaySendInitialHeartbeatAutomatically,
			slowAutomaticHeartbeatAllowed:
				sessionState.presenceStartupPolicySlowAutomaticHeartbeatAllowed,
			selectedInitialHeartbeatDelaySeconds:
				sessionState.presenceStartupPolicySelectedInitialHeartbeatDelaySeconds,
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
			sessionState,
		};
	};

/**
 * Requests a Distributed Editing stale-base rejection contract and stores state.
 *
 * The action does not save, apply recovery, refetch, rebase, retry, dispatch
 * notices, or persist editor state. The current REST contract is intentionally
 * an error response; the error is reflected into DE-RTC state before being
 * rethrown for callers that need command-level handling.
 *
 * @param {Object} [options]                   Request options.
 * @param {string} [options.clientBaseContent] Serialized content at the client base version.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingStaleBaseRejection =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const requestArgs = {
			postId,
			restBase,
			clientBaseVersion: options.clientBaseVersion,
			serverVersion: options.serverVersion,
			pendingChangeCount: options.pendingChangeCount,
			remoteChangeCount: options.remoteChangeCount,
			canAttemptLocalRebase: options.canAttemptLocalRebase,
		};

		try {
			const response =
				await requestDistributedEditingStaleBaseRejection(
					requestArgs
				);

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					...response,
					clientBaseContent: options.clientBaseContent,
				} )
			);

			return response;
		} catch ( error ) {
			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					...error,
					clientBaseContent: options.clientBaseContent,
				} )
			);

			throw error;
		}
	};

/**
 * Refetches server state after a stale-base rejection and stores inert status.
 *
 * The action reads the latest post representation but does not apply it to the
 * editor, clear local changes, rebase, retry, save, dispatch notices, persist
 * editor state, or change post locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingServerStateAfterStaleBase =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const response = await requestDistributedEditingServerStateRefetch( {
			postId,
			restBase,
		} );
		const refetchedSessionState =
			getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
				response,
				currentSessionState
			);

		dispatch.setDistributedEditingSessionState(
			getDistributedEditingSessionStateWithActionTranscriptEvent(
				refetchedSessionState,
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED,
					reasonCode: refetchedSessionState.reasonCode,
				}
			)
		);

		return response;
	};

/**
 * Plans a local rebase after a stale-base server-state refetch.
 *
 * The action only records whether a later rebase attempt is locally possible.
 * It does not refetch, apply server content, modify blocks, retry a submit,
 * save, dispatch notices, persist editor state, or change post locks.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalPlanDistributedEditingLocalRebaseAfterStaleBase =
	() =>
	( { select, dispatch } ) => {
		const plannedSessionState =
			getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
				select.getDistributedEditingSessionState?.() || {}
			);

		dispatch.setDistributedEditingSessionState( plannedSessionState );

		return plannedSessionState;
	};

/**
 * Rebases local stale-base edits over refetched server content.
 *
 * The action computes a conservative serialized-block merge and applies the
 * merged candidate to the editor only when the merge is safe. It does not
 * refetch, retry a submit, save, dispatch notices, persist editor state, or
 * change post locks.
 *
 * @param {Object} options                   Rebase options.
 * @param {string} options.clientBaseContent Serialized content at the client base version.
 * @param {string} options.serverContent     Serialized content from the refetched server version.
 * @param {string} [options.localContent]    Serialized local editor content override.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase =
	( options = {} ) =>
	( { select, dispatch } ) => {
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState,
			clientBaseContent:
				options.clientBaseContent ??
				currentSessionState.clientBaseContent,
			serverContent:
				options.serverContent ??
				currentSessionState.refetchedServerContent,
			localContent:
				options.localContent ?? select.getEditedPostContent?.(),
		} );

		if ( result.hasCandidatePostContent ) {
			dispatch.editPost(
				{ content: result.candidatePostContent },
				{ undoIgnore: true }
			);
		}

		const nextSessionState =
			result.status ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED
				? getDistributedEditingSessionStateWithActionTranscriptEvent(
						result.sessionState,
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_APPLIED,
						}
				  )
				: result.sessionState;

		dispatch.setDistributedEditingSessionState( nextSessionState );

		return {
			...result,
			sessionState: nextSessionState,
		};
	};

/**
 * Imports a protected local-updates handoff payload into this editor session.
 *
 * The action validates the exported payload before editing local content. It
 * does not save, call REST, dispatch notices, persist editor state, or change
 * post locks. Failed imports record inert blocked status and leave editor
 * content unchanged.
 *
 * @param {Object|string} payloadOrJson Exported local-updates payload or JSON.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalImportDistributedEditingLocalUpdates =
	( payloadOrJson ) =>
	async ( { select, dispatch } ) => {
		let payload = payloadOrJson;

		if ( typeof payloadOrJson === 'string' ) {
			try {
				payload = JSON.parse( payloadOrJson );
			} catch {
				payload = null;
			}
		}

		const postContent =
			payload && typeof payload === 'object' ? payload.postContent : null;
		const computedPostContentHash =
			typeof postContent === 'string'
				? await getDistributedEditingPostContentSha256Hash(
						postContent
				  )
				: null;
		const result = getDistributedEditingLocalUpdatesImportResult( {
			payload,
			currentPost: select.getCurrentPost?.() || {},
			currentSessionState:
				select.getDistributedEditingSessionState?.() || {},
			computedPostContentHash,
		} );
		updateDistributedEditingFreshReviewImportContentVault( {
			currentPost: select.getCurrentPost?.() || {},
			result,
			postContent,
			postContentHash: computedPostContentHash,
		} );

		if ( result.hasPostContent ) {
			dispatch.editPost(
				{ content: result.postContent },
				{ undoIgnore: true }
			);
		}

		dispatch.setDistributedEditingSessionState( result.sessionState );

		return result;
	};

/**
 * Requests a fresh admin review for an imported local-updates handoff that
 * cannot reuse accepted proof.
 *
 * The action sends only hash/status/version evidence to the planned proof
 * endpoint. It does not retry-save, call normal save, mutate editor content,
 * dispatch global notices, persist editor state outside the editor store, or
 * change post locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export function __experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates(
	options = {}
) {
	return async ( { select, dispatch, registry } ) => {
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};

		if ( ! currentSessionState.localUpdatesImportRequiresFreshReview ) {
			return {
				status: 'fresh_review_request_not_ready',
				reason: 'fresh_review_not_required',
				callsFreshReviewRequestEndpoint: false,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				mutatesEditorContent: false,
				dispatchesNotice: false,
				changesPostLock: false,
				claimsSaved: false,
				sessionState: currentSessionState,
			};
		}

		const currentPost = select.getCurrentPost?.() || {};
		const postType =
			options.postType ||
			currentSessionState.localUpdatesImportPostType ||
			currentPost.type;
		const postId =
			options.postId ??
			currentSessionState.localUpdatesImportPostId ??
			currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const requestArgs = {
			postId,
			restBase,
			clientBaseVersion:
				options.clientBaseVersion ??
				currentSessionState.clientBaseVersion,
			serverVersion:
				options.serverVersion ?? currentSessionState.serverVersion,
			pendingChangeCount:
				options.pendingChangeCount ??
				currentSessionState.pendingChangeCount,
			proposedPostContentHash:
				options.proposedPostContentHash ??
				currentSessionState.localUpdatesImportVerifiedPostContentHash,
			localUpdatesImportStatus:
				currentSessionState.localUpdatesImportStatus,
			localUpdatesImportReason:
				currentSessionState.localUpdatesImportReason,
			freshReviewRequestStatus:
				currentSessionState.localUpdatesImportReviewRequestStatus,
			freshReviewRequestAction: options.freshReviewRequestAction,
		};

		try {
			const response =
				await requestDistributedEditingFreshReviewForImportedLocalUpdates(
					requestArgs
				);
			const sessionState =
				getDistributedEditingSessionStateForFreshReviewRequestResult(
					response,
					currentSessionState
				);
			const nextSessionState =
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					sessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
						reasonCode: sessionState.reasonCode,
					}
				);

			dispatch.setDistributedEditingSessionState( nextSessionState );

			return {
				status: nextSessionState.localUpdatesImportReviewRequestStatus,
				result: nextSessionState.localUpdatesImportFreshReviewRequestResult,
				requested:
					nextSessionState.localUpdatesImportFreshReviewRequestRequested,
				accepted:
					nextSessionState.localUpdatesImportFreshReviewRequestAccepted,
				actionTranscriptItemCount:
					nextSessionState.actionTranscriptItemCount,
				actionTranscriptLatestEventType:
					nextSessionState.actionTranscriptLatestEventType,
				actionTranscriptEntriesRedacted:
					nextSessionState.actionTranscriptEntriesRedacted,
				actionTranscriptCallsSave:
					nextSessionState.actionTranscriptCallsSave,
				actionTranscriptClaimsSaved:
					nextSessionState.actionTranscriptClaimsSaved,
				callsFreshReviewRequestEndpoint: true,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				mutatesEditorContent: false,
				dispatchesNotice: false,
				changesPostLock: false,
				claimsSaved: false,
				sessionState: nextSessionState,
			};
		} catch ( error ) {
			const sessionState =
				getDistributedEditingSessionStateForFreshReviewRequestResult(
					error,
					currentSessionState
				);
			const nextSessionState =
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					sessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
						reasonCode: sessionState.reasonCode,
					}
				);

			dispatch.setDistributedEditingSessionState( nextSessionState );

			throw error;
		}
	};
}

/**
 * Loads hash-only reviewed-block evidence for an accepted fresh-review request.
 * This prepares only local reviewer decision state; it does not submit proof,
 * save, retry-save, dispatch notices, mutate content, or change post locks.
 *
 * @param {Array|Object} reviewItemsOrOptions Review items or options object.
 * @param {Object}       [options]            Optional decision options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalLoadDistributedEditingFreshReviewDecisionItems =
	( reviewItemsOrOptions = [], options = {} ) =>
	( { select, dispatch } ) => {
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const requestStatus =
			currentSessionState.localUpdatesImportReviewRequestStatus;

		if (
			! currentSessionState.localUpdatesImportRequiresFreshReview ||
			requestStatus !==
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED
		) {
			return {
				status: 'fresh_review_decision_not_ready',
				reason: 'fresh_review_request_not_requested',
				loadsDecisionItems: false,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				sessionState: currentSessionState,
			};
		}

		const decision = Array.isArray( reviewItemsOrOptions )
			? { ...options, reviewItems: reviewItemsOrOptions }
			: { ...reviewItemsOrOptions };
		const sessionState =
			getDistributedEditingSessionStateForFreshReviewDecisionItems(
				currentSessionState,
				decision
			);

		dispatch.setDistributedEditingSessionState( sessionState );

		return {
			status: sessionState.localUpdatesImportFreshReviewDecisionStatus,
			reason: sessionState.localUpdatesImportFreshReviewDecisionReason,
			loadsDecisionItems: true,
			reviewItemCount:
				sessionState.localUpdatesImportFreshReviewDecisionItemCount,
			pendingReviewItemCount:
				sessionState.localUpdatesImportFreshReviewDecisionPendingCount,
			approvedReviewItemCount:
				sessionState.localUpdatesImportFreshReviewDecisionApprovedCount,
			rejectedReviewItemCount:
				sessionState.localUpdatesImportFreshReviewDecisionRejectedCount,
			decisionReady:
				sessionState.localUpdatesImportFreshReviewDecisionReady,
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
			sessionState,
		};
	};

/**
 * Records one fresh-review approve/reject decision as local, hash-only editor
 * state. This does not save, submit proof, call REST, mutate content, or change
 * post locks.
 *
 * @param {Object} resolution Review decision data.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalResolveDistributedEditingFreshReviewDecisionItem =
	( resolution = {} ) =>
	( { select, dispatch } ) => {
		const reviewItemId = resolution.reviewItemId || resolution.id;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const currentItems = Array.isArray(
			currentSessionState.localUpdatesImportFreshReviewDecisionItems
		)
			? currentSessionState.localUpdatesImportFreshReviewDecisionItems
			: [];
		const currentItem = currentItems.find(
			( item ) => item.id === reviewItemId
		);

		if ( ! currentItem ) {
			return {
				status: 'fresh_review_decision_item_not_found',
				reviewItemId,
				decision: resolution.decision || 'approved',
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		}

		const sessionState =
			getDistributedEditingSessionStateForFreshReviewDecisionItemResolution(
				currentSessionState,
				resolution
			);
		const resolvedItem =
			sessionState.localUpdatesImportFreshReviewDecisionItems.find(
				( item ) => item.id === reviewItemId
			);

		dispatch.setDistributedEditingSessionState( sessionState );

		return {
			status: 'fresh_review_decision_item_resolved',
			reviewItemId,
			decision: resolution.decision || 'approved',
			reviewStatus: resolvedItem?.reviewStatus,
			pendingReviewItemCount:
				sessionState.localUpdatesImportFreshReviewDecisionPendingCount,
			approvedReviewItemCount:
				sessionState.localUpdatesImportFreshReviewDecisionApprovedCount,
			rejectedReviewItemCount:
				sessionState.localUpdatesImportFreshReviewDecisionRejectedCount,
			decisionReady:
				sessionState.localUpdatesImportFreshReviewDecisionReady,
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
			sessionState,
		};
	};

/**
 * Submits the requested fresh-review decision to the proof endpoint using only
 * hash and version evidence. This does not save, retry-save, mutate editor
 * content, dispatch global notices, or change post locks.
 *
 * @param {Object} [options] Decision submission options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalSubmitDistributedEditingFreshReviewDecision =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const reviewedBlockItems =
			options.reviewedBlockItems ??
			getDistributedEditingReviewedBlockItemsForFreshReviewDecision(
				currentSessionState
			);
		const rejectedCount =
			currentSessionState.localUpdatesImportFreshReviewDecisionRejectedCount ||
			0;
		const decision =
			options.freshReviewDecision ||
			options.decision ||
			( rejectedCount > 0 ? 'rejected' : 'approved' );
		const requestRecordId =
			options.freshReviewRequestRecordId ??
			currentSessionState.localUpdatesImportFreshReviewRequestRecordId;

		if (
			! currentSessionState.localUpdatesImportFreshReviewDecisionReady ||
			! requestRecordId
		) {
			return {
				status: 'fresh_review_decision_not_ready',
				reason: requestRecordId
					? 'fresh_review_decision_items_not_ready'
					: 'fresh_review_request_record_missing',
				callsFreshReviewDecisionEndpoint: false,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				savesPost: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				sessionState: currentSessionState,
			};
		}

		const currentPost = select.getCurrentPost?.() || {};
		const postType =
			options.postType ||
			currentSessionState.localUpdatesImportPostType ||
			currentPost.type;
		const postId =
			options.postId ??
			currentSessionState.localUpdatesImportPostId ??
			currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;

		try {
			const response = await requestDistributedEditingFreshReviewDecision(
				{
					postId,
					restBase,
					freshReviewRequestRecordId: requestRecordId,
					clientBaseVersion:
						options.clientBaseVersion ??
						currentSessionState.clientBaseVersion,
					serverVersion:
						options.serverVersion ??
						currentSessionState.serverVersion,
					freshReviewDecision: decision,
					proposedPostContentHash:
						options.proposedPostContentHash ??
						currentSessionState.localUpdatesImportVerifiedPostContentHash,
					reviewedProposedContentHash:
						options.reviewedProposedContentHash ??
						options.proposedPostContentHash ??
						currentSessionState.localUpdatesImportVerifiedPostContentHash,
					candidatePostContentHash: options.candidatePostContentHash,
					reviewedCandidateContentHash:
						options.reviewedCandidateContentHash ??
						options.candidatePostContentHash,
					reviewedBlockItems,
				}
			);
			const sessionState =
				getDistributedEditingSessionStateForFreshReviewDecisionResult(
					response,
					currentSessionState
				);
			const nextSessionState =
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					sessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
						reasonCode:
							sessionState.localUpdatesImportFreshReviewDecisionReason,
					}
				);

			dispatch.setDistributedEditingSessionState( nextSessionState );

			return {
				status: nextSessionState.localUpdatesImportFreshReviewDecisionStatus,
				result: nextSessionState.localUpdatesImportFreshReviewDecisionResult,
				decision:
					nextSessionState.localUpdatesImportFreshReviewDecisionDecision,
				accepted:
					nextSessionState.localUpdatesImportFreshReviewDecisionAccepted,
				actionTranscriptItemCount:
					nextSessionState.actionTranscriptItemCount,
				actionTranscriptLatestEventType:
					nextSessionState.actionTranscriptLatestEventType,
				actionTranscriptEntriesRedacted:
					nextSessionState.actionTranscriptEntriesRedacted,
				actionTranscriptCallsSave:
					nextSessionState.actionTranscriptCallsSave,
				actionTranscriptClaimsSaved:
					nextSessionState.actionTranscriptClaimsSaved,
				callsFreshReviewDecisionEndpoint: true,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				savesPost: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				sessionState: nextSessionState,
			};
		} catch ( error ) {
			const sessionState =
				getDistributedEditingSessionStateForFreshReviewDecisionResult(
					error,
					currentSessionState
				);
			const nextSessionState =
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					sessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
						reasonCode:
							sessionState.localUpdatesImportFreshReviewDecisionReason,
					}
				);

			dispatch.setDistributedEditingSessionState( nextSessionState );

			throw error;
		}
	};

/**
 * Stages a recorded fresh-review approval for future retry-save validation.
 *
 * This action is intentionally no-transport until the WordPress validation
 * endpoint contract lands. It records only editor-store handoff state and can
 * consume an explicit validation response shape supplied by tests or a future
 * caller; it does not call normal save, retry-save, mutate content, dispatch
 * notices, persist outside the editor store, expose proof internals, or change
 * locks.
 *
 * @param {Object} [validationResult] Optional future validation response.
 * @param {Object} [options]          Optional hash/version evidence.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalPrepareDistributedEditingFreshReviewRetrySaveHandoffValidation =

		( validationResult = null, options = {} ) =>
		( { select, dispatch } ) => {
			const currentSessionState =
				select.getDistributedEditingSessionState?.() || {};
			const preparedSessionState =
				getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidation(
					currentSessionState,
					options
				);
			const sessionState = validationResult
				? getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidationResult(
						validationResult,
						preparedSessionState
				  )
				: preparedSessionState;

			dispatch.setDistributedEditingSessionState( sessionState );

			return {
				status: sessionState.localUpdatesImportFreshReviewRetrySaveHandoffStatus,
				reason: sessionState.localUpdatesImportFreshReviewRetrySaveHandoffReason,
				result: sessionState.localUpdatesImportFreshReviewRetrySaveHandoffResult,
				ready: sessionState.localUpdatesImportFreshReviewRetrySaveHandoffReady,
				validating:
					sessionState.localUpdatesImportFreshReviewRetrySaveHandoffValidating,
				accepted:
					sessionState.localUpdatesImportFreshReviewRetrySaveHandoffAccepted,
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
				exposesReviewerIds: false,
				sessionState,
			};
		};

/**
 * Validates a recorded fresh-review approval against the server before a future
 * retry-save handoff. The server call is still no-write and sends only hash and
 * version evidence.
 *
 * @param {Object} [options] Validation options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalValidateDistributedEditingFreshReviewRetrySaveHandoff =

		( options = {} ) =>
		async ( { select, dispatch, registry } ) => {
			const currentSessionState =
				select.getDistributedEditingSessionState?.() || {};
			const preparedSessionState =
				getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidation(
					currentSessionState,
					options
				);

			dispatch.setDistributedEditingSessionState( preparedSessionState );

			if (
				! preparedSessionState.localUpdatesImportFreshReviewRetrySaveHandoffValidating
			) {
				return {
					status: preparedSessionState.localUpdatesImportFreshReviewRetrySaveHandoffStatus,
					reason: preparedSessionState.localUpdatesImportFreshReviewRetrySaveHandoffReason,
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
					exposesReviewerIds: false,
					sessionState: preparedSessionState,
				};
			}

			const currentPost = select.getCurrentPost?.() || {};
			const postType =
				options.postType ||
				preparedSessionState.localUpdatesImportPostType ||
				currentPost.type;
			const postId =
				options.postId ??
				preparedSessionState.localUpdatesImportPostId ??
				currentPost.id;
			const postTypeRecord = postType
				? registry.select( coreStore ).getPostType( postType )
				: null;
			const restBase =
				options.restBase ||
				postTypeRecord?.rest_base ||
				DISTRIBUTED_EDITING_RECOVERY_REST_BASE;

			try {
				const response =
					await requestDistributedEditingFreshReviewRetrySaveHandoffValidation(
						{
							postId,
							restBase,
							freshReviewRequestRecordId:
								options.freshReviewRequestRecordId ??
								preparedSessionState.localUpdatesImportFreshReviewRequestRecordId,
							clientBaseVersion:
								options.clientBaseVersion ??
								preparedSessionState.serverVersion ??
								preparedSessionState.clientBaseVersion,
							serverVersion:
								options.serverVersion ??
								preparedSessionState.serverVersion,
							proposedPostContentHash:
								options.proposedPostContentHash ??
								preparedSessionState.localUpdatesImportVerifiedPostContentHash,
							reviewedProposedContentHash:
								options.reviewedProposedContentHash ??
								options.proposedPostContentHash ??
								preparedSessionState.localUpdatesImportVerifiedPostContentHash,
							candidatePostContentHash:
								options.candidatePostContentHash,
							reviewedCandidateContentHash:
								options.reviewedCandidateContentHash ??
								options.candidatePostContentHash,
						}
					);
				const sessionState =
					getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidationResult(
						response,
						preparedSessionState
					);
				const nextSessionState =
					getDistributedEditingSessionStateWithActionTranscriptEvent(
						sessionState,
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
							reasonCode:
								sessionState.localUpdatesImportFreshReviewRetrySaveHandoffReason,
						}
					);

				dispatch.setDistributedEditingSessionState( nextSessionState );

				return {
					status: nextSessionState.localUpdatesImportFreshReviewRetrySaveHandoffStatus,
					reason: nextSessionState.localUpdatesImportFreshReviewRetrySaveHandoffReason,
					result: nextSessionState.localUpdatesImportFreshReviewRetrySaveHandoffResult,
					accepted:
						nextSessionState.localUpdatesImportFreshReviewRetrySaveHandoffAccepted,
					actionTranscriptItemCount:
						nextSessionState.actionTranscriptItemCount,
					actionTranscriptLatestEventType:
						nextSessionState.actionTranscriptLatestEventType,
					actionTranscriptEntriesRedacted:
						nextSessionState.actionTranscriptEntriesRedacted,
					actionTranscriptCallsSave:
						nextSessionState.actionTranscriptCallsSave,
					actionTranscriptClaimsSaved:
						nextSessionState.actionTranscriptClaimsSaved,
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
					exposesReviewerIds: false,
					sessionState: nextSessionState,
				};
			} catch ( error ) {
				const sessionState =
					getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidationResult(
						error,
						preparedSessionState
					);
				const nextSessionState =
					getDistributedEditingSessionStateWithActionTranscriptEvent(
						sessionState,
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
							reasonCode:
								sessionState.localUpdatesImportFreshReviewRetrySaveHandoffReason,
						}
					);

				dispatch.setDistributedEditingSessionState( nextSessionState );

				throw error;
			}
		};

/**
 * Prepares the retry-submit handoff after a successful local rebase.
 *
 * The action consumes the inert `readyToRetrySubmit` flag and records that a
 * future save-path consumer may use the rebased editor content. It does not
 * submit to the server, call REST, save, dispatch notices, persist editor
 * state, or change post locks.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase =
	() => {
		return ( { select, dispatch } ) => {
			const currentSessionState =
				select.getDistributedEditingSessionState?.() || {};
			const sessionState =
				getDistributedEditingSessionStateForRetrySubmitHandoff(
					currentSessionState
				);
			const nextSessionState = sessionState.retrySubmitPrepared
				? getDistributedEditingSessionStateWithActionTranscriptEvent(
						sessionState,
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_STAGED,
						}
				  )
				: sessionState;

			dispatch.setDistributedEditingSessionState( nextSessionState );

			return {
				status: nextSessionState.retrySubmitHandoffStatus,
				reason: nextSessionState.retrySubmitHandoffReason,
				consumesReadyToRetrySubmit:
					Boolean( currentSessionState.readyToRetrySubmit ) &&
					nextSessionState.retrySubmitPrepared,
				submitsToServer: false,
				savesPost: false,
				mutatesPersistedPostContent: false,
				claimsSaved: false,
				sessionState: nextSessionState,
			};
		};
	};

/**
 * Requests the retry-submit proof endpoint and stores inert retry state.
 *
 * The action only records whether the prepared retry is still accepted for a
 * future save path. It does not save, dispatch notices, persist editor state,
 * mutate post content, create revisions, claim saved, or change post locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingRetrySubmitProof =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const requestArgs = {
			postId,
			restBase,
			clientBaseVersion:
				options.clientBaseVersion ??
				currentSessionState.serverVersion ??
				currentSessionState.clientBaseVersion,
			rebasedFromVersion:
				options.rebasedFromVersion ??
				currentSessionState.clientBaseVersion,
			pendingChangeCount:
				options.pendingChangeCount ??
				currentSessionState.pendingChangeCount,
			proposedPostContentHash: options.proposedPostContentHash,
		};

		try {
			const response =
				await requestDistributedEditingRetrySubmitProbe( requestArgs );
			const retrySubmitProofSessionState =
				getDistributedEditingSessionStateForRetrySubmitProofResult(
					response,
					currentSessionState
				);

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					retrySubmitProofSessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED,
						reasonCode:
							retrySubmitProofSessionState.retrySubmitProofReason,
					}
				)
			);

			return response;
		} catch ( error ) {
			const retrySubmitProofSessionState =
				getDistributedEditingSessionStateForRetrySubmitProofResult(
					error,
					currentSessionState
				);

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					retrySubmitProofSessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED,
						reasonCode:
							retrySubmitProofSessionState.retrySubmitProofReason,
					}
				)
			);

			throw error;
		}
	};

/**
 * Prepares accepted retry-submit proof for a future guarded save path.
 *
 * The action consumes no server resources and performs no persistence. It only
 * records whether the current accepted proof can be handed to a later save-path
 * consumer.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof =
	() =>
	( { select, dispatch } ) => {
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const sessionState =
			getDistributedEditingSessionStateForRetrySubmitSavePreparation(
				currentSessionState
			);
		const nextSessionState = sessionState.retrySubmitSaveReady
			? getDistributedEditingSessionStateWithActionTranscriptEvent(
					sessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_PREPARED,
					}
			  )
			: sessionState;

		dispatch.setDistributedEditingSessionState( nextSessionState );

		return {
			status: nextSessionState.retrySubmitSaveStatus,
			reason: nextSessionState.retrySubmitSaveReason,
			consumesAcceptedProof:
				Boolean( currentSessionState.retrySubmitAccepted ) &&
				nextSessionState.retrySubmitSaveReady,
			submitsToServer: false,
			savesPost: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
			sessionState: nextSessionState,
		};
	};

/**
 * Requests retry-save reviewer approval proof and stores inert proof state.
 *
 * The action sends only version, capability, scope, and hash evidence,
 * including approved risky-block review items when available. It does not call
 * normal save, call retry-save, mutate editor content, dispatch notices,
 * persist editor state, create revisions, claim saved, or change post locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingRetrySaveReviewApprovalProof =

		( options = {} ) =>
		async ( { select, dispatch, registry } ) => {
			const currentPost = select.getCurrentPost?.() || {};
			const postType = options.postType || currentPost.type;
			const postId = options.postId ?? currentPost.id;
			const postTypeRecord = postType
				? registry.select( coreStore ).getPostType( postType )
				: null;
			const restBase =
				options.restBase ||
				postTypeRecord?.rest_base ||
				DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
			const currentSessionState =
				select.getDistributedEditingSessionState?.() || {};
			const requestArgs = {
				postId,
				restBase,
				clientBaseVersion:
					options.clientBaseVersion ??
					currentSessionState.serverVersion ??
					currentSessionState.clientBaseVersion,
				acceptedProofServerVersion:
					options.acceptedProofServerVersion ??
					options.reviewedServerVersion ??
					currentSessionState.retrySaveServerVersion ??
					currentSessionState.serverVersion,
				pendingChangeCount:
					options.pendingChangeCount ??
					currentSessionState.pendingChangeCount,
				reviewAction:
					options.reviewAction ??
					currentSessionState.retrySaveReviewAction,
				reviewRequiredCapability:
					options.reviewRequiredCapability ??
					currentSessionState.retrySaveReviewRequiredCapability,
				reviewerCapability:
					options.reviewerCapability ??
					currentSessionState.retrySaveReviewerCapability,
				reviewScope:
					options.reviewScope ??
					currentSessionState.retrySaveReviewScope,
				proposedPostContentHash:
					options.proposedPostContentHash ??
					currentSessionState.retrySaveReviewProposedContentHash,
				reviewedProposedPostContentHash:
					options.reviewedProposedPostContentHash ??
					options.proposedPostContentHash ??
					currentSessionState.retrySaveReviewProposedContentHash,
				candidatePostContentHash:
					options.candidatePostContentHash ??
					currentSessionState.retrySaveReviewCandidateContentHash,
				reviewedCandidatePostContentHash:
					options.reviewedCandidatePostContentHash ??
					options.candidatePostContentHash ??
					currentSessionState.retrySaveReviewCandidateContentHash,
				filteredProposedPostContentHash:
					options.filteredProposedPostContentHash ??
					currentSessionState.retrySaveReviewFilteredProposedContentHash,
				filteredCandidatePostContentHash:
					options.filteredCandidatePostContentHash ??
					currentSessionState.retrySaveReviewFilteredCandidateContentHash,
				reviewedBlockItems:
					options.reviewedBlockItems ??
					options.reviewedBlockReviewItems ??
					getDistributedEditingReviewedBlockItemsForRetrySaveReviewApprovalProof(
						currentSessionState
					),
				reviewApprovalProof: options.reviewApprovalProof,
			};

			try {
				const response =
					await requestDistributedEditingRetrySaveReviewApprovalProof(
						requestArgs
					);

				dispatch.setDistributedEditingSessionState(
					getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
						response,
						currentSessionState
					)
				);

				return response;
			} catch ( error ) {
				dispatch.setDistributedEditingSessionState(
					getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
						error,
						currentSessionState
					)
				);

				throw error;
			}
		};

/**
 * Requests the guarded retry-save endpoint and stores the normalized result.
 *
 * This action is still separate from `savePost()`. It submits the explicit
 * retry-save proof request, records success or rejection in DE-RTC state, and
 * preserves pending/export protection unless the server confirms persistence.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalSaveDistributedEditingRetryAfterProof =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const pendingChangeCount =
			options.pendingChangeCount ??
			currentSessionState.pendingChangeCount;
		const acceptedReviewApprovalProof =
			options.acceptedReviewApprovalProof ??
			getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
				currentSessionState
			);
		const acceptedFreshReviewConsumeValidation =
			options.acceptedFreshReviewConsumeValidation ??
			getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
				currentSessionState
			);
		const savingSessionState =
			getDistributedEditingSessionStateForRetrySaveRequest(
				currentSessionState,
				{
					pendingChangeCount,
					acceptedReviewApprovalProof,
					acceptedFreshReviewConsumeValidation,
				}
			);
		const transcriptSavingSessionState =
			getDistributedEditingSessionStateWithActionTranscriptEvent(
				savingSessionState,
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
					reasonCode: savingSessionState.retrySaveReason,
				}
			);
		const proposedPostContentCandidate =
			options.proposedPostContent ??
			getDistributedEditingFreshReviewImportedPostContentForRetrySave( {
				postId,
				postType,
				sessionState: currentSessionState,
				acceptedFreshReviewConsumeValidation,
			} ) ??
			select.getEditedPostContent?.();
		const proposedPostContent = getDistributedEditingComparablePostContent(
			proposedPostContentCandidate
		);
		let proposedPostContentHash =
			options.proposedPostContentHash ??
			getDistributedEditingRetrySaveProposedContentHashEvidence(
				currentSessionState,
				{
					acceptedReviewApprovalProof,
					acceptedFreshReviewConsumeValidation,
				}
			);
		const requestClientBaseVersion =
			options.clientBaseVersion ??
			currentSessionState.serverVersion ??
			currentSessionState.clientBaseVersion;
		const requestAcceptedProofServerVersion =
			options.acceptedProofServerVersion ??
			currentSessionState.serverVersion;
		let blockIdentityRequestProof = options.blockIdentityRequestProof;

		if (
			blockIdentityRequestProof === undefined &&
			options.prepareBlockIdentityRequestProof !== false &&
			isDistributedEditingCurrentBaseRetrySaveRequest( {
				clientBaseVersion: requestClientBaseVersion,
				acceptedProofServerVersion:
					requestAcceptedProofServerVersion,
				sessionState: currentSessionState,
			} )
		) {
			const acceptedSyncMeta =
				getDistributedEditingAcceptedBlockIdentitySyncMetaForRetrySave(
					{
						currentPost,
						options,
					}
				);

			if ( acceptedSyncMeta ) {
				const blockIdentityRequestProofDescriptor =
					await getDistributedEditingBlockIdentityRequestProofDescriptor(
						{
							acceptedSyncMeta,
							proposedPostContent,
							proposedPostContentHash,
							clientBaseVersion: requestClientBaseVersion,
						}
					);

				if (
					blockIdentityRequestProofDescriptor.status ===
					DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY
				) {
					blockIdentityRequestProof =
						blockIdentityRequestProofDescriptor.requestProof;
					proposedPostContentHash =
						proposedPostContentHash ||
						blockIdentityRequestProofDescriptor.proposedPostContentHash;
				}
			}
		}
		const requestArgs = {
			postId,
			restBase,
			clientBaseVersion: requestClientBaseVersion,
			acceptedProofServerVersion: requestAcceptedProofServerVersion,
			rebasedFromVersion:
				options.rebasedFromVersion ??
				currentSessionState.clientBaseVersion,
			pendingChangeCount:
				pendingChangeCount ?? savingSessionState.pendingChangeCount,
			proposedPostContent,
			proposedPostContentHash,
			acceptedProofSavesPost:
				options.acceptedProofSavesPost ??
				currentSessionState.retrySubmitSavesPost,
			acceptedProofMutatesPostContent:
				options.acceptedProofMutatesPostContent ??
				currentSessionState.retrySubmitMutatesPostContent,
			acceptedProofCreatesRevision:
				options.acceptedProofCreatesRevision ??
				currentSessionState.retrySubmitCreatesRevision,
			acceptedProofClaimsSaved:
				options.acceptedProofClaimsSaved ??
				currentSessionState.retrySubmitClaimsSaved,
			acceptedReviewApprovalProof,
			acceptedFreshReviewConsumeValidation,
			blockIdentityRequestProof,
		};

		dispatch.setDistributedEditingSessionState(
			transcriptSavingSessionState
		);

		try {
			const response =
				await requestDistributedEditingRetrySave( requestArgs );
			const retrySaveAppliedResponse =
				isDistributedEditingRetrySaveAppliedResponse( response );
			const retrySaveServerMergedResponse =
				isDistributedEditingRetrySaveServerMergedResponse( response );
			const retrySaveResponsePostContent =
				getDistributedEditingPostContentFromResponse( response );
			let appliedPostContent =
				getDistributedEditingRetrySaveAppliedPostContent( {
					response,
					proposedPostContent,
				} );
			const retrySaveResultSessionState =
				getDistributedEditingSessionStateForRetrySaveResult(
					response,
					transcriptSavingSessionState
				);
			const retrySaveConfirmedResponse =
				retrySaveAppliedResponse &&
				hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
					retrySaveResultSessionState
				);
			const shouldRefetchConfirmedPostContent =
				retrySaveConfirmedResponse &&
				typeof retrySaveResponsePostContent !== 'string' &&
				( retrySaveServerMergedResponse ||
					currentSessionState.localRebaseResultStatus ===
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED ||
					typeof currentSessionState.refetchedServerContent ===
						'string' );

			if ( shouldRefetchConfirmedPostContent ) {
				try {
					const refetchResponse =
						await requestDistributedEditingServerStateRefetch( {
							postId,
							restBase,
						} );
					const refetchedPostContent =
						getDistributedEditingPostContentFromResponse(
							refetchResponse
						);

					if ( typeof refetchedPostContent === 'string' ) {
						appliedPostContent = refetchedPostContent;
					}
				} catch {
					appliedPostContent =
						getDistributedEditingRetrySaveAppliedPostContent( {
							response,
							proposedPostContent,
						} );
				}
			}
			const confirmedComparablePostContent =
				retrySaveConfirmedResponse &&
				typeof appliedPostContent === 'string'
					? getDistributedEditingComparablePostContent(
							appliedPostContent
					  )
					: null;
			let nextSessionState =
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					{
						...retrySaveResultSessionState,
						...( typeof confirmedComparablePostContent === 'string'
							? {
									clientBaseVersion:
										retrySaveResultSessionState.retrySaveServerVersion ||
										retrySaveResultSessionState.serverVersion,
									clientBaseContent: null,
							  }
							: {} ),
					},
					{
						eventType: retrySaveConfirmedResponse
							? DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED
							: DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
						reasonCode: retrySaveResultSessionState.retrySaveReason,
					}
				);
			const freshReviewRetrySaveConfirmed =
				retrySaveConfirmedResponse &&
				Boolean( acceptedFreshReviewConsumeValidation ) &&
				( response?.fresh_review_decision_consumed === true ||
					response?.fresh_review_decision_consumption_consumed ===
						true ||
					response?.fresh_review_retry_save_handoff_consumed ===
						true ||
					response?.fresh_review_request_record_consumed === true ||
					response?.fresh_review_decision_consumption_result ===
						'fresh_review_decision_consumed_for_retry_save' );

			if ( freshReviewRetrySaveConfirmed ) {
				nextSessionState =
					getDistributedEditingSessionStateWithActionTranscriptEvent(
						nextSessionState,
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
						}
					);
			}

			dispatch.setDistributedEditingSessionState( nextSessionState );
			if (
				retrySaveConfirmedResponse &&
				typeof appliedPostContent === 'string'
			) {
				applyDistributedEditingConfirmedPostContent( {
					dispatch,
					registry,
					select,
					postContent: appliedPostContent,
				} );
			}
			if ( retrySaveConfirmedResponse ) {
				deleteDistributedEditingFreshReviewImportContentVaultEntry( {
					postId,
					postType,
				} );
			}

			return response;
		} catch ( error ) {
			let retrySaveResultSessionState =
				getDistributedEditingSessionStateForRetrySaveResult(
					error,
					transcriptSavingSessionState
				);
			const shouldHydrateManualConflict =
				retrySaveResultSessionState.requiresManualConflictResolution &&
				retrySaveResultSessionState.localRebaseResultStatus ===
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED &&
				retrySaveResultSessionState.localRebaseResultReason ===
					'same_block_changed' &&
				typeof retrySaveResultSessionState.refetchedServerContent !==
					'string';

			if ( shouldHydrateManualConflict ) {
				try {
					const refetchResponse =
						await requestDistributedEditingServerStateRefetch( {
							postId,
							restBase,
						} );
					const refetchedPostContent =
						getDistributedEditingPostContentFromResponse(
							refetchResponse
						);
					const latestKnownPost = select.getCurrentPost?.() ?? {};
					let currentPostContent = null;

					if ( typeof latestKnownPost.content?.raw === 'string' ) {
						currentPostContent = latestKnownPost.content.raw;
					} else if ( typeof latestKnownPost.content === 'string' ) {
						currentPostContent = latestKnownPost.content;
					}

					const clientBaseContent =
						retrySaveResultSessionState.clientBaseContent ??
						getDistributedEditingComparablePostContent(
							currentPostContent
						);
					const refetchedServerContent =
						getDistributedEditingComparablePostContent(
							refetchedPostContent
						);

					if (
						typeof clientBaseContent === 'string' &&
						typeof refetchedServerContent === 'string'
					) {
						retrySaveResultSessionState = {
							...retrySaveResultSessionState,
							serverVersion:
								getDistributedEditingServerVersionFromResponse(
									refetchResponse
								) || retrySaveResultSessionState.serverVersion,
							clientBaseContent,
							refetchedServerContent,
							refetchedServerState: true,
							requiresServerStateRefetch: false,
							canAttemptLocalRebase: false,
							localRebasePlanStatus:
								DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.MANUAL_CONFLICT_REQUIRED,
							localRebaseResultStatus:
								DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
							canExportLocalUpdates: true,
						};
					}
				} catch {
					// Keep the original protected retry-save rejection state when a follow-up refetch fails.
				}
			}

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					retrySaveResultSessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
						reasonCode: retrySaveResultSessionState.retrySaveReason,
					}
				)
			);

			throw error;
		}
	};

function applyDistributedEditingConfirmedPostContent( {
	dispatch,
	registry,
	select,
	postContent,
} ) {
	const comparablePostContent =
		getDistributedEditingComparablePostContent( postContent );
	const applyPostContent = () => {
		const parsedBlocks = parse( comparablePostContent );

		if ( parsedBlocks.length || ! comparablePostContent ) {
			dispatch.resetEditorBlocks( parsedBlocks, {
				__unstableShouldCreateUndoLevel: false,
			} );
		}
		dispatch.editPost(
			{ content: comparablePostContent },
			{
				undoIgnore: true,
			}
		);
	};

	applyPostContent();
	const currentPost = select.getCurrentPost?.() || {};
	const postType = currentPost.type;
	const postId = currentPost.id;

	if ( postType && postId && typeof comparablePostContent === 'string' ) {
		const currentContent = currentPost.content;
		const nextContent =
			currentContent && typeof currentContent === 'object'
				? {
						...currentContent,
						raw: comparablePostContent,
				  }
				: comparablePostContent;

		registry
			.dispatch( coreStore )
			.receiveEntityRecords( 'postType', postType, {
				...currentPost,
				content: nextContent,
			} );
	}
}

function isDistributedEditingRetrySaveAppliedResponse( response = {} ) {
	const result = response?.result || response?.data?.result;

	return (
		result === 'retry_save_applied' || result === 'retry_save_server_merged'
	);
}

function isDistributedEditingRetrySaveServerMergedResponse( response = {} ) {
	const responseData = response?.data ?? {};
	const result = response?.result || responseData.result;

	return Boolean(
		result === 'retry_save_server_merged' ||
			response.serverMerged ||
			response.server_merged ||
			response.serverMergeApplied ||
			response.server_merge_applied ||
			responseData.serverMerged ||
			responseData.server_merged ||
			responseData.serverMergeApplied ||
			responseData.server_merge_applied
	);
}

function getDistributedEditingRetrySaveAppliedPostContent( {
	response,
	proposedPostContent,
} ) {
	const serverPostContent =
		getDistributedEditingPostContentFromResponse( response );

	if ( typeof serverPostContent === 'string' ) {
		return serverPostContent;
	}

	if (
		isDistributedEditingRetrySaveAppliedResponse( response ) &&
		typeof proposedPostContent === 'string'
	) {
		return proposedPostContent;
	}

	return null;
}

function isDistributedEditingCurrentBaseRetrySaveRequest( {
	clientBaseVersion,
	acceptedProofServerVersion,
	sessionState = {},
} = {} ) {
	const serverVersion = sessionState.serverVersion;

	return (
		clientBaseVersion !== undefined &&
		clientBaseVersion !== null &&
		acceptedProofServerVersion !== undefined &&
		acceptedProofServerVersion !== null &&
		serverVersion !== undefined &&
		serverVersion !== null &&
		String( clientBaseVersion ) ===
			String( acceptedProofServerVersion ) &&
		String( acceptedProofServerVersion ) === String( serverVersion )
	);
}

function getDistributedEditingAcceptedBlockIdentitySyncMetaForRetrySave( {
	currentPost = {},
	options = {},
} = {} ) {
	const explicitSyncMeta =
		options.acceptedBlockIdentitySyncMeta ?? options.acceptedSyncMeta;

	if (
		explicitSyncMeta &&
		typeof explicitSyncMeta === 'object' &&
		! Array.isArray( explicitSyncMeta )
	) {
		return explicitSyncMeta;
	}

	const postContent =
		options.acceptedPostContentWithSyncMeta ??
		options.currentPostContentWithSyncMeta ??
		currentPost.content?.raw ??
		( typeof currentPost.content === 'string'
			? currentPost.content
			: null );

	return getDistributedEditingSyncMetaFromPostContent( postContent );
}

/**
 * Browser-callable fresh-review retry-save handoff.
 *
 * This is a narrow alias for the guarded retry-save write boundary after the
 * fresh-review consume validation state is accepted. The underlying retry-save
 * action still builds the hash-only fresh-review evidence from editor state and
 * remains responsible for all persistence and rejection normalization.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalSaveDistributedEditingFreshReviewRetrySaveHandoff =
	( options = {} ) =>
	async ( { select, dispatch } ) => {
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const acceptedFreshReviewConsumeValidation =
			options.acceptedFreshReviewConsumeValidation ??
			getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
				currentSessionState
			);
		const freshReviewServerVersion =
			acceptedFreshReviewConsumeValidation?.serverVersion ??
			acceptedFreshReviewConsumeValidation?.server_version ??
			currentSessionState.retrySaveFreshReviewServerVersion ??
			currentSessionState.localUpdatesImportFreshReviewRetrySaveHandoffServerVersion;

		return dispatch.__experimentalSaveDistributedEditingRetryAfterProof( {
			...options,
			...( freshReviewServerVersion
				? {
						clientBaseVersion: freshReviewServerVersion,
						acceptedProofServerVersion: freshReviewServerVersion,
				  }
				: {} ),
			acceptedFreshReviewConsumeValidation,
		} );
	};

function getDistributedEditingRetrySaveProposedContentHashEvidence(
	sessionState = {},
	{
		acceptedReviewApprovalProof = null,
		acceptedFreshReviewConsumeValidation = null,
	} = {}
) {
	const reviewApprovalProof =
		acceptedReviewApprovalProof?.proof ?? acceptedReviewApprovalProof;
	const freshReviewConsumeValidation =
		acceptedFreshReviewConsumeValidation?.proof ??
		acceptedFreshReviewConsumeValidation;
	const hashCandidates = [
		reviewApprovalProof?.proposedPostContentHash,
		reviewApprovalProof?.proposed_post_content_hash,
		freshReviewConsumeValidation?.proposedPostContentHash,
		freshReviewConsumeValidation?.proposed_post_content_hash,
		sessionState.retrySaveReviewApprovalProposedContentHash,
		sessionState.retrySaveReviewProposedContentHash,
		sessionState.retrySaveFreshReviewProposedContentHash,
		sessionState.localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash,
		sessionState.localUpdatesImportVerifiedPostContentHash,
	];

	return hashCandidates.find( isDistributedEditingSha256Hash );
}

function isDistributedEditingSha256Hash( value ) {
	return typeof value === 'string' && /^[a-f0-9]{64}$/.test( value );
}

function updateDistributedEditingFreshReviewImportContentVault( {
	currentPost = {},
	result = {},
	postContent,
	postContentHash,
} = {} ) {
	const key = getDistributedEditingFreshReviewImportContentVaultKey( {
		postId:
			currentPost.id ??
			result.sessionState?.localUpdatesImportPostId,
		postType:
			currentPost.type ??
			result.sessionState?.localUpdatesImportPostType,
	} );

	if ( ! key ) {
		return;
	}

	if (
		result.status === 'blocked' &&
		result.reason === 'fresh_review_required' &&
		typeof postContent === 'string' &&
		isDistributedEditingSha256Hash( postContentHash ) &&
		result.sessionState?.localUpdatesImportVerifiedPostContentHash ===
			postContentHash
	) {
		distributedEditingFreshReviewImportContentVault.set( key, {
			postContent,
			postContentHash,
		} );
		return;
	}

	distributedEditingFreshReviewImportContentVault.delete( key );
}

function getDistributedEditingFreshReviewImportedPostContentForRetrySave( {
	postId,
	postType,
	sessionState = {},
	acceptedFreshReviewConsumeValidation = null,
} = {} ) {
	const key = getDistributedEditingFreshReviewImportContentVaultKey( {
		postId: postId ?? sessionState.localUpdatesImportPostId,
		postType: postType ?? sessionState.localUpdatesImportPostType,
	} );

	if ( ! key ) {
		return null;
	}

	const entry = distributedEditingFreshReviewImportContentVault.get( key );

	if ( ! entry ) {
		return null;
	}

	const acceptedValidation =
		acceptedFreshReviewConsumeValidation ??
		getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
			sessionState
		);
	const expectedPostContentHash =
		getDistributedEditingRetrySaveProposedContentHashEvidence(
			sessionState,
			{
				acceptedFreshReviewConsumeValidation: acceptedValidation,
			}
		);

	if (
		! acceptedValidation ||
		! expectedPostContentHash ||
		entry.postContentHash !== expectedPostContentHash
	) {
		return null;
	}

	return entry.postContent;
}

function deleteDistributedEditingFreshReviewImportContentVaultEntry( {
	postId,
	postType,
} = {} ) {
	const key = getDistributedEditingFreshReviewImportContentVaultKey( {
		postId,
		postType,
	} );

	if ( key ) {
		distributedEditingFreshReviewImportContentVault.delete( key );
	}
}

function getDistributedEditingFreshReviewImportContentVaultKey( {
	postId,
	postType,
} = {} ) {
	if ( postId === undefined || postId === null ) {
		return null;
	}

	return `${ postType || 'post' }:${ postId }`;
}

/**
 * Consults the DE-RTC retry-save policy and performs the guarded retry-save
 * handoff only when the policy is ready.
 *
 * This is the first explicit bridge between save-flow code and the guarded
 * retry-save endpoint. It still does not call normal save itself. Callers may
 * continue to normal save only when the returned status is
 * `normal_save_fallback`.
 *
 * @param {Object} [options] Request and policy options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalMaybeSavePostWithDistributedEditingRetryPolicy =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const acceptedFreshReviewConsumeValidation =
			options.acceptedFreshReviewConsumeValidation ??
			getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
				currentSessionState
			);
		const proposedPostContent =
			options.proposedPostContent ??
			getDistributedEditingFreshReviewImportedPostContentForRetrySave( {
				postId,
				postType,
				sessionState: currentSessionState,
				acceptedFreshReviewConsumeValidation,
			} ) ??
			select.getEditedPostContent?.();
		const structuralNoopSaveCandidate =
			options.isAutosave !== true && options.local !== true
				? getDistributedEditingStructuralNoopSaveCandidate( {
						editedPostContent: proposedPostContent,
						sessionState: currentSessionState,
				  } )
				: null;

		if ( structuralNoopSaveCandidate ) {
			return applyDistributedEditingStructuralNoopSaveConfirmation( {
				dispatch,
				registry,
				select,
				sessionState: currentSessionState,
				structuralNoopSaveCandidate,
			} );
		}

		const policy = getDistributedEditingRetrySavePolicyForSessionState(
			currentSessionState,
			{
				postId,
				restBase,
				proposedPostContent,
				clientBaseVersion: options.clientBaseVersion,
				acceptedProofServerVersion: options.acceptedProofServerVersion,
				rebasedFromVersion: options.rebasedFromVersion,
				pendingChangeCount: options.pendingChangeCount,
			}
		);

		if ( ! policy.canRetrySave ) {
			const allowsNormalSaveFallback = ! policy.protectsLocalChanges;
			const handoff = {
				status: allowsNormalSaveFallback
					? 'normal_save_fallback'
					: 'retry_save_blocked',
				reason: policy.reason,
				policy,
				allowsNormalSaveFallback,
				blocksNormalSavePost: ! allowsNormalSaveFallback,
				callsRetrySaveAction: false,
				callsNormalSavePost: false,
				response: null,
			};

			if ( ! allowsNormalSaveFallback ) {
				dispatch.setDistributedEditingSessionState(
					getDistributedEditingSessionStateForRetrySaveHandoff(
						currentSessionState,
						handoff
					)
				);
			}

			return handoff;
		}

		const retrySaveAcceptedFreshReviewConsumeValidation =
			acceptedFreshReviewConsumeValidation ??
			policy.request.acceptedFreshReviewConsumeValidation;
		const retrySaveProposedPostContent =
			options.proposedPostContent ??
			getDistributedEditingFreshReviewImportedPostContentForRetrySave( {
				postId,
				postType,
				sessionState: currentSessionState,
				acceptedFreshReviewConsumeValidation:
					retrySaveAcceptedFreshReviewConsumeValidation,
			} ) ??
			proposedPostContent;
		const response =
			await dispatch.__experimentalSaveDistributedEditingRetryAfterProof(
				{
					...policy.request,
					proposedPostContent: retrySaveProposedPostContent,
					proposedPostContentHash: options.proposedPostContentHash,
					acceptedProofSavesPost: options.acceptedProofSavesPost,
					acceptedProofMutatesPostContent:
						options.acceptedProofMutatesPostContent,
					acceptedProofCreatesRevision:
						options.acceptedProofCreatesRevision,
					acceptedProofClaimsSaved: options.acceptedProofClaimsSaved,
					acceptedReviewApprovalProof:
						options.acceptedReviewApprovalProof ??
						policy.request.acceptedReviewApprovalProof,
					acceptedFreshReviewConsumeValidation:
						retrySaveAcceptedFreshReviewConsumeValidation,
				}
			);
		const sessionState = select.getDistributedEditingSessionState?.() || {};
		const hasSavedStateEvidence =
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				sessionState
			);

		return {
			status: 'retry_save_submitted',
			reason: null,
			policy,
			allowsNormalSaveFallback: false,
			callsRetrySaveAction: true,
			callsNormalSavePost: false,
			claimsSaved: hasSavedStateEvidence,
			hasRetrySaveSavedStateEvidence: hasSavedStateEvidence,
			sessionState,
			response,
		};
	};

/**
 * Handles DE-RTC normal-save fallback when the authoritative post changed after
 * this editor loaded its base content.
 *
 * This is a guard in front of ordinary WordPress persistence. It reads the
 * latest server post representation, attempts a conservative local rebase for
 * non-conflicting serialized-block edits, and routes successful rebases through
 * the existing retry-submit proof and guarded retry-save path. Conflicts remain
 * blocked and exportable. It must not call the ordinary post save fallback,
 * create revisions outside retry-save, or change post locks.
 *
 * @param {Object} [options] Save options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalGuardDistributedEditingNormalSaveFreshness =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		if (
			options.isAutosave ||
			options.isPreview ||
			options.__experimentalSkipDistributedEditingSaveFreshnessGuard ||
			! select.shouldUseDistributedEditingRetrySaveForSavePost?.(
				options
			)
		) {
			return getDistributedEditingNormalSaveFreshnessGuardAllowedResult( {
				callsServerStateRefetchEndpoint: false,
				reason: null,
			} );
		}

		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const currentPostSyncMetaVersion =
			getDistributedEditingServerVersionFromResponse( currentPost );
		const clientBaseVersion =
			currentSessionState.clientBaseVersion ||
			currentSessionState.serverVersion ||
			currentPostSyncMetaVersion;
		const clientBaseContent = getDistributedEditingComparablePostContent(
			getDistributedEditingPostRawContent( currentPost )
		);
		const localContent = select.getEditedPostContent?.();

		if (
			! select.isEditedPostDirty?.() ||
			typeof clientBaseContent !== 'string' ||
			typeof localContent !== 'string'
		) {
			return getDistributedEditingNormalSaveFreshnessGuardAllowedResult( {
				callsServerStateRefetchEndpoint: false,
				reason: null,
			} );
		}

		try {
			const response = await requestDistributedEditingServerStateRefetch(
				{
					postId,
					restBase,
				}
			);
			const serverContent =
				getDistributedEditingPostContentFromResponse( response );

			if ( typeof serverContent !== 'string' ) {
				return getDistributedEditingNormalSaveFreshnessGuardAllowedResult(
					{
						callsServerStateRefetchEndpoint: true,
						reason: null,
					}
				);
			}

			const serverVersion =
				getDistributedEditingServerVersionFromResponse( response ) ||
				currentSessionState.serverVersion ||
				clientBaseVersion;
			const rebasedFromVersion =
				clientBaseVersion ||
				currentSessionState.clientBaseVersion ||
				currentSessionState.serverVersion ||
				serverVersion;
			const pendingChangeCount =
				currentSessionState.pendingChangeCount || 1;

			if ( serverContent === clientBaseContent ) {
				const proposedPostContent =
					getDistributedEditingComparablePostContent( localContent );

				if (
					typeof proposedPostContent !== 'string' ||
					proposedPostContent === clientBaseContent
				) {
					return getDistributedEditingNormalSaveFreshnessGuardAllowedResult(
						{
							callsServerStateRefetchEndpoint: true,
							reason: null,
						}
					);
				}

				const proposedPostContentHash =
					await getDistributedEditingPostContentSha256Hash(
						proposedPostContent
					);
				const proofReadySessionState = {
					...currentSessionState,
					clientBaseVersion: rebasedFromVersion,
					serverVersion,
					clientBaseContent,
					pendingChangeCount,
					hasPendingChanges: true,
					mustOfferLocalCopy: true,
					canExportLocalUpdates: true,
				};

				dispatch.setDistributedEditingSessionState(
					getDistributedEditingSessionStateWithActionTranscriptEvent(
						proofReadySessionState,
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_STAGED,
						}
					)
				);

				let didCallRetrySubmit = false;
				let didCallRetrySave = false;

				try {
					didCallRetrySubmit = true;
					await dispatch.__experimentalRefreshDistributedEditingRetrySubmitProof(
						{
							...options,
							clientBaseVersion: serverVersion,
							rebasedFromVersion,
							pendingChangeCount,
							proposedPostContentHash,
						}
					);
					await dispatch.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof();

					didCallRetrySave = true;
					const retrySaveResult =
						await dispatch.__experimentalMaybeSavePostWithDistributedEditingRetryPolicy(
							{
								...options,
								proposedPostContent,
								proposedPostContentHash,
								clientBaseVersion: serverVersion,
								acceptedProofServerVersion: serverVersion,
								rebasedFromVersion,
								pendingChangeCount,
							}
						);

					return {
						...retrySaveResult,
						status:
							retrySaveResult.status === 'retry_save_submitted'
								? 'distributed_editing_normal_save_guarded_retry_save_submitted'
								: retrySaveResult.status,
						allowsNormalSaveFallback: false,
						callsServerStateRefetchEndpoint: true,
						callsRetrySubmitEndpoint: true,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: Boolean(
							retrySaveResult.callsRetrySaveAction
						),
						mutatesEditorContent: false,
						changesPostLock: false,
					};
				} catch ( error ) {
					const sessionState =
						select.getDistributedEditingSessionState?.() || {};

					return {
						status: 'distributed_editing_normal_save_guarded_retry_save_blocked',
						reason:
							error?.code ||
							sessionState.reasonCode ||
							sessionState.retrySaveReason ||
							sessionState.retrySubmitProofReason ||
							DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
						error,
						allowsNormalSaveFallback: false,
						blocksNormalSavePost: true,
						callsServerStateRefetchEndpoint: true,
						callsRetrySubmitEndpoint: didCallRetrySubmit,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: didCallRetrySave,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						changesPostLock: false,
						claimsSaved: false,
						canExportLocalUpdates: true,
						requiresServerStateRefetch: Boolean(
							sessionState.requiresServerStateRefetch
						),
					};
				}
			}

			const staleSessionState =
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					clientBaseVersion: rebasedFromVersion,
					serverVersion,
					clientBaseContent,
					pendingChangeCount,
					remoteChangeCount:
						currentSessionState.remoteChangeCount || 1,
					canAttemptLocalRebase: true,
				} );
			const refetchedSessionState =
				getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
					response,
					staleSessionState
				);
			const plannedSessionState =
				getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
					refetchedSessionState
				);
			const rebaseResult =
				getDistributedEditingStaleBaseLocalRebaseResult( {
					currentSessionState: plannedSessionState,
					localContent,
				} );

			if ( rebaseResult.hasCandidatePostContent ) {
				const proposedPostContent = rebaseResult.candidatePostContent;
				const proposedPostContentHash =
					await getDistributedEditingPostContentSha256Hash(
						proposedPostContent
					);
				const rebasedSessionState =
					getDistributedEditingSessionStateWithActionTranscriptEvent(
						rebaseResult.sessionState,
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_APPLIED,
						}
					);

				dispatch.editPost(
					{ content: proposedPostContent },
					{ undoIgnore: true }
				);
				dispatch.setDistributedEditingSessionState(
					rebasedSessionState
				);
				let didCallRetrySubmit = false;
				let didCallRetrySave = false;
				try {
					await dispatch.__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase();
					didCallRetrySubmit = true;
					await dispatch.__experimentalRefreshDistributedEditingRetrySubmitProof(
						{
							...options,
							clientBaseVersion: serverVersion,
							rebasedFromVersion,
							pendingChangeCount,
							proposedPostContentHash,
						}
					);
					await dispatch.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof();

					didCallRetrySave = true;
					const retrySaveResult =
						await dispatch.__experimentalMaybeSavePostWithDistributedEditingRetryPolicy(
							{
								...options,
								proposedPostContent,
								proposedPostContentHash,
								clientBaseVersion: serverVersion,
								acceptedProofServerVersion: serverVersion,
								rebasedFromVersion,
								pendingChangeCount,
							}
						);

					return {
						...retrySaveResult,
						status:
							retrySaveResult.status === 'retry_save_submitted'
								? 'distributed_editing_normal_save_auto_merged_retry_save_submitted'
								: retrySaveResult.status,
						autoMergedLocalChanges: true,
						mergedBlockCount: rebaseResult.mergedBlockCount,
						allowsNormalSaveFallback: false,
						callsServerStateRefetchEndpoint: true,
						callsRetrySubmitEndpoint: true,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: Boolean(
							retrySaveResult.callsRetrySaveAction
						),
						mutatesEditorContent: true,
						changesPostLock: false,
					};
				} catch ( error ) {
					const sessionState =
						select.getDistributedEditingSessionState?.() || {};

					return {
						status: 'distributed_editing_normal_save_auto_merge_retry_blocked',
						reason:
							error?.code ||
							sessionState.reasonCode ||
							sessionState.retrySaveReason ||
							sessionState.retrySubmitProofReason ||
							DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
						error,
						autoMergedLocalChanges: true,
						mergedBlockCount: rebaseResult.mergedBlockCount,
						allowsNormalSaveFallback: false,
						blocksNormalSavePost: true,
						callsServerStateRefetchEndpoint: true,
						callsRetrySubmitEndpoint: didCallRetrySubmit,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: didCallRetrySave,
						mutatesEditorContent: true,
						mutatesPersistedPostContent: false,
						changesPostLock: false,
						claimsSaved: false,
						canExportLocalUpdates: true,
						requiresServerStateRefetch: Boolean(
							sessionState.requiresServerStateRefetch
						),
					};
				}
			}

			const blockedSessionState =
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					rebaseResult.sessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED,
						reasonCode:
							DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					}
				);

			dispatch.setDistributedEditingSessionState( blockedSessionState );

			return {
				status:
					rebaseResult.status ===
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.UNSAFE_CONTENT_BOUNDARY
						? 'distributed_editing_normal_save_blocked_unsafe_merge_boundary'
						: 'distributed_editing_normal_save_blocked_merge_conflict',
				reason: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				canExportLocalUpdates: true,
				requiresServerStateRefetch: false,
				localRebaseResultStatus: rebaseResult.status,
				localRebaseResultReason: rebaseResult.reason,
				requiresManualConflictResolution: true,
			};
		} catch ( error ) {
			const blockedSessionState =
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					clientBaseVersion:
						currentSessionState.clientBaseVersion ||
						currentSessionState.serverVersion,
					serverVersion: currentSessionState.serverVersion,
					clientBaseContent,
					pendingChangeCount:
						currentSessionState.pendingChangeCount || 1,
					remoteChangeCount:
						currentSessionState.remoteChangeCount || 1,
					canAttemptLocalRebase: false,
				} );

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateWithActionTranscriptEvent(
					blockedSessionState,
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED,
						reasonCode:
							error?.code ||
							DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					}
				)
			);

			return {
				status: 'distributed_editing_normal_save_blocked_freshness_unknown',
				reason:
					error?.code ||
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				error,
				allowsNormalSaveFallback: false,
				blocksNormalSavePost: true,
				callsServerStateRefetchEndpoint: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				canExportLocalUpdates: true,
				requiresServerStateRefetch: true,
			};
		}
	};

function getDistributedEditingNormalSaveFreshnessGuardAllowedResult( {
	callsServerStateRefetchEndpoint,
	reason,
} ) {
	return {
		status: 'normal_save_fallback',
		reason,
		allowsNormalSaveFallback: true,
		blocksNormalSavePost: false,
		callsServerStateRefetchEndpoint,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function getDistributedEditingPostRawContent( post ) {
	if ( typeof post?.content === 'string' ) {
		return post.content;
	}

	if ( typeof post?.content?.raw === 'string' ) {
		return post.content.raw;
	}

	return null;
}

/**
 * Returns an action object used in signalling that attributes of the post have
 * been edited.
 *
 * @param {Object} edits     Post attributes to edit.
 * @param {Object} [options] Options for the edit.
 *
 * @example
 * ```js
 * // Update the post title
 * wp.data.dispatch( 'core/editor' ).editPost( { title: `${ newTitle }` } );
 * ```
 *
 * @return {Object} Action object
 */
export const editPost =
	( edits, options ) =>
	( { select, registry } ) => {
		const { id, type } = select.getCurrentPost();
		registry
			.dispatch( coreStore )
			.editEntityRecord( 'postType', type, id, edits, options );
	};

/**
 * Action for saving the current post in the editor.
 *
 * @param {Object} [options]
 */
export const savePost =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		if ( ! select.isEditedPostSaveable() ) {
			return;
		}

		const riskyBlockReviewRouting =
			await dispatch.__experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview(
				options
			);

		if ( ! riskyBlockReviewRouting.allowsNormalSaveFallback ) {
			return riskyBlockReviewRouting;
		}

		const content = select.getEditedPostContent();
		dispatch.editPost( { content }, { undoIgnore: true } );

		if (
			select.shouldUseDistributedEditingRetrySaveForSavePost( options )
		) {
			const currentPost = select.getCurrentPost?.() || {};
			const currentSessionState =
				select.getDistributedEditingSessionState?.() || {};
			const acceptedFreshReviewConsumeValidation =
				options.acceptedFreshReviewConsumeValidation ??
				getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
					currentSessionState
				);
			const retrySaveProposedPostContent =
				options.proposedPostContent ??
				getDistributedEditingFreshReviewImportedPostContentForRetrySave(
					{
						postId: currentPost.id,
						postType: currentPost.type,
						sessionState: currentSessionState,
						acceptedFreshReviewConsumeValidation,
					}
				) ??
				content;
			const retrySaveHandoff =
				await dispatch.__experimentalMaybeSavePostWithDistributedEditingRetryPolicy(
					{
						...options,
						proposedPostContent: retrySaveProposedPostContent,
						acceptedFreshReviewConsumeValidation,
					}
				);

			if ( ! retrySaveHandoff.allowsNormalSaveFallback ) {
				return retrySaveHandoff;
			}

			const freshnessGuard =
				await dispatch.__experimentalGuardDistributedEditingNormalSaveFreshness(
					{
						...options,
					}
				);

			if ( ! freshnessGuard.allowsNormalSaveFallback ) {
				return freshnessGuard;
			}
		}

		const previousRecord = select.getCurrentPost();
		let edits = {
			id: previousRecord.id,
			...registry
				.select( coreStore )
				.getEntityRecordNonTransientEdits(
					'postType',
					previousRecord.type,
					previousRecord.id
				),
			content,
		};
		dispatch( { type: 'REQUEST_POST_UPDATE_START', options } );

		let error = false;
		try {
			edits = await applyFiltersAsync(
				'editor.preSavePost',
				edits,
				options
			);
		} catch ( err ) {
			error = err;
		}

		if ( ! error ) {
			try {
				await registry
					.dispatch( coreStore )
					.saveEntityRecord(
						'postType',
						previousRecord.type,
						edits,
						options
					);
			} catch ( err ) {
				error =
					err.message && err.code !== 'unknown_error'
						? err.message
						: __( 'An error occurred while updating.' );
			}
		}

		if ( ! error ) {
			error = registry
				.select( coreStore )
				.getLastEntitySaveError(
					'postType',
					previousRecord.type,
					previousRecord.id
				);
		}

		// Run the hook with legacy unstable name for backward compatibility
		if ( ! error ) {
			try {
				await applyFilters(
					'editor.__unstableSavePost',
					Promise.resolve(),
					options
				);
			} catch ( err ) {
				error = err;
			}
		}

		if ( ! error ) {
			try {
				await doActionAsync(
					'editor.savePost',
					{ id: previousRecord.id, type: previousRecord.type },
					options
				);
			} catch ( err ) {
				error = err;
			}
		}
		dispatch( { type: 'REQUEST_POST_UPDATE_FINISH', options } );

		if (
			typeof window !== 'undefined' &&
			window.__experimentalTemplateActivate &&
			! options.isAutosave &&
			previousRecord.type === 'wp_template' &&
			( typeof previousRecord.id === 'number' ||
				/^\d+$/.test( previousRecord.id ) )
		) {
			templateActivationNotice( { select, dispatch, registry } );
		}

		if ( error ) {
			const args = getNotificationArgumentsForSaveFail( {
				post: previousRecord,
				edits,
				error,
			} );
			if ( args.length ) {
				registry.dispatch( noticesStore ).createErrorNotice( ...args );
			}
		} else {
			const updatedRecord = select.getCurrentPost();
			const args = getNotificationArgumentsForSaveSuccess( {
				previousPost: previousRecord,
				post: updatedRecord,
				postType: await registry
					.resolveSelect( coreStore )
					.getPostType( updatedRecord.type ),
				options,
			} );
			if ( args.length ) {
				registry
					.dispatch( noticesStore )
					.createSuccessNotice( ...args );
			}
			// Make sure that any edits after saving create an undo level and are
			// considered for change detection.
			if ( ! options.isAutosave ) {
				registry
					.dispatch( blockEditorStore )
					.__unstableMarkLastChangeAsPersistent();
			}
		}
	};

async function templateActivationNotice( { select, registry } ) {
	const editorSettings = select.getEditorSettings();

	// Don't open for focused entity.
	if ( editorSettings.onNavigateToPreviousEntityRecord ) {
		return;
	}

	const { id, slug } = select.getCurrentPost();
	const site = await registry
		.select( coreStore )
		.getEntityRecord( 'root', 'site' );

	// Already active.
	if ( site.active_templates[ slug ] === id ) {
		return;
	}

	const currentTheme = await registry
		.resolveSelect( coreStore )
		.getCurrentTheme();
	const templateType = currentTheme?.default_template_types.find(
		( type ) => type.slug === slug
	);

	await registry.dispatch( noticesStore ).createNotice(
		'info',
		sprintf(
			// translators: %s: The name (or slug) of the type of template.
			__( 'Do you want to activate this "%s" template?' ),
			templateType?.title ?? slug
		),
		{
			id: 'template-activate-notice',
			actions: [
				{
					label: __( 'Activate' ),
					onClick: async () => {
						await registry
							.dispatch( noticesStore )
							.createNotice(
								'info',
								__( 'Activating template…' ),
								{ id: 'template-activate-notice' }
							);
						try {
							const currentSite = await registry
								.select( coreStore )
								.getEntityRecord( 'root', 'site' );
							await registry
								.dispatch( coreStore )
								.saveEntityRecord(
									'root',
									'site',
									{
										active_templates: {
											...currentSite.active_templates,
											[ slug ]: id,
										},
									},
									{ throwOnError: true }
								);
							await registry
								.dispatch( noticesStore )
								.createSuccessNotice(
									__( 'Template activated.' ),
									{ id: 'template-activate-notice' }
								);
						} catch ( error ) {
							await registry
								.dispatch( noticesStore )
								.createErrorNotice(
									__( 'Template activation failed.' ),
									{ id: 'template-activate-notice' }
								);
							// Rethrow for debugging.
							throw error;
						}
					},
				},
			],
		}
	);
}

/**
 * Action for refreshing the current post.
 *
 * @deprecated Since WordPress 6.0.
 */
export function refreshPost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).refreshPost", {
		since: '6.0',
		version: '6.3',
		alternative: 'Use the core entities store instead',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Action for trashing the current post in the editor.
 */
export const trashPost =
	() =>
	async ( { select, dispatch, registry } ) => {
		const postTypeSlug = select.getCurrentPostType();
		const postType = await registry
			.resolveSelect( coreStore )
			.getPostType( postTypeSlug );
		const { rest_base: restBase, rest_namespace: restNamespace = 'wp/v2' } =
			postType;
		dispatch( { type: 'REQUEST_POST_DELETE_START' } );
		try {
			const post = select.getCurrentPost();
			await apiFetch( {
				path: `/${ restNamespace }/${ restBase }/${ post.id }`,
				method: 'DELETE',
			} );

			await dispatch.savePost();
		} catch ( error ) {
			registry
				.dispatch( noticesStore )
				.createErrorNotice(
					...getNotificationArgumentsForTrashFail( { error } )
				);
		}
		dispatch( { type: 'REQUEST_POST_DELETE_FINISH' } );
	};

/**
 * Action that autosaves the current post.  This
 * includes server-side autosaving (default) and client-side (a.k.a. local)
 * autosaving (e.g. on the Web, the post might be committed to Session
 * Storage).
 *
 * @param {Object}  [options]       Extra flags to identify the autosave.
 * @param {boolean} [options.local] Whether to perform a local autosave.
 */
export const autosave =
	( { local = false, ...options } = {} ) =>
	async ( { select, dispatch } ) => {
		const post = select.getCurrentPost();

		if ( local ) {
			const isPostNew = select.isEditedPostNew();
			const title = select.getEditedPostAttribute( 'title' );
			const content = select.getEditedPostAttribute( 'content' );
			const excerpt = select.getEditedPostAttribute( 'excerpt' );
			localAutosaveSet( post.id, isPostNew, title, content, excerpt );
		} else {
			if ( select.isEditedPostDirty?.() === false ) {
				return {
					status: 'autosave_skipped_clean_post',
					callsNormalSavePost: false,
					claimsSaved: false,
				};
			}
			await dispatch.savePost( { isAutosave: true, ...options } );
		}
	};

/**
 * Save for preview.
 *
 * @param {Object}  options                     Options object.
 * @param {boolean} options.forceIsAutosaveable Whether to force the post to be autosaveable.
 *
 * @return {Function} Thunk that saves for preview and returns the preview link.
 */
export const __unstableSaveForPreview =
	( { forceIsAutosaveable } = {} ) =>
	async ( { select, dispatch } ) => {
		if (
			( forceIsAutosaveable || select.isEditedPostAutosaveable() ) &&
			! select.isPostLocked()
		) {
			const isDraft = [ 'draft', 'auto-draft' ].includes(
				select.getEditedPostAttribute( 'status' )
			);
			if ( isDraft ) {
				await dispatch.savePost( { isPreview: true } );
			} else {
				await dispatch.autosave( { isPreview: true } );
			}
		}

		return select.getEditedPostPreviewLink();
	};

/**
 * Action that restores last popped state in undo history.
 */
export const redo =
	() =>
	( { registry } ) => {
		registry.dispatch( coreStore ).redo();
	};

/**
 * Action that pops a record from undo history and undoes the edit.
 */
export const undo =
	() =>
	( { registry } ) => {
		registry.dispatch( coreStore ).undo();
	};

/**
 * Action that creates an undo history record.
 *
 * @deprecated Since WordPress 6.0
 */
export function createUndoLevel() {
	deprecated( "wp.data.dispatch( 'core/editor' ).createUndoLevel", {
		since: '6.0',
		version: '6.3',
		alternative: 'Use the core entities store instead',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Action that locks the editor.
 *
 * @param {Object} lock Details about the post lock status, user, and nonce.
 * @return {Object} Action object.
 */
export function updatePostLock( lock ) {
	return {
		type: 'UPDATE_POST_LOCK',
		lock,
	};
}

/**
 * Enable the publish sidebar.
 */
export const enablePublishSidebar =
	() =>
	( { registry } ) => {
		registry
			.dispatch( preferencesStore )
			.set( 'core', 'isPublishSidebarEnabled', true );
	};

/**
 * Disables the publish sidebar.
 */
export const disablePublishSidebar =
	() =>
	( { registry } ) => {
		registry
			.dispatch( preferencesStore )
			.set( 'core', 'isPublishSidebarEnabled', false );
	};

/**
 * Action that locks post saving.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * const { subscribe } = wp.data;
 *
 * const initialPostStatus = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
 *
 * // Only allow publishing posts that are set to a future date.
 * if ( 'publish' !== initialPostStatus ) {
 *
 * 	// Track locking.
 * 	let locked = false;
 *
 * 	// Watch for the publish event.
 * 	let unssubscribe = subscribe( () => {
 * 		const currentPostStatus = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
 * 		if ( 'publish' !== currentPostStatus ) {
 *
 * 			// Compare the post date to the current date, lock the post if the date isn't in the future.
 * 			const postDate = new Date( wp.data.select( 'core/editor' ).getEditedPostAttribute( 'date' ) );
 * 			const currentDate = new Date();
 * 			if ( postDate.getTime() <= currentDate.getTime() ) {
 * 				if ( ! locked ) {
 * 					locked = true;
 * 					wp.data.dispatch( 'core/editor' ).lockPostSaving( 'futurelock' );
 * 				}
 * 			} else {
 * 				if ( locked ) {
 * 					locked = false;
 * 					wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'futurelock' );
 * 				}
 * 			}
 * 		}
 * 	} );
 * }
 * ```
 *
 * @return {Object} Action object
 */
export function lockPostSaving( lockName ) {
	return {
		type: 'LOCK_POST_SAVING',
		lockName,
	};
}

/**
 * Action that unlocks post saving.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * // Unlock post saving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'mylock' );
 * ```
 *
 * @return {Object} Action object
 */
export function unlockPostSaving( lockName ) {
	return {
		type: 'UNLOCK_POST_SAVING',
		lockName,
	};
}

/**
 * Action that locks post autosaving.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * // Lock post autosaving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).lockPostAutosaving( 'mylock' );
 * ```
 *
 * @return {Object} Action object
 */
export function lockPostAutosaving( lockName ) {
	return {
		type: 'LOCK_POST_AUTOSAVING',
		lockName,
	};
}

/**
 * Action that unlocks post autosaving.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * // Unlock post saving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).unlockPostAutosaving( 'mylock' );
 * ```
 *
 * @return {Object} Action object
 */
export function unlockPostAutosaving( lockName ) {
	return {
		type: 'UNLOCK_POST_AUTOSAVING',
		lockName,
	};
}

/**
 * Returns an action object used to signal that the blocks have been updated.
 *
 * @param {Array}  blocks    Block Array.
 * @param {Object} [options] Optional options.
 */
export const resetEditorBlocks =
	( blocks, options = {} ) =>
	( { select, dispatch, registry } ) => {
		const { __unstableShouldCreateUndoLevel, selection } = options;
		const edits = { blocks, selection };

		if ( __unstableShouldCreateUndoLevel !== false ) {
			const { id, type } = select.getCurrentPost();
			const noChange =
				registry
					.select( coreStore )
					.getEditedEntityRecord( 'postType', type, id ).blocks ===
				edits.blocks;
			if ( noChange ) {
				registry
					.dispatch( coreStore )
					.__unstableCreateUndoLevel( 'postType', type, id );
				return;
			}

			// We create a new function here on every persistent edit
			// to make sure the edit makes the post dirty and creates
			// a new undo level.
			edits.content = ( { blocks: blocksForSerialization = [] } ) =>
				__unstableSerializeAndClean( blocksForSerialization );
		}

		dispatch.editPost( edits );
	};

/*
 * Returns an action object used in signalling that the post editor settings have been updated.
 *
 * @param {Object} settings Updated settings
 *
 * @return {Object} Action object
 */
export function updateEditorSettings( settings ) {
	return {
		type: 'UPDATE_EDITOR_SETTINGS',
		settings,
	};
}

/**
 * Returns an action used to set the rendering mode of the post editor. We support multiple rendering modes:
 *
 * -   `post-only`: This mode extracts the post blocks from the template and renders only those. The idea is to allow the user to edit the post/page in isolation without the wrapping template.
 * -   `template-locked`: This mode renders both the template and the post blocks but the template blocks are locked and can't be edited. The post blocks are editable.
 *
 * @param {string} mode Mode (one of 'post-only' or 'template-locked').
 */
export const setRenderingMode =
	( mode ) =>
	( { dispatch, registry, select } ) => {
		if (
			select.__unstableIsEditorReady() &&
			! select.getEditorSettings().isPreviewMode
		) {
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
		}

		dispatch( {
			type: 'SET_RENDERING_MODE',
			mode,
		} );
	};

/**
 * Action that changes the width of the editing canvas.
 *
 * @param {string} deviceType
 *
 * @return {Object} Action object.
 */
export function setDeviceType( deviceType ) {
	return {
		type: 'SET_DEVICE_TYPE',
		deviceType,
	};
}

/**
 * Returns an action object used to enable or disable a panel in the editor.
 *
 * @param {string} panelName A string that identifies the panel to enable or disable.
 *
 * @return {Object} Action object.
 */
export const toggleEditorPanelEnabled =
	( panelName ) =>
	( { registry } ) => {
		const inactivePanels =
			registry
				.select( preferencesStore )
				.get( 'core', 'inactivePanels' ) ?? [];

		const isPanelInactive = !! inactivePanels?.includes( panelName );

		// If the panel is inactive, remove it to enable it, else add it to
		// make it inactive.
		let updatedInactivePanels;
		if ( isPanelInactive ) {
			updatedInactivePanels = inactivePanels.filter(
				( invactivePanelName ) => invactivePanelName !== panelName
			);
		} else {
			updatedInactivePanels = [ ...inactivePanels, panelName ];
		}

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'inactivePanels', updatedInactivePanels );
	};

/**
 * Opens a closed panel and closes an open panel.
 *
 * @param {string} panelName A string that identifies the panel to open or close.
 */
export const toggleEditorPanelOpened =
	( panelName ) =>
	( { registry } ) => {
		const openPanels =
			registry.select( preferencesStore ).get( 'core', 'openPanels' ) ??
			[];

		const isPanelOpen = !! openPanels?.includes( panelName );

		// If the panel is open, remove it to close it, else add it to
		// make it open.
		let updatedOpenPanels;
		if ( isPanelOpen ) {
			updatedOpenPanels = openPanels.filter(
				( openPanelName ) => openPanelName !== panelName
			);
		} else {
			updatedOpenPanels = [ ...openPanels, panelName ];
		}

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'openPanels', updatedOpenPanels );
	};

/**
 * Returns an action object used to remove a panel from the editor.
 *
 * @param {string} panelName A string that identifies the panel to remove.
 *
 * @return {Object} Action object.
 */
export function removeEditorPanel( panelName ) {
	return {
		type: 'REMOVE_PANEL',
		panelName,
	};
}

/**
 * Returns an action object used to open/close the inserter.
 *
 * @param {boolean|Object} value                Whether the inserter should be
 *                                              opened (true) or closed (false).
 *                                              To specify an insertion point,
 *                                              use an object.
 * @param {string}         value.rootClientId   The root client ID to insert at.
 * @param {number}         value.insertionIndex The index to insert at.
 * @param {string}         value.filterValue    A query to filter the inserter results.
 * @param {Function}       value.onSelect       A callback when an item is selected.
 * @param {string}         value.tab            The tab to open in the inserter.
 * @param {string}         value.category       The category to initialize in the inserter.
 *
 * @return {Object} Action object.
 */
export const setIsInserterOpened =
	( value ) =>
	( { dispatch, registry } ) => {
		if (
			typeof value === 'object' &&
			value.hasOwnProperty( 'rootClientId' ) &&
			value.hasOwnProperty( 'insertionIndex' )
		) {
			unlock( registry.dispatch( blockEditorStore ) ).setInsertionPoint( {
				rootClientId: value.rootClientId,
				index: value.insertionIndex,
			} );
		}

		dispatch( {
			type: 'SET_IS_INSERTER_OPENED',
			value,
		} );
	};

/**
 * Returns an action object used to open/close the list view.
 *
 * @param {boolean} isOpen A boolean representing whether the list view should be opened or closed.
 * @return {Object} Action object.
 */
export function setIsListViewOpened( isOpen ) {
	return {
		type: 'SET_IS_LIST_VIEW_OPENED',
		isOpen,
	};
}

/**
 * Action that toggles Distraction free mode.
 * Distraction free mode expects there are no sidebars, as due to the
 * z-index values set, you can't close sidebars.
 *
 * @param {Object}  [options={}]                Optional configuration object
 * @param {boolean} [options.createNotice=true] Whether to create a notice
 */
export const toggleDistractionFree =
	( { createNotice = true } = {} ) =>
	( { dispatch, registry } ) => {
		const isDistractionFree = registry
			.select( preferencesStore )
			.get( 'core', 'distractionFree' );
		if ( isDistractionFree ) {
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'fixedToolbar', false );
		}
		if ( ! isDistractionFree ) {
			registry.batch( () => {
				registry
					.dispatch( preferencesStore )
					.set( 'core', 'fixedToolbar', true );
				dispatch.setIsInserterOpened( false );
				dispatch.setIsListViewOpened( false );
				unlock(
					registry.dispatch( blockEditorStore )
				).resetZoomLevel();
			} );
		}
		registry.batch( () => {
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'distractionFree', ! isDistractionFree );

			if ( createNotice ) {
				registry
					.dispatch( noticesStore )
					.createInfoNotice(
						isDistractionFree
							? __( 'Distraction free mode deactivated.' )
							: __( 'Distraction free mode activated.' ),
						{
							id: 'core/editor/distraction-free-mode/notice',
							type: 'snackbar',
							actions: [
								{
									label: __( 'Undo' ),
									onClick: () => {
										registry.batch( () => {
											registry
												.dispatch( preferencesStore )
												.set(
													'core',
													'fixedToolbar',
													isDistractionFree
												);
											registry
												.dispatch( preferencesStore )
												.toggle(
													'core',
													'distractionFree'
												);
										} );
									},
								},
							],
						}
					);
			}
		} );
	};

/**
 * Action that toggles the Spotlight Mode view option.
 */
export const toggleSpotlightMode =
	() =>
	( { registry } ) => {
		registry.dispatch( preferencesStore ).toggle( 'core', 'focusMode' );

		const isFocusMode = registry
			.select( preferencesStore )
			.get( 'core', 'focusMode' );

		registry
			.dispatch( noticesStore )
			.createInfoNotice(
				isFocusMode
					? __( 'Spotlight mode activated.' )
					: __( 'Spotlight mode deactivated.' ),
				{
					id: 'core/editor/toggle-spotlight-mode/notice',
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick: () => {
								registry
									.dispatch( preferencesStore )
									.toggle( 'core', 'focusMode' );
							},
						},
					],
				}
			);
	};

/**
 * Action that toggles the Top Toolbar view option.
 */
export const toggleTopToolbar =
	() =>
	( { registry } ) => {
		registry.dispatch( preferencesStore ).toggle( 'core', 'fixedToolbar' );

		const isTopToolbar = registry
			.select( preferencesStore )
			.get( 'core', 'fixedToolbar' );

		registry
			.dispatch( noticesStore )
			.createInfoNotice(
				isTopToolbar
					? __( 'Top toolbar activated.' )
					: __( 'Top toolbar deactivated.' ),
				{
					id: 'core/editor/toggle-top-toolbar/notice',
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),

							onClick: () => {
								registry
									.dispatch( preferencesStore )
									.toggle( 'core', 'fixedToolbar' );
							},
						},
					],
				}
			);
	};

/**
 * Triggers an action used to switch editor mode.
 *
 * @param {string} mode The editor mode.
 */
export const switchEditorMode =
	( mode ) =>
	( { dispatch, registry } ) => {
		registry.dispatch( preferencesStore ).set( 'core', 'editorMode', mode );

		if ( mode !== 'visual' ) {
			// Unselect blocks when we switch to a non visual mode.
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
			// Exit zoom out state when switching to a non visual mode.
			unlock( registry.dispatch( blockEditorStore ) ).resetZoomLevel();
		}

		if ( mode === 'visual' ) {
			speak( __( 'Visual editor selected' ), 'assertive' );
		} else if ( mode === 'text' ) {
			const isDistractionFree = registry
				.select( preferencesStore )
				.get( 'core', 'distractionFree' );
			if ( isDistractionFree ) {
				dispatch.toggleDistractionFree();
			}
			speak( __( 'Code editor selected' ), 'assertive' );
		}
	};

/**
 * Returns an action object used in signalling that the user opened the publish
 * sidebar.
 *
 * @return {Object} Action object
 */
export function openPublishSidebar() {
	return {
		type: 'OPEN_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user closed the
 * publish sidebar.
 *
 * @return {Object} Action object.
 */
export function closePublishSidebar() {
	return {
		type: 'CLOSE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user toggles the publish sidebar.
 *
 * @return {Object} Action object
 */
export function togglePublishSidebar() {
	return {
		type: 'TOGGLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Backward compatibility
 */

const getBlockEditorAction =
	( name ) =>
	( ...args ) =>
	( { registry } ) => {
		deprecated( "`wp.data.dispatch( 'core/editor' )." + name + '`', {
			since: '5.3',
			alternative:
				"`wp.data.dispatch( 'core/block-editor' )." + name + '`',
			version: '6.2',
		} );
		registry.dispatch( blockEditorStore )[ name ]( ...args );
	};

/**
 * @see resetBlocks in core/block-editor store.
 */
export const resetBlocks = getBlockEditorAction( 'resetBlocks' );

/**
 * @see receiveBlocks in core/block-editor store.
 */
export const receiveBlocks = getBlockEditorAction( 'receiveBlocks' );

/**
 * @see updateBlock in core/block-editor store.
 */
export const updateBlock = getBlockEditorAction( 'updateBlock' );

/**
 * @see updateBlockAttributes in core/block-editor store.
 */
export const updateBlockAttributes = getBlockEditorAction(
	'updateBlockAttributes'
);

/**
 * @see selectBlock in core/block-editor store.
 */
export const selectBlock = getBlockEditorAction( 'selectBlock' );

/**
 * @see startMultiSelect in core/block-editor store.
 */
export const startMultiSelect = getBlockEditorAction( 'startMultiSelect' );

/**
 * @see stopMultiSelect in core/block-editor store.
 */
export const stopMultiSelect = getBlockEditorAction( 'stopMultiSelect' );

/**
 * @see multiSelect in core/block-editor store.
 */
export const multiSelect = getBlockEditorAction( 'multiSelect' );

/**
 * @see clearSelectedBlock in core/block-editor store.
 */
export const clearSelectedBlock = getBlockEditorAction( 'clearSelectedBlock' );

/**
 * @see toggleSelection in core/block-editor store.
 */
export const toggleSelection = getBlockEditorAction( 'toggleSelection' );

/**
 * @see replaceBlocks in core/block-editor store.
 */
export const replaceBlocks = getBlockEditorAction( 'replaceBlocks' );

/**
 * @see replaceBlock in core/block-editor store.
 */
export const replaceBlock = getBlockEditorAction( 'replaceBlock' );

/**
 * @see moveBlocksDown in core/block-editor store.
 */
export const moveBlocksDown = getBlockEditorAction( 'moveBlocksDown' );

/**
 * @see moveBlocksUp in core/block-editor store.
 */
export const moveBlocksUp = getBlockEditorAction( 'moveBlocksUp' );

/**
 * @see moveBlockToPosition in core/block-editor store.
 */
export const moveBlockToPosition = getBlockEditorAction(
	'moveBlockToPosition'
);

/**
 * @see insertBlock in core/block-editor store.
 */
export const insertBlock = getBlockEditorAction( 'insertBlock' );

/**
 * @see insertBlocks in core/block-editor store.
 */
export const insertBlocks = getBlockEditorAction( 'insertBlocks' );

/**
 * @see showInsertionPoint in core/block-editor store.
 */
export const showInsertionPoint = getBlockEditorAction( 'showInsertionPoint' );

/**
 * @see hideInsertionPoint in core/block-editor store.
 */
export const hideInsertionPoint = getBlockEditorAction( 'hideInsertionPoint' );

/**
 * @see setTemplateValidity in core/block-editor store.
 */
export const setTemplateValidity = getBlockEditorAction(
	'setTemplateValidity'
);

/**
 * @see synchronizeTemplate in core/block-editor store.
 */
export const synchronizeTemplate = getBlockEditorAction(
	'synchronizeTemplate'
);

/**
 * @see mergeBlocks in core/block-editor store.
 */
export const mergeBlocks = getBlockEditorAction( 'mergeBlocks' );

/**
 * @see removeBlocks in core/block-editor store.
 */
export const removeBlocks = getBlockEditorAction( 'removeBlocks' );

/**
 * @see removeBlock in core/block-editor store.
 */
export const removeBlock = getBlockEditorAction( 'removeBlock' );

/**
 * @see toggleBlockMode in core/block-editor store.
 */
export const toggleBlockMode = getBlockEditorAction( 'toggleBlockMode' );

/**
 * @see startTyping in core/block-editor store.
 */
export const startTyping = getBlockEditorAction( 'startTyping' );

/**
 * @see stopTyping in core/block-editor store.
 */
export const stopTyping = getBlockEditorAction( 'stopTyping' );

/**
 * @see enterFormattedText in core/block-editor store.
 */
export const enterFormattedText = getBlockEditorAction( 'enterFormattedText' );

/**
 * @see exitFormattedText in core/block-editor store.
 */
export const exitFormattedText = getBlockEditorAction( 'exitFormattedText' );

/**
 * @see insertDefaultBlock in core/block-editor store.
 */
export const insertDefaultBlock = getBlockEditorAction( 'insertDefaultBlock' );

/**
 * @see updateBlockListSettings in core/block-editor store.
 */
export const updateBlockListSettings = getBlockEditorAction(
	'updateBlockListSettings'
);
