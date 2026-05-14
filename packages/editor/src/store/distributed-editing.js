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
	DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML:
		'de_rtc_review_approval_requires_unfiltered_html',
	DE_RTC_REVIEW_APPROVAL_HASH_MISMATCH:
		'de_rtc_review_approval_hash_mismatch',
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
	LOCAL_UPDATES_IMPORT_BLOCKED: 'local-updates-import-blocked',
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
	LOCAL_UPDATES_IMPORT_BLOCKED:
		'core/editor/distributed-editing/local-updates-import-blocked',
} );

/**
 * Stable action keys that future UI can map to rendered buttons or menu items.
 */
export const DISTRIBUTED_EDITING_NOTICE_ACTIONS = Object.freeze( {
	ACCEPT_SERVER_STATE: 'accept-server-state',
	APPROVE_FRESH_REVIEW_ITEM: 'approve-fresh-review-item',
	EXPORT_LOCAL_UPDATES: 'export-local-updates',
	PREPARE_RETRY_SUBMIT: 'prepare-retry-submit',
	PREPARE_RETRY_SUBMIT_SAVE: 'prepare-retry-submit-save',
	REFETCH_SERVER_STATE: 'refetch-server-state',
	REFRESH_RETRY_SUBMIT_PROOF: 'refresh-retry-submit-proof',
	REBASE_LOCAL_UPDATES: 'rebase-local-updates',
	REJECT_FRESH_REVIEW_ITEM: 'reject-fresh-review-item',
	REVIEW_REMOTE_CHANGES: 'review-remote-changes',
	REQUEST_FRESH_REVIEW: 'request-fresh-review',
	SUBMIT_FRESH_REVIEW_DECISION: 'submit-fresh-review-decision',
	VALIDATE_FRESH_REVIEW_HANDOFF: 'validate-fresh-review-handoff',
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
 * Stable retry-save reviewer approval proof statuses. These describe only the
 * inert proof result; they do not authorize a save or retry-save call.
 */
export const DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES =
	Object.freeze( {
		NONE: 'none',
		ACCEPTED_FOR_RETRY_SAVE: 'accepted_for_retry_save',
		STALE_BASE_REJECTED: 'stale_base_rejected',
		REJECTED_PERMISSION_DENIED: 'rejected_permission_denied',
		REJECTED_ROUTE_MISMATCH: 'rejected_route_mismatch',
		REJECTED_HASH_MISMATCH: 'rejected_hash_mismatch',
		REJECTED_MALFORMED_SYNC_PAYLOAD: 'rejected_malformed_sync_payload',
	} );

/**
 * Stable KSES risky-block review statuses. These are editor data states for
 * future block annotation and pre-publish review UI; they do not save.
 */
export const DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES = Object.freeze( {
	NONE: 'none',
	NO_REVIEW_REQUIRED: 'no_review_required',
	REVIEW_REQUIRED: 'review_required',
	REVIEW_RESOLVED: 'review_resolved',
	STALE_AFTER_REVIEW: 'stale_after_review',
	REJECTED_RAW_CONTENT: 'rejected_raw_content',
} );

/**
 * Stable per-block KSES review statuses.
 */
export const DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES =
	Object.freeze( {
		PENDING_REVIEW: 'pending_review',
		APPROVED_FOR_RETRY_SAVE: 'approved_for_retry_save',
		REJECTED: 'rejected',
		STALE_AFTER_REVIEW: 'stale_after_review',
	} );

/**
 * Stable Save policy states for DE-RTC human review handoff.
 */
export const DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES = Object.freeze( {
	UPDATE_READY: 'update_ready',
	REVIEW_REQUIRED: 'review_required',
	READY_FOR_REVIEWED_RETRY_SAVE: 'ready_for_reviewed_retry_save',
	REFETCH_REQUIRED: 'refetch_required',
	IN_FLIGHT: 'in_flight',
	RETRY_SAVE_CONFIRMED: 'retry_save_confirmed',
} );

/**
 * Stable Save click actions for DE-RTC human review handoff.
 */
export const DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS = Object.freeze( {
	CONTINUE_SAVE: 'continue_save',
	OPEN_PRE_PUBLISH_REVIEW: 'open_pre_publish_review',
	CONTINUE_GUARDED_RETRY_SAVE: 'continue_guarded_retry_save',
	REFETCH_SERVER_STATE: 'refetch_server_state',
} );

/**
 * Stable Save button semantic states for DE-RTC sessions. These are copy and
 * policy descriptors only; they do not call REST, save, dispatch notices,
 * persist editor state, or change post locks.
 */
export const DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES = Object.freeze( {
	UPDATE_READY: 'update_ready',
	REVIEW_BLOCKED: 'review_blocked',
	ACCEPTED_BUT_UNCONSUMED: 'accepted_but_unconsumed',
	RETRY_SAVE_IN_PROGRESS: 'retry_save_in_progress',
	FRESH_REVIEW_VALIDATING: 'fresh_review_validating',
	RETRY_SAVE_CONFIRMED: 'retry_save_confirmed',
	REFETCH_REQUIRED: 'refetch_required',
} );

/**
 * Stable fresh-review pre-save statuses. These are pure placement hints for
 * future Save/pre-publish UI and do not perform the action they describe.
 */
export const DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES = Object.freeze(
	{
		NONE: 'none',
		REVIEW_REQUIRED: 'review_required',
		VALIDATION_REQUIRED: 'validation_required',
		VALIDATING: 'validating',
		READY_FOR_GUARDED_RETRY_SAVE: 'ready_for_guarded_retry_save',
		REFETCH_REQUIRED: 'refetch_required',
		BLOCKED: 'blocked',
	}
);

/**
 * Stable fresh-review pre-save placements for future editor chrome.
 */
export const DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS =
	Object.freeze( {
		NONE: 'none',
		PRE_PUBLISH_REVIEW: 'pre_publish_review',
		SAVE_BUTTON_STATUS: 'save_button_status',
		PRE_SAVE_STATUS: 'pre_save_status',
	} );

/**
 * Stable fresh-review review-list statuses for future pre-publish UI.
 */
export const DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES =
	Object.freeze( {
		NONE: 'none',
		REVIEW_REQUIRED: 'review_required',
		AWAITING_REVIEW: 'awaiting_review',
		DECISION_READY: 'decision_ready',
		DECISION_RECORDED: 'decision_recorded',
		CONSUMED: 'consumed',
		BLOCKED: 'blocked',
	} );

/**
 * Stable support-safe lifecycle retrieval statuses.
 */
export const DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES =
	Object.freeze( {
		NONE: 'none',
		RETRIEVING: 'retrieving',
		AVAILABLE: 'available',
		UNAVAILABLE: 'unavailable',
	} );

/**
 * Stable reviewer-authority statuses for fresh-review handoffs.
 */
export const DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES =
	Object.freeze( {
		NONE: 'none',
		RECHECK_UNSUPPORTED: 'recheck_unsupported',
		FRESH_REVIEW_REQUIRED: 'fresh_review_required',
		AUTHORITY_DRIFT_REQUIRES_FRESH_REVIEW:
			'authority_drift_requires_fresh_review',
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

export const DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE =
	'field_based_review_approval_proof';

export const DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE =
	'opaque_review_approval_proof_token';

const DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_REJECTION_DETAILS =
	Object.freeze( {
		UNKNOWN: 'unknown_retry_save_review_approval_proof_token',
		EXPIRED: 'retry_save_review_approval_proof_token_expired',
	} );

/**
 * Stable review-token recovery statuses for failed opaque proof-token handoffs.
 * These are product communication states only; they do not save, retry, or
 * inspect the server-side proof behind the token.
 */
export const DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES = Object.freeze(
	{
		NONE: 'none',
		FRESH_REVIEW_REQUIRED: 'fresh_review_required',
	}
);

/**
 * Stable review-token recovery reasons for failed opaque proof-token handoffs.
 */
export const DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_REASONS = Object.freeze(
	{
		TOKEN_UNAVAILABLE: 'token_unavailable',
		TOKEN_EXPIRED: 'token_expired',
	}
);

/**
 * Stable local-updates import statuses for cross-user handoff payloads.
 */
export const DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES = Object.freeze(
	{
		NONE: 'none',
		IMPORTED_FOR_RETRY_SAVE: 'imported_for_retry_save',
		BLOCKED: 'blocked',
	}
);

/**
 * Stable local-updates import blocker reasons.
 */
export const DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS = Object.freeze( {
	MALFORMED_PAYLOAD: 'malformed_payload',
	FORMAT_MISMATCH: 'format_mismatch',
	POST_ROUTE_MISMATCH: 'post_route_mismatch',
	MISSING_POST_CONTENT: 'missing_post_content',
	MISSING_HASH_EVIDENCE: 'missing_hash_evidence',
	POST_CONTENT_HASH_MISMATCH: 'post_content_hash_mismatch',
	MISSING_REVIEW_APPROVAL_PROOF: 'missing_review_approval_proof',
	EXPIRED_REVIEW_APPROVAL_PROOF: 'expired_review_approval_proof',
	FRESH_REVIEW_REQUIRED: 'fresh_review_required',
	EXTRA_SESSION_STATE_OVEREXPOSED: 'extra_session_state_overexposed',
} );

/**
 * Stable no-save review request statuses for blocked local-updates imports.
 */
export const DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES =
	Object.freeze( {
		NONE: 'none',
		FRESH_REVIEW_REQUIRED: 'fresh_review_required',
		REQUESTED: 'requested',
		DECISION_RECORDED: 'decision_recorded',
		STALE_BASE_REJECTED: 'stale_base_rejected',
		REJECTED_FEATURE_DISABLED: 'rejected_feature_disabled',
		REJECTED_PERMISSION_DENIED: 'rejected_permission_denied',
		REJECTED_ROUTE_MISMATCH: 'rejected_route_mismatch',
		REJECTED_SYNC_META_TAMPERED: 'rejected_sync_meta_tampered',
		REJECTED_MALFORMED_SYNC_PAYLOAD: 'rejected_malformed_sync_payload',
	} );

/**
 * Stable local fresh-review decision statuses for requested imports. These are
 * proof-opaque editor states only; they do not save or submit proof.
 */
export const DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES = Object.freeze(
	{
		NONE: 'none',
		AWAITING_REVIEW: 'awaiting_review',
		READY: 'ready',
		RECORDED: 'recorded',
		REJECTED: 'rejected',
	}
);

/**
 * Stable fresh-review retry-save handoff statuses. These describe only the
 * editor-side validation handoff for a recorded decision; they do not save.
 */
export const DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES =
	Object.freeze( {
		NONE: 'none',
		READY: 'ready',
		VALIDATING: 'validating',
		ACCEPTED_FOR_RETRY_SAVE: 'accepted_for_retry_save',
		BLOCKED: 'blocked',
	} );

/**
 * Stable fresh-review retry-save handoff blocker reasons.
 */
export const DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS =
	Object.freeze( {
		FRESH_REVIEW_DECISION_NOT_RECORDED:
			'fresh_review_decision_not_recorded',
		FRESH_REVIEW_DECISION_REJECTED: 'fresh_review_decision_rejected',
		STALE_BASE_REJECTED: 'stale_base_rejected',
		FEATURE_DISABLED: 'feature_disabled',
		PERMISSION_DENIED: 'permission_denied',
		ROUTE_MISMATCH: 'route_mismatch',
		HASH_MISMATCH: 'hash_mismatch',
		MALFORMED_SYNC_PAYLOAD: 'malformed_sync_payload',
	} );

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

const VALID_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES = new Set(
	Object.values(
		DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES
	)
);

const VALID_RISKY_BLOCK_REVIEW_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES )
);

const VALID_RISKY_BLOCK_REVIEW_ITEM_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES )
);

const VALID_RETRY_SAVE_HANDOFF_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES )
);

const VALID_LOCAL_UPDATES_IMPORT_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES )
);

const VALID_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES )
);

const VALID_FRESH_REVIEW_DECISION_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES )
);

const VALID_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES = new Set(
	Object.values(
		DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES
	)
);

const VALID_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES = new Set(
	Object.values(
		DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES
	)
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
	[ DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED ]:
		DISTRIBUTED_EDITING_NOTICE_IDS.LOCAL_UPDATES_IMPORT_BLOCKED,
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
	retrySaveReviewStatus: null,
	retrySaveReviewAction: null,
	retrySaveReviewRequiredCapability: null,
	retrySaveReviewerCapability: null,
	retrySaveReviewScope: null,
	retrySaveEscalationReason: null,
	retrySaveRawContentIncluded: false,
	retrySaveReviewContractType: null,
	retrySaveRequiresReviewerEscalation: false,
	retrySaveReviewEscalationRequired: false,
	retrySaveReviewEscalationReason: null,
	retrySaveReviewRequiresUnfilteredHtml: false,
	retrySaveRequiresUnfilteredHtmlSaver: false,
	retrySaveReviewUnfilteredHtmlAllowed: false,
	retrySaveReviewAuthorshipRequired: false,
	retrySaveReviewContentCapabilityRequired: false,
	retrySaveReviewContentFilter: null,
	retrySaveReviewContentFilterContext: null,
	retrySaveReviewContentWouldChangeByKses: false,
	retrySaveReviewProposedContentWouldChangeByKses: false,
	retrySaveReviewCandidateContentWouldChangeByKses: false,
	retrySaveReviewProposedContentHash: null,
	retrySaveReviewFilteredProposedContentHash: null,
	retrySaveReviewCandidateContentHash: null,
	retrySaveReviewFilteredCandidateContentHash: null,
	retrySaveReviewRawContentIncluded: false,
	retrySaveReviewRecoveryActions: [],
	retrySaveReviewApprovalProofStatus:
		DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.NONE,
	retrySaveReviewApprovalProofReason: null,
	retrySaveReviewApprovalProofEnvelope: null,
	retrySaveReviewApprovalAccepted: false,
	retrySaveReviewApprovalPostId: null,
	retrySaveReviewApprovalPostType: null,
	retrySaveReviewApprovalReviewerUserId: null,
	retrySaveReviewApprovalLowPrivilegedSaverUserId: null,
	retrySaveReviewApprovalServerVersion: null,
	retrySaveReviewApprovalPreviousServerVersion: null,
	retrySaveReviewApprovalRebasedFromVersion: null,
	retrySaveReviewApprovalReviewStatus: null,
	retrySaveReviewApprovalApprovalStatus: null,
	retrySaveReviewApprovalReviewAction: null,
	retrySaveReviewApprovalApprovalAction: null,
	retrySaveReviewApprovalAction: null,
	retrySaveReviewApprovalRequiredCapability: null,
	retrySaveReviewApprovalReviewerCapability: null,
	retrySaveReviewApprovalScope: null,
	retrySaveReviewApprovalProposedContentHash: null,
	retrySaveReviewApprovalCandidateContentHash: null,
	retrySaveReviewApprovalCandidateContentHashScope: null,
	retrySaveReviewApprovalRequiresUnfilteredHtmlSaver: false,
	retrySaveReviewApprovalExpectedProposedContentHash: null,
	retrySaveReviewApprovalExpectedCandidateContentHash: null,
	retrySaveReviewApprovalHashMismatch: false,
	retrySaveReviewApprovalReviewedBlockItems: [],
	retrySaveReviewApprovalReviewedBlockItemCount: 0,
	retrySaveReviewApprovalBlockReviewStatus: null,
	retrySaveReviewApprovalUnapprovedBlockItemIds: [],
	retrySaveReviewApprovalMismatchedBlockItemFields: [],
	retrySaveReviewApprovalRawContentIncluded: false,
	retrySaveReviewApprovalProofSignature: null,
	retrySaveReviewApprovalIssuedAt: null,
	retrySaveReviewApprovalExpiresAt: null,
	retrySaveReviewApprovalSiteId: null,
	retrySaveReviewApprovalSiteUrl: null,
	retrySaveReviewApprovalSiteUuid: null,
	retrySaveReviewApprovalSavesPost: false,
	retrySaveReviewApprovalMutatesPostContent: false,
	retrySaveReviewApprovalCreatesRevision: false,
	retrySaveReviewApprovalClaimsSaved: false,
	retrySaveFreshReviewConsumeValidationStatus: null,
	retrySaveFreshReviewConsumeValidationReason: null,
	retrySaveFreshReviewConsumeValidationResult: null,
	retrySaveFreshReviewConsumeValidationRestRoute: null,
	retrySaveFreshReviewConsumeValidationAccepted: false,
	retrySaveFreshReviewDecisionConsumptionValidated: false,
	retrySaveFreshReviewDecisionEligibleForRetrySave: false,
	retrySaveFreshReviewRequestRecordId: null,
	retrySaveFreshReviewRequestStatus: null,
	retrySaveFreshReviewDecisionStatus: null,
	retrySaveFreshReviewClientBaseVersion: null,
	retrySaveFreshReviewServerVersion: null,
	retrySaveFreshReviewProposedContentHash: null,
	retrySaveFreshReviewReviewedProposedContentHash: null,
	retrySaveFreshReviewCandidateContentHash: null,
	retrySaveFreshReviewReviewedCandidateContentHash: null,
	retrySaveFreshReviewReviewedBlockItemCount: 0,
	retrySaveFreshReviewHashEvidenceStatus: null,
	retrySaveFreshReviewRawContentIncluded: false,
	retrySaveFreshReviewExposesRawContent: false,
	retrySaveFreshReviewExposesReviewerIds: false,
	retrySaveFreshReviewSavesPost: false,
	retrySaveFreshReviewMutatesPostContent: false,
	retrySaveFreshReviewCreatesRevision: false,
	retrySaveFreshReviewClaimsSaved: false,
	reviewTokenRecoveryStatus:
		DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.NONE,
	reviewTokenRecoveryReason: null,
	reviewTokenRecoveryRequiresFreshReview: false,
	localUpdatesImportStatus:
		DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.NONE,
	localUpdatesImportReason: null,
	localUpdatesImportPostId: null,
	localUpdatesImportPostType: null,
	localUpdatesImportHasPostContent: false,
	localUpdatesImportHasAcceptedReviewApprovalProof: false,
	localUpdatesImportVerifiedPostContentHash: null,
	localUpdatesImportReviewRequestStatus:
		DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.NONE,
	localUpdatesImportReviewRequestReason: null,
	localUpdatesImportRequiresFreshReview: false,
	localUpdatesImportReviewActionKey: null,
	localUpdatesImportFreshReviewRequestResult: null,
	localUpdatesImportFreshReviewRequestAction: null,
	localUpdatesImportFreshReviewRequestRestRoute: null,
	localUpdatesImportFreshReviewRequestRecordId: null,
	localUpdatesImportFreshReviewRequestAccepted: false,
	localUpdatesImportFreshReviewRequestRequested: false,
	localUpdatesImportFreshReviewRequestSavesPost: false,
	localUpdatesImportFreshReviewRequestMutatesPostContent: false,
	localUpdatesImportFreshReviewRequestCreatesRevision: false,
	localUpdatesImportFreshReviewRequestClaimsSaved: false,
	localUpdatesImportFreshReviewDecisionStatus:
		DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.NONE,
	localUpdatesImportFreshReviewDecisionResult: null,
	localUpdatesImportFreshReviewDecisionRestRoute: null,
	localUpdatesImportFreshReviewDecisionAccepted: false,
	localUpdatesImportFreshReviewDecisionSubmitted: false,
	localUpdatesImportFreshReviewDecisionDecision: null,
	localUpdatesImportFreshReviewDecisionReason: null,
	localUpdatesImportFreshReviewDecisionItems: [],
	localUpdatesImportFreshReviewDecisionItemCount: 0,
	localUpdatesImportFreshReviewDecisionPendingCount: 0,
	localUpdatesImportFreshReviewDecisionApprovedCount: 0,
	localUpdatesImportFreshReviewDecisionRejectedCount: 0,
	localUpdatesImportFreshReviewDecisionPanelRequired: false,
	localUpdatesImportFreshReviewDecisionReady: false,
	localUpdatesImportFreshReviewDecisionReviewedBlockItems: [],
	localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 0,
	localUpdatesImportFreshReviewDecisionSavesPost: false,
	localUpdatesImportFreshReviewDecisionCallsNormalSavePost: false,
	localUpdatesImportFreshReviewDecisionCallsRetrySaveEndpoint: false,
	localUpdatesImportFreshReviewDecisionDispatchesNotice: false,
	localUpdatesImportFreshReviewDecisionMutatesEditorContent: false,
	localUpdatesImportFreshReviewDecisionMutatesPersistedPostContent: false,
	localUpdatesImportFreshReviewDecisionChangesPostLock: false,
	localUpdatesImportFreshReviewDecisionClaimsSaved: false,
	localUpdatesImportFreshReviewDecisionRawContentIncluded: false,
	localUpdatesImportFreshReviewDecisionExposesRawContent: false,
	localUpdatesImportFreshReviewDecisionExposesProofSignature: false,
	localUpdatesImportFreshReviewDecisionExposesReviewerIds: false,
	localUpdatesImportFreshReviewRetrySaveHandoffStatus:
		DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.NONE,
	localUpdatesImportFreshReviewRetrySaveHandoffReason: null,
	localUpdatesImportFreshReviewRetrySaveHandoffResult: null,
	localUpdatesImportFreshReviewRetrySaveHandoffRestRoute: null,
	localUpdatesImportFreshReviewRetrySaveHandoffReady: false,
	localUpdatesImportFreshReviewRetrySaveHandoffValidating: false,
	localUpdatesImportFreshReviewRetrySaveHandoffAccepted: false,
	localUpdatesImportFreshReviewRetrySaveHandoffCallsNormalSavePost: false,
	localUpdatesImportFreshReviewRetrySaveHandoffCallsRetrySaveEndpoint: false,
	localUpdatesImportFreshReviewRetrySaveHandoffDispatchesNotice: false,
	localUpdatesImportFreshReviewRetrySaveHandoffMutatesEditorContent: false,
	localUpdatesImportFreshReviewRetrySaveHandoffMutatesPersistedPostContent: false,
	localUpdatesImportFreshReviewRetrySaveHandoffChangesPostLock: false,
	localUpdatesImportFreshReviewRetrySaveHandoffClaimsSaved: false,
	localUpdatesImportFreshReviewRetrySaveHandoffExposesRawContent: false,
	localUpdatesImportFreshReviewRetrySaveHandoffExposesProofSignature: false,
	localUpdatesImportFreshReviewRetrySaveHandoffExposesReviewerIds: false,
	localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion: null,
	localUpdatesImportFreshReviewRetrySaveHandoffServerVersion: null,
	localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash: null,
	localUpdatesImportFreshReviewRetrySaveHandoffReviewedProposedContentHash:
		null,
	localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash: null,
	localUpdatesImportFreshReviewRetrySaveHandoffReviewedCandidateContentHash:
		null,
	localUpdatesImportFreshReviewRetrySaveHandoffHashEvidenceStatus: null,
	localUpdatesImportFreshReviewLifecycleRetrievalStatus:
		DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.NONE,
	localUpdatesImportFreshReviewLifecycleResult: null,
	localUpdatesImportFreshReviewLifecycleRestRoute: null,
	localUpdatesImportFreshReviewLifecycleDebugAvailable: false,
	localUpdatesImportFreshReviewSupportEvidenceAvailable: false,
	localUpdatesImportFreshReviewLifecycleStatus: null,
	localUpdatesImportFreshReviewLifecycleEvent: null,
	localUpdatesImportFreshReviewLifecycleReason: null,
	localUpdatesImportFreshReviewLifecycleAction: null,
	localUpdatesImportFreshReviewLifecycleRequestStatus: null,
	localUpdatesImportFreshReviewLifecycleDecisionStatus: null,
	localUpdatesImportFreshReviewLifecycleDecisionRecorded: false,
	localUpdatesImportFreshReviewLifecycleDecisionConsumed: false,
	localUpdatesImportFreshReviewLifecycleRetrySaveApplied: false,
	localUpdatesImportFreshReviewLifecycleConsumesReviewDecision: false,
	localUpdatesImportFreshReviewLifecycleImportedHandoff: false,
	localUpdatesImportFreshReviewLifecyclePreviousServerVersion: null,
	localUpdatesImportFreshReviewLifecycleSavedServerVersion: null,
	localUpdatesImportFreshReviewLifecycleReviewedBlockItemCount: 0,
	localUpdatesImportFreshReviewLifecycleApprovedBlockItemCount: 0,
	localUpdatesImportFreshReviewLifecycleRejectedBlockItemCount: 0,
	localUpdatesImportFreshReviewLifecycleHashEvidenceFields: [],
	localUpdatesImportFreshReviewLifecycleVersionEvidenceFields: [],
	localUpdatesImportFreshReviewLifecycleReviewerIdentityRetained: false,
	localUpdatesImportFreshReviewLifecycleReviewerCapabilityDriftRecheckSupported: false,
	localUpdatesImportFreshReviewLifecycleRequiresNewReviewIfReviewerAuthorityCannotBeRechecked: false,
	localUpdatesImportFreshReviewLifecycleExposesRawContent: false,
	localUpdatesImportFreshReviewLifecycleExposesProofInternals: false,
	localUpdatesImportFreshReviewLifecycleExposesReviewerIdentity: false,
	localUpdatesImportFreshReviewLifecycleExposesSaverIdentity: false,
	localUpdatesImportFreshReviewDecisionLifecycleStatus: null,
	localUpdatesImportFreshReviewDecisionLifecycleAction: null,
	localUpdatesImportFreshReviewReviewerAuthorityStatus:
		DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.NONE,
	localUpdatesImportFreshReviewRequiresFreshReviewDueToAuthority: false,
	riskyBlockReviewStatus:
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NONE,
	riskyBlockReviewReasonCode: null,
	riskyBlockReviewItems: [],
	riskyBlockReviewItemCount: 0,
	riskyBlockReviewPendingCount: 0,
	riskyBlockReviewApprovedCount: 0,
	riskyBlockReviewRejectedCount: 0,
	riskyBlockReviewHasPendingItems: false,
	riskyBlockReviewPrePublishPanelRequired: false,
	riskyBlockReviewSaveButtonLabel: 'Update',
	riskyBlockReviewSaveClickAction:
		DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE,
	riskyBlockReviewCanExportLocalUpdates: false,
	riskyBlockReviewRequiresServerStateRefetch: false,
	riskyBlockReviewReviewedServerVersion: null,
	riskyBlockReviewCurrentServerVersion: null,
	riskyBlockReviewRawContentIncluded: false,
	riskyBlockReviewExposesRawContent: false,
	riskyBlockReviewDispatchesNotice: false,
	riskyBlockReviewMutatesEditorContent: false,
	riskyBlockReviewCallsNormalSavePost: false,
	riskyBlockReviewCallsRetrySaveEndpoint: false,
	riskyBlockReviewChangesPostLock: false,
	riskyBlockReviewClaimsSaved: false,
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
		DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
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
	const retrySaveReason = normalizeNullableString(
		sessionState.retrySaveReason
	);
	const reviewTokenRecoveryReason =
		getDistributedEditingReviewTokenRecoveryReasonFromRetrySave( {
			retrySaveStatus,
			retrySaveReason,
		} );
	const reviewTokenRecoveryStatus = reviewTokenRecoveryReason
		? DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.FRESH_REVIEW_REQUIRED
		: DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.NONE;
	const reviewTokenRecoveryRequiresFreshReview = Boolean(
		reviewTokenRecoveryReason
	);
	const retrySaveAccepted =
		Boolean( sessionState.retrySaveAccepted ) ||
		retrySaveStatus === DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED;
	const retrySaveReviewApprovalProofStatus =
		VALID_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.has(
			sessionState.retrySaveReviewApprovalProofStatus
		)
			? sessionState.retrySaveReviewApprovalProofStatus
			: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.retrySaveReviewApprovalProofStatus;
	const retrySaveReviewApprovalAccepted =
		Boolean( sessionState.retrySaveReviewApprovalAccepted ) ||
		retrySaveReviewApprovalProofStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE;
	const retrySaveFreshReviewConsumeValidationAccepted = Boolean(
		sessionState.retrySaveFreshReviewConsumeValidationAccepted ||
			sessionState.retrySaveFreshReviewDecisionConsumptionValidated
	);
	const localUpdatesImportStatus = VALID_LOCAL_UPDATES_IMPORT_STATUSES.has(
		sessionState.localUpdatesImportStatus
	)
		? sessionState.localUpdatesImportStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.localUpdatesImportStatus;
	const localUpdatesImportReason = normalizeNullableString(
		sessionState.localUpdatesImportReason
	);
	const localUpdatesImportRequiresFreshReview =
		localUpdatesImportStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED &&
		localUpdatesImportReason ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED;
	const requestedLocalUpdatesImportReviewRequestStatus =
		VALID_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.has(
			sessionState.localUpdatesImportReviewRequestStatus
		)
			? sessionState.localUpdatesImportReviewRequestStatus
			: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.localUpdatesImportReviewRequestStatus;
	let localUpdatesImportReviewRequestStatus =
		DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.localUpdatesImportReviewRequestStatus;

	if ( localUpdatesImportRequiresFreshReview ) {
		localUpdatesImportReviewRequestStatus =
			requestedLocalUpdatesImportReviewRequestStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.NONE
				? DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.FRESH_REVIEW_REQUIRED
				: requestedLocalUpdatesImportReviewRequestStatus;
	}
	const localUpdatesImportReviewActionKey =
		localUpdatesImportRequiresFreshReview &&
		localUpdatesImportReviewRequestStatus !==
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED
			? DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW
			: null;
	const freshReviewDecisionFields = normalizeFreshReviewDecisionFields(
		sessionState,
		{
			localUpdatesImportRequiresFreshReview,
			localUpdatesImportReviewRequestStatus,
		}
	);
	const freshReviewRetrySaveHandoffFields =
		normalizeFreshReviewRetrySaveHandoffFields( sessionState, {
			freshReviewDecisionFields,
		} );
	const riskyBlockReviewFields =
		normalizeRiskyBlockReviewMetadataFields( sessionState );
	const hasPendingRiskyBlockReviewItems =
		riskyBlockReviewFields.riskyBlockReviewHasPendingItems;
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
		( reviewTokenRecoveryRequiresFreshReview && hasPendingChanges ) ||
		( retrySaveHandoffBlocksNormalSave && hasPendingChanges ) ||
		( retrySaveReviewApprovalAccepted && hasPendingChanges ) ||
		( retrySaveFreshReviewConsumeValidationAccepted &&
			hasPendingChanges ) ||
		hasPendingRiskyBlockReviewItems ||
		( requiresManualConflictResolution && hasPendingChanges );
	const canExportLocalUpdates =
		Boolean( sessionState.canExportLocalUpdates ) ||
		riskyBlockReviewFields.riskyBlockReviewCanExportLocalUpdates ||
		mustOfferLocalCopy;

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
		retrySaveReason,
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
		...normalizeRetrySaveReviewMetadataFields( sessionState ),
		...normalizeRetrySaveReviewApprovalProofFields( {
			...sessionState,
			retrySaveReviewApprovalProofStatus,
			retrySaveReviewApprovalAccepted,
		} ),
		...normalizeRetrySaveFreshReviewConsumeValidationFields( sessionState ),
		reviewTokenRecoveryStatus,
		reviewTokenRecoveryReason,
		reviewTokenRecoveryRequiresFreshReview,
		localUpdatesImportStatus,
		localUpdatesImportReason,
		localUpdatesImportPostId: normalizeNullableString(
			sessionState.localUpdatesImportPostId
		),
		localUpdatesImportPostType: normalizeNullableString(
			sessionState.localUpdatesImportPostType
		),
		localUpdatesImportHasPostContent: Boolean(
			sessionState.localUpdatesImportHasPostContent
		),
		localUpdatesImportHasAcceptedReviewApprovalProof: Boolean(
			sessionState.localUpdatesImportHasAcceptedReviewApprovalProof
		),
		localUpdatesImportVerifiedPostContentHash: normalizeSha256Hash(
			sessionState.localUpdatesImportVerifiedPostContentHash
		),
		localUpdatesImportReviewRequestStatus,
		localUpdatesImportReviewRequestReason: normalizeNullableString(
			sessionState.localUpdatesImportReviewRequestReason
		),
		localUpdatesImportRequiresFreshReview,
		localUpdatesImportReviewActionKey,
		localUpdatesImportFreshReviewRequestResult: normalizeNullableString(
			sessionState.localUpdatesImportFreshReviewRequestResult
		),
		localUpdatesImportFreshReviewRequestAction: normalizeNullableString(
			sessionState.localUpdatesImportFreshReviewRequestAction
		),
		localUpdatesImportFreshReviewRequestRestRoute: normalizeNullableString(
			sessionState.localUpdatesImportFreshReviewRequestRestRoute
		),
		localUpdatesImportFreshReviewRequestRecordId: normalizeNullableString(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewRequestRecordId,
				sessionState.localUpdatesImportFreshReviewRequestRecordID,
				sessionState.freshReviewRequestRecordId,
				sessionState.fresh_review_request_record_id
			)
		),
		localUpdatesImportFreshReviewRequestAccepted: Boolean(
			sessionState.localUpdatesImportFreshReviewRequestAccepted
		),
		localUpdatesImportFreshReviewRequestRequested:
			Boolean(
				sessionState.localUpdatesImportFreshReviewRequestRequested
			) ||
			localUpdatesImportReviewRequestStatus ===
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
		localUpdatesImportFreshReviewRequestSavesPost: Boolean(
			sessionState.localUpdatesImportFreshReviewRequestSavesPost
		),
		localUpdatesImportFreshReviewRequestMutatesPostContent: Boolean(
			sessionState.localUpdatesImportFreshReviewRequestMutatesPostContent
		),
		localUpdatesImportFreshReviewRequestCreatesRevision: Boolean(
			sessionState.localUpdatesImportFreshReviewRequestCreatesRevision
		),
		localUpdatesImportFreshReviewRequestClaimsSaved: Boolean(
			sessionState.localUpdatesImportFreshReviewRequestClaimsSaved
		),
		...freshReviewDecisionFields,
		...freshReviewRetrySaveHandoffFields,
		...normalizeFreshReviewLifecycleFields( sessionState ),
		...riskyBlockReviewFields,
		requiresManualConflictResolution,
		mustOfferLocalCopy,
		canExportLocalUpdates,
	};
}

/**
 * Returns a pure recovery descriptor for failed opaque reviewed-proof token
 * handoffs. The descriptor is product communication state only; it does not
 * inspect token internals, call REST, save, retry, dispatch notices, mutate
 * content, or change post locks.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Review token recovery descriptor.
 */
export function getDistributedEditingReviewTokenRecoveryStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const requiresFreshReview =
		normalized.reviewTokenRecoveryStatus ===
		DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.FRESH_REVIEW_REQUIRED;

	return {
		status: normalized.reviewTokenRecoveryStatus,
		reason: normalized.reviewTokenRecoveryReason,
		requiresFreshReview,
		canExportLocalUpdates:
			requiresFreshReview && normalized.canExportLocalUpdates,
		hasProtectedLocalChanges:
			normalized.hasPendingChanges ||
			normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates,
		actionKey: requiresFreshReview
			? DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES
			: null,
		shouldCallRetrySaveEndpoint: false,
		shouldCallNormalSavePost: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
		exposesTokenInternals: false,
		exposesProofSignature: false,
		exposesReviewedBlockItems: false,
		exposesReviewerIds: false,
	};
}

/**
 * Returns a pure fresh-review request descriptor for blocked local-updates
 * imports. This keeps receiving-admin handoffs actionable without reusing stale
 * proof, saving, calling REST, dispatching notices, mutating content, or
 * exposing proof internals.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Local-updates import review request state.
 */
