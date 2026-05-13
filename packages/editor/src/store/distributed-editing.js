/**
 * Stable DE-RTC reason codes shared with the root model runner and WordPress
 * authority layer.
 */
export const DISTRIBUTED_EDITING_REASON_CODES = Object.freeze( {
	SYNC_META_RESTORED_FROM_REVISION_CONFLICT:
		'sync_meta_restored_from_revision_conflict',
	SYNC_META_UNAVAILABLE_AFTER_REVISION_SCAN:
		'sync_meta_unavailable_after_revision_scan',
	STALE_BASE_VERSION_REJECTED: 'stale_base_version_rejected',
	DE_RTC_SYNC_META_UNRECOVERABLE: 'de_rtc_sync_meta_unrecoverable',
	DE_RTC_SYNC_META_TAMPERED: 'de_rtc_sync_meta_tampered',
	DE_RTC_MALFORMED_SYNC_PAYLOAD: 'de_rtc_malformed_sync_payload',
	DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT:
		'de_rtc_unfiltered_html_would_change_content',
	DE_RTC_FEATURE_DISABLED: 'de_rtc_feature_disabled',
	REST_CANNOT_EDIT: 'rest_cannot_edit',
	REST_POST_INVALID_ID: 'rest_post_invalid_id',
} );

/**
 * Stable DE-RTC terminal dispositions shared with the root model runner.
 */
export const DISTRIBUTED_EDITING_DISPOSITIONS = Object.freeze( {
	IDLE: 'idle',
	ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK:
		'accepted_with_degraded_live_feedback',
	CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE:
		'conflict_requires_server_state_acceptance',
	REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META:
		'requires_manual_resolution_no_sync_meta',
	REJECTED_STALE_BASE_VERSION: 'rejected_stale_base_version',
	REJECTED_FEATURE_DISABLED: 'rejected_feature_disabled',
	REJECTED_PERMISSION_DENIED: 'rejected_permission_denied',
	REJECTED_ROUTE_MISMATCH: 'rejected_route_mismatch',
	REJECTED_SYNC_META_TAMPERED: 'rejected_sync_meta_tampered',
	REJECTED_MALFORMED_SYNC_PAYLOAD: 'rejected_malformed_sync_payload',
	REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED:
		'rejected_unfiltered_html_review_required',
} );

/**
 * Stable DE-RTC notice kinds. These are integration points for future UI and
 * notice dispatch code, not rendered notice copy.
 */
export const DISTRIBUTED_EDITING_NOTICE_KINDS = Object.freeze( {
	SERVER_STATE_ACCEPTANCE_REQUIRED: 'server-state-acceptance-required',
	STALE_BASE_REJECTED: 'stale-base-rejected',
	MANUAL_RESOLUTION_REQUIRED: 'manual-resolution-required',
	CONNECTION_DEGRADED: 'connection-degraded',
	REMOTE_CHANGES_RECEIVED: 'remote-changes-received',
	PENDING_CHANGES: 'pending-changes',
	RETRY_SAVE: 'retry-save',
} );

/**
 * Stable notice ids for the future `@wordpress/notices` integration.
 */
export const DISTRIBUTED_EDITING_NOTICE_IDS = Object.freeze( {
	SERVER_STATE_ACCEPTANCE_REQUIRED:
		'core/editor/distributed-editing/server-state-acceptance-required',
	STALE_BASE_REJECTED: 'core/editor/distributed-editing/stale-base-rejected',
	MANUAL_RESOLUTION_REQUIRED:
		'core/editor/distributed-editing/manual-resolution-required',
	CONNECTION_DEGRADED: 'core/editor/distributed-editing/connection-degraded',
	REMOTE_CHANGES_RECEIVED:
		'core/editor/distributed-editing/remote-changes-received',
	PENDING_CHANGES: 'core/editor/distributed-editing/pending-changes',
	RETRY_SAVE: 'core/editor/distributed-editing/retry-save',
} );

/**
 * Stable action keys that future UI can map to rendered buttons or menu items.
 */
export const DISTRIBUTED_EDITING_NOTICE_ACTIONS = Object.freeze( {
	ACCEPT_SERVER_STATE: 'accept-server-state',
	EXPORT_LOCAL_UPDATES: 'export-local-updates',
	PREPARE_RETRY_SUBMIT: 'prepare-retry-submit',
	PREPARE_RETRY_SUBMIT_SAVE: 'prepare-retry-submit-save',
	REFETCH_SERVER_STATE: 'refetch-server-state',
	REFRESH_RETRY_SUBMIT_PROOF: 'refresh-retry-submit-proof',
	REBASE_LOCAL_UPDATES: 'rebase-local-updates',
	REVIEW_REMOTE_CHANGES: 'review-remote-changes',
} );

const DISTRIBUTED_EDITING_SYNC_META_SCRIPT_SOURCE = `<script\\b(?=[^>]*\\btype\\s*=\\s*(['"])wp/post-sync-meta\\1)[^>]*>([\\s\\S]*?)<\\/script\\s*>`;

/**
 * Stable reasons for browser unload protection.
 */
export const DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS = Object.freeze( {
	PENDING_CHANGES: 'pending-changes',
	AWAITING_SERVER_CONFIRMATION: 'awaiting-server-confirmation',
} );

/**
 * Stable no-write planning statuses for stale-base local rebase preparation.
 */
export const DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES = Object.freeze( {
	NONE: 'none',
	READY: 'ready',
	NEEDS_SERVER_STATE: 'needs_server_state',
	NO_PENDING_CHANGES: 'no_pending_changes',
	MANUAL_CONFLICT_REQUIRED: 'manual_conflict_required',
} );

/**
 * Stable local rebase result statuses for stale-base handling.
 */
export const DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES = Object.freeze( {
	NONE: 'none',
	REBASED: 'rebased',
	BLOCKED_NEEDS_READY_PLAN: 'blocked_needs_ready_plan',
	MANUAL_CONFLICT_REQUIRED: 'manual_conflict_required',
	UNSAFE_CONTENT_BOUNDARY: 'unsafe_content_boundary',
} );

/**
 * Stable retry-submit handoff statuses for staged local rebase results.
 */
export const DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES = Object.freeze(
	{
		NONE: 'none',
		READY: 'ready',
		PREPARED: 'prepared',
		BLOCKED: 'blocked',
	}
);

/**
 * Stable retry-submit handoff blocker reasons.
 */
export const DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS = Object.freeze( {
	RETRY_SUBMIT_NOT_READY: 'retry_submit_not_ready',
	LOCAL_REBASE_NOT_REBASED: 'local_rebase_not_rebased',
	MANUAL_CONFLICT_REQUIRED: 'manual_conflict_required',
} );

/**
 * Stable retry-submit proof statuses for the proof-only REST response.
 */
export const DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES = Object.freeze( {
	NONE: 'none',
	ACCEPTED_FOR_FUTURE_SAVE: 'accepted_for_future_save',
	STALE_BASE_REJECTED: 'stale_base_rejected',
	REJECTED_FEATURE_DISABLED: 'rejected_feature_disabled',
	REJECTED_PERMISSION_DENIED: 'rejected_permission_denied',
	REJECTED_ROUTE_MISMATCH: 'rejected_route_mismatch',
} );

/**
 * Stable retry-submit save-preparation statuses.
 */
export const DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES = Object.freeze( {
	NONE: 'none',
	READY: 'ready',
	BLOCKED: 'blocked',
} );

/**
 * Stable retry-submit save-preparation blocker reasons.
 */
export const DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS = Object.freeze( {
	RETRY_SUBMIT_PROOF_NOT_ACCEPTED: 'retry_submit_proof_not_accepted',
	RETRY_SUBMIT_PROOF_CLAIMED_SAVE: 'retry_submit_proof_claimed_save',
	STALE_BASE_REJECTED: 'stale_base_rejected',
	FEATURE_DISABLED: 'feature_disabled',
	PERMISSION_DENIED: 'permission_denied',
	ROUTE_MISMATCH: 'route_mismatch',
} );

/**
 * Stable retry-save statuses for the guarded write boundary.
 */
export const DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES = Object.freeze( {
	NONE: 'none',
	SAVING: 'saving',
	SAVED: 'saved',
	STALE_BASE_REJECTED: 'stale_base_rejected',
	REJECTED_FEATURE_DISABLED: 'rejected_feature_disabled',
	REJECTED_PERMISSION_DENIED: 'rejected_permission_denied',
	REJECTED_ROUTE_MISMATCH: 'rejected_route_mismatch',
	REJECTED_SYNC_META_TAMPERED: 'rejected_sync_meta_tampered',
	REJECTED_MALFORMED_SYNC_PAYLOAD: 'rejected_malformed_sync_payload',
	REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED:
		'rejected_unfiltered_html_review_required',
} );

/**
 * Stable retry-save save-flow handoff statuses.
 */
export const DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES = Object.freeze( {
	NONE: 'none',
	RETRY_SAVE_SUBMITTED: 'retry_save_submitted',
	RETRY_SAVE_BLOCKED: 'retry_save_blocked',
	NORMAL_SAVE_FALLBACK: 'normal_save_fallback',
} );

/**
 * Stable retry-save policy statuses for deciding whether a future save
 * workflow may call the guarded retry-save write boundary.
 */
export const DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES = Object.freeze( {
	READY: 'ready',
	BLOCKED: 'blocked',
} );

/**
 * Stable retry-save policy blocker reasons.
 */
export const DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS = Object.freeze( {
	NO_PENDING_CHANGES: 'no_pending_changes',
	MISSING_POST_ROUTE: 'missing_post_route',
	MISSING_PROPOSED_CONTENT: 'missing_proposed_content',
	MISSING_VERSION_PROOF: 'missing_version_proof',
	RETRY_SUBMIT_PROOF_NOT_ACCEPTED: 'retry_submit_proof_not_accepted',
	RETRY_SUBMIT_SAVE_NOT_READY: 'retry_submit_save_not_ready',
	RETRY_SUBMIT_PROOF_CLAIMED_SAVE: 'retry_submit_proof_claimed_save',
	SERVER_STATE_ACCEPTANCE_REQUIRED: 'server_state_acceptance_required',
	SERVER_STATE_REFETCH_REQUIRED: 'server_state_refetch_required',
	MANUAL_CONFLICT_REQUIRED: 'manual_conflict_required',
	RETRY_SAVE_IN_PROGRESS: 'retry_save_in_progress',
	RETRY_SAVE_ALREADY_CONFIRMED: 'retry_save_already_confirmed',
	RETRY_SAVE_MISSING_SAVED_STATE_EVIDENCE:
		'retry_save_missing_saved_state_evidence',
} );

export const DISTRIBUTED_EDITING_LOCAL_UPDATES_EXPORT_FORMAT =
	'wp/de-rtc-local-updates';

const VALID_REASON_CODES = new Set(
	Object.values( DISTRIBUTED_EDITING_REASON_CODES )
);

const VALID_DISPOSITIONS = new Set(
	Object.values( DISTRIBUTED_EDITING_DISPOSITIONS )
);

const VALID_LOCAL_REBASE_PLAN_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES )
);

const VALID_LOCAL_REBASE_RESULT_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES )
);

const VALID_RETRY_SUBMIT_HANDOFF_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES )
);

const VALID_RETRY_SUBMIT_PROOF_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES )
);