export function getDistributedEditingLocalUpdatesImportReviewRequestStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const requiresFreshReview = Boolean(
		normalized.localUpdatesImportRequiresFreshReview
	);

	return {
		status: normalized.localUpdatesImportReviewRequestStatus,
		reason: requiresFreshReview
			? normalized.localUpdatesImportReason
			: null,
		requiresFreshReview,
		actionKey: requiresFreshReview
			? normalized.localUpdatesImportReviewActionKey
			: null,
		requestAccepted:
			normalized.localUpdatesImportFreshReviewRequestAccepted,
		requestRequested:
			normalized.localUpdatesImportFreshReviewRequestRequested,
		requestResult: normalized.localUpdatesImportFreshReviewRequestResult,
		requestAction: normalized.localUpdatesImportFreshReviewRequestAction,
		requestRestRoute:
			normalized.localUpdatesImportFreshReviewRequestRestRoute,
		requestReason: normalized.localUpdatesImportReviewRequestReason,
		requestSavesPost:
			normalized.localUpdatesImportFreshReviewRequestSavesPost,
		requestMutatesPostContent:
			normalized.localUpdatesImportFreshReviewRequestMutatesPostContent,
		requestCreatesRevision:
			normalized.localUpdatesImportFreshReviewRequestCreatesRevision,
		requestClaimsSaved:
			normalized.localUpdatesImportFreshReviewRequestClaimsSaved,
		localUpdatesImportStatus: normalized.localUpdatesImportStatus,
		localUpdatesImportReason: normalized.localUpdatesImportReason,
		localUpdatesImportPostId: normalized.localUpdatesImportPostId,
		localUpdatesImportPostType: normalized.localUpdatesImportPostType,
		localUpdatesImportHasPostContent:
			normalized.localUpdatesImportHasPostContent,
		localUpdatesImportHasAcceptedReviewApprovalProof:
			normalized.localUpdatesImportHasAcceptedReviewApprovalProof,
		canExportLocalUpdates:
			requiresFreshReview && normalized.canExportLocalUpdates,
		hasProtectedLocalChanges:
			normalized.hasPendingChanges ||
			normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates,
		shouldCallRetrySaveEndpoint: false,
		shouldCallNormalSavePost: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
		exposesTokenInternals: false,
		exposesProofSignature: false,
		exposesReviewedBlockItems: false,
		exposesReviewerIds: false,
		exposesRawContent: false,
	};
}

/**
 * Returns proof-opaque fresh-review decision state for internal reviewer
 * panels and status surfaces. It may expose hash-only reviewed-block evidence,
 * but it must not expose raw content, proof signatures, or reviewer identity.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Fresh-review decision state.
 */
export function getDistributedEditingFreshReviewDecisionStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return {
		status: normalized.localUpdatesImportFreshReviewDecisionStatus,
		result: normalized.localUpdatesImportFreshReviewDecisionResult,
		restRoute: normalized.localUpdatesImportFreshReviewDecisionRestRoute,
		decision: normalized.localUpdatesImportFreshReviewDecisionDecision,
		reason: normalized.localUpdatesImportFreshReviewDecisionReason,
		requestStatus: normalized.localUpdatesImportReviewRequestStatus,
		requestResult: normalized.localUpdatesImportFreshReviewRequestResult,
		requestRestRoute:
			normalized.localUpdatesImportFreshReviewRequestRestRoute,
		requested: normalized.localUpdatesImportFreshReviewRequestRequested,
		accepted: normalized.localUpdatesImportFreshReviewRequestAccepted,
		requestRecordId:
			normalized.localUpdatesImportFreshReviewRequestRecordId,
		decisionAccepted:
			normalized.localUpdatesImportFreshReviewDecisionAccepted,
		decisionSubmitted:
			normalized.localUpdatesImportFreshReviewDecisionSubmitted,
		panelRequired:
			normalized.localUpdatesImportFreshReviewDecisionPanelRequired,
		ready: normalized.localUpdatesImportFreshReviewDecisionReady,
		reviewItems: normalized.localUpdatesImportFreshReviewDecisionItems,
		reviewItemCount:
			normalized.localUpdatesImportFreshReviewDecisionItemCount,
		pendingReviewItemCount:
			normalized.localUpdatesImportFreshReviewDecisionPendingCount,
		approvedReviewItemCount:
			normalized.localUpdatesImportFreshReviewDecisionApprovedCount,
		rejectedReviewItemCount:
			normalized.localUpdatesImportFreshReviewDecisionRejectedCount,
		reviewedBlockItems:
			normalized.localUpdatesImportFreshReviewDecisionReviewedBlockItems,
		reviewedBlockItemCount:
			normalized.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount,
		canExportLocalUpdates: normalized.canExportLocalUpdates,
		savesPost: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
		rawContentIncluded: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesReviewerIds: false,
	};
}

/**
 * Returns no-save fresh-review retry-save handoff state for a recorded reviewer
 * decision. This is a validation handoff only; it does not call retry-save or
 * normal save.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Fresh-review retry-save handoff state.
 */
export function getDistributedEditingFreshReviewRetrySaveHandoffStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return {
		status: normalized.localUpdatesImportFreshReviewRetrySaveHandoffStatus,
		reason: normalized.localUpdatesImportFreshReviewRetrySaveHandoffReason,
		result: normalized.localUpdatesImportFreshReviewRetrySaveHandoffResult,
		restRoute:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffRestRoute,
		ready: normalized.localUpdatesImportFreshReviewRetrySaveHandoffReady,
		validating:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffValidating,
		accepted:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffAccepted,
		decisionStatus: normalized.localUpdatesImportFreshReviewDecisionStatus,
		decisionResult: normalized.localUpdatesImportFreshReviewDecisionResult,
		decision: normalized.localUpdatesImportFreshReviewDecisionDecision,
		requestRecordId:
			normalized.localUpdatesImportFreshReviewRequestRecordId,
		clientBaseVersion:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion,
		serverVersion:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffServerVersion,
		proposedPostContentHash:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash,
		reviewedProposedContentHash:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffReviewedProposedContentHash,
		candidatePostContentHash:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash,
		reviewedCandidateContentHash:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffReviewedCandidateContentHash,
		hashEvidenceStatus:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffHashEvidenceStatus,
		reviewedBlockItemCount:
			normalized.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount,
		canExportLocalUpdates: normalized.canExportLocalUpdates,
		callsNormalSavePost:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffCallsNormalSavePost,
		callsRetrySaveEndpoint:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffCallsRetrySaveEndpoint,
		dispatchesNotice:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffDispatchesNotice,
		mutatesEditorContent:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffMutatesEditorContent,
		mutatesPersistedPostContent:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffMutatesPersistedPostContent,
		changesPostLock:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffChangesPostLock,
		claimsSaved:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffClaimsSaved,
		exposesRawContent:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffExposesRawContent,
		exposesProofSignature:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffExposesProofSignature,
		exposesReviewerIds:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffExposesReviewerIds,
	};
}

/**
 * Returns editor state when a recorded fresh-review approval is staged for a
 * future retry-save validation consumer. This is a local handoff only.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 * @param {Object} [options]           Hash/version validation inputs.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidation(
	currentSessionState = {},
	options = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );
	const isApprovedRecordedDecision =
		normalized.localUpdatesImportFreshReviewDecisionStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED &&
		normalized.localUpdatesImportFreshReviewDecisionAccepted &&
		normalized.localUpdatesImportFreshReviewDecisionDecision === 'approved';

	if ( ! isApprovedRecordedDecision ) {
		return normalizeDistributedEditingSessionState( {
			...normalized,
			localUpdatesImportFreshReviewRetrySaveHandoffStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.BLOCKED,
			localUpdatesImportFreshReviewRetrySaveHandoffReason:
				normalized.localUpdatesImportFreshReviewDecisionDecision ===
				'rejected'
					? DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.FRESH_REVIEW_DECISION_REJECTED
					: DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.FRESH_REVIEW_DECISION_NOT_RECORDED,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	}

	const proposedPostContentHash = normalizeSha256Hash(
		getFirstDefined(
			options.proposedPostContentHash,
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash,
			normalized.localUpdatesImportVerifiedPostContentHash
		)
	);
	const candidatePostContentHash = normalizeSha256Hash(
		getFirstDefined(
			options.candidatePostContentHash,
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash
		)
	);

	return normalizeDistributedEditingSessionState( {
		...normalized,
		localUpdatesImportFreshReviewRetrySaveHandoffStatus:
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING,
		localUpdatesImportFreshReviewRetrySaveHandoffReason: null,
		localUpdatesImportFreshReviewRetrySaveHandoffResult: null,
		localUpdatesImportFreshReviewRetrySaveHandoffRestRoute: null,
		localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion:
			normalizeNullableString(
				getFirstDefined(
					options.clientBaseVersion,
					normalized.clientBaseVersion
				)
			),
		localUpdatesImportFreshReviewRetrySaveHandoffServerVersion:
			normalizeNullableString(
				getFirstDefined(
					options.serverVersion,
					normalized.serverVersion
				)
			),
		localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash:
			proposedPostContentHash,
		localUpdatesImportFreshReviewRetrySaveHandoffReviewedProposedContentHash:
			normalizeSha256Hash(
				getFirstDefined(
					options.reviewedProposedContentHash,
					options.proposedPostContentHash,
					proposedPostContentHash
				)
			) || proposedPostContentHash,
		localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash:
			candidatePostContentHash,
		localUpdatesImportFreshReviewRetrySaveHandoffReviewedCandidateContentHash:
			normalizeSha256Hash(
				getFirstDefined(
					options.reviewedCandidateContentHash,
					options.candidatePostContentHash,
					candidatePostContentHash
				)
			) || candidatePostContentHash,
		localUpdatesImportFreshReviewRetrySaveHandoffHashEvidenceStatus:
			'pending_validation',
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
}

/**
 * Returns editor state for a future server validation result for a recorded
 * fresh-review decision handoff. This consumes a response shape only; it does
 * not call transport or persist outside the editor store.
 *
 * @param {Object} responseOrError     REST response or API error.
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidationResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const normalizedCurrent =
		normalizeDistributedEditingSessionState( currentSessionState );
	const responseData = getDistributedEditingResponseData( responseOrError );
	const result = normalizeNullableString(
		getFirstDefined( responseOrError.result, responseData.result )
	);
	const restRoute = normalizeNullableString(
		getFirstDefined(
			responseOrError.restRoute,
			responseOrError.rest_route,
			responseData.restRoute,
			responseData.rest_route
		)
	);
	const freshReviewRequestRecordId = normalizeNullableString(
		getFirstDefined(
			responseOrError.freshReviewRequestRecordId,
			responseOrError.fresh_review_request_record_id,
			responseData.freshReviewRequestRecordId,
			responseData.fresh_review_request_record_id,
			normalizedCurrent.localUpdatesImportFreshReviewRequestRecordId
		)
	);
	const clientBaseVersion = normalizeNullableString(
		getFirstDefined(
			responseOrError.clientBaseVersion,
			responseOrError.client_base_version,
			responseData.clientBaseVersion,
			responseData.client_base_version,
			normalizedCurrent.localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion,
			normalizedCurrent.clientBaseVersion
		)
	);
	const serverVersion = normalizeNullableString(
		getFirstDefined(
			responseOrError.serverVersion,
			responseOrError.server_version,
			responseData.serverVersion,
			responseData.server_version,
			normalizedCurrent.localUpdatesImportFreshReviewRetrySaveHandoffServerVersion,
			normalizedCurrent.serverVersion
		)
	);
	const reviewedBlockItemCount = normalizeCountWithFallback(
		getFirstDefined(
			responseOrError.reviewedBlockItemCount,
			responseOrError.reviewed_block_item_count,
			responseData.reviewedBlockItemCount,
			responseData.reviewed_block_item_count
		),
		normalizedCurrent.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount
	);
	const accepted =
		responseOrError.freshReviewRetrySaveHandoffAccepted === true ||
		responseOrError.fresh_review_retry_save_handoff_accepted === true ||
		responseData.freshReviewRetrySaveHandoffAccepted === true ||
		responseData.fresh_review_retry_save_handoff_accepted === true ||
		[
			'fresh_review_decision_handoff_validated_for_retry_save',
			'fresh_review_decision_consumption_accepted_for_retry_save',
			'fresh_review_decision_eligible_for_retry_save_handoff',
		].includes( result );

	if ( accepted ) {
		return normalizeDistributedEditingSessionState( {
			...normalizedCurrent,
			localUpdatesImportFreshReviewRetrySaveHandoffStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			localUpdatesImportFreshReviewRetrySaveHandoffReason: null,
			localUpdatesImportFreshReviewRetrySaveHandoffResult: result,
			localUpdatesImportFreshReviewRetrySaveHandoffRestRoute: restRoute,
			localUpdatesImportFreshReviewRequestRecordId:
				freshReviewRequestRecordId,
			localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion:
				clientBaseVersion,
			localUpdatesImportFreshReviewRetrySaveHandoffServerVersion:
				serverVersion,
			localUpdatesImportFreshReviewRetrySaveHandoffHashEvidenceStatus:
				'accepted',
			localUpdatesImportFreshReviewDecisionReviewedBlockItemCount:
				reviewedBlockItemCount,
			retrySaveFreshReviewConsumeValidationStatus:
				'accepted_for_retry_save',
			retrySaveFreshReviewConsumeValidationReason: null,
			retrySaveFreshReviewConsumeValidationResult: result,
			retrySaveFreshReviewConsumeValidationRestRoute: restRoute,
			retrySaveFreshReviewConsumeValidationAccepted: true,
			retrySaveFreshReviewDecisionConsumptionValidated: true,
			retrySaveFreshReviewDecisionEligibleForRetrySave: true,
			retrySaveFreshReviewRequestRecordId: freshReviewRequestRecordId,
			retrySaveFreshReviewRequestStatus: 'decision_recorded',
			retrySaveFreshReviewDecisionStatus: 'approved',
			retrySaveFreshReviewClientBaseVersion: clientBaseVersion,
			retrySaveFreshReviewServerVersion: serverVersion,
			retrySaveFreshReviewProposedContentHash:
				normalizedCurrent.localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash,
			retrySaveFreshReviewReviewedProposedContentHash:
				normalizedCurrent.localUpdatesImportFreshReviewRetrySaveHandoffReviewedProposedContentHash,
			retrySaveFreshReviewCandidateContentHash:
				normalizedCurrent.localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash,
			retrySaveFreshReviewReviewedCandidateContentHash:
				normalizedCurrent.localUpdatesImportFreshReviewRetrySaveHandoffReviewedCandidateContentHash,
			retrySaveFreshReviewReviewedBlockItemCount: reviewedBlockItemCount,
			retrySaveFreshReviewHashEvidenceStatus: 'accepted',
			retrySaveFreshReviewRawContentIncluded: false,
			retrySaveFreshReviewExposesRawContent: false,
			retrySaveFreshReviewExposesReviewerIds: false,
			retrySaveFreshReviewSavesPost: false,
			retrySaveFreshReviewMutatesPostContent: false,
			retrySaveFreshReviewCreatesRevision: false,
			retrySaveFreshReviewClaimsSaved: false,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	}

	const reasonCode = normalizeNullableString(
		getFirstDefined(
			responseOrError.code,
			responseOrError.reasonCode,
			responseOrError.reason_code,
			responseData.reasonCode,
			responseData.reason_code
		)
	);
	const detail = normalizeNullableString(
		getFirstDefined( responseOrError.detail, responseData.detail, result )
	);

	return normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		localUpdatesImportFreshReviewRetrySaveHandoffStatus:
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.BLOCKED,
		localUpdatesImportFreshReviewRetrySaveHandoffReason:
			getFreshReviewRetrySaveHandoffReasonFromResponse(
				reasonCode,
				detail
			) ||
			reasonCode ||
			result,
		localUpdatesImportFreshReviewRetrySaveHandoffResult: result,
		localUpdatesImportFreshReviewRetrySaveHandoffRestRoute: restRoute,
		localUpdatesImportFreshReviewRequestRecordId:
			freshReviewRequestRecordId,
		localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion:
			clientBaseVersion,
		localUpdatesImportFreshReviewRetrySaveHandoffServerVersion:
			serverVersion,
		localUpdatesImportFreshReviewRetrySaveHandoffHashEvidenceStatus:
			result || reasonCode ? 'rejected' : null,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
}

/**
 * Returns editor state after receiving support-safe fresh-review lifecycle
 * evidence. This is response normalization only; it does not call REST, save,
 * retry-save, dispatch notices, mutate content, expose private identity, or
 * change post locks.
 *
 * @param {Object} responseOrError     REST-like response or API error.
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForFreshReviewLifecycleRetrievalResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const normalizedCurrent =
		normalizeDistributedEditingSessionState( currentSessionState );
	const responseData = getDistributedEditingResponseData( responseOrError );
	const response = {
		...responseData,
		...responseOrError,
		localUpdatesImportFreshReviewLifecycleRetrievalStatus:
			responseOrError.freshReviewLifecycleDebugAvailable === true ||
			responseOrError.fresh_review_lifecycle_debug_available === true ||
			responseData.freshReviewLifecycleDebugAvailable === true ||
			responseData.fresh_review_lifecycle_debug_available === true
				? DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.AVAILABLE
				: DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.UNAVAILABLE,
		localUpdatesImportFreshReviewLifecycleResult: getFirstDefined(
			responseOrError.result,
			responseData.result
		),
		localUpdatesImportFreshReviewLifecycleRestRoute: getFirstDefined(
			responseOrError.restRoute,
			responseOrError.rest_route,
			responseData.restRoute,
			responseData.rest_route
		),
		localUpdatesImportFreshReviewDebugContract: getFirstDefined(
			responseOrError.freshReviewDebugContract,
			responseOrError.fresh_review_debug_contract,
			responseData.freshReviewDebugContract,
			responseData.fresh_review_debug_contract
		),
		localUpdatesImportFreshReviewRequestRecord: getFirstDefined(
			responseOrError.freshReviewRequestRecord,
			responseOrError.fresh_review_request_record,
			responseData.freshReviewRequestRecord,
			responseData.fresh_review_request_record
		),
		localUpdatesImportFreshReviewLifecycleDebugAvailable: getFirstDefined(
			responseOrError.freshReviewLifecycleDebugAvailable,
			responseOrError.fresh_review_lifecycle_debug_available,
			responseData.freshReviewLifecycleDebugAvailable,
			responseData.fresh_review_lifecycle_debug_available
		),
		localUpdatesImportFreshReviewSupportEvidenceAvailable: getFirstDefined(
			responseOrError.freshReviewSupportEvidenceAvailable,
			responseOrError.fresh_review_support_evidence_available,
			responseData.freshReviewSupportEvidenceAvailable,
			responseData.fresh_review_support_evidence_available
		),
	};
	const lifecycleFields = normalizeFreshReviewLifecycleFields( response );
	const hasProtectedLocalChanges = Boolean(
		normalizedCurrent.hasPendingChanges ||
			normalizedCurrent.mustOfferLocalCopy ||
			normalizedCurrent.canExportLocalUpdates
	);

	return normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		...lifecycleFields,
		...( hasProtectedLocalChanges
			? {
					mustOfferLocalCopy: true,
					canExportLocalUpdates: true,
			  }
			: {} ),
	} );
}

/**
 * Returns editor state after loading hash-only reviewed-block evidence for a
 * requested fresh review. This only prepares an internal decision panel.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 * @param {Object} decision            Decision evidence inputs.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForFreshReviewDecisionItems(
	currentSessionState = {},
	decision = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );

	if (
		! normalized.localUpdatesImportRequiresFreshReview ||
		normalized.localUpdatesImportReviewRequestStatus !==
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED
	) {
		return normalized;
	}

	return normalizeDistributedEditingSessionState( {
		...normalized,
		localUpdatesImportFreshReviewDecisionStatus:
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
		localUpdatesImportFreshReviewDecisionReason: normalizeNullableString(
			decision.reason
		),
		localUpdatesImportFreshReviewDecisionItems:
			decision.reviewItems ||
			decision.reviewedBlockItems ||
			decision.items ||
			[],
		localUpdatesImportFreshReviewDecisionPanelRequired: true,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
}

/**
 * Returns editor state after one fresh-review decision is approved or rejected.
 * The state remains proof-opaque and no-write.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 * @param {Object} resolution          Review decision data.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForFreshReviewDecisionItemResolution(
	currentSessionState = {},
	resolution = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );
	const reviewItemId = normalizeNullableString(
		resolution.reviewItemId || resolution.id
	);
	const decision = normalizeFreshReviewLocalDecision(
		getFirstDefined(
			resolution.decision,
			resolution.reviewDecision,
			resolution.review_decision
		)
	);

	if (
		! normalized.localUpdatesImportRequiresFreshReview ||
		normalized.localUpdatesImportReviewRequestStatus !==
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED ||
		! reviewItemId ||
		! decision
	) {
		return normalized;
	}

	const reviewItems =
		normalized.localUpdatesImportFreshReviewDecisionItems.map( ( item ) => {
			if ( item.id !== reviewItemId ) {
				return item;
			}

			const reviewStatus =
				decision === 'rejected'
					? DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED
					: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE;

			return normalizeFreshReviewDecisionItem( {
				...item,
				reviewStatus,
				reviewedProposedContentHash:
					resolution.reviewedProposedContentHash ||
					resolution.reviewed_proposed_content_hash ||
					item.reviewedProposedContentHash ||
					item.proposedContentHash,
				rejectionReason:
					reviewStatus ===
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED
						? resolution.rejectionReason ||
						  resolution.rejection_reason ||
						  'reviewer_rejected'
						: null,
			} );
		} );

	return normalizeDistributedEditingSessionState( {
		...normalized,
		localUpdatesImportFreshReviewDecisionItems: reviewItems,
		localUpdatesImportFreshReviewDecisionPanelRequired: true,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
}

function normalizeFreshReviewLocalDecision( decision ) {
	const normalizedDecision = normalizeNullableString( decision );

	if (
		[
			'approve',
			'approved',
			'approved_for_retry_save',
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
		].includes( normalizedDecision )
	) {
		return 'approved';
	}

	if ( [ 'reject', 'rejected' ].includes( normalizedDecision ) ) {
		return 'rejected';
	}

	return null;
}

/**
 * Returns editor state for a server-backed fresh-review decision response or
 * error. The result remains proof-opaque and must not imply a save.
 *
 * @param {Object} responseOrError     REST response or API error.
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForFreshReviewDecisionResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const normalizedCurrent =
		normalizeDistributedEditingSessionState( currentSessionState );
	const responseData = getDistributedEditingResponseData( responseOrError );
	const result = normalizeNullableString(
		getFirstDefined( responseOrError.result, responseData.result )
	);
	const decision = normalizeNullableString(
		getFirstDefined(
			responseOrError.freshReviewDecision,
			responseOrError.fresh_review_decision,
			responseData.freshReviewDecision,
			responseData.fresh_review_decision
		)
	);
	const restRoute = normalizeNullableString(
		getFirstDefined(
			responseOrError.restRoute,
			responseOrError.rest_route,
			responseData.restRoute,
			responseData.rest_route
		)
	);
	const requestStatus = normalizeNullableString(
		getFirstDefined(
			responseOrError.freshReviewRequestStatus,
			responseOrError.fresh_review_request_status,
			responseData.freshReviewRequestStatus,
			responseData.fresh_review_request_status
		)
	);
	const requestRecordId =
		normalizeNullableString(
			getFirstDefined(
				responseOrError.freshReviewRequestRecordId,
				responseOrError.fresh_review_request_record_id,
				responseData.freshReviewRequestRecordId,
				responseData.fresh_review_request_record_id,
				responseOrError.freshReviewRequestRecord?.publicRecordId,
				responseOrError.fresh_review_request_record?.public_record_id,
				responseData.freshReviewRequestRecord?.publicRecordId,
				responseData.fresh_review_request_record?.public_record_id
			)
		) || normalizedCurrent.localUpdatesImportFreshReviewRequestRecordId;
	const pendingChangeCount =
		normalizeCount(
			getFirstDefined(
				responseOrError.pendingChangeCount,
				responseOrError.pending_change_count,
				responseData.pendingChangeCount,
				responseData.pending_change_count
			)
		) || normalizedCurrent.pendingChangeCount;
	const serverVersion =
		normalizeNullableString(
			getFirstDefined(
				responseOrError.serverVersion,
				responseOrError.server_version,
				responseData.serverVersion,
				responseData.server_version
			)
		) || normalizedCurrent.serverVersion;
	const clientBaseVersion =
		normalizeNullableString(
			getFirstDefined(
				responseOrError.clientBaseVersion,
				responseOrError.client_base_version,
				responseData.clientBaseVersion,
				responseData.client_base_version
			)
		) || normalizedCurrent.clientBaseVersion;
	const reviewedBlockItemCount = normalizeCount(
		getFirstDefined(
			responseOrError.reviewedBlockItemCount,
			responseOrError.reviewed_block_item_count,
			responseData.reviewedBlockItemCount,
			responseData.reviewed_block_item_count,
			normalizedCurrent.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount
		)
	);
	const accepted =
		responseOrError.freshReviewDecisionAccepted === true ||
		responseOrError.fresh_review_decision_accepted === true ||
		responseData.freshReviewDecisionAccepted === true ||
		responseData.fresh_review_decision_accepted === true ||
		result === 'fresh_review_decision_approved_for_retry_save' ||
		result === 'fresh_review_decision_rejected_for_author_revision' ||
		result === 'fresh_review_decision_recorded';

	if ( accepted ) {
		return normalizeDistributedEditingSessionState( {
			...normalizedCurrent,
			serverVersion,
			clientBaseVersion,
			pendingChangeCount,
			hasPendingChanges: pendingChangeCount > 0,
			isAwaitingServerConfirmation: pendingChangeCount > 0,
			localUpdatesImportReviewRequestStatus:
				requestStatus ||
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
			localUpdatesImportFreshReviewRequestRecordId: requestRecordId,
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
			localUpdatesImportFreshReviewDecisionResult: result,
			localUpdatesImportFreshReviewDecisionRestRoute:
				restRoute || 'post_fresh_review_decision',
			localUpdatesImportFreshReviewDecisionAccepted: true,
			localUpdatesImportFreshReviewDecisionSubmitted: true,
			localUpdatesImportFreshReviewDecisionDecision: decision,
			localUpdatesImportFreshReviewDecisionReviewedBlockItemCount:
				reviewedBlockItemCount,
			localUpdatesImportFreshReviewDecisionSavesPost: false,
			localUpdatesImportFreshReviewDecisionCallsNormalSavePost: false,
			localUpdatesImportFreshReviewDecisionCallsRetrySaveEndpoint: false,
			localUpdatesImportFreshReviewDecisionDispatchesNotice: false,
			localUpdatesImportFreshReviewDecisionMutatesEditorContent: false,
			localUpdatesImportFreshReviewDecisionMutatesPersistedPostContent: false,
			localUpdatesImportFreshReviewDecisionChangesPostLock: false,
			localUpdatesImportFreshReviewDecisionClaimsSaved: false,
			localUpdatesImportFreshReviewDecisionRawContentIncluded: false,
			localUpdatesImportFreshReviewDecisionExposesRawContent: false,
			localUpdatesImportFreshReviewDecisionExposesProofSignature: false,
			localUpdatesImportFreshReviewDecisionExposesReviewerIds: false,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	}

	const reasonCode = normalizeNullableString(
		getFirstDefined(
			responseOrError.code,
			responseOrError.reasonCode,
			responseOrError.reason_code,
			responseData.reasonCode,
			responseData.reason_code
		)
	);
	const detail = normalizeNullableString(
		getFirstDefined(
			responseOrError.detail,
			responseData.detail,
			responseOrError.errorDetail,
			responseData.errorDetail
		)
	);

	return normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		disposition:
			reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED
				? DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION
				: normalizedCurrent.disposition,
		reasonCode: reasonCode || normalizedCurrent.reasonCode,
		serverVersion,
		clientBaseVersion,
		pendingChangeCount,
		localUpdatesImportFreshReviewDecisionStatus:
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.REJECTED,
		localUpdatesImportFreshReviewDecisionReason:
			reasonCode || detail || result,
		localUpdatesImportFreshReviewDecisionResult: result,
		localUpdatesImportFreshReviewDecisionRestRoute:
			restRoute || 'post_fresh_review_decision',
		localUpdatesImportFreshReviewRequestRecordId: requestRecordId,
		localUpdatesImportFreshReviewDecisionAccepted: false,
		localUpdatesImportFreshReviewDecisionSubmitted: false,
		localUpdatesImportFreshReviewDecisionSavesPost: false,
		localUpdatesImportFreshReviewDecisionCallsNormalSavePost: false,
		localUpdatesImportFreshReviewDecisionCallsRetrySaveEndpoint: false,
		localUpdatesImportFreshReviewDecisionDispatchesNotice: false,
		localUpdatesImportFreshReviewDecisionMutatesEditorContent: false,
		localUpdatesImportFreshReviewDecisionMutatesPersistedPostContent: false,
		localUpdatesImportFreshReviewDecisionChangesPostLock: false,
		localUpdatesImportFreshReviewDecisionClaimsSaved: false,
		localUpdatesImportFreshReviewDecisionRawContentIncluded: false,
		localUpdatesImportFreshReviewDecisionExposesRawContent: false,
		localUpdatesImportFreshReviewDecisionExposesProofSignature: false,
		localUpdatesImportFreshReviewDecisionExposesReviewerIds: false,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
}

/**
 * Builds hash-only reviewed-block decision evidence for a future fresh-review
 * proof endpoint. It does not include raw content or reviewer identity.
 *
 * @param {Object} sessionState Current DE-RTC session state.
 * @param {Object} [options]    Optional explicit source items.
 *
 * @return {Array} Hash-only reviewed block decision items.
 */
export function getDistributedEditingReviewedBlockItemsForFreshReviewDecision(
	sessionState = {},
	options = {}
) {
	const sourceItems = Array.isArray( options.reviewedBlockItems )
		? normalizeFreshReviewDecisionItems( options.reviewedBlockItems )
		: normalizeDistributedEditingSessionState( sessionState )
				.localUpdatesImportFreshReviewDecisionItems;

	return getFreshReviewDecisionReviewedBlockItemsFromItems( sourceItems );
}

function getDistributedEditingReviewTokenRecoveryReasonFromRetrySave( {
	retrySaveStatus,
	retrySaveReason,
} ) {
	if (
		retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD &&
		retrySaveReason ===
			DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_REJECTION_DETAILS.UNKNOWN
	) {
		return DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_REASONS.TOKEN_UNAVAILABLE;
	}

	if (
		retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED &&
		retrySaveReason ===
			DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_REJECTION_DETAILS.EXPIRED
	) {
		return DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_REASONS.TOKEN_EXPIRED;
	}

	return null;
}

function getFreshReviewRetrySaveHandoffReasonFromResponse(
	reasonCode,
	detail = null
) {
	switch ( reasonCode ) {
		case DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED:
			return DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.STALE_BASE_REJECTED;
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED:
			return DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.FEATURE_DISABLED;
		case DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT:
			return DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.PERMISSION_DENIED;
		case DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID:
			return DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.ROUTE_MISMATCH;
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED:
			return detail === 'fresh_review_consume_hash_evidence_mismatch'
				? DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.HASH_MISMATCH
				: DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.MALFORMED_SYNC_PAYLOAD;
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD:
			return detail ===
				'fresh_review_decision_not_approved_for_retry_save'
				? DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.FRESH_REVIEW_DECISION_REJECTED
				: DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.MALFORMED_SYNC_PAYLOAD;
	}

	return null;
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
	const normalizedSessionState =
		normalizeDistributedEditingSessionState( sessionState );
	const acceptedReviewApprovalProof =
		getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
			normalizedSessionState
		);
	const acceptedReviewApprovalProofEnvelope =
		getDistributedEditingReviewApprovalProofEnvelope(
			acceptedReviewApprovalProof
		);
	const proofServerVersion =
		normalizedSessionState.retrySaveReviewApprovalServerVersion ||
		normalizedSessionState.serverVersion;
	const proofClientBaseVersion =
		normalizedSessionState.retrySaveReviewApprovalRebasedFromVersion ||
		normalizedSessionState.clientBaseVersion;
	const reviewTokenRecovery =
		getDistributedEditingReviewTokenRecoveryExportPayload(
			normalizedSessionState
		);

	return {
		version: 1,
		format: DISTRIBUTED_EDITING_LOCAL_UPDATES_EXPORT_FORMAT,
		post: {
			id: currentPost?.id ?? null,
			type: currentPost?.type ?? null,
		},
		postContent:
			typeof editedPostContent === 'string' ? editedPostContent : '',
		pendingChangeCount: normalizedSessionState.pendingChangeCount,
		...( ( acceptedReviewApprovalProofEnvelope || reviewTokenRecovery ) &&
		proofServerVersion
			? { serverVersion: proofServerVersion }
			: {} ),
		...( ( acceptedReviewApprovalProofEnvelope || reviewTokenRecovery ) &&
		proofClientBaseVersion
			? { clientBaseVersion: proofClientBaseVersion }
			: {} ),
		...( reviewTokenRecovery ? { reviewTokenRecovery } : {} ),
		acceptedReviewApprovalProof: acceptedReviewApprovalProofEnvelope,
	};
}

function getDistributedEditingReviewTokenRecoveryExportPayload(
	sessionState = {}
) {
	const recoveryState =
		getDistributedEditingReviewTokenRecoveryStateForSessionState(
			sessionState
		);

	if ( ! recoveryState.requiresFreshReview ) {
		return null;
	}

	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return {
		status: recoveryState.status,
		reason: recoveryState.reason,
		requiresFreshReview: true,
		canExportLocalUpdates: recoveryState.canExportLocalUpdates,
		serverVersion: normalized.serverVersion,
		clientBaseVersion: normalized.clientBaseVersion,
	};
}

function getDistributedEditingReviewApprovalProofEnvelope( proof ) {
	if ( ! proof ) {
		return null;
	}

	const envelopeType = getReviewApprovalProofEnvelopeType( proof );

	if ( envelopeType ) {
		return normalizeReviewApprovalProofEnvelope( proof );
	}

	return {
		proof_envelope_type:
			DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE,
		proof,
	};
}

function getReviewApprovalProofEnvelopeType( proofOrEnvelope ) {
	const object = normalizeObject( proofOrEnvelope );

	return normalizeNullableString(
		getFirstDefined( object.proofEnvelopeType, object.proof_envelope_type )
	);
}

function isOpaqueReviewApprovalProofTokenEnvelope( proofOrEnvelope ) {
	return (
		getReviewApprovalProofEnvelopeType( proofOrEnvelope ) ===
		DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE
	);
}

function normalizeReviewApprovalProofEnvelope( proofOrEnvelope ) {
	const object = normalizeObject( proofOrEnvelope );
	const envelopeType = getReviewApprovalProofEnvelopeType( object );

	if (
		envelopeType === DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE
	) {
		const proof = normalizeObject( object.proof );

		return Object.keys( proof ).length > 0
			? {
					proof_envelope_type:
						DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE,
					proof,
			  }
			: null;
	}

	if (
		envelopeType !==
		DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE
	) {
		return null;
	}

	if ( containsRawContentEvidence( object ) ) {
		return null;
	}

	const token = normalizeNullableString(
		getFirstDefined(
			object.token,
			object.proofToken,
			object.proof_token,
			object.reviewApprovalProofToken,
			object.review_approval_proof_token
		)
	);

	if ( ! token ) {
		return null;
	}

	const tokenVersion = normalizeNullableInteger(
		getFirstDefined( object.tokenVersion, object.token_version )
	);
	const post = normalizeReviewApprovalProofEnvelopePost(
		getFirstDefined( object.post, object.postRoute, object.post_route, {
			id: getFirstDefined( object.postId, object.post_id ),
			type: getFirstDefined( object.postType, object.post_type ),
		} )
	);
	const issuedAt = normalizeNullableInteger(
		getFirstDefined( object.issuedAt, object.issued_at )
	);
	const expiresAt = normalizeNullableInteger(
		getFirstDefined( object.expiresAt, object.expires_at )
	);

	return {
		proof_envelope_type:
			DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE,
		token,
		...( tokenVersion ? { token_version: tokenVersion } : {} ),
		...( issuedAt ? { issued_at: issuedAt } : {} ),
		...( expiresAt ? { expires_at: expiresAt } : {} ),
		...( post ? { post } : {} ),
	};
}

function normalizeReviewApprovalProofEnvelopePost( post ) {
	const normalizedPost = normalizeObject( post );
	const id = normalizeNullableInteger( normalizedPost.id );
	const type = normalizeNullableString( normalizedPost.type );

	if ( ! id && ! type ) {
		return null;
	}

	return {
		...( id ? { id } : {} ),
		...( type ? { type } : {} ),
	};
}

function getReviewApprovalProofFromProofOrEnvelope( proofOrEnvelope ) {
	const envelope = normalizeReviewApprovalProofEnvelope( proofOrEnvelope );

	if (
		envelope?.proof_envelope_type ===
		DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE
	) {
		return normalizeObject( envelope.proof );
	}

	if ( envelope ) {
		return {};
	}

	return normalizeObject( proofOrEnvelope );
}

function getReviewApprovalProofEnvelopeMetadata( proofOrEnvelope ) {
	const envelope = normalizeReviewApprovalProofEnvelope( proofOrEnvelope );

	if (
		envelope?.proof_envelope_type !==
		DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE
	) {
		return {};
	}

	return {
		post_id: envelope.post?.id,
		post_type: envelope.post?.type,
		issued_at: envelope.issued_at,
		expires_at: envelope.expires_at,
	};
}