const VALID_RETRY_SUBMIT_SAVE_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES )
);

const VALID_RETRY_SAVE_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES )
);

const VALID_RETRY_SAVE_HANDOFF_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES )
);

const NOTICE_ID_BY_KIND = Object.freeze( {
	[ DISTRIBUTED_EDITING_NOTICE_KINDS.SERVER_STATE_ACCEPTANCE_REQUIRED ]:
		DISTRIBUTED_EDITING_NOTICE_IDS.SERVER_STATE_ACCEPTANCE_REQUIRED,
	[ DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED ]:
		DISTRIBUTED_EDITING_NOTICE_IDS.STALE_BASE_REJECTED,
	[ DISTRIBUTED_EDITING_NOTICE_KINDS.MANUAL_RESOLUTION_REQUIRED ]:
		DISTRIBUTED_EDITING_NOTICE_IDS.MANUAL_RESOLUTION_REQUIRED,
	[ DISTRIBUTED_EDITING_NOTICE_KINDS.CONNECTION_DEGRADED ]:
		DISTRIBUTED_EDITING_NOTICE_IDS.CONNECTION_DEGRADED,
	[ DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED ]:
		DISTRIBUTED_EDITING_NOTICE_IDS.REMOTE_CHANGES_RECEIVED,
	[ DISTRIBUTED_EDITING_NOTICE_KINDS.PENDING_CHANGES ]:
		DISTRIBUTED_EDITING_NOTICE_IDS.PENDING_CHANGES,
	[ DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE ]:
		DISTRIBUTED_EDITING_NOTICE_IDS.RETRY_SAVE,
} );

export const DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE = Object.freeze( {
	clientBaseVersion: null,
	serverVersion: null,
	clientBaseContent: null,
	refetchedServerContent: null,
	disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
	reasonCode: null,
	pendingChangeCount: 0,
	hasPendingChanges: false,
	isAwaitingServerConfirmation: false,
	isConnectionDegraded: false,
	remoteChangeCount: 0,
	hasRemoteChanges: false,
	requiresServerStateAcceptance: false,
	requiresServerStateRefetch: false,
	refetchedServerState: false,
	canAttemptLocalRebase: false,
	localRebasePlanStatus: DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NONE,
	localRebaseResultStatus:
		DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.NONE,
	localRebaseResultReason: null,
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
	retrySubmitSaveStatus: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
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
	retrySaveRequiresReviewerEscalation: false,
	retrySaveReviewStatus: null,
	retrySaveReviewAction: null,
	retrySaveReviewRequiredCapability: null,
	retrySaveReviewerCapability: null,
	retrySaveReviewScope: null,
	retrySaveEscalationReason: null,
	retrySaveRawContentIncluded: false,
	requiresManualConflictResolution: false,
	mustOfferLocalCopy: false,
	canExportLocalUpdates: false,
} );

/**
 * Returns whether the provided value is a known DE-RTC reason code.
 *
 * @param {string} reasonCode Candidate reason code.
 *
 * @return {boolean} Whether the reason code is known.
 */
export function isValidDistributedEditingReasonCode( reasonCode ) {
	return VALID_REASON_CODES.has( reasonCode );
}

/**
 * Returns whether the provided value is a known DE-RTC terminal disposition.
 *
 * @param {string} disposition Candidate disposition.
 *
 * @return {boolean} Whether the disposition is known.
 */
export function isValidDistributedEditingDisposition( disposition ) {
	return VALID_DISPOSITIONS.has( disposition );
}

/**
 * Returns whether the disposition requires explicit human conflict handling.
 *
 * @param {string} disposition Candidate disposition.
 *
 * @return {boolean} Whether the disposition is a conflict disposition.
 */
export function isDistributedEditingConflictDisposition( disposition ) {
	return [
		DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
		DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
		DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
		DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
	].includes( disposition );
}

/**
 * Normalize user-provided or server-provided DE-RTC session state into the
 * small editor vocabulary consumed by future UI components.
 *
 * @param {Object} sessionState Partial DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function normalizeDistributedEditingSessionState( sessionState = {} ) {
	const disposition = isValidDistributedEditingDisposition(
		sessionState.disposition
	)
		? sessionState.disposition
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.disposition;
	const reasonCode = isValidDistributedEditingReasonCode(
		sessionState.reasonCode
	)
		? sessionState.reasonCode
		: null;
	const pendingChangeCount = normalizeCount(
		sessionState.pendingChangeCount
	);
	const hasExplicitPendingChangeCount =
		sessionState.pendingChangeCount !== undefined &&
		sessionState.pendingChangeCount !== null;
	const remoteChangeCount = normalizeCount( sessionState.remoteChangeCount );
	const isStaleBaseRejection =
		disposition ===
		DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION;
	const hasPendingChanges =
		Boolean( sessionState.hasPendingChanges ) ||
		pendingChangeCount > 0 ||
		( isStaleBaseRejection && ! hasExplicitPendingChangeCount );
	const isAwaitingServerConfirmation =
		Boolean( sessionState.isAwaitingServerConfirmation ) ||
		hasPendingChanges;
	const isConnectionDegraded =
		Boolean( sessionState.isConnectionDegraded ) ||
		disposition ===
			DISTRIBUTED_EDITING_DISPOSITIONS.ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK;
	const hasRemoteChanges =
		Boolean( sessionState.hasRemoteChanges ) || remoteChangeCount > 0;
	const requiresServerStateAcceptance =
		Boolean( sessionState.requiresServerStateAcceptance ) ||
		disposition ===
			DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE;
	const refetchedServerState = Boolean( sessionState.refetchedServerState );
	const requiresServerStateRefetch =
		( Boolean( sessionState.requiresServerStateRefetch ) ||
			isStaleBaseRejection ) &&
		! refetchedServerState;
	const requiresManualConflictResolution = Boolean(
		sessionState.requiresManualConflictResolution
	);
	const canAttemptLocalRebase =
		Boolean( sessionState.canAttemptLocalRebase ) &&
		! requiresManualConflictResolution;
	const localRebasePlanStatus = VALID_LOCAL_REBASE_PLAN_STATUSES.has(
		sessionState.localRebasePlanStatus
	)
		? sessionState.localRebasePlanStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.localRebasePlanStatus;
	const localRebaseResultStatus = VALID_LOCAL_REBASE_RESULT_STATUSES.has(
		sessionState.localRebaseResultStatus
	)
		? sessionState.localRebaseResultStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.localRebaseResultStatus;
	const localRebaseResultReason = normalizeNullableString(
		sessionState.localRebaseResultReason
	);
	const requestedRetrySubmitHandoffStatus =
		VALID_RETRY_SUBMIT_HANDOFF_STATUSES.has(
			sessionState.retrySubmitHandoffStatus
		)
			? sessionState.retrySubmitHandoffStatus
			: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.retrySubmitHandoffStatus;
	const retrySubmitPrepared =
		Boolean( sessionState.retrySubmitPrepared ) ||
		requestedRetrySubmitHandoffStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED;
	const readyToRetrySubmit =
		Boolean( sessionState.readyToRetrySubmit ) &&
		! requiresManualConflictResolution &&
		! retrySubmitPrepared;
	let retrySubmitHandoffStatus =
		DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE;

	if ( retrySubmitPrepared ) {
		retrySubmitHandoffStatus =
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED;
	} else if ( readyToRetrySubmit ) {
		retrySubmitHandoffStatus =
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.READY;
	} else if (
		requestedRetrySubmitHandoffStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.BLOCKED
	) {
		retrySubmitHandoffStatus =
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.BLOCKED;
	}
	const retrySubmitProofStatus = VALID_RETRY_SUBMIT_PROOF_STATUSES.has(
		sessionState.retrySubmitProofStatus
	)
		? sessionState.retrySubmitProofStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.retrySubmitProofStatus;
	const retrySubmitAccepted =
		Boolean( sessionState.retrySubmitAccepted ) ||
		retrySubmitProofStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE;
	const retrySubmitSavePathRequired =
		Boolean( sessionState.retrySubmitSavePathRequired ) ||
		retrySubmitAccepted;
	const retrySubmitSaveStatus = VALID_RETRY_SUBMIT_SAVE_STATUSES.has(
		sessionState.retrySubmitSaveStatus
	)
		? sessionState.retrySubmitSaveStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.retrySubmitSaveStatus;
	const retrySubmitSavePrepared =
		Boolean( sessionState.retrySubmitSavePrepared ) ||
		retrySubmitSaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY;
	const retrySubmitSaveReady =
		Boolean( sessionState.retrySubmitSaveReady ) || retrySubmitSavePrepared;
	const retrySaveStatus = VALID_RETRY_SAVE_STATUSES.has(
		sessionState.retrySaveStatus
	)
		? sessionState.retrySaveStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.retrySaveStatus;
	const retrySaveAccepted =
		Boolean( sessionState.retrySaveAccepted ) ||
		retrySaveStatus === DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED;
	const retrySaveHandoffStatus = VALID_RETRY_SAVE_HANDOFF_STATUSES.has(
		sessionState.retrySaveHandoffStatus
	)
		? sessionState.retrySaveHandoffStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.retrySaveHandoffStatus;
	const retrySaveHandoffAllowsNormalSaveFallback =
		retrySaveHandoffStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.NORMAL_SAVE_FALLBACK ||
		Boolean( sessionState.retrySaveHandoffAllowsNormalSaveFallback );
	const retrySaveHandoffBlocksNormalSave =
		retrySaveHandoffStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED &&
		! retrySaveHandoffAllowsNormalSaveFallback &&
		( Boolean( sessionState.retrySaveHandoffBlocksNormalSave ) ||
			hasPendingChanges );

	const mustOfferLocalCopy =
		Boolean( sessionState.mustOfferLocalCopy ) ||
		( requiresServerStateAcceptance && hasPendingChanges ) ||
		( requiresServerStateRefetch && hasPendingChanges ) ||
		( retrySubmitSavePathRequired && hasPendingChanges ) ||
		( retrySaveStatus === DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING &&
			hasPendingChanges ) ||
		( retrySaveHandoffBlocksNormalSave && hasPendingChanges ) ||
		( requiresManualConflictResolution && hasPendingChanges );
	const canExportLocalUpdates =
		Boolean( sessionState.canExportLocalUpdates ) || mustOfferLocalCopy;

	return {
		clientBaseVersion: normalizeNullableString(
			sessionState.clientBaseVersion
		),
		serverVersion: normalizeNullableString( sessionState.serverVersion ),
		clientBaseContent: normalizeNullableContentString(
			sessionState.clientBaseContent
		),
		refetchedServerContent: normalizeNullableContentString(
			sessionState.refetchedServerContent
		),
		disposition,
		reasonCode,
		pendingChangeCount,
		hasPendingChanges,
		isAwaitingServerConfirmation,
		isConnectionDegraded,
		remoteChangeCount,
		hasRemoteChanges,
		requiresServerStateAcceptance,
		requiresServerStateRefetch,
		refetchedServerState,
		canAttemptLocalRebase,
		localRebasePlanStatus,
		localRebaseResultStatus,
		localRebaseResultReason,
		readyToRetrySubmit,
		retrySubmitHandoffStatus,
		retrySubmitHandoffReason: normalizeNullableString(
			sessionState.retrySubmitHandoffReason
		),
		retrySubmitPrepared,
		retrySubmitProofStatus,
		retrySubmitProofReason: normalizeNullableString(
			sessionState.retrySubmitProofReason
		),
		retrySubmitAccepted,
		retrySubmitSavePathRequired,
		retrySubmitSavesPost: Boolean( sessionState.retrySubmitSavesPost ),
		retrySubmitMutatesPostContent: Boolean(
			sessionState.retrySubmitMutatesPostContent
		),
		retrySubmitCreatesRevision: Boolean(
			sessionState.retrySubmitCreatesRevision
		),
		retrySubmitClaimsSaved: Boolean( sessionState.retrySubmitClaimsSaved ),
		retrySubmitSaveStatus,
		retrySubmitSaveReason: normalizeNullableString(
			sessionState.retrySubmitSaveReason
		),
		retrySubmitSavePrepared,
		retrySubmitSaveReady,
		retrySaveStatus,
		retrySaveReason: normalizeNullableString(
			sessionState.retrySaveReason
		),
		retrySaveHandoffStatus,
		retrySaveHandoffReason: normalizeNullableString(
			sessionState.retrySaveHandoffReason
		),
		retrySaveHandoffAllowsNormalSaveFallback,
		retrySaveHandoffBlocksNormalSave,
		retrySaveAccepted,
		retrySaveServerVersion: normalizeNullableString(
			sessionState.retrySaveServerVersion
		),
		retrySavePreviousServerVersion: normalizeNullableString(
			sessionState.retrySavePreviousServerVersion
		),
		retrySaveSavesPost: Boolean( sessionState.retrySaveSavesPost ),
		retrySaveMutatesPostContent: Boolean(
			sessionState.retrySaveMutatesPostContent
		),
		retrySaveCreatesRevision: Boolean(
			sessionState.retrySaveCreatesRevision
		),
		retrySaveClaimsSaved: Boolean( sessionState.retrySaveClaimsSaved ),
		retrySaveRevisionCreated: Boolean(
			sessionState.retrySaveRevisionCreated
		),
		retrySaveCreatedRevisionIds: normalizeIdList(
			sessionState.retrySaveCreatedRevisionIds
		),
		retrySaveRequiresReviewerEscalation: Boolean(
			sessionState.retrySaveRequiresReviewerEscalation
		),
		retrySaveReviewStatus: normalizeNullableString(
			sessionState.retrySaveReviewStatus
		),
		retrySaveReviewAction: normalizeNullableString(
			sessionState.retrySaveReviewAction
		),
		retrySaveReviewRequiredCapability: normalizeNullableString(
			sessionState.retrySaveReviewRequiredCapability
		),
		retrySaveReviewerCapability: normalizeNullableString(
			sessionState.retrySaveReviewerCapability
		),
		retrySaveReviewScope: normalizeNullableString(
			sessionState.retrySaveReviewScope
		),
		retrySaveEscalationReason: normalizeNullableString(
			sessionState.retrySaveEscalationReason
		),
		retrySaveRawContentIncluded: Boolean(
			sessionState.retrySaveRawContentIncluded
		),
		requiresManualConflictResolution,
		mustOfferLocalCopy,
		canExportLocalUpdates,
	};
}

/**
 * Returns the stable JSON payload for exporting protected local DE-RTC edits.
 *
 * This is pure data contract construction. It does not write to the browser
 * clipboard, save, dispatch notices, persist editor state, or change post
 * locks.
 *
 * @param {Object} args                   Export payload inputs.
 * @param {Object} args.currentPost       Current edited post.
 * @param {string} args.editedPostContent Current serialized local editor content.
 * @param {Object} args.sessionState      Current DE-RTC session state.
 *
 * @return {Object} Exportable local-updates payload.
 */
export function getDistributedEditingLocalUpdatesExportPayload( {
	currentPost = {},
	editedPostContent = '',
	sessionState = {},
} = {} ) {
	return {
		version: 1,
		format: DISTRIBUTED_EDITING_LOCAL_UPDATES_EXPORT_FORMAT,
		post: {
			id: currentPost?.id ?? null,
			type: currentPost?.type ?? null,
		},
		postContent:
			typeof editedPostContent === 'string' ? editedPostContent : '',
		distributedEditingSessionState:
			normalizeDistributedEditingSessionState( sessionState ),
	};
}

/**
 * Returns inert DE-RTC editor state for a recovery dry-run response or error.
 *
 * This maps REST proof-boundary results into the existing editor-state
 * vocabulary without dispatching notices, saving, applying recovery updates, or
 * changing post locks.
 *
 * @param {Object} responseOrError REST response or API error.
 *
 * @return {Object} DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRecoveryDryRunResult(
	responseOrError = {}
) {
	const responseData = getDistributedEditingResponseData( responseOrError );
	const reasonCode = normalizeNullableString(
		responseOrError.code ||
			responseOrError.reasonCode ||
			responseOrError.reason_code ||
			responseData.reasonCode ||
			responseData.reason_code
	);

	switch ( reasonCode ) {
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED:
			return normalizeDistributedEditingSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_FEATURE_DISABLED,
				reasonCode,
			} );

		case DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT:
			return normalizeDistributedEditingSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode,
			} );

		case DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID:
			return normalizeDistributedEditingSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_ROUTE_MISMATCH,
				reasonCode,
			} );
	}

	if ( responseOrError.result === 'manual_resolution_required' ) {
		return normalizeDistributedEditingSessionState( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
			reasonCode:
				reasonCode ||
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_UNAVAILABLE_AFTER_REVISION_SCAN,
			canExportLocalUpdates: true,
		} );
	}

	return DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE;
}

/**
 * Returns DE-RTC editor state for a stale-base rejection response.
 *
 * The state keeps local changes pending and copyable, but does not attempt a
 * refetch, rebase, retry, save, apply, or conflict resolution by itself.
 *
 * @param {Object} responseOrError REST response or API error.
 *
 * @return {Object} DE-RTC session state.
 */
export function getDistributedEditingSessionStateForStaleBaseRejectionResult(
	responseOrError = {}
) {
	const responseData = getDistributedEditingResponseData( responseOrError );
	const reasonCode =
		normalizeNullableString(
			responseOrError.code ||
				responseOrError.reasonCode ||
				responseOrError.reason_code ||
				responseData.reasonCode ||
				responseData.reason_code
		) || DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED;

	return normalizeDistributedEditingSessionState( {
		clientBaseVersion:
			responseOrError.clientBaseVersion ||
			responseOrError.client_base_version ||
			responseData.clientBaseVersion ||
			responseData.client_base_version,
		serverVersion:
			responseOrError.serverVersion ||
			responseOrError.server_version ||
			responseData.serverVersion ||
			responseData.server_version,
		clientBaseContent:
			responseOrError.clientBaseContent ??
			responseOrError.client_base_content ??
			responseData.clientBaseContent ??
			responseData.client_base_content,
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode,
		pendingChangeCount:
			responseOrError.pendingChangeCount ??
			responseOrError.pending_change_count ??
			responseData.pendingChangeCount ??
			responseData.pending_change_count ??
			1,
		remoteChangeCount:
			responseOrError.remoteChangeCount ??
			responseOrError.remote_change_count ??
			responseData.remoteChangeCount ??
			responseData.remote_change_count ??
			1,
		requiresServerStateRefetch: true,
		canAttemptLocalRebase:
			responseOrError.canAttemptLocalRebase ??
			responseOrError.can_attempt_local_rebase ??
			responseData.canAttemptLocalRebase ??
			responseData.can_attempt_local_rebase ??
			false,
		requiresManualConflictResolution:
			responseOrError.requiresManualConflictResolution ||
			responseOrError.requires_manual_conflict_resolution ||
			responseData.requiresManualConflictResolution ||
			responseData.requires_manual_conflict_resolution,
		canExportLocalUpdates: true,
	} );
}

/**
 * Returns DE-RTC editor state after refetching server state for stale-base.
 *
 * This preserves local pending-change state and marks the session ready for a
 * future local rebase decision. It does not apply server content, clear local
 * edits, retry a submit, save, or change post locks.
 *
 * @param {Object} responseOrError     REST response or API error.
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} DE-RTC session state.
 */
export function getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const serverVersion =
		getDistributedEditingServerVersionFromResponse( responseOrError ) ||
		normalizeNullableString( currentSessionState.serverVersion );
	const refetchedServerContent =
		getDistributedEditingPostContentFromResponse( responseOrError ) ??
		normalizeNullableContentString(
			currentSessionState.refetchedServerContent
		);
	const pendingChangeCount = normalizeCount(
		currentSessionState.pendingChangeCount
	);
	const remoteChangeCount = normalizeCount(
		currentSessionState.remoteChangeCount
	);
	const requiresManualConflictResolution = Boolean(
		currentSessionState.requiresManualConflictResolution
	);

	return normalizeDistributedEditingSessionState( {
		...currentSessionState,
		serverVersion,
		refetchedServerContent,
		disposition:
			currentSessionState.disposition ||
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			currentSessionState.reasonCode ||
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount,
		remoteChangeCount,
		refetchedServerState: true,
		requiresServerStateRefetch: false,
		canAttemptLocalRebase:
			pendingChangeCount > 0 && ! requiresManualConflictResolution,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NONE,
		localRebaseResultStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.NONE,
		readyToRetrySubmit: false,
		canExportLocalUpdates:
			Boolean( currentSessionState.canExportLocalUpdates ) ||
			pendingChangeCount > 0,
	} );
}

/**
 * Returns DE-RTC editor state for no-write stale-base local rebase planning.
 *
 * This records whether the editor has enough information to attempt a future
 * local rebase. It does not perform a rebase, apply fetched server content,
 * prepare a retry submit, save, persist editor state, or change post locks.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} DE-RTC session state.
 */
export function getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
	currentSessionState = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );
	const pendingChangeCount = normalizeCount( normalized.pendingChangeCount );
	const sharedPlanState = {
		...normalized,
		pendingChangeCount,
		readyToRetrySubmit: false,
	};

	if ( normalized.requiresManualConflictResolution ) {
		return normalizeDistributedEditingSessionState( {
			...sharedPlanState,
			canAttemptLocalRebase: false,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.MANUAL_CONFLICT_REQUIRED,
			localRebaseResultStatus: normalized.localRebaseResultStatus,
			canExportLocalUpdates:
				normalized.canExportLocalUpdates || pendingChangeCount > 0,
		} );
	}

	if (
		normalized.requiresServerStateRefetch ||
		! normalized.refetchedServerState
	) {
		return normalizeDistributedEditingSessionState( {
			...sharedPlanState,
			canAttemptLocalRebase: false,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NEEDS_SERVER_STATE,
			localRebaseResultStatus: normalized.localRebaseResultStatus,
		} );
	}

	if ( pendingChangeCount < 1 ) {
		return normalizeDistributedEditingSessionState( {
			...sharedPlanState,
			canAttemptLocalRebase: false,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NO_PENDING_CHANGES,
			localRebaseResultStatus: normalized.localRebaseResultStatus,
			canExportLocalUpdates: normalized.canExportLocalUpdates,
		} );
	}

	return normalizeDistributedEditingSessionState( {
		...sharedPlanState,
		canAttemptLocalRebase: true,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
		localRebaseResultStatus: normalized.localRebaseResultStatus,
		canExportLocalUpdates: true,
	} );
}