function getPreferredReviewApprovalProofOrEnvelope( ...proofOrEnvelopes ) {
	const candidates = proofOrEnvelopes
		.map( ( proofOrEnvelope ) =>
			proofOrEnvelope === undefined || proofOrEnvelope === null
				? null
				: proofOrEnvelope
		)
		.filter( Boolean );
	const opaqueEnvelope = candidates
		.map( normalizeReviewApprovalProofEnvelope )
		.find( isOpaqueReviewApprovalProofTokenEnvelope );

	if ( opaqueEnvelope ) {
		return opaqueEnvelope;
	}

	const fieldBasedEnvelope = candidates
		.map( normalizeReviewApprovalProofEnvelope )
		.find(
			( envelope ) =>
				envelope?.proof_envelope_type ===
				DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE
		);

	if ( fieldBasedEnvelope ) {
		return fieldBasedEnvelope;
	}

	return candidates.map( normalizeObject ).find( ( candidate ) => {
		return ! getReviewApprovalProofEnvelopeType( candidate );
	} );
}

function containsRawContentEvidence( value ) {
	if ( Array.isArray( value ) ) {
		return value.some( containsRawContentEvidence );
	}

	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	const forbiddenRawContentKeys = new Set( [
		'rawContent',
		'raw_content',
		'postContent',
		'post_content',
		'proposedPostContent',
		'proposed_post_content',
		'reviewedPostContent',
		'reviewed_post_content',
		'candidatePostContent',
		'candidate_post_content',
		'blockContent',
		'block_content',
		'rawBlockContent',
		'raw_block_content',
	] );

	for ( const [ key, nestedValue ] of Object.entries( value ) ) {
		if ( forbiddenRawContentKeys.has( key ) ) {
			return true;
		}

		if (
			[
				'rawContentIncluded',
				'raw_content_included',
				'exposesRawContent',
				'exposes_raw_content',
			].includes( key ) &&
			Boolean( nestedValue )
		) {
			return true;
		}

		if ( containsRawContentEvidence( nestedValue ) ) {
			return true;
		}
	}

	return false;
}

function exposesDistributedEditingSessionState( payload ) {
	return [
		'distributedEditingSessionState',
		'distributed_editing_session_state',
		'sessionState',
		'session_state',
		'normalizedSessionState',
		'normalized_session_state',
		'editorState',
		'editor_state',
	].some( ( key ) => hasOwnProperty( payload, key ) );
}

function isFreshReviewRequiredLocalUpdatesImportPayload( payload ) {
	const reviewTokenRecovery = normalizeObject(
		getFirstDefined(
			payload.reviewTokenRecovery,
			payload.review_token_recovery
		)
	);

	return (
		reviewTokenRecovery.status ===
			DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.FRESH_REVIEW_REQUIRED ||
		Boolean(
			getFirstDefined(
				reviewTokenRecovery.requiresFreshReview,
				reviewTokenRecovery.requires_fresh_review
			)
		)
	);
}

function getDistributedEditingSessionStateFromLocalUpdatesImportPayload(
	payload
) {
	const pendingChangeCount = normalizeCount(
		getFirstDefined(
			payload.pendingChangeCount,
			payload.pending_change_count
		)
	);
	const acceptedReviewApprovalProof =
		getAcceptedReviewApprovalProofFromLocalUpdatesImportPayload( payload );

	if (
		! acceptedReviewApprovalProof ||
		Object.keys( acceptedReviewApprovalProof ).length === 0
	) {
		return normalizeDistributedEditingSessionState( {
			pendingChangeCount,
		} );
	}

	const proofFields =
		getRetrySaveReviewApprovalProofFieldsFromResponseOrError(
			{
				acceptedReviewApprovalProof,
				serverVersion: getFirstDefined(
					payload.serverVersion,
					payload.server_version,
					payload.acceptedProofServerVersion,
					payload.accepted_proof_server_version
				),
				rebasedFromVersion: getFirstDefined(
					payload.rebasedFromVersion,
					payload.rebased_from_version,
					payload.clientBaseVersion,
					payload.client_base_version
				),
				proposedPostContentHash: getFirstDefined(
					payload.proposedPostContentHash,
					payload.proposed_post_content_hash
				),
			},
			{},
			{}
		);

	return normalizeDistributedEditingSessionState( {
		pendingChangeCount,
		serverVersion: proofFields.retrySaveReviewApprovalServerVersion,
		clientBaseVersion:
			proofFields.retrySaveReviewApprovalRebasedFromVersion,
		...proofFields,
		retrySaveReviewApprovalProofStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
		retrySaveReviewApprovalAccepted: true,
	} );
}

function getAcceptedReviewApprovalProofFromLocalUpdatesImportPayload(
	payload
) {
	return getPreferredReviewApprovalProofOrEnvelope(
		payload.acceptedReviewApprovalProof,
		payload.accepted_review_approval_proof,
		payload.reviewApprovalProof,
		payload.review_approval_proof,
		payload.proof
	);
}

/**
 * Computes the SHA-256 hash WordPress uses for DE-RTC post-content evidence.
 *
 * @param {string} postContent Serialized post content.
 *
 * @return {Promise<string|null>} Lowercase hex SHA-256 hash, or null if unavailable.
 */
export async function getDistributedEditingPostContentSha256Hash(
	postContent = ''
) {
	const crypto = globalThis?.crypto;
	const subtle = crypto?.subtle;

	if ( ! subtle || typeof globalThis.TextEncoder !== 'function' ) {
		return null;
	}

	const bytes = new globalThis.TextEncoder().encode(
		typeof postContent === 'string' ? postContent : ''
	);
	const digest = await subtle.digest( 'SHA-256', bytes );

	return Array.from( new Uint8Array( digest ) )
		.map( ( byte ) => byte.toString( 16 ).padStart( 2, '0' ) )
		.join( '' );
}

/**
 * Validates a local-updates handoff payload before an admin import edits state.
 *
 * The result is pure data. It does not edit content, save, dispatch notices,
 * call REST, persist editor state, or change post locks.
 *
 * @param {Object} args                         Import inputs.
 * @param {Object} args.payload                 Parsed local-updates payload.
 * @param {Object} args.currentPost             Current editor post.
 * @param {Object} args.currentSessionState     Current DE-RTC session state.
 * @param {string} args.computedPostContentHash SHA-256 of payload postContent.
 * @param {number} [args.now]                   Current Unix timestamp in seconds.
 *
 * @return {Object} Import result.
 */
export function getDistributedEditingLocalUpdatesImportResult( {
	payload = {},
	currentPost = {},
	currentSessionState = {},
	computedPostContentHash = null,
	now = Date.now() / 1000,
} = {} ) {
	const normalizedPayload = normalizeObject( payload );

	if (
		! normalizedPayload ||
		Object.keys( normalizedPayload ).length === 0
	) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MALFORMED_PAYLOAD,
			{ currentSessionState }
		);
	}

	if (
		normalizedPayload.version !== 1 ||
		normalizedPayload.format !==
			DISTRIBUTED_EDITING_LOCAL_UPDATES_EXPORT_FORMAT
	) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FORMAT_MISMATCH,
			{ currentSessionState }
		);
	}

	const payloadPost = normalizeObject( normalizedPayload.post );
	const postId = currentPost?.id ?? null;
	const postType = normalizeNullableString( currentPost?.type );
	const payloadPostId = payloadPost.id ?? null;
	const payloadPostType = normalizeNullableString( payloadPost.type );

	if (
		( postId !== null &&
			payloadPostId !== null &&
			payloadPostId !== postId ) ||
		( postType && payloadPostType && payloadPostType !== postType )
	) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_ROUTE_MISMATCH,
			{
				postId: payloadPostId,
				postType: payloadPostType,
				currentSessionState,
			}
		);
	}

	if ( typeof normalizedPayload.postContent !== 'string' ) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_POST_CONTENT,
			{
				postId: payloadPostId,
				postType: payloadPostType,
				currentSessionState,
			}
		);
	}

	if ( exposesDistributedEditingSessionState( normalizedPayload ) ) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXTRA_SESSION_STATE_OVEREXPOSED,
			{
				postId: payloadPostId,
				postType: payloadPostType,
				currentSessionState,
			}
		);
	}

	if ( isFreshReviewRequiredLocalUpdatesImportPayload( normalizedPayload ) ) {
		const reviewTokenRecovery = normalizeObject(
			getFirstDefined(
				normalizedPayload.reviewTokenRecovery,
				normalizedPayload.review_token_recovery
			)
		);

		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			{
				postId: payloadPostId,
				postType: payloadPostType,
				serverVersion: getFirstDefined(
					normalizedPayload.serverVersion,
					normalizedPayload.server_version,
					reviewTokenRecovery.serverVersion,
					reviewTokenRecovery.server_version
				),
				clientBaseVersion: getFirstDefined(
					normalizedPayload.clientBaseVersion,
					normalizedPayload.client_base_version,
					reviewTokenRecovery.clientBaseVersion,
					reviewTokenRecovery.client_base_version
				),
				pendingChangeCount: getFirstDefined(
					normalizedPayload.pendingChangeCount,
					normalizedPayload.pending_change_count
				),
				verifiedPostContentHash: computedPostContentHash,
				currentSessionState,
			}
		);
	}

	const importedSessionState =
		getDistributedEditingSessionStateFromLocalUpdatesImportPayload(
			normalizedPayload
		);
	const acceptedReviewApprovalProof =
		getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
			importedSessionState
		);
	const acceptedReviewApprovalProofEnvelope =
		normalizeReviewApprovalProofEnvelope( acceptedReviewApprovalProof );
	const hasOpaqueReviewApprovalProofToken =
		isOpaqueReviewApprovalProofTokenEnvelope(
			acceptedReviewApprovalProofEnvelope
		);

	if (
		! acceptedReviewApprovalProof ||
		( ! hasOpaqueReviewApprovalProofToken &&
			! acceptedReviewApprovalProof.proofSignature )
	) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_REVIEW_APPROVAL_PROOF,
			{
				postId: payloadPostId,
				postType: payloadPostType,
				currentSessionState,
			}
		);
	}

	const acceptedReviewApprovalProofPostId =
		acceptedReviewApprovalProofEnvelope?.post?.id !== undefined
			? String( acceptedReviewApprovalProofEnvelope.post.id )
			: acceptedReviewApprovalProof.postId;
	const acceptedReviewApprovalProofPostType =
		acceptedReviewApprovalProofEnvelope?.post?.type ||
		acceptedReviewApprovalProof.postType;

	if (
		( postId !== null &&
			acceptedReviewApprovalProofPostId !== null &&
			acceptedReviewApprovalProofPostId !== undefined &&
			acceptedReviewApprovalProofPostId !== String( postId ) ) ||
		( postType &&
			acceptedReviewApprovalProofPostType &&
			acceptedReviewApprovalProofPostType !== postType )
	) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_ROUTE_MISMATCH,
			{
				postId: payloadPostId,
				postType: payloadPostType,
				currentSessionState,
			}
		);
	}

	if (
		isAcceptedReviewApprovalProofExpired( acceptedReviewApprovalProof, now )
	) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXPIRED_REVIEW_APPROVAL_PROOF,
			{
				postId: payloadPostId,
				postType: payloadPostType,
				currentSessionState,
			}
		);
	}

	const expectedPostContentHash = normalizeSha256Hash(
		getFirstDefined(
			acceptedReviewApprovalProof.proposedPostContentHash,
			acceptedReviewApprovalProof.proposed_post_content_hash,
			acceptedReviewApprovalProofEnvelope?.proposed_post_content_hash,
			normalizedPayload.proposedPostContentHash,
			normalizedPayload.proposed_post_content_hash
		)
	);
	const verifiedPostContentHash = normalizeSha256Hash(
		computedPostContentHash
	);

	if (
		( ! expectedPostContentHash && ! hasOpaqueReviewApprovalProofToken ) ||
		( expectedPostContentHash && ! verifiedPostContentHash )
	) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_HASH_EVIDENCE,
			{
				postId: payloadPostId,
				postType: payloadPostType,
				currentSessionState,
			}
		);
	}

	if (
		expectedPostContentHash &&
		expectedPostContentHash !== verifiedPostContentHash
	) {
		return createLocalUpdatesImportBlockedResult(
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_CONTENT_HASH_MISMATCH,
			{
				postId: payloadPostId,
				postType: payloadPostType,
				verifiedPostContentHash,
				currentSessionState,
			}
		);
	}

	const importedForRetrySaveState = normalizeDistributedEditingSessionState( {
		...importedSessionState,
		disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
		reasonCode: null,
		serverVersion:
			importedSessionState.retrySaveReviewApprovalServerVersion ||
			importedSessionState.serverVersion,
		clientBaseVersion:
			importedSessionState.retrySaveReviewApprovalRebasedFromVersion ||
			importedSessionState.clientBaseVersion,
		pendingChangeCount: importedSessionState.pendingChangeCount || 1,
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
		retrySubmitSaveStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
		retrySubmitSaveReason: null,
		retrySubmitSavePrepared: true,
		retrySubmitSaveReady: true,
		retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
		retrySaveReason: null,
		retrySaveAccepted: false,
		retrySaveHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.NONE,
		retrySaveHandoffReason: null,
		retrySaveHandoffAllowsNormalSaveFallback: false,
		retrySaveHandoffBlocksNormalSave: false,
		requiresServerStateAcceptance: false,
		requiresServerStateRefetch: false,
		requiresManualConflictResolution: false,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
		localUpdatesImportStatus:
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
		localUpdatesImportReason: null,
		localUpdatesImportPostId:
			payloadPostId === null ? null : String( payloadPostId ),
		localUpdatesImportPostType: payloadPostType,
		localUpdatesImportHasPostContent: true,
		localUpdatesImportHasAcceptedReviewApprovalProof: true,
		localUpdatesImportVerifiedPostContentHash: verifiedPostContentHash,
	} );

	return {
		status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
		reason: null,
		postContent: normalizedPayload.postContent,
		hasPostContent: true,
		acceptedReviewApprovalProof,
		hasAcceptedReviewApprovalProof: true,
		computedPostContentHash: verifiedPostContentHash,
		sessionState: importedForRetrySaveState,
		mutatesEditorContent: true,
		callsRetrySaveEndpoint: false,
		callsNormalSavePost: false,
		dispatchesNotice: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

/**
 * Returns inert DE-RTC editor state for a fresh-review request response or
 * error. The request can only record hash/version request evidence; it must not
 * save, retry-save, mutate editor content, dispatch notices, persist state, or
 * change post locks.
 *
 * @param {Object} responseOrError     REST response or API error.
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForFreshReviewRequestResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const normalizedCurrent =
		normalizeDistributedEditingSessionState( currentSessionState );
	const responseData = getDistributedEditingResponseData( responseOrError );
	const result = normalizeNullableString(
		getFirstDefined( responseOrError.result, responseData.result )
	);
	const requestStatus = normalizeNullableString(
		getFirstDefined(
			responseOrError.freshReviewRequestStatus,
			responseOrError.fresh_review_request_status,
			responseData.freshReviewRequestStatus,
			responseData.fresh_review_request_status
		)
	);
	const requestAction = normalizeNullableString(
		getFirstDefined(
			responseOrError.freshReviewRequestAction,
			responseOrError.fresh_review_request_action,
			responseData.freshReviewRequestAction,
			responseData.fresh_review_request_action
		)
	);
	const restRoute = normalizeNullableString(
		getFirstDefined(
			responseOrError.restRoute,
			responseOrError.rest_route,
			responseData.restRoute,
			responseData.rest_route
		)
	);
	const requestRecordId = normalizeNullableString(
		getFirstDefined(
			responseOrError.freshReviewRequestRecordId,
			responseOrError.fresh_review_request_record_id,
			responseData.freshReviewRequestRecordId,
			responseData.fresh_review_request_record_id,
			responseOrError.freshReviewRequestRecord?.publicRecordId,
			responseOrError.fresh_review_request_record?.public_record_id,
			responseData.freshReviewRequestRecord?.publicRecordId,
			responseData.fresh_review_request_record?.public_record_id
		)
	);
	const pendingChangeCount =
		normalizeCount(
			getFirstDefined(
				responseOrError.pendingChangeCount,
				responseOrError.pending_change_count,
				responseData.pendingChangeCount,
				responseData.pending_change_count
			)
		) ||
		normalizedCurrent.pendingChangeCount ||
		( normalizedCurrent.hasPendingChanges ? 1 : 0 );
	const serverVersion =
		normalizeNullableString(
			getFirstDefined(
				responseOrError.serverVersion,
				responseOrError.server_version,
				responseData.serverVersion,
				responseData.server_version
			)
		) || normalizedCurrent.serverVersion;
	const clientBaseVersion =
		normalizeNullableString(
			getFirstDefined(
				responseOrError.clientBaseVersion,
				responseOrError.client_base_version,
				responseData.clientBaseVersion,
				responseData.client_base_version
			)
		) || normalizedCurrent.clientBaseVersion;
	const noWriteFlags = {
		localUpdatesImportFreshReviewRequestSavesPost: Boolean(
			getFirstDefined(
				responseOrError.savesPost,
				responseOrError.saves_post,
				responseData.savesPost,
				responseData.saves_post
			)
		),
		localUpdatesImportFreshReviewRequestMutatesPostContent: Boolean(
			getFirstDefined(
				responseOrError.mutatesPostContent,
				responseOrError.mutates_post_content,
				responseData.mutatesPostContent,
				responseData.mutates_post_content
			)
		),
		localUpdatesImportFreshReviewRequestCreatesRevision: Boolean(
			getFirstDefined(
				responseOrError.createsRevision,
				responseOrError.creates_revision,
				responseData.createsRevision,
				responseData.creates_revision
			)
		),
		localUpdatesImportFreshReviewRequestClaimsSaved: Boolean(
			getFirstDefined(
				responseOrError.claimsSaved,
				responseOrError.claims_saved,
				responseData.claimsSaved,
				responseData.claims_saved
			)
		),
	};
	const isRequestAccepted =
		result === 'fresh_review_request_accepted_for_admin_review' ||
		requestStatus === 'requested' ||
		responseOrError.freshReviewRequestAccepted === true ||
		responseOrError.fresh_review_request_accepted === true ||
		responseData.freshReviewRequestAccepted === true ||
		responseData.fresh_review_request_accepted === true;

	if ( isRequestAccepted ) {
		return normalizeDistributedEditingSessionState( {
			...normalizedCurrent,
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			serverVersion,
			clientBaseVersion,
			pendingChangeCount,
			hasPendingChanges: pendingChangeCount > 0,
			isAwaitingServerConfirmation: pendingChangeCount > 0,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
			localUpdatesImportReviewRequestReason: null,
			localUpdatesImportFreshReviewRequestResult: result,
			localUpdatesImportFreshReviewRequestAction:
				requestAction || 'request_admin_review',
			localUpdatesImportFreshReviewRequestRestRoute:
				restRoute || 'post_fresh_review_request',
			localUpdatesImportFreshReviewRequestRecordId: requestRecordId,
			localUpdatesImportFreshReviewRequestAccepted: true,
			localUpdatesImportFreshReviewRequestRequested: true,
			localUpdatesImportHasPostContent: false,
			localUpdatesImportHasAcceptedReviewApprovalProof: false,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
			retrySaveReason: null,
			retrySaveAccepted: false,
			retrySaveSavesPost: false,
			retrySaveMutatesPostContent: false,
			retrySaveCreatesRevision: false,
			retrySaveClaimsSaved: false,
			retrySaveRevisionCreated: false,
			retrySaveCreatedRevisionIds: [],
			localUpdatesImportFreshReviewRequestSavesPost: false,
			localUpdatesImportFreshReviewRequestMutatesPostContent: false,
			localUpdatesImportFreshReviewRequestCreatesRevision: false,
			localUpdatesImportFreshReviewRequestClaimsSaved: false,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	}

	const detail = normalizeNullableString(
		getFirstDefined(
			responseOrError.detail,
			responseData.detail,
			responseOrError.errorDetail,
			responseData.errorDetail
		)
	);
	const reasonCode = normalizeNullableString(
		getFirstDefined(
			responseOrError.code,
			responseOrError.reasonCode,
			responseOrError.reason_code,
			responseData.reasonCode,
			responseData.reason_code
		)
	);
	const rejectedRequestStatus =
		getDistributedEditingFreshReviewRequestRejectedStatus( reasonCode );
	const disposition =
		getDistributedEditingFreshReviewRequestRejectedDisposition(
			reasonCode,
			normalizedCurrent.disposition
		);

	return normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		disposition,
		reasonCode,
		serverVersion,
		clientBaseVersion,
		pendingChangeCount,
		hasPendingChanges: pendingChangeCount > 0,
		isAwaitingServerConfirmation: pendingChangeCount > 0,
		localUpdatesImportStatus:
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
		localUpdatesImportReason:
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
		localUpdatesImportReviewRequestStatus: rejectedRequestStatus,
		localUpdatesImportReviewRequestReason:
			reasonCode || detail || result || requestStatus,
		localUpdatesImportFreshReviewRequestResult: result,
		localUpdatesImportFreshReviewRequestAction:
			requestAction || 'request_admin_review',
		localUpdatesImportFreshReviewRequestRestRoute:
			restRoute || 'post_fresh_review_request',
		localUpdatesImportFreshReviewRequestRecordId:
			requestRecordId ||
			normalizedCurrent.localUpdatesImportFreshReviewRequestRecordId,
		localUpdatesImportFreshReviewRequestAccepted: false,
		localUpdatesImportFreshReviewRequestRequested: false,
		localUpdatesImportHasPostContent: false,
		localUpdatesImportHasAcceptedReviewApprovalProof: false,
		...noWriteFlags,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
}

function getDistributedEditingFreshReviewRequestRejectedStatus( reasonCode ) {
	switch ( reasonCode ) {
		case DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED:
			return DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.STALE_BASE_REJECTED;
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED:
			return DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_FEATURE_DISABLED;
		case DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT:
			return DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_PERMISSION_DENIED;
		case DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID:
			return DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_ROUTE_MISMATCH;
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED:
			return DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_SYNC_META_TAMPERED;
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD:
			return DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD;
	}

	return DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.FRESH_REVIEW_REQUIRED;
}

function getDistributedEditingFreshReviewRequestRejectedDisposition(
	reasonCode,
	fallbackDisposition
) {
	switch ( reasonCode ) {
		case DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED:
			return DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION;
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED:
			return DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_FEATURE_DISABLED;
		case DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT:
			return DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED;
		case DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID:
			return DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_ROUTE_MISMATCH;
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED:
			return DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED;
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD:
			return DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD;
	}

	return fallbackDisposition;
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
	const localUpdatesImportReviewRequest =
		getDistributedEditingLocalUpdatesImportReviewRequestStateForSessionState(
			normalized
		);
	const freshReviewPreSaveState =
		getDistributedEditingFreshReviewPreSaveStateForSessionState(
			normalized
		);

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

	if ( localUpdatesImportReviewRequest.requiresFreshReview ) {
		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED,
				status: getDistributedEditingLocalUpdatesImportReviewRequestNoticeStatus(
					localUpdatesImportReviewRequest.status
				),
				priority: 'blocking',
				actionKeys: [
					localUpdatesImportReviewRequest.actionKey,
				].filter( Boolean ),
				extra: {
					localUpdatesImportReviewRequestStatus:
						localUpdatesImportReviewRequest.status,
					localUpdatesImportReviewRequestReason:
						localUpdatesImportReviewRequest.requestReason,
					localUpdatesImportReviewActionKey:
						localUpdatesImportReviewRequest.actionKey,
					localUpdatesImportFreshReviewRequestAccepted:
						localUpdatesImportReviewRequest.requestAccepted,
					localUpdatesImportFreshReviewRequestRequested:
						localUpdatesImportReviewRequest.requestRequested,
					localUpdatesImportFreshReviewRequestResult:
						localUpdatesImportReviewRequest.requestResult,
					localUpdatesImportFreshReviewRequestAction:
						localUpdatesImportReviewRequest.requestAction,
					localUpdatesImportFreshReviewRequestRestRoute:
						localUpdatesImportReviewRequest.requestRestRoute,
					localUpdatesImportFreshReviewRequestRecordId:
						normalized.localUpdatesImportFreshReviewRequestRecordId,
					localUpdatesImportFreshReviewRequestSavesPost:
						localUpdatesImportReviewRequest.requestSavesPost,
					localUpdatesImportFreshReviewRequestMutatesPostContent:
						localUpdatesImportReviewRequest.requestMutatesPostContent,
					localUpdatesImportFreshReviewRequestCreatesRevision:
						localUpdatesImportReviewRequest.requestCreatesRevision,
					localUpdatesImportFreshReviewRequestClaimsSaved:
						localUpdatesImportReviewRequest.requestClaimsSaved,
					localUpdatesImportFreshReviewDecisionStatus:
						normalized.localUpdatesImportFreshReviewDecisionStatus,
					localUpdatesImportFreshReviewDecisionResult:
						normalized.localUpdatesImportFreshReviewDecisionResult,
					localUpdatesImportFreshReviewDecisionRestRoute:
						normalized.localUpdatesImportFreshReviewDecisionRestRoute,
					localUpdatesImportFreshReviewDecisionAccepted:
						normalized.localUpdatesImportFreshReviewDecisionAccepted,
					localUpdatesImportFreshReviewDecisionSubmitted:
						normalized.localUpdatesImportFreshReviewDecisionSubmitted,
					localUpdatesImportFreshReviewDecisionDecision:
						normalized.localUpdatesImportFreshReviewDecisionDecision,
					localUpdatesImportFreshReviewDecisionReason:
						normalized.localUpdatesImportFreshReviewDecisionReason,
					localUpdatesImportFreshReviewDecisionPanelRequired:
						normalized.localUpdatesImportFreshReviewDecisionPanelRequired,
					localUpdatesImportFreshReviewDecisionReady:
						normalized.localUpdatesImportFreshReviewDecisionReady,
					localUpdatesImportFreshReviewDecisionItemCount:
						normalized.localUpdatesImportFreshReviewDecisionItemCount,
					localUpdatesImportFreshReviewDecisionPendingCount:
						normalized.localUpdatesImportFreshReviewDecisionPendingCount,
					localUpdatesImportFreshReviewDecisionApprovedCount:
						normalized.localUpdatesImportFreshReviewDecisionApprovedCount,
					localUpdatesImportFreshReviewDecisionRejectedCount:
						normalized.localUpdatesImportFreshReviewDecisionRejectedCount,
					localUpdatesImportFreshReviewDecisionReviewedBlockItemCount:
						normalized.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount,
					localUpdatesImportFreshReviewRetrySaveHandoffStatus:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffStatus,
					localUpdatesImportFreshReviewRetrySaveHandoffReason:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffReason,
					localUpdatesImportFreshReviewRetrySaveHandoffResult:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffResult,
					localUpdatesImportFreshReviewRetrySaveHandoffRestRoute:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffRestRoute,
					localUpdatesImportFreshReviewRetrySaveHandoffReady:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffReady,
					localUpdatesImportFreshReviewRetrySaveHandoffValidating:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffValidating,
					localUpdatesImportFreshReviewRetrySaveHandoffAccepted:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffAccepted,
					freshReviewPreSaveStatus: freshReviewPreSaveState.status,
					freshReviewPreSaveReason: freshReviewPreSaveState.reason,
					freshReviewPreSavePlacement:
						freshReviewPreSaveState.placement,
					freshReviewPreSaveClickAction:
						freshReviewPreSaveState.clickAction,
					freshReviewPreSaveBlocksNormalSavePost:
						freshReviewPreSaveState.blocksNormalSavePost,
					freshReviewPreSaveOpensPrePublishReview:
						freshReviewPreSaveState.opensPrePublishReview,
					freshReviewPreSaveRequiresServerStateRefetch:
						freshReviewPreSaveState.requiresServerStateRefetch,
					freshReviewPreSaveCanExportLocalUpdates:
						freshReviewPreSaveState.canExportLocalUpdates,
					freshReviewPreSaveReviewListStatus:
						freshReviewPreSaveState.reviewListStatus,
					freshReviewPreSaveActionKeys:
						freshReviewPreSaveState.actionKeys,
					freshReviewLifecycleRetrievalStatus:
						freshReviewPreSaveState.lifecycleRetrievalStatus,
					freshReviewLifecycleStatus:
						freshReviewPreSaveState.lifecycleStatus,
					freshReviewLifecycleAction:
						freshReviewPreSaveState.lifecycleAction,
					freshReviewDecisionLifecycleStatus:
						freshReviewPreSaveState.decisionLifecycleStatus,
					freshReviewDecisionLifecycleAction:
						freshReviewPreSaveState.decisionLifecycleAction,
					freshReviewReviewerAuthorityStatus:
						freshReviewPreSaveState.reviewerAuthorityStatus,
					freshReviewRequiresFreshReviewDueToAuthority:
						freshReviewPreSaveState.requiresFreshReviewDueToAuthority,
					localUpdatesImportFreshReviewRetrySaveHandoffCallsNormalSavePost:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffCallsNormalSavePost,
					localUpdatesImportFreshReviewRetrySaveHandoffCallsRetrySaveEndpoint:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffCallsRetrySaveEndpoint,
					localUpdatesImportFreshReviewRetrySaveHandoffDispatchesNotice:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffDispatchesNotice,
					localUpdatesImportFreshReviewRetrySaveHandoffMutatesEditorContent:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffMutatesEditorContent,
					localUpdatesImportFreshReviewRetrySaveHandoffMutatesPersistedPostContent:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffMutatesPersistedPostContent,
					localUpdatesImportFreshReviewRetrySaveHandoffChangesPostLock:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffChangesPostLock,
					localUpdatesImportFreshReviewRetrySaveHandoffClaimsSaved:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffClaimsSaved,
					localUpdatesImportFreshReviewRetrySaveHandoffExposesRawContent:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffExposesRawContent,
					localUpdatesImportFreshReviewRetrySaveHandoffExposesProofSignature:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffExposesProofSignature,
					localUpdatesImportFreshReviewRetrySaveHandoffExposesReviewerIds:
						normalized.localUpdatesImportFreshReviewRetrySaveHandoffExposesReviewerIds,
					localUpdatesImportFreshReviewDecisionSavesPost:
						normalized.localUpdatesImportFreshReviewDecisionSavesPost,
					localUpdatesImportFreshReviewDecisionCallsNormalSavePost:
						normalized.localUpdatesImportFreshReviewDecisionCallsNormalSavePost,
					localUpdatesImportFreshReviewDecisionCallsRetrySaveEndpoint:
						normalized.localUpdatesImportFreshReviewDecisionCallsRetrySaveEndpoint,
					localUpdatesImportFreshReviewDecisionDispatchesNotice:
						normalized.localUpdatesImportFreshReviewDecisionDispatchesNotice,
					localUpdatesImportFreshReviewDecisionMutatesEditorContent:
						normalized.localUpdatesImportFreshReviewDecisionMutatesEditorContent,
					localUpdatesImportFreshReviewDecisionMutatesPersistedPostContent:
						normalized.localUpdatesImportFreshReviewDecisionMutatesPersistedPostContent,
					localUpdatesImportFreshReviewDecisionChangesPostLock:
						normalized.localUpdatesImportFreshReviewDecisionChangesPostLock,
					localUpdatesImportFreshReviewDecisionClaimsSaved:
						normalized.localUpdatesImportFreshReviewDecisionClaimsSaved,
					localUpdatesImportFreshReviewDecisionRawContentIncluded:
						normalized.localUpdatesImportFreshReviewDecisionRawContentIncluded,
					localUpdatesImportFreshReviewDecisionExposesRawContent:
						normalized.localUpdatesImportFreshReviewDecisionExposesRawContent,
					localUpdatesImportFreshReviewDecisionExposesProofSignature:
						normalized.localUpdatesImportFreshReviewDecisionExposesProofSignature,
					localUpdatesImportFreshReviewDecisionExposesReviewerIds:
						normalized.localUpdatesImportFreshReviewDecisionExposesReviewerIds,
					localUpdatesImportRequiresFreshReview:
						localUpdatesImportReviewRequest.requiresFreshReview,
					localUpdatesImportStatus:
						localUpdatesImportReviewRequest.localUpdatesImportStatus,
					localUpdatesImportReason:
						localUpdatesImportReviewRequest.localUpdatesImportReason,
					localUpdatesImportPostId:
						localUpdatesImportReviewRequest.localUpdatesImportPostId,
					localUpdatesImportPostType:
						localUpdatesImportReviewRequest.localUpdatesImportPostType,
					localUpdatesImportHasPostContent:
						localUpdatesImportReviewRequest.localUpdatesImportHasPostContent,
					localUpdatesImportHasAcceptedReviewApprovalProof:
						localUpdatesImportReviewRequest.localUpdatesImportHasAcceptedReviewApprovalProof,
					shouldCallRetrySaveEndpoint:
						localUpdatesImportReviewRequest.shouldCallRetrySaveEndpoint,
					shouldCallNormalSavePost:
						localUpdatesImportReviewRequest.shouldCallNormalSavePost,
					dispatchesNotice:
						localUpdatesImportReviewRequest.dispatchesNotice,
					mutatesEditorContent:
						localUpdatesImportReviewRequest.mutatesEditorContent,
					mutatesPersistedPostContent:
						localUpdatesImportReviewRequest.mutatesPersistedPostContent,
					changesPostLock:
						localUpdatesImportReviewRequest.changesPostLock,
					claimsSaved: localUpdatesImportReviewRequest.claimsSaved,
					exposesTokenInternals:
						localUpdatesImportReviewRequest.exposesTokenInternals,
					exposesProofSignature:
						localUpdatesImportReviewRequest.exposesProofSignature,
					exposesReviewedBlockItems:
						localUpdatesImportReviewRequest.exposesReviewedBlockItems,
					exposesReviewerIds:
						localUpdatesImportReviewRequest.exposesReviewerIds,
					exposesRawContent:
						localUpdatesImportReviewRequest.exposesRawContent,
					...( normalized.canExportLocalUpdates
						? {
								localUpdatesImportPreservesExportableLocalState: true,
						  }
						: {} ),
				},
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
	const acceptedReviewApprovalProof =
		getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
			normalized
		);
	const acceptedFreshReviewConsumeValidation =
		getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
			normalized
		);

	return {
		hasProtectedLocalChanges,
		hasServerRefetchEvidence,
		hasLocalRebaseEvidence,
		hasRetrySubmitHandoff,
		hasAcceptedRetrySubmitProof,
		hasRetrySavePreparation,
		hasAcceptedReviewApprovalProof: Boolean( acceptedReviewApprovalProof ),
		acceptedReviewApprovalReviewedBlockItemCount:
			acceptedReviewApprovalProof?.reviewedBlockItemCount ?? 0,
		hasAcceptedFreshReviewConsumeValidation: Boolean(
			acceptedFreshReviewConsumeValidation
		),
		acceptedFreshReviewRequestRecordId:
			acceptedFreshReviewConsumeValidation?.freshReviewRequestRecordId ??
			null,
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
		...getDistributedEditingRetrySaveReviewMetadataFields( normalized ),
		...getDistributedEditingRetrySaveReviewApprovalProofFields(
			normalized
		),
		...getDistributedEditingRetrySaveFreshReviewConsumeValidationFields(
			normalized
		),
	};
}

/**
 * Returns inert editor state for WordPress KSES risky-block classification.
 *
 * The WordPress helper returns hash-only block review items. This maps that
 * authority vocabulary into editor state for future annotations and
 * pre-publish review routing without saving, dispatching notices, exposing raw
 * block content, or changing post locks.
 *
 * @param {Object} responseOrError     WordPress KSES classification response or error.
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForKsesRiskyBlockReviewClassificationResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const normalizedCurrent =
		normalizeDistributedEditingSessionState( currentSessionState );
	const responseData = getDistributedEditingResponseData( responseOrError );
	const result = normalizeNullableString(
		getFirstDefined( responseOrError.result, responseData.result )
	);
	const reasonCode = normalizeNullableString(
		getFirstDefined(
			responseOrError.code,
			responseOrError.reasonCode,
			responseOrError.reason_code,
			responseData.reasonCode,
			responseData.reason_code
		)
	);
	const reviewItems = normalizeRiskyBlockReviewItems(
		getFirstDefined(
			responseOrError.reviewItems,
			responseOrError.review_items,
			responseData.reviewItems,
			responseData.review_items
		)
	);
	const pendingReviewItemCount = normalizeCountWithFallback(
		getFirstDefined(
			responseOrError.pendingReviewItemCount,
			responseOrError.pending_review_item_count,
			responseData.pendingReviewItemCount,
			responseData.pending_review_item_count
		),
		countRiskyBlockReviewItemsByStatus(
			reviewItems,
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW
		)
	);
	const prePublishReviewRequired = Boolean(
		getFirstDefined(
			responseOrError.prePublishReviewRequired,
			responseOrError.pre_publish_review_required,
			responseData.prePublishReviewRequired,
			responseData.pre_publish_review_required
		)
	);
	const rawContentRejected = result === 'raw_content_rejected';
	const reviewRequired =
		result === 'block_review_required' ||
		pendingReviewItemCount > 0 ||
		( prePublishReviewRequired && reviewItems.length > 0 );
	let riskyBlockReviewStatus =
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NO_REVIEW_REQUIRED;

	if ( rawContentRejected ) {
		riskyBlockReviewStatus =
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REJECTED_RAW_CONTENT;
	} else if ( reviewRequired ) {
		riskyBlockReviewStatus =
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED;
	}
	const serverVersion = normalizeNullableString(
		getFirstDefined(
			responseOrError.serverVersion,
			responseOrError.server_version,
			responseData.serverVersion,
			responseData.server_version
		)
	);
	const clientBaseVersion = normalizeNullableString(
		getFirstDefined(
			responseOrError.clientBaseVersion,
			responseOrError.client_base_version,
			responseData.clientBaseVersion,
			responseData.client_base_version
		)
	);
	const pendingChangeCount = reviewRequired
		? normalizedCurrent.pendingChangeCount || pendingReviewItemCount || 1
		: normalizedCurrent.pendingChangeCount;
	let disposition = normalizedCurrent.disposition;
	let normalizedReasonCode = normalizedCurrent.reasonCode;
	let riskyBlockReviewReasonCode = null;

	if ( rawContentRejected ) {
		disposition =
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED;
		normalizedReasonCode =
			reasonCode ||
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED;
		riskyBlockReviewReasonCode = normalizedReasonCode;
	} else if ( reviewRequired ) {
		disposition =
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED;
		normalizedReasonCode =
			reasonCode ||
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT;
		riskyBlockReviewReasonCode = normalizedReasonCode;
	}

	return normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		clientBaseVersion:
			clientBaseVersion || normalizedCurrent.clientBaseVersion,
		serverVersion: serverVersion || normalizedCurrent.serverVersion,
		disposition,
		reasonCode: normalizedReasonCode,
		pendingChangeCount,
		hasPendingChanges:
			normalizedCurrent.hasPendingChanges || reviewRequired,
		isAwaitingServerConfirmation:
			normalizedCurrent.isAwaitingServerConfirmation || reviewRequired,
		requiresManualConflictResolution:
			normalizedCurrent.requiresManualConflictResolution ||
			reviewRequired,
		riskyBlockReviewStatus,
		riskyBlockReviewReasonCode,
		riskyBlockReviewItems: reviewItems,
		riskyBlockReviewItemCount: normalizeCountWithFallback(
			getFirstDefined(
				responseOrError.reviewItemCount,
				responseOrError.review_item_count,
				responseData.reviewItemCount,
				responseData.review_item_count
			),
			reviewItems.length
		),
		riskyBlockReviewPendingCount: pendingReviewItemCount,
		riskyBlockReviewApprovedCount: 0,
		riskyBlockReviewRejectedCount: 0,
		riskyBlockReviewPrePublishPanelRequired:
			reviewRequired && prePublishReviewRequired,
		riskyBlockReviewSaveButtonLabel: reviewRequired
			? 'Review changes'
			: 'Update',
		riskyBlockReviewSaveClickAction: reviewRequired
			? DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW
			: DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE,
		riskyBlockReviewCanExportLocalUpdates: reviewRequired,
		riskyBlockReviewRequiresServerStateRefetch: false,
		riskyBlockReviewRawContentIncluded: false,
		riskyBlockReviewExposesRawContent: false,
		riskyBlockReviewDispatchesNotice: false,
		riskyBlockReviewMutatesEditorContent: false,
		riskyBlockReviewCallsNormalSavePost: false,
		riskyBlockReviewCallsRetrySaveEndpoint: false,
		riskyBlockReviewChangesPostLock: false,
		riskyBlockReviewClaimsSaved: false,
		mustOfferLocalCopy:
			normalizedCurrent.mustOfferLocalCopy || reviewRequired,
		canExportLocalUpdates:
			normalizedCurrent.canExportLocalUpdates || reviewRequired,
	} );
}

/**
 * Returns the risky-block review state as a nested object for selectors and
 * future annotation surfaces.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Risky block review state.
 */
export function getDistributedEditingRiskyBlockReviewStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return {
		status: normalized.riskyBlockReviewStatus,
		reasonCode:
			normalized.riskyBlockReviewReasonCode || normalized.reasonCode,
		reviewItems: normalized.riskyBlockReviewItems,
		reviewItemCount: normalized.riskyBlockReviewItemCount,
		pendingReviewItemCount: normalized.riskyBlockReviewPendingCount,
		approvedReviewItemCount: normalized.riskyBlockReviewApprovedCount,
		rejectedReviewItemCount: normalized.riskyBlockReviewRejectedCount,
		hasPendingReviewItems: normalized.riskyBlockReviewHasPendingItems,
		prePublishPanelRequired:
			normalized.riskyBlockReviewPrePublishPanelRequired,
		saveButtonLabel: normalized.riskyBlockReviewSaveButtonLabel,
		saveClickAction: normalized.riskyBlockReviewSaveClickAction,
		canExportLocalUpdates: normalized.riskyBlockReviewCanExportLocalUpdates,
		requiresServerStateRefetch:
			normalized.riskyBlockReviewRequiresServerStateRefetch,
		reviewedServerVersion: normalized.riskyBlockReviewReviewedServerVersion,
		currentServerVersion: normalized.riskyBlockReviewCurrentServerVersion,
		rawContentIncluded: normalized.riskyBlockReviewRawContentIncluded,
		exposesRawContent: normalized.riskyBlockReviewExposesRawContent,
		dispatchesNotice: normalized.riskyBlockReviewDispatchesNotice,
		mutatesEditorContent: normalized.riskyBlockReviewMutatesEditorContent,
		callsNormalSavePost: normalized.riskyBlockReviewCallsNormalSavePost,
		callsRetrySaveEndpoint:
			normalized.riskyBlockReviewCallsRetrySaveEndpoint,
		changesPostLock: normalized.riskyBlockReviewChangesPostLock,
		claimsSaved: normalized.riskyBlockReviewClaimsSaved,
	};
}