/**
 * Returns a serialized post-content candidate from a local stale-base rebase.
 *
 * This is a conservative three-way merge over whole serialized block tokens. It
 * only merges when each input is composed of complete top-level Gutenberg block
 * comment-delimited tokens and non-overlapping block positions changed. It does
 * not save, retry a submit, call the server, or change post locks.
 *
 * @param {Object} args                     Local rebase inputs.
 * @param {Object} args.currentSessionState Current DE-RTC session state.
 * @param {string} args.clientBaseContent   Serialized content at the client base version.
 * @param {string} args.serverContent       Serialized content from the refetched server version.
 * @param {string} args.localContent        Current serialized local editor content.
 *
 * @return {Object} Local rebase result.
 */
export function getDistributedEditingStaleBaseLocalRebaseResult( {
	currentSessionState = {},
	clientBaseContent,
	serverContent,
	localContent,
} = {} ) {
	const plannedState =
		getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
			currentSessionState
		);

	if (
		plannedState.localRebasePlanStatus !==
		DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY
	) {
		return createLocalRebaseResult( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.BLOCKED_NEEDS_READY_PLAN,
			sessionState: normalizeDistributedEditingSessionState( {
				...plannedState,
				canAttemptLocalRebase: false,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.BLOCKED_NEEDS_READY_PLAN,
				localRebaseResultReason: plannedState.localRebasePlanStatus,
				readyToRetrySubmit: false,
			} ),
			reason: plannedState.localRebasePlanStatus,
		} );
	}

	const mergeResult = getSerializedBlockLocalRebaseCandidate( {
		clientBaseContent: clientBaseContent ?? plannedState.clientBaseContent,
		serverContent: serverContent ?? plannedState.refetchedServerContent,
		localContent,
	} );

	if ( mergeResult.status !== 'rebased' ) {
		const resultStatus =
			mergeResult.status === 'unsafe_content_boundary'
				? DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.UNSAFE_CONTENT_BOUNDARY
				: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED;

		return createLocalRebaseResult( {
			status: resultStatus,
			sessionState: normalizeDistributedEditingSessionState( {
				...plannedState,
				canAttemptLocalRebase: false,
				localRebaseResultStatus: resultStatus,
				localRebaseResultReason: mergeResult.reason,
				readyToRetrySubmit: false,
				requiresManualConflictResolution: true,
				canExportLocalUpdates: true,
			} ),
			reason: mergeResult.reason,
		} );
	}

	return createLocalRebaseResult( {
		status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
		sessionState: normalizeDistributedEditingSessionState( {
			...plannedState,
			canAttemptLocalRebase: false,
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			localRebaseResultReason: null,
			readyToRetrySubmit: true,
			requiresManualConflictResolution: false,
			canExportLocalUpdates: true,
		} ),
		candidatePostContent: mergeResult.candidatePostContent,
		mergedBlockCount: mergeResult.mergedBlockCount,
	} );
}

/**
 * Returns stable notice descriptors for the current DE-RTC session state.
 * Descriptors intentionally avoid rendered copy and side effects; future UI can
 * translate the descriptor kind and action keys into notices, toasts, or
 * status indicators.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Array} Notice descriptors.
 */
export function getDistributedEditingNoticeDescriptorsForSessionState(
	sessionState
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const descriptors = [];
	const hasRetrySaveHandoffBlock =
		normalized.retrySaveHandoffStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED;

	if ( normalized.requiresServerStateAcceptance ) {
		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.SERVER_STATE_ACCEPTANCE_REQUIRED,
				status: 'warning',
				priority: 'blocking',
				actionKeys: [
					...( normalized.canExportLocalUpdates
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						  ]
						: [] ),
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.ACCEPT_SERVER_STATE,
				],
			} )
		);
	} else if (
		normalized.disposition ===
		DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION
	) {
		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
				status: 'warning',
				priority: 'blocking',
				actionKeys: [
					...( normalized.canExportLocalUpdates
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						  ]
						: [] ),
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
					...( normalized.canAttemptLocalRebase &&
					hasDistributedEditingLocalRebaseInputs( normalized )
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES,
						  ]
						: [] ),
					...( normalized.readyToRetrySubmit &&
					! normalized.retrySubmitPrepared
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT,
						  ]
						: [] ),
					...( normalized.retrySubmitPrepared &&
					normalized.retrySubmitProofStatus !==
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF,
						  ]
						: [] ),
				],
				extra: getDistributedEditingLocalRebaseDescriptorFields(
					normalized
				),
			} )
		);
	} else if (
		normalized.disposition ===
		DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META
	) {
		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.MANUAL_RESOLUTION_REQUIRED,
				status: 'error',
				priority: 'blocking',
				actionKeys: normalized.canExportLocalUpdates
					? [
							DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
					  ]
					: [],
			} )
		);
	}

	if ( normalized.isConnectionDegraded ) {
		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.CONNECTION_DEGRADED,
				status: 'warning',
				priority: 'status',
			} )
		);
	}

	if (
		normalized.retrySaveStatus !==
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE ||
		hasRetrySaveHandoffBlock
	) {
		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
				status: getDistributedEditingRetrySaveNoticeStatus(
					normalized.retrySaveStatus
				),
				priority:
					normalized.retrySaveStatus ===
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED
						? 'status'
						: 'blocking',
				actionKeys: [
					...( normalized.canExportLocalUpdates
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						  ]
						: [] ),
					...( normalized.retrySaveStatus ===
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED ||
					normalized.retrySaveStatus ===
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED ||
					normalized.retrySaveHandoffReason ===
						DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
						  ]
						: [] ),
				],
				extra: getDistributedEditingRetrySaveDescriptorFields(
					normalized
				),
			} )
		);
	}

	if (
		normalized.isAwaitingServerConfirmation &&
		! normalized.requiresServerStateAcceptance &&
		normalized.disposition !==
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION
	) {
		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.PENDING_CHANGES,
				status: 'info',
				priority: 'status',
				actionKeys: [
					...( canPrepareDistributedEditingRetrySubmitSaveFromStatusChrome(
						normalized
					)
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE,
						  ]
						: [] ),
				],
				extra: getDistributedEditingRetrySubmitProofDescriptorFields(
					normalized
				),
			} )
		);
	}

	if ( normalized.hasRemoteChanges ) {
		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED,
				status: 'info',
				priority: 'snackbar',
				type: 'snackbar',
				isDismissible: true,
				actionKeys: [
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES,
				],
			} )
		);
	}

	return descriptors;
}

/**
 * Returns whether the current retry-save state contains server evidence that
 * the guarded write persisted the post and may be treated as saved.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {boolean} Whether retry-save saved-state evidence exists.
 */
export function hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return (
		normalized.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED &&
		normalized.retrySaveAccepted &&
		normalized.retrySaveServerVersion !== null &&
		normalized.retrySaveSavesPost &&
		normalized.retrySaveMutatesPostContent &&
		normalized.retrySaveClaimsSaved
	);
}

/**
 * Returns a side-effect-free progress summary for the board-demo retry-save
 * path without exposing raw post content.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Retry-save flow state.
 */
export function getDistributedEditingRetrySaveFlowStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const hasProtectedLocalChanges =
		normalized.hasPendingChanges &&
		( normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates ||
			normalized.isAwaitingServerConfirmation );
	const hasServerRefetchEvidence =
		normalized.refetchedServerState &&
		normalized.serverVersion !== null &&
		normalized.refetchedServerContent !== null &&
		! normalized.requiresServerStateRefetch;
	const hasLocalRebaseEvidence =
		normalized.localRebaseResultStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED &&
		! normalized.requiresManualConflictResolution;
	const hasRetrySubmitHandoff =
		normalized.retrySubmitPrepared ||
		normalized.retrySubmitHandoffStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED;
	const hasAcceptedRetrySubmitProof =
		normalized.retrySubmitProofStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE &&
		normalized.retrySubmitAccepted &&
		normalized.retrySubmitSavePathRequired &&
		! normalized.retrySubmitSavesPost &&
		! normalized.retrySubmitMutatesPostContent &&
		! normalized.retrySubmitCreatesRevision &&
		! normalized.retrySubmitClaimsSaved;
	const hasRetrySavePreparation =
		normalized.retrySubmitSaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY &&
		normalized.retrySubmitSaveReady;
	const hasRetrySaveSavedStateEvidence =
		hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
			normalized
		);

	return {
		hasProtectedLocalChanges,
		hasServerRefetchEvidence,
		hasLocalRebaseEvidence,
		hasRetrySubmitHandoff,
		hasAcceptedRetrySubmitProof,
		hasRetrySavePreparation,
		hasRetrySaveSavedStateEvidence,
		canClaimSaved: hasRetrySaveSavedStateEvidence,
		claimsSaved: hasRetrySaveSavedStateEvidence,
		requiresServerStateRefetch: normalized.requiresServerStateRefetch,
		requiresManualConflictResolution:
			normalized.requiresManualConflictResolution,
		canExportLocalUpdates: normalized.canExportLocalUpdates,
		retrySaveStatus: normalized.retrySaveStatus,
		retrySaveReason: normalized.retrySaveReason,
		retrySaveServerVersion: normalized.retrySaveServerVersion,
		retrySavePreviousServerVersion:
			normalized.retrySavePreviousServerVersion,
		retrySaveRevisionCreated: normalized.retrySaveRevisionCreated,
		retrySaveCreatedRevisionIds: normalized.retrySaveCreatedRevisionIds,
	};
}

function canPrepareDistributedEditingRetrySubmitSaveFromStatusChrome(
	normalized
) {
	return (
		normalized.retrySubmitProofStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE &&
		normalized.retrySubmitAccepted &&
		normalized.retrySubmitSavePathRequired &&
		! normalized.retrySubmitSavePrepared &&
		! normalized.retrySubmitSavesPost &&
		! normalized.retrySubmitMutatesPostContent &&
		! normalized.retrySubmitCreatesRevision &&
		! normalized.retrySubmitClaimsSaved
	);
}