/**
 * Builds hash-only reviewed block items for the review-approval proof request.
 *
 * Only block review items approved for retry-save are included. Rejected and
 * pending review items remain local review state; they are not sent to the
 * reviewer-proof endpoint. The returned items intentionally omit raw content.
 *
 * @param {Object} sessionState Current DE-RTC session state.
 * @param {Object} [options]    Optional explicit source items.
 *
 * @return {Array} Reviewed block items for the REST helper.
 */
export function getDistributedEditingReviewedBlockItemsForRetrySaveReviewApprovalProof(
	sessionState = {},
	options = {}
) {
	const sourceItems = Array.isArray( options.reviewedBlockItems )
		? normalizeRetrySaveReviewApprovalReviewedBlockItems(
				options.reviewedBlockItems
		  )
		: normalizeDistributedEditingSessionState( sessionState )
				.riskyBlockReviewItems;

	return sourceItems
		.filter(
			( item ) =>
				item.reviewStatus ===
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE
		)
		.map( ( item ) =>
			normalizeRetrySaveReviewApprovalReviewedBlockItem( {
				...item,
				reviewedProposedContentHash:
					item.reviewedProposedContentHash ||
					item.proposedContentHash,
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
				reviewEvidenceType:
					item.reviewEvidenceType || 'kses_block_hash_only_change',
				contentReviewPolicy: item.contentReviewPolicy || 'kses',
			} )
		);
}

/**
 * Builds the accepted review-approval proof object for guarded retry-save.
 *
 * This projection is hash-only. It does not include raw post content, raw block
 * content, or rejected/pending review items.
 *
 * @param {Object} sessionState Current DE-RTC session state.
 *
 * @return {Object|null} Accepted review-approval proof for retry-save.
 */
export function getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	if (
		! normalized.retrySaveReviewApprovalAccepted ||
		normalized.retrySaveReviewApprovalProofStatus !==
			DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE ||
		normalized.retrySaveReviewApprovalRawContentIncluded
	) {
		return null;
	}

	const proofEnvelope = normalizeReviewApprovalProofEnvelope(
		normalized.retrySaveReviewApprovalProofEnvelope
	);

	if ( isOpaqueReviewApprovalProofTokenEnvelope( proofEnvelope ) ) {
		return proofEnvelope;
	}

	const serverVersion =
		normalized.retrySaveReviewApprovalServerVersion ||
		normalized.serverVersion;
	const proposedPostContentHash =
		normalized.retrySaveReviewApprovalProposedContentHash ||
		normalized.retrySaveReviewProposedContentHash;
	const candidatePostContentHash =
		normalized.retrySaveReviewApprovalCandidateContentHash ||
		normalized.retrySaveReviewCandidateContentHash;

	if (
		! serverVersion ||
		! proposedPostContentHash ||
		! candidatePostContentHash
	) {
		return null;
	}

	const reviewedBlockItems =
		normalized.retrySaveReviewApprovalReviewedBlockItems.filter(
			( item ) =>
				item.reviewStatus ===
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE
		);

	return {
		type: 'unfiltered_html_retry_save_review_approval',
		status: 'approved_by_unfiltered_html_reviewer',
		postId: normalized.retrySaveReviewApprovalPostId,
		postType: normalized.retrySaveReviewApprovalPostType,
		reviewerUserId: normalized.retrySaveReviewApprovalReviewerUserId,
		lowPrivilegedSaverUserId:
			normalized.retrySaveReviewApprovalLowPrivilegedSaverUserId,
		reviewerCapability:
			normalized.retrySaveReviewApprovalReviewerCapability ||
			'unfiltered_html',
		reviewScope:
			normalized.retrySaveReviewApprovalScope ||
			'collaborative_post_content',
		reviewStatus: normalized.retrySaveReviewApprovalReviewStatus,
		approvalStatus: normalized.retrySaveReviewApprovalApprovalStatus,
		reviewAction: normalized.retrySaveReviewApprovalReviewAction,
		approvalAction: normalized.retrySaveReviewApprovalApprovalAction,
		reviewRequiredCapability:
			normalized.retrySaveReviewApprovalRequiredCapability,
		serverVersion,
		previousServerVersion:
			normalized.retrySaveReviewApprovalPreviousServerVersion,
		rebasedFromVersion:
			normalized.retrySaveReviewApprovalRebasedFromVersion,
		clientBaseVersion: serverVersion,
		acceptedProofServerVersion: serverVersion,
		proposedPostContentHash,
		reviewedProposedContentHash: proposedPostContentHash,
		candidatePostContentHash,
		reviewedCandidateContentHash: candidatePostContentHash,
		candidatePostContentHashScope:
			normalized.retrySaveReviewApprovalCandidateContentHashScope,
		requiresUnfilteredHtmlSaver:
			normalized.retrySaveReviewApprovalRequiresUnfilteredHtmlSaver,
		reviewedBlockItems,
		reviewedBlockItemCount: reviewedBlockItems.length,
		blockReviewStatus: normalized.retrySaveReviewApprovalBlockReviewStatus,
		proofSignature: normalized.retrySaveReviewApprovalProofSignature,
		issuedAt: normalized.retrySaveReviewApprovalIssuedAt,
		expiresAt: normalized.retrySaveReviewApprovalExpiresAt,
		siteId: normalized.retrySaveReviewApprovalSiteId,
		siteUrl: normalized.retrySaveReviewApprovalSiteUrl,
		siteUuid: normalized.retrySaveReviewApprovalSiteUuid,
		rawContentIncluded: false,
		exposesRawContent: false,
		savesPost: normalized.retrySaveReviewApprovalSavesPost,
		mutatesPostContent:
			normalized.retrySaveReviewApprovalMutatesPostContent,
		createsRevision: normalized.retrySaveReviewApprovalCreatesRevision,
		claimsSaved: normalized.retrySaveReviewApprovalClaimsSaved,
	};
}

/**
 * Returns accepted fresh-review consume validation for retry-save requests.
 *
 * This projection is hash-only and identity-redacted. It is available only
 * after the no-write consume validation accepted the recorded fresh-review
 * decision for a future retry-save handoff.
 *
 * @param {Object} sessionState Current DE-RTC session state.
 *
 * @return {Object|null} Accepted fresh-review consume validation evidence.
 */
export function getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	if (
		! normalized.localUpdatesImportFreshReviewRetrySaveHandoffAccepted ||
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffStatus !==
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE ||
		! normalized.retrySaveFreshReviewDecisionConsumptionValidated
	) {
		return null;
	}

	const requestRecordId =
		normalized.retrySaveFreshReviewRequestRecordId ||
		normalized.localUpdatesImportFreshReviewRequestRecordId;
	const clientBaseVersion =
		normalized.retrySaveFreshReviewClientBaseVersion ||
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion ||
		normalized.clientBaseVersion;
	const serverVersion =
		normalized.retrySaveFreshReviewServerVersion ||
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffServerVersion ||
		normalized.serverVersion;
	const proposedPostContentHash =
		normalized.retrySaveFreshReviewProposedContentHash ||
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash ||
		normalized.localUpdatesImportVerifiedPostContentHash;
	const reviewedProposedContentHash =
		normalized.retrySaveFreshReviewReviewedProposedContentHash ||
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffReviewedProposedContentHash ||
		proposedPostContentHash;

	if (
		! requestRecordId ||
		! clientBaseVersion ||
		! serverVersion ||
		! proposedPostContentHash
	) {
		return null;
	}

	const candidatePostContentHash =
		normalized.retrySaveFreshReviewCandidateContentHash ||
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash;
	const reviewedCandidateContentHash =
		normalized.retrySaveFreshReviewReviewedCandidateContentHash ||
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffReviewedCandidateContentHash ||
		candidatePostContentHash;

	return {
		type: 'fresh_review_decision_consumption_validation',
		status: 'eligible_for_retry_save_handoff',
		result:
			normalized.retrySaveFreshReviewConsumeValidationResult ||
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffResult,
		restRoute:
			normalized.retrySaveFreshReviewConsumeValidationRestRoute ||
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffRestRoute,
		freshReviewRequestRecordId: requestRecordId,
		freshReviewRequestStatus:
			normalized.retrySaveFreshReviewRequestStatus || 'decision_recorded',
		freshReviewDecisionStatus:
			normalized.retrySaveFreshReviewDecisionStatus || 'approved',
		clientBaseVersion,
		serverVersion,
		proposedPostContentHash,
		reviewedProposedContentHash,
		...( candidatePostContentHash
			? {
					candidatePostContentHash,
					reviewedCandidateContentHash,
			  }
			: {} ),
		reviewedBlockItemCount:
			normalized.retrySaveFreshReviewReviewedBlockItemCount,
		hashEvidenceStatus:
			normalized.retrySaveFreshReviewHashEvidenceStatus || 'accepted',
		freshReviewDecisionConsumptionValidated: true,
		freshReviewDecisionEligibleForRetrySave: true,
		rawContentIncluded: false,
		exposesRawContent: false,
		exposesReviewerIds: false,
		savesPost: false,
		mutatesPostContent: false,
		createsRevision: false,
		claimsSaved: false,
	};
}

/**
 * Returns a fresh-review lifecycle descriptor for future Save/pre-save UI.
 *
 * This is only placement and policy evidence. It does not open the
 * pre-publish sidebar, save, retry-save, dispatch notices, mutate content,
 * inspect proof internals, or change post locks.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Fresh-review pre-save state.
 */
export function getDistributedEditingFreshReviewPreSaveStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const hasProtectedLocalChanges = Boolean(
		normalized.hasPendingChanges ||
			normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates
	);
	const handoffStatus =
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffStatus;
	const handoffReason =
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffReason;
	const decisionStatus =
		normalized.localUpdatesImportFreshReviewDecisionStatus;
	const lifecycleRetrievalStatus =
		normalized.localUpdatesImportFreshReviewLifecycleRetrievalStatus;
	const decisionLifecycleStatus =
		normalized.localUpdatesImportFreshReviewDecisionLifecycleStatus;
	const decisionLifecycleAction =
		normalized.localUpdatesImportFreshReviewDecisionLifecycleAction;
	const reviewerAuthorityStatus =
		normalized.localUpdatesImportFreshReviewReviewerAuthorityStatus;
	const requiresFreshReviewDueToAuthority =
		normalized.localUpdatesImportFreshReviewRequiresFreshReviewDueToAuthority;
	const reviewListStatus =
		getDistributedEditingFreshReviewListStatusFromNormalizedState(
			normalized
		);
	const hasFreshReviewRequest = Boolean(
		normalized.localUpdatesImportRequiresFreshReview ||
			normalized.localUpdatesImportFreshReviewRequestRequested ||
			normalized.localUpdatesImportFreshReviewRequestAccepted ||
			normalized.localUpdatesImportFreshReviewDecisionPanelRequired ||
			reviewListStatus !==
				DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.NONE ||
			lifecycleRetrievalStatus !==
				DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.NONE ||
			decisionStatus !==
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.NONE ||
			handoffStatus !==
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.NONE
	);
	let status = DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.NONE;
	let reason = null;
	let placement = DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.NONE;
	let saveButtonLabel = 'Update';
	let clickAction = null;
	let requiresServerStateRefetch = normalized.requiresServerStateRefetch;

	if (
		hasProtectedLocalChanges &&
		hasFreshReviewRequest &&
		normalized.retrySaveStatus !==
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED
	) {
		if ( requiresFreshReviewDueToAuthority ) {
			status =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED;
			reason =
				decisionLifecycleStatus === 'capability_drift'
					? 'fresh_review_authority_drift_requires_new_review'
					: 'fresh_review_consumed_requires_new_review';
			placement =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW;
			saveButtonLabel = 'Review changes';
			clickAction =
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;
		} else if (
			handoffStatus ===
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE ||
			normalized.retrySaveFreshReviewConsumeValidationAccepted ||
			normalized.retrySaveFreshReviewDecisionConsumptionValidated
		) {
			status =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE;
			reason = 'fresh_review_accepted_for_retry_save';
			placement =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_SAVE_STATUS;
			saveButtonLabel = 'Submit reviewed changes';
			clickAction =
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
		} else if (
			handoffStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING
		) {
			status =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING;
			reason = 'fresh_review_handoff_validating';
			placement =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.SAVE_BUTTON_STATUS;
			saveButtonLabel = 'Validating review';
		} else if (
			handoffStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.READY
		) {
			status =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATION_REQUIRED;
			reason = 'fresh_review_handoff_validation_required';
			placement =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_SAVE_STATUS;
			saveButtonLabel = 'Validate review';
		} else if (
			handoffStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.BLOCKED
		) {
			if (
				handoffReason ===
					DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_REASONS.STALE_BASE_REJECTED ||
				normalized.requiresServerStateRefetch
			) {
				status =
					DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REFETCH_REQUIRED;
				reason = 'fresh_review_server_state_refetch_required';
				placement =
					DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_SAVE_STATUS;
				saveButtonLabel = 'Refetch required';
				clickAction =
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE;
				requiresServerStateRefetch = true;
			} else {
				status =
					DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.BLOCKED;
				reason = handoffReason || 'fresh_review_handoff_blocked';
				placement =
					DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW;
				saveButtonLabel = 'Review changes';
				clickAction =
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;
			}
		} else if (
			normalized.localUpdatesImportFreshReviewDecisionPanelRequired ||
			decisionStatus ===
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW ||
			decisionStatus ===
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY ||
			normalized.localUpdatesImportRequiresFreshReview
		) {
			status =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED;
			reason = 'fresh_review_required';
			placement =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW;
			saveButtonLabel = 'Review changes';
			clickAction =
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;
		}
	}

	const isActive =
		status !== DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.NONE;
	const actionKeys = [
		isActive && normalized.canExportLocalUpdates
			? DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES
			: null,
		requiresServerStateRefetch
			? DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE
			: null,
	].filter( Boolean );

	return {
		status,
		reason,
		placement,
		saveButtonLabel,
		clickAction,
		blocksNormalSavePost: isActive,
		opensPrePublishReview:
			placement ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
		requiresServerStateRefetch,
		canRefetchServerState: requiresServerStateRefetch,
		actionKeys,
		canExportLocalUpdates: isActive && normalized.canExportLocalUpdates,
		hasProtectedLocalChanges,
		reviewListStatus,
		reviewList: {
			status: reviewListStatus,
			itemCount:
				normalized.localUpdatesImportFreshReviewDecisionItemCount,
			pendingItemCount:
				normalized.localUpdatesImportFreshReviewDecisionPendingCount,
			approvedItemCount:
				normalized.localUpdatesImportFreshReviewDecisionApprovedCount,
			rejectedItemCount:
				normalized.localUpdatesImportFreshReviewDecisionRejectedCount,
			reviewedBlockItemCount:
				normalized.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount ||
				normalized.retrySaveFreshReviewReviewedBlockItemCount ||
				normalized.localUpdatesImportFreshReviewLifecycleReviewedBlockItemCount,
			opensPrePublishReview:
				placement ===
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
			canExportLocalUpdates: isActive && normalized.canExportLocalUpdates,
			exposesRawContent: false,
			exposesProofSignature: false,
			exposesReviewerIds: false,
		},
		lifecycleRetrievalStatus,
		lifecycleResult:
			normalized.localUpdatesImportFreshReviewLifecycleResult,
		lifecycleRestRoute:
			normalized.localUpdatesImportFreshReviewLifecycleRestRoute,
		lifecycleDebugAvailable:
			normalized.localUpdatesImportFreshReviewLifecycleDebugAvailable,
		supportEvidenceAvailable:
			normalized.localUpdatesImportFreshReviewSupportEvidenceAvailable,
		lifecycleStatus:
			normalized.localUpdatesImportFreshReviewLifecycleStatus,
		lifecycleEvent: normalized.localUpdatesImportFreshReviewLifecycleEvent,
		lifecycleReason:
			normalized.localUpdatesImportFreshReviewLifecycleReason,
		lifecycleAction:
			normalized.localUpdatesImportFreshReviewLifecycleAction,
		lifecycleDecisionRecorded:
			normalized.localUpdatesImportFreshReviewLifecycleDecisionRecorded,
		lifecycleDecisionConsumed:
			normalized.localUpdatesImportFreshReviewLifecycleDecisionConsumed,
		lifecycleRetrySaveApplied:
			normalized.localUpdatesImportFreshReviewLifecycleRetrySaveApplied,
		lifecyclePreviousServerVersion:
			normalized.localUpdatesImportFreshReviewLifecyclePreviousServerVersion,
		lifecycleSavedServerVersion:
			normalized.localUpdatesImportFreshReviewLifecycleSavedServerVersion,
		lifecycleReviewedBlockItemCount:
			normalized.localUpdatesImportFreshReviewLifecycleReviewedBlockItemCount,
		lifecycleApprovedBlockItemCount:
			normalized.localUpdatesImportFreshReviewLifecycleApprovedBlockItemCount,
		lifecycleRejectedBlockItemCount:
			normalized.localUpdatesImportFreshReviewLifecycleRejectedBlockItemCount,
		lifecycleHashEvidenceFields:
			normalized.localUpdatesImportFreshReviewLifecycleHashEvidenceFields,
		lifecycleVersionEvidenceFields:
			normalized.localUpdatesImportFreshReviewLifecycleVersionEvidenceFields,
		decisionLifecycleStatus,
		decisionLifecycleAction,
		reviewerAuthorityStatus,
		requiresFreshReviewDueToAuthority,
		reviewerAuthorityDriftRequiresFreshReview:
			reviewerAuthorityStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.AUTHORITY_DRIFT_REQUIRES_FRESH_REVIEW,
		reviewerCapabilityDriftRecheckSupported:
			normalized.localUpdatesImportFreshReviewLifecycleReviewerCapabilityDriftRecheckSupported,
		reviewerIdentityRetained:
			normalized.localUpdatesImportFreshReviewLifecycleReviewerIdentityRetained,
		requiresNewReviewIfReviewerAuthorityCannotBeRechecked:
			normalized.localUpdatesImportFreshReviewLifecycleRequiresNewReviewIfReviewerAuthorityCannotBeRechecked,
		requestStatus: normalized.localUpdatesImportReviewRequestStatus,
		requestAccepted:
			normalized.localUpdatesImportFreshReviewRequestAccepted,
		requested: normalized.localUpdatesImportFreshReviewRequestRequested,
		decisionStatus,
		decision: normalized.localUpdatesImportFreshReviewDecisionDecision,
		decisionPanelRequired:
			normalized.localUpdatesImportFreshReviewDecisionPanelRequired,
		decisionReady: normalized.localUpdatesImportFreshReviewDecisionReady,
		decisionItemCount:
			normalized.localUpdatesImportFreshReviewDecisionItemCount,
		pendingDecisionItemCount:
			normalized.localUpdatesImportFreshReviewDecisionPendingCount,
		approvedDecisionItemCount:
			normalized.localUpdatesImportFreshReviewDecisionApprovedCount,
		rejectedDecisionItemCount:
			normalized.localUpdatesImportFreshReviewDecisionRejectedCount,
		reviewedBlockItemCount:
			normalized.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount ||
			normalized.retrySaveFreshReviewReviewedBlockItemCount,
		handoffStatus,
		handoffReason,
		handoffReady:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffReady,
		handoffValidating:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffValidating,
		handoffAccepted:
			normalized.localUpdatesImportFreshReviewRetrySaveHandoffAccepted,
		retrySaveStatus: normalized.retrySaveStatus,
		retrySaveReason: normalized.retrySaveReason,
		freshReviewConsumed:
			normalized.retrySaveFreshReviewConsumeValidationAccepted ||
			normalized.retrySaveFreshReviewDecisionConsumptionValidated,
		shouldCallNormalSavePost: false,
		shouldCallRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesReviewerIds: false,
	};
}

/**
 * Returns the pure fresh-review pre-publish surface state. The returned review
 * items and actions are descriptors only; they do not open UI, call REST, save,
 * retry-save, dispatch notices, mutate content, expose raw content, or change
 * post locks.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Fresh-review pre-publish state.
 */
export function getDistributedEditingFreshReviewPrePublishStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const preSaveState =
		getDistributedEditingFreshReviewPreSaveStateForSessionState(
			normalized
		);
	const decisionState =
		getDistributedEditingFreshReviewDecisionStateForSessionState(
			normalized
		);
	const lifecycleState =
		getDistributedEditingFreshReviewLifecycleStateForSessionState(
			normalized
		);
	const canRecordLocalDecisions =
		normalized.localUpdatesImportRequiresFreshReview &&
		normalized.localUpdatesImportReviewRequestStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED &&
		[
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY,
		].includes( decisionState.status ) &&
		! decisionState.decisionSubmitted &&
		! decisionState.decisionAccepted;
	const reviewItems = getDistributedEditingFreshReviewPrePublishReviewItems(
		decisionState.reviewItems,
		{
			canRecordLocalDecisions,
		}
	);
	const canSubmitReviewDecision =
		canRecordLocalDecisions &&
		decisionState.ready &&
		reviewItems.length > 0;
	const isActive =
		preSaveState.status !==
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.NONE ||
		decisionState.panelRequired ||
		reviewItems.length > 0 ||
		lifecycleState.retrievalStatus !==
			DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.NONE;
	const saveAction = preSaveState.clickAction
		? createFreshReviewPrePublishActionDescriptor(
				preSaveState.clickAction,
				{
					enabled:
						preSaveState.status !==
						DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING,
					reason: preSaveState.reason,
					placement: preSaveState.placement,
				}
		  )
		: null;
	const submitDecisionAction =
		reviewItems.length > 0
			? createFreshReviewPrePublishActionDescriptor(
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.SUBMIT_FRESH_REVIEW_DECISION,
					{
						enabled: canSubmitReviewDecision,
						reason: canSubmitReviewDecision
							? null
							: 'fresh_review_decision_not_ready',
						placement:
							DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
					}
			  )
			: null;
	const validateHandoffAction =
		preSaveState.status ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATION_REQUIRED
			? createFreshReviewPrePublishActionDescriptor(
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.VALIDATE_FRESH_REVIEW_HANDOFF,
					{
						enabled: true,
						reason: preSaveState.reason,
						placement: preSaveState.placement,
					}
			  )
			: null;
	const exportAction = preSaveState.canExportLocalUpdates
		? createFreshReviewPrePublishActionDescriptor(
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
				{
					enabled: true,
					placement: preSaveState.placement,
				}
		  )
		: null;
	const refetchAction = preSaveState.canRefetchServerState
		? createFreshReviewPrePublishActionDescriptor(
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
				{
					enabled: true,
					placement: preSaveState.placement,
				}
		  )
		: null;
	const actionDescriptors = [
		saveAction,
		submitDecisionAction,
		validateHandoffAction,
		exportAction,
		refetchAction,
	].filter( Boolean );

	return {
		status: preSaveState.status,
		reason: preSaveState.reason,
		placement: preSaveState.placement,
		isActive,
		panelRequired:
			preSaveState.opensPrePublishReview || decisionState.panelRequired,
		reviewListStatus: preSaveState.reviewListStatus,
		saveButtonLabel: preSaveState.saveButtonLabel,
		saveClickAction: preSaveState.clickAction,
		blocksNormalSavePost: preSaveState.blocksNormalSavePost,
		opensPrePublishReview: preSaveState.opensPrePublishReview,
		requiresServerStateRefetch: preSaveState.requiresServerStateRefetch,
		canRefetchServerState: preSaveState.canRefetchServerState,
		canExportLocalUpdates: preSaveState.canExportLocalUpdates,
		hasProtectedLocalChanges: preSaveState.hasProtectedLocalChanges,
		requestStatus: preSaveState.requestStatus,
		requestAccepted: preSaveState.requestAccepted,
		requested: preSaveState.requested,
		decisionStatus: decisionState.status,
		decision: decisionState.decision,
		decisionReady: decisionState.ready,
		canRecordLocalDecisions,
		canSubmitReviewDecision,
		reviewItems,
		reviewItemCount: decisionState.reviewItemCount,
		pendingReviewItemCount: decisionState.pendingReviewItemCount,
		approvedReviewItemCount: decisionState.approvedReviewItemCount,
		rejectedReviewItemCount: decisionState.rejectedReviewItemCount,
		hasPendingReviewItems: decisionState.pendingReviewItemCount > 0,
		allReviewItemsResolved:
			decisionState.reviewItemCount > 0 &&
			decisionState.pendingReviewItemCount === 0,
		reviewedBlockItems: decisionState.reviewedBlockItems,
		reviewedBlockItemCount: decisionState.reviewedBlockItemCount,
		actionKeys: actionDescriptors
			.filter( ( descriptor ) => descriptor.enabled )
			.map( ( descriptor ) => descriptor.actionKey ),
		actionDescriptors,
		saveAction,
		submitDecisionAction,
		validateHandoffAction,
		exportAction,
		refetchAction,
		lifecycle: lifecycleState,
		lifecycleRetrievalStatus: preSaveState.lifecycleRetrievalStatus,
		lifecycleStatus: preSaveState.lifecycleStatus,
		lifecycleAction: preSaveState.lifecycleAction,
		decisionLifecycleStatus: preSaveState.decisionLifecycleStatus,
		decisionLifecycleAction: preSaveState.decisionLifecycleAction,
		reviewerAuthorityStatus: preSaveState.reviewerAuthorityStatus,
		requiresFreshReviewDueToAuthority:
			preSaveState.requiresFreshReviewDueToAuthority,
		reviewerAuthorityDriftRequiresFreshReview:
			preSaveState.reviewerAuthorityDriftRequiresFreshReview,
		handoffStatus: preSaveState.handoffStatus,
		handoffReason: preSaveState.handoffReason,
		handoffReady: preSaveState.handoffReady,
		handoffValidating: preSaveState.handoffValidating,
		handoffAccepted: preSaveState.handoffAccepted,
		freshReviewConsumed: preSaveState.freshReviewConsumed,
		shouldCallNormalSavePost: false,
		shouldCallRetrySaveEndpoint: false,
		callsRestEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
		rawContentIncluded: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesReviewerIds: false,
		exposesSaverIds: false,
		exposesProofInternals: false,
	};
}

function getDistributedEditingFreshReviewPrePublishReviewItems(
	reviewItems,
	{ canRecordLocalDecisions = false } = {}
) {
	return reviewItems.map( ( item ) => {
		const isPendingReview =
			item.reviewStatus ===
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW;
		const isApprovedForRetrySave =
			item.reviewStatus ===
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE;
		const isRejected =
			item.reviewStatus ===
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED;
		const approveAction = createFreshReviewPrePublishActionDescriptor(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.APPROVE_FRESH_REVIEW_ITEM,
			{
				enabled: canRecordLocalDecisions && ! isApprovedForRetrySave,
				itemId: item.id,
				decision: 'approved',
				placement:
					DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
			}
		);
		const rejectAction = createFreshReviewPrePublishActionDescriptor(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REJECT_FRESH_REVIEW_ITEM,
			{
				enabled: canRecordLocalDecisions && ! isRejected,
				itemId: item.id,
				decision: 'rejected',
				placement:
					DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
			}
		);

		return {
			id: item.id,
			blockClientId: item.blockClientId,
			blockName: item.blockName,
			blockLabel: item.blockLabel,
			blockPath: item.blockPath,
			changeKind: item.changeKind,
			riskReason: item.riskReason,
			baseContentHash: item.baseContentHash,
			proposedContentHash: item.proposedContentHash,
			reviewedProposedContentHash: item.reviewedProposedContentHash,
			ksesFilteredContentHash: item.ksesFilteredContentHash,
			reviewStatus: item.reviewStatus,
			reviewEvidenceType: item.reviewEvidenceType,
			contentReviewPolicy: item.contentReviewPolicy,
			rejectionReason: item.rejectionReason,
			isPendingReview,
			isApprovedForRetrySave,
			isRejected,
			canApprove: canRecordLocalDecisions && ! isApprovedForRetrySave,
			canReject: canRecordLocalDecisions && ! isRejected,
			approveAction,
			rejectAction,
			actionDescriptors: [ approveAction, rejectAction ],
			rawContentIncluded: false,
			exposesRawContent: false,
			exposesProofSignature: false,
			exposesReviewerIds: false,
		};
	} );
}

function createFreshReviewPrePublishActionDescriptor(
	actionKey,
	{
		enabled = true,
		itemId = null,
		decision = null,
		reason = null,
		placement = null,
	} = {}
) {
	return {
		actionKey,
		enabled: Boolean( enabled ),
		itemId: normalizeNullableString( itemId ),
		decision: normalizeNullableString( decision ),
		reason: normalizeNullableString( reason ),
		placement: normalizeNullableString( placement ),
		descriptorOnly: true,
		callsRestEndpoint: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesReviewerIds: false,
	};
}

/**
 * Returns support-safe fresh-review lifecycle evidence for future UI.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Fresh-review lifecycle state.
 */