/**
 * Returns inert editor state for a retry-save save-flow handoff result.
 *
 * Blocked handoffs with protected local changes must become visible to the
 * status surface because savePost will not fall back to normal save.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 * @param {Object} handoff             Retry-save handoff result.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRetrySaveHandoff(
	currentSessionState = {},
	handoff = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );
	const status = VALID_RETRY_SAVE_HANDOFF_STATUSES.has( handoff.status )
		? handoff.status
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.retrySaveHandoffStatus;
	const reason = normalizeNullableString( handoff.reason );
	const policy = handoff.policy ?? {};

	if (
		status ===
		DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED
	) {
		const pendingChangeCount =
			normalizeCount( handoff.pendingChangeCount ) ||
			normalizeCount( policy.request?.pendingChangeCount ) ||
			normalized.pendingChangeCount ||
			( policy.protectsLocalChanges || normalized.hasPendingChanges
				? 1
				: 0 );

		return normalizeDistributedEditingSessionState( {
			...normalized,
			pendingChangeCount,
			hasPendingChanges:
				normalized.hasPendingChanges ||
				Boolean( policy.protectsLocalChanges ) ||
				pendingChangeCount > 0,
			isAwaitingServerConfirmation: true,
			requiresServerStateRefetch:
				normalized.requiresServerStateRefetch ||
				Boolean( policy.requiresServerStateRefetch ) ||
				reason ===
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
			retrySaveHandoffStatus: status,
			retrySaveHandoffReason: reason,
			retrySaveHandoffAllowsNormalSaveFallback: false,
			retrySaveHandoffBlocksNormalSave: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	}

	if (
		status ===
		DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.NORMAL_SAVE_FALLBACK
	) {
		return normalizeDistributedEditingSessionState( {
			...normalized,
			retrySaveHandoffStatus: status,
			retrySaveHandoffReason: reason,
			retrySaveHandoffAllowsNormalSaveFallback: true,
			retrySaveHandoffBlocksNormalSave: false,
		} );
	}

	if (
		status ===
		DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_SUBMITTED
	) {
		return normalizeDistributedEditingSessionState( {
			...normalized,
			retrySaveHandoffStatus: status,
			retrySaveHandoffReason: null,
			retrySaveHandoffAllowsNormalSaveFallback: false,
			retrySaveHandoffBlocksNormalSave: false,
		} );
	}

	return normalized;
}

/**
 * Consumes a successful local rebase retry handoff without submitting it.
 *
 * This prepares inert state for a future save-path retry consumer. It does not
 * call the server, save, dispatch notices, persist editor state, or change post
 * locks.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRetrySubmitHandoff(
	currentSessionState = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );

	if ( normalized.retrySubmitPrepared ) {
		return normalized;
	}

	if ( normalized.requiresManualConflictResolution ) {
		return normalizeDistributedEditingSessionState( {
			...normalized,
			readyToRetrySubmit: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.BLOCKED,
			retrySubmitHandoffReason:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS.MANUAL_CONFLICT_REQUIRED,
		} );
	}

	if (
		normalized.localRebaseResultStatus !==
		DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED
	) {
		return normalizeDistributedEditingSessionState( {
			...normalized,
			readyToRetrySubmit: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.BLOCKED,
			retrySubmitHandoffReason:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS.LOCAL_REBASE_NOT_REBASED,
		} );
	}

	if ( ! normalized.readyToRetrySubmit ) {
		return normalizeDistributedEditingSessionState( {
			...normalized,
			readyToRetrySubmit: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.BLOCKED,
			retrySubmitHandoffReason:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS.RETRY_SUBMIT_NOT_READY,
		} );
	}

	return normalizeDistributedEditingSessionState( {
		...normalized,
		readyToRetrySubmit: false,
		retrySubmitHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
		retrySubmitHandoffReason: null,
		retrySubmitPrepared: true,
	} );
}

/**
 * Returns inert DE-RTC editor state for a retry-submit proof response.
 *
 * The response only proves whether a locally rebased candidate is still based
 * on the current server sync version. Accepted proof keeps local changes
 * pending until a later save-path consumer persists them.
 *
 * @param {Object} responseOrError     REST response or API error.
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRetrySubmitProofResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const normalizedCurrent =
		normalizeDistributedEditingSessionState( currentSessionState );
	const responseData = getDistributedEditingResponseData( responseOrError );
	const result = normalizeNullableString(
		responseOrError.result || responseData.result
	);
	const pendingChangeCount =
		responseOrError.pendingChangeCount ??
		responseOrError.pending_change_count ??
		responseData.pendingChangeCount ??
		responseData.pending_change_count ??
		normalizedCurrent.pendingChangeCount;
	const remoteChangeCount =
		responseOrError.remoteChangeCount ??
		responseOrError.remote_change_count ??
		responseData.remoteChangeCount ??
		responseData.remote_change_count ??
		normalizedCurrent.remoteChangeCount;
	const commonNoWriteFlags = {
		retrySubmitSavesPost: Boolean(
			responseOrError.savesPost ||
				responseOrError.saves_post ||
				responseData.savesPost ||
				responseData.saves_post
		),
		retrySubmitMutatesPostContent: Boolean(
			responseOrError.mutatesPostContent ||
				responseOrError.mutates_post_content ||
				responseData.mutatesPostContent ||
				responseData.mutates_post_content
		),
		retrySubmitCreatesRevision: Boolean(
			responseOrError.createsRevision ||
				responseOrError.creates_revision ||
				responseData.createsRevision ||
				responseData.creates_revision
		),
		retrySubmitClaimsSaved: Boolean(
			responseOrError.claimsSaved ||
				responseOrError.claims_saved ||
				responseData.claimsSaved ||
				responseData.claims_saved
		),
	};

	if (
		result === 'retry_submit_accepted_for_future_save' ||
		responseOrError.retrySubmitAccepted === true ||
		responseOrError.retry_submit_accepted === true ||
		responseData.retrySubmitAccepted === true ||
		responseData.retry_submit_accepted === true
	) {
		return normalizeDistributedEditingSessionState( {
			...normalizedCurrent,
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			pendingChangeCount,
			remoteChangeCount: 0,
			hasRemoteChanges: false,
			requiresServerStateAcceptance: false,
			requiresServerStateRefetch: false,
			canAttemptLocalRebase: false,
			readyToRetrySubmit: false,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitProofReason: null,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			...commonNoWriteFlags,
		} );
	}

	const reasonCode = normalizeNullableString(
		responseOrError.code ||
			responseOrError.reasonCode ||
			responseOrError.reason_code ||
			responseData.reasonCode ||
			responseData.reason_code
	);

	switch ( reasonCode ) {
		case DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED: {
			const staleState =
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					...responseOrError,
					clientBaseVersion:
						responseOrError.clientBaseVersion ??
						responseOrError.client_base_version ??
						responseData.clientBaseVersion ??
						responseData.client_base_version ??
						normalizedCurrent.clientBaseVersion,
					serverVersion:
						responseOrError.serverVersion ??
						responseOrError.server_version ??
						responseData.serverVersion ??
						responseData.server_version ??
						normalizedCurrent.serverVersion,
					clientBaseContent:
						responseOrError.clientBaseContent ??
						responseOrError.client_base_content ??
						responseData.clientBaseContent ??
						responseData.client_base_content ??
						normalizedCurrent.clientBaseContent,
					pendingChangeCount,
					remoteChangeCount,
					canAttemptLocalRebase: false,
				} );

			return normalizeDistributedEditingSessionState( {
				...staleState,
				refetchedServerState: false,
				requiresServerStateRefetch: true,
				canAttemptLocalRebase: false,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NONE,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.NONE,
				localRebaseResultReason: null,
				readyToRetrySubmit: false,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
				retrySubmitHandoffReason: null,
				retrySubmitPrepared: false,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED,
				retrySubmitProofReason: reasonCode,
				retrySubmitAccepted: false,
				retrySubmitSavePathRequired: false,
				canExportLocalUpdates: true,
				...commonNoWriteFlags,
			} );
		}

		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED:
			return normalizeDistributedEditingSessionState( {
				...normalizedCurrent,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_FEATURE_DISABLED,
				reasonCode,
				pendingChangeCount,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_FEATURE_DISABLED,
				retrySubmitProofReason: reasonCode,
				retrySubmitAccepted: false,
				retrySubmitSavePathRequired: false,
				canExportLocalUpdates:
					normalizedCurrent.canExportLocalUpdates ||
					normalizeCount( pendingChangeCount ) > 0,
				...commonNoWriteFlags,
			} );

		case DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT:
			return normalizeDistributedEditingSessionState( {
				...normalizedCurrent,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode,
				pendingChangeCount,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_PERMISSION_DENIED,
				retrySubmitProofReason: reasonCode,
				retrySubmitAccepted: false,
				retrySubmitSavePathRequired: false,
				canExportLocalUpdates:
					normalizedCurrent.canExportLocalUpdates ||
					normalizeCount( pendingChangeCount ) > 0,
				...commonNoWriteFlags,
			} );

		case DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID:
			return normalizeDistributedEditingSessionState( {
				...normalizedCurrent,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_ROUTE_MISMATCH,
				reasonCode,
				pendingChangeCount,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_ROUTE_MISMATCH,
				retrySubmitProofReason: reasonCode,
				retrySubmitAccepted: false,
				retrySubmitSavePathRequired: false,
				canExportLocalUpdates:
					normalizedCurrent.canExportLocalUpdates ||
					normalizeCount( pendingChangeCount ) > 0,
				...commonNoWriteFlags,
			} );
	}

	return normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		pendingChangeCount,
		retrySubmitProofStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
		retrySubmitProofReason: reasonCode,
		retrySubmitAccepted: false,
		retrySubmitSavePathRequired: false,
		...commonNoWriteFlags,
	} );
}

/**
 * Prepares inert editor state for a future retry-submit save path.
 *
 * Accepted proof is only a precondition. This helper does not submit to the
 * server, save, mutate persisted post content, create revisions, claim saved
 * state, dispatch notices, persist editor state, or change post locks.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRetrySubmitSavePreparation(
	currentSessionState = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );

	if (
		normalized.retrySubmitSavesPost ||
		normalized.retrySubmitMutatesPostContent ||
		normalized.retrySubmitCreatesRevision ||
		normalized.retrySubmitClaimsSaved
	) {
		return getBlockedRetrySubmitSavePreparationState(
			normalized,
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.RETRY_SUBMIT_PROOF_CLAIMED_SAVE
		);
	}

	if (
		normalized.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED
	) {
		return getBlockedRetrySubmitSavePreparationState(
			normalized,
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.STALE_BASE_REJECTED
		);
	}

	if (
		normalized.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_FEATURE_DISABLED
	) {
		return getBlockedRetrySubmitSavePreparationState(
			normalized,
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.FEATURE_DISABLED
		);
	}

	if (
		normalized.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_PERMISSION_DENIED
	) {
		return getBlockedRetrySubmitSavePreparationState(
			normalized,
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.PERMISSION_DENIED
		);
	}

	if (
		normalized.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_ROUTE_MISMATCH
	) {
		return getBlockedRetrySubmitSavePreparationState(
			normalized,
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.ROUTE_MISMATCH
		);
	}

	if (
		normalized.retrySubmitProofStatus !==
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE ||
		! normalized.retrySubmitAccepted ||
		! normalized.retrySubmitSavePathRequired
	) {
		return getBlockedRetrySubmitSavePreparationState(
			normalized,
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED
		);
	}

	return normalizeDistributedEditingSessionState( {
		...normalized,
		retrySubmitSaveStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
		retrySubmitSaveReason: null,
		retrySubmitSavePrepared: true,
		retrySubmitSaveReady: true,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
}

/**
 * Returns inert editor state while the guarded retry-save request is in flight.
 *
 * The state keeps pending local changes copyable while the server determines
 * whether the accepted retry-submit proof may be persisted.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 * @param {Object} [options]           Request-state options.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRetrySaveRequest(
	currentSessionState = {},
	options = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );
	const pendingChangeCount =
		normalizeCount( options.pendingChangeCount ) ||
		normalized.pendingChangeCount ||
		1;

	return normalizeDistributedEditingSessionState( {
		...normalized,
		pendingChangeCount,
		hasPendingChanges: true,
		isAwaitingServerConfirmation: true,
		retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
		retrySaveReason: null,
		retrySaveAccepted: false,
		retrySaveServerVersion: null,
		retrySavePreviousServerVersion: normalized.serverVersion,
		retrySaveSavesPost: false,
		retrySaveMutatesPostContent: false,
		retrySaveCreatesRevision: false,
		retrySaveClaimsSaved: false,
		retrySaveRevisionCreated: false,
		retrySaveCreatedRevisionIds: [],
		retrySaveRequiresReviewerEscalation: false,
		retrySaveReviewStatus: null,
		retrySaveReviewAction: null,
		retrySaveReviewRequiredCapability: null,
		retrySaveReviewerCapability: null,
		retrySaveReviewScope: null,
		retrySaveEscalationReason: null,
		retrySaveRawContentIncluded: false,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
}

/**
 * Returns DE-RTC editor state for the guarded retry-save response.
 *
 * Success is the first DE-RTC editor state allowed to clear pending local
 * changes because the WordPress authority endpoint claims persistence. All
 * rejection paths keep local changes pending and exportable.
 *
 * @param {Object} responseOrError     REST response or API error.
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRetrySaveResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const normalizedCurrent =
		normalizeDistributedEditingSessionState( currentSessionState );
	const responseData = getDistributedEditingResponseData( responseOrError );
	const result = normalizeNullableString(
		responseOrError.result || responseData.result
	);
	const pendingChangeCount =
		responseOrError.pendingChangeCount ??
		responseOrError.pending_change_count ??
		responseData.pendingChangeCount ??
		responseData.pending_change_count ??
		normalizedCurrent.pendingChangeCount;
	const serverVersion =
		normalizeNullableString(
			responseOrError.serverVersion ||
				responseOrError.server_version ||
				responseData.serverVersion ||
				responseData.server_version
		) || normalizedCurrent.serverVersion;
	const previousServerVersion =
		normalizeNullableString(
			responseOrError.previousServerVersion ||
				responseOrError.previous_server_version ||
				responseData.previousServerVersion ||
				responseData.previous_server_version
		) || normalizedCurrent.serverVersion;
	const retrySaveFlags = {
		retrySaveSavesPost: Boolean(
			responseOrError.savesPost ||
				responseOrError.saves_post ||
				responseData.savesPost ||
				responseData.saves_post
		),
		retrySaveMutatesPostContent: Boolean(
			responseOrError.mutatesPostContent ||
				responseOrError.mutates_post_content ||
				responseData.mutatesPostContent ||
				responseData.mutates_post_content
		),
		retrySaveCreatesRevision: Boolean(
			responseOrError.createsRevision ||
				responseOrError.creates_revision ||
				responseData.createsRevision ||
				responseData.creates_revision
		),
		retrySaveClaimsSaved: Boolean(
			responseOrError.claimsSaved ||
				responseOrError.claims_saved ||
				responseData.claimsSaved ||
				responseData.claims_saved
		),
		retrySaveRevisionCreated: Boolean(
			responseOrError.revisionCreated ||
				responseOrError.revision_created ||
				responseData.revisionCreated ||
				responseData.revision_created
		),
		retrySaveCreatedRevisionIds:
			responseOrError.createdRevisionIds ||
			responseOrError.created_revision_ids ||
			responseData.createdRevisionIds ||
			responseData.created_revision_ids ||
			[],
	};
	const hasSavedStateEvidence = hasRetrySaveResponseSavedStateEvidence( {
		serverVersion,
		retrySaveFlags,
	} );
	const rejectedPendingChangeCount =
		normalizeCount( pendingChangeCount ) ||
		normalizedCurrent.pendingChangeCount ||
		( normalizedCurrent.hasPendingChanges ? 1 : 0 );

	if (
		result === 'retry_save_applied' &&
		( responseOrError.retrySaveAccepted === true ||
			responseOrError.retry_save_accepted === true ||
			responseData.retrySaveAccepted === true ||
			responseData.retry_save_accepted === true ) &&
		hasSavedStateEvidence
	) {
		return normalizeDistributedEditingSessionState( {
			...normalizedCurrent,
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			serverVersion,
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
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveReason: null,
			retrySaveAccepted: true,
			retrySaveServerVersion: serverVersion,
			retrySavePreviousServerVersion: previousServerVersion,
			...retrySaveFlags,
			retrySaveRequiresReviewerEscalation: false,
			retrySaveReviewStatus: null,
			retrySaveReviewAction: null,
			retrySaveReviewRequiredCapability: null,
			retrySaveReviewerCapability: null,
			retrySaveReviewScope: null,
			retrySaveEscalationReason: null,
			retrySaveRawContentIncluded: false,
			requiresManualConflictResolution: false,
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
		} );
	}

	const reasonCode =
		result === 'retry_save_applied'
			? DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD
			: normalizeNullableString(
					responseOrError.code ||
						responseOrError.reasonCode ||
						responseOrError.reason_code ||
						responseData.reasonCode ||
						responseData.reason_code
			  );
	const retrySaveReviewFields = getRetrySaveReviewFieldsFromResponse(
		responseOrError,
		responseData
	);

	return getDistributedEditingRejectedRetrySaveState( {
		normalizedCurrent,
		reasonCode,
		result:
			result === 'retry_save_applied'
				? DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_MISSING_SAVED_STATE_EVIDENCE
				: result,
		pendingChangeCount: rejectedPendingChangeCount,
		serverVersion,
		previousServerVersion,
		retrySaveFlags,
		retrySaveReviewFields,
	} );
}

/**
 * Returns a no-side-effect policy decision for whether a future editor save
 * workflow may call the guarded retry-save endpoint.
 *
 * The policy is intentionally stricter than the low-level retry-save action:
 * the future save workflow must have accepted proof, a prepared save handoff,
 * a concrete post route, proposed content, and version proof before it may
 * leave the normal save path.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 * @param {Object} [context]           Current editor and route context.
 *
 * @return {Object} Retry-save policy decision.
 */