export function getDistributedEditingFreshReviewLifecycleStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const reviewListStatus =
		getDistributedEditingFreshReviewListStatusFromNormalizedState(
			normalized
		);

	return {
		retrievalStatus:
			normalized.localUpdatesImportFreshReviewLifecycleRetrievalStatus,
		result: normalized.localUpdatesImportFreshReviewLifecycleResult,
		restRoute: normalized.localUpdatesImportFreshReviewLifecycleRestRoute,
		debugAvailable:
			normalized.localUpdatesImportFreshReviewLifecycleDebugAvailable,
		supportEvidenceAvailable:
			normalized.localUpdatesImportFreshReviewSupportEvidenceAvailable,
		requestRecordId:
			normalized.localUpdatesImportFreshReviewRequestRecordId,
		requestStatus:
			normalized.localUpdatesImportFreshReviewLifecycleRequestStatus,
		decisionStatus:
			normalized.localUpdatesImportFreshReviewLifecycleDecisionStatus,
		decisionRecorded:
			normalized.localUpdatesImportFreshReviewLifecycleDecisionRecorded,
		decisionConsumed:
			normalized.localUpdatesImportFreshReviewLifecycleDecisionConsumed,
		retrySaveApplied:
			normalized.localUpdatesImportFreshReviewLifecycleRetrySaveApplied,
		consumesReviewDecision:
			normalized.localUpdatesImportFreshReviewLifecycleConsumesReviewDecision,
		importedHandoff:
			normalized.localUpdatesImportFreshReviewLifecycleImportedHandoff,
		lifecycleStatus:
			normalized.localUpdatesImportFreshReviewLifecycleStatus,
		lifecycleEvent: normalized.localUpdatesImportFreshReviewLifecycleEvent,
		lifecycleReason:
			normalized.localUpdatesImportFreshReviewLifecycleReason,
		lifecycleAction:
			normalized.localUpdatesImportFreshReviewLifecycleAction,
		previousServerVersion:
			normalized.localUpdatesImportFreshReviewLifecyclePreviousServerVersion,
		savedServerVersion:
			normalized.localUpdatesImportFreshReviewLifecycleSavedServerVersion,
		reviewedBlockItemCount:
			normalized.localUpdatesImportFreshReviewLifecycleReviewedBlockItemCount,
		approvedBlockItemCount:
			normalized.localUpdatesImportFreshReviewLifecycleApprovedBlockItemCount,
		rejectedBlockItemCount:
			normalized.localUpdatesImportFreshReviewLifecycleRejectedBlockItemCount,
		hashEvidenceFields:
			normalized.localUpdatesImportFreshReviewLifecycleHashEvidenceFields,
		versionEvidenceFields:
			normalized.localUpdatesImportFreshReviewLifecycleVersionEvidenceFields,
		reviewListStatus,
		reviewerAuthorityStatus:
			normalized.localUpdatesImportFreshReviewReviewerAuthorityStatus,
		requiresFreshReviewDueToAuthority:
			normalized.localUpdatesImportFreshReviewRequiresFreshReviewDueToAuthority,
		reviewerCapabilityDriftRecheckSupported:
			normalized.localUpdatesImportFreshReviewLifecycleReviewerCapabilityDriftRecheckSupported,
		reviewerIdentityRetained:
			normalized.localUpdatesImportFreshReviewLifecycleReviewerIdentityRetained,
		requiresNewReviewIfReviewerAuthorityCannotBeRechecked:
			normalized.localUpdatesImportFreshReviewLifecycleRequiresNewReviewIfReviewerAuthorityCannotBeRechecked,
		canExportLocalUpdates: normalized.canExportLocalUpdates,
		hasProtectedLocalChanges: Boolean(
			normalized.hasPendingChanges ||
				normalized.mustOfferLocalCopy ||
				normalized.canExportLocalUpdates
		),
		shouldCallRetrySaveEndpoint: false,
		shouldCallNormalSavePost: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesReviewerIds: false,
		exposesSaverIds: false,
		exposesProofInternals: false,
	};
}

function getDistributedEditingFreshReviewListStatusFromNormalizedState(
	normalized
) {
	if (
		normalized.localUpdatesImportFreshReviewLifecycleDecisionConsumed ||
		normalized.localUpdatesImportFreshReviewLifecycleRetrySaveApplied ||
		normalized.localUpdatesImportFreshReviewLifecycleStatus ===
			'retry_save_consumed'
	) {
		return DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.CONSUMED;
	}

	if (
		normalized.localUpdatesImportFreshReviewRequiresFreshReviewDueToAuthority ||
		normalized.localUpdatesImportFreshReviewRetrySaveHandoffStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.BLOCKED
	) {
		return DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.BLOCKED;
	}

	if (
		normalized.localUpdatesImportFreshReviewDecisionStatus ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED
	) {
		return DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.DECISION_RECORDED;
	}

	if (
		normalized.localUpdatesImportFreshReviewDecisionStatus ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY
	) {
		return DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.DECISION_READY;
	}

	if (
		normalized.localUpdatesImportFreshReviewDecisionPanelRequired ||
		normalized.localUpdatesImportFreshReviewDecisionStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW
	) {
		return DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.AWAITING_REVIEW;
	}

	if ( normalized.localUpdatesImportRequiresFreshReview ) {
		return DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.REVIEW_REQUIRED;
	}

	return DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.NONE;
}

/**
 * Returns the pure DE-RTC Save button semantics descriptor for the current
 * session. The descriptor ranks review, retry-save, refetch, and fresh-review
 * handoff state so UI can describe what the next Save click means without
 * reading raw content, proof internals, or reviewer identity.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Save button semantics descriptor.
 */
export function getDistributedEditingSaveButtonStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const reviewState =
		getDistributedEditingRiskyBlockReviewStateForSessionState( normalized );
	const freshReviewPreSaveState =
		getDistributedEditingFreshReviewPreSaveStateForSessionState(
			normalized
		);
	const hasProtectedLocalChanges = Boolean(
		normalized.hasPendingChanges ||
			normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates
	);
	const hasRetrySaveSavedStateEvidence =
		hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
			normalized
		);
	const hasAcceptedReviewApprovalProof = Boolean(
		getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
			normalized
		)
	);
	const hasAcceptedFreshReviewConsumeValidation = Boolean(
		getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
			normalized
		)
	);
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
	const hasRiskyReviewReadyForProof =
		reviewState.status ===
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_RESOLVED ||
		reviewState.approvedReviewItemCount > 0;
	const hasAcceptedButUnconsumed =
		! hasRetrySaveSavedStateEvidence &&
		( hasAcceptedFreshReviewConsumeValidation ||
			freshReviewPreSaveState.status ===
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE ||
			hasAcceptedReviewApprovalProof ||
			hasRiskyReviewReadyForProof ||
			( hasAcceptedRetrySubmitProof && hasRetrySavePreparation ) );
	let status = DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY;
	let reason = null;
	let source = 'default';
	let label = 'Update';
	let statusText = 'Ready to update';
	let clickAction = DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE;
	let disabled = false;
	let busy = false;
	let opensPrePublishReview = false;
	let requiresServerStateRefetch = false;
	let canRefetchServerState = false;
	let claimsSaved = false;

	if ( hasRetrySaveSavedStateEvidence ) {
		status = DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_CONFIRMED;
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_ALREADY_CONFIRMED;
		source = 'retry_save';
		label = 'Retry save confirmed';
		statusText = 'Distributed Editing retry save confirmed.';
		clickAction = null;
		disabled = true;
		claimsSaved = true;
	} else if (
		normalized.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
	) {
		status =
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS;
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS;
		source = 'retry_save';
		label = 'Saving reviewed changes';
		statusText =
			'Distributed Editing retry save is waiting for server confirmation.';
		clickAction = null;
		disabled = true;
		busy = true;
	} else if (
		freshReviewPreSaveState.status ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING
	) {
		status =
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.FRESH_REVIEW_VALIDATING;
		reason =
			freshReviewPreSaveState.reason || 'fresh_review_handoff_validating';
		source = 'fresh_review';
		label = 'Validating review';
		statusText =
			'Fresh-review validation is in progress before guarded save.';
		clickAction = null;
		disabled = true;
		busy = true;
	} else if (
		reviewState.requiresServerStateRefetch ||
		freshReviewPreSaveState.requiresServerStateRefetch ||
		normalized.requiresServerStateRefetch
	) {
		status = DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REFETCH_REQUIRED;
		if ( reviewState.requiresServerStateRefetch ) {
			reason = 'risky_block_review_stale';
			source = 'risky_block_review';
		} else if ( freshReviewPreSaveState.requiresServerStateRefetch ) {
			reason =
				freshReviewPreSaveState.reason ||
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED;
			source = 'fresh_review';
		} else {
			reason =
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED;
			source = 'retry_save';
		}
		label = 'Refetch required';
		statusText =
			'Server state must be refetched before Distributed Editing can save.';
		clickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE;
		requiresServerStateRefetch = true;
		canRefetchServerState = true;
	} else if (
		reviewState.hasPendingReviewItems ||
		freshReviewPreSaveState.opensPrePublishReview ||
		freshReviewPreSaveState.status ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED ||
		freshReviewPreSaveState.status ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.BLOCKED
	) {
		status = DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED;
		if ( reviewState.hasPendingReviewItems ) {
			reason = 'risky_block_review_required';
			source = 'risky_block_review';
		} else {
			reason = freshReviewPreSaveState.reason || 'fresh_review_required';
			source = 'fresh_review';
		}
		label =
			freshReviewPreSaveState.saveButtonLabel &&
			freshReviewPreSaveState.saveButtonLabel !== 'Update'
				? freshReviewPreSaveState.saveButtonLabel
				: 'Review changes';
		statusText =
			'Review must be resolved before Distributed Editing can save.';
		clickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;
		opensPrePublishReview = true;
	} else if ( hasAcceptedButUnconsumed ) {
		status =
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED;
		if ( hasAcceptedFreshReviewConsumeValidation ) {
			reason = 'fresh_review_accepted_but_unconsumed';
			source = 'fresh_review';
		} else if ( hasAcceptedReviewApprovalProof ) {
			reason = 'review_approval_accepted_but_unconsumed';
			source = 'review_approval';
		} else if ( hasRiskyReviewReadyForProof ) {
			reason = 'risky_block_review_ready_for_review_approval';
			source = 'risky_block_review';
		} else {
			reason = 'accepted_retry_submit_proof_unconsumed';
			source = 'retry_submit';
		}
		label = 'Submit reviewed changes';
		statusText =
			'Accepted Distributed Editing proof is ready for guarded retry save.';
		clickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
	}

	const blocksNormalSavePost =
		status !== DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY;
	const canExportLocalUpdates =
		Boolean( normalized.canExportLocalUpdates ) &&
		( hasProtectedLocalChanges || blocksNormalSavePost );
	const actionKeys = [
		canExportLocalUpdates
			? DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES
			: null,
		canRefetchServerState
			? DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE
			: null,
	].filter( Boolean );

	return {
		status,
		reason,
		source,
		label,
		statusText,
		clickAction,
		disabled,
		busy,
		blocksNormalSavePost,
		opensPrePublishReview,
		requiresServerStateRefetch,
		canRefetchServerState,
		canExportLocalUpdates,
		hasProtectedLocalChanges,
		hasAcceptedButUnconsumed,
		hasAcceptedReviewApprovalProof,
		hasAcceptedFreshReviewConsumeValidation,
		hasAcceptedRetrySubmitProof,
		hasRetrySavePreparation,
		hasRetrySaveSavedStateEvidence,
		reviewItemCount: reviewState.reviewItemCount,
		pendingReviewItemCount: reviewState.pendingReviewItemCount,
		approvedReviewItemCount: reviewState.approvedReviewItemCount,
		rejectedReviewItemCount: reviewState.rejectedReviewItemCount,
		freshReviewPreSaveStatus: freshReviewPreSaveState.status,
		freshReviewPreSaveReason: freshReviewPreSaveState.reason,
		freshReviewPreSavePlacement: freshReviewPreSaveState.placement,
		freshReviewHandoffStatus: freshReviewPreSaveState.handoffStatus,
		freshReviewHandoffReason: freshReviewPreSaveState.handoffReason,
		actionKeys,
		descriptorOnly: true,
		savesPost: false,
		shouldCallNormalSavePost: false,
		shouldCallRetrySaveEndpoint: false,
		callsRestEndpoint: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved,
		rawContentIncluded: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesProofInternals: false,
		exposesReviewerIds: false,
		exposesSaverIds: false,
	};
}

/**
 * Returns the DE-RTC Save policy state for risky-block review handoff.
 *
 * This is only policy data. It does not open the pre-publish sidebar, save,
 * retry-save, dispatch notices, mutate content, or change post locks.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Save policy state.
 */