export function getDistributedEditingRetrySavePolicyForSessionState(
	currentSessionState = {},
	context = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );
	const pendingChangeCount =
		normalizeCount( context.pendingChangeCount ) ||
		normalized.pendingChangeCount;
	const hasPendingChanges =
		normalized.hasPendingChanges || pendingChangeCount > 0;
	const postId = context.postId ?? null;
	const restBase = normalizeNullableString( context.restBase );
	const proposedPostContent = context.proposedPostContent;
	const hasProposedPostContent = typeof proposedPostContent === 'string';
	const clientBaseVersion =
		normalizeNullableString( context.clientBaseVersion ) ||
		normalized.serverVersion ||
		normalized.clientBaseVersion;
	const acceptedProofServerVersion =
		normalizeNullableString( context.acceptedProofServerVersion ) ||
		normalized.serverVersion;
	const rebasedFromVersion =
		normalizeNullableString( context.rebasedFromVersion ) ||
		normalized.clientBaseVersion;
	const hasAcceptedProof =
		normalized.retrySubmitProofStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE &&
		normalized.retrySubmitAccepted &&
		normalized.retrySubmitSavePathRequired;
	const hasPreparedSavePath =
		normalized.retrySubmitSaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY &&
		normalized.retrySubmitSaveReady;
	const proofClaimedSave =
		normalized.retrySubmitSavesPost ||
		normalized.retrySubmitMutatesPostContent ||
		normalized.retrySubmitCreatesRevision ||
		normalized.retrySubmitClaimsSaved;
	const hasRetrySaveSavedStateEvidence =
		hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
			normalized
		);
	let reason = null;

	if (
		normalized.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
	) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS;
	} else if (
		normalized.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED &&
		hasRetrySaveSavedStateEvidence
	) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_ALREADY_CONFIRMED;
	} else if (
		normalized.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED
	) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_MISSING_SAVED_STATE_EVIDENCE;
	} else if ( ! hasPendingChanges ) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.NO_PENDING_CHANGES;
	} else if ( normalized.requiresManualConflictResolution ) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MANUAL_CONFLICT_REQUIRED;
	} else if ( normalized.requiresServerStateAcceptance ) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_ACCEPTANCE_REQUIRED;
	} else if ( normalized.requiresServerStateRefetch ) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED;
	} else if ( proofClaimedSave ) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_CLAIMED_SAVE;
	} else if ( ! hasAcceptedProof ) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED;
	} else if ( ! hasPreparedSavePath ) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_SAVE_NOT_READY;
	} else if ( ! postId || ! restBase ) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_POST_ROUTE;
	} else if ( ! hasProposedPostContent ) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_PROPOSED_CONTENT;
	} else if (
		! clientBaseVersion ||
		! acceptedProofServerVersion ||
		! rebasedFromVersion
	) {
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_VERSION_PROOF;
	}

	const canRetrySave = reason === null;

	return {
		status: canRetrySave
			? DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.READY
			: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.BLOCKED,
		reason,
		canRetrySave,
		shouldCallRetrySaveEndpoint: canRetrySave,
		shouldCallNormalSavePost: false,
		changesPostLock: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		claimsSaved: hasRetrySaveSavedStateEvidence,
		protectsLocalChanges: hasPendingChanges,
		canExportLocalUpdates:
			normalized.canExportLocalUpdates || hasPendingChanges,
		requiresServerStateRefetch:
			normalized.requiresServerStateRefetch ||
			reason ===
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
		hasAcceptedProof,
		hasPreparedSavePath,
		hasRetrySaveSavedStateEvidence,
		hasPostRoute: Boolean( postId && restBase ),
		hasProposedPostContent,
		hasVersionProof: Boolean(
			clientBaseVersion &&
				acceptedProofServerVersion &&
				rebasedFromVersion
		),
		request: canRetrySave
			? {
					postId,
					restBase,
					clientBaseVersion,
					acceptedProofServerVersion,
					rebasedFromVersion,
					pendingChangeCount,
			  }
			: null,
	};
}

function hasRetrySaveResponseSavedStateEvidence( {
	serverVersion,
	retrySaveFlags,
} ) {
	return Boolean(
		serverVersion &&
			retrySaveFlags.retrySaveSavesPost &&
			retrySaveFlags.retrySaveMutatesPostContent &&
			retrySaveFlags.retrySaveClaimsSaved
	);
}

/**
 * Returns the browser-unload integration state for DE-RTC.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Unload-warning state.
 */
export function getDistributedEditingUnloadWarningStateForSessionState(
	sessionState
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const shouldWarn =
		shouldWarnBeforeLeavingDistributedEditingSessionState( normalized );
	let reason = null;

	if ( shouldWarn ) {
		reason = normalized.hasPendingChanges
			? DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS.PENDING_CHANGES
			: DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS.AWAITING_SERVER_CONFIRMATION;
	}

	return {
		shouldWarn,
		reason,
		reasonCode: normalized.reasonCode,
		disposition: normalized.disposition,
		pendingChangeCount: normalized.pendingChangeCount,
		isAwaitingServerConfirmation: normalized.isAwaitingServerConfirmation,
		canExportLocalUpdates: normalized.canExportLocalUpdates,
		mustOfferLocalCopy: normalized.mustOfferLocalCopy,
	};
}

/**
 * Returns whether the browser should protect the session from unload.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {boolean} Whether the session has unconfirmed local edits.
 */
export function shouldWarnBeforeLeavingDistributedEditingSessionState(
	sessionState
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	return (
		normalized.hasPendingChanges || normalized.isAwaitingServerConfirmation
	);
}

function createNoticeDescriptor(
	normalized,
	{
		kind,
		status,
		priority,
		type = 'default',
		isDismissible = false,
		actionKeys = [],
		extra = {},
	}
) {
	const id = NOTICE_ID_BY_KIND[ kind ];

	return {
		id,
		kind,
		status,
		priority,
		reasonCode: normalized.reasonCode,
		disposition: normalized.disposition,
		pendingChangeCount: normalized.pendingChangeCount,
		remoteChangeCount: normalized.remoteChangeCount,
		actionKeys,
		...extra,
		noticeOptions: {
			id,
			type,
			isDismissible,
		},
	};
}

function getDistributedEditingLocalRebaseDescriptorFields( normalized ) {
	const hasClientBaseContent = normalized.clientBaseContent !== null;
	const hasRefetchedServerContent =
		normalized.refetchedServerContent !== null;

	return {
		canAttemptLocalRebase: normalized.canAttemptLocalRebase,
		localRebasePlanStatus: normalized.localRebasePlanStatus,
		localRebaseResultStatus: normalized.localRebaseResultStatus,
		localRebaseResultReason: normalized.localRebaseResultReason,
		readyToRetrySubmit: normalized.readyToRetrySubmit,
		retrySubmitHandoffStatus: normalized.retrySubmitHandoffStatus,
		retrySubmitHandoffReason: normalized.retrySubmitHandoffReason,
		retrySubmitPrepared: normalized.retrySubmitPrepared,
		...getDistributedEditingRetrySubmitProofDescriptorFields( normalized ),
		hasClientBaseContent,
		hasRefetchedServerContent,
		hasLocalRebaseInputs: hasClientBaseContent && hasRefetchedServerContent,
	};
}

function getDistributedEditingRetrySubmitProofDescriptorFields( normalized ) {
	return {
		retrySubmitProofStatus: normalized.retrySubmitProofStatus,
		retrySubmitProofReason: normalized.retrySubmitProofReason,
		retrySubmitAccepted: normalized.retrySubmitAccepted,
		retrySubmitSavePathRequired: normalized.retrySubmitSavePathRequired,
		retrySubmitSavesPost: normalized.retrySubmitSavesPost,
		retrySubmitMutatesPostContent: normalized.retrySubmitMutatesPostContent,
		retrySubmitCreatesRevision: normalized.retrySubmitCreatesRevision,
		retrySubmitClaimsSaved: normalized.retrySubmitClaimsSaved,
		retrySubmitSaveStatus: normalized.retrySubmitSaveStatus,
		retrySubmitSaveReason: normalized.retrySubmitSaveReason,
		retrySubmitSavePrepared: normalized.retrySubmitSavePrepared,
		retrySubmitSaveReady: normalized.retrySubmitSaveReady,
		...getDistributedEditingRetrySaveDescriptorFields( normalized ),
	};
}

function getDistributedEditingRetrySaveNoticeStatus( retrySaveStatus ) {
	switch ( retrySaveStatus ) {
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED:
			return 'success';
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED:
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD:
			return 'error';
	}

	return 'warning';
}

function getDistributedEditingRetrySaveDescriptorFields( normalized ) {
	return {
		retrySaveStatus: normalized.retrySaveStatus,
		retrySaveReason: normalized.retrySaveReason,
		retrySaveHandoffStatus: normalized.retrySaveHandoffStatus,
		retrySaveHandoffReason: normalized.retrySaveHandoffReason,
		retrySaveHandoffAllowsNormalSaveFallback:
			normalized.retrySaveHandoffAllowsNormalSaveFallback,
		retrySaveHandoffBlocksNormalSave:
			normalized.retrySaveHandoffBlocksNormalSave,
		retrySaveAccepted: normalized.retrySaveAccepted,
		retrySaveServerVersion: normalized.retrySaveServerVersion,
		retrySavePreviousServerVersion:
			normalized.retrySavePreviousServerVersion,
		retrySaveSavesPost: normalized.retrySaveSavesPost,
		retrySaveMutatesPostContent: normalized.retrySaveMutatesPostContent,
		retrySaveCreatesRevision: normalized.retrySaveCreatesRevision,
		retrySaveClaimsSaved: normalized.retrySaveClaimsSaved,
		retrySaveRevisionCreated: normalized.retrySaveRevisionCreated,
		retrySaveCreatedRevisionIds: normalized.retrySaveCreatedRevisionIds,
		retrySaveRequiresReviewerEscalation:
			normalized.retrySaveRequiresReviewerEscalation,
		retrySaveReviewStatus: normalized.retrySaveReviewStatus,
		retrySaveReviewAction: normalized.retrySaveReviewAction,
		retrySaveReviewRequiredCapability:
			normalized.retrySaveReviewRequiredCapability,
		retrySaveReviewerCapability: normalized.retrySaveReviewerCapability,
		retrySaveReviewScope: normalized.retrySaveReviewScope,
		retrySaveEscalationReason: normalized.retrySaveEscalationReason,
		retrySaveRawContentIncluded: normalized.retrySaveRawContentIncluded,
	};
}

function getBlockedRetrySubmitSavePreparationState( normalized, reason ) {
	return normalizeDistributedEditingSessionState( {
		...normalized,
		retrySubmitSaveStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
		retrySubmitSaveReason: reason,
		retrySubmitSavePrepared: false,
		retrySubmitSaveReady: false,
		canExportLocalUpdates:
			normalized.canExportLocalUpdates || normalized.hasPendingChanges,
	} );
}

function getDistributedEditingRejectedRetrySaveState( {
	normalizedCurrent,
	reasonCode,
	result,
	pendingChangeCount,
	serverVersion,
	previousServerVersion,
	retrySaveFlags,
	retrySaveReviewFields = {},
} ) {
	let disposition = normalizedCurrent.disposition;
	let retrySaveStatus = DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE;
	let requiresServerStateRefetch = false;
	let requiresManualConflictResolution =
		normalizedCurrent.requiresManualConflictResolution;

	switch ( reasonCode ) {
		case DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION;
			retrySaveStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED;
			requiresServerStateRefetch = true;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_FEATURE_DISABLED;
			retrySaveStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED;
			retrySaveStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_ROUTE_MISMATCH;
			retrySaveStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_ROUTE_MISMATCH;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED;
			retrySaveStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD;
			retrySaveStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED;
			retrySaveStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED;
			requiresServerStateRefetch = true;
			requiresManualConflictResolution = true;
			break;
	}

	if ( result === 'stale_base_rejected' ) {
		disposition =
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION;
		retrySaveStatus =
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED;
		requiresServerStateRefetch = true;
	}

	return normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		disposition,
		reasonCode,
		serverVersion,
		pendingChangeCount,
		hasPendingChanges: normalizeCount( pendingChangeCount ) > 0,
		isAwaitingServerConfirmation: normalizeCount( pendingChangeCount ) > 0,
		requiresServerStateRefetch,
		refetchedServerState: false,
		canAttemptLocalRebase: false,
		readyToRetrySubmit: false,
		retrySubmitProofStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
		retrySubmitAccepted: false,
		retrySubmitSavePathRequired: false,
		retrySubmitSaveStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
		retrySubmitSaveReason:
			reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED
				? DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.STALE_BASE_REJECTED
				: normalizedCurrent.retrySubmitSaveReason,
		retrySubmitSavePrepared: false,
		retrySubmitSaveReady: false,
		retrySaveStatus,
		retrySaveReason: reasonCode || result,
		retrySaveAccepted: false,
		retrySaveServerVersion: serverVersion,
		retrySavePreviousServerVersion: previousServerVersion,
		...retrySaveFlags,
		...retrySaveReviewFields,
		requiresManualConflictResolution,
		mustOfferLocalCopy: normalizeCount( pendingChangeCount ) > 0,
		canExportLocalUpdates:
			normalizedCurrent.canExportLocalUpdates ||
			normalizeCount( pendingChangeCount ) > 0,
	} );
}

function getRetrySaveReviewFieldsFromResponse( responseOrError, responseData ) {
	const reviewContract =
		responseOrError.reviewContract ||
		responseOrError.review_contract ||
		responseData.reviewContract ||
		responseData.review_contract ||
		{};

	return {
		retrySaveRequiresReviewerEscalation: Boolean(
			responseOrError.requiresReviewerEscalation ||
				responseOrError.requires_reviewer_escalation ||
				responseData.requiresReviewerEscalation ||
				responseData.requires_reviewer_escalation ||
				reviewContract.escalationRequired ||
				reviewContract.escalation_required
		),
		retrySaveReviewStatus: normalizeNullableString(
			responseOrError.reviewStatus ||
				responseOrError.review_status ||
				responseData.reviewStatus ||
				responseData.review_status ||
				reviewContract.status
		),
		retrySaveReviewAction: normalizeNullableString(
			responseOrError.reviewAction ||
				responseOrError.review_action ||
				responseData.reviewAction ||
				responseData.review_action
		),
		retrySaveReviewRequiredCapability: normalizeNullableString(
			responseOrError.reviewRequiredCapability ||
				responseOrError.review_required_capability ||
				responseData.reviewRequiredCapability ||
				responseData.review_required_capability
		),
		retrySaveReviewerCapability: normalizeNullableString(
			responseOrError.reviewerCapability ||
				responseOrError.reviewer_capability ||
				responseData.reviewerCapability ||
				responseData.reviewer_capability ||
				reviewContract.reviewerCapability ||
				reviewContract.reviewer_capability
		),
		retrySaveReviewScope: normalizeNullableString(
			responseOrError.reviewScope ||
				responseOrError.review_scope ||
				responseData.reviewScope ||
				responseData.review_scope
		),
		retrySaveEscalationReason: normalizeNullableString(
			responseOrError.escalationReason ||
				responseOrError.escalation_reason ||
				responseData.escalationReason ||
				responseData.escalation_reason ||
				reviewContract.escalationReason ||
				reviewContract.escalation_reason
		),
		retrySaveRawContentIncluded: Boolean(
			responseOrError.rawContentIncluded ||
				responseOrError.raw_content_included ||
				responseData.rawContentIncluded ||
				responseData.raw_content_included ||
				reviewContract.rawContentIncluded ||
				reviewContract.raw_content_included
		),
	};
}

function hasDistributedEditingLocalRebaseInputs( normalized ) {
	return (
		normalized.clientBaseContent !== null &&
		normalized.refetchedServerContent !== null
	);
}

function normalizeCount( value ) {
	const count = Number( value );
	return Number.isInteger( count ) && count > 0 ? count : 0;
}