export function getDistributedEditingSavePolicyStateForSessionState(
	sessionState = {}
) {
	const reviewState =
		getDistributedEditingRiskyBlockReviewStateForSessionState(
			sessionState
		);
	const saveButton =
		getDistributedEditingSaveButtonStateForSessionState( sessionState );
	let status = DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.UPDATE_READY;
	let reason = null;
	let saveButtonLabel = 'Update';
	let clickAction = DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE;
	let blocksNormalSavePost = false;
	let opensPrePublishReview = false;
	let requiresServerStateRefetch = false;

	if (
		saveButton.status ===
		DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REFETCH_REQUIRED
	) {
		status = DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.REFETCH_REQUIRED;
		reason = saveButton.reason;
		saveButtonLabel = saveButton.label;
		clickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE;
		blocksNormalSavePost = true;
		requiresServerStateRefetch = true;
	} else if (
		saveButton.status ===
		DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED
	) {
		status = DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.REVIEW_REQUIRED;
		reason = saveButton.reason;
		saveButtonLabel = saveButton.label;
		clickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;
		blocksNormalSavePost = true;
		opensPrePublishReview = true;
	} else if (
		saveButton.status ===
		DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED
	) {
		status =
			DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE;
		reason = saveButton.reason;
		saveButtonLabel = saveButton.label;
		clickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
		blocksNormalSavePost = true;
	} else if (
		saveButton.status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS ||
		saveButton.status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.FRESH_REVIEW_VALIDATING
	) {
		status = DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.IN_FLIGHT;
		reason = saveButton.reason;
		saveButtonLabel = saveButton.label;
		clickAction = saveButton.clickAction;
		blocksNormalSavePost = true;
	} else if (
		saveButton.status ===
		DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_CONFIRMED
	) {
		status = DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.RETRY_SAVE_CONFIRMED;
		reason = saveButton.reason;
		saveButtonLabel = saveButton.label;
		clickAction = saveButton.clickAction;
		blocksNormalSavePost = true;
	}

	return {
		status,
		reason,
		saveButtonLabel,
		clickAction,
		blocksNormalSavePost,
		opensPrePublishReview,
		requiresServerStateRefetch,
		reviewItemCount: reviewState.reviewItemCount,
		pendingReviewItemCount: reviewState.pendingReviewItemCount,
		approvedReviewItemCount: reviewState.approvedReviewItemCount,
		rejectedReviewItemCount: reviewState.rejectedReviewItemCount,
		saveButton,
		saveButtonStatus: saveButton.status,
		saveButtonReason: saveButton.reason,
		saveButtonSource: saveButton.source,
		saveButtonStatusText: saveButton.statusText,
		saveButtonDisabled: saveButton.disabled,
		saveButtonBusy: saveButton.busy,
		saveButtonActionKeys: saveButton.actionKeys,
		canExportLocalUpdates: saveButton.canExportLocalUpdates,
		savesPost: false,
		shouldCallNormalSavePost: false,
		shouldCallRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

/**
 * Returns inert editor state after a reviewer approves or rejects one risky
 * block item.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 * @param {Object} resolution          Review resolution data.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRiskyBlockReviewItemResolution(
	currentSessionState = {},
	resolution = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );
	const reviewItemId = normalizeNullableString(
		resolution.reviewItemId || resolution.id
	);
	const nextReviewStatus =
		resolution.decision === 'rejected'
			? DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED
			: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE;
	const reviewItemIndex = normalized.riskyBlockReviewItems.findIndex(
		( item ) => item.id === reviewItemId
	);

	if ( reviewItemIndex === -1 ) {
		return normalized;
	}

	const reviewItems = normalized.riskyBlockReviewItems.map(
		( item, index ) => {
			if ( index !== reviewItemIndex ) {
				return item;
			}

			return normalizeRiskyBlockReviewItem( {
				...item,
				reviewStatus: nextReviewStatus,
				reviewerId: resolution.reviewerId,
				approvalProofHash:
					nextReviewStatus ===
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE
						? resolution.approvalProofHash ||
						  `sha256:${ item.id }:approval-proof`
						: null,
				rejectionReason:
					nextReviewStatus ===
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED
						? resolution.rejectionReason || 'reviewer_rejected'
						: null,
			} );
		}
	);

	const pendingReviewItemCount = countRiskyBlockReviewItemsByStatus(
		reviewItems,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW
	);
	const approvedReviewItemCount = countRiskyBlockReviewItemsByStatus(
		reviewItems,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE
	);
	const rejectedReviewItemCount = countRiskyBlockReviewItemsByStatus(
		reviewItems,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED
	);
	const hasPendingReviewItems = pendingReviewItemCount > 0;

	return normalizeDistributedEditingSessionState( {
		...normalized,
		reasonCode: hasPendingReviewItems ? normalized.reasonCode : null,
		riskyBlockReviewStatus: hasPendingReviewItems
			? DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED
			: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_RESOLVED,
		riskyBlockReviewReasonCode: hasPendingReviewItems
			? normalized.riskyBlockReviewReasonCode
			: null,
		riskyBlockReviewItems: reviewItems,
		riskyBlockReviewPendingCount: pendingReviewItemCount,
		riskyBlockReviewApprovedCount: approvedReviewItemCount,
		riskyBlockReviewRejectedCount: rejectedReviewItemCount,
		riskyBlockReviewPrePublishPanelRequired: hasPendingReviewItems,
		riskyBlockReviewSaveButtonLabel: hasPendingReviewItems
			? 'Review changes'
			: 'Update',
		riskyBlockReviewSaveClickAction: hasPendingReviewItems
			? DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW
			: DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
		riskyBlockReviewCanExportLocalUpdates: true,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
}

/**
 * Returns inert editor state when a reviewed risky-block decision has gone
 * stale against a newer server version.
 *
 * @param {Object} currentSessionState Current DE-RTC session state.
 * @param {Object} staleCheck          Server version comparison.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForStaleRiskyBlockReview(
	currentSessionState = {},
	staleCheck = {}
) {
	const normalized =
		normalizeDistributedEditingSessionState( currentSessionState );
	const reviewedServerVersion =
		normalizeNullableString( staleCheck.reviewedServerVersion ) ||
		normalized.riskyBlockReviewItems[ 0 ]?.serverVersion ||
		normalized.serverVersion;
	const currentServerVersion =
		normalizeNullableString( staleCheck.currentServerVersion ) ||
		normalized.serverVersion;

	if (
		! reviewedServerVersion ||
		! currentServerVersion ||
		reviewedServerVersion === currentServerVersion
	) {
		return normalized;
	}

	return normalizeDistributedEditingSessionState( {
		...normalized,
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		serverVersion: currentServerVersion,
		requiresServerStateRefetch: true,
		refetchedServerState: false,
		riskyBlockReviewStatus:
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.STALE_AFTER_REVIEW,
		riskyBlockReviewReasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		riskyBlockReviewItems: normalized.riskyBlockReviewItems.map( ( item ) =>
			normalizeRiskyBlockReviewItem( {
				...item,
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.STALE_AFTER_REVIEW,
			} )
		),
		riskyBlockReviewPendingCount: 0,
		riskyBlockReviewPrePublishPanelRequired: false,
		riskyBlockReviewSaveButtonLabel: 'Refetch required',
		riskyBlockReviewSaveClickAction:
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE,
		riskyBlockReviewCanExportLocalUpdates: true,
		riskyBlockReviewRequiresServerStateRefetch: true,
		riskyBlockReviewReviewedServerVersion: reviewedServerVersion,
		riskyBlockReviewCurrentServerVersion: currentServerVersion,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
	} );
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
	const acceptedReviewApprovalProof = normalizeObject(
		options.acceptedReviewApprovalProof
	);
	const hasAcceptedReviewApprovalProof =
		Object.keys( acceptedReviewApprovalProof ).length > 0;
	const acceptedFreshReviewConsumeValidation = normalizeObject(
		options.acceptedFreshReviewConsumeValidation
	);
	const hasAcceptedFreshReviewConsumeValidation =
		Object.keys( acceptedFreshReviewConsumeValidation ).length > 0;
	const reviewApprovalProofFields = hasAcceptedReviewApprovalProof
		? getRetrySaveReviewApprovalProofFieldsFromResponseOrError(
				{
					acceptedReviewApprovalProof,
				},
				{},
				normalized
		  )
		: getDistributedEditingRetrySaveReviewApprovalProofFields( normalized );
	const freshReviewConsumeValidationFields =
		hasAcceptedFreshReviewConsumeValidation
			? getRetrySaveFreshReviewConsumeValidationFieldsFromResponseOrError(
					{
						acceptedFreshReviewConsumeValidation,
					},
					{},
					normalized
			  )
			: normalizeRetrySaveFreshReviewConsumeValidationFields(
					normalized
			  );
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
		...normalizeRetrySaveReviewMetadataFields(),
		...reviewApprovalProofFields,
		...( hasAcceptedReviewApprovalProof
			? {
					retrySaveReviewApprovalProofStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
					retrySaveReviewApprovalProofReason: null,
					retrySaveReviewApprovalAccepted: true,
			  }
			: {} ),
		...freshReviewConsumeValidationFields,
		...( hasAcceptedFreshReviewConsumeValidation
			? {
					retrySaveFreshReviewConsumeValidationStatus:
						'accepted_for_retry_save',
					retrySaveFreshReviewConsumeValidationReason: null,
					retrySaveFreshReviewConsumeValidationAccepted: true,
					retrySaveFreshReviewDecisionConsumptionValidated: true,
					retrySaveFreshReviewDecisionEligibleForRetrySave: true,
			  }
			: {} ),
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
	const retrySaveFreshReviewConsumeValidationFields =
		getRetrySaveFreshReviewConsumeValidationFieldsFromResponseOrError(
			responseOrError,
			responseData,
			normalizedCurrent
		);
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
			...normalizeRetrySaveReviewMetadataFields(),
			...retrySaveFreshReviewConsumeValidationFields,
			requiresManualConflictResolution: false,
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
		} );
	}

	const hasFreshReviewConsumeValidation = Boolean(
		retrySaveFreshReviewConsumeValidationFields.retrySaveFreshReviewConsumeValidationAccepted ||
			retrySaveFreshReviewConsumeValidationFields.retrySaveFreshReviewDecisionConsumptionValidated
	);
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
	const opaqueReviewApprovalProofTokenRejectionDetail =
		getOpaqueReviewApprovalProofTokenRejectionDetail(
			responseOrError,
			responseData
		);
	const retrySaveReason =
		opaqueReviewApprovalProofTokenRejectionDetail ||
		reasonCode ||
		( result === 'retry_save_applied'
			? DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_MISSING_SAVED_STATE_EVIDENCE
			: result );
	const retrySaveReviewMetadata =
		getRetrySaveReviewMetadataFromResponseOrError(
			responseOrError,
			responseData
		);
	const retrySaveReviewApprovalProofFields =
		opaqueReviewApprovalProofTokenRejectionDetail ||
		hasFreshReviewConsumeValidation
			? normalizeRetrySaveReviewApprovalProofFields()
			: getRetrySaveReviewApprovalProofFieldsFromResponseOrError(
					responseOrError,
					responseData,
					normalizedCurrent
			  );
	const hasAcceptedReviewApprovalProof = Boolean(
		! opaqueReviewApprovalProofTokenRejectionDetail &&
			! hasFreshReviewConsumeValidation &&
			( responseOrError.reviewApprovalProofAccepted ||
				responseOrError.review_approval_proof_accepted ||
				responseOrError.acceptedReviewApprovalProofAvailable ||
				responseOrError.accepted_review_approval_proof_available ||
				responseData.reviewApprovalProofAccepted ||
				responseData.review_approval_proof_accepted ||
				responseData.acceptedReviewApprovalProofAvailable ||
				responseData.accepted_review_approval_proof_available )
	);

	return getDistributedEditingRejectedRetrySaveState( {
		normalizedCurrent,
		reasonCode,
		result:
			result === 'retry_save_applied'
				? DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_MISSING_SAVED_STATE_EVIDENCE
				: result,
		retrySaveReason,
		pendingChangeCount: rejectedPendingChangeCount,
		serverVersion,
		previousServerVersion,
		retrySaveFlags,
		retrySaveReviewMetadata,
		retrySaveReviewApprovalProofFields,
		retrySaveFreshReviewConsumeValidationFields,
		hasAcceptedReviewApprovalProof,
	} );
}

/**
 * Returns DE-RTC editor state for retry-save reviewer approval proof.
 *
 * The proof result is inert. Accepted proof keeps local edits pending and
 * exportable for a later save/retry-save integration turn; all rejection paths
 * keep the same local protection and store only metadata/hash evidence.
 *
 * @param {Object} responseOrError     REST response or API error.
 * @param {Object} currentSessionState Current DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
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
		normalizeCount(
			responseOrError.pendingChangeCount ??
				responseOrError.pending_change_count ??
				responseData.pendingChangeCount ??
				responseData.pending_change_count
		) ||
		normalizedCurrent.pendingChangeCount ||
		( normalizedCurrent.hasPendingChanges ? 1 : 0 );
	const serverVersion =
		normalizeNullableString(
			responseOrError.serverVersion ||
				responseOrError.server_version ||
				responseOrError.reviewedServerVersion ||
				responseOrError.reviewed_server_version ||
				responseData.serverVersion ||
				responseData.server_version ||
				responseData.reviewedServerVersion ||
				responseData.reviewed_server_version
		) ||
		normalizedCurrent.retrySaveReviewApprovalServerVersion ||
		normalizedCurrent.retrySaveServerVersion ||
		normalizedCurrent.serverVersion;
	const previousServerVersion =
		normalizeNullableString(
			responseOrError.previousServerVersion ||
				responseOrError.previous_server_version ||
				responseData.previousServerVersion ||
				responseData.previous_server_version
		) ||
		normalizedCurrent.retrySaveReviewApprovalServerVersion ||
		normalizedCurrent.retrySaveServerVersion ||
		normalizedCurrent.serverVersion;
	const approvalProofFields =
		getRetrySaveReviewApprovalProofFieldsFromResponseOrError(
			responseOrError,
			responseData,
			normalizedCurrent
		);
	const hasApprovalAccepted =
		result === 'review_approval_accepted_for_retry_save' ||
		result === 'retry_save_review_approval_accepted_for_future_save' ||
		result === 'retry_save_reviewer_approval_accepted' ||
		responseOrError.retrySaveReviewApprovalAccepted === true ||
		responseOrError.retry_save_review_approval_accepted === true ||
		responseOrError.reviewApprovalAccepted === true ||
		responseOrError.review_approval_accepted === true ||
		responseData.retrySaveReviewApprovalAccepted === true ||
		responseData.retry_save_review_approval_accepted === true ||
		responseData.reviewApprovalAccepted === true ||
		responseData.review_approval_accepted === true;

	if ( hasApprovalAccepted ) {
		return normalizeDistributedEditingSessionState( {
			...normalizedCurrent,
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			serverVersion,
			pendingChangeCount: pendingChangeCount || 1,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			requiresServerStateAcceptance: false,
			requiresServerStateRefetch: false,
			refetchedServerState: false,
			requiresManualConflictResolution: false,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
			retrySubmitProofReason: null,
			retrySubmitAccepted: false,
			retrySubmitSavePathRequired: false,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
			retrySubmitSaveReason:
				'retry_save_review_approval_requires_save_handoff',
			retrySubmitSavePrepared: false,
			retrySubmitSaveReady: false,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
			retrySaveReason: null,
			retrySaveAccepted: false,
			retrySaveSavesPost: false,
			retrySaveMutatesPostContent: false,
			retrySaveCreatesRevision: false,
			retrySaveClaimsSaved: false,
			retrySaveRevisionCreated: false,
			retrySaveCreatedRevisionIds: [],
			...approvalProofFields,
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalProofReason: null,
			retrySaveReviewApprovalAccepted: true,
			retrySaveReviewApprovalServerVersion: serverVersion,
			retrySaveReviewApprovalPreviousServerVersion: previousServerVersion,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	}

	const detail = normalizeNullableString(
		responseOrError.detail ||
			responseData.detail ||
			responseOrError.errorDetail ||
			responseData.errorDetail
	);
	const reasonCode = normalizeNullableString(
		responseOrError.code ||
			responseOrError.reasonCode ||
			responseOrError.reason_code ||
			responseData.reasonCode ||
			responseData.reason_code
	);
	let disposition = normalizedCurrent.disposition;
	let proofStatus =
		DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.NONE;
	let requiresServerStateRefetch = false;
	let requiresManualConflictResolution =
		normalizedCurrent.requiresManualConflictResolution;

	switch ( reasonCode ) {
		case DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION;
			proofStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.STALE_BASE_REJECTED;
			requiresServerStateRefetch = true;
			requiresManualConflictResolution = false;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT:
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED;
			proofStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.REJECTED_PERMISSION_DENIED;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_ROUTE_MISMATCH;
			proofStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.REJECTED_ROUTE_MISMATCH;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_HASH_MISMATCH:
		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED;
			proofStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.REJECTED_HASH_MISMATCH;
			break;

		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD:
			disposition =
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD;
			proofStatus =
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD;
			break;
	}

	if (
		result === 'hash_mismatch' ||
		result === 'review_approval_hash_mismatch' ||
		detail === 'retry_save_review_approval_hash_mismatch'
	) {
		disposition =
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED;
		proofStatus =
			DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.REJECTED_HASH_MISMATCH;
	}

	return normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		disposition,
		reasonCode,
		serverVersion,
		pendingChangeCount: pendingChangeCount || 1,
		hasPendingChanges: true,
		isAwaitingServerConfirmation: true,
		requiresServerStateRefetch,
		refetchedServerState: false,
		requiresManualConflictResolution,
		...approvalProofFields,
		retrySaveReviewApprovalProofStatus: proofStatus,
		retrySaveReviewApprovalProofReason: reasonCode || detail || result,
		retrySaveReviewApprovalAccepted: false,
		retrySaveReviewApprovalServerVersion: serverVersion,
		retrySaveReviewApprovalPreviousServerVersion: previousServerVersion,
		retrySaveReviewApprovalHashMismatch:
			approvalProofFields.retrySaveReviewApprovalHashMismatch ||
			proofStatus ===
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.REJECTED_HASH_MISMATCH,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: true,
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
	const acceptedReviewApprovalProof =
		getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
			normalized
		);
	const acceptedFreshReviewConsumeValidation =
		getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
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
		hasAcceptedReviewApprovalProof: Boolean( acceptedReviewApprovalProof ),
		acceptedReviewApprovalReviewedBlockItemCount:
			acceptedReviewApprovalProof?.reviewedBlockItemCount ?? 0,
		hasAcceptedFreshReviewConsumeValidation: Boolean(
			acceptedFreshReviewConsumeValidation
		),
		acceptedFreshReviewRequestRecordId:
			acceptedFreshReviewConsumeValidation?.freshReviewRequestRecordId ??
			null,
		request: canRetrySave
			? {
					postId,
					restBase,
					clientBaseVersion,
					acceptedProofServerVersion,
					rebasedFromVersion,
					pendingChangeCount,
					...( acceptedReviewApprovalProof
						? { acceptedReviewApprovalProof }
						: {} ),
					...( acceptedFreshReviewConsumeValidation
						? { acceptedFreshReviewConsumeValidation }
						: {} ),
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
		localUpdatesImportStatus: normalized.localUpdatesImportStatus,
		localUpdatesImportReason: normalized.localUpdatesImportReason,
		localUpdatesImportHasPostContent:
			normalized.localUpdatesImportHasPostContent,
		localUpdatesImportHasAcceptedReviewApprovalProof:
			normalized.localUpdatesImportHasAcceptedReviewApprovalProof,
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

function getDistributedEditingLocalUpdatesImportReviewRequestNoticeStatus(
	status
) {
	switch ( status ) {
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED:
			return 'info';
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_SYNC_META_TAMPERED:
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD:
			return 'error';
	}

	return 'warning';
}

function getDistributedEditingRetrySaveDescriptorFields( normalized ) {
	const retrySaveReviewRequired =
		normalized.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED;
	const retrySaveFreshReviewConsumed = Boolean(
		normalized.retrySaveFreshReviewConsumeValidationAccepted ||
			normalized.retrySaveFreshReviewDecisionConsumptionValidated
	);
	const retrySaveFreshReviewRetrySaveAccepted =
		retrySaveFreshReviewConsumed &&
		normalized.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED;
	const retrySaveFreshReviewRetrySaveRejected =
		retrySaveFreshReviewConsumed &&
		! [
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
		].includes( normalized.retrySaveStatus );
	const retrySaveRequiresUnfilteredHtmlSaver =
		normalized.retrySaveRequiresUnfilteredHtmlSaver ||
		( normalized.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED &&
			normalized.reasonCode ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML );

	return {
		retrySaveStatus: normalized.retrySaveStatus,
		retrySaveReason: normalized.retrySaveReason,
		retrySaveReviewRequired,
		retrySaveRequiresUnfilteredHtmlSaver,
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
		retrySaveFreshReviewConsumed,
		retrySaveFreshReviewRetrySaveAccepted,
		retrySaveFreshReviewRetrySaveRejected,
		retrySaveFreshReviewReviewedBlockItemCount:
			normalized.retrySaveFreshReviewReviewedBlockItemCount,
		retrySaveFreshReviewRequiresFreshReview:
			retrySaveFreshReviewRetrySaveRejected,
		reviewTokenRecoveryStatus: normalized.reviewTokenRecoveryStatus,
		reviewTokenRecoveryReason: normalized.reviewTokenRecoveryReason,
		reviewTokenRecoveryRequiresFreshReview:
			normalized.reviewTokenRecoveryRequiresFreshReview,
		...getDistributedEditingRetrySaveReviewMetadataFields( normalized ),
		...getDistributedEditingRetrySaveReviewApprovalProofFields(
			normalized
		),
		...getDistributedEditingRetrySaveFreshReviewConsumeValidationFields(
			normalized
		),
	};
}

function getDistributedEditingRetrySaveReviewMetadataFields( normalized ) {
	return {
		retrySaveReviewStatus: normalized.retrySaveReviewStatus,
		retrySaveReviewAction: normalized.retrySaveReviewAction,
		retrySaveReviewRequiredCapability:
			normalized.retrySaveReviewRequiredCapability,
		retrySaveReviewerCapability: normalized.retrySaveReviewerCapability,
		retrySaveReviewScope: normalized.retrySaveReviewScope,
		retrySaveEscalationReason: normalized.retrySaveEscalationReason,
		retrySaveRawContentIncluded: normalized.retrySaveRawContentIncluded,
		retrySaveReviewContractType: normalized.retrySaveReviewContractType,
		retrySaveRequiresReviewerEscalation:
			normalized.retrySaveRequiresReviewerEscalation,
		retrySaveReviewEscalationRequired:
			normalized.retrySaveReviewEscalationRequired,
		retrySaveReviewEscalationReason:
			normalized.retrySaveReviewEscalationReason,
		retrySaveReviewRequiresUnfilteredHtml:
			normalized.retrySaveReviewRequiresUnfilteredHtml,
		retrySaveRequiresUnfilteredHtmlSaver:
			normalized.retrySaveRequiresUnfilteredHtmlSaver,
		retrySaveReviewUnfilteredHtmlAllowed:
			normalized.retrySaveReviewUnfilteredHtmlAllowed,
		retrySaveReviewAuthorshipRequired:
			normalized.retrySaveReviewAuthorshipRequired,
		retrySaveReviewContentCapabilityRequired:
			normalized.retrySaveReviewContentCapabilityRequired,
		retrySaveReviewContentFilter: normalized.retrySaveReviewContentFilter,
		retrySaveReviewContentFilterContext:
			normalized.retrySaveReviewContentFilterContext,
		retrySaveReviewContentWouldChangeByKses:
			normalized.retrySaveReviewContentWouldChangeByKses,
		retrySaveReviewProposedContentWouldChangeByKses:
			normalized.retrySaveReviewProposedContentWouldChangeByKses,
		retrySaveReviewCandidateContentWouldChangeByKses:
			normalized.retrySaveReviewCandidateContentWouldChangeByKses,
		retrySaveReviewProposedContentHash:
			normalized.retrySaveReviewProposedContentHash,
		retrySaveReviewFilteredProposedContentHash:
			normalized.retrySaveReviewFilteredProposedContentHash,
		retrySaveReviewCandidateContentHash:
			normalized.retrySaveReviewCandidateContentHash,
		retrySaveReviewFilteredCandidateContentHash:
			normalized.retrySaveReviewFilteredCandidateContentHash,
		retrySaveReviewRawContentIncluded:
			normalized.retrySaveReviewRawContentIncluded,
		retrySaveReviewRecoveryActions:
			normalized.retrySaveReviewRecoveryActions,
	};
}

function getDistributedEditingRetrySaveReviewApprovalProofFields( normalized ) {
	return {
		retrySaveReviewApprovalProofStatus:
			normalized.retrySaveReviewApprovalProofStatus,
		retrySaveReviewApprovalProofReason:
			normalized.retrySaveReviewApprovalProofReason,
		retrySaveReviewApprovalAccepted:
			normalized.retrySaveReviewApprovalAccepted,
		retrySaveReviewApprovalPostId: normalized.retrySaveReviewApprovalPostId,
		retrySaveReviewApprovalPostType:
			normalized.retrySaveReviewApprovalPostType,
		retrySaveReviewApprovalReviewerUserId:
			normalized.retrySaveReviewApprovalReviewerUserId,
		retrySaveReviewApprovalLowPrivilegedSaverUserId:
			normalized.retrySaveReviewApprovalLowPrivilegedSaverUserId,
		retrySaveReviewApprovalServerVersion:
			normalized.retrySaveReviewApprovalServerVersion,
		retrySaveReviewApprovalPreviousServerVersion:
			normalized.retrySaveReviewApprovalPreviousServerVersion,
		retrySaveReviewApprovalRebasedFromVersion:
			normalized.retrySaveReviewApprovalRebasedFromVersion,
		retrySaveReviewApprovalReviewStatus:
			normalized.retrySaveReviewApprovalReviewStatus,
		retrySaveReviewApprovalApprovalStatus:
			normalized.retrySaveReviewApprovalApprovalStatus,
		retrySaveReviewApprovalReviewAction:
			normalized.retrySaveReviewApprovalReviewAction,
		retrySaveReviewApprovalApprovalAction:
			normalized.retrySaveReviewApprovalApprovalAction,
		retrySaveReviewApprovalAction: normalized.retrySaveReviewApprovalAction,
		retrySaveReviewApprovalRequiredCapability:
			normalized.retrySaveReviewApprovalRequiredCapability,
		retrySaveReviewApprovalReviewerCapability:
			normalized.retrySaveReviewApprovalReviewerCapability,
		retrySaveReviewApprovalScope: normalized.retrySaveReviewApprovalScope,
		retrySaveReviewApprovalProposedContentHash:
			normalized.retrySaveReviewApprovalProposedContentHash,
		retrySaveReviewApprovalCandidateContentHash:
			normalized.retrySaveReviewApprovalCandidateContentHash,
		retrySaveReviewApprovalCandidateContentHashScope:
			normalized.retrySaveReviewApprovalCandidateContentHashScope,
		retrySaveReviewApprovalRequiresUnfilteredHtmlSaver:
			normalized.retrySaveReviewApprovalRequiresUnfilteredHtmlSaver,
		retrySaveReviewApprovalExpectedProposedContentHash:
			normalized.retrySaveReviewApprovalExpectedProposedContentHash,
		retrySaveReviewApprovalExpectedCandidateContentHash:
			normalized.retrySaveReviewApprovalExpectedCandidateContentHash,
		retrySaveReviewApprovalHashMismatch:
			normalized.retrySaveReviewApprovalHashMismatch,
		retrySaveReviewApprovalReviewedBlockItems:
			normalized.retrySaveReviewApprovalReviewedBlockItems,
		retrySaveReviewApprovalReviewedBlockItemCount:
			normalized.retrySaveReviewApprovalReviewedBlockItemCount,
		retrySaveReviewApprovalBlockReviewStatus:
			normalized.retrySaveReviewApprovalBlockReviewStatus,
		retrySaveReviewApprovalUnapprovedBlockItemIds:
			normalized.retrySaveReviewApprovalUnapprovedBlockItemIds,
		retrySaveReviewApprovalMismatchedBlockItemFields:
			normalized.retrySaveReviewApprovalMismatchedBlockItemFields,
		retrySaveReviewApprovalRawContentIncluded:
			normalized.retrySaveReviewApprovalRawContentIncluded,
		retrySaveReviewApprovalProofSignature:
			normalized.retrySaveReviewApprovalProofSignature,
		retrySaveReviewApprovalIssuedAt:
			normalized.retrySaveReviewApprovalIssuedAt,
		retrySaveReviewApprovalExpiresAt:
			normalized.retrySaveReviewApprovalExpiresAt,
		retrySaveReviewApprovalSiteId: normalized.retrySaveReviewApprovalSiteId,
		retrySaveReviewApprovalSiteUrl:
			normalized.retrySaveReviewApprovalSiteUrl,
		retrySaveReviewApprovalSiteUuid:
			normalized.retrySaveReviewApprovalSiteUuid,
		retrySaveReviewApprovalSavesPost:
			normalized.retrySaveReviewApprovalSavesPost,
		retrySaveReviewApprovalMutatesPostContent:
			normalized.retrySaveReviewApprovalMutatesPostContent,
		retrySaveReviewApprovalCreatesRevision:
			normalized.retrySaveReviewApprovalCreatesRevision,
		retrySaveReviewApprovalClaimsSaved:
			normalized.retrySaveReviewApprovalClaimsSaved,
	};
}

function getDistributedEditingRetrySaveFreshReviewConsumeValidationFields(
	normalized
) {
	return {
		retrySaveFreshReviewConsumeValidationStatus:
			normalized.retrySaveFreshReviewConsumeValidationStatus,
		retrySaveFreshReviewConsumeValidationReason:
			normalized.retrySaveFreshReviewConsumeValidationReason,
		retrySaveFreshReviewConsumeValidationResult:
			normalized.retrySaveFreshReviewConsumeValidationResult,
		retrySaveFreshReviewConsumeValidationRestRoute:
			normalized.retrySaveFreshReviewConsumeValidationRestRoute,
		retrySaveFreshReviewConsumeValidationAccepted:
			normalized.retrySaveFreshReviewConsumeValidationAccepted,
		retrySaveFreshReviewDecisionConsumptionValidated:
			normalized.retrySaveFreshReviewDecisionConsumptionValidated,
		retrySaveFreshReviewDecisionEligibleForRetrySave:
			normalized.retrySaveFreshReviewDecisionEligibleForRetrySave,
		retrySaveFreshReviewRequestRecordId:
			normalized.retrySaveFreshReviewRequestRecordId,
		retrySaveFreshReviewRequestStatus:
			normalized.retrySaveFreshReviewRequestStatus,
		retrySaveFreshReviewDecisionStatus:
			normalized.retrySaveFreshReviewDecisionStatus,
		retrySaveFreshReviewClientBaseVersion:
			normalized.retrySaveFreshReviewClientBaseVersion,
		retrySaveFreshReviewServerVersion:
			normalized.retrySaveFreshReviewServerVersion,
		retrySaveFreshReviewProposedContentHash:
			normalized.retrySaveFreshReviewProposedContentHash,
		retrySaveFreshReviewReviewedProposedContentHash:
			normalized.retrySaveFreshReviewReviewedProposedContentHash,
		retrySaveFreshReviewCandidateContentHash:
			normalized.retrySaveFreshReviewCandidateContentHash,
		retrySaveFreshReviewReviewedCandidateContentHash:
			normalized.retrySaveFreshReviewReviewedCandidateContentHash,
		retrySaveFreshReviewReviewedBlockItemCount:
			normalized.retrySaveFreshReviewReviewedBlockItemCount,
		retrySaveFreshReviewHashEvidenceStatus:
			normalized.retrySaveFreshReviewHashEvidenceStatus,
		retrySaveFreshReviewRawContentIncluded:
			normalized.retrySaveFreshReviewRawContentIncluded,
		retrySaveFreshReviewExposesRawContent:
			normalized.retrySaveFreshReviewExposesRawContent,
		retrySaveFreshReviewExposesReviewerIds:
			normalized.retrySaveFreshReviewExposesReviewerIds,
		retrySaveFreshReviewSavesPost: normalized.retrySaveFreshReviewSavesPost,
		retrySaveFreshReviewMutatesPostContent:
			normalized.retrySaveFreshReviewMutatesPostContent,
		retrySaveFreshReviewCreatesRevision:
			normalized.retrySaveFreshReviewCreatesRevision,
		retrySaveFreshReviewClaimsSaved:
			normalized.retrySaveFreshReviewClaimsSaved,
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
	retrySaveReviewMetadata = {},
	retrySaveReviewApprovalProofFields = {},
	retrySaveFreshReviewConsumeValidationFields = {},
	hasAcceptedReviewApprovalProof = false,
	retrySaveReason = null,
} ) {
	let disposition = normalizedCurrent.disposition;
	let retrySaveStatus = DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE;
	let requiresServerStateRefetch = false;
	let requiresManualConflictResolution =
		normalizedCurrent.requiresManualConflictResolution;
	const shouldPreserveRetrySubmitProof =
		reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT ||
		reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML;

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

		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML:
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
		retrySubmitProofStatus: shouldPreserveRetrySubmitProof
			? normalizedCurrent.retrySubmitProofStatus
			: DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
		retrySubmitAccepted: shouldPreserveRetrySubmitProof
			? normalizedCurrent.retrySubmitAccepted
			: false,
		retrySubmitSavePathRequired: shouldPreserveRetrySubmitProof
			? normalizedCurrent.retrySubmitSavePathRequired
			: false,
		retrySubmitSaveStatus: shouldPreserveRetrySubmitProof
			? normalizedCurrent.retrySubmitSaveStatus
			: DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
		retrySubmitSaveReason:
			reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED
				? DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.STALE_BASE_REJECTED
				: normalizedCurrent.retrySubmitSaveReason,
		retrySubmitSavePrepared: shouldPreserveRetrySubmitProof
			? normalizedCurrent.retrySubmitSavePrepared
			: false,
		retrySubmitSaveReady: shouldPreserveRetrySubmitProof
			? normalizedCurrent.retrySubmitSaveReady
			: false,
		retrySaveStatus,
		retrySaveReason: retrySaveReason || reasonCode || result,
		retrySaveAccepted: false,
		retrySaveServerVersion: serverVersion,
		retrySavePreviousServerVersion: previousServerVersion,
		...retrySaveFlags,
		...retrySaveReviewMetadata,
		...retrySaveReviewApprovalProofFields,
		...retrySaveFreshReviewConsumeValidationFields,
		...( hasAcceptedReviewApprovalProof
			? {
					retrySaveReviewApprovalProofStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
					retrySaveReviewApprovalProofReason: null,
					retrySaveReviewApprovalAccepted: true,
			  }
			: {} ),
		retrySaveRequiresUnfilteredHtmlSaver:
			reasonCode ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML ||
			retrySaveReviewMetadata.retrySaveRequiresUnfilteredHtmlSaver,
		requiresManualConflictResolution,
		mustOfferLocalCopy: normalizeCount( pendingChangeCount ) > 0,
		canExportLocalUpdates:
			normalizedCurrent.canExportLocalUpdates ||
			normalizeCount( pendingChangeCount ) > 0,
	} );
}

function normalizeRetrySaveReviewMetadataFields( sessionState = {} ) {
	const retrySaveReviewEscalationReason = normalizeNullableString(
		getFirstDefined(
			sessionState.retrySaveReviewEscalationReason,
			sessionState.retrySaveEscalationReason
		)
	);
	const retrySaveReviewRawContentIncluded = Boolean(
		getFirstDefined(
			sessionState.retrySaveReviewRawContentIncluded,
			sessionState.retrySaveRawContentIncluded
		)
	);

	return {
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
		retrySaveReviewContractType: normalizeNullableString(
			sessionState.retrySaveReviewContractType
		),
		retrySaveRequiresReviewerEscalation: Boolean(
			sessionState.retrySaveRequiresReviewerEscalation
		),
		retrySaveReviewEscalationRequired: Boolean(
			sessionState.retrySaveReviewEscalationRequired
		),
		retrySaveEscalationReason: retrySaveReviewEscalationReason,
		retrySaveRawContentIncluded: retrySaveReviewRawContentIncluded,
		retrySaveReviewEscalationReason,
		retrySaveReviewRequiresUnfilteredHtml: Boolean(
			sessionState.retrySaveReviewRequiresUnfilteredHtml
		),
		retrySaveRequiresUnfilteredHtmlSaver: Boolean(
			sessionState.retrySaveRequiresUnfilteredHtmlSaver
		),
		retrySaveReviewUnfilteredHtmlAllowed: Boolean(
			sessionState.retrySaveReviewUnfilteredHtmlAllowed
		),
		retrySaveReviewAuthorshipRequired: Boolean(
			sessionState.retrySaveReviewAuthorshipRequired
		),
		retrySaveReviewContentCapabilityRequired: Boolean(
			sessionState.retrySaveReviewContentCapabilityRequired
		),
		retrySaveReviewContentFilter: normalizeNullableString(
			sessionState.retrySaveReviewContentFilter
		),
		retrySaveReviewContentFilterContext: normalizeNullableString(
			sessionState.retrySaveReviewContentFilterContext
		),
		retrySaveReviewContentWouldChangeByKses: Boolean(
			sessionState.retrySaveReviewContentWouldChangeByKses
		),
		retrySaveReviewProposedContentWouldChangeByKses: Boolean(
			sessionState.retrySaveReviewProposedContentWouldChangeByKses
		),
		retrySaveReviewCandidateContentWouldChangeByKses: Boolean(
			sessionState.retrySaveReviewCandidateContentWouldChangeByKses
		),
		retrySaveReviewProposedContentHash: normalizeNullableString(
			sessionState.retrySaveReviewProposedContentHash
		),
		retrySaveReviewFilteredProposedContentHash: normalizeNullableString(
			sessionState.retrySaveReviewFilteredProposedContentHash
		),
		retrySaveReviewCandidateContentHash: normalizeNullableString(
			sessionState.retrySaveReviewCandidateContentHash
		),
		retrySaveReviewFilteredCandidateContentHash: normalizeNullableString(
			sessionState.retrySaveReviewFilteredCandidateContentHash
		),
		retrySaveReviewRawContentIncluded,
		retrySaveReviewRecoveryActions: normalizeStringList(
			sessionState.retrySaveReviewRecoveryActions
		),
	};
}

function normalizeRetrySaveReviewApprovalProofFields( sessionState = {} ) {
	const retrySaveReviewApprovalProofStatus =
		VALID_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.has(
			sessionState.retrySaveReviewApprovalProofStatus
		)
			? sessionState.retrySaveReviewApprovalProofStatus
			: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.retrySaveReviewApprovalProofStatus;

	return {
		retrySaveReviewApprovalProofStatus,
		retrySaveReviewApprovalProofReason: normalizeNullableString(
			sessionState.retrySaveReviewApprovalProofReason
		),
		retrySaveReviewApprovalProofEnvelope:
			normalizeReviewApprovalProofEnvelope(
				sessionState.retrySaveReviewApprovalProofEnvelope
			),
		retrySaveReviewApprovalAccepted:
			Boolean( sessionState.retrySaveReviewApprovalAccepted ) ||
			retrySaveReviewApprovalProofStatus ===
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
		retrySaveReviewApprovalPostId: normalizeNullableIdString(
			sessionState.retrySaveReviewApprovalPostId
		),
		retrySaveReviewApprovalPostType: normalizeNullableString(
			sessionState.retrySaveReviewApprovalPostType
		),
		retrySaveReviewApprovalReviewerUserId: normalizeNullableIdString(
			sessionState.retrySaveReviewApprovalReviewerUserId
		),
		retrySaveReviewApprovalLowPrivilegedSaverUserId:
			normalizeNullableIdString(
				sessionState.retrySaveReviewApprovalLowPrivilegedSaverUserId
			),
		retrySaveReviewApprovalServerVersion: normalizeNullableString(
			sessionState.retrySaveReviewApprovalServerVersion
		),
		retrySaveReviewApprovalPreviousServerVersion: normalizeNullableString(
			sessionState.retrySaveReviewApprovalPreviousServerVersion
		),
		retrySaveReviewApprovalRebasedFromVersion: normalizeNullableString(
			sessionState.retrySaveReviewApprovalRebasedFromVersion
		),
		retrySaveReviewApprovalReviewStatus: normalizeNullableString(
			sessionState.retrySaveReviewApprovalReviewStatus
		),
		retrySaveReviewApprovalApprovalStatus: normalizeNullableString(
			sessionState.retrySaveReviewApprovalApprovalStatus
		),
		retrySaveReviewApprovalReviewAction: normalizeNullableString(
			sessionState.retrySaveReviewApprovalReviewAction
		),
		retrySaveReviewApprovalApprovalAction: normalizeNullableString(
			sessionState.retrySaveReviewApprovalApprovalAction
		),
		retrySaveReviewApprovalAction: normalizeNullableString(
			sessionState.retrySaveReviewApprovalAction
		),
		retrySaveReviewApprovalRequiredCapability: normalizeNullableString(
			sessionState.retrySaveReviewApprovalRequiredCapability
		),
		retrySaveReviewApprovalReviewerCapability: normalizeNullableString(
			sessionState.retrySaveReviewApprovalReviewerCapability
		),
		retrySaveReviewApprovalScope: normalizeNullableString(
			sessionState.retrySaveReviewApprovalScope
		),
		retrySaveReviewApprovalProposedContentHash: normalizeNullableString(
			sessionState.retrySaveReviewApprovalProposedContentHash
		),
		retrySaveReviewApprovalCandidateContentHash: normalizeNullableString(
			sessionState.retrySaveReviewApprovalCandidateContentHash
		),
		retrySaveReviewApprovalCandidateContentHashScope:
			normalizeNullableString(
				sessionState.retrySaveReviewApprovalCandidateContentHashScope
			),
		retrySaveReviewApprovalRequiresUnfilteredHtmlSaver: Boolean(
			sessionState.retrySaveReviewApprovalRequiresUnfilteredHtmlSaver
		),
		retrySaveReviewApprovalExpectedProposedContentHash:
			normalizeNullableString(
				sessionState.retrySaveReviewApprovalExpectedProposedContentHash
			),
		retrySaveReviewApprovalExpectedCandidateContentHash:
			normalizeNullableString(
				sessionState.retrySaveReviewApprovalExpectedCandidateContentHash
			),
		retrySaveReviewApprovalHashMismatch: Boolean(
			sessionState.retrySaveReviewApprovalHashMismatch
		),
		retrySaveReviewApprovalReviewedBlockItems:
			normalizeRetrySaveReviewApprovalReviewedBlockItems(
				sessionState.retrySaveReviewApprovalReviewedBlockItems
			),
		retrySaveReviewApprovalReviewedBlockItemCount:
			normalizeCountWithFallback(
				sessionState.retrySaveReviewApprovalReviewedBlockItemCount,
				normalizeRetrySaveReviewApprovalReviewedBlockItems(
					sessionState.retrySaveReviewApprovalReviewedBlockItems
				).length
			),
		retrySaveReviewApprovalBlockReviewStatus: normalizeNullableString(
			sessionState.retrySaveReviewApprovalBlockReviewStatus
		),
		retrySaveReviewApprovalUnapprovedBlockItemIds: normalizeStringList(
			sessionState.retrySaveReviewApprovalUnapprovedBlockItemIds
		),
		retrySaveReviewApprovalMismatchedBlockItemFields: normalizeStringList(
			sessionState.retrySaveReviewApprovalMismatchedBlockItemFields
		),
		retrySaveReviewApprovalRawContentIncluded: Boolean(
			sessionState.retrySaveReviewApprovalRawContentIncluded
		),
		retrySaveReviewApprovalProofSignature: normalizeNullableString(
			sessionState.retrySaveReviewApprovalProofSignature
		),
		retrySaveReviewApprovalIssuedAt: normalizeNullableIdString(
			getFirstDefined(
				sessionState.retrySaveReviewApprovalIssuedAt,
				sessionState.retrySaveReviewApprovalIssued_at
			)
		),
		retrySaveReviewApprovalExpiresAt: normalizeNullableIdString(
			getFirstDefined(
				sessionState.retrySaveReviewApprovalExpiresAt,
				sessionState.retrySaveReviewApprovalExpires_at
			)
		),
		retrySaveReviewApprovalSiteId: normalizeNullableIdString(
			getFirstDefined(
				sessionState.retrySaveReviewApprovalSiteId,
				sessionState.retrySaveReviewApprovalSite_id
			)
		),
		retrySaveReviewApprovalSiteUrl: normalizeNullableString(
			getFirstDefined(
				sessionState.retrySaveReviewApprovalSiteUrl,
				sessionState.retrySaveReviewApprovalSite_url
			)
		),
		retrySaveReviewApprovalSiteUuid: normalizeNullableString(
			getFirstDefined(
				sessionState.retrySaveReviewApprovalSiteUuid,
				sessionState.retrySaveReviewApprovalSite_uuid
			)
		),
		retrySaveReviewApprovalSavesPost: Boolean(
			sessionState.retrySaveReviewApprovalSavesPost
		),
		retrySaveReviewApprovalMutatesPostContent: Boolean(
			sessionState.retrySaveReviewApprovalMutatesPostContent
		),
		retrySaveReviewApprovalCreatesRevision: Boolean(
			sessionState.retrySaveReviewApprovalCreatesRevision
		),
		retrySaveReviewApprovalClaimsSaved: Boolean(
			sessionState.retrySaveReviewApprovalClaimsSaved
		),
	};
}

function normalizeRetrySaveFreshReviewConsumeValidationFields(
	sessionState = {}
) {
	const result = normalizeNullableString(
		getFirstDefined(
			sessionState.retrySaveFreshReviewConsumeValidationResult,
			sessionState.freshReviewDecisionConsumptionResult,
			sessionState.fresh_review_decision_consumption_result
		)
	);
	const reason = normalizeNullableString(
		getFirstDefined(
			sessionState.retrySaveFreshReviewConsumeValidationReason,
			sessionState.freshReviewDecisionConsumptionReason,
			sessionState.fresh_review_decision_consumption_reason
		)
	);
	const validationAccepted =
		Boolean(
			getFirstDefined(
				sessionState.retrySaveFreshReviewConsumeValidationAccepted,
				sessionState.freshReviewDecisionConsumptionAccepted,
				sessionState.fresh_review_decision_consumption_accepted
			)
		) ||
		Boolean(
			getFirstDefined(
				sessionState.retrySaveFreshReviewDecisionConsumptionValidated,
				sessionState.freshReviewDecisionConsumptionValidated,
				sessionState.fresh_review_decision_consumption_validated
			)
		) ||
		result === 'fresh_review_decision_eligible_for_retry_save_handoff';
	const consumptionValidated =
		validationAccepted ||
		Boolean(
			getFirstDefined(
				sessionState.retrySaveFreshReviewDecisionConsumptionValidated,
				sessionState.freshReviewDecisionConsumptionValidated,
				sessionState.fresh_review_decision_consumption_validated
			)
		);
	const eligibleForRetrySave =
		validationAccepted ||
		Boolean(
			getFirstDefined(
				sessionState.retrySaveFreshReviewDecisionEligibleForRetrySave,
				sessionState.freshReviewDecisionEligibleForRetrySave,
				sessionState.fresh_review_decision_eligible_for_retry_save
			)
		);
	const status =
		normalizeNullableString(
			sessionState.retrySaveFreshReviewConsumeValidationStatus
		) || ( validationAccepted ? 'accepted_for_retry_save' : null );
	const proposedPostContentHash = normalizeSha256Hash(
		getFirstDefined(
			sessionState.retrySaveFreshReviewProposedContentHash,
			sessionState.freshReviewProposedContentHash,
			sessionState.fresh_review_proposed_content_hash,
			sessionState.proposedPostContentHash,
			sessionState.proposed_post_content_hash
		)
	);
	const candidatePostContentHash = normalizeSha256Hash(
		getFirstDefined(
			sessionState.retrySaveFreshReviewCandidateContentHash,
			sessionState.freshReviewCandidateContentHash,
			sessionState.fresh_review_candidate_content_hash,
			sessionState.candidatePostContentHash,
			sessionState.candidate_post_content_hash
		)
	);

	return {
		retrySaveFreshReviewConsumeValidationStatus: status,
		retrySaveFreshReviewConsumeValidationReason: reason,
		retrySaveFreshReviewConsumeValidationResult: result,
		retrySaveFreshReviewConsumeValidationRestRoute: normalizeNullableString(
			getFirstDefined(
				sessionState.retrySaveFreshReviewConsumeValidationRestRoute,
				sessionState.freshReviewConsumeRestRoute,
				sessionState.fresh_review_consume_rest_route,
				sessionState.restRoute,
				sessionState.rest_route
			)
		),
		retrySaveFreshReviewConsumeValidationAccepted: validationAccepted,
		retrySaveFreshReviewDecisionConsumptionValidated: consumptionValidated,
		retrySaveFreshReviewDecisionEligibleForRetrySave: eligibleForRetrySave,
		retrySaveFreshReviewRequestRecordId: normalizeNullableString(
			getFirstDefined(
				sessionState.retrySaveFreshReviewRequestRecordId,
				sessionState.freshReviewRequestRecordId,
				sessionState.fresh_review_request_record_id,
				sessionState.requestRecordId,
				sessionState.request_record_id
			)
		),
		retrySaveFreshReviewRequestStatus: normalizeNullableString(
			getFirstDefined(
				sessionState.retrySaveFreshReviewRequestStatus,
				sessionState.freshReviewRequestStatus,
				sessionState.fresh_review_request_status
			)
		),
		retrySaveFreshReviewDecisionStatus: normalizeNullableString(
			getFirstDefined(
				sessionState.retrySaveFreshReviewDecisionStatus,
				sessionState.freshReviewDecisionStatus,
				sessionState.fresh_review_decision_status
			)
		),
		retrySaveFreshReviewClientBaseVersion: normalizeNullableString(
			getFirstDefined(
				sessionState.retrySaveFreshReviewClientBaseVersion,
				sessionState.freshReviewClientBaseVersion,
				sessionState.fresh_review_client_base_version,
				sessionState.clientBaseVersion,
				sessionState.client_base_version
			)
		),
		retrySaveFreshReviewServerVersion: normalizeNullableString(
			getFirstDefined(
				sessionState.retrySaveFreshReviewServerVersion,
				sessionState.freshReviewServerVersion,
				sessionState.fresh_review_server_version,
				sessionState.serverVersion,
				sessionState.server_version
			)
		),
		retrySaveFreshReviewProposedContentHash: proposedPostContentHash,
		retrySaveFreshReviewReviewedProposedContentHash:
			normalizeSha256Hash(
				getFirstDefined(
					sessionState.retrySaveFreshReviewReviewedProposedContentHash,
					sessionState.freshReviewReviewedProposedContentHash,
					sessionState.fresh_review_reviewed_proposed_content_hash,
					sessionState.reviewedProposedContentHash,
					sessionState.reviewed_proposed_content_hash
				)
			) || proposedPostContentHash,
		retrySaveFreshReviewCandidateContentHash: candidatePostContentHash,
		retrySaveFreshReviewReviewedCandidateContentHash:
			normalizeSha256Hash(
				getFirstDefined(
					sessionState.retrySaveFreshReviewReviewedCandidateContentHash,
					sessionState.freshReviewReviewedCandidateContentHash,
					sessionState.fresh_review_reviewed_candidate_content_hash,
					sessionState.reviewedCandidateContentHash,
					sessionState.reviewed_candidate_content_hash
				)
			) || candidatePostContentHash,
		retrySaveFreshReviewReviewedBlockItemCount: normalizeCount(
			getFirstDefined(
				sessionState.retrySaveFreshReviewReviewedBlockItemCount,
				sessionState.freshReviewReviewedBlockItemCount,
				sessionState.fresh_review_reviewed_block_item_count,
				sessionState.reviewedBlockItemCount,
				sessionState.reviewed_block_item_count
			)
		),
		retrySaveFreshReviewHashEvidenceStatus: normalizeNullableString(
			getFirstDefined(
				sessionState.retrySaveFreshReviewHashEvidenceStatus,
				sessionState.freshReviewHashEvidenceStatus,
				sessionState.fresh_review_hash_evidence_status,
				sessionState.hashEvidenceStatus,
				sessionState.hash_evidence_status
			)
		),
		retrySaveFreshReviewRawContentIncluded: false,
		retrySaveFreshReviewExposesRawContent: false,
		retrySaveFreshReviewExposesReviewerIds: false,
		retrySaveFreshReviewSavesPost: Boolean(
			sessionState.retrySaveFreshReviewSavesPost
		),
		retrySaveFreshReviewMutatesPostContent: Boolean(
			sessionState.retrySaveFreshReviewMutatesPostContent
		),
		retrySaveFreshReviewCreatesRevision: Boolean(
			sessionState.retrySaveFreshReviewCreatesRevision
		),
		retrySaveFreshReviewClaimsSaved: Boolean(
			sessionState.retrySaveFreshReviewClaimsSaved
		),
	};
}

function normalizeRetrySaveReviewApprovalReviewedBlockItems( value ) {
	if ( ! Array.isArray( value ) ) {
		return [];
	}

	return value
		.map( ( item ) =>
			normalizeRetrySaveReviewApprovalReviewedBlockItem( item )
		)
		.filter( ( item ) => item.id !== null );
}

function normalizeRetrySaveReviewApprovalReviewedBlockItem( item = {} ) {
	const proposedContentHash = normalizeNullableString(
		getFirstDefined( item.proposedContentHash, item.proposed_content_hash )
	);

	return {
		id: normalizeNullableString( item.id ),
		blockClientId: normalizeNullableString(
			getFirstDefined( item.blockClientId, item.block_client_id )
		),
		blockName: normalizeNullableString(
			getFirstDefined( item.blockName, item.block_name )
		),
		blockLabel: normalizeNullableString(
			getFirstDefined( item.blockLabel, item.block_label )
		),
		blockPath: normalizeBlockPath(
			getFirstDefined( item.blockPath, item.block_path )
		),
		changeKind: normalizeNullableString(
			getFirstDefined( item.changeKind, item.change_kind )
		),
		riskReason: normalizeNullableString(
			getFirstDefined( item.riskReason, item.risk_reason )
		),
		baseContentHash: normalizeNullableString(
			getFirstDefined( item.baseContentHash, item.base_content_hash )
		),
		proposedContentHash,
		reviewedProposedContentHash:
			normalizeNullableString(
				getFirstDefined(
					item.reviewedProposedContentHash,
					item.reviewed_proposed_content_hash
				)
			) || proposedContentHash,
		ksesFilteredContentHash: normalizeNullableString(
			getFirstDefined(
				item.ksesFilteredContentHash,
				item.kses_filtered_content_hash
			)
		),
		reviewStatus:
			normalizeNullableString(
				getFirstDefined( item.reviewStatus, item.review_status )
			) ||
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
		reviewEvidenceType:
			normalizeNullableString(
				getFirstDefined(
					item.reviewEvidenceType,
					item.review_evidence_type
				)
			) || 'kses_block_hash_only_change',
		contentReviewPolicy:
			normalizeNullableString(
				getFirstDefined(
					item.contentReviewPolicy,
					item.content_review_policy
				)
			) || 'kses',
		rawContentIncluded: false,
		exposesRawContent: false,
	};
}

function normalizeFreshReviewLifecycleFields( sessionState = {} ) {
	const freshReviewRequestRecord = normalizeObject(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewRequestRecord,
			sessionState.freshReviewRequestRecord,
			sessionState.fresh_review_request_record
		)
	);
	const debugContract = normalizeObject(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewDebugContract,
			sessionState.freshReviewDebugContract,
			sessionState.fresh_review_debug_contract
		)
	);
	const requestedRetrievalStatus =
		VALID_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.has(
			sessionState.localUpdatesImportFreshReviewLifecycleRetrievalStatus
		)
			? sessionState.localUpdatesImportFreshReviewLifecycleRetrievalStatus
			: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.localUpdatesImportFreshReviewLifecycleRetrievalStatus;
	const lifecycleDebugAvailable = Boolean(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewLifecycleDebugAvailable,
			sessionState.freshReviewLifecycleDebugAvailable,
			sessionState.fresh_review_lifecycle_debug_available
		)
	);
	const supportEvidenceAvailable = Boolean(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewSupportEvidenceAvailable,
			sessionState.freshReviewSupportEvidenceAvailable,
			sessionState.fresh_review_support_evidence_available
		)
	);
	const result = normalizeNullableString(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewLifecycleResult,
			sessionState.freshReviewLifecycleResult,
			sessionState.result
		)
	);
	let retrievalStatus = requestedRetrievalStatus;

	if ( lifecycleDebugAvailable || supportEvidenceAvailable ) {
		retrievalStatus =
			DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.AVAILABLE;
	} else if (
		result ||
		normalizeNullableString(
			getFirstDefined(
				sessionState.detail,
				sessionState.data?.detail,
				sessionState.freshReviewLifecycleDetail,
				sessionState.fresh_review_lifecycle_detail
			)
		) === 'fresh_review_lifecycle_record_unavailable'
	) {
		retrievalStatus =
			DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.UNAVAILABLE;
	}

	const decisionCounts = normalizeFreshReviewReviewedBlockDecisionCounts(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewLifecycleReviewedBlockDecisionCounts,
			sessionState.freshReviewReviewedBlockDecisionCounts,
			sessionState.fresh_review_reviewed_block_decision_counts,
			debugContract.reviewedBlockDecisionCounts,
			debugContract.reviewed_block_decision_counts,
			freshReviewRequestRecord.reviewedBlockDecisionCounts,
			freshReviewRequestRecord.reviewed_block_decision_counts
		)
	);
	const approvedBlockItemCount = normalizeCountWithFallback(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewLifecycleApprovedBlockItemCount,
			sessionState.freshReviewApprovedBlockItemCount,
			sessionState.fresh_review_approved_block_item_count
		),
		decisionCounts.approved
	);
	const rejectedBlockItemCount = normalizeCountWithFallback(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewLifecycleRejectedBlockItemCount,
			sessionState.freshReviewRejectedBlockItemCount,
			sessionState.fresh_review_rejected_block_item_count
		),
		decisionCounts.rejected
	);
	const lifecycleStatus = normalizeNullableString(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewLifecycleStatus,
			sessionState.freshReviewLifecycleStatus,
			sessionState.fresh_review_lifecycle_status,
			debugContract.lifecycleStatus,
			debugContract.lifecycle_status,
			freshReviewRequestRecord.lifecycleStatus,
			freshReviewRequestRecord.lifecycle_status
		)
	);
	const lifecycleAction = normalizeNullableString(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewLifecycleAction,
			sessionState.freshReviewLifecycleAction,
			sessionState.fresh_review_lifecycle_action
		)
	);
	const decisionLifecycleStatus = normalizeNullableString(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewDecisionLifecycleStatus,
			sessionState.freshReviewDecisionLifecycleStatus,
			sessionState.fresh_review_decision_lifecycle_status
		)
	);
	const decisionLifecycleAction = normalizeNullableString(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewDecisionLifecycleAction,
			sessionState.freshReviewDecisionLifecycleAction,
			sessionState.fresh_review_decision_lifecycle_action,
			lifecycleAction
		)
	);
	const reviewerCapabilityDriftRecheckSupported = Boolean(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewLifecycleReviewerCapabilityDriftRecheckSupported,
			sessionState.freshReviewReviewerCapabilityDriftRecheckSupported,
			debugContract.reviewerCapabilityDriftRecheckSupported,
			debugContract.reviewer_capability_drift_recheck_supported
		)
	);
	const requiresNewReviewIfReviewerAuthorityCannotBeRechecked = Boolean(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewLifecycleRequiresNewReviewIfReviewerAuthorityCannotBeRechecked,
			sessionState.freshReviewRequiresNewReviewIfReviewerAuthorityCannotBeRechecked,
			debugContract.requiresNewReviewIfReviewerAuthorityCannotBeRechecked,
			debugContract.requires_new_review_if_reviewer_authority_cannot_be_rechecked
		)
	);
	const hasAuthorityDrift =
		decisionLifecycleStatus === 'capability_drift' ||
		lifecycleStatus === 'capability_drift';
	const requiresFreshReviewDueToAuthority = Boolean(
		sessionState.localUpdatesImportFreshReviewRequiresFreshReviewDueToAuthority ||
			hasAuthorityDrift ||
			decisionLifecycleAction === 'request_new_fresh_review'
	);
	let reviewerAuthorityStatus =
		DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.NONE;

	if ( hasAuthorityDrift ) {
		reviewerAuthorityStatus =
			DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.AUTHORITY_DRIFT_REQUIRES_FRESH_REVIEW;
	} else if ( requiresFreshReviewDueToAuthority ) {
		reviewerAuthorityStatus =
			DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.FRESH_REVIEW_REQUIRED;
	} else if (
		requiresNewReviewIfReviewerAuthorityCannotBeRechecked &&
		! reviewerCapabilityDriftRecheckSupported
	) {
		reviewerAuthorityStatus =
			DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.RECHECK_UNSUPPORTED;
	}

	return {
		localUpdatesImportFreshReviewLifecycleRetrievalStatus: retrievalStatus,
		localUpdatesImportFreshReviewLifecycleResult: result,
		localUpdatesImportFreshReviewLifecycleRestRoute:
			normalizeNullableString(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewLifecycleRestRoute,
					sessionState.freshReviewLifecycleRestRoute,
					sessionState.restRoute,
					sessionState.rest_route
				)
			),
		localUpdatesImportFreshReviewLifecycleDebugAvailable:
			lifecycleDebugAvailable,
		localUpdatesImportFreshReviewSupportEvidenceAvailable:
			supportEvidenceAvailable,
		localUpdatesImportFreshReviewLifecycleStatus: lifecycleStatus,
		localUpdatesImportFreshReviewLifecycleEvent: normalizeNullableString(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleEvent,
				sessionState.freshReviewLifecycleEvent,
				sessionState.fresh_review_lifecycle_event,
				debugContract.lifecycleEvent,
				debugContract.lifecycle_event,
				freshReviewRequestRecord.lifecycleEvent,
				freshReviewRequestRecord.lifecycle_event
			)
		),
		localUpdatesImportFreshReviewLifecycleReason: normalizeNullableString(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleReason,
				sessionState.freshReviewLifecycleReason,
				sessionState.fresh_review_lifecycle_reason,
				debugContract.lifecycleReason,
				debugContract.lifecycle_reason,
				freshReviewRequestRecord.lifecycleReason,
				freshReviewRequestRecord.lifecycle_reason
			)
		),
		localUpdatesImportFreshReviewLifecycleAction: lifecycleAction,
		localUpdatesImportFreshReviewLifecycleRequestStatus:
			normalizeNullableString(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewLifecycleRequestStatus,
					sessionState.freshReviewRequestStatus,
					sessionState.fresh_review_request_status,
					freshReviewRequestRecord.status,
					freshReviewRequestRecord.lifecycle_status
				)
			),
		localUpdatesImportFreshReviewLifecycleDecisionStatus:
			normalizeNullableString(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewLifecycleDecisionStatus,
					sessionState.freshReviewDecisionStatus,
					sessionState.fresh_review_decision_status,
					debugContract.decisionStatus,
					debugContract.decision_status,
					freshReviewRequestRecord.decisionStatus,
					freshReviewRequestRecord.decision_status
				)
			),
		localUpdatesImportFreshReviewLifecycleDecisionRecorded: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleDecisionRecorded,
				sessionState.freshReviewDecisionRecorded,
				sessionState.fresh_review_decision_recorded,
				debugContract.decisionRecorded,
				debugContract.decision_recorded
			)
		),
		localUpdatesImportFreshReviewLifecycleDecisionConsumed: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleDecisionConsumed,
				sessionState.freshReviewDecisionConsumed,
				sessionState.fresh_review_decision_consumed,
				debugContract.decisionConsumed,
				debugContract.decision_consumed
			)
		),
		localUpdatesImportFreshReviewLifecycleRetrySaveApplied: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleRetrySaveApplied,
				sessionState.freshReviewRetrySaveApplied,
				sessionState.fresh_review_retry_save_applied,
				debugContract.retrySaveApplied,
				debugContract.retry_save_applied
			)
		),
		localUpdatesImportFreshReviewLifecycleConsumesReviewDecision: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleConsumesReviewDecision,
				sessionState.freshReviewConsumesReviewDecision,
				sessionState.fresh_review_consumes_review_decision,
				debugContract.consumesReviewDecision,
				debugContract.consumes_review_decision
			)
		),
		localUpdatesImportFreshReviewLifecycleImportedHandoff: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleImportedHandoff,
				sessionState.freshReviewImportedHandoff,
				sessionState.fresh_review_imported_handoff,
				debugContract.importedFreshReviewHandoff,
				debugContract.imported_fresh_review_handoff
			)
		),
		localUpdatesImportFreshReviewLifecyclePreviousServerVersion:
			normalizeNullableString(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewLifecyclePreviousServerVersion,
					sessionState.freshReviewPreviousServerVersion,
					sessionState.fresh_review_previous_server_version,
					debugContract.previousServerVersion,
					debugContract.previous_server_version
				)
			),
		localUpdatesImportFreshReviewLifecycleSavedServerVersion:
			normalizeNullableString(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewLifecycleSavedServerVersion,
					sessionState.freshReviewSavedServerVersion,
					sessionState.fresh_review_saved_server_version,
					debugContract.savedServerVersion,
					debugContract.saved_server_version
				)
			),
		localUpdatesImportFreshReviewLifecycleReviewedBlockItemCount:
			normalizeCountWithFallback(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewLifecycleReviewedBlockItemCount,
					sessionState.freshReviewReviewedBlockItemCount,
					sessionState.fresh_review_reviewed_block_item_count,
					debugContract.reviewedBlockItemCount,
					debugContract.reviewed_block_item_count
				),
				0
			),
		localUpdatesImportFreshReviewLifecycleApprovedBlockItemCount:
			approvedBlockItemCount,
		localUpdatesImportFreshReviewLifecycleRejectedBlockItemCount:
			rejectedBlockItemCount,
		localUpdatesImportFreshReviewLifecycleHashEvidenceFields:
			normalizeStringList(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewLifecycleHashEvidenceFields,
					sessionState.freshReviewHashEvidenceFields,
					sessionState.fresh_review_hash_evidence_fields,
					debugContract.hashEvidenceFields,
					debugContract.hash_evidence_fields
				)
			),
		localUpdatesImportFreshReviewLifecycleVersionEvidenceFields:
			normalizeStringList(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewLifecycleVersionEvidenceFields,
					sessionState.freshReviewVersionEvidenceFields,
					sessionState.fresh_review_version_evidence_fields,
					debugContract.versionEvidenceFields,
					debugContract.version_evidence_fields
				)
			),
		localUpdatesImportFreshReviewLifecycleReviewerIdentityRetained: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleReviewerIdentityRetained,
				sessionState.freshReviewReviewerIdentityRetained,
				debugContract.reviewerIdentityRetained,
				debugContract.reviewer_identity_retained
			)
		),
		localUpdatesImportFreshReviewLifecycleReviewerCapabilityDriftRecheckSupported:
			reviewerCapabilityDriftRecheckSupported,
		localUpdatesImportFreshReviewLifecycleRequiresNewReviewIfReviewerAuthorityCannotBeRechecked:
			requiresNewReviewIfReviewerAuthorityCannotBeRechecked,
		localUpdatesImportFreshReviewLifecycleExposesRawContent: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleExposesRawContent,
				sessionState.freshReviewLifecycleExposesRawContent,
				debugContract.exposesRawContent,
				debugContract.exposes_raw_content
			)
		),
		localUpdatesImportFreshReviewLifecycleExposesProofInternals: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleExposesProofInternals,
				sessionState.freshReviewLifecycleExposesProofInternals,
				debugContract.exposesProofInternals,
				debugContract.exposes_proof_internals
			)
		),
		localUpdatesImportFreshReviewLifecycleExposesReviewerIdentity: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleExposesReviewerIdentity,
				sessionState.freshReviewLifecycleExposesReviewerIdentity,
				debugContract.exposesReviewerIdentity,
				debugContract.exposes_reviewer_identity
			)
		),
		localUpdatesImportFreshReviewLifecycleExposesSaverIdentity: Boolean(
			getFirstDefined(
				sessionState.localUpdatesImportFreshReviewLifecycleExposesSaverIdentity,
				sessionState.freshReviewLifecycleExposesSaverIdentity,
				debugContract.exposesSaverIdentity,
				debugContract.exposes_saver_identity
			)
		),
		localUpdatesImportFreshReviewDecisionLifecycleStatus:
			decisionLifecycleStatus,
		localUpdatesImportFreshReviewDecisionLifecycleAction:
			decisionLifecycleAction,
		localUpdatesImportFreshReviewReviewerAuthorityStatus:
			reviewerAuthorityStatus,
		localUpdatesImportFreshReviewRequiresFreshReviewDueToAuthority:
			requiresFreshReviewDueToAuthority,
	};
}

function normalizeFreshReviewReviewedBlockDecisionCounts( value ) {
	const counts = normalizeObject( value );

	return {
		approved: normalizeCount(
			getFirstDefined( counts.approved, counts.approved_count )
		),
		rejected: normalizeCount(
			getFirstDefined( counts.rejected, counts.rejected_count )
		),
	};
}

function normalizeFreshReviewDecisionFields(
	sessionState = {},
	{
		localUpdatesImportRequiresFreshReview = false,
		localUpdatesImportReviewRequestStatus = DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.NONE,
	} = {}
) {
	const freshReviewRequested =
		localUpdatesImportRequiresFreshReview &&
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
		].includes( localUpdatesImportReviewRequestStatus );
	const decisionItems = freshReviewRequested
		? normalizeFreshReviewDecisionItems(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewDecisionItems,
					sessionState.freshReviewDecisionItems
				)
		  )
		: [];
	const pendingDecisionCount = countRiskyBlockReviewItemsByStatus(
		decisionItems,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW
	);
	const approvedDecisionCount = countRiskyBlockReviewItemsByStatus(
		decisionItems,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE
	);
	const rejectedDecisionCount = countRiskyBlockReviewItemsByStatus(
		decisionItems,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED
	);
	const decisionReady =
		freshReviewRequested &&
		decisionItems.length > 0 &&
		pendingDecisionCount === 0;
	const requestedDecisionStatus = VALID_FRESH_REVIEW_DECISION_STATUSES.has(
		sessionState.localUpdatesImportFreshReviewDecisionStatus
	)
		? sessionState.localUpdatesImportFreshReviewDecisionStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.localUpdatesImportFreshReviewDecisionStatus;
	let decisionStatus =
		DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.NONE;

	if ( freshReviewRequested ) {
		if (
			requestedDecisionStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED
		) {
			decisionStatus =
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED;
		} else if (
			requestedDecisionStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.REJECTED
		) {
			decisionStatus =
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.REJECTED;
		} else if ( decisionReady ) {
			decisionStatus =
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY;
		} else if (
			decisionItems.length > 0 ||
			Boolean(
				sessionState.localUpdatesImportFreshReviewDecisionPanelRequired
			) ||
			requestedDecisionStatus !==
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.NONE
		) {
			decisionStatus =
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW;
		}
	}

	const reviewedBlockItems = decisionReady
		? getFreshReviewDecisionReviewedBlockItemsFromItems( decisionItems )
		: [];
	const reviewedBlockItemCount =
		reviewedBlockItems.length ||
		( decisionStatus ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED
			? normalizeCount(
					sessionState.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount
			  )
			: 0 );

	return {
		localUpdatesImportFreshReviewDecisionStatus: decisionStatus,
		localUpdatesImportFreshReviewDecisionResult: freshReviewRequested
			? normalizeNullableString(
					sessionState.localUpdatesImportFreshReviewDecisionResult
			  )
			: null,
		localUpdatesImportFreshReviewDecisionRestRoute: freshReviewRequested
			? normalizeNullableString(
					sessionState.localUpdatesImportFreshReviewDecisionRestRoute
			  )
			: null,
		localUpdatesImportFreshReviewDecisionAccepted:
			freshReviewRequested &&
			Boolean(
				sessionState.localUpdatesImportFreshReviewDecisionAccepted
			),
		localUpdatesImportFreshReviewDecisionSubmitted:
			freshReviewRequested &&
			Boolean(
				sessionState.localUpdatesImportFreshReviewDecisionSubmitted
			),
		localUpdatesImportFreshReviewDecisionDecision: freshReviewRequested
			? normalizeNullableString(
					sessionState.localUpdatesImportFreshReviewDecisionDecision
			  )
			: null,
		localUpdatesImportFreshReviewDecisionReason: freshReviewRequested
			? normalizeNullableString(
					sessionState.localUpdatesImportFreshReviewDecisionReason
			  )
			: null,
		localUpdatesImportFreshReviewDecisionItems: decisionItems,
		localUpdatesImportFreshReviewDecisionItemCount: decisionItems.length,
		localUpdatesImportFreshReviewDecisionPendingCount: pendingDecisionCount,
		localUpdatesImportFreshReviewDecisionApprovedCount:
			approvedDecisionCount,
		localUpdatesImportFreshReviewDecisionRejectedCount:
			rejectedDecisionCount,
		localUpdatesImportFreshReviewDecisionPanelRequired:
			freshReviewRequested &&
			( decisionItems.length > 0 ||
				decisionStatus ===
					DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW ),
		localUpdatesImportFreshReviewDecisionReady: decisionReady,
		localUpdatesImportFreshReviewDecisionReviewedBlockItems:
			reviewedBlockItems,
		localUpdatesImportFreshReviewDecisionReviewedBlockItemCount:
			reviewedBlockItemCount,
		localUpdatesImportFreshReviewDecisionSavesPost: false,
		localUpdatesImportFreshReviewDecisionCallsNormalSavePost: false,
		localUpdatesImportFreshReviewDecisionCallsRetrySaveEndpoint: false,
		localUpdatesImportFreshReviewDecisionDispatchesNotice: false,
		localUpdatesImportFreshReviewDecisionMutatesEditorContent: false,
		localUpdatesImportFreshReviewDecisionMutatesPersistedPostContent: false,
		localUpdatesImportFreshReviewDecisionChangesPostLock: false,
		localUpdatesImportFreshReviewDecisionClaimsSaved: false,
		localUpdatesImportFreshReviewDecisionRawContentIncluded: false,
		localUpdatesImportFreshReviewDecisionExposesRawContent: false,
		localUpdatesImportFreshReviewDecisionExposesProofSignature: false,
		localUpdatesImportFreshReviewDecisionExposesReviewerIds: false,
	};
}

function normalizeFreshReviewRetrySaveHandoffFields(
	sessionState = {},
	{ freshReviewDecisionFields = {} } = {}
) {
	const requestedStatus = VALID_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.has(
		sessionState.localUpdatesImportFreshReviewRetrySaveHandoffStatus
	)
		? sessionState.localUpdatesImportFreshReviewRetrySaveHandoffStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.localUpdatesImportFreshReviewRetrySaveHandoffStatus;
	const hasRecordedFreshReviewDecision =
		freshReviewDecisionFields.localUpdatesImportFreshReviewDecisionStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED &&
		Boolean(
			freshReviewDecisionFields.localUpdatesImportFreshReviewDecisionAccepted
		);
	const hasApprovedFreshReviewDecision =
		hasRecordedFreshReviewDecision &&
		freshReviewDecisionFields.localUpdatesImportFreshReviewDecisionDecision ===
			'approved';
	const proposedPostContentHash = normalizeSha256Hash(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash,
			sessionState.localUpdatesImportVerifiedPostContentHash,
			sessionState.proposedPostContentHash,
			sessionState.proposed_post_content_hash
		)
	);
	const candidatePostContentHash = normalizeSha256Hash(
		getFirstDefined(
			sessionState.localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash,
			sessionState.candidatePostContentHash,
			sessionState.candidate_post_content_hash
		)
	);
	let handoffStatus =
		DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.NONE;

	if ( hasApprovedFreshReviewDecision ) {
		handoffStatus =
			requestedStatus ===
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE ||
			requestedStatus ===
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING
				? requestedStatus
				: DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.READY;
	} else if (
		requestedStatus ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.BLOCKED
	) {
		handoffStatus =
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.BLOCKED;
	}

	return {
		localUpdatesImportFreshReviewRetrySaveHandoffStatus: handoffStatus,
		localUpdatesImportFreshReviewRetrySaveHandoffReason:
			handoffStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.BLOCKED
				? normalizeNullableString(
						sessionState.localUpdatesImportFreshReviewRetrySaveHandoffReason
				  )
				: null,
		localUpdatesImportFreshReviewRetrySaveHandoffResult:
			normalizeNullableString(
				sessionState.localUpdatesImportFreshReviewRetrySaveHandoffResult
			),
		localUpdatesImportFreshReviewRetrySaveHandoffRestRoute:
			normalizeNullableString(
				sessionState.localUpdatesImportFreshReviewRetrySaveHandoffRestRoute
			),
		localUpdatesImportFreshReviewRetrySaveHandoffReady:
			handoffStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.READY,
		localUpdatesImportFreshReviewRetrySaveHandoffValidating:
			handoffStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING,
		localUpdatesImportFreshReviewRetrySaveHandoffAccepted:
			handoffStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
		localUpdatesImportFreshReviewRetrySaveHandoffCallsNormalSavePost: false,
		localUpdatesImportFreshReviewRetrySaveHandoffCallsRetrySaveEndpoint: false,
		localUpdatesImportFreshReviewRetrySaveHandoffDispatchesNotice: false,
		localUpdatesImportFreshReviewRetrySaveHandoffMutatesEditorContent: false,
		localUpdatesImportFreshReviewRetrySaveHandoffMutatesPersistedPostContent: false,
		localUpdatesImportFreshReviewRetrySaveHandoffChangesPostLock: false,
		localUpdatesImportFreshReviewRetrySaveHandoffClaimsSaved: false,
		localUpdatesImportFreshReviewRetrySaveHandoffExposesRawContent: false,
		localUpdatesImportFreshReviewRetrySaveHandoffExposesProofSignature: false,
		localUpdatesImportFreshReviewRetrySaveHandoffExposesReviewerIds: false,
		localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion:
			normalizeNullableString(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion,
					sessionState.clientBaseVersion,
					sessionState.client_base_version
				)
			),
		localUpdatesImportFreshReviewRetrySaveHandoffServerVersion:
			normalizeNullableString(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewRetrySaveHandoffServerVersion,
					sessionState.serverVersion,
					sessionState.server_version
				)
			),
		localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash:
			proposedPostContentHash,
		localUpdatesImportFreshReviewRetrySaveHandoffReviewedProposedContentHash:
			normalizeSha256Hash(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewRetrySaveHandoffReviewedProposedContentHash,
					sessionState.reviewedProposedContentHash,
					sessionState.reviewed_proposed_content_hash
				)
			) || proposedPostContentHash,
		localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash:
			candidatePostContentHash,
		localUpdatesImportFreshReviewRetrySaveHandoffReviewedCandidateContentHash:
			normalizeSha256Hash(
				getFirstDefined(
					sessionState.localUpdatesImportFreshReviewRetrySaveHandoffReviewedCandidateContentHash,
					sessionState.reviewedCandidateContentHash,
					sessionState.reviewed_candidate_content_hash
				)
			) || candidatePostContentHash,
		localUpdatesImportFreshReviewRetrySaveHandoffHashEvidenceStatus:
			normalizeNullableString(
				sessionState.localUpdatesImportFreshReviewRetrySaveHandoffHashEvidenceStatus
			),
	};
}

function normalizeFreshReviewDecisionItems( value ) {
	if ( ! Array.isArray( value ) ) {
		return [];
	}

	return value
		.map( ( item ) => normalizeFreshReviewDecisionItem( item ) )
		.filter( ( item ) => item.id !== null );
}

function normalizeFreshReviewDecisionItem( item = {} ) {
	const proposedContentHash = normalizeNullableString(
		getFirstDefined( item.proposedContentHash, item.proposed_content_hash )
	);
	const reviewStatus = [
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
	].includes( getFirstDefined( item.reviewStatus, item.review_status ) )
		? getFirstDefined( item.reviewStatus, item.review_status )
		: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW;

	return {
		id: normalizeNullableString( item.id ),
		blockClientId: normalizeNullableString(
			getFirstDefined( item.blockClientId, item.block_client_id )
		),
		blockName: normalizeNullableString(
			getFirstDefined( item.blockName, item.block_name )
		),
		blockLabel: normalizeNullableString(
			getFirstDefined( item.blockLabel, item.block_label )
		),
		blockPath: normalizeBlockPath(
			getFirstDefined( item.blockPath, item.block_path )
		),
		changeKind: normalizeNullableString(
			getFirstDefined( item.changeKind, item.change_kind )
		),
		riskReason: normalizeNullableString(
			getFirstDefined( item.riskReason, item.risk_reason )
		),
		baseContentHash: normalizeNullableString(
			getFirstDefined( item.baseContentHash, item.base_content_hash )
		),
		proposedContentHash,
		reviewedProposedContentHash:
			normalizeNullableString(
				getFirstDefined(
					item.reviewedProposedContentHash,
					item.reviewed_proposed_content_hash
				)
			) || proposedContentHash,
		ksesFilteredContentHash: normalizeNullableString(
			getFirstDefined(
				item.ksesFilteredContentHash,
				item.kses_filtered_content_hash
			)
		),
		reviewStatus,
		reviewEvidenceType:
			normalizeNullableString(
				getFirstDefined(
					item.reviewEvidenceType,
					item.review_evidence_type
				)
			) || 'kses_block_hash_only_change',
		contentReviewPolicy:
			normalizeNullableString(
				getFirstDefined(
					item.contentReviewPolicy,
					item.content_review_policy
				)
			) || 'kses',
		rejectionReason: normalizeNullableString(
			getFirstDefined( item.rejectionReason, item.rejection_reason )
		),
		rawContentIncluded: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesReviewerIds: false,
	};
}

function getFreshReviewDecisionReviewedBlockItemsFromItems( decisionItems ) {
	return decisionItems
		.filter( ( item ) =>
			[
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
			].includes( item.reviewStatus )
		)
		.map( ( item ) => ( {
			id: item.id,
			blockClientId: item.blockClientId,
			blockName: item.blockName,
			blockLabel: item.blockLabel,
			blockPath: item.blockPath,
			changeKind: item.changeKind,
			riskReason: item.riskReason,
			baseContentHash: item.baseContentHash,
			proposedContentHash: item.proposedContentHash,
			reviewedProposedContentHash:
				item.reviewedProposedContentHash || item.proposedContentHash,
			ksesFilteredContentHash: item.ksesFilteredContentHash,
			reviewStatus: item.reviewStatus,
			reviewEvidenceType:
				item.reviewEvidenceType || 'kses_block_hash_only_change',
			contentReviewPolicy: item.contentReviewPolicy || 'kses',
			rejectionReason: item.rejectionReason,
			rawContentIncluded: false,
			exposesRawContent: false,
		} ) );
}

function normalizeRiskyBlockReviewMetadataFields( sessionState = {} ) {
	const reviewItems = normalizeRiskyBlockReviewItems(
		sessionState.riskyBlockReviewItems
	);
	const calculatedPendingCount = countRiskyBlockReviewItemsByStatus(
		reviewItems,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW
	);
	const calculatedApprovedCount = countRiskyBlockReviewItemsByStatus(
		reviewItems,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE
	);
	const calculatedRejectedCount = countRiskyBlockReviewItemsByStatus(
		reviewItems,
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED
	);
	const riskyBlockReviewItemCount = normalizeCountWithFallback(
		sessionState.riskyBlockReviewItemCount,
		reviewItems.length
	);
	const riskyBlockReviewPendingCount = normalizeCountWithFallback(
		sessionState.riskyBlockReviewPendingCount,
		calculatedPendingCount
	);
	const riskyBlockReviewApprovedCount = normalizeCountWithFallback(
		sessionState.riskyBlockReviewApprovedCount,
		calculatedApprovedCount
	);
	const riskyBlockReviewRejectedCount = normalizeCountWithFallback(
		sessionState.riskyBlockReviewRejectedCount,
		calculatedRejectedCount
	);
	const riskyBlockReviewHasPendingItems = riskyBlockReviewPendingCount > 0;
	const requestedStatus = VALID_RISKY_BLOCK_REVIEW_STATUSES.has(
		sessionState.riskyBlockReviewStatus
	)
		? sessionState.riskyBlockReviewStatus
		: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.riskyBlockReviewStatus;
	let riskyBlockReviewStatus = requestedStatus;

	if (
		requestedStatus === DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NONE
	) {
		if ( riskyBlockReviewHasPendingItems ) {
			riskyBlockReviewStatus =
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED;
		} else if (
			riskyBlockReviewApprovedCount > 0 ||
			riskyBlockReviewRejectedCount > 0
		) {
			riskyBlockReviewStatus =
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_RESOLVED;
		}
	}
	const riskyBlockReviewRequiresServerStateRefetch =
		Boolean( sessionState.riskyBlockReviewRequiresServerStateRefetch ) ||
		riskyBlockReviewStatus ===
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.STALE_AFTER_REVIEW;
	const riskyBlockReviewPrePublishPanelRequired =
		Boolean( sessionState.riskyBlockReviewPrePublishPanelRequired ) &&
		riskyBlockReviewHasPendingItems;
	let riskyBlockReviewSaveButtonLabel = 'Update';
	let riskyBlockReviewSaveClickAction =
		DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE;

	if ( riskyBlockReviewRequiresServerStateRefetch ) {
		riskyBlockReviewSaveButtonLabel = 'Refetch required';
		riskyBlockReviewSaveClickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE;
	} else if ( riskyBlockReviewHasPendingItems ) {
		riskyBlockReviewSaveButtonLabel = 'Review changes';
		riskyBlockReviewSaveClickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;
	}

	riskyBlockReviewSaveButtonLabel =
		normalizeNullableString(
			sessionState.riskyBlockReviewSaveButtonLabel
		) || riskyBlockReviewSaveButtonLabel;
	riskyBlockReviewSaveClickAction =
		normalizeNullableString(
			sessionState.riskyBlockReviewSaveClickAction
		) || riskyBlockReviewSaveClickAction;

	return {
		riskyBlockReviewStatus,
		riskyBlockReviewReasonCode: normalizeNullableString(
			sessionState.riskyBlockReviewReasonCode
		),
		riskyBlockReviewItems: reviewItems,
		riskyBlockReviewItemCount,
		riskyBlockReviewPendingCount,
		riskyBlockReviewApprovedCount,
		riskyBlockReviewRejectedCount,
		riskyBlockReviewHasPendingItems,
		riskyBlockReviewPrePublishPanelRequired,
		riskyBlockReviewSaveButtonLabel,
		riskyBlockReviewSaveClickAction,
		riskyBlockReviewCanExportLocalUpdates:
			Boolean( sessionState.riskyBlockReviewCanExportLocalUpdates ) ||
			riskyBlockReviewHasPendingItems ||
			riskyBlockReviewStatus ===
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.STALE_AFTER_REVIEW,
		riskyBlockReviewRequiresServerStateRefetch,
		riskyBlockReviewReviewedServerVersion: normalizeNullableString(
			sessionState.riskyBlockReviewReviewedServerVersion
		),
		riskyBlockReviewCurrentServerVersion: normalizeNullableString(
			sessionState.riskyBlockReviewCurrentServerVersion
		),
		riskyBlockReviewRawContentIncluded: Boolean(
			sessionState.riskyBlockReviewRawContentIncluded
		),
		riskyBlockReviewExposesRawContent: Boolean(
			sessionState.riskyBlockReviewExposesRawContent
		),
		riskyBlockReviewDispatchesNotice: Boolean(
			sessionState.riskyBlockReviewDispatchesNotice
		),
		riskyBlockReviewMutatesEditorContent: Boolean(
			sessionState.riskyBlockReviewMutatesEditorContent
		),
		riskyBlockReviewCallsNormalSavePost: Boolean(
			sessionState.riskyBlockReviewCallsNormalSavePost
		),
		riskyBlockReviewCallsRetrySaveEndpoint: Boolean(
			sessionState.riskyBlockReviewCallsRetrySaveEndpoint
		),
		riskyBlockReviewChangesPostLock: Boolean(
			sessionState.riskyBlockReviewChangesPostLock
		),
		riskyBlockReviewClaimsSaved: Boolean(
			sessionState.riskyBlockReviewClaimsSaved
		),
	};
}

function normalizeRiskyBlockReviewItems( value ) {
	if ( ! Array.isArray( value ) ) {
		return [];
	}

	return value
		.map( ( item ) => normalizeRiskyBlockReviewItem( item ) )
		.filter( ( item ) => item.id !== null );
}

function normalizeRiskyBlockReviewItem( item = {} ) {
	const reviewStatus = VALID_RISKY_BLOCK_REVIEW_ITEM_STATUSES.has(
		getFirstDefined( item.reviewStatus, item.review_status )
	)
		? getFirstDefined( item.reviewStatus, item.review_status )
		: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW;

	return {
		id: normalizeNullableString( item.id ),
		blockClientId: normalizeNullableString(
			getFirstDefined( item.blockClientId, item.block_client_id )
		),
		blockName: normalizeNullableString(
			getFirstDefined( item.blockName, item.block_name )
		),
		blockLabel: normalizeNullableString(
			getFirstDefined( item.blockLabel, item.block_label )
		),
		blockPath: normalizeBlockPath(
			getFirstDefined( item.blockPath, item.block_path )
		),
		changeKind: normalizeNullableString(
			getFirstDefined( item.changeKind, item.change_kind )
		),
		riskReason: normalizeNullableString(
			getFirstDefined( item.riskReason, item.risk_reason )
		),
		authorId: normalizeNullableInteger(
			getFirstDefined( item.authorId, item.author_id )
		),
		baseVersion: normalizeNullableString(
			getFirstDefined( item.baseVersion, item.base_version )
		),
		serverVersion: normalizeNullableString(
			getFirstDefined( item.serverVersion, item.server_version )
		),
		baseContentHash: normalizeNullableString(
			getFirstDefined( item.baseContentHash, item.base_content_hash )
		),
		proposedContentHash: normalizeNullableString(
			getFirstDefined(
				item.proposedContentHash,
				item.proposed_content_hash
			)
		),
		ksesFilteredContentHash: normalizeNullableString(
			getFirstDefined(
				item.ksesFilteredContentHash,
				item.kses_filtered_content_hash
			)
		),
		reviewStatus,
		reviewEvidenceType: normalizeNullableString(
			getFirstDefined(
				item.reviewEvidenceType,
				item.review_evidence_type
			)
		),
		contentReviewPolicy: normalizeNullableString(
			getFirstDefined(
				item.contentReviewPolicy,
				item.content_review_policy
			)
		),
		reviewerId: normalizeNullableInteger(
			getFirstDefined( item.reviewerId, item.reviewer_id )
		),
		approvalProofHash: normalizeNullableString(
			getFirstDefined( item.approvalProofHash, item.approval_proof_hash )
		),
		rejectionReason: normalizeNullableString(
			getFirstDefined( item.rejectionReason, item.rejection_reason )
		),
		rawContentIncluded: false,
		exposesRawContent: false,
		annotation: normalizeRiskyBlockReviewAnnotation( item.annotation ),
	};
}

function normalizeRiskyBlockReviewAnnotation( annotation = {} ) {
	return {
		visualTreatment:
			normalizeNullableString( annotation.visualTreatment ) ||
			'blue_warning_marker_with_focus_wash',
		hasWarningMarker: annotation.hasWarningMarker !== false,
		hasSubtleBlueWash: annotation.hasSubtleBlueWash !== false,
		washActivation:
			normalizeNullableString( annotation.washActivation ) ||
			'selected_focused_hovered_or_review_target',
		hasAccessibleLabel: annotation.hasAccessibleLabel !== false,
		hasListViewParity: annotation.hasListViewParity !== false,
		reliesOnColorAlone: false,
	};
}

function countRiskyBlockReviewItemsByStatus( reviewItems, reviewStatus ) {
	return reviewItems.filter( ( item ) => item.reviewStatus === reviewStatus )
		.length;
}

function getRetrySaveReviewMetadataFromResponseOrError(
	responseOrError = {},
	responseData = {}
) {
	const reviewContract = normalizeObject(
		getFirstDefined(
			responseOrError.reviewContract,
			responseOrError.review_contract,
			responseData.reviewContract,
			responseData.review_contract
		)
	);
	const permissionContract = normalizeObject(
		getFirstDefined(
			responseOrError.permissionContract,
			responseOrError.permission_contract,
			responseData.permissionContract,
			responseData.permission_contract
		)
	);

	return normalizeRetrySaveReviewMetadataFields( {
		retrySaveReviewStatus: getFirstDefined(
			responseOrError.reviewStatus,
			responseOrError.review_status,
			responseData.reviewStatus,
			responseData.review_status,
			reviewContract.status
		),
		retrySaveReviewAction: getFirstDefined(
			responseOrError.reviewAction,
			responseOrError.review_action,
			responseData.reviewAction,
			responseData.review_action,
			reviewContract.action,
			reviewContract.reviewAction,
			reviewContract.review_action,
			permissionContract.unfiltered_html_review_action
		),
		retrySaveReviewRequiredCapability: getFirstDefined(
			responseOrError.reviewRequiredCapability,
			responseOrError.review_required_capability,
			responseData.reviewRequiredCapability,
			responseData.review_required_capability,
			reviewContract.requiredCapability,
			reviewContract.required_capability,
			reviewContract.reviewRequiredCapability,
			reviewContract.review_required_capability,
			permissionContract.unfiltered_html_review_capability
		),
		retrySaveReviewerCapability: getFirstDefined(
			responseOrError.reviewerCapability,
			responseOrError.reviewer_capability,
			responseData.reviewerCapability,
			responseData.reviewer_capability,
			reviewContract.reviewerCapability,
			reviewContract.reviewer_capability
		),
		retrySaveReviewScope: getFirstDefined(
			responseOrError.reviewScope,
			responseOrError.review_scope,
			responseData.reviewScope,
			responseData.review_scope,
			reviewContract.scope,
			reviewContract.reviewScope,
			reviewContract.review_scope,
			permissionContract.unfiltered_html_review_scope
		),
		retrySaveReviewContractType: getFirstDefined(
			responseOrError.reviewContractType,
			responseOrError.review_contract_type,
			responseData.reviewContractType,
			responseData.review_contract_type,
			reviewContract.type
		),
		retrySaveRequiresReviewerEscalation: getFirstDefined(
			responseOrError.requiresReviewerEscalation,
			responseOrError.requires_reviewer_escalation,
			responseData.requiresReviewerEscalation,
			responseData.requires_reviewer_escalation,
			reviewContract.escalationRequired,
			reviewContract.escalation_required
		),
		retrySaveReviewEscalationRequired: getFirstDefined(
			responseOrError.escalationRequired,
			responseOrError.escalation_required,
			responseData.escalationRequired,
			responseData.escalation_required,
			reviewContract.escalationRequired,
			reviewContract.escalation_required
		),
		retrySaveReviewEscalationReason: getFirstDefined(
			responseOrError.escalationReason,
			responseOrError.escalation_reason,
			responseData.escalationReason,
			responseData.escalation_reason,
			reviewContract.escalationReason,
			reviewContract.escalation_reason
		),
		retrySaveReviewRequiresUnfilteredHtml: getFirstDefined(
			responseOrError.requiresUnfilteredHtml,
			responseOrError.requires_unfiltered_html,
			responseData.requiresUnfilteredHtml,
			responseData.requires_unfiltered_html,
			permissionContract.unfiltered_html_review_required
		),
		retrySaveRequiresUnfilteredHtmlSaver: getFirstDefined(
			responseOrError.requiresUnfilteredHtmlSaver,
			responseOrError.requires_unfiltered_html_saver,
			responseData.requiresUnfilteredHtmlSaver,
			responseData.requires_unfiltered_html_saver
		),
		retrySaveReviewUnfilteredHtmlAllowed: getFirstDefined(
			responseOrError.unfilteredHtmlAllowed,
			responseOrError.unfiltered_html_allowed,
			responseData.unfilteredHtmlAllowed,
			responseData.unfiltered_html_allowed,
			permissionContract.unfiltered_html_allowed
		),
		retrySaveReviewAuthorshipRequired: getFirstDefined(
			responseOrError.authorshipReviewRequired,
			responseOrError.authorship_review_required,
			responseData.authorshipReviewRequired,
			responseData.authorship_review_required,
			permissionContract.authorship_review_required
		),
		retrySaveReviewContentCapabilityRequired: getFirstDefined(
			responseOrError.contentCapabilityReviewRequired,
			responseOrError.content_capability_review_required,
			responseData.contentCapabilityReviewRequired,
			responseData.content_capability_review_required,
			permissionContract.content_capability_review_required
		),
		retrySaveReviewContentFilter: getFirstDefined(
			responseOrError.contentFilter,
			responseOrError.content_filter,
			responseData.contentFilter,
			responseData.content_filter,
			reviewContract.contentFilter,
			reviewContract.content_filter
		),
		retrySaveReviewContentFilterContext: getFirstDefined(
			responseOrError.contentFilterContext,
			responseOrError.content_filter_context,
			responseData.contentFilterContext,
			responseData.content_filter_context,
			reviewContract.contentFilterContext,
			reviewContract.content_filter_context
		),
		retrySaveReviewContentWouldChangeByKses: getFirstDefined(
			responseOrError.contentWouldChangeByKses,
			responseOrError.content_would_change_by_kses,
			responseData.contentWouldChangeByKses,
			responseData.content_would_change_by_kses,
			reviewContract.contentWouldChangeByKses,
			reviewContract.content_would_change_by_kses
		),
		retrySaveReviewProposedContentWouldChangeByKses: getFirstDefined(
			responseOrError.proposedContentWouldChangeByKses,
			responseOrError.proposed_content_would_change_by_kses,
			responseData.proposedContentWouldChangeByKses,
			responseData.proposed_content_would_change_by_kses,
			reviewContract.proposedContentWouldChangeByKses,
			reviewContract.proposed_content_would_change_by_kses
		),
		retrySaveReviewCandidateContentWouldChangeByKses: getFirstDefined(
			responseOrError.candidateContentWouldChangeByKses,
			responseOrError.candidate_content_would_change_by_kses,
			responseData.candidateContentWouldChangeByKses,
			responseData.candidate_content_would_change_by_kses,
			reviewContract.candidateContentWouldChangeByKses,
			reviewContract.candidate_content_would_change_by_kses
		),
		retrySaveReviewProposedContentHash: getFirstDefined(
			responseOrError.proposedContentHash,
			responseOrError.proposed_content_hash,
			responseData.proposedContentHash,
			responseData.proposed_content_hash,
			reviewContract.proposedContentHash,
			reviewContract.proposed_content_hash
		),
		retrySaveReviewFilteredProposedContentHash: getFirstDefined(
			responseOrError.ksesFilteredProposedContentHash,
			responseOrError.kses_filtered_proposed_content_hash,
			responseData.ksesFilteredProposedContentHash,
			responseData.kses_filtered_proposed_content_hash,
			reviewContract.ksesFilteredProposedContentHash,
			reviewContract.kses_filtered_proposed_content_hash
		),
		retrySaveReviewCandidateContentHash: getFirstDefined(
			responseOrError.candidateContentHash,
			responseOrError.candidate_content_hash,
			responseData.candidateContentHash,
			responseData.candidate_content_hash,
			reviewContract.candidateContentHash,
			reviewContract.candidate_content_hash
		),
		retrySaveReviewFilteredCandidateContentHash: getFirstDefined(
			responseOrError.ksesFilteredCandidateContentHash,
			responseOrError.kses_filtered_candidate_content_hash,
			responseData.ksesFilteredCandidateContentHash,
			responseData.kses_filtered_candidate_content_hash,
			reviewContract.ksesFilteredCandidateContentHash,
			reviewContract.kses_filtered_candidate_content_hash
		),
		retrySaveReviewRawContentIncluded: getFirstDefined(
			responseOrError.rawContentIncluded,
			responseOrError.raw_content_included,
			responseData.rawContentIncluded,
			responseData.raw_content_included,
			reviewContract.rawContentIncluded,
			reviewContract.raw_content_included
		),
		retrySaveReviewRecoveryActions: getFirstDefined(
			responseOrError.recoveryActions,
			responseOrError.recovery_actions,
			responseData.recoveryActions,
			responseData.recovery_actions
		),
	} );
}

function getOpaqueReviewApprovalProofTokenRejectionDetail(
	responseOrError = {},
	responseData = {}
) {
	const detail = normalizeNullableString(
		getFirstDefined(
			responseOrError.detail,
			responseData.detail,
			responseOrError.errorDetail,
			responseData.errorDetail
		)
	);

	return Object.values(
		DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_REJECTION_DETAILS
	).includes( detail )
		? detail
		: null;
}

function getRetrySaveFreshReviewConsumeValidationFieldsFromResponseOrError(
	responseOrError = {},
	responseData = {},
	currentSessionState = {}
) {
	const acceptedFreshReviewConsumeValidation = normalizeObject(
		getFirstDefined(
			responseOrError.acceptedFreshReviewConsumeValidation,
			responseOrError.accepted_fresh_review_consume_validation,
			responseOrError.acceptedFreshReviewDecision,
			responseOrError.accepted_fresh_review_decision,
			responseData.acceptedFreshReviewConsumeValidation,
			responseData.accepted_fresh_review_consume_validation,
			responseData.acceptedFreshReviewDecision,
			responseData.accepted_fresh_review_decision,
			responseOrError.freshReviewConsumeValidation,
			responseOrError.fresh_review_consume_validation,
			responseData.freshReviewConsumeValidation,
			responseData.fresh_review_consume_validation
		)
	);
	const result = normalizeNullableString(
		getFirstDefined(
			acceptedFreshReviewConsumeValidation.result,
			responseOrError.freshReviewDecisionConsumptionResult,
			responseOrError.fresh_review_decision_consumption_result,
			responseData.freshReviewDecisionConsumptionResult,
			responseData.fresh_review_decision_consumption_result,
			responseOrError.result ===
				'fresh_review_decision_eligible_for_retry_save_handoff'
				? responseOrError.result
				: undefined,
			responseData.result ===
				'fresh_review_decision_eligible_for_retry_save_handoff'
				? responseData.result
				: undefined
		)
	);
	const reason = normalizeNullableString(
		getFirstDefined(
			responseOrError.freshReviewDecisionConsumptionReason,
			responseOrError.fresh_review_decision_consumption_reason,
			responseData.freshReviewDecisionConsumptionReason,
			responseData.fresh_review_decision_consumption_reason,
			responseOrError.detail,
			responseData.detail,
			responseOrError.code,
			responseData.code
		)
	);
	const reasonCode = normalizeNullableString(
		getFirstDefined(
			responseOrError.code,
			responseOrError.reasonCode,
			responseOrError.reason_code,
			responseData.reasonCode,
			responseData.reason_code
		)
	);
	const explicitlyAccepted =
		Boolean(
			getFirstDefined(
				acceptedFreshReviewConsumeValidation.freshReviewDecisionConsumptionValidated,
				acceptedFreshReviewConsumeValidation.fresh_review_decision_consumption_validated,
				responseOrError.freshReviewDecisionConsumptionValidated,
				responseOrError.fresh_review_decision_consumption_validated,
				responseData.freshReviewDecisionConsumptionValidated,
				responseData.fresh_review_decision_consumption_validated
			)
		) || result === 'fresh_review_decision_eligible_for_retry_save_handoff';
	const validationRejected =
		Boolean(
			currentSessionState.retrySaveFreshReviewConsumeValidationAccepted
		) &&
		[
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
			DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
			DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID,
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
		].includes( reasonCode );
	const validationAccepted =
		explicitlyAccepted ||
		( ! validationRejected &&
			Boolean(
				currentSessionState.retrySaveFreshReviewConsumeValidationAccepted
			) );
	const proposedPostContentHash = normalizeSha256Hash(
		getFirstDefined(
			acceptedFreshReviewConsumeValidation.proposedPostContentHash,
			acceptedFreshReviewConsumeValidation.proposed_post_content_hash,
			responseOrError.freshReviewProposedContentHash,
			responseOrError.fresh_review_proposed_content_hash,
			responseData.freshReviewProposedContentHash,
			responseData.fresh_review_proposed_content_hash,
			currentSessionState.retrySaveFreshReviewProposedContentHash,
			currentSessionState.localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash,
			currentSessionState.localUpdatesImportVerifiedPostContentHash
		)
	);
	const candidatePostContentHash = normalizeSha256Hash(
		getFirstDefined(
			acceptedFreshReviewConsumeValidation.candidatePostContentHash,
			acceptedFreshReviewConsumeValidation.candidate_post_content_hash,
			responseOrError.freshReviewCandidateContentHash,
			responseOrError.fresh_review_candidate_content_hash,
			responseData.freshReviewCandidateContentHash,
			responseData.fresh_review_candidate_content_hash,
			currentSessionState.retrySaveFreshReviewCandidateContentHash,
			currentSessionState.localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash
		)
	);
	let status =
		currentSessionState.retrySaveFreshReviewConsumeValidationStatus;

	if ( validationAccepted ) {
		status = 'accepted_for_retry_save';
	} else if ( reason ) {
		status = 'rejected';
	}

	return normalizeRetrySaveFreshReviewConsumeValidationFields( {
		retrySaveFreshReviewConsumeValidationStatus: status,
		retrySaveFreshReviewConsumeValidationReason: validationAccepted
			? null
			: reason,
		retrySaveFreshReviewConsumeValidationResult:
			result ||
			currentSessionState.retrySaveFreshReviewConsumeValidationResult,
		retrySaveFreshReviewConsumeValidationRestRoute: getFirstDefined(
			acceptedFreshReviewConsumeValidation.restRoute,
			acceptedFreshReviewConsumeValidation.rest_route,
			responseOrError.freshReviewConsumeRestRoute,
			responseOrError.fresh_review_consume_rest_route,
			responseData.freshReviewConsumeRestRoute,
			responseData.fresh_review_consume_rest_route,
			currentSessionState.retrySaveFreshReviewConsumeValidationRestRoute
		),
		retrySaveFreshReviewConsumeValidationAccepted: validationAccepted,
		retrySaveFreshReviewDecisionConsumptionValidated: validationAccepted,
		retrySaveFreshReviewDecisionEligibleForRetrySave:
			validationAccepted ||
			Boolean(
				getFirstDefined(
					acceptedFreshReviewConsumeValidation.freshReviewDecisionEligibleForRetrySave,
					acceptedFreshReviewConsumeValidation.fresh_review_decision_eligible_for_retry_save,
					responseOrError.freshReviewDecisionEligibleForRetrySave,
					responseOrError.fresh_review_decision_eligible_for_retry_save,
					responseData.freshReviewDecisionEligibleForRetrySave,
					responseData.fresh_review_decision_eligible_for_retry_save
				)
			),
		retrySaveFreshReviewRequestRecordId: getFirstDefined(
			acceptedFreshReviewConsumeValidation.freshReviewRequestRecordId,
			acceptedFreshReviewConsumeValidation.fresh_review_request_record_id,
			acceptedFreshReviewConsumeValidation.requestRecordId,
			acceptedFreshReviewConsumeValidation.request_record_id,
			responseOrError.freshReviewRequestRecordId,
			responseOrError.fresh_review_request_record_id,
			responseData.freshReviewRequestRecordId,
			responseData.fresh_review_request_record_id,
			currentSessionState.retrySaveFreshReviewRequestRecordId,
			currentSessionState.localUpdatesImportFreshReviewRequestRecordId
		),
		retrySaveFreshReviewRequestStatus: getFirstDefined(
			acceptedFreshReviewConsumeValidation.freshReviewRequestStatus,
			acceptedFreshReviewConsumeValidation.fresh_review_request_status,
			responseOrError.freshReviewRequestStatus,
			responseOrError.fresh_review_request_status,
			responseData.freshReviewRequestStatus,
			responseData.fresh_review_request_status,
			currentSessionState.retrySaveFreshReviewRequestStatus
		),
		retrySaveFreshReviewDecisionStatus: getFirstDefined(
			acceptedFreshReviewConsumeValidation.freshReviewDecisionStatus,
			acceptedFreshReviewConsumeValidation.fresh_review_decision_status,
			responseOrError.freshReviewDecisionStatus,
			responseOrError.fresh_review_decision_status,
			responseData.freshReviewDecisionStatus,
			responseData.fresh_review_decision_status,
			currentSessionState.retrySaveFreshReviewDecisionStatus
		),
		retrySaveFreshReviewClientBaseVersion: getFirstDefined(
			acceptedFreshReviewConsumeValidation.clientBaseVersion,
			acceptedFreshReviewConsumeValidation.client_base_version,
			responseOrError.freshReviewClientBaseVersion,
			responseOrError.fresh_review_client_base_version,
			responseData.freshReviewClientBaseVersion,
			responseData.fresh_review_client_base_version,
			currentSessionState.retrySaveFreshReviewClientBaseVersion,
			currentSessionState.localUpdatesImportFreshReviewRetrySaveHandoffClientBaseVersion,
			currentSessionState.clientBaseVersion
		),
		retrySaveFreshReviewServerVersion: getFirstDefined(
			acceptedFreshReviewConsumeValidation.serverVersion,
			acceptedFreshReviewConsumeValidation.server_version,
			responseOrError.freshReviewServerVersion,
			responseOrError.fresh_review_server_version,
			responseData.freshReviewServerVersion,
			responseData.fresh_review_server_version,
			currentSessionState.retrySaveFreshReviewServerVersion,
			currentSessionState.localUpdatesImportFreshReviewRetrySaveHandoffServerVersion,
			currentSessionState.serverVersion
		),
		retrySaveFreshReviewProposedContentHash: proposedPostContentHash,
		retrySaveFreshReviewReviewedProposedContentHash:
			normalizeSha256Hash(
				getFirstDefined(
					acceptedFreshReviewConsumeValidation.reviewedProposedContentHash,
					acceptedFreshReviewConsumeValidation.reviewed_proposed_content_hash,
					responseOrError.freshReviewReviewedProposedContentHash,
					responseOrError.fresh_review_reviewed_proposed_content_hash,
					responseData.freshReviewReviewedProposedContentHash,
					responseData.fresh_review_reviewed_proposed_content_hash,
					currentSessionState.retrySaveFreshReviewReviewedProposedContentHash,
					currentSessionState.localUpdatesImportFreshReviewRetrySaveHandoffReviewedProposedContentHash
				)
			) || proposedPostContentHash,
		retrySaveFreshReviewCandidateContentHash: candidatePostContentHash,
		retrySaveFreshReviewReviewedCandidateContentHash:
			normalizeSha256Hash(
				getFirstDefined(
					acceptedFreshReviewConsumeValidation.reviewedCandidateContentHash,
					acceptedFreshReviewConsumeValidation.reviewed_candidate_content_hash,
					responseOrError.freshReviewReviewedCandidateContentHash,
					responseOrError.fresh_review_reviewed_candidate_content_hash,
					responseData.freshReviewReviewedCandidateContentHash,
					responseData.fresh_review_reviewed_candidate_content_hash,
					currentSessionState.retrySaveFreshReviewReviewedCandidateContentHash,
					currentSessionState.localUpdatesImportFreshReviewRetrySaveHandoffReviewedCandidateContentHash
				)
			) || candidatePostContentHash,
		retrySaveFreshReviewReviewedBlockItemCount: getFirstDefined(
			acceptedFreshReviewConsumeValidation.reviewedBlockItemCount,
			acceptedFreshReviewConsumeValidation.reviewed_block_item_count,
			responseOrError.freshReviewReviewedBlockItemCount,
			responseOrError.fresh_review_reviewed_block_item_count,
			responseOrError.reviewedBlockItemCount,
			responseOrError.reviewed_block_item_count,
			responseData.freshReviewReviewedBlockItemCount,
			responseData.fresh_review_reviewed_block_item_count,
			responseData.reviewedBlockItemCount,
			responseData.reviewed_block_item_count,
			currentSessionState.retrySaveFreshReviewReviewedBlockItemCount
		),
		retrySaveFreshReviewHashEvidenceStatus: getFirstDefined(
			acceptedFreshReviewConsumeValidation.hashEvidenceStatus,
			acceptedFreshReviewConsumeValidation.hash_evidence_status,
			responseOrError.freshReviewHashEvidenceStatus,
			responseOrError.fresh_review_hash_evidence_status,
			responseData.freshReviewHashEvidenceStatus,
			responseData.fresh_review_hash_evidence_status,
			currentSessionState.retrySaveFreshReviewHashEvidenceStatus
		),
		retrySaveFreshReviewRawContentIncluded: false,
		retrySaveFreshReviewExposesRawContent: false,
		retrySaveFreshReviewExposesReviewerIds: false,
		retrySaveFreshReviewSavesPost: Boolean(
			acceptedFreshReviewConsumeValidation.savesPost ??
				acceptedFreshReviewConsumeValidation.saves_post
		),
		retrySaveFreshReviewMutatesPostContent: Boolean(
			acceptedFreshReviewConsumeValidation.mutatesPostContent ??
				acceptedFreshReviewConsumeValidation.mutates_post_content
		),
		retrySaveFreshReviewCreatesRevision: Boolean(
			acceptedFreshReviewConsumeValidation.createsRevision ??
				acceptedFreshReviewConsumeValidation.creates_revision
		),
		retrySaveFreshReviewClaimsSaved: Boolean(
			acceptedFreshReviewConsumeValidation.claimsSaved ??
				acceptedFreshReviewConsumeValidation.claims_saved
		),
	} );
}

function getRetrySaveReviewApprovalProofFieldsFromResponseOrError(
	responseOrError = {},
	responseData = {},
	currentSessionState = {}
) {
	const directApprovalContract = normalizeObject(
		getFirstDefined(
			responseOrError.reviewApprovalContract,
			responseOrError.review_approval_contract,
			responseOrError.approvalContract,
			responseOrError.approval_contract,
			responseData.reviewApprovalContract,
			responseData.review_approval_contract,
			responseData.approvalContract,
			responseData.approval_contract
		)
	);
	const acceptedReviewApprovalProofOrEnvelope =
		getPreferredReviewApprovalProofOrEnvelope(
			responseOrError.acceptedReviewApprovalProofEnvelope,
			responseOrError.accepted_review_approval_proof_envelope,
			responseOrError.reviewApprovalProofEnvelope,
			responseOrError.review_approval_proof_envelope,
			responseData.acceptedReviewApprovalProofEnvelope,
			responseData.accepted_review_approval_proof_envelope,
			responseData.reviewApprovalProofEnvelope,
			responseData.review_approval_proof_envelope,
			responseOrError.acceptedReviewApprovalProof,
			responseOrError.accepted_review_approval_proof,
			responseOrError.reviewApprovalProof,
			responseOrError.review_approval_proof,
			responseData.acceptedReviewApprovalProof,
			responseData.accepted_review_approval_proof,
			responseData.reviewApprovalProof,
			responseData.review_approval_proof
		);
	const acceptedReviewApprovalProofEnvelope =
		normalizeReviewApprovalProofEnvelope(
			acceptedReviewApprovalProofOrEnvelope
		);
	const approvalContract = {
		...getReviewApprovalProofEnvelopeMetadata(
			acceptedReviewApprovalProofOrEnvelope
		),
		...directApprovalContract,
		...getReviewApprovalProofFromProofOrEnvelope(
			acceptedReviewApprovalProofOrEnvelope
		),
	};
	const reviewContract = normalizeObject(
		getFirstDefined(
			responseOrError.reviewContract,
			responseOrError.review_contract,
			responseData.reviewContract,
			responseData.review_contract
		)
	);
	const approvalSavesPost = Boolean(
		getFirstDefined(
			responseOrError.savesPost,
			responseOrError.saves_post,
			responseData.savesPost,
			responseData.saves_post,
			approvalContract.savesPost,
			approvalContract.saves_post
		)
	);
	const approvalMutatesPostContent = Boolean(
		getFirstDefined(
			responseOrError.mutatesPostContent,
			responseOrError.mutates_post_content,
			responseData.mutatesPostContent,
			responseData.mutates_post_content,
			approvalContract.mutatesPostContent,
			approvalContract.mutates_post_content
		)
	);
	const approvalCreatesRevision = Boolean(
		getFirstDefined(
			responseOrError.createsRevision,
			responseOrError.creates_revision,
			responseData.createsRevision,
			responseData.creates_revision,
			approvalContract.createsRevision,
			approvalContract.creates_revision
		)
	);
	const approvalClaimsSaved = Boolean(
		getFirstDefined(
			responseOrError.claimsSaved,
			responseOrError.claims_saved,
			responseData.claimsSaved,
			responseData.claims_saved,
			approvalContract.claimsSaved,
			approvalContract.claims_saved
		)
	);
	const reviewedBlockItems =
		normalizeRetrySaveReviewApprovalReviewedBlockItems(
			getFirstDefined(
				responseOrError.reviewedBlockItems,
				responseOrError.reviewed_block_items,
				responseData.reviewedBlockItems,
				responseData.reviewed_block_items,
				approvalContract.reviewedBlockItems,
				approvalContract.reviewed_block_items,
				currentSessionState.retrySaveReviewApprovalReviewedBlockItems
			)
		);

	return normalizeRetrySaveReviewApprovalProofFields( {
		retrySaveReviewApprovalProofEnvelope:
			acceptedReviewApprovalProofEnvelope,
		retrySaveReviewApprovalPostId: getFirstDefined(
			responseOrError.postId,
			responseOrError.post_id,
			responseData.postId,
			responseData.post_id,
			approvalContract.postId,
			approvalContract.post_id
		),
		retrySaveReviewApprovalPostType: getFirstDefined(
			responseOrError.postType,
			responseOrError.post_type,
			responseData.postType,
			responseData.post_type,
			approvalContract.postType,
			approvalContract.post_type
		),
		retrySaveReviewApprovalReviewerUserId: getFirstDefined(
			responseOrError.reviewerUserId,
			responseOrError.reviewer_user_id,
			responseData.reviewerUserId,
			responseData.reviewer_user_id,
			approvalContract.reviewerUserId,
			approvalContract.reviewer_user_id
		),
		retrySaveReviewApprovalLowPrivilegedSaverUserId: getFirstDefined(
			responseOrError.lowPrivilegedSaverUserId,
			responseOrError.low_privileged_saver_user_id,
			responseData.lowPrivilegedSaverUserId,
			responseData.low_privileged_saver_user_id,
			approvalContract.lowPrivilegedSaverUserId,
			approvalContract.low_privileged_saver_user_id
		),
		retrySaveReviewApprovalServerVersion: getFirstDefined(
			responseOrError.serverVersion,
			responseOrError.server_version,
			responseData.serverVersion,
			responseData.server_version,
			approvalContract.serverVersion,
			approvalContract.server_version
		),
		retrySaveReviewApprovalPreviousServerVersion: getFirstDefined(
			responseOrError.previousServerVersion,
			responseOrError.previous_server_version,
			responseData.previousServerVersion,
			responseData.previous_server_version,
			approvalContract.previousServerVersion,
			approvalContract.previous_server_version
		),
		retrySaveReviewApprovalReviewStatus: getFirstDefined(
			responseOrError.reviewStatus,
			responseOrError.review_status,
			responseData.reviewStatus,
			responseData.review_status,
			approvalContract.reviewStatus,
			approvalContract.review_status
		),
		retrySaveReviewApprovalApprovalStatus: getFirstDefined(
			responseOrError.approvalStatus,
			responseOrError.approval_status,
			responseData.approvalStatus,
			responseData.approval_status,
			approvalContract.approvalStatus,
			approvalContract.approval_status
		),
		retrySaveReviewApprovalReviewAction: getFirstDefined(
			responseOrError.reviewAction,
			responseOrError.review_action,
			responseData.reviewAction,
			responseData.review_action,
			approvalContract.reviewAction,
			approvalContract.review_action,
			reviewContract.reviewAction,
			reviewContract.review_action
		),
		retrySaveReviewApprovalApprovalAction: getFirstDefined(
			responseOrError.approvalAction,
			responseOrError.approval_action,
			responseData.approvalAction,
			responseData.approval_action,
			approvalContract.approvalAction,
			approvalContract.approval_action
		),
		retrySaveReviewApprovalAction: getFirstDefined(
			responseOrError.approvalAction,
			responseOrError.approval_action,
			responseData.approvalAction,
			responseData.approval_action,
			approvalContract.approvalAction,
			approvalContract.approval_action,
			responseOrError.reviewAction,
			responseOrError.review_action,
			responseData.reviewAction,
			responseData.review_action,
			approvalContract.reviewAction,
			approvalContract.review_action,
			reviewContract.reviewAction,
			reviewContract.review_action,
			currentSessionState.retrySaveReviewAction
		),
		retrySaveReviewApprovalRequiredCapability: getFirstDefined(
			responseOrError.reviewRequiredCapability,
			responseOrError.review_required_capability,
			responseData.reviewRequiredCapability,
			responseData.review_required_capability,
			approvalContract.reviewRequiredCapability,
			approvalContract.review_required_capability,
			reviewContract.reviewRequiredCapability,
			reviewContract.review_required_capability,
			currentSessionState.retrySaveReviewRequiredCapability
		),
		retrySaveReviewApprovalReviewerCapability: getFirstDefined(
			responseOrError.reviewerCapability,
			responseOrError.reviewer_capability,
			responseData.reviewerCapability,
			responseData.reviewer_capability,
			approvalContract.reviewerCapability,
			approvalContract.reviewer_capability,
			reviewContract.reviewerCapability,
			reviewContract.reviewer_capability,
			currentSessionState.retrySaveReviewerCapability
		),
		retrySaveReviewApprovalScope: getFirstDefined(
			responseOrError.reviewScope,
			responseOrError.review_scope,
			responseData.reviewScope,
			responseData.review_scope,
			approvalContract.reviewScope,
			approvalContract.review_scope,
			reviewContract.reviewScope,
			reviewContract.review_scope,
			currentSessionState.retrySaveReviewScope
		),
		retrySaveReviewApprovalProposedContentHash: getFirstDefined(
			responseOrError.proposedPostContentHash,
			responseOrError.proposed_post_content_hash,
			responseOrError.proposedContentHash,
			responseOrError.proposed_content_hash,
			responseData.proposedPostContentHash,
			responseData.proposed_post_content_hash,
			responseData.proposedContentHash,
			responseData.proposed_content_hash,
			approvalContract.proposedPostContentHash,
			approvalContract.proposed_post_content_hash,
			approvalContract.proposedContentHash,
			approvalContract.proposed_content_hash,
			reviewContract.proposedContentHash,
			reviewContract.proposed_content_hash,
			currentSessionState.retrySaveReviewProposedContentHash
		),
		retrySaveReviewApprovalCandidateContentHash: getFirstDefined(
			responseOrError.candidatePostContentHash,
			responseOrError.candidate_post_content_hash,
			responseOrError.candidateContentHash,
			responseOrError.candidate_content_hash,
			responseData.candidatePostContentHash,
			responseData.candidate_post_content_hash,
			responseData.candidateContentHash,
			responseData.candidate_content_hash,
			approvalContract.candidatePostContentHash,
			approvalContract.candidate_post_content_hash,
			approvalContract.candidateContentHash,
			approvalContract.candidate_content_hash,
			reviewContract.candidateContentHash,
			reviewContract.candidate_content_hash,
			currentSessionState.retrySaveReviewCandidateContentHash
		),
		retrySaveReviewApprovalCandidateContentHashScope: getFirstDefined(
			responseOrError.candidatePostContentHashScope,
			responseOrError.candidate_post_content_hash_scope,
			responseData.candidatePostContentHashScope,
			responseData.candidate_post_content_hash_scope,
			approvalContract.candidatePostContentHashScope,
			approvalContract.candidate_post_content_hash_scope
		),
		retrySaveReviewApprovalRequiresUnfilteredHtmlSaver: getFirstDefined(
			responseOrError.requiresUnfilteredHtmlSaver,
			responseOrError.requires_unfiltered_html_saver,
			responseData.requiresUnfilteredHtmlSaver,
			responseData.requires_unfiltered_html_saver,
			approvalContract.requiresUnfilteredHtmlSaver,
			approvalContract.requires_unfiltered_html_saver
		),
		retrySaveReviewApprovalRebasedFromVersion: getFirstDefined(
			responseOrError.rebasedFromVersion,
			responseOrError.rebased_from_version,
			responseData.rebasedFromVersion,
			responseData.rebased_from_version,
			approvalContract.rebasedFromVersion,
			approvalContract.rebased_from_version
		),
		retrySaveReviewApprovalExpectedProposedContentHash: getFirstDefined(
			responseOrError.expectedProposedPostContentHash,
			responseOrError.expected_proposed_post_content_hash,
			responseOrError.expectedPostContentHash,
			responseOrError.expected_post_content_hash,
			responseData.expectedProposedPostContentHash,
			responseData.expected_proposed_post_content_hash,
			responseData.expectedPostContentHash,
			responseData.expected_post_content_hash,
			approvalContract.expectedProposedPostContentHash,
			approvalContract.expected_proposed_post_content_hash,
			approvalContract.expectedPostContentHash,
			approvalContract.expected_post_content_hash
		),
		retrySaveReviewApprovalExpectedCandidateContentHash: getFirstDefined(
			responseOrError.expectedCandidatePostContentHash,
			responseOrError.expected_candidate_post_content_hash,
			responseData.expectedCandidatePostContentHash,
			responseData.expected_candidate_post_content_hash,
			approvalContract.expectedCandidatePostContentHash,
			approvalContract.expected_candidate_post_content_hash
		),
		retrySaveReviewApprovalHashMismatch: getFirstDefined(
			responseOrError.hashMismatch,
			responseOrError.hash_mismatch,
			responseData.hashMismatch,
			responseData.hash_mismatch,
			approvalContract.hashMismatch,
			approvalContract.hash_mismatch
		),
		retrySaveReviewApprovalReviewedBlockItems: reviewedBlockItems,
		retrySaveReviewApprovalReviewedBlockItemCount: getFirstDefined(
			responseOrError.reviewedBlockItemCount,
			responseOrError.reviewed_block_item_count,
			responseData.reviewedBlockItemCount,
			responseData.reviewed_block_item_count,
			approvalContract.reviewedBlockItemCount,
			approvalContract.reviewed_block_item_count,
			reviewedBlockItems.length
		),
		retrySaveReviewApprovalBlockReviewStatus: getFirstDefined(
			responseOrError.blockReviewStatus,
			responseOrError.block_review_status,
			responseData.blockReviewStatus,
			responseData.block_review_status,
			approvalContract.blockReviewStatus,
			approvalContract.block_review_status
		),
		retrySaveReviewApprovalUnapprovedBlockItemIds: getFirstDefined(
			responseOrError.unapprovedBlockItemIds,
			responseOrError.unapproved_block_item_ids,
			responseOrError.unapprovedReviewItemIds,
			responseOrError.unapproved_review_item_ids,
			responseData.unapprovedBlockItemIds,
			responseData.unapproved_block_item_ids,
			responseData.unapprovedReviewItemIds,
			responseData.unapproved_review_item_ids
		),
		retrySaveReviewApprovalMismatchedBlockItemFields: getFirstDefined(
			responseOrError.mismatchedBlockItemFields,
			responseOrError.mismatched_block_item_fields,
			responseOrError.mismatchedHashEvidenceFields,
			responseOrError.mismatched_hash_evidence_fields,
			responseData.mismatchedBlockItemFields,
			responseData.mismatched_block_item_fields,
			responseData.mismatchedHashEvidenceFields,
			responseData.mismatched_hash_evidence_fields
		),
		retrySaveReviewApprovalRawContentIncluded: getFirstDefined(
			responseOrError.rawContentIncluded,
			responseOrError.raw_content_included,
			responseData.rawContentIncluded,
			responseData.raw_content_included,
			approvalContract.rawContentIncluded,
			approvalContract.raw_content_included
		),
		retrySaveReviewApprovalProofSignature: getFirstDefined(
			responseOrError.proofSignature,
			responseOrError.proof_signature,
			responseData.proofSignature,
			responseData.proof_signature,
			approvalContract.proofSignature,
			approvalContract.proof_signature,
			currentSessionState.retrySaveReviewApprovalProofSignature
		),
		retrySaveReviewApprovalIssuedAt: getFirstDefined(
			responseOrError.issuedAt,
			responseOrError.issued_at,
			responseData.issuedAt,
			responseData.issued_at,
			approvalContract.issuedAt,
			approvalContract.issued_at,
			currentSessionState.retrySaveReviewApprovalIssuedAt
		),
		retrySaveReviewApprovalExpiresAt: getFirstDefined(
			responseOrError.expiresAt,
			responseOrError.expires_at,
			responseData.expiresAt,
			responseData.expires_at,
			approvalContract.expiresAt,
			approvalContract.expires_at,
			currentSessionState.retrySaveReviewApprovalExpiresAt
		),
		retrySaveReviewApprovalSiteId: getFirstDefined(
			responseOrError.siteId,
			responseOrError.site_id,
			responseData.siteId,
			responseData.site_id,
			approvalContract.siteId,
			approvalContract.site_id,
			currentSessionState.retrySaveReviewApprovalSiteId
		),
		retrySaveReviewApprovalSiteUrl: getFirstDefined(
			responseOrError.siteUrl,
			responseOrError.site_url,
			responseData.siteUrl,
			responseData.site_url,
			approvalContract.siteUrl,
			approvalContract.site_url,
			currentSessionState.retrySaveReviewApprovalSiteUrl
		),
		retrySaveReviewApprovalSiteUuid: getFirstDefined(
			responseOrError.siteUuid,
			responseOrError.site_uuid,
			responseData.siteUuid,
			responseData.site_uuid,
			approvalContract.siteUuid,
			approvalContract.site_uuid,
			currentSessionState.retrySaveReviewApprovalSiteUuid
		),
		retrySaveReviewApprovalSavesPost: approvalSavesPost,
		retrySaveReviewApprovalMutatesPostContent: approvalMutatesPostContent,
		retrySaveReviewApprovalCreatesRevision: approvalCreatesRevision,
		retrySaveReviewApprovalClaimsSaved: approvalClaimsSaved,
	} );
}

function hasDistributedEditingLocalRebaseInputs( normalized ) {
	return (
		normalized.clientBaseContent !== null &&
		normalized.refetchedServerContent !== null
	);
}

function createLocalUpdatesImportBlockedResult( reason, options = {} ) {
	const postId = options.postId === null ? null : options.postId;
	const postType = normalizeNullableString( options.postType );
	const verifiedPostContentHash = normalizeSha256Hash(
		options.verifiedPostContentHash
	);
	const normalizedCurrent = normalizeDistributedEditingSessionState(
		options.currentSessionState
	);
	const hasCurrentPendingChanges =
		normalizedCurrent.pendingChangeCount > 0 ||
		normalizedCurrent.hasPendingChanges;
	let pendingChangeCount = normalizedCurrent.pendingChangeCount;

	if ( hasCurrentPendingChanges && pendingChangeCount === 0 ) {
		pendingChangeCount = 1;
	} else if (
		! hasCurrentPendingChanges &&
		options.pendingChangeCount !== undefined
	) {
		pendingChangeCount = normalizeCount( options.pendingChangeCount );
	}

	const sessionState = normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		...( options.serverVersion !== undefined
			? { serverVersion: options.serverVersion }
			: {} ),
		...( options.clientBaseVersion !== undefined
			? { clientBaseVersion: options.clientBaseVersion }
			: {} ),
		pendingChangeCount,
		localUpdatesImportStatus:
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
		localUpdatesImportReason: reason,
		localUpdatesImportPostId:
			postId === null || postId === undefined ? null : String( postId ),
		localUpdatesImportPostType: postType,
		localUpdatesImportHasPostContent: false,
		localUpdatesImportHasAcceptedReviewApprovalProof: false,
		localUpdatesImportVerifiedPostContentHash: verifiedPostContentHash,
		canExportLocalUpdates: normalizedCurrent.canExportLocalUpdates,
		mustOfferLocalCopy: normalizedCurrent.mustOfferLocalCopy,
	} );

	return {
		status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
		reason,
		postContent: null,
		hasPostContent: false,
		acceptedReviewApprovalProof: null,
		hasAcceptedReviewApprovalProof: false,
		computedPostContentHash: verifiedPostContentHash,
		reviewRequestStatus: sessionState.localUpdatesImportReviewRequestStatus,
		requiresFreshReview: sessionState.localUpdatesImportRequiresFreshReview,
		reviewRequestActionKey: sessionState.localUpdatesImportReviewActionKey,
		sessionState,
		mutatesEditorContent: false,
		callsRetrySaveEndpoint: false,
		callsNormalSavePost: false,
		dispatchesNotice: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function isAcceptedReviewApprovalProofExpired( proof, now ) {
	const expiresAt = normalizeNullableTimestamp(
		proof?.expiresAt ?? proof?.expires_at
	);
	const currentTime = Number( now );

	return (
		expiresAt !== null &&
		Number.isFinite( currentTime ) &&
		expiresAt <= currentTime
	);
}

function normalizeSha256Hash( value ) {
	const normalized = normalizeNullableString( value )?.toLowerCase();

	return normalized && /^[a-f0-9]{64}$/.test( normalized )
		? normalized
		: null;
}

function normalizeCount( value ) {
	const count = Number( value );
	return Number.isInteger( count ) && count > 0 ? count : 0;
}

function normalizeCountWithFallback( value, fallback ) {
	if ( value === undefined || value === null ) {
		return normalizeCount( fallback );
	}

	return normalizeCount( value );
}

function normalizeNullableString( value ) {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeNullableIdString( value ) {
	if ( typeof value === 'string' && value.length > 0 ) {
		return value;
	}

	const number = Number( value );

	return Number.isInteger( number ) && number > 0 ? String( number ) : null;
}

function normalizeNullableTimestamp( value ) {
	if ( value === undefined || value === null || value === '' ) {
		return null;
	}

	const number = Number( value );

	if ( Number.isFinite( number ) && number > 0 ) {
		return number > 100000000000 ? Math.floor( number / 1000 ) : number;
	}

	const parsedDate = Date.parse( value );

	return Number.isFinite( parsedDate ) && parsedDate > 0
		? Math.floor( parsedDate / 1000 )
		: null;
}

function normalizeNullableInteger( value ) {
	const number = Number( value );
	return Number.isInteger( number ) && number > 0 ? number : null;
}

function normalizeNullableContentString( value ) {
	return typeof value === 'string' ? value : null;
}

function normalizeBlockPath( value ) {
	if ( ! Array.isArray( value ) ) {
		return [];
	}

	return value
		.map( ( item ) => Number( item ) )
		.filter( ( item ) => Number.isInteger( item ) && item >= 0 );
}

function normalizeIdList( value ) {
	if ( ! Array.isArray( value ) ) {
		return [];
	}

	return value
		.map( ( item ) => Number( item ) )
		.filter( ( item ) => Number.isInteger( item ) && item > 0 );
}

function normalizeObject( value ) {
	return value && typeof value === 'object' && ! Array.isArray( value )
		? value
		: {};
}

function hasOwnProperty( value, key ) {
	return Boolean(
		value &&
			typeof value === 'object' &&
			Object.prototype.hasOwnProperty.call( value, key )
	);
}

function getFirstDefined( ...values ) {
	return values.find( ( value ) => value !== undefined && value !== null );
}

function normalizeStringList( value ) {
	if ( ! Array.isArray( value ) ) {
		return [];
	}

	return value
		.map( ( item ) => normalizeNullableString( item ) )
		.filter( Boolean );
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