function normalizeNullableString( value ) {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeNullableContentString( value ) {
	return typeof value === 'string' ? value : null;
}

function normalizeIdList( value ) {
	if ( ! Array.isArray( value ) ) {
		return [];
	}

	return value
		.map( ( item ) => Number( item ) )
		.filter( ( item ) => Number.isInteger( item ) && item > 0 );
}

function getDistributedEditingResponseData( responseOrError ) {
	return responseOrError?.data &&
		typeof responseOrError.data === 'object' &&
		! Array.isArray( responseOrError.data )
		? responseOrError.data
		: {};
}

function getDistributedEditingServerVersionFromResponse( responseOrError ) {
	const responseData = getDistributedEditingResponseData( responseOrError );
	const distributedEditingData =
		responseOrError?.distributed_editing ||
		responseOrError?.distributedEditing ||
		responseData.distributed_editing ||
		responseData.distributedEditing ||
		{};
	const rawPostContent =
		getDistributedEditingRawPostContentFromResponse( responseOrError );
	const postContentSyncMeta =
		getDistributedEditingSyncMetaFromPostContent( rawPostContent );

	return normalizeNullableString(
		responseOrError.serverVersion ||
			responseOrError.server_version ||
			responseData.serverVersion ||
			responseData.server_version ||
			distributedEditingData.serverVersion ||
			distributedEditingData.server_version ||
			postContentSyncMeta?.version ||
			responseOrError.modified_gmt ||
			responseOrError.modified ||
			responseData.modified_gmt ||
			responseData.modified
	);
}

function getDistributedEditingPostContentFromResponse( responseOrError ) {
	const rawPostContent =
		getDistributedEditingRawPostContentFromResponse( responseOrError );

	return stripDistributedEditingSyncMetaFromPostContent( rawPostContent );
}

function getDistributedEditingRawPostContentFromResponse( responseOrError ) {
	const responseData = getDistributedEditingResponseData( responseOrError );

	return normalizeNullableContentString(
		responseOrError?.content?.raw ??
			responseOrError?.content_raw ??
			responseOrError?.raw_content ??
			responseData?.content?.raw ??
			responseData?.content_raw ??
			responseData?.raw_content ??
			( typeof responseOrError?.content === 'string'
				? responseOrError.content
				: undefined ) ??
			( typeof responseData?.content === 'string'
				? responseData.content
				: undefined )
	);
}

function stripDistributedEditingSyncMetaFromPostContent( postContent ) {
	const parsed =
		parseDistributedEditingSyncMetaFromPostContent( postContent );

	return parsed?.postContent ?? normalizeNullableContentString( postContent );
}

function getDistributedEditingSyncMetaFromPostContent( postContent ) {
	return parseDistributedEditingSyncMetaFromPostContent( postContent )
		?.syncMeta;
}

function parseDistributedEditingSyncMetaFromPostContent( postContent ) {
	const content = normalizeNullableContentString( postContent );

	if ( content === null ) {
		return null;
	}

	const prefixPattern = new RegExp(
		`^\\s*${ DISTRIBUTED_EDITING_SYNC_META_SCRIPT_SOURCE }\\s*`,
		'i'
	);
	const prefixMatch = content.match( prefixPattern );

	if ( prefixMatch ) {
		return createDistributedEditingSyncMetaParseResult( {
			postContent: content.slice( prefixMatch[ 0 ].length ),
			scriptContent: prefixMatch[ 2 ],
		} );
	}

	const trailerPattern = new RegExp(
		`\\s*${ DISTRIBUTED_EDITING_SYNC_META_SCRIPT_SOURCE }\\s*$`,
		'i'
	);
	const trailerMatch = content.match( trailerPattern );

	if ( trailerMatch ) {
		return createDistributedEditingSyncMetaParseResult( {
			postContent: content.slice(
				0,
				content.length - trailerMatch[ 0 ].length
			),
			scriptContent: trailerMatch[ 2 ],
		} );
	}

	return {
		postContent: content,
		syncMeta: null,
	};
}

function createDistributedEditingSyncMetaParseResult( {
	postContent,
	scriptContent,
} ) {
	try {
		const syncMeta = JSON.parse( scriptContent );

		return {
			postContent,
			syncMeta:
				syncMeta &&
				typeof syncMeta === 'object' &&
				! Array.isArray( syncMeta )
					? syncMeta
					: null,
		};
	} catch {
		return {
			postContent,
			syncMeta: null,
		};
	}
}

function createLocalRebaseResult( {
	status,
	sessionState,
	reason = null,
	candidatePostContent = null,
	mergedBlockCount = 0,
} ) {
	return {
		status,
		reason,
		sessionState,
		candidatePostContent,
		hasCandidatePostContent: candidatePostContent !== null,
		mergedBlockCount,
		readyToRetrySubmit: sessionState.readyToRetrySubmit,
		requiresManualConflictResolution:
			sessionState.requiresManualConflictResolution,
	};
}

function getSerializedBlockLocalRebaseCandidate( {
	clientBaseContent,
	serverContent,
	localContent,
} ) {
	const baseBlocks = getSerializedBlockTokens( clientBaseContent );
	const serverBlocks = getSerializedBlockTokens( serverContent );
	const localBlocks = getSerializedBlockTokens( localContent );

	for ( const blockSet of [ baseBlocks, serverBlocks, localBlocks ] ) {
		if ( blockSet.status !== 'safe' ) {
			return {
				status: 'unsafe_content_boundary',
				reason: blockSet.reason,
			};
		}
	}

	if ( serverBlocks.content === localBlocks.content ) {
		return {
			status: 'rebased',
			candidatePostContent: serverBlocks.content,
			mergedBlockCount: serverBlocks.blocks.length,
		};
	}

	if ( serverBlocks.content === baseBlocks.content ) {
		return {
			status: 'rebased',
			candidatePostContent: localBlocks.content,
			mergedBlockCount: localBlocks.blocks.length,
		};
	}

	if ( localBlocks.content === baseBlocks.content ) {
		return {
			status: 'rebased',
			candidatePostContent: serverBlocks.content,
			mergedBlockCount: serverBlocks.blocks.length,
		};
	}

	if (
		baseBlocks.blocks.length !== serverBlocks.blocks.length ||
		baseBlocks.blocks.length !== localBlocks.blocks.length
	) {
		return {
			status: 'manual_conflict_required',
			reason: getSerializedBlockStructureConflictReason(
				baseBlocks.blocks,
				serverBlocks.blocks,
				localBlocks.blocks
			),
		};
	}

	if (
		isPureSerializedBlockReorder(
			baseBlocks.blocks,
			serverBlocks.blocks
		) ||
		isPureSerializedBlockReorder( baseBlocks.blocks, localBlocks.blocks )
	) {
		return {
			status: 'manual_conflict_required',
			reason: 'block_reordered',
		};
	}

	const mergedBlocks = [];

	for ( let index = 0; index < baseBlocks.blocks.length; index++ ) {
		const baseBlock = baseBlocks.blocks[ index ];
		const serverBlock = serverBlocks.blocks[ index ];
		const localBlock = localBlocks.blocks[ index ];
		const serverChanged = serverBlock !== baseBlock;
		const localChanged = localBlock !== baseBlock;

		if ( serverChanged && localChanged && serverBlock !== localBlock ) {
			return {
				status: 'manual_conflict_required',
				reason: 'same_block_changed',
			};
		}

		if ( localChanged ) {
			mergedBlocks.push( localBlock );
		} else {
			mergedBlocks.push( serverBlock );
		}
	}

	return {
		status: 'rebased',
		candidatePostContent: mergedBlocks.join( '' ),
		mergedBlockCount: mergedBlocks.length,
	};
}

function getSerializedBlockStructureConflictReason(
	baseBlocks,
	serverBlocks,
	localBlocks
) {
	if (
		isPureSerializedBlockReorder( baseBlocks, serverBlocks ) ||
		isPureSerializedBlockReorder( baseBlocks, localBlocks )
	) {
		return 'block_reordered';
	}

	const serverDelta = serverBlocks.length - baseBlocks.length;
	const localDelta = localBlocks.length - baseBlocks.length;
	const changedDeltas = [ serverDelta, localDelta ].filter(
		( delta ) => delta !== 0
	);

	if (
		changedDeltas.length > 0 &&
		changedDeltas.every( ( delta ) => delta > 0 )
	) {
		return 'block_inserted';
	}

	if (
		changedDeltas.length > 0 &&
		changedDeltas.every( ( delta ) => delta < 0 )
	) {
		return 'block_deleted';
	}

	return 'block_count_changed';
}

function isPureSerializedBlockReorder( baseBlocks, candidateBlocks ) {
	if (
		baseBlocks.length <= 1 ||
		baseBlocks.length !== candidateBlocks.length ||
		baseBlocks.every(
			( block, index ) => block === candidateBlocks[ index ]
		)
	) {
		return false;
	}

	return haveSameSerializedBlockMultiset( baseBlocks, candidateBlocks );
}

function haveSameSerializedBlockMultiset( firstBlocks, secondBlocks ) {
	const counts = new Map();

	for ( const block of firstBlocks ) {
		counts.set( block, ( counts.get( block ) ?? 0 ) + 1 );
	}

	for ( const block of secondBlocks ) {
		const count = counts.get( block );

		if ( ! count ) {
			return false;
		}

		if ( count === 1 ) {
			counts.delete( block );
		} else {
			counts.set( block, count - 1 );
		}
	}

	return counts.size === 0;
}

function getSerializedBlockTokens( content ) {
	if ( typeof content !== 'string' ) {
		return {
			status: 'unsafe',
			reason: 'content_not_string',
		};
	}

	const unsafeBlockCommentReason = getUnsafeBlockCommentReason( content );

	if ( unsafeBlockCommentReason ) {
		return {
			status: 'unsafe',
			reason: unsafeBlockCommentReason,
		};
	}

	const blocks = [];
	let offset = 0;

	while ( offset < content.length ) {
		const openingCommentStart = content.indexOf( '<!-- wp:', offset );

		if ( openingCommentStart === -1 ) {
			return {
				status: 'unsafe',
				reason: 'freeform_html',
			};
		}

		if ( openingCommentStart !== offset ) {
			return {
				status: 'unsafe',
				reason: 'content_outside_serialized_blocks',
			};
		}

		const openingCommentEnd = content.indexOf( '-->', openingCommentStart );

		if ( openingCommentEnd === -1 ) {
			return {
				status: 'unsafe',
				reason: 'block_comment_unclosed',
			};
		}

		const openingComment = content.slice(
			openingCommentStart,
			openingCommentEnd + 3
		);
		const openingCommentData =
			getSerializedBlockOpeningCommentData( openingComment );

		if ( ! openingCommentData ) {
			return {
				status: 'unsafe',
				reason: 'block_comment_invalid',
			};
		}

		if ( openingCommentData.selfClosing ) {
			blocks.push( openingComment );
			offset = openingCommentEnd + 3;
			continue;
		}

		const closingComment = `<!-- /wp:${ openingCommentData.blockName } -->`;
		const closingCommentStart = content.indexOf(
			closingComment,
			openingCommentEnd + 3
		);

		if ( closingCommentStart === -1 ) {
			return {
				status: 'unsafe',
				reason: 'block_closing_comment_missing',
			};
		}

		const closingCommentEnd = closingCommentStart + closingComment.length;
		blocks.push( content.slice( openingCommentStart, closingCommentEnd ) );
		offset = closingCommentEnd;
	}

	if ( blocks.length === 0 && content.length > 0 ) {
		return {
			status: 'unsafe',
			reason: 'content_without_serialized_blocks',
		};
	}

	return {
		status: 'safe',
		content,
		blocks,
	};
}

function getUnsafeBlockCommentReason( content ) {
	const blockCommentPattern = /<!--\s+wp:([^\s]+)([\s\S]*?)-->/g;
	let match;

	while ( ( match = blockCommentPattern.exec( content ) ) ) {
		const rawAttributes = match[ 2 ].trim().replace( /\s\/$/, '' ).trim();

		if ( rawAttributes.length === 0 ) {
			continue;
		}

		if ( ! rawAttributes.startsWith( '{' ) ) {
			return 'block_comment_attributes_not_json';
		}

		try {
			JSON.parse( rawAttributes );
		} catch {
			return 'block_comment_json_invalid';
		}
	}

	return null;
}

function getSerializedBlockOpeningCommentData( openingComment ) {
	const match = openingComment.match( /^<!--\s+wp:([^\s]+)([\s\S]*?)-->$/ );

	if ( ! match ) {
		return null;
	}

	return {
		blockName: match[ 1 ],
		selfClosing: match[ 2 ].trim().endsWith( '/' ),
	};
}
