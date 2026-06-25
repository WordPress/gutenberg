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
	DE_RTC_REBASE_FAILED: 'de_rtc_rebase_failed',
	DE_RTC_FEATURE_DISABLED: 'de_rtc_feature_disabled',
	DE_RTC_PRESENCE_STORAGE_UNAVAILABLE: 'de_rtc_presence_storage_unavailable',
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
	ACTION_TRANSCRIPT: 'action-transcript',
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
	ACTION_TRANSCRIPT: 'core/editor/distributed-editing/action-transcript',
} );

/**
 * Stable action keys that future UI can map to rendered buttons or menu items.
 */
export const DISTRIBUTED_EDITING_NOTICE_ACTIONS = Object.freeze( {
	ACCEPT_SERVER_STATE: 'accept-server-state',
	APPROVE_FRESH_REVIEW_ITEM: 'approve-fresh-review-item',
	COMPARE_FRESH_REVIEW_ITEM: 'compare-fresh-review-item',
	EXPORT_LOCAL_UPDATES: 'export-local-updates',
	JUMP_TO_FRESH_REVIEW_ITEM: 'jump-to-fresh-review-item',
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

/**
 * Stable content-free transcript event types. These are the first editor-side
 * operation-log vocabulary for DE-RTC. They describe categories of activity,
 * never raw block content, proof internals, or actor identities.
 */
export const DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES = Object.freeze(
	{
		LOCAL_EDITOR_ACTION: 'local_editor_action',
		REMOTE_CHANGE_RECEIVED: 'remote_change_received',
		SERVER_STATE_REFETCHED: 'server_state_refetched',
		LOCAL_CHANGES_APPLIED: 'local_changes_applied',
		LOCAL_CHANGES_STAGED: 'local_changes_staged',
		RETRY_SUBMIT_PROOF_REFRESHED: 'retry_submit_proof_refreshed',
		SAVE_PREPARED: 'save_prepared',
		SAVE_STATE_CHANGED: 'save_state_changed',
		SAVE_CONFIRMED: 'save_confirmed',
		REVIEW_REQUIRED: 'review_required',
		FRESH_REVIEW_REQUESTED: 'fresh_review_requested',
		FRESH_REVIEW_DECISION_SUBMITTED: 'fresh_review_decision_submitted',
		FRESH_REVIEW_CONSUME_VALIDATED: 'fresh_review_consume_validated',
		FRESH_REVIEW_RETRY_SAVE_CONFIRMED: 'fresh_review_retry_save_confirmed',
	}
);

const DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_DEFINITIONS = Object.freeze( {
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION ]:
		Object.freeze( { source: 'local' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED ]:
		Object.freeze( { source: 'remote' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED ]:
		Object.freeze( { source: 'server' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_APPLIED ]:
		Object.freeze( { source: 'editor' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_STAGED ]:
		Object.freeze( { source: 'editor' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED ]:
		Object.freeze( { source: 'server' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_PREPARED ]:
		Object.freeze( { source: 'editor' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED ]:
		Object.freeze( { source: 'editor' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED ]:
		Object.freeze( { source: 'server' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REVIEW_REQUIRED ]:
		Object.freeze( { source: 'review' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED ]:
		Object.freeze( { source: 'review' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED ]:
		Object.freeze( { source: 'review' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED ]:
		Object.freeze( { source: 'review' } ),
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED ]:
		Object.freeze( { source: 'server' } ),
} );

const DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_SUPPORT_LABELS = Object.freeze( {
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION ]:
		'Local editor action recorded',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED ]:
		'Remote editing activity recorded',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED ]:
		'Latest post loaded',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_APPLIED ]:
		'Local changes applied',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_STAGED ]:
		'Changes ready to save',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED ]:
		'Save verified',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_PREPARED ]:
		'Save prepared',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED ]:
		'Save started',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED ]:
		'Saved by WordPress',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REVIEW_REQUIRED ]:
		'Review required',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED ]:
		'Fresh review requested',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED ]:
		'Fresh-review decision submitted',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED ]:
		'Fresh-review handoff validated',
	[ DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED ]:
		'Fresh-review Save confirmed',
} );

const DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_SUPPORT_CHRONOLOGY_TEXT =
	Object.freeze( {
		none: 'No Distributed Editing activity transcript entries are available.',
		activity_recorded:
			'Distributed Editing activity was recorded; no fresh-review chronology is complete.',
		guarded_save_confirmed:
			'WordPress Save confirmation was recorded; use WordPress Save evidence to confirm persistence.',
		fresh_review_requested:
			'Fresh review was requested for protected local updates.',
		fresh_review_decision_submitted:
			'Fresh-review decision was submitted; Save still needs validation and WordPress authority.',
		fresh_review_handoff_validated:
			'Fresh-review handoff was validated; Save still requires WordPress confirmation.',
		fresh_review_guarded_save_confirmed:
			'Fresh-review Save confirmation was recorded; use WordPress Save evidence to confirm persistence.',
	} );

const MAX_DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_ITEMS = 10;

const DISTRIBUTED_EDITING_SYNC_META_SCRIPT_SOURCE = `<script\\b(?=[^>]*(?:\\btype\\s*=\\s*["']wp/post-sync-meta["']|(?=[^>]*\\btype\\s*=\\s*["']application/json["'])(?=[^>]*\\bdata-wp-sync-meta\\s*=\\s*["']distributed-editing["'])))[^>]*>([\\s\\S]*?)<\\/script\\s*>`;
const DISTRIBUTED_EDITING_AUTOMERGE_BLOCKS_SCHEMA = 'de-rtc-automerge-v1';
const DISTRIBUTED_EDITING_AUTOMERGE_BLOCKS_UPDATE_FORMAT =
	'native-automerge-blocks-v1';

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
 * Stable no-save stale-base conflict resolution statuses. These describe the
 * editor working-copy choice only; they do not authorize persistence.
 */
export const DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES =
	Object.freeze( {
		NONE: 'none',
		LOCAL_VERSION_SELECTED: 'local_version_selected',
		LATEST_WORDPRESS_SELECTED: 'latest_wordpress_selected',
	} );

/**
 * Stable no-save stale-base conflict resolution choices.
 */
export const DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES =
	Object.freeze( {
		LOCAL: 'local',
		LATEST_WORDPRESS: 'latest_wordpress',
	} );

/**
 * Stable statuses for the visible same-block Compare action. These describe
 * only the editor command state; they do not authorize persistence.
 */
export const DISTRIBUTED_EDITING_CONFLICT_COMPARISON_ACTION_STATUSES =
	Object.freeze( {
		NONE: 'none',
		OPEN_REQUESTED: 'open_requested',
		OPENED: 'opened',
		UNAVAILABLE: 'unavailable',
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
 * Stable statuses for editor-side block identity request proof preparation.
 * These are data descriptors only; they do not save or call REST.
 */
export const DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES =
	Object.freeze( {
		NONE: 'none',
		READY: 'ready',
		BLOCKED: 'blocked',
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
	WORKFLOW_ACTION_REQUIRED: 'workflow_action_required',
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
	COMPARE_CONFLICTING_CHANGES: 'compare_conflicting_changes',
	APPLY_LOCAL_CHANGES: 'apply_local_changes',
	PREPARE_CHANGES: 'prepare_changes',
	CHECK_WITH_WORDPRESS: 'check_with_wordpress',
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
	WORKFLOW_ACTION_REQUIRED: 'workflow_action_required',
} );

/**
 * Stable authoritative-post states for DE-RTC Save semantics. These clarify
 * what the Save button means without treating local editor state, autosaves,
 * review proof, or pending server confirmation as the saved WordPress post.
 */
export const DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES = Object.freeze( {
	READY_TO_UPDATE: 'ready_to_update_authoritative_post',
	REVIEW_REQUIRED_BEFORE_UPDATE: 'review_required_before_update',
	SERVER_REFRESH_REQUIRED_BEFORE_UPDATE:
		'server_refresh_required_before_update',
	READY_FOR_GUARDED_UPDATE: 'ready_for_guarded_update',
	REVIEW_VALIDATION_IN_PROGRESS: 'review_validation_in_progress',
	AWAITING_SERVER_CONFIRMATION: 'awaiting_server_confirmation',
	AUTHORITATIVE_UPDATE_CONFIRMED: 'authoritative_update_confirmed',
} );

/**
 * Stable local-change states for DE-RTC Save semantics. These clarify whether
 * the editor is carrying protected local work independent of the authoritative
 * WordPress post.
 */
export const DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES = Object.freeze( {
	NO_PROTECTED_CHANGES: 'no_protected_local_changes',
	PROTECTED_CHANGES: 'protected_local_changes',
	PROTECTED_CHANGES_EXPORTABLE: 'protected_local_changes_exportable',
	AWAITING_SERVER_CONFIRMATION:
		'protected_local_changes_awaiting_server_confirmation',
	AUTHORITATIVE_UPDATE_CONFIRMED: 'authoritative_update_confirmed',
} );

/**
 * Stable review checkpoint states for DE-RTC Save semantics. These separate
 * review work from both local editor dirtiness and authoritative post updates.
 */
export const DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES = Object.freeze(
	{
		NO_REVIEW_REQUIRED: 'no_review_required',
		REVIEW_REQUIRED: 'review_required',
		REVIEW_ACCEPTED: 'review_accepted',
		REVIEW_VALIDATING: 'review_validating',
		SERVER_REFRESH_REQUIRED: 'server_refresh_required',
		REVIEW_CONSUMED: 'review_consumed',
	}
);

/**
 * Stable M0 human-loop steps for the enabled editor shell. These are
 * communication descriptors only; they do not save, fetch, submit proof,
 * mutate content, or change post locks.
 */
export const DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS = Object.freeze( {
	READY_TO_EDIT: 'ready_to_edit',
	LOCAL_CHANGES_PROTECTED: 'local_changes_protected',
	GET_LATEST_POST: 'get_latest_post',
	REVIEW_CHANGES: 'review_changes',
	READY_TO_SAVE: 'ready_to_save',
	WAITING_FOR_WORDPRESS: 'waiting_for_wordpress',
	SAVE_CONFIRMED: 'save_confirmed',
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
	RETRY_SUBMIT_SAVE_REQUIRES_EXPLICIT_SAVE_CLICK:
		'retry_submit_save_requires_explicit_save_click',
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

export const DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES = Object.freeze( {
	HIDDEN: 'hidden',
	EMPTY: 'empty',
	ACTIVE: 'active',
	RECENT: 'recent',
	STALE: 'stale',
	DEGRADED: 'degraded',
} );

const VALID_DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES )
);

export const DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES = Object.freeze( {
	NONE: 'none',
	REFRESHED: 'refreshed',
	FEATURE_DISABLED: 'feature_disabled',
	PERMISSION_DENIED: 'permission_denied',
	ROUTE_MISMATCH: 'route_mismatch',
	FAILED: 'failed',
} );

const VALID_DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES )
);

export const DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES = Object.freeze( {
	NONE: 'none',
	SENT: 'sent',
	STORAGE_UNAVAILABLE: 'storage_unavailable',
	FEATURE_DISABLED: 'feature_disabled',
	PERMISSION_DENIED: 'permission_denied',
	ROUTE_MISMATCH: 'route_mismatch',
	FAILED: 'failed',
} );

const VALID_DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES )
);

/**
 * Legacy content-free selection presence schema.
 */
export const DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA_V1 =
	'de-rtc-selection-presence-v1';

/**
 * Current content-free selection presence schema.
 */
export const DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA_V2 =
	'de-rtc-selection-presence-v2';

/**
 * Default selection presence schema sent by current editors.
 */
export const DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA =
	DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA_V2;

/**
 * Content-free selection shapes that a remote editor may report.
 */
export const DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS = Object.freeze( {
	NONE: 'none',
	CARET: 'caret',
	RICH_TEXT: 'rich_text',
	RANGE: 'range',
	MULTI_BLOCK: 'multi_block',
	BLOCK: 'block',
	UNSUPPORTED_SURFACE: 'unsupported_surface',
} );

const VALID_DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS = new Set(
	Object.values( DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS )
);

/**
 * Sender-side status of the document copy used to report a selection.
 */
export const DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES = Object.freeze( {
	BASE_ALIGNED: 'base_aligned',
	LOCAL_PENDING_ONLY: 'local_pending_only',
	UNSUPPORTED_SURFACE: 'unsupported_surface',
	UNKNOWN: 'unknown',
} );

const VALID_DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES )
);

/**
 * Receiver-side precision after mapping a remote selection into this editor.
 */
export const DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES =
	Object.freeze( {
		EXACT: 'exact',
		BLOCK_ONLY: 'block_only',
		WITHHELD: 'withheld',
	} );

/**
 * Reasons a receiver may degrade or withhold a remote selection overlay.
 */
export const DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS = Object.freeze(
	{
		NONE: '',
		AMBIGUOUS_ORDINAL: 'ambiguous_ordinal',
		LOCAL_PENDING_DIVERGENCE: 'local_pending_divergence',
		MEASUREMENT_FAILED: 'measurement_failed',
		MISSING_ANCHOR: 'missing_anchor',
		OFFSET_OUT_OF_BOUNDS: 'offset_out_of_bounds',
		REPEATED_BLOCK_AMBIGUITY: 'repeated_block_ambiguity',
		STALE_BASE: 'stale_base',
		UNSUPPORTED_SURFACE: 'unsupported_surface',
	}
);

export const DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES =
	Object.freeze( {
		NONE: 'none',
		READY: 'ready',
		SETUP_REQUIRED: 'setup_required',
		UPGRADE_REQUIRED: 'upgrade_required',
		FEATURE_DISABLED: 'feature_disabled',
		PERMISSION_DENIED: 'permission_denied',
		ROUTE_MISMATCH: 'route_mismatch',
		FAILED: 'failed',
	} );

const VALID_DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES =
	new Set(
		Object.values(
			DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES
		)
	);

export const DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES =
	Object.freeze( {
		DISABLED_BY_DEFAULT: 'disabled_by_default',
		SCHEDULED: 'scheduled',
		PAUSED_DEGRADED_TRANSPORT: 'paused_degraded_transport',
	} );

const VALID_DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES =
	new Set(
		Object.values(
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES
		)
	);

export const DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES =
	Object.freeze( {
		DISABLED: 'disabled',
		CONNECTED: 'connected',
		DEGRADED: 'degraded',
	} );

const VALID_DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES =
	new Set(
		Object.values(
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES
		)
	);

export const DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES =
	Object.freeze( {
		MANUAL_REQUIRED: 'manual_required',
		AUTOMATIC_HEARTBEAT_ALLOWED: 'automatic_heartbeat_allowed',
		SLOW_AUTOMATIC_HEARTBEAT_ALLOWED: 'slow_automatic_heartbeat_allowed',
		PAUSED_DEGRADED_TRANSPORT: 'paused_degraded_transport',
	} );

const VALID_DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES )
);

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

const VALID_STALE_BASE_CONFLICT_RESOLUTION_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES )
);

const VALID_STALE_BASE_CONFLICT_RESOLUTION_CHOICES = new Set(
	Object.values( DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES )
);

const VALID_CONFLICT_COMPARISON_ACTION_STATUSES = new Set(
	Object.values( DISTRIBUTED_EDITING_CONFLICT_COMPARISON_ACTION_STATUSES )
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

const VALID_ACTION_TRANSCRIPT_EVENT_TYPES = new Set(
	Object.values( DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES )
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
	[ DISTRIBUTED_EDITING_NOTICE_KINDS.ACTION_TRANSCRIPT ]:
		DISTRIBUTED_EDITING_NOTICE_IDS.ACTION_TRANSCRIPT,
} );

export const DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE = Object.freeze( {
	postId: null,
	postType: null,
	clientBaseVersion: null,
	serverVersion: null,
	distributedEditingPostStateHash: null,
	clientBaseContent: null,
	clientBaseSyncMeta: null,
	refetchedServerContent: null,
	disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
	reasonCode: null,
	pendingChangeCount: 0,
	hasPendingChanges: false,
	isAwaitingServerConfirmation: false,
	saveButtonClickInFlight: false,
	conflictingChangesComparisonActionStatus:
		DISTRIBUTED_EDITING_CONFLICT_COMPARISON_ACTION_STATUSES.NONE,
	conflictingChangesComparisonActionReason: null,
	conflictingChangesComparisonActionRequested: false,
	conflictingChangesComparisonOpenRequested: false,
	conflictingChangesComparisonFocusRequested: false,
	conflictingChangesComparisonFocusedImmediately: false,
	conflictingChangesComparisonSurfaceOpened: false,
	isConnectionDegraded: false,
	remoteChangeCount: 0,
	hasRemoteChanges: false,
	remoteChangesReviewItemCount: 0,
	remoteChangesReviewPrePublishPanelRequired: false,
	remoteChangesReviewStatus: null,
	actionTranscriptItems: [],
	actionTranscriptItemCount: 0,
	actionTranscriptDroppedItemCount: 0,
	actionTranscriptLatestEventType: null,
	actionTranscriptLatestEventSource: null,
	actionTranscriptHasLocalEvents: false,
	actionTranscriptHasRemoteEvents: false,
	actionTranscriptHasServerEvents: false,
	actionTranscriptHasEditorEvents: false,
	actionTranscriptEntriesRedacted: true,
	actionTranscriptExposesRawContent: false,
	actionTranscriptExposesProofInternals: false,
	actionTranscriptExposesActorIds: false,
	actionTranscriptCallsRest: false,
	actionTranscriptCallsSave: false,
	actionTranscriptMutatesEditorContent: false,
	actionTranscriptChangesPostLock: false,
	actionTranscriptClaimsSaved: false,
	historyUndoStack: [],
	historyRedoStack: [],
	historyLastAction: null,
	presenceRosterStatus: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.HIDDEN,
	presenceRosterEntries: [],
	presenceRosterFreshness: 'unknown',
	presenceRosterServerContact: 'nominal',
	presenceRosterVisibleCount: 0,
	presenceRosterTotalKnownCount: 0,
	presenceRosterHiddenCount: 0,
	presenceRosterExpiredCount: 0,
	presenceRosterExpiredEvidenceCarriedForward: false,
	presenceRosterEmptySnapshotPreservedEntries: false,
	presenceRosterRefreshStatus:
		DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.NONE,
	presenceRosterRefreshReason: null,
	presenceRosterRefreshResult: null,
	presenceRosterRefreshRequested: false,
	presenceRosterRefreshSucceeded: false,
	presenceRosterRefreshFailed: false,
	presenceRosterRefreshCallsRestEndpoint: false,
	presenceRosterRefreshCallsSave: false,
	presenceRosterRefreshMutatesEditorContent: false,
	presenceRosterRefreshMutatesPersistedPostContent: false,
	presenceRosterRefreshChangesPostLock: false,
	presenceRosterRefreshRecordsPresenceHeartbeat: false,
	presenceRosterRefreshEnablesRepeatedClientRefresh: false,
	presenceRosterRefreshClaimsSaved: false,
	presenceRosterRefreshExposesRawContent: false,
	presenceRosterRefreshExposesUserIds: false,
	presenceRosterRefreshExposesCursorOffset: false,
	presenceRosterRefreshExposesSelection: false,
	presenceRosterReadContractSource: null,
	presenceRosterReadContractRoute: null,
	presenceRosterReadSuggestedPollingIntervalSeconds: null,
	presenceRosterReadCheapHostPollingIntervalSeconds: null,
	presenceRosterReadRepeatedClientRefreshEnabled: false,
	presenceHeartbeatStatus:
		DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.NONE,
	presenceHeartbeatReason: null,
	presenceHeartbeatResult: null,
	presenceHeartbeatRequested: false,
	presenceHeartbeatSucceeded: false,
	presenceHeartbeatFailed: false,
	presenceHeartbeatCallsRestEndpoint: false,
	presenceHeartbeatRecordsPresenceHeartbeat: false,
	presenceHeartbeatWritesPresence: false,
	presenceHeartbeatCallsSave: false,
	presenceHeartbeatMutatesEditorContent: false,
	presenceHeartbeatMutatesPersistedPostContent: false,
	presenceHeartbeatChangesPostLock: false,
	presenceHeartbeatClaimsSaved: false,
	presenceHeartbeatEnablesRepeatedClientRefresh: false,
	presenceHeartbeatRuntimePollingEnabled: false,
	presenceHeartbeatExposesRawContent: false,
	presenceHeartbeatExposesUserIds: false,
	presenceHeartbeatExposesCursorOffset: false,
	presenceHeartbeatExposesSelection: false,
	presenceHeartbeatRawSessionKeyIncluded: false,
	presenceHeartbeatMarksLocalEditorCurrent: false,
	presenceHeartbeatMarksLocalEditorDelayed: false,
	presenceHeartbeatLocalRosterEntryVisible: false,
	presenceHeartbeatLocalRosterEntryFreshness: null,
	presenceHeartbeatRepeatedRefreshOptional: true,
	presenceHeartbeatSuggestedIntervalSeconds: null,
	presenceHeartbeatCheapHostIntervalSeconds: null,
	presenceDocumentStateConfirmedBaseVersion: null,
	presenceDocumentStateConfirmedStateHash: null,
	presenceDocumentStateConfirmedAtGmt: null,
	presenceDocumentStatePublishedKey: null,
	presenceHeartbeatAttributionKey: null,
	authorshipFocusAttributionKey: null,
	authorshipFocusPresenceEntryKey: null,
	authorshipFocusDisplayName: null,
	authorshipFocusActive: false,
	presenceStorageReadinessRecheckStatus:
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.NONE,
	presenceStorageReadinessRecheckReason: null,
	presenceStorageReadinessRecheckResult: null,
	presenceStorageReadinessRecheckRequested: false,
	presenceStorageReadinessRecheckSucceeded: false,
	presenceStorageReadinessRecheckFailed: false,
	presenceStorageReadinessRecheckCallsRestEndpoint: false,
	presenceStorageReadinessRecheckInstallsPresenceTable: false,
	presenceStorageReadinessRecheckRecordsPresenceHeartbeat: false,
	presenceStorageReadinessRecheckWritesPresence: false,
	presenceStorageReadinessRecheckStartsPolling: false,
	presenceStorageReadinessRecheckCallsSave: false,
	presenceStorageReadinessRecheckMutatesEditorContent: false,
	presenceStorageReadinessRecheckMutatesPersistedPostContent: false,
	presenceStorageReadinessRecheckChangesPostLock: false,
	presenceStorageReadinessRecheckClaimsAbsence: false,
	presenceStorageReadinessRecheckClaimsSaved: false,
	presenceStorageReadinessRecheckContentFree: true,
	presenceStorageReadinessRecheckExposesRawContent: false,
	presenceStorageReadinessRecheckExposesUserIds: false,
	presenceStorageReadinessRecheckExposesCursorOffset: false,
	presenceStorageReadinessRecheckExposesSelection: false,
	presenceStorageReadinessRecheckCorrectnessIndependentOfTransport: true,
	presenceStorageReadinessRecheckTransportRequiredForCorrectness: false,
	presenceRepeatedRefreshRuntimeStatus:
		DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.DISABLED_BY_DEFAULT,
	presenceRepeatedRefreshLocalConnectionState:
		DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DISABLED,
	presenceRepeatedRefreshRequiresExplicitOptIn: true,
	presenceRepeatedRefreshRuntimeEnabledByDefault: false,
	presenceRepeatedRefreshExplicitOptIn: false,
	presenceRepeatedRefreshHostProfile: null,
	presenceRepeatedRefreshServerContact: 'nominal',
	presenceRepeatedRefreshSelectedIntervalSeconds: null,
	presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: null,
	presenceRepeatedRefreshStandardIntervalSeconds: null,
	presenceRepeatedRefreshCheapHostIntervalSeconds: null,
	presenceRepeatedRefreshMinimumIntervalSeconds: null,
	presenceRepeatedRefreshSchedulesNextRefresh: false,
	presenceRepeatedRefreshSchedulesNextHeartbeat: false,
	presenceRepeatedRefreshCallsPresenceReadEndpointNow: false,
	presenceRepeatedRefreshCallsHeartbeatEndpointNow: false,
	presenceRepeatedRefreshRecordsPresenceHeartbeatNow: false,
	presenceRepeatedRefreshWritesHeartbeatNow: false,
	presenceRepeatedRefreshStartsPollingImmediately: false,
	presenceRepeatedRefreshPausesOnDegradedTransport: true,
	presenceRepeatedRefreshExposesLocalConnectionState: true,
	presenceRepeatedRefreshOptional: true,
	presenceRepeatedRefreshCorrectnessIndependentOfTransport: true,
	presenceRepeatedRefreshTransportRequiredForCorrectness: false,
	presenceRepeatedRefreshDispatchesNotice: false,
	presenceRepeatedRefreshCallsSave: false,
	presenceRepeatedRefreshMutatesEditorContent: false,
	presenceRepeatedRefreshMutatesPersistedPostContent: false,
	presenceRepeatedRefreshChangesPostLock: false,
	presenceRepeatedRefreshClaimsAbsence: false,
	presenceRepeatedRefreshClaimsSaved: false,
	presenceRepeatedRefreshExposesRawContent: false,
	presenceRepeatedRefreshExposesUserIds: false,
	presenceRepeatedRefreshExposesLogins: false,
	presenceRepeatedRefreshExposesEmail: false,
	presenceRepeatedRefreshExposesCursorOffset: false,
	presenceRepeatedRefreshExposesSelection: false,
	presenceRepeatedRefreshRawSessionKeyIncluded: false,
	presenceStartupPolicyStatus:
		DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.MANUAL_REQUIRED,
	presenceStartupPolicyReason: 'manual_startup_required',
	presenceStartupPolicyRequiresExplicitEnablement: true,
	presenceStartupPolicyMaySendInitialHeartbeatAutomatically: false,
	presenceStartupPolicySlowAutomaticHeartbeatAllowed: false,
	presenceStartupPolicyManualHeartbeatAvailable: true,
	presenceStartupPolicyHostProfile: null,
	presenceStartupPolicyServerContact: 'nominal',
	presenceStartupPolicySelectedInitialHeartbeatDelaySeconds: null,
	presenceStartupPolicyStandardInitialHeartbeatDelaySeconds: null,
	presenceStartupPolicyCheapHostInitialHeartbeatDelaySeconds: null,
	presenceStartupPolicyMinimumInitialHeartbeatDelaySeconds: null,
	presenceStartupPolicyCallsHeartbeatEndpointNow: false,
	presenceStartupPolicyRecordsPresenceHeartbeatNow: false,
	presenceStartupPolicyWritesPresenceNow: false,
	presenceStartupPolicyStartsPollingNow: false,
	presenceStartupPolicyStartsTimerNow: false,
	presenceStartupPolicyDispatchesNotice: false,
	presenceStartupPolicyCallsSave: false,
	presenceStartupPolicyMutatesEditorContent: false,
	presenceStartupPolicyMutatesPersistedPostContent: false,
	presenceStartupPolicyChangesPostLock: false,
	presenceStartupPolicyClaimsAbsence: false,
	presenceStartupPolicyClaimsSaved: false,
	presenceStartupPolicyExposesRawContent: false,
	presenceStartupPolicyExposesUserIds: false,
	presenceStartupPolicyExposesLogins: false,
	presenceStartupPolicyExposesEmail: false,
	presenceStartupPolicyExposesCursorOffset: false,
	presenceStartupPolicyExposesSelection: false,
	presenceStartupPolicyRawSessionKeyIncluded: false,
	presenceStartupPolicyCorrectnessIndependentOfTransport: true,
	presenceStartupPolicyTransportRequiredForCorrectness: false,
	requiresServerStateAcceptance: false,
	requiresServerStateRefetch: false,
	refetchedServerState: false,
	canAttemptLocalRebase: false,
	localRebasePlanStatus: DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NONE,
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
	retrySubmitSaveRequiresExplicitSaveClick: false,
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
	retrySaveIdempotentNoWrite: false,
	retrySaveAlreadyPersisted: false,
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
	localUpdatesImportActionTranscriptReport: null,
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

function getDistributedEditingActionTranscriptRawItems( sessionState = {} ) {
	const rawItems = getFirstDefined(
		sessionState.actionTranscriptItems,
		sessionState.distributedEditingActionTranscriptItems,
		sessionState.operationTranscriptItems,
		sessionState.transcriptItems
	);

	return Array.isArray( rawItems ) ? rawItems : [];
}

function transcriptItemExposesRawContent( item = {} ) {
	return Boolean(
		item.rawContent ||
			item.postContent ||
			item.post_content ||
			item.blockContent ||
			item.block_content ||
			item.content ||
			item.html ||
			item.text ||
			item.value ||
			item.blocks ||
			item.edits?.content ||
			item.edits?.post_content
	);
}

function transcriptItemExposesProofInternals( item = {} ) {
	return Boolean(
		item.proof ||
			item.proofSignature ||
			item.proof_signature ||
			item.token ||
			item.reviewToken ||
			item.review_token ||
			item.acceptedReviewApprovalProof
	);
}

function transcriptItemExposesActorIds( item = {} ) {
	return Boolean(
		item.userId ||
			item.user_id ||
			item.actorId ||
			item.actor_id ||
			item.reviewerId ||
			item.reviewer_id ||
			item.saverId ||
			item.saver_id
	);
}

function normalizeDistributedEditingActionTranscriptItem( item = {}, index ) {
	const eventType = VALID_ACTION_TRANSCRIPT_EVENT_TYPES.has( item.eventType )
		? item.eventType
		: null;

	if ( ! eventType ) {
		return null;
	}

	const exposesRawContent = transcriptItemExposesRawContent( item );
	const exposesProofInternals = transcriptItemExposesProofInternals( item );
	const exposesActorIds = transcriptItemExposesActorIds( item );

	if ( exposesRawContent || exposesProofInternals || exposesActorIds ) {
		return null;
	}

	const definition =
		DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_DEFINITIONS[ eventType ];

	return {
		id: `de-rtc-action-transcript-${ index + 1 }`,
		eventType,
		source: definition?.source || 'editor',
		sequence: index + 1,
		reasonCode: isValidDistributedEditingReasonCode( item.reasonCode )
			? item.reasonCode
			: null,
		redacted: true,
		exposesRawContent: false,
		exposesProofInternals: false,
		exposesActorIds: false,
	};
}

function normalizeDistributedEditingActionTranscriptFields(
	sessionState = {}
) {
	const rawItems =
		getDistributedEditingActionTranscriptRawItems( sessionState );
	const actionTranscriptItems = rawItems
		.map( normalizeDistributedEditingActionTranscriptItem )
		.filter( Boolean )
		.slice( -MAX_DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_ITEMS );
	const latestItem =
		actionTranscriptItems[ actionTranscriptItems.length - 1 ] || null;
	const droppedItemCount =
		normalizeCount( sessionState.actionTranscriptDroppedItemCount ) +
		rawItems.length -
		actionTranscriptItems.length;

	return {
		actionTranscriptItems,
		actionTranscriptItemCount: actionTranscriptItems.length,
		actionTranscriptDroppedItemCount: droppedItemCount,
		actionTranscriptLatestEventType: latestItem?.eventType || null,
		actionTranscriptLatestEventSource: latestItem?.source || null,
		actionTranscriptHasLocalEvents: actionTranscriptItems.some(
			( item ) => item.source === 'local'
		),
		actionTranscriptHasRemoteEvents: actionTranscriptItems.some(
			( item ) => item.source === 'remote'
		),
		actionTranscriptHasServerEvents: actionTranscriptItems.some(
			( item ) => item.source === 'server'
		),
		actionTranscriptHasEditorEvents: actionTranscriptItems.some(
			( item ) => item.source === 'editor'
		),
		actionTranscriptEntriesRedacted: true,
		actionTranscriptExposesRawContent: false,
		actionTranscriptExposesProofInternals: false,
		actionTranscriptExposesActorIds: false,
		actionTranscriptCallsRest: false,
		actionTranscriptCallsSave: false,
		actionTranscriptMutatesEditorContent: false,
		actionTranscriptChangesPostLock: false,
		actionTranscriptClaimsSaved: false,
	};
}

/**
 * Returns session state with one content-free action transcript event appended.
 * Unsafe events are counted as dropped and are not retained.
 *
 * @param {Object} sessionState    DE-RTC session state.
 * @param {Object} transcriptEvent Candidate transcript event.
 *
 * @return {Object} Session state with the transcript event applied.
 */
export function getDistributedEditingSessionStateWithActionTranscriptEvent(
	sessionState = {},
	transcriptEvent = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const eventState = normalizeDistributedEditingSessionState( {
		actionTranscriptItems: [ transcriptEvent ],
	} );

	if ( eventState.actionTranscriptItemCount < 1 ) {
		return normalizeDistributedEditingSessionState( {
			...normalized,
			actionTranscriptDroppedItemCount:
				normalized.actionTranscriptDroppedItemCount + 1,
		} );
	}

	return normalizeDistributedEditingSessionState( {
		...normalized,
		actionTranscriptItems: [
			...normalized.actionTranscriptItems,
			eventState.actionTranscriptItems[ 0 ],
		],
	} );
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
	const isPartialSafePendingReview =
		reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT &&
		sessionState.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED &&
		Boolean( sessionState.refetchedServerState ) &&
		! Boolean( sessionState.requiresServerStateRefetch );
	const hasExplicitAwaitingServerConfirmation =
		sessionState.isAwaitingServerConfirmation !== undefined &&
		sessionState.isAwaitingServerConfirmation !== null;
	let isAwaitingServerConfirmation =
		sessionState.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING || hasPendingChanges;

	if ( hasExplicitAwaitingServerConfirmation ) {
		isAwaitingServerConfirmation = Boolean(
			sessionState.isAwaitingServerConfirmation
		);
	}

	if ( isPartialSafePendingReview ) {
		isAwaitingServerConfirmation = false;
	}
	const saveButtonClickInFlight = Boolean(
		sessionState.saveButtonClickInFlight
	);
	const conflictingChangesComparisonActionStatus =
		VALID_CONFLICT_COMPARISON_ACTION_STATUSES.has(
			sessionState.conflictingChangesComparisonActionStatus
		)
			? sessionState.conflictingChangesComparisonActionStatus
			: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.conflictingChangesComparisonActionStatus;
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
		sessionState.requiresManualConflictResolution &&
			! isPartialSafePendingReview
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
	const staleBaseConflictResolutionStatus =
		VALID_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.has(
			sessionState.staleBaseConflictResolutionStatus
		)
			? sessionState.staleBaseConflictResolutionStatus
			: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.staleBaseConflictResolutionStatus;
	const staleBaseConflictResolutionChoice =
		VALID_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.has(
			sessionState.staleBaseConflictResolutionChoice
		)
			? sessionState.staleBaseConflictResolutionChoice
			: DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE.staleBaseConflictResolutionChoice;
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
	const retrySubmitSaveRequiresExplicitSaveClick =
		Boolean( sessionState.retrySubmitSaveRequiresExplicitSaveClick ) &&
		retrySubmitSaveReady &&
		retrySubmitSaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY;
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
	const localUpdatesImportActionTranscriptReport =
		localUpdatesImportRequiresFreshReview
			? normalizeDistributedEditingLocalUpdatesImportActionTranscriptReport(
					sessionState.localUpdatesImportActionTranscriptReport
			  )
			: null;
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
	const retrySaveReviewFields =
		normalizeRetrySaveReviewMetadataFields( sessionState );
	const riskyBlockReviewFields =
		normalizeRiskyBlockReviewMetadataFields( sessionState );
	const hasPendingRiskyBlockReviewItems =
		riskyBlockReviewFields.riskyBlockReviewHasPendingItems;
	const shouldSuppressHashOnlyReviewLocalCopy =
		( retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED ||
			retrySaveReason ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT ||
			retrySaveReason ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML ||
			hasPendingRiskyBlockReviewItems ) &&
		! retrySaveReviewFields.retrySaveReviewRawContentIncluded &&
		! riskyBlockReviewFields.riskyBlockReviewRawContentIncluded;
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
		! shouldSuppressHashOnlyReviewLocalCopy &&
		( Boolean( sessionState.mustOfferLocalCopy ) ||
			( requiresServerStateAcceptance && hasPendingChanges ) ||
			( requiresServerStateRefetch && hasPendingChanges ) ||
			( retrySubmitSavePathRequired && hasPendingChanges ) ||
			( retrySaveStatus ===
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING &&
				hasPendingChanges ) ||
			( reviewTokenRecoveryRequiresFreshReview && hasPendingChanges ) ||
			( retrySaveHandoffBlocksNormalSave && hasPendingChanges ) ||
			( retrySaveReviewApprovalAccepted && hasPendingChanges ) ||
			( retrySaveFreshReviewConsumeValidationAccepted &&
				hasPendingChanges ) ||
			( hasPendingRiskyBlockReviewItems &&
				riskyBlockReviewFields.riskyBlockReviewRawContentIncluded ) ||
			( requiresManualConflictResolution && hasPendingChanges ) );
	const canExportLocalUpdates =
		! shouldSuppressHashOnlyReviewLocalCopy &&
		( Boolean( sessionState.canExportLocalUpdates ) ||
			riskyBlockReviewFields.riskyBlockReviewCanExportLocalUpdates ||
			mustOfferLocalCopy );

	return {
		postId: normalizeNullableIdString( sessionState.postId ),
		postType: normalizeNullableString( sessionState.postType ),
		clientBaseVersion: normalizeNullableString(
			sessionState.clientBaseVersion
		),
		serverVersion: normalizeNullableString( sessionState.serverVersion ),
		distributedEditingPostStateHash: normalizeNullableString(
			sessionState.distributedEditingPostStateHash ??
				sessionState.state_hash ??
				sessionState.stateHash
		),
		clientBaseContent: normalizeNullableContentString(
			sessionState.clientBaseContent
		),
		clientBaseSyncMeta: normalizeDistributedEditingSyncMeta(
			sessionState.clientBaseSyncMeta
		),
		refetchedServerContent: normalizeNullableContentString(
			sessionState.refetchedServerContent
		),
		disposition,
		reasonCode,
		pendingChangeCount,
		hasPendingChanges,
		isAwaitingServerConfirmation,
		saveButtonClickInFlight,
		conflictingChangesComparisonActionStatus,
		conflictingChangesComparisonActionReason: normalizeNullableString(
			sessionState.conflictingChangesComparisonActionReason
		),
		conflictingChangesComparisonActionRequested: Boolean(
			sessionState.conflictingChangesComparisonActionRequested
		),
		conflictingChangesComparisonOpenRequested: Boolean(
			sessionState.conflictingChangesComparisonOpenRequested
		),
		conflictingChangesComparisonFocusRequested: Boolean(
			sessionState.conflictingChangesComparisonFocusRequested
		),
		conflictingChangesComparisonFocusedImmediately: Boolean(
			sessionState.conflictingChangesComparisonFocusedImmediately
		),
		conflictingChangesComparisonSurfaceOpened: Boolean(
			sessionState.conflictingChangesComparisonSurfaceOpened
		),
		isConnectionDegraded,
		remoteChangeCount,
		hasRemoteChanges,
		remoteChangesReviewItemCount: normalizeCount(
			sessionState.remoteChangesReviewItemCount
		),
		remoteChangesReviewPrePublishPanelRequired: Boolean(
			sessionState.remoteChangesReviewPrePublishPanelRequired
		),
		remoteChangesReviewStatus: normalizeNullableString(
			sessionState.remoteChangesReviewStatus
		),
		historyUndoStack: normalizeDistributedEditingHistoryStack(
			sessionState.historyUndoStack
		),
		historyRedoStack: normalizeDistributedEditingHistoryStack(
			sessionState.historyRedoStack
		),
		historyLastAction: normalizeNullableString(
			sessionState.historyLastAction
		),
		...normalizeDistributedEditingActionTranscriptFields( sessionState ),
		...normalizeDistributedEditingPresenceRosterFields( sessionState ),
		...normalizeDistributedEditingPresenceRefreshFields( sessionState ),
		...normalizeDistributedEditingPresenceHeartbeatFields( sessionState ),
		...normalizeDistributedEditingPresenceRepeatedRefreshRuntimeFields(
			sessionState
		),
		presenceHeartbeatAttributionKey: normalizeNullableString(
			sessionState.presenceHeartbeatAttributionKey
		),
		authorshipFocusAttributionKey: normalizeNullableString(
			sessionState.authorshipFocusAttributionKey
		),
		authorshipFocusPresenceEntryKey: normalizeNullableString(
			sessionState.authorshipFocusPresenceEntryKey
		),
		authorshipFocusDisplayName: normalizeNullableString(
			sessionState.authorshipFocusDisplayName
		),
		authorshipFocusActive: Boolean(
			sessionState.authorshipFocusAttributionKey
		),
		...normalizeDistributedEditingPresenceStartupPolicyFields(
			sessionState
		),
		...normalizeDistributedEditingPresenceStorageReadinessRecheckFields(
			sessionState
		),
		requiresServerStateAcceptance,
		requiresServerStateRefetch,
		refetchedServerState,
		canAttemptLocalRebase,
		localRebasePlanStatus,
		localRebaseResultStatus,
		localRebaseResultReason,
		staleBaseConflictResolutionStatus,
		staleBaseConflictResolutionChoice,
		staleBaseConflictResolutionRequiresFreshProof: Boolean(
			sessionState.staleBaseConflictResolutionRequiresFreshProof
		),
		staleBaseConflictResolutionCallsRest: Boolean(
			sessionState.staleBaseConflictResolutionCallsRest
		),
		staleBaseConflictResolutionCallsSave: Boolean(
			sessionState.staleBaseConflictResolutionCallsSave
		),
		staleBaseConflictResolutionMutatesEditorContent: Boolean(
			sessionState.staleBaseConflictResolutionMutatesEditorContent
		),
		staleBaseConflictResolutionMutatesPersistedPostContent: Boolean(
			sessionState.staleBaseConflictResolutionMutatesPersistedPostContent
		),
		staleBaseConflictResolutionCreatesRevision: Boolean(
			sessionState.staleBaseConflictResolutionCreatesRevision
		),
		staleBaseConflictResolutionChangesPostLock: Boolean(
			sessionState.staleBaseConflictResolutionChangesPostLock
		),
		staleBaseConflictResolutionClaimsSaved: Boolean(
			sessionState.staleBaseConflictResolutionClaimsSaved
		),
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
		retrySubmitSaveRequiresExplicitSaveClick,
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
		retrySaveIdempotentNoWrite: Boolean(
			sessionState.retrySaveIdempotentNoWrite
		),
		retrySaveAlreadyPersisted: Boolean(
			sessionState.retrySaveAlreadyPersisted
		),
		retrySaveRevisionCreated: Boolean(
			sessionState.retrySaveRevisionCreated
		),
		retrySaveCreatedRevisionIds: normalizeIdList(
			sessionState.retrySaveCreatedRevisionIds
		),
		retrySaveConfirmedMergedEdits: Boolean(
			sessionState.retrySaveConfirmedMergedEdits
		),
		retrySaveServerMerged: Boolean( sessionState.retrySaveServerMerged ),
		retrySaveServerMergeApplied: Boolean(
			sessionState.retrySaveServerMergeApplied
		),
		retrySaveServerMergeStatus: normalizeNullableString(
			sessionState.retrySaveServerMergeStatus
		),
		retrySaveServerMergeStrategy: normalizeNullableString(
			sessionState.retrySaveServerMergeStrategy
		),
		retrySaveServerMergeBaseVersion: normalizeNullableString(
			sessionState.retrySaveServerMergeBaseVersion
		),
		retrySaveServerMergeServerVersion: normalizeNullableString(
			sessionState.retrySaveServerMergeServerVersion
		),
		retrySaveServerMergeBlockCount: normalizeCount(
			sessionState.retrySaveServerMergeBlockCount
		),
		retrySaveServerMergeServerChangedIndexes: normalizeBlockPath(
			sessionState.retrySaveServerMergeServerChangedIndexes
		),
		retrySaveServerMergeLocalChangedIndexes: normalizeBlockPath(
			sessionState.retrySaveServerMergeLocalChangedIndexes
		),
		retrySaveServerMergeMergedStrippedContentHash: normalizeSha256Hash(
			sessionState.retrySaveServerMergeMergedStrippedContentHash
		),
		...retrySaveReviewFields,
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
		localUpdatesImportActionTranscriptReport,
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
 * Returns a support-safe operation transcript summary for DE-RTC editor
 * activity. The summary is derived only from stable event types and cannot
 * expose raw post content, proof internals, or actor identities.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Content-free action transcript state.
 */
export function getDistributedEditingActionTranscriptStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return {
		status: normalized.actionTranscriptItemCount > 0 ? 'available' : 'none',
		items: normalized.actionTranscriptItems,
		itemCount: normalized.actionTranscriptItemCount,
		droppedItemCount: normalized.actionTranscriptDroppedItemCount,
		latestEventType: normalized.actionTranscriptLatestEventType,
		latestEventSource: normalized.actionTranscriptLatestEventSource,
		hasLocalEvents: normalized.actionTranscriptHasLocalEvents,
		hasRemoteEvents: normalized.actionTranscriptHasRemoteEvents,
		hasServerEvents: normalized.actionTranscriptHasServerEvents,
		hasEditorEvents: normalized.actionTranscriptHasEditorEvents,
		entriesRedacted: normalized.actionTranscriptEntriesRedacted,
		exposesRawContent: normalized.actionTranscriptExposesRawContent,
		exposesProofInternals: normalized.actionTranscriptExposesProofInternals,
		exposesActorIds: normalized.actionTranscriptExposesActorIds,
		callsRest: normalized.actionTranscriptCallsRest,
		callsSave: normalized.actionTranscriptCallsSave,
		mutatesEditorContent: normalized.actionTranscriptMutatesEditorContent,
		changesPostLock: normalized.actionTranscriptChangesPostLock,
		claimsSaved: normalized.actionTranscriptClaimsSaved,
	};
}

function normalizeDistributedEditingBooleanValue( value ) {
	if ( value === true || value === false ) {
		return value;
	}

	if ( typeof value === 'string' ) {
		return [ '1', 'true', 'yes' ].includes( value.toLowerCase() );
	}

	return Boolean( value );
}

function normalizeDistributedEditingPresenceSelectionBlockPath( path ) {
	if ( ! Array.isArray( path ) || path.length === 0 || path.length > 12 ) {
		return null;
	}

	const normalizedPath = path.map( ( part ) => {
		const number = Number( part );

		if ( ! Number.isInteger( number ) || number < 0 || number > 10000 ) {
			return null;
		}

		return number;
	} );

	return normalizedPath.includes( null ) ? null : normalizedPath;
}

function normalizeDistributedEditingPresenceSelectionBlockUid( value ) {
	const normalized = normalizeNullableString( value );

	return normalized && /^[A-Za-z0-9._:-]{1,191}$/.test( normalized )
		? normalized
		: null;
}

function normalizeDistributedEditingPresenceSelectionPoint( point ) {
	const source = normalizeObject( point );
	const blockPath = normalizeDistributedEditingPresenceSelectionBlockPath(
		getFirstDefined( source.blockPath, source.block_path, source.path )
	);
	const blockUid = normalizeDistributedEditingPresenceSelectionBlockUid(
		getFirstDefined( source.blockUid, source.block_uid )
	);

	if ( ! blockPath && ! blockUid ) {
		return null;
	}

	const requestedAttributeKey =
		normalizeNullableString(
			getFirstDefined( source.attributeKey, source.attribute_key )
		) || '';
	const attributeKey = /^[A-Za-z0-9_-]{1,64}$/.test( requestedAttributeKey )
		? requestedAttributeKey
		: '';
	const requestedOffset = getFirstDefined( source.offset, null );
	let offset = null;

	if ( requestedOffset !== null && requestedOffset !== undefined ) {
		const normalizedOffset = normalizeNonNegativeInteger( requestedOffset );
		offset =
			normalizedOffset === null
				? null
				: Math.min( normalizedOffset, 1000000 );
	}

	return {
		blockPath,
		blockUid,
		attributeKey,
		offset,
	};
}

function normalizeDistributedEditingPresenceSelectionSourceStatus( value ) {
	const normalized = normalizeNullableString( value );

	return VALID_DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.has( normalized )
		? normalized
		: DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.UNKNOWN;
}

function getUnavailableDistributedEditingPresenceSelectionState(
	presenceUpdatedAtGmt = null
) {
	return {
		available: false,
		schema: DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA,
		kind: DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.NONE,
		isCollapsed: true,
		anchor: null,
		focus: null,
		baseVersion: null,
		baseStateHash: null,
		selectionSourceStatus:
			DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.UNKNOWN,
		reportedAtGmt: null,
		presenceUpdatedAtGmt,
		source: 'unavailable',
		contentFree: true,
		authoritativeForSave: false,
		claimsSaved: false,
		exposesRawContent: false,
		exposesRawSelectedText: false,
		exposesClientId: false,
		exposesDomSelector: false,
		exposesBoundedSelectionOffsets: false,
	};
}

/**
 * Normalizes content-free selection presence for remote roster display.
 *
 * This descriptor may include bounded block-relative offsets so the editor can
 * draw carets. It must not carry Gutenberg `clientId`, raw text, HTML, DOM
 * selectors, or user identity fields.
 *
 * @param {Object} selectionState Proposed selection state.
 *
 * @return {Object} Content-free selection presence.
 */
export function normalizeDistributedEditingPresenceSelectionState(
	selectionState
) {
	const source = normalizeObject( selectionState );
	const schema = normalizeNullableString( source.schema );
	const isV1Schema =
		schema === DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA_V1;
	const isV2Schema =
		schema === DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA_V2;
	const requestedKind = normalizeNullableString( source.kind );
	const kindAliases = {
		collapsed_caret: DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.CARET,
		rich_text_range: DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.RICH_TEXT,
		multi_block_range:
			DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.MULTI_BLOCK,
		block_focus: DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.BLOCK,
	};
	const kind = kindAliases[ requestedKind ] || requestedKind;

	if (
		( ! isV1Schema && ! isV2Schema ) ||
		! normalizeDistributedEditingBooleanValue( source.available ) ||
		! VALID_DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.has( kind ) ||
		kind === DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.NONE
	) {
		return getUnavailableDistributedEditingPresenceSelectionState(
			normalizeNullableString(
				getFirstDefined(
					source.presenceUpdatedAtGmt,
					source.presence_updated_at_gmt
				)
			)
		);
	}

	const baseVersion = isV2Schema
		? normalizeNullableString(
				getFirstDefined(
					source.baseVersion,
					source.base_version,
					source.confirmedBaseVersion,
					source.confirmed_base_version
				)
		  )
		: null;
	const baseStateHash = isV2Schema
		? normalizeSha256Hash(
				getFirstDefined(
					source.baseStateHash,
					source.base_state_hash,
					source.confirmedStateHash,
					source.confirmed_state_hash
				)
		  )
		: null;

	if (
		kind ===
		DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.UNSUPPORTED_SURFACE
	) {
		return {
			available: true,
			schema,
			kind,
			isCollapsed: true,
			anchor: null,
			focus: null,
			baseVersion,
			baseStateHash,
			selectionSourceStatus:
				DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.UNSUPPORTED_SURFACE,
			reportedAtGmt: normalizeNullableString(
				getFirstDefined( source.reportedAtGmt, source.reported_at_gmt )
			),
			presenceUpdatedAtGmt: normalizeNullableString(
				getFirstDefined(
					source.presenceUpdatedAtGmt,
					source.presence_updated_at_gmt
				)
			),
			source: 'client_reported_presence',
			contentFree: true,
			authoritativeForSave: false,
			claimsSaved: false,
			exposesRawContent: false,
			exposesRawSelectedText: false,
			exposesClientId: false,
			exposesDomSelector: false,
			exposesBoundedSelectionOffsets: false,
		};
	}

	const anchor = normalizeDistributedEditingPresenceSelectionPoint(
		source.anchor
	);
	const focus =
		normalizeDistributedEditingPresenceSelectionPoint( source.focus ) ||
		anchor;

	if ( ! anchor || ! focus ) {
		return getUnavailableDistributedEditingPresenceSelectionState();
	}

	const selectionSourceStatus =
		normalizeDistributedEditingPresenceSelectionSourceStatus(
			getFirstDefined(
				source.selectionSourceStatus,
				source.selection_source_status,
				source.sourceStatus,
				source.source_status
			)
		);

	return {
		available: true,
		schema,
		kind,
		isCollapsed: normalizeDistributedEditingBooleanValue(
			getFirstDefined( source.isCollapsed, source.is_collapsed )
		),
		anchor,
		focus,
		baseVersion,
		baseStateHash,
		selectionSourceStatus,
		reportedAtGmt: normalizeNullableString(
			getFirstDefined(
				source.reportedAtGmt,
				source.reported_at_gmt,
				source.updatedAt,
				source.updated_at
			)
		),
		presenceUpdatedAtGmt: normalizeNullableString(
			getFirstDefined(
				source.presenceUpdatedAtGmt,
				source.presence_updated_at_gmt
			)
		),
		source:
			normalizeNullableString( source.source ) ||
			'client_reported_presence',
		contentFree: true,
		authoritativeForSave: false,
		claimsSaved: false,
		exposesRawContent: false,
		exposesRawSelectedText: false,
		exposesClientId: false,
		exposesDomSelector: false,
		exposesBoundedSelectionOffsets:
			anchor.offset !== null || focus.offset !== null,
	};
}

function getDistributedEditingSelectionPresenceResolvedPoint( point, options ) {
	if ( ! point ) {
		return {
			status: DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.WITHHELD,
			reason: DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.MISSING_ANCHOR,
			clientId: null,
		};
	}

	const resolveBlockUid =
		typeof options.resolveBlockUid === 'function'
			? options.resolveBlockUid
			: null;
	const resolveBlockPath =
		typeof options.resolveBlockPath === 'function'
			? options.resolveBlockPath
			: null;
	let clientId = null;

	if ( point.blockUid && resolveBlockUid ) {
		clientId = resolveBlockUid( point.blockUid, point );
	}

	if ( ! clientId && point.blockPath && resolveBlockPath ) {
		clientId = resolveBlockPath( point.blockPath, point );
	}

	if ( ! clientId ) {
		return {
			status: DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.WITHHELD,
			reason: DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.MISSING_ANCHOR,
			clientId: null,
		};
	}

	return {
		status: DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.EXACT,
		reason: DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.NONE,
		clientId,
	};
}

/**
 * Resolves whether a remote selection may be rendered in this editor.
 *
 * Sender-reported selection facts are deliberately not render authority. The
 * receiver must prove that its current document can map the remote anchors
 * safely, otherwise it withholds the canvas overlay.
 *
 * @param {Object} selectionState Normalized selection presence.
 * @param {Object} options        Mapping options.
 *
 * @return {Object} Receiver-computed mapping decision.
 */
export function getDistributedEditingSelectionPresenceMapping(
	selectionState,
	options = {}
) {
	const unavailable = ( reason ) => ( {
		resolvedMappingStatus:
			DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.WITHHELD,
		resolvedDegradationReason: reason,
		anchorClientId: null,
		focusClientId: null,
		renderable: false,
		contentFree: true,
		authoritativeForSave: false,
		claimsSaved: false,
	} );

	if ( ! selectionState?.available ) {
		return unavailable(
			DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.MISSING_ANCHOR
		);
	}

	if (
		selectionState.kind ===
			DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.UNSUPPORTED_SURFACE ||
		selectionState.selectionSourceStatus ===
			DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.UNSUPPORTED_SURFACE
	) {
		return unavailable(
			DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.UNSUPPORTED_SURFACE
		);
	}

	if (
		selectionState.schema !==
		DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA_V2
	) {
		return unavailable(
			DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.STALE_BASE
		);
	}

	const localBaseVersion = normalizeNullableString(
		options.localBaseVersion
	);
	const localBaseStateHash = normalizeSha256Hash(
		options.localBaseStateHash
	);

	if (
		! selectionState.baseVersion ||
		! selectionState.baseStateHash ||
		! localBaseVersion ||
		! localBaseStateHash ||
		selectionState.baseVersion !== localBaseVersion ||
		selectionState.baseStateHash !== localBaseStateHash
	) {
		return unavailable(
			DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.STALE_BASE
		);
	}

	if (
		options.hasRepeatedBlockAmbiguity ||
		( typeof options.isSelectionOrdinalAmbiguous === 'function' &&
			options.isSelectionOrdinalAmbiguous( selectionState ) )
	) {
		return unavailable(
			DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.REPEATED_BLOCK_AMBIGUITY
		);
	}

	const anchor = getDistributedEditingSelectionPresenceResolvedPoint(
		selectionState.anchor,
		options
	);
	const focus = getDistributedEditingSelectionPresenceResolvedPoint(
		selectionState.focus || selectionState.anchor,
		options
	);

	if (
		anchor.status ===
			DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.WITHHELD ||
		focus.status ===
			DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.WITHHELD
	) {
		return unavailable( anchor.reason || focus.reason );
	}

	const hasOffsets =
		selectionState.anchor?.attributeKey &&
		selectionState.focus?.attributeKey &&
		selectionState.anchor?.offset !== null &&
		selectionState.focus?.offset !== null;
	const exactKinds = new Set( [
		DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.CARET,
		DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.RICH_TEXT,
		DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.RANGE,
	] );
	const resolvedMappingStatus =
		hasOffsets && exactKinds.has( selectionState.kind )
			? DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.EXACT
			: DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.BLOCK_ONLY;

	return {
		resolvedMappingStatus,
		resolvedDegradationReason:
			DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.NONE,
		anchorClientId: anchor.clientId,
		focusClientId: focus.clientId,
		renderable: true,
		contentFree: true,
		authoritativeForSave: false,
		claimsSaved: false,
	};
}

function normalizeDistributedEditingPresenceDocumentState( documentState ) {
	const source = normalizeObject( documentState );
	const confirmedBaseVersion = normalizeNullableString(
		getFirstDefined(
			source.confirmedBaseVersion,
			source.confirmed_base_version
		)
	);
	const available =
		normalizeDistributedEditingBooleanValue( source.available ) &&
		Boolean( confirmedBaseVersion );

	if ( ! available ) {
		return {
			available: false,
			confirmedBaseVersion: null,
			confirmedStateHash: null,
			hasPendingChanges: false,
			confirmedAtGmt: null,
			reportedAtGmt: null,
			presenceUpdatedAtGmt: normalizeNullableString(
				getFirstDefined(
					source.presenceUpdatedAtGmt,
					source.presence_updated_at_gmt
				)
			),
			source: 'unavailable',
			authoritativeForSave: false,
			claimsSaved: false,
			exposesRawContent: false,
		};
	}
	const confirmedStateHash = normalizeNullableString(
		getFirstDefined(
			source.confirmedStateHash,
			source.confirmed_state_hash
		)
	);

	return {
		available: true,
		confirmedBaseVersion,
		confirmedStateHash,
		hasPendingChanges: normalizeDistributedEditingBooleanValue(
			getFirstDefined(
				source.hasPendingChanges,
				source.has_pending_changes
			)
		),
		confirmedAtGmt: normalizeNullableString(
			getFirstDefined( source.confirmedAtGmt, source.confirmed_at_gmt )
		),
		reportedAtGmt: normalizeNullableString(
			getFirstDefined( source.reportedAtGmt, source.reported_at_gmt )
		),
		presenceUpdatedAtGmt: normalizeNullableString(
			getFirstDefined(
				source.presenceUpdatedAtGmt,
				source.presence_updated_at_gmt
			)
		),
		source:
			normalizeNullableString( source.source ) ||
			'client_reported_presence',
		authoritativeForSave: false,
		claimsSaved: false,
		exposesRawContent: false,
	};
}

function normalizeDistributedEditingPresencePendingPreviewState(
	pendingPreview
) {
	const source = normalizeObject( pendingPreview );
	const sourceItems = Array.isArray( source.items ) ? source.items : [];
	const items = sourceItems
		.slice( 0, 8 )
		.map( ( item, index ) => {
			const itemSource = normalizeObject( item );
			const changeKind = [
				'added_block',
				'modified_block',
				'deleted_block',
				'unknown_change',
			].includes( itemSource.changeKind )
				? itemSource.changeKind
				: 'unknown_change';
			const blockPath = Array.isArray( itemSource.blockPath )
				? itemSource.blockPath
						.map( ( value ) => Number( value ) )
						.filter(
							( value ) => Number.isInteger( value ) && value >= 0
						)
						.slice( 0, 16 )
				: [ index ];
			const anchorStatus = [
				'exact',
				'ambiguous',
				'unavailable',
			].includes( itemSource.anchorStatus )
				? itemSource.anchorStatus
				: 'exact';
			const previewScope = [
				'leaf_block',
				'sibling_collection',
				'container_block',
			].includes( itemSource.previewScope )
				? itemSource.previewScope
				: 'leaf_block';
			const blockRangeSource = normalizeObject(
				getFirstDefined( itemSource.blockRange, itemSource.block_range )
			);
			const blockRangeStart = Number(
				getFirstDefined(
					blockRangeSource.start,
					blockRangeSource.start_index
				)
			);
			const blockRangeCount = Number( blockRangeSource.count );

			return {
				previewId:
					normalizeNullableString( itemSource.previewId ) ||
					`pending-preview-${ index + 1 }`,
				blockPath,
				blockName:
					normalizeNullableString( itemSource.blockName ) ||
					'core/block',
				changeKind,
				safePreviewText:
					normalizeNullableString( itemSource.safePreviewText ) || '',
				safePreviewSerializedBlocks:
					normalizeNullableString(
						getFirstDefined(
							itemSource.safePreviewSerializedBlocks,
							itemSource.safe_preview_serialized_blocks
						)
					) || '',
				safePreviewHtml:
					normalizeNullableString( itemSource.safePreviewHtml ) || '',
				isPlaceholder: Boolean( itemSource.isPlaceholder ),
				reviewRequired: Boolean( itemSource.reviewRequired ),
				anchorStatus,
				previewScope,
				...( Number.isInteger( blockRangeStart ) &&
				blockRangeStart >= 0 &&
				Number.isInteger( blockRangeCount ) &&
				blockRangeCount > 0
					? {
							blockRange: {
								start: blockRangeStart,
								count: blockRangeCount,
							},
					  }
					: {} ),
				updatedAtGmt: normalizeNullableString(
					getFirstDefined(
						itemSource.updatedAtGmt,
						itemSource.updated_at_gmt
					)
				),
				rawContentIncluded: false,
				exposesRawContent: false,
				inert: true,
			};
		} )
		.filter(
			( item ) =>
				item.changeKind === 'deleted_block' ||
				Boolean(
					item.safePreviewText ||
						item.safePreviewHtml ||
						item.safePreviewSerializedBlocks
				)
		);
	const available =
		normalizeDistributedEditingBooleanValue( source.available ) &&
		items.length > 0;

	return {
		available,
		schema:
			normalizeNullableString( source.schema ) ||
			'de-rtc-pending-preview-v1',
		hasPendingPreview:
			available &&
			normalizeDistributedEditingBooleanValue(
				getFirstDefined(
					source.hasPendingPreview,
					source.has_pending_preview,
					true
				)
			),
		baseVersion: normalizeNullableString(
			getFirstDefined( source.baseVersion, source.base_version )
		),
		baseStateHash: normalizeNullableString(
			getFirstDefined( source.baseStateHash, source.base_state_hash )
		),
		items,
		itemCount: available ? items.length : 0,
		reportedAtGmt: normalizeNullableString(
			getFirstDefined( source.reportedAtGmt, source.reported_at_gmt )
		),
		presenceUpdatedAtGmt: normalizeNullableString(
			getFirstDefined(
				source.presenceUpdatedAtGmt,
				source.presence_updated_at_gmt
			)
		),
		source:
			normalizeNullableString( source.source ) ||
			( available ? 'client_reported_pending_preview' : 'unavailable' ),
		ephemeral: true,
		inert: true,
		authoritativeForSave: false,
		claimsSaved: false,
		rawContentIncluded: false,
		exposesRawContent: false,
	};
}

function normalizeDistributedEditingPresenceRosterEntry( entry, index ) {
	const source = normalizeObject( entry );
	const sourcePermissions = normalizeObject(
		getFirstDefined( source.permissions, source.permission_summary )
	);
	const presenceUpdatedAtGmt = normalizeNullableString(
		getFirstDefined(
			source.presenceUpdatedAtGmt,
			source.presence_updated_at_gmt,
			source.lastSeenGmt,
			source.last_seen_gmt
		)
	);
	const displayName =
		normalizeNullableString(
			getFirstDefined(
				source.displayName,
				source.display_name,
				source.name
			)
		) || null;
	const requestedIdentityVisibility = getFirstDefined(
		source.identityVisibility,
		source.identity_visibility
	);
	let identityVisibility = 'anonymous';

	if (
		[ 'named', 'anonymous', 'self' ].includes( requestedIdentityVisibility )
	) {
		identityVisibility = requestedIdentityVisibility;
	} else if ( displayName ) {
		identityVisibility = 'named';
	}
	const relationship = [
		'other_user',
		'same_user_other_tab',
		'current_user_current_tab',
	].includes( source.relationship )
		? source.relationship
		: 'other_user';
	const requestedFreshness =
		source.freshness === 'active' ? 'current' : source.freshness;
	const freshness = [ 'current', 'recent', 'stale', 'unknown' ].includes(
		requestedFreshness
	)
		? requestedFreshness
		: 'unknown';
	const sessionDurationSeconds = normalizeNonNegativeInteger(
		getFirstDefined(
			source.sessionDurationSeconds,
			source.session_duration_seconds
		)
	);
	const sessionStartedAtGmt = normalizeNullableString(
		getFirstDefined(
			source.sessionStartedAtGmt,
			source.session_started_at_gmt,
			source.createdAtGmt,
			source.created_at_gmt
		)
	);
	const permissionsAvailable = Boolean(
		getFirstDefined(
			source.permissionsAvailable,
			source.permissions_available,
			sourcePermissions.available,
			hasOwnProperty( source, 'permissions' ) ||
				hasOwnProperty( source, 'permission_summary' )
		)
	);
	const selectionState = normalizeDistributedEditingPresenceSelectionState(
		getFirstDefined( source.selectionState, source.selection_state )
	);
	const pendingPreview =
		normalizeDistributedEditingPresencePendingPreviewState(
			getFirstDefined( source.pendingPreview, source.pending_preview )
		);

	return {
		key:
			normalizeNullableString( source.key ) ||
			`presence-editor-${ index + 1 }`,
		displayName,
		avatarUrl: normalizeNullableString(
			getFirstDefined( source.avatarUrl, source.avatar_url )
		),
		identityVisibility,
		relationship,
		activity: normalizeNullableString( source.activity ) || 'editing_post',
		freshness,
		sessionStartedAtGmt,
		sessionDurationSeconds,
		presenceUpdatedAtGmt,
		attributionKey: normalizeNullableString(
			getFirstDefined(
				source.attributionKey,
				source.attribution_key,
				source.authorshipAttributionKey,
				source.authorship_attribution_key
			)
		),
		authorshipFocusAvailable: Boolean(
			getFirstDefined(
				source.authorshipFocusAvailable,
				source.authorship_focus_available,
				source.attributionKey,
				source.attribution_key
			)
		),
		permissionsAvailable,
		permissions: {
			canEdit: Boolean(
				getFirstDefined(
					sourcePermissions.canEdit,
					sourcePermissions.can_edit,
					source.canEdit,
					source.can_edit_post
				)
			),
			canPublish: Boolean(
				getFirstDefined(
					sourcePermissions.canPublish,
					sourcePermissions.can_publish,
					source.canPublish,
					source.can_publish_post
				)
			),
			canSaveDangerousHtml: Boolean(
				getFirstDefined(
					sourcePermissions.canSaveDangerousHtml,
					sourcePermissions.can_save_dangerous_html,
					source.canSaveDangerousHtml,
					source.can_save_dangerous_html
				)
			),
		},
		documentState: normalizeDistributedEditingPresenceDocumentState(
			getFirstDefined( source.documentState, source.document_state )
		),
		selectionState,
		pendingPreview,
		exposesUserId: false,
		exposesCursorOffset: false,
		exposesSelection: false,
		exposesSelectionPresence: selectionState.available,
		exposesPendingPreview: pendingPreview.available,
		exposesRawSelectedText: false,
		exposesRawContent: false,
	};
}

function getDistributedEditingPresenceEntriesForTransientEmptySnapshot(
	entries = []
) {
	return entries.map( ( entry ) => ( {
		...entry,
		freshness: entry.freshness === 'stale' ? 'stale' : 'recent',
	} ) );
}

function normalizeDistributedEditingPresenceRosterFields( sessionState = {} ) {
	let explicitEntries = [];

	if ( Array.isArray( sessionState.presenceRosterEntries ) ) {
		explicitEntries = sessionState.presenceRosterEntries;
	} else if (
		Array.isArray( sessionState.distributedEditingPresenceRoster?.entries )
	) {
		explicitEntries = sessionState.distributedEditingPresenceRoster.entries;
	}
	const entries = explicitEntries
		.map( ( entry, index ) =>
			normalizeDistributedEditingPresenceRosterEntry( entry, index )
		)
		.filter( ( entry ) => entry.key );
	const remoteChangeCount = normalizeCount( sessionState.remoteChangeCount );
	const hasDerivedRemoteActivity = Boolean(
		sessionState.hasRemoteChanges ||
			remoteChangeCount > 0 ||
			sessionState.actionTranscriptHasRemoteEvents
	);
	const derivedEntries =
		entries.length === 0 && hasDerivedRemoteActivity
			? [
					normalizeDistributedEditingPresenceRosterEntry(
						{
							key: 'presence-remote-activity',
							identityVisibility: 'anonymous',
							freshness: sessionState.isConnectionDegraded
								? 'stale'
								: 'recent',
						},
						0
					),
			  ]
			: [];
	const rosterEntries = entries.length > 0 ? entries : derivedEntries;
	const explicitStatus = getFirstDefined(
		sessionState.presenceRosterStatus,
		sessionState.distributedEditingPresenceRoster?.status
	);
	let status = VALID_DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.has(
		explicitStatus
	)
		? explicitStatus
		: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.HIDDEN;

	if ( sessionState.isConnectionDegraded && rosterEntries.length > 0 ) {
		status = DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.DEGRADED;
	} else if (
		rosterEntries.some( ( entry ) => entry.freshness === 'stale' )
	) {
		status = DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.STALE;
	} else if (
		rosterEntries.some( ( entry ) => entry.freshness === 'recent' )
	) {
		status = DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT;
	} else if ( rosterEntries.length > 0 ) {
		status = DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE;
	} else if (
		explicitStatus === DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.EMPTY
	) {
		status = DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.EMPTY;
	}

	let presenceRosterFreshness = 'unknown';

	if ( status === DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE ) {
		presenceRosterFreshness = 'current';
	} else if (
		status === DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT
	) {
		presenceRosterFreshness = 'recent';
	} else if (
		status === DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.STALE ||
		status === DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.DEGRADED
	) {
		presenceRosterFreshness = 'stale';
	}

	return {
		presenceRosterStatus: status,
		presenceRosterEntries: rosterEntries,
		presenceRosterFreshness,
		presenceRosterServerContact: sessionState.isConnectionDegraded
			? 'degraded'
			: 'nominal',
		presenceRosterVisibleCount: rosterEntries.length,
		presenceRosterTotalKnownCount: normalizeCountWithFallback(
			getFirstDefined(
				sessionState.presenceRosterTotalKnownCount,
				sessionState.distributedEditingPresenceRoster?.totalKnownCount
			),
			rosterEntries.length
		),
		presenceRosterHiddenCount: normalizeCount(
			getFirstDefined(
				sessionState.presenceRosterHiddenCount,
				sessionState.distributedEditingPresenceRoster?.hiddenCount
			)
		),
		presenceRosterExpiredCount: normalizeCount(
			getFirstDefined(
				sessionState.presenceRosterExpiredCount,
				sessionState.distributedEditingPresenceRoster?.expiredCount,
				sessionState.distributedEditingPresenceRoster?.expired_count
			)
		),
		presenceRosterExpiredEvidenceCarriedForward: Boolean(
			getFirstDefined(
				sessionState.presenceRosterExpiredEvidenceCarriedForward,
				sessionState.distributedEditingPresenceRoster
					?.expiredEvidenceCarriedForward
			)
		),
		presenceRosterEmptySnapshotPreservedEntries: Boolean(
			getFirstDefined(
				sessionState.presenceRosterEmptySnapshotPreservedEntries,
				sessionState.distributedEditingPresenceRoster
					?.emptySnapshotPreservedEntries
			)
		),
	};
}

function normalizeDistributedEditingPresenceRefreshFields( sessionState = {} ) {
	const requestedStatus = getFirstDefined(
		sessionState.presenceRosterRefreshStatus,
		sessionState.distributedEditingPresenceRefresh?.status
	);
	const status = VALID_DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.has(
		requestedStatus
	)
		? requestedStatus
		: DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.NONE;

	return {
		presenceRosterRefreshStatus: status,
		presenceRosterRefreshReason: normalizeNullableString(
			getFirstDefined(
				sessionState.presenceRosterRefreshReason,
				sessionState.distributedEditingPresenceRefresh?.reason
			)
		),
		presenceRosterRefreshResult: normalizeNullableString(
			getFirstDefined(
				sessionState.presenceRosterRefreshResult,
				sessionState.distributedEditingPresenceRefresh?.result
			)
		),
		presenceRosterRefreshRequested: Boolean(
			getFirstDefined(
				sessionState.presenceRosterRefreshRequested,
				sessionState.distributedEditingPresenceRefresh?.requested
			)
		),
		presenceRosterRefreshSucceeded:
			status === DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED,
		presenceRosterRefreshFailed: [
			DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.FEATURE_DISABLED,
			DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.PERMISSION_DENIED,
			DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.ROUTE_MISMATCH,
			DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.FAILED,
		].includes( status ),
		presenceRosterRefreshCallsRestEndpoint: Boolean(
			sessionState.presenceRosterRefreshCallsRestEndpoint
		),
		presenceRosterRefreshCallsSave: Boolean(
			sessionState.presenceRosterRefreshCallsSave
		),
		presenceRosterRefreshMutatesEditorContent: Boolean(
			sessionState.presenceRosterRefreshMutatesEditorContent
		),
		presenceRosterRefreshMutatesPersistedPostContent: Boolean(
			sessionState.presenceRosterRefreshMutatesPersistedPostContent
		),
		presenceRosterRefreshChangesPostLock: Boolean(
			sessionState.presenceRosterRefreshChangesPostLock
		),
		presenceRosterRefreshRecordsPresenceHeartbeat: Boolean(
			sessionState.presenceRosterRefreshRecordsPresenceHeartbeat
		),
		presenceRosterRefreshEnablesRepeatedClientRefresh: Boolean(
			sessionState.presenceRosterRefreshEnablesRepeatedClientRefresh
		),
		presenceRosterRefreshClaimsSaved: Boolean(
			sessionState.presenceRosterRefreshClaimsSaved
		),
		presenceRosterRefreshExposesRawContent: Boolean(
			sessionState.presenceRosterRefreshExposesRawContent
		),
		presenceRosterRefreshExposesUserIds: Boolean(
			sessionState.presenceRosterRefreshExposesUserIds
		),
		presenceRosterRefreshExposesCursorOffset: Boolean(
			sessionState.presenceRosterRefreshExposesCursorOffset
		),
		presenceRosterRefreshExposesSelection: Boolean(
			sessionState.presenceRosterRefreshExposesSelection
		),
		presenceRosterReadContractSource: normalizeNullableString(
			sessionState.presenceRosterReadContractSource
		),
		presenceRosterReadContractRoute: normalizeNullableString(
			sessionState.presenceRosterReadContractRoute
		),
		presenceRosterReadSuggestedPollingIntervalSeconds:
			normalizeNullableInteger(
				sessionState.presenceRosterReadSuggestedPollingIntervalSeconds
			),
		presenceRosterReadCheapHostPollingIntervalSeconds:
			normalizeNullableInteger(
				sessionState.presenceRosterReadCheapHostPollingIntervalSeconds
			),
		presenceRosterReadRepeatedClientRefreshEnabled: Boolean(
			sessionState.presenceRosterReadRepeatedClientRefreshEnabled
		),
	};
}

function normalizeDistributedEditingPresenceHeartbeatFields(
	sessionState = {}
) {
	const requestedStatus = getFirstDefined(
		sessionState.presenceHeartbeatStatus,
		sessionState.distributedEditingPresenceHeartbeat?.status
	);
	const status = VALID_DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.has(
		requestedStatus
	)
		? requestedStatus
		: DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.NONE;

	return {
		presenceHeartbeatStatus: status,
		presenceHeartbeatReason: normalizeNullableString(
			getFirstDefined(
				sessionState.presenceHeartbeatReason,
				sessionState.distributedEditingPresenceHeartbeat?.reason
			)
		),
		presenceHeartbeatResult: normalizeNullableString(
			getFirstDefined(
				sessionState.presenceHeartbeatResult,
				sessionState.distributedEditingPresenceHeartbeat?.result
			)
		),
		presenceHeartbeatRequested: Boolean(
			getFirstDefined(
				sessionState.presenceHeartbeatRequested,
				sessionState.distributedEditingPresenceHeartbeat?.requested
			)
		),
		presenceHeartbeatSucceeded:
			status === DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT,
		presenceHeartbeatFailed: [
			DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.STORAGE_UNAVAILABLE,
			DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.FEATURE_DISABLED,
			DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.PERMISSION_DENIED,
			DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.ROUTE_MISMATCH,
			DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.FAILED,
		].includes( status ),
		presenceHeartbeatCallsRestEndpoint: Boolean(
			sessionState.presenceHeartbeatCallsRestEndpoint
		),
		presenceHeartbeatRecordsPresenceHeartbeat: Boolean(
			sessionState.presenceHeartbeatRecordsPresenceHeartbeat
		),
		presenceHeartbeatWritesPresence: Boolean(
			sessionState.presenceHeartbeatWritesPresence
		),
		presenceHeartbeatCallsSave: Boolean(
			sessionState.presenceHeartbeatCallsSave
		),
		presenceHeartbeatMutatesEditorContent: Boolean(
			sessionState.presenceHeartbeatMutatesEditorContent
		),
		presenceHeartbeatMutatesPersistedPostContent: Boolean(
			sessionState.presenceHeartbeatMutatesPersistedPostContent
		),
		presenceHeartbeatChangesPostLock: Boolean(
			sessionState.presenceHeartbeatChangesPostLock
		),
		presenceHeartbeatClaimsSaved: Boolean(
			sessionState.presenceHeartbeatClaimsSaved
		),
		presenceHeartbeatEnablesRepeatedClientRefresh: Boolean(
			sessionState.presenceHeartbeatEnablesRepeatedClientRefresh
		),
		presenceHeartbeatRuntimePollingEnabled: Boolean(
			sessionState.presenceHeartbeatRuntimePollingEnabled
		),
		presenceHeartbeatExposesRawContent: Boolean(
			sessionState.presenceHeartbeatExposesRawContent
		),
		presenceHeartbeatExposesUserIds: Boolean(
			sessionState.presenceHeartbeatExposesUserIds
		),
		presenceHeartbeatExposesCursorOffset: Boolean(
			sessionState.presenceHeartbeatExposesCursorOffset
		),
		presenceHeartbeatExposesSelection: Boolean(
			sessionState.presenceHeartbeatExposesSelection
		),
		presenceHeartbeatRawSessionKeyIncluded: Boolean(
			sessionState.presenceHeartbeatRawSessionKeyIncluded
		),
		presenceHeartbeatMarksLocalEditorCurrent: Boolean(
			sessionState.presenceHeartbeatMarksLocalEditorCurrent
		),
		presenceHeartbeatMarksLocalEditorDelayed: Boolean(
			sessionState.presenceHeartbeatMarksLocalEditorDelayed
		),
		presenceHeartbeatLocalRosterEntryVisible: Boolean(
			sessionState.presenceHeartbeatLocalRosterEntryVisible
		),
		presenceHeartbeatLocalRosterEntryFreshness: normalizeNullableString(
			sessionState.presenceHeartbeatLocalRosterEntryFreshness
		),
		presenceHeartbeatRepeatedRefreshOptional: Boolean(
			getFirstDefined(
				sessionState.presenceHeartbeatRepeatedRefreshOptional,
				sessionState.distributedEditingPresenceHeartbeat
					?.repeatedRefreshOptional,
				true
			)
		),
		presenceHeartbeatSuggestedIntervalSeconds: normalizeNullableInteger(
			getFirstDefined(
				sessionState.presenceHeartbeatSuggestedIntervalSeconds,
				sessionState.distributedEditingPresenceHeartbeat
					?.suggestedIntervalSeconds
			)
		),
		presenceHeartbeatCheapHostIntervalSeconds: normalizeNullableInteger(
			getFirstDefined(
				sessionState.presenceHeartbeatCheapHostIntervalSeconds,
				sessionState.distributedEditingPresenceHeartbeat
					?.cheapHostIntervalSeconds
			)
		),
		presenceDocumentStateConfirmedBaseVersion: normalizeNullableString(
			sessionState.presenceDocumentStateConfirmedBaseVersion
		),
		presenceDocumentStateConfirmedStateHash: normalizeNullableString(
			sessionState.presenceDocumentStateConfirmedStateHash
		),
		presenceDocumentStateConfirmedAtGmt: normalizeNullableString(
			sessionState.presenceDocumentStateConfirmedAtGmt
		),
		presenceDocumentStatePublishedKey: normalizeNullableString(
			sessionState.presenceDocumentStatePublishedKey
		),
	};
}

function normalizeDistributedEditingPresenceStorageReadinessRecheckFields(
	sessionState = {}
) {
	const readiness = normalizeObject(
		sessionState.presenceStorageReadinessRecheckResult
	);
	const requestedStatus = getFirstDefined(
		sessionState.presenceStorageReadinessRecheckStatus,
		readiness.status
	);
	const status =
		VALID_DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.has(
			requestedStatus
		)
			? requestedStatus
			: DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.NONE;
	const failed = [
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.FEATURE_DISABLED,
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.PERMISSION_DENIED,
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.ROUTE_MISMATCH,
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.FAILED,
	].includes( status );
	const succeeded = [
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.READY,
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.SETUP_REQUIRED,
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.UPGRADE_REQUIRED,
	].includes( status );

	return {
		presenceStorageReadinessRecheckStatus: status,
		presenceStorageReadinessRecheckReason: normalizeNullableString(
			sessionState.presenceStorageReadinessRecheckReason
		),
		presenceStorageReadinessRecheckResult:
			Object.keys( readiness ).length > 0 ? readiness : null,
		presenceStorageReadinessRecheckRequested: Boolean(
			sessionState.presenceStorageReadinessRecheckRequested
		),
		presenceStorageReadinessRecheckSucceeded: succeeded,
		presenceStorageReadinessRecheckFailed: failed,
		presenceStorageReadinessRecheckCallsRestEndpoint: Boolean(
			sessionState.presenceStorageReadinessRecheckCallsRestEndpoint
		),
		presenceStorageReadinessRecheckInstallsPresenceTable: Boolean(
			sessionState.presenceStorageReadinessRecheckInstallsPresenceTable
		),
		presenceStorageReadinessRecheckRecordsPresenceHeartbeat: Boolean(
			sessionState.presenceStorageReadinessRecheckRecordsPresenceHeartbeat
		),
		presenceStorageReadinessRecheckWritesPresence: Boolean(
			sessionState.presenceStorageReadinessRecheckWritesPresence
		),
		presenceStorageReadinessRecheckStartsPolling: Boolean(
			sessionState.presenceStorageReadinessRecheckStartsPolling
		),
		presenceStorageReadinessRecheckCallsSave: Boolean(
			sessionState.presenceStorageReadinessRecheckCallsSave
		),
		presenceStorageReadinessRecheckMutatesEditorContent: Boolean(
			sessionState.presenceStorageReadinessRecheckMutatesEditorContent
		),
		presenceStorageReadinessRecheckMutatesPersistedPostContent: Boolean(
			sessionState.presenceStorageReadinessRecheckMutatesPersistedPostContent
		),
		presenceStorageReadinessRecheckChangesPostLock: Boolean(
			sessionState.presenceStorageReadinessRecheckChangesPostLock
		),
		presenceStorageReadinessRecheckClaimsAbsence: Boolean(
			sessionState.presenceStorageReadinessRecheckClaimsAbsence
		),
		presenceStorageReadinessRecheckClaimsSaved: Boolean(
			sessionState.presenceStorageReadinessRecheckClaimsSaved
		),
		presenceStorageReadinessRecheckContentFree:
			sessionState.presenceStorageReadinessRecheckContentFree !== false,
		presenceStorageReadinessRecheckExposesRawContent: Boolean(
			sessionState.presenceStorageReadinessRecheckExposesRawContent
		),
		presenceStorageReadinessRecheckExposesUserIds: Boolean(
			sessionState.presenceStorageReadinessRecheckExposesUserIds
		),
		presenceStorageReadinessRecheckExposesCursorOffset: Boolean(
			sessionState.presenceStorageReadinessRecheckExposesCursorOffset
		),
		presenceStorageReadinessRecheckExposesSelection: Boolean(
			sessionState.presenceStorageReadinessRecheckExposesSelection
		),
		presenceStorageReadinessRecheckCorrectnessIndependentOfTransport:
			sessionState.presenceStorageReadinessRecheckCorrectnessIndependentOfTransport !==
			false,
		presenceStorageReadinessRecheckTransportRequiredForCorrectness: Boolean(
			sessionState.presenceStorageReadinessRecheckTransportRequiredForCorrectness
		),
	};
}

function normalizeDistributedEditingPresenceRepeatedRefreshRuntimeFields(
	sessionState = {}
) {
	const runtimeConfig = normalizeObject(
		sessionState.distributedEditingPresenceRepeatedRefreshRuntime
	);
	const hasRuntimeConfig = Object.keys( runtimeConfig ).length > 0;
	const hostProfile = normalizeNullableString(
		getFirstDefined(
			runtimeConfig.hostProfile,
			runtimeConfig.host_profile,
			sessionState.presenceRepeatedRefreshHostProfile
		)
	);
	const explicitOptIn = Boolean(
		getFirstDefined(
			runtimeConfig.explicitOptIn,
			runtimeConfig.explicit_opt_in,
			sessionState.presenceRepeatedRefreshExplicitOptIn
		)
	);
	const requestedServerContact = normalizeNullableString(
		getFirstDefined(
			runtimeConfig.serverContact,
			runtimeConfig.server_contact,
			sessionState.presenceRepeatedRefreshServerContact
		)
	);
	const degradedTransport = Boolean(
		getFirstDefined(
			runtimeConfig.degradedTransport,
			runtimeConfig.degraded_transport,
			sessionState.presenceRepeatedRefreshDegradedTransport,
			requestedServerContact === 'degraded' ||
				requestedServerContact === 'offline' ||
				sessionState.isConnectionDegraded
		)
	);
	const serverContact = degradedTransport ? 'degraded' : 'nominal';
	const standardIntervalSeconds = normalizeNullableInteger(
		getFirstDefined(
			runtimeConfig.standardIntervalSeconds,
			runtimeConfig.standardPollingIntervalSeconds,
			runtimeConfig.standard_polling_interval_seconds,
			sessionState.presenceRepeatedRefreshStandardIntervalSeconds,
			sessionState.presenceRosterReadSuggestedPollingIntervalSeconds
		)
	);
	const cheapHostIntervalSeconds = normalizeNullableInteger(
		getFirstDefined(
			runtimeConfig.cheapHostIntervalSeconds,
			runtimeConfig.cheapHostPollingIntervalSeconds,
			runtimeConfig.cheap_host_polling_interval_seconds,
			sessionState.presenceRepeatedRefreshCheapHostIntervalSeconds,
			sessionState.presenceRosterReadCheapHostPollingIntervalSeconds,
			sessionState.presenceHeartbeatCheapHostIntervalSeconds
		)
	);
	const minimumIntervalSeconds = normalizeNullableInteger(
		getFirstDefined(
			runtimeConfig.minimumIntervalSeconds,
			runtimeConfig.minimumPollingIntervalSeconds,
			runtimeConfig.minimum_polling_interval_seconds,
			sessionState.presenceRepeatedRefreshMinimumIntervalSeconds
		)
	);
	let fallbackRefreshIntervalSeconds =
		standardIntervalSeconds || cheapHostIntervalSeconds;

	if ( hostProfile === 'cheap_shared_host' ) {
		fallbackRefreshIntervalSeconds =
			cheapHostIntervalSeconds || standardIntervalSeconds;
	} else if ( hostProfile === 'local_development' ) {
		fallbackRefreshIntervalSeconds =
			minimumIntervalSeconds ||
			cheapHostIntervalSeconds ||
			standardIntervalSeconds;
	}
	const selectedIntervalSeconds =
		normalizeNullableInteger(
			getFirstDefined(
				runtimeConfig.selectedIntervalSeconds,
				runtimeConfig.selectedRefreshIntervalSeconds,
				runtimeConfig.selectedPollingIntervalSeconds,
				runtimeConfig.selected_refresh_interval_seconds,
				runtimeConfig.selected_polling_interval_seconds,
				hasRuntimeConfig
					? undefined
					: sessionState.presenceRepeatedRefreshSelectedIntervalSeconds
			)
		) || fallbackRefreshIntervalSeconds;
	const selectedHeartbeatIntervalSeconds =
		normalizeNullableInteger(
			getFirstDefined(
				runtimeConfig.selectedHeartbeatIntervalSeconds,
				runtimeConfig.selected_heartbeat_interval_seconds,
				runtimeConfig.heartbeatIntervalSeconds,
				runtimeConfig.heartbeat_interval_seconds,
				sessionState.presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds,
				sessionState.presenceHeartbeatSuggestedIntervalSeconds
			)
		) || selectedIntervalSeconds;
	const requestedStatus = getFirstDefined(
		runtimeConfig.status,
		sessionState.presenceRepeatedRefreshRuntimeStatus
	);
	let status =
		VALID_DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.has(
			requestedStatus
		)
			? requestedStatus
			: DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.DISABLED_BY_DEFAULT;

	if ( ! explicitOptIn ) {
		status =
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.DISABLED_BY_DEFAULT;
	} else if ( degradedTransport ) {
		status =
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT;
	} else {
		status =
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED;
	}

	const requestedConnectionState = getFirstDefined(
		runtimeConfig.localConnectionState,
		runtimeConfig.local_connection_state,
		sessionState.presenceRepeatedRefreshLocalConnectionState
	);
	let localConnectionState =
		VALID_DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.has(
			requestedConnectionState
		)
			? requestedConnectionState
			: DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DISABLED;

	if ( ! explicitOptIn ) {
		localConnectionState =
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DISABLED;
	} else if ( degradedTransport ) {
		localConnectionState =
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DEGRADED;
	} else {
		localConnectionState =
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.CONNECTED;
	}

	const schedulesNextRefresh =
		explicitOptIn &&
		! degradedTransport &&
		status ===
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED;
	const schedulesNextHeartbeat =
		schedulesNextRefresh && selectedHeartbeatIntervalSeconds !== null;

	return {
		presenceRepeatedRefreshRuntimeStatus: status,
		presenceRepeatedRefreshLocalConnectionState: localConnectionState,
		presenceRepeatedRefreshRequiresExplicitOptIn: true,
		presenceRepeatedRefreshRuntimeEnabledByDefault: false,
		presenceRepeatedRefreshExplicitOptIn: explicitOptIn,
		presenceRepeatedRefreshHostProfile: hostProfile,
		presenceRepeatedRefreshServerContact: serverContact,
		presenceRepeatedRefreshSelectedIntervalSeconds: selectedIntervalSeconds,
		presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds:
			selectedHeartbeatIntervalSeconds,
		presenceRepeatedRefreshStandardIntervalSeconds: standardIntervalSeconds,
		presenceRepeatedRefreshCheapHostIntervalSeconds:
			cheapHostIntervalSeconds,
		presenceRepeatedRefreshMinimumIntervalSeconds: minimumIntervalSeconds,
		presenceRepeatedRefreshSchedulesNextRefresh: schedulesNextRefresh,
		presenceRepeatedRefreshSchedulesNextHeartbeat: schedulesNextHeartbeat,
		presenceRepeatedRefreshCallsPresenceReadEndpointNow: false,
		presenceRepeatedRefreshCallsHeartbeatEndpointNow: false,
		presenceRepeatedRefreshRecordsPresenceHeartbeatNow: false,
		presenceRepeatedRefreshWritesHeartbeatNow: false,
		presenceRepeatedRefreshStartsPollingImmediately: false,
		presenceRepeatedRefreshPausesOnDegradedTransport: true,
		presenceRepeatedRefreshExposesLocalConnectionState: true,
		presenceRepeatedRefreshOptional: true,
		presenceRepeatedRefreshCorrectnessIndependentOfTransport: true,
		presenceRepeatedRefreshTransportRequiredForCorrectness: false,
		presenceRepeatedRefreshDispatchesNotice: false,
		presenceRepeatedRefreshCallsSave: false,
		presenceRepeatedRefreshMutatesEditorContent: false,
		presenceRepeatedRefreshMutatesPersistedPostContent: false,
		presenceRepeatedRefreshChangesPostLock: false,
		presenceRepeatedRefreshClaimsAbsence: false,
		presenceRepeatedRefreshClaimsSaved: false,
		presenceRepeatedRefreshExposesRawContent: false,
		presenceRepeatedRefreshExposesUserIds: false,
		presenceRepeatedRefreshExposesLogins: false,
		presenceRepeatedRefreshExposesEmail: false,
		presenceRepeatedRefreshExposesCursorOffset: false,
		presenceRepeatedRefreshExposesSelection: false,
		presenceRepeatedRefreshRawSessionKeyIncluded: false,
	};
}

function normalizeDistributedEditingPresenceStartupPolicyFields(
	sessionState = {}
) {
	const policyConfig = normalizeObject(
		sessionState.distributedEditingPresenceStartupPolicy
	);
	const repeatedRefreshFields =
		normalizeDistributedEditingPresenceRepeatedRefreshRuntimeFields(
			sessionState
		);
	const hostProfile = normalizeNullableString(
		getFirstDefined(
			policyConfig.hostProfile,
			policyConfig.host_profile,
			sessionState.presenceStartupPolicyHostProfile,
			repeatedRefreshFields.presenceRepeatedRefreshHostProfile
		)
	);
	const requestedServerContact = normalizeNullableString(
		getFirstDefined(
			policyConfig.serverContact,
			policyConfig.server_contact,
			sessionState.presenceStartupPolicyServerContact,
			repeatedRefreshFields.presenceRepeatedRefreshServerContact
		)
	);
	const degradedTransport = Boolean(
		getFirstDefined(
			policyConfig.degradedTransport,
			policyConfig.degraded_transport,
			sessionState.presenceStartupPolicyDegradedTransport,
			requestedServerContact === 'degraded' ||
				requestedServerContact === 'offline' ||
				sessionState.isConnectionDegraded
		)
	);
	const serverContact = degradedTransport ? 'degraded' : 'nominal';
	const allowAutomaticInitialHeartbeat = Boolean(
		getFirstDefined(
			policyConfig.allowAutomaticInitialHeartbeat,
			policyConfig.allow_automatic_initial_heartbeat,
			policyConfig.automaticInitialHeartbeatAllowed,
			sessionState.presenceStartupPolicyMaySendInitialHeartbeatAutomatically
		)
	);
	const allowSlowAutomaticInitialHeartbeat = Boolean(
		getFirstDefined(
			policyConfig.allowSlowAutomaticInitialHeartbeat,
			policyConfig.allow_slow_automatic_initial_heartbeat,
			policyConfig.slowAutomaticHeartbeatAllowed,
			sessionState.presenceStartupPolicySlowAutomaticHeartbeatAllowed
		)
	);
	const standardInitialHeartbeatDelaySeconds = normalizeNullableInteger(
		getFirstDefined(
			policyConfig.standardInitialHeartbeatDelaySeconds,
			policyConfig.standard_initial_heartbeat_delay_seconds,
			sessionState.presenceStartupPolicyStandardInitialHeartbeatDelaySeconds,
			repeatedRefreshFields.presenceRepeatedRefreshStandardIntervalSeconds
		)
	);
	const cheapHostInitialHeartbeatDelaySeconds = normalizeNullableInteger(
		getFirstDefined(
			policyConfig.cheapHostInitialHeartbeatDelaySeconds,
			policyConfig.cheap_host_initial_heartbeat_delay_seconds,
			sessionState.presenceStartupPolicyCheapHostInitialHeartbeatDelaySeconds,
			repeatedRefreshFields.presenceRepeatedRefreshCheapHostIntervalSeconds
		)
	);
	const minimumInitialHeartbeatDelaySeconds = normalizeNullableInteger(
		getFirstDefined(
			policyConfig.minimumInitialHeartbeatDelaySeconds,
			policyConfig.minimum_initial_heartbeat_delay_seconds,
			sessionState.presenceStartupPolicyMinimumInitialHeartbeatDelaySeconds,
			repeatedRefreshFields.presenceRepeatedRefreshMinimumIntervalSeconds
		)
	);
	const requestedSelectedInitialHeartbeatDelaySeconds =
		normalizeNullableInteger(
			getFirstDefined(
				policyConfig.selectedInitialHeartbeatDelaySeconds,
				policyConfig.selected_initial_heartbeat_delay_seconds,
				sessionState.presenceStartupPolicySelectedInitialHeartbeatDelaySeconds
			)
		);
	const requestedStatus = getFirstDefined(
		policyConfig.status,
		sessionState.presenceStartupPolicyStatus
	);
	let status = VALID_DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.has(
		requestedStatus
	)
		? requestedStatus
		: DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.MANUAL_REQUIRED;
	let reason = 'manual_startup_required';
	let selectedInitialHeartbeatDelaySeconds = null;
	let maySendInitialHeartbeatAutomatically = false;
	let slowAutomaticHeartbeatAllowed = false;

	if ( degradedTransport ) {
		status =
			DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.PAUSED_DEGRADED_TRANSPORT;
		reason = 'transport_degraded';
	} else if ( hostProfile === 'cheap_shared_host' ) {
		if (
			allowAutomaticInitialHeartbeat &&
			allowSlowAutomaticInitialHeartbeat
		) {
			status =
				DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED;
			reason = 'cheap_host_slow_startup_allowed';
			selectedInitialHeartbeatDelaySeconds = Math.max(
				requestedSelectedInitialHeartbeatDelaySeconds || 0,
				cheapHostInitialHeartbeatDelaySeconds || 0,
				minimumInitialHeartbeatDelaySeconds || 0
			);
			maySendInitialHeartbeatAutomatically = true;
			slowAutomaticHeartbeatAllowed = true;
		} else {
			status =
				DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.MANUAL_REQUIRED;
			reason = 'cheap_host_requires_slow_startup';
		}
	} else if ( allowAutomaticInitialHeartbeat ) {
		status =
			DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.AUTOMATIC_HEARTBEAT_ALLOWED;
		reason = 'automatic_startup_explicitly_allowed';
		selectedInitialHeartbeatDelaySeconds = Math.max(
			requestedSelectedInitialHeartbeatDelaySeconds || 0,
			standardInitialHeartbeatDelaySeconds || 0,
			minimumInitialHeartbeatDelaySeconds || 0
		);
		maySendInitialHeartbeatAutomatically = true;
	} else {
		status =
			DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.MANUAL_REQUIRED;
	}

	if ( selectedInitialHeartbeatDelaySeconds === 0 ) {
		selectedInitialHeartbeatDelaySeconds = null;
	}

	return {
		presenceStartupPolicyStatus: status,
		presenceStartupPolicyReason: reason,
		presenceStartupPolicyRequiresExplicitEnablement: true,
		presenceStartupPolicyMaySendInitialHeartbeatAutomatically:
			maySendInitialHeartbeatAutomatically,
		presenceStartupPolicySlowAutomaticHeartbeatAllowed:
			slowAutomaticHeartbeatAllowed,
		presenceStartupPolicyManualHeartbeatAvailable: true,
		presenceStartupPolicyHostProfile: hostProfile,
		presenceStartupPolicyServerContact: serverContact,
		presenceStartupPolicySelectedInitialHeartbeatDelaySeconds:
			selectedInitialHeartbeatDelaySeconds,
		presenceStartupPolicyStandardInitialHeartbeatDelaySeconds:
			standardInitialHeartbeatDelaySeconds,
		presenceStartupPolicyCheapHostInitialHeartbeatDelaySeconds:
			cheapHostInitialHeartbeatDelaySeconds,
		presenceStartupPolicyMinimumInitialHeartbeatDelaySeconds:
			minimumInitialHeartbeatDelaySeconds,
		presenceStartupPolicyCallsHeartbeatEndpointNow: false,
		presenceStartupPolicyRecordsPresenceHeartbeatNow: false,
		presenceStartupPolicyWritesPresenceNow: false,
		presenceStartupPolicyStartsPollingNow: false,
		presenceStartupPolicyStartsTimerNow: false,
		presenceStartupPolicyDispatchesNotice: false,
		presenceStartupPolicyCallsSave: false,
		presenceStartupPolicyMutatesEditorContent: false,
		presenceStartupPolicyMutatesPersistedPostContent: false,
		presenceStartupPolicyChangesPostLock: false,
		presenceStartupPolicyClaimsAbsence: false,
		presenceStartupPolicyClaimsSaved: false,
		presenceStartupPolicyExposesRawContent: false,
		presenceStartupPolicyExposesUserIds: false,
		presenceStartupPolicyExposesLogins: false,
		presenceStartupPolicyExposesEmail: false,
		presenceStartupPolicyExposesCursorOffset: false,
		presenceStartupPolicyExposesSelection: false,
		presenceStartupPolicyRawSessionKeyIncluded: false,
		presenceStartupPolicyCorrectnessIndependentOfTransport: true,
		presenceStartupPolicyTransportRequiredForCorrectness: false,
	};
}

export function getDistributedEditingPresenceRosterStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const entries = normalized.presenceRosterEntries;
	const currentVisibleCount = entries.filter(
		isDistributedEditingPresenceRosterEntryCurrent
	).length;
	const delayedVisibleCount = entries.length - currentVisibleCount;
	const localCurrentTabVisible = entries.some(
		isDistributedEditingLocalHeartbeatRosterEntry
	);
	const sameUserOtherTabVisible = entries.some(
		isDistributedEditingSameUserOtherTabRosterEntry
	);
	const remoteEntries = entries.filter(
		( entry ) =>
			! isDistributedEditingLocalHeartbeatRosterEntry( entry ) &&
			! isDistributedEditingSameUserOtherTabRosterEntry( entry )
	);
	const remoteCurrentVisibleCount = remoteEntries.filter(
		isDistributedEditingPresenceRosterEntryCurrent
	).length;
	const remoteDelayedVisibleCount =
		remoteEntries.length - remoteCurrentVisibleCount;
	const otherEditorActivityCue =
		getDistributedEditingPresenceRosterOtherEditorActivityCue( {
			remoteCurrentVisibleCount,
			remoteDelayedVisibleCount,
		} );
	const otherEditorActivityCueTone =
		getDistributedEditingPresenceRosterOtherEditorActivityCueTone( {
			remoteCurrentVisibleCount,
			remoteDelayedVisibleCount,
		} );
	const countSummary = getDistributedEditingPresenceRosterCountSummary( {
		currentVisibleCount,
		delayedVisibleCount,
		hiddenCount: normalized.presenceRosterHiddenCount,
		expiredCount: normalized.presenceRosterExpiredCount,
	} );
	const remoteCurrentNames = remoteEntries
		.filter( isDistributedEditingPresenceRosterEntryCurrent )
		.map( getDistributedEditingPresenceRosterVisibleName )
		.filter( Boolean );
	const remoteDelayedNames = remoteEntries
		.filter(
			( entry ) =>
				! isDistributedEditingPresenceRosterEntryCurrent( entry )
		)
		.map( getDistributedEditingPresenceRosterVisibleName )
		.filter( Boolean );
	let summary = getDistributedEditingPresenceRosterSummary( {
		entries,
		status: normalized.presenceRosterStatus,
		expiredCount: normalized.presenceRosterExpiredCount,
		localCurrentTabVisible,
		sameUserOtherTabVisible,
		remoteCurrentNames,
		remoteDelayedNames,
	} );

	if (
		normalized.presenceRosterStatus ===
			DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.DEGRADED &&
		entries.length > 0
	) {
		summary = 'Presence may be delayed. Save checks still use WordPress.';
	}

	const refreshHint =
		summary === 'No other editors shown.' &&
		countSummary === 'Editor activity has not been shown yet.'
			? 'Use Refresh editing list to check again.'
			: '';

	return {
		status: normalized.presenceRosterStatus,
		freshness: normalized.presenceRosterFreshness,
		serverContact: normalized.presenceRosterServerContact,
		visibleCount: normalized.presenceRosterVisibleCount,
		currentVisibleCount,
		delayedVisibleCount,
		localCurrentTabVisible,
		sameUserOtherTabVisible,
		remoteVisibleCount: remoteEntries.length,
		remoteCurrentVisibleCount,
		remoteDelayedVisibleCount,
		totalKnownCount: normalized.presenceRosterTotalKnownCount,
		hiddenCount: normalized.presenceRosterHiddenCount,
		expiredCount: normalized.presenceRosterExpiredCount,
		entries,
		copy: {
			label: 'Editing now',
			summary,
			countSummary,
			refreshHint,
			otherEditorActivityCue,
			otherEditorActivityCueTone,
			assistiveSummary:
				normalized.presenceRosterStatus ===
					DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.EMPTY ||
				summary.includes( 'Presence may be delayed.' )
					? summary
					: `${ summary } Presence may be delayed.`,
		},
		descriptorOnly: true,
		exposesRawContent: false,
		exposesSelection: false,
		exposesSelectionPresence: entries.some(
			( entry ) => entry.selectionState?.available
		),
		exposesRawSelectedText: false,
		exposesCursorOffset: false,
		exposesUserIds: false,
		claimsAbsence: false,
		blocksPublish: false,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function getDistributedEditingPresenceRosterOtherEditorActivityCueTone( {
	remoteCurrentVisibleCount,
	remoteDelayedVisibleCount,
} ) {
	if ( remoteCurrentVisibleCount > 0 ) {
		return 'current';
	}

	if ( remoteDelayedVisibleCount > 0 ) {
		return 'delayed';
	}

	return 'none';
}

function getDistributedEditingPresenceRosterOtherEditorActivityCue( {
	remoteCurrentVisibleCount,
	remoteDelayedVisibleCount,
} ) {
	if ( remoteCurrentVisibleCount > 0 ) {
		return `${ remoteCurrentVisibleCount } other editor${
			remoteCurrentVisibleCount === 1 ? '' : 's'
		} ${ remoteCurrentVisibleCount === 1 ? 'is' : 'are' } active now.`;
	}

	if ( remoteDelayedVisibleCount > 0 ) {
		return `${ remoteDelayedVisibleCount } other editor${
			remoteDelayedVisibleCount === 1 ? '' : 's'
		} may be delayed.`;
	}

	return '';
}

function getDistributedEditingPresenceRosterSummary( {
	entries,
	status,
	expiredCount,
	localCurrentTabVisible,
	sameUserOtherTabVisible,
	remoteCurrentNames,
	remoteDelayedNames,
} ) {
	const clauses = [];

	if ( entries.length === 0 ) {
		if (
			status === DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.DEGRADED
		) {
			return 'Presence may be delayed. Save checks still use WordPress.';
		}

		if ( expiredCount > 0 ) {
			return 'Editor activity was seen before this refresh. Presence may be delayed.';
		}

		return 'No other editors shown.';
	}

	if ( localCurrentTabVisible ) {
		const localEntry = entries.find(
			isDistributedEditingLocalHeartbeatRosterEntry
		);
		clauses.push(
			isDistributedEditingPresenceRosterEntryCurrent( localEntry )
				? 'You are visible in this editing session.'
				: 'Your presence may be delayed.'
		);
	}

	if ( sameUserOtherTabVisible ) {
		clauses.push( 'You have this post open in another tab.' );
	}

	if ( remoteCurrentNames.length > 0 ) {
		clauses.push(
			getDistributedEditingPresenceRosterActiveNamesSummary(
				remoteCurrentNames
			)
		);
	}

	if ( remoteDelayedNames.length > 0 ) {
		clauses.push(
			getDistributedEditingPresenceRosterDelayedNamesSummary(
				remoteDelayedNames
			)
		);
	}

	return clauses.join( ' ' ) || 'No other editors shown.';
}

function getDistributedEditingPresenceRosterActiveNamesSummary( names ) {
	if ( names.length === 1 ) {
		return `${ names[ 0 ] } is also editing this post.`;
	}

	if ( names.length === 2 ) {
		return `${ names[ 0 ] } and ${ names[ 1 ] } are also editing this post.`;
	}

	return `${ names[ 0 ] }, ${
		names[ 1 ]
	}, and ${ getDistributedEditingPresenceRosterOthersLabel(
		names.length - 2
	) } are also editing this post.`;
}

function getDistributedEditingPresenceRosterDelayedNamesSummary( names ) {
	if ( names.length === 1 ) {
		return `${ names[ 0 ] } was here recently. Presence may be delayed.`;
	}

	if ( names.length === 2 ) {
		return `${ names[ 0 ] } and ${ names[ 1 ] } were here recently. Presence may be delayed.`;
	}

	return `${ names[ 0 ] }, ${
		names[ 1 ]
	}, and ${ getDistributedEditingPresenceRosterOthersLabel(
		names.length - 2
	) } were here recently. Presence may be delayed.`;
}

function getDistributedEditingPresenceRosterOthersLabel( count ) {
	return `${ count } other${ count === 1 ? '' : 's' }`;
}

function getDistributedEditingPresenceRosterCountSummary( {
	currentVisibleCount,
	delayedVisibleCount,
	hiddenCount,
	expiredCount,
} ) {
	const currentLabel = `${ currentVisibleCount } editor${
		currentVisibleCount === 1 ? '' : 's'
	} ${ currentVisibleCount === 1 ? 'is' : 'are' } active now`;
	const delayedLabel = `${ delayedVisibleCount } editor${
		delayedVisibleCount === 1 ? '' : 's'
	} may be delayed`;
	const expiredLabel =
		expiredCount > 0
			? 'Some editor activity expired before this refresh.'
			: '';
	const hiddenLabel =
		hiddenCount > 0
			? 'Some editor activity is hidden by roster limits or privacy settings.'
			: '';

	if ( currentVisibleCount > 0 && delayedVisibleCount > 0 ) {
		return [
			`${ currentLabel }; ${ delayedLabel }.`,
			hiddenLabel,
			expiredLabel,
		]
			.filter( Boolean )
			.join( ' ' );
	}

	if ( currentVisibleCount > 0 ) {
		return [ `${ currentLabel }.`, hiddenLabel, expiredLabel ]
			.filter( Boolean )
			.join( ' ' );
	}

	if ( delayedVisibleCount > 0 ) {
		return [ `${ delayedLabel }.`, hiddenLabel, expiredLabel ]
			.filter( Boolean )
			.join( ' ' );
	}

	if ( hiddenCount > 0 ) {
		return hiddenLabel;
	}

	if ( expiredCount > 0 ) {
		return 'Some editor activity expired before this refresh.';
	}

	return 'Editor activity has not been shown yet.';
}

function isDistributedEditingPresenceRosterEntryCurrent( entry ) {
	return entry?.freshness === 'current' || entry?.freshness === 'active';
}

function getDistributedEditingPresenceRosterVisibleName( entry ) {
	if (
		entry.relationship === 'same_user_other_tab' ||
		entry.relationship === 'current_user_current_tab'
	) {
		return 'You';
	}

	if ( entry.identityVisibility === 'anonymous' ) {
		return 'Another editor';
	}

	return entry.displayName || 'Another editor';
}

function isDistributedEditingLocalHeartbeatRosterEntry( entry ) {
	return entry.relationship === 'current_user_current_tab';
}

function isDistributedEditingSameUserOtherTabRosterEntry( entry ) {
	return entry.relationship === 'same_user_other_tab';
}

export function getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const selectedInterval =
		normalized.presenceRepeatedRefreshSelectedIntervalSeconds;
	let summary = 'Presence updates are off.';

	if (
		normalized.presenceRepeatedRefreshRuntimeStatus ===
		DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED
	) {
		summary = selectedInterval
			? `Presence updates are scheduled about every ${ selectedInterval } seconds.`
			: 'Presence updates are scheduled.';
	} else if (
		normalized.presenceRepeatedRefreshRuntimeStatus ===
		DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT
	) {
		summary =
			'Presence updates are paused while the connection is degraded.';
	}

	return {
		status: normalized.presenceRepeatedRefreshRuntimeStatus,
		localConnectionState:
			normalized.presenceRepeatedRefreshLocalConnectionState,
		requiresExplicitOptIn:
			normalized.presenceRepeatedRefreshRequiresExplicitOptIn,
		runtimeEnabledByDefault:
			normalized.presenceRepeatedRefreshRuntimeEnabledByDefault,
		explicitOptIn: normalized.presenceRepeatedRefreshExplicitOptIn,
		hostProfile: normalized.presenceRepeatedRefreshHostProfile,
		serverContact: normalized.presenceRepeatedRefreshServerContact,
		selectedIntervalSeconds:
			normalized.presenceRepeatedRefreshSelectedIntervalSeconds,
		selectedHeartbeatIntervalSeconds:
			normalized.presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds,
		standardIntervalSeconds:
			normalized.presenceRepeatedRefreshStandardIntervalSeconds,
		cheapHostIntervalSeconds:
			normalized.presenceRepeatedRefreshCheapHostIntervalSeconds,
		minimumIntervalSeconds:
			normalized.presenceRepeatedRefreshMinimumIntervalSeconds,
		schedulesNextRefresh:
			normalized.presenceRepeatedRefreshSchedulesNextRefresh,
		schedulesNextHeartbeat:
			normalized.presenceRepeatedRefreshSchedulesNextHeartbeat,
		pausesOnDegradedTransport:
			normalized.presenceRepeatedRefreshPausesOnDegradedTransport,
		exposesLocalConnectionState:
			normalized.presenceRepeatedRefreshExposesLocalConnectionState,
		copy: {
			label: 'Presence updates',
			summary,
		},
		descriptorOnly: true,
		callsPresenceReadEndpointNow:
			normalized.presenceRepeatedRefreshCallsPresenceReadEndpointNow,
		callsHeartbeatEndpointNow:
			normalized.presenceRepeatedRefreshCallsHeartbeatEndpointNow,
		recordsPresenceHeartbeatNow:
			normalized.presenceRepeatedRefreshRecordsPresenceHeartbeatNow,
		writesHeartbeatNow:
			normalized.presenceRepeatedRefreshWritesHeartbeatNow,
		startsPollingImmediately:
			normalized.presenceRepeatedRefreshStartsPollingImmediately,
		repeatedRefreshOptional: normalized.presenceRepeatedRefreshOptional,
		correctnessIndependentOfTransport:
			normalized.presenceRepeatedRefreshCorrectnessIndependentOfTransport,
		transportRequiredForCorrectness:
			normalized.presenceRepeatedRefreshTransportRequiredForCorrectness,
		dispatchesNotice: normalized.presenceRepeatedRefreshDispatchesNotice,
		callsSave: normalized.presenceRepeatedRefreshCallsSave,
		mutatesEditorContent:
			normalized.presenceRepeatedRefreshMutatesEditorContent,
		mutatesPersistedPostContent:
			normalized.presenceRepeatedRefreshMutatesPersistedPostContent,
		changesPostLock: normalized.presenceRepeatedRefreshChangesPostLock,
		claimsAbsence: normalized.presenceRepeatedRefreshClaimsAbsence,
		claimsSaved: normalized.presenceRepeatedRefreshClaimsSaved,
		exposesRawContent: normalized.presenceRepeatedRefreshExposesRawContent,
		exposesUserIds: normalized.presenceRepeatedRefreshExposesUserIds,
		exposesLogins: normalized.presenceRepeatedRefreshExposesLogins,
		exposesEmail: normalized.presenceRepeatedRefreshExposesEmail,
		exposesCursorOffset:
			normalized.presenceRepeatedRefreshExposesCursorOffset,
		exposesSelection: normalized.presenceRepeatedRefreshExposesSelection,
		rawSessionKeyIncluded:
			normalized.presenceRepeatedRefreshRawSessionKeyIncluded,
	};
}

export function getDistributedEditingPresenceStartupPolicyStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const selectedDelay =
		normalized.presenceStartupPolicySelectedInitialHeartbeatDelaySeconds;
	let summary = 'Presence startup waits for a manual update.';

	if (
		normalized.presenceStartupPolicyStatus ===
		DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.AUTOMATIC_HEARTBEAT_ALLOWED
	) {
		summary = selectedDelay
			? `Initial presence may start automatically after about ${ selectedDelay } seconds.`
			: 'Initial presence may start automatically.';
	} else if (
		normalized.presenceStartupPolicyStatus ===
		DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED
	) {
		summary = selectedDelay
			? `Initial presence may start automatically after about ${ selectedDelay } seconds on cheap hosts.`
			: 'Initial presence may start automatically at the cheap-host cadence.';
	} else if (
		normalized.presenceStartupPolicyStatus ===
		DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.PAUSED_DEGRADED_TRANSPORT
	) {
		summary = 'Presence startup waits while server contact is degraded.';
	}

	return {
		status: normalized.presenceStartupPolicyStatus,
		reason: normalized.presenceStartupPolicyReason,
		requiresExplicitEnablement:
			normalized.presenceStartupPolicyRequiresExplicitEnablement,
		maySendInitialHeartbeatAutomatically:
			normalized.presenceStartupPolicyMaySendInitialHeartbeatAutomatically,
		slowAutomaticHeartbeatAllowed:
			normalized.presenceStartupPolicySlowAutomaticHeartbeatAllowed,
		manualHeartbeatAvailable:
			normalized.presenceStartupPolicyManualHeartbeatAvailable,
		hostProfile: normalized.presenceStartupPolicyHostProfile,
		serverContact: normalized.presenceStartupPolicyServerContact,
		selectedInitialHeartbeatDelaySeconds:
			normalized.presenceStartupPolicySelectedInitialHeartbeatDelaySeconds,
		standardInitialHeartbeatDelaySeconds:
			normalized.presenceStartupPolicyStandardInitialHeartbeatDelaySeconds,
		cheapHostInitialHeartbeatDelaySeconds:
			normalized.presenceStartupPolicyCheapHostInitialHeartbeatDelaySeconds,
		minimumInitialHeartbeatDelaySeconds:
			normalized.presenceStartupPolicyMinimumInitialHeartbeatDelaySeconds,
		copy: {
			label: 'Presence startup',
			summary,
		},
		descriptorOnly: true,
		callsHeartbeatEndpointNow:
			normalized.presenceStartupPolicyCallsHeartbeatEndpointNow,
		recordsPresenceHeartbeatNow:
			normalized.presenceStartupPolicyRecordsPresenceHeartbeatNow,
		writesPresenceNow: normalized.presenceStartupPolicyWritesPresenceNow,
		startsPollingNow: normalized.presenceStartupPolicyStartsPollingNow,
		startsTimerNow: normalized.presenceStartupPolicyStartsTimerNow,
		dispatchesNotice: normalized.presenceStartupPolicyDispatchesNotice,
		callsSave: normalized.presenceStartupPolicyCallsSave,
		mutatesEditorContent:
			normalized.presenceStartupPolicyMutatesEditorContent,
		mutatesPersistedPostContent:
			normalized.presenceStartupPolicyMutatesPersistedPostContent,
		changesPostLock: normalized.presenceStartupPolicyChangesPostLock,
		claimsAbsence: normalized.presenceStartupPolicyClaimsAbsence,
		claimsSaved: normalized.presenceStartupPolicyClaimsSaved,
		exposesRawContent: normalized.presenceStartupPolicyExposesRawContent,
		exposesUserIds: normalized.presenceStartupPolicyExposesUserIds,
		exposesLogins: normalized.presenceStartupPolicyExposesLogins,
		exposesEmail: normalized.presenceStartupPolicyExposesEmail,
		exposesCursorOffset:
			normalized.presenceStartupPolicyExposesCursorOffset,
		exposesSelection: normalized.presenceStartupPolicyExposesSelection,
		rawSessionKeyIncluded:
			normalized.presenceStartupPolicyRawSessionKeyIncluded,
		correctnessIndependentOfTransport:
			normalized.presenceStartupPolicyCorrectnessIndependentOfTransport,
		transportRequiredForCorrectness:
			normalized.presenceStartupPolicyTransportRequiredForCorrectness,
	};
}

/**
 * Applies a local initial-presence startup policy configuration. This is an
 * inert policy handoff only: no timers, REST calls, heartbeat writes, saves,
 * editor-content mutation, or post-lock changes happen here.
 *
 * @param {Object} policyConfig        Startup policy configuration.
 * @param {Object} currentSessionState Existing DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForPresenceStartupPolicyConfig(
	policyConfig = {},
	currentSessionState = {}
) {
	return normalizeDistributedEditingSessionState( {
		...currentSessionState,
		distributedEditingPresenceStartupPolicy: policyConfig,
	} );
}

/**
 * Applies a local repeated presence cadence runtime configuration. This is an
 * inert state handoff only: no timers, REST calls, heartbeat writes, saves,
 * editor-content mutation, or post-lock changes happen here.
 *
 * @param {Object} runtimeConfig       Runtime cadence configuration.
 * @param {Object} currentSessionState Existing DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForPresenceRepeatedRefreshRuntimeConfig(
	runtimeConfig = {},
	currentSessionState = {}
) {
	return normalizeDistributedEditingSessionState( {
		...currentSessionState,
		distributedEditingPresenceRepeatedRefreshRuntime: runtimeConfig,
	} );
}

/**
 * Normalizes a one-shot WordPress presence snapshot response into DE-RTC
 * editor state. The result updates only local presence descriptors; it does
 * not save, mutate editor content, start polling, or change post locks.
 *
 * @param {Object} responseOrError     REST response or API error.
 * @param {Object} currentSessionState Existing DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const responseData = getDistributedEditingResponseData( responseOrError );
	const result = normalizeNullableString(
		getFirstDefined( responseOrError.result, responseData.result )
	);
	const errorCode = normalizeNullableString(
		getFirstDefined(
			responseOrError.code,
			responseOrError.reasonCode,
			responseOrError.reason_code,
			responseData.code,
			responseData.reasonCode,
			responseData.reason_code
		)
	);
	const detail = normalizeNullableString(
		getFirstDefined(
			responseOrError.detail,
			responseData.detail,
			responseOrError.message
		)
	);
	const roster = normalizeObject(
		getFirstDefined(
			responseOrError.presenceRoster,
			responseOrError.presence_roster,
			responseData.presenceRoster,
			responseData.presence_roster
		)
	);
	const readContract = normalizeObject(
		getFirstDefined(
			responseOrError.presenceReadContract,
			responseOrError.presence_read_contract,
			responseData.presenceReadContract,
			responseData.presence_read_contract
		)
	);
	const pollingGuidance = normalizeObject(
		getFirstDefined(
			readContract.cheapHostPollingGuidance,
			readContract.cheap_host_polling_guidance
		)
	);
	const refreshed =
		result === 'presence_roster_snapshot' &&
		( Array.isArray( roster.entries ) || roster.status );
	const currentRosterFields =
		normalizeDistributedEditingPresenceRosterFields( currentSessionState );
	const rosterEntries = Array.isArray( roster.entries ) ? roster.entries : [];
	const normalizedIncomingRosterEntries = rosterEntries.map(
		( entry, index ) =>
			normalizeDistributedEditingPresenceRosterEntry( entry, index )
	);
	const rosterHiddenCount = normalizeCount(
		getFirstDefined( roster.hiddenCount, roster.hidden_count )
	);
	const rosterExpiredCount = normalizeCount(
		getFirstDefined( roster.expiredCount, roster.expired_count )
	);
	const hasIncomingCurrentTabRosterEntry =
		normalizedIncomingRosterEntries.some(
			isDistributedEditingLocalHeartbeatRosterEntry
		);
	const hasIncomingSameUserOtherTabRosterEntry =
		normalizedIncomingRosterEntries.some(
			isDistributedEditingSameUserOtherTabRosterEntry
		);
	const shouldCarryForwardExpiredRosterEvidence =
		refreshed &&
		( hasIncomingCurrentTabRosterEntry ||
			hasIncomingSameUserOtherTabRosterEntry ) &&
		currentRosterFields.presenceRosterExpiredCount > rosterExpiredCount &&
		! currentRosterFields.presenceRosterExpiredEvidenceCarriedForward;
	const nextRosterExpiredCount = shouldCarryForwardExpiredRosterEvidence
		? currentRosterFields.presenceRosterExpiredCount
		: rosterExpiredCount;
	const preservedLocalHeartbeatEntries =
		currentRosterFields.presenceRosterEntries
			.filter( isDistributedEditingLocalHeartbeatRosterEntry )
			.map( ( entry ) => ( {
				...entry,
				freshness: 'recent',
			} ) );
	const preservedTransientEmptySnapshotEntries =
		getDistributedEditingPresenceEntriesForTransientEmptySnapshot(
			currentRosterFields.presenceRosterEntries
		);
	const shouldPreserveTransientEmptySnapshotEntries =
		refreshed &&
		rosterEntries.length === 0 &&
		preservedTransientEmptySnapshotEntries.length > 0 &&
		! currentRosterFields.presenceRosterEmptySnapshotPreservedEntries;
	const shouldMergeLocalHeartbeatEntryWithIncomingRoster =
		refreshed &&
		rosterEntries.length > 0 &&
		! hasIncomingCurrentTabRosterEntry &&
		hasIncomingSameUserOtherTabRosterEntry &&
		preservedLocalHeartbeatEntries.length > 0;
	const effectiveRosterEntries =
		shouldMergeLocalHeartbeatEntryWithIncomingRoster
			? [ ...preservedLocalHeartbeatEntries, ...rosterEntries ]
			: rosterEntries;
	let refreshStatus = DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.FAILED;

	if ( refreshed ) {
		refreshStatus = DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED;
	} else if (
		errorCode === DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED
	) {
		refreshStatus =
			DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.FEATURE_DISABLED;
	} else if ( errorCode === 'rest_cannot_edit' ) {
		refreshStatus =
			DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.PERMISSION_DENIED;
	} else if ( errorCode === 'rest_post_invalid_id' ) {
		refreshStatus =
			DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.ROUTE_MISMATCH;
	}

	const nextState = {
		...currentSessionState,
		presenceRosterRefreshStatus: refreshStatus,
		presenceRosterRefreshReason: errorCode || detail || result,
		presenceRosterRefreshResult: result,
		presenceRosterRefreshRequested: true,
		presenceRosterRefreshCallsRestEndpoint: true,
		presenceRosterRefreshCallsSave: false,
		presenceRosterRefreshMutatesEditorContent: false,
		presenceRosterRefreshMutatesPersistedPostContent: false,
		presenceRosterRefreshChangesPostLock: false,
		presenceRosterRefreshRecordsPresenceHeartbeat: false,
		presenceRosterRefreshEnablesRepeatedClientRefresh: Boolean(
			getFirstDefined(
				responseOrError.enablesRepeatedClientRefresh,
				responseOrError.enables_repeated_client_refresh,
				responseData.enablesRepeatedClientRefresh,
				responseData.enables_repeated_client_refresh,
				readContract.enablesRepeatedClientRefresh,
				readContract.enables_repeated_client_refresh,
				pollingGuidance.repeatedClientRefreshEnabledNow,
				pollingGuidance.repeated_client_refresh_enabled_now
			)
		),
		presenceRosterRefreshClaimsSaved: false,
		presenceRosterRefreshExposesRawContent: false,
		presenceRosterRefreshExposesUserIds: false,
		presenceRosterRefreshExposesCursorOffset: false,
		presenceRosterRefreshExposesSelection: false,
		presenceRosterExpiredEvidenceCarriedForward:
			shouldCarryForwardExpiredRosterEvidence,
		presenceRosterReadContractSource: normalizeNullableString(
			getFirstDefined( readContract.source, readContract.contractSource )
		),
		presenceRosterReadContractRoute: normalizeNullableString(
			getFirstDefined( readContract.route, readContract.restRoute )
		),
		presenceRosterReadSuggestedPollingIntervalSeconds:
			normalizeNullableInteger(
				getFirstDefined(
					pollingGuidance.suggestedPollingIntervalSeconds,
					pollingGuidance.suggested_polling_interval_seconds
				)
			),
		presenceRosterReadCheapHostPollingIntervalSeconds:
			normalizeNullableInteger(
				getFirstDefined(
					pollingGuidance.cheapHostPollingIntervalSeconds,
					pollingGuidance.cheap_host_polling_interval_seconds
				)
			),
		presenceRosterReadRepeatedClientRefreshEnabled: Boolean(
			getFirstDefined(
				readContract.enablesRepeatedClientRefresh,
				readContract.enables_repeated_client_refresh,
				pollingGuidance.repeatedClientRefreshEnabledNow,
				pollingGuidance.repeated_client_refresh_enabled_now
			)
		),
	};

	if ( refreshed ) {
		if ( shouldPreserveTransientEmptySnapshotEntries ) {
			nextState.presenceRosterStatus =
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT;
			nextState.presenceRosterEntries =
				preservedTransientEmptySnapshotEntries;
			nextState.presenceRosterTotalKnownCount = Math.max(
				normalizeCount(
					getFirstDefined(
						roster.totalKnownCount,
						roster.total_known_count
					)
				),
				preservedTransientEmptySnapshotEntries.length +
					rosterHiddenCount +
					nextRosterExpiredCount
			);
			nextState.presenceRosterHiddenCount = rosterHiddenCount;
			nextState.presenceRosterExpiredCount = nextRosterExpiredCount;
			nextState.presenceRosterEmptySnapshotPreservedEntries = true;
		} else {
			nextState.presenceRosterStatus = roster.status;
			nextState.presenceRosterEntries = effectiveRosterEntries;
			nextState.presenceRosterTotalKnownCount = Math.max(
				normalizeCount(
					getFirstDefined(
						roster.totalKnownCount,
						roster.total_known_count
					)
				),
				effectiveRosterEntries.length +
					rosterHiddenCount +
					nextRosterExpiredCount
			);
			nextState.presenceRosterHiddenCount = rosterHiddenCount;
			nextState.presenceRosterExpiredCount = nextRosterExpiredCount;
			nextState.presenceRosterEmptySnapshotPreservedEntries = false;
		}
	}

	return normalizeDistributedEditingSessionState( nextState );
}

/**
 * Normalizes a content-free WordPress presence storage readiness re-check into
 * DE-RTC editor state. The result updates only local readiness descriptors; it
 * does not install storage, write presence, save, mutate editor content, start
 * polling, expose private fields, or change post locks.
 *
 * @param {Object} responseOrError     REST response or API error.
 * @param {Object} currentSessionState Existing DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForPresenceStorageReadinessRecheckResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const responseData = getDistributedEditingResponseData( responseOrError );
	const result = normalizeNullableString(
		getFirstDefined( responseOrError.result, responseData.result )
	);
	const errorCode = normalizeNullableString(
		getFirstDefined(
			responseOrError.code,
			responseOrError.reasonCode,
			responseOrError.reason_code,
			responseData.code,
			responseData.reasonCode,
			responseData.reason_code
		)
	);
	const detail = normalizeNullableString(
		getFirstDefined(
			responseOrError.detail,
			responseData.detail,
			responseOrError.message
		)
	);
	const readinessStatus = normalizeNullableString(
		getFirstDefined(
			responseOrError.status,
			responseOrError.readinessStatus,
			responseOrError.readiness_status,
			typeof responseData.status === 'string'
				? responseData.status
				: undefined,
			responseData.readinessStatus,
			responseData.readiness_status
		)
	);
	const recheckStatus =
		getDistributedEditingPresenceStorageReadinessRecheckStatusForResult( {
			readinessStatus,
			errorCode,
		} );
	const successfulReadiness = [
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.READY,
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.SETUP_REQUIRED,
		DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.UPGRADE_REQUIRED,
	].includes( recheckStatus );
	const readiness = successfulReadiness
		? {
				result,
				status: recheckStatus,
				tableExists: Boolean(
					getFirstDefined(
						responseOrError.tableExists,
						responseOrError.table_exists,
						responseData.tableExists,
						responseData.table_exists
					)
				),
				schemaCurrent: Boolean(
					getFirstDefined(
						responseOrError.schemaCurrent,
						responseOrError.schema_current,
						responseData.schemaCurrent,
						responseData.schema_current
					)
				),
				expectedStartupHeartbeatStatus: normalizeNullableString(
					getFirstDefined(
						responseOrError.expectedStartupHeartbeatStatus,
						responseOrError.expected_startup_heartbeat_status,
						responseData.expectedStartupHeartbeatStatus,
						responseData.expected_startup_heartbeat_status
					)
				),
				setupRequired: Boolean(
					getFirstDefined(
						responseOrError.setupRequired,
						responseOrError.setup_required,
						responseData.setupRequired,
						responseData.setup_required
					)
				),
				setupAction: normalizeNullableString(
					getFirstDefined(
						responseOrError.setupAction,
						responseOrError.setup_action,
						responseData.setupAction,
						responseData.setup_action
					)
				),
				diagnosticOnly:
					getFirstDefined(
						responseOrError.diagnosticOnly,
						responseOrError.diagnostic_only,
						responseData.diagnosticOnly,
						responseData.diagnostic_only
					) !== false,
				contentFree:
					getFirstDefined(
						responseOrError.contentFree,
						responseOrError.content_free,
						responseData.contentFree,
						responseData.content_free
					) !== false,
				installsPresenceTable: Boolean(
					getFirstDefined(
						responseOrError.installsPresenceTable,
						responseOrError.installs_presence_table,
						responseData.installsPresenceTable,
						responseData.installs_presence_table
					)
				),
				automaticPerRequestInstall: Boolean(
					getFirstDefined(
						responseOrError.automaticPerRequestInstall,
						responseOrError.automatic_per_request_install,
						responseData.automaticPerRequestInstall,
						responseData.automatic_per_request_install
					)
				),
				writesPresence: Boolean(
					getFirstDefined(
						responseOrError.writesPresence,
						responseOrError.writes_presence,
						responseData.writesPresence,
						responseData.writes_presence
					)
				),
				recordsPresenceHeartbeat: Boolean(
					getFirstDefined(
						responseOrError.recordsPresenceHeartbeat,
						responseOrError.records_presence_heartbeat,
						responseData.recordsPresenceHeartbeat,
						responseData.records_presence_heartbeat
					)
				),
				startsPolling: Boolean(
					getFirstDefined(
						responseOrError.startsPolling,
						responseOrError.starts_polling,
						responseData.startsPolling,
						responseData.starts_polling
					)
				),
				callsSave: Boolean(
					getFirstDefined(
						responseOrError.callsSave,
						responseOrError.calls_save,
						responseData.callsSave,
						responseData.calls_save
					)
				),
				mutatesEditorContent: false,
				mutatesPostContent: Boolean(
					getFirstDefined(
						responseOrError.mutatesPostContent,
						responseOrError.mutates_post_content,
						responseData.mutatesPostContent,
						responseData.mutates_post_content
					)
				),
				mutatesPersistedPostContent: Boolean(
					getFirstDefined(
						responseOrError.mutatesPersistedPostContent,
						responseOrError.mutates_persisted_post_content,
						responseData.mutatesPersistedPostContent,
						responseData.mutates_persisted_post_content
					)
				),
				createsRevision: Boolean(
					getFirstDefined(
						responseOrError.createsRevision,
						responseOrError.creates_revision,
						responseData.createsRevision,
						responseData.creates_revision
					)
				),
				changesPostLock: Boolean(
					getFirstDefined(
						responseOrError.changesPostLock,
						responseOrError.changes_post_lock,
						responseData.changesPostLock,
						responseData.changes_post_lock
					)
				),
				claimsAbsence: Boolean(
					getFirstDefined(
						responseOrError.claimsAbsence,
						responseOrError.claims_absence,
						responseData.claimsAbsence,
						responseData.claims_absence
					)
				),
				claimsSaved: Boolean(
					getFirstDefined(
						responseOrError.claimsSaved,
						responseOrError.claims_saved,
						responseData.claimsSaved,
						responseData.claims_saved
					)
				),
				exposesRawContent: Boolean(
					getFirstDefined(
						responseOrError.exposesRawContent,
						responseOrError.exposes_raw_content,
						responseData.exposesRawContent,
						responseData.exposes_raw_content
					)
				),
				exposesUserIds: Boolean(
					getFirstDefined(
						responseOrError.exposesUserIds,
						responseOrError.exposes_user_ids,
						responseData.exposesUserIds,
						responseData.exposes_user_ids
					)
				),
				exposesCursorOffset: Boolean(
					getFirstDefined(
						responseOrError.exposesCursorOffset,
						responseOrError.exposes_cursor_offset,
						responseData.exposesCursorOffset,
						responseData.exposes_cursor_offset
					)
				),
				exposesSelection: Boolean(
					getFirstDefined(
						responseOrError.exposesSelection,
						responseOrError.exposes_selection,
						responseData.exposesSelection,
						responseData.exposes_selection
					)
				),
				correctnessIndependentOfTransport:
					getFirstDefined(
						responseOrError.correctnessIndependentOfTransport,
						responseOrError.correctness_independent_of_transport,
						responseData.correctnessIndependentOfTransport,
						responseData.correctness_independent_of_transport
					) !== false,
				transportRequiredForCorrectness: Boolean(
					getFirstDefined(
						responseOrError.transportRequiredForCorrectness,
						responseOrError.transport_required_for_correctness,
						responseData.transportRequiredForCorrectness,
						responseData.transport_required_for_correctness
					)
				),
		  }
		: null;
	const nextState = {
		...currentSessionState,
		presenceStorageReadinessRecheckStatus: recheckStatus,
		presenceStorageReadinessRecheckReason:
			errorCode || detail || readinessStatus || result,
		presenceStorageReadinessRecheckResult: readiness,
		presenceStorageReadinessRecheckRequested: true,
		presenceStorageReadinessRecheckCallsRestEndpoint: true,
		presenceStorageReadinessRecheckInstallsPresenceTable: false,
		presenceStorageReadinessRecheckRecordsPresenceHeartbeat: false,
		presenceStorageReadinessRecheckWritesPresence: false,
		presenceStorageReadinessRecheckStartsPolling: false,
		presenceStorageReadinessRecheckCallsSave: false,
		presenceStorageReadinessRecheckMutatesEditorContent: false,
		presenceStorageReadinessRecheckMutatesPersistedPostContent: false,
		presenceStorageReadinessRecheckChangesPostLock: false,
		presenceStorageReadinessRecheckClaimsAbsence: false,
		presenceStorageReadinessRecheckClaimsSaved: false,
		presenceStorageReadinessRecheckContentFree: true,
		presenceStorageReadinessRecheckExposesRawContent: false,
		presenceStorageReadinessRecheckExposesUserIds: false,
		presenceStorageReadinessRecheckExposesCursorOffset: false,
		presenceStorageReadinessRecheckExposesSelection: false,
		presenceStorageReadinessRecheckCorrectnessIndependentOfTransport: true,
		presenceStorageReadinessRecheckTransportRequiredForCorrectness: false,
	};

	return normalizeDistributedEditingSessionState( nextState );
}

/**
 * Normalizes a one-shot WordPress presence heartbeat response into DE-RTC
 * editor state. The result updates only local heartbeat descriptors; it does
 * not save, mutate editor content, start polling, expose private fields, or
 * change post locks.
 *
 * @param {Object} responseOrError     REST response, local gate result, or API error.
 * @param {Object} currentSessionState Existing DE-RTC session state.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForPresenceHeartbeatResult(
	responseOrError = {},
	currentSessionState = {}
) {
	const responseData = getDistributedEditingResponseData( responseOrError );
	const result = normalizeNullableString(
		getFirstDefined( responseOrError.result, responseData.result )
	);
	const errorCode = normalizeNullableString(
		getFirstDefined(
			responseOrError.code,
			responseOrError.reasonCode,
			responseOrError.reason_code,
			responseData.code,
			responseData.reasonCode,
			responseData.reason_code
		)
	);
	const detail = normalizeNullableString(
		getFirstDefined(
			responseOrError.detail,
			responseData.detail,
			responseOrError.message
		)
	);
	const status = getDistributedEditingPresenceHeartbeatStatusForResult( {
		result,
		errorCode,
	} );
	const heartbeatRecorded =
		status === DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT;
	const currentRosterFields =
		normalizeDistributedEditingPresenceRosterFields( currentSessionState );
	const hasExistingLocalRosterEntry =
		currentRosterFields.presenceRosterEntries.some(
			isDistributedEditingLocalHeartbeatRosterEntry
		);
	const shouldAddLocalRosterEntry =
		heartbeatRecorded &&
		currentRosterFields.presenceRosterEntries.length === 0;
	const shouldRefreshExistingLocalRosterEntry =
		heartbeatRecorded && hasExistingLocalRosterEntry;
	const shouldDowngradeLocalRosterEntry =
		! heartbeatRecorded && hasExistingLocalRosterEntry;
	const localHeartbeatEntryDetails =
		normalizeDistributedEditingPresenceRosterEntry(
			{
				key: 'presence-local-heartbeat-current-tab',
				identityVisibility: 'self',
				relationship: 'current_user_current_tab',
				activity: 'editing_post',
				freshness: 'current',
				source: 'local_heartbeat_confirmation',
				permissions: getFirstDefined(
					responseOrError.permissions,
					responseOrError.permission_summary,
					responseData.permissions,
					responseData.permission_summary
				),
				permissionsAvailable: getFirstDefined(
					responseOrError.permissionsAvailable,
					responseOrError.permissions_available,
					responseOrError.permissionSummaryRecorded,
					responseOrError.permission_summary_recorded,
					responseData.permissionsAvailable,
					responseData.permissions_available,
					responseData.permissionSummaryRecorded,
					responseData.permission_summary_recorded
				),
				sessionStartedAtGmt: getFirstDefined(
					responseOrError.sessionStartedAtGmt,
					responseOrError.session_started_at_gmt,
					responseData.sessionStartedAtGmt,
					responseData.session_started_at_gmt
				),
				sessionDurationSeconds: getFirstDefined(
					responseOrError.sessionDurationSeconds,
					responseOrError.session_duration_seconds,
					responseData.sessionDurationSeconds,
					responseData.session_duration_seconds
				),
				presenceUpdatedAtGmt: getFirstDefined(
					responseOrError.presenceUpdatedAtGmt,
					responseOrError.presence_updated_at_gmt,
					responseOrError.documentState?.presenceUpdatedAtGmt,
					responseOrError.documentState?.presence_updated_at_gmt,
					responseOrError.document_state?.presenceUpdatedAtGmt,
					responseOrError.document_state?.presence_updated_at_gmt,
					responseData.presenceUpdatedAtGmt,
					responseData.presence_updated_at_gmt,
					responseData.documentState?.presenceUpdatedAtGmt,
					responseData.documentState?.presence_updated_at_gmt,
					responseData.document_state?.presenceUpdatedAtGmt,
					responseData.document_state?.presence_updated_at_gmt
				),
				attributionKey: getFirstDefined(
					responseOrError.attributionKey,
					responseOrError.attribution_key,
					responseData.attributionKey,
					responseData.attribution_key
				),
				authorshipFocusAvailable: getFirstDefined(
					responseOrError.authorshipFocusAvailable,
					responseOrError.authorship_focus_available,
					responseData.authorshipFocusAvailable,
					responseData.authorship_focus_available
				),
				documentState: getFirstDefined(
					responseOrError.documentState,
					responseOrError.document_state,
					responseData.documentState,
					responseData.document_state
				),
				selectionState: getFirstDefined(
					responseOrError.selectionState,
					responseOrError.selection_state,
					responseData.selectionState,
					responseData.selection_state
				),
			},
			0
		);
	const localRosterEntry = {
		...localHeartbeatEntryDetails,
		key: 'presence-local-heartbeat-current-tab',
		displayName: null,
		identityVisibility: 'self',
		relationship: 'current_user_current_tab',
		activity: 'editing_post',
		freshness: 'current',
		source: 'local_heartbeat_confirmation',
		exposesUserId: false,
		exposesCursorOffset: false,
		exposesSelection: false,
		exposesSelectionPresence:
			localHeartbeatEntryDetails.selectionState.available,
		exposesRawSelectedText: false,
		exposesRawContent: false,
	};
	const refreshedExistingRosterEntries =
		shouldRefreshExistingLocalRosterEntry || shouldDowngradeLocalRosterEntry
			? currentRosterFields.presenceRosterEntries.map( ( entry ) =>
					isDistributedEditingLocalHeartbeatRosterEntry( entry )
						? {
								...entry,
								documentState: localRosterEntry.documentState,
								selectionState: localRosterEntry.selectionState,
								permissions: localRosterEntry.permissions,
								permissionsAvailable:
									localRosterEntry.permissionsAvailable,
								presenceUpdatedAtGmt:
									localRosterEntry.presenceUpdatedAtGmt,
								sessionDurationSeconds:
									localRosterEntry.sessionDurationSeconds,
								freshness: heartbeatRecorded
									? 'current'
									: 'recent',
						  }
						: entry
			  )
			: null;
	const nextRosterEntries = shouldAddLocalRosterEntry
		? [ localRosterEntry ]
		: refreshedExistingRosterEntries;
	const shouldUpdateRosterCounts = Boolean( nextRosterEntries );
	const nextRosterHiddenCount = currentRosterFields.presenceRosterHiddenCount;
	const nextRosterExpiredCount =
		currentRosterFields.presenceRosterExpiredCount;
	const nextRosterTotalKnownCount = shouldUpdateRosterCounts
		? Math.max(
				currentRosterFields.presenceRosterTotalKnownCount,
				nextRosterEntries.length +
					nextRosterHiddenCount +
					nextRosterExpiredCount
		  )
		: null;
	const localRosterEntryVisible = Boolean(
		shouldAddLocalRosterEntry ||
			shouldRefreshExistingLocalRosterEntry ||
			shouldDowngradeLocalRosterEntry
	);
	let localRosterEntryFreshness = null;
	if ( localRosterEntryVisible ) {
		localRosterEntryFreshness = heartbeatRecorded ? 'current' : 'recent';
	}
	const nextState = {
		...currentSessionState,
		...( nextRosterEntries
			? {
					presenceRosterEntries: nextRosterEntries,
					presenceRosterVisibleCount: nextRosterEntries.length,
					presenceRosterTotalKnownCount: nextRosterTotalKnownCount,
					presenceRosterHiddenCount: nextRosterHiddenCount,
					presenceRosterExpiredCount: nextRosterExpiredCount,
			  }
			: {} ),
		presenceHeartbeatStatus: status,
		presenceHeartbeatReason: errorCode || detail || result,
		presenceHeartbeatResult: result,
		presenceHeartbeatRequested: true,
		presenceHeartbeatCallsRestEndpoint: Boolean(
			getFirstDefined(
				responseOrError.callsRestEndpoint,
				responseOrError.calls_rest_endpoint,
				responseData.callsRestEndpoint,
				responseData.calls_rest_endpoint,
				true
			)
		),
		presenceHeartbeatRecordsPresenceHeartbeat: Boolean(
			getFirstDefined(
				responseOrError.recordsPresenceHeartbeat,
				responseOrError.records_presence_heartbeat,
				responseData.recordsPresenceHeartbeat,
				responseData.records_presence_heartbeat,
				heartbeatRecorded
			)
		),
		presenceHeartbeatWritesPresence: Boolean(
			getFirstDefined(
				responseOrError.writesPresence,
				responseOrError.writes_presence,
				responseData.writesPresence,
				responseData.writes_presence,
				heartbeatRecorded
			)
		),
		presenceHeartbeatCallsSave: false,
		presenceHeartbeatMutatesEditorContent: false,
		presenceHeartbeatMutatesPersistedPostContent: false,
		presenceHeartbeatChangesPostLock: false,
		presenceHeartbeatClaimsSaved: false,
		presenceHeartbeatEnablesRepeatedClientRefresh: false,
		presenceHeartbeatRuntimePollingEnabled: false,
		presenceHeartbeatExposesRawContent: false,
		presenceHeartbeatExposesUserIds: false,
		presenceHeartbeatExposesCursorOffset: false,
		presenceHeartbeatExposesSelection: false,
		presenceHeartbeatExposesSelectionPresence: Boolean(
			localHeartbeatEntryDetails.selectionState.available
		),
		presenceHeartbeatExposesRawSelectedText: false,
		presenceHeartbeatRawSessionKeyIncluded: false,
		presenceHeartbeatMarksLocalEditorCurrent: heartbeatRecorded,
		presenceHeartbeatMarksLocalEditorDelayed:
			shouldDowngradeLocalRosterEntry,
		presenceHeartbeatLocalRosterEntryVisible: localRosterEntryVisible,
		presenceHeartbeatLocalRosterEntryFreshness: localRosterEntryFreshness,
		presenceHeartbeatAttributionKey:
			localHeartbeatEntryDetails.attributionKey,
		presenceHeartbeatRepeatedRefreshOptional: Boolean(
			getFirstDefined(
				responseOrError.repeatedRefreshOptional,
				responseOrError.repeated_refresh_optional,
				responseData.repeatedRefreshOptional,
				responseData.repeated_refresh_optional,
				true
			)
		),
		presenceHeartbeatSuggestedIntervalSeconds: normalizeNullableInteger(
			getFirstDefined(
				responseOrError.heartbeatIntervalSeconds,
				responseOrError.heartbeat_interval_seconds,
				responseData.heartbeatIntervalSeconds,
				responseData.heartbeat_interval_seconds,
				responseData.suggestedPollingIntervalSeconds,
				responseData.suggested_polling_interval_seconds
			)
		),
		presenceHeartbeatCheapHostIntervalSeconds: normalizeNullableInteger(
			getFirstDefined(
				responseOrError.cheapHostPollingIntervalSeconds,
				responseOrError.cheap_host_polling_interval_seconds,
				responseData.cheapHostPollingIntervalSeconds,
				responseData.cheap_host_polling_interval_seconds
			)
		),
	};

	return normalizeDistributedEditingSessionState( nextState );
}

function getDistributedEditingPresenceHeartbeatStatusForResult( {
	result,
	errorCode,
} ) {
	if ( result === 'presence_heartbeat_recorded' ) {
		return DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT;
	}

	if (
		errorCode ===
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE ||
		result === 'presence_storage_unavailable'
	) {
		return DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.STORAGE_UNAVAILABLE;
	}

	if (
		errorCode === DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED
	) {
		return DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.FEATURE_DISABLED;
	}

	if (
		errorCode === DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT ||
		errorCode === 'rest_cannot_edit'
	) {
		return DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.PERMISSION_DENIED;
	}

	if (
		errorCode === DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID ||
		errorCode === 'rest_post_invalid_id'
	) {
		return DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.ROUTE_MISMATCH;
	}

	return DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.FAILED;
}

function getDistributedEditingPresenceStorageReadinessRecheckStatusForResult( {
	readinessStatus,
	errorCode,
} ) {
	if ( readinessStatus === 'ready' ) {
		return DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.READY;
	}

	if ( readinessStatus === 'setup_required' ) {
		return DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.SETUP_REQUIRED;
	}

	if ( readinessStatus === 'upgrade_required' ) {
		return DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.UPGRADE_REQUIRED;
	}

	if (
		readinessStatus === 'feature_disabled' ||
		errorCode === DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED
	) {
		return DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.FEATURE_DISABLED;
	}

	if (
		errorCode === DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT ||
		errorCode === 'rest_cannot_edit'
	) {
		return DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.PERMISSION_DENIED;
	}

	if (
		errorCode === DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID ||
		errorCode === 'rest_post_invalid_id'
	) {
		return DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.ROUTE_MISMATCH;
	}

	return DISTRIBUTED_EDITING_PRESENCE_STORAGE_READINESS_RECHECK_STATUSES.FAILED;
}

/**
 * Returns a support-export summary for the current DE-RTC action transcript.
 * The summary deliberately keeps chronology to stable event names, sources,
 * counts, and redaction flags so it can travel with support diagnostics without
 * exposing raw post content, proof internals, or actor identities.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Content-free action transcript support summary.
 */
export function getDistributedEditingActionTranscriptSupportSummaryForSessionState(
	sessionState = {}
) {
	const transcript =
		getDistributedEditingActionTranscriptStateForSessionState(
			sessionState
		);
	const eventTypes = transcript.items.map( ( item ) => item.eventType );
	const eventSources = transcript.items.map( ( item ) => item.source );

	return {
		status: transcript.status,
		available: transcript.status === 'available',
		itemCount: transcript.itemCount,
		droppedItemCount: transcript.droppedItemCount,
		latestEventType: transcript.latestEventType,
		latestEventSource: transcript.latestEventSource,
		eventTypes,
		eventSources,
		items: transcript.items.map( ( item ) => ( {
			eventType: item.eventType,
			source: item.source,
			sequence: item.sequence,
			reasonCode: item.reasonCode,
			redacted: true,
		} ) ),
		hasLocalEvents: transcript.hasLocalEvents,
		hasRemoteEvents: transcript.hasRemoteEvents,
		hasServerEvents: transcript.hasServerEvents,
		hasEditorEvents: transcript.hasEditorEvents,
		hasFreshReviewRequest: eventTypes.includes(
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED
		),
		hasFreshReviewDecision: eventTypes.includes(
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED
		),
		hasFreshReviewConsumeValidation: eventTypes.includes(
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED
		),
		hasFreshReviewRetrySaveConfirmation: eventTypes.includes(
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED
		),
		entriesRedacted: transcript.entriesRedacted,
		exposesRawContent: transcript.exposesRawContent,
		exposesProofInternals: transcript.exposesProofInternals,
		exposesActorIds: transcript.exposesActorIds,
		callsRest: transcript.callsRest,
		callsSave: transcript.callsSave,
		mutatesEditorContent: transcript.mutatesEditorContent,
		changesPostLock: transcript.changesPostLock,
		claimsSaved: transcript.claimsSaved,
	};
}

function getDistributedEditingActionTranscriptSupportLabel( eventType ) {
	return (
		DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_SUPPORT_LABELS[ eventType ] ||
		'Distributed Editing activity recorded'
	);
}

function getDistributedEditingActionTranscriptSupportChronologyStatus(
	summary
) {
	if ( ! summary.available ) {
		return 'none';
	}

	if ( summary.hasFreshReviewRetrySaveConfirmation ) {
		return 'fresh_review_guarded_save_confirmed';
	}

	if (
		summary.latestEventType ===
		DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED
	) {
		return 'guarded_save_confirmed';
	}

	if ( summary.hasFreshReviewConsumeValidation ) {
		return 'fresh_review_handoff_validated';
	}

	if ( summary.hasFreshReviewDecision ) {
		return 'fresh_review_decision_submitted';
	}

	if ( summary.hasFreshReviewRequest ) {
		return 'fresh_review_requested';
	}

	return 'activity_recorded';
}

function getDistributedEditingActionTranscriptSupportEventCountText( summary ) {
	const eventText =
		summary.itemCount === 1
			? '1 redacted transcript event'
			: `${ summary.itemCount } redacted transcript events`;

	if ( summary.droppedItemCount < 1 ) {
		return `Recorded ${ eventText }.`;
	}

	const droppedText =
		summary.droppedItemCount === 1
			? '1 unsafe entry was dropped'
			: `${ summary.droppedItemCount } unsafe entries were dropped`;

	return `Recorded ${ eventText }; ${ droppedText }.`;
}

/**
 * Returns a support-facing report for the current DE-RTC action transcript.
 * The report adds readable labels and chronology text to the redacted summary,
 * but remains content-free diagnostic communication rather than save authority.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Content-free action transcript support report.
 */
export function getDistributedEditingActionTranscriptSupportReportForSessionState(
	sessionState = {}
) {
	const summary =
		getDistributedEditingActionTranscriptSupportSummaryForSessionState(
			sessionState
		);
	const chronologyStatus =
		getDistributedEditingActionTranscriptSupportChronologyStatus( summary );

	return {
		status: summary.status,
		available: summary.available,
		headline: summary.available
			? 'Distributed Editing activity transcript report'
			: 'No Distributed Editing activity transcript report',
		summaryText: summary.available
			? getDistributedEditingActionTranscriptSupportEventCountText(
					summary
			  )
			: 'No redacted transcript events are available for support.',
		chronologyStatus,
		chronologyText:
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_SUPPORT_CHRONOLOGY_TEXT[
				chronologyStatus
			],
		latestEventLabel: summary.latestEventType
			? getDistributedEditingActionTranscriptSupportLabel(
					summary.latestEventType
			  )
			: null,
		timelineItemCount: summary.itemCount,
		droppedItemCount: summary.droppedItemCount,
		timelineItems: summary.items.map( ( item ) => ( {
			eventType: item.eventType,
			source: item.source,
			sequence: item.sequence,
			reasonCode: item.reasonCode,
			label: getDistributedEditingActionTranscriptSupportLabel(
				item.eventType
			),
			redacted: true,
		} ) ),
		canShareWithSupport:
			summary.entriesRedacted &&
			! summary.exposesRawContent &&
			! summary.exposesProofInternals &&
			! summary.exposesActorIds,
		requiresSaveAuthorityForPersistence: true,
		entriesRedacted: summary.entriesRedacted,
		exposesRawContent: summary.exposesRawContent,
		exposesProofInternals: summary.exposesProofInternals,
		exposesTokenMaterial: false,
		exposesActorIds: summary.exposesActorIds,
		dispatchesNotice: false,
		callsRest: summary.callsRest,
		callsSave: summary.callsSave,
		callsRetrySaveEndpoint: false,
		callsNormalSavePost: false,
		savesPost: false,
		mutatesEditorContent: summary.mutatesEditorContent,
		mutatesPersistedPostContent: false,
		createsRevision: false,
		changesPostLock: summary.changesPostLock,
		claimsSaved: summary.claimsSaved,
	};
}

function getDistributedEditingLocalUpdatesImportActionTranscriptReportFromPayload(
	payload = {}
) {
	const actionTranscriptSource = normalizeObject(
		getFirstDefined(
			payload.actionTranscriptSummary,
			payload.action_transcript_summary,
			payload.actionTranscriptReport,
			payload.action_transcript_report,
			payload.actionTranscript,
			payload.action_transcript
		)
	);
	const actionTranscriptItems = getFirstDefined(
		actionTranscriptSource.items,
		actionTranscriptSource.actionTranscriptItems,
		actionTranscriptSource.action_transcript_items,
		actionTranscriptSource.timelineItems,
		actionTranscriptSource.timeline_items,
		payload.actionTranscriptItems,
		payload.action_transcript_items
	);

	if ( ! Array.isArray( actionTranscriptItems ) ) {
		return null;
	}

	const actionTranscriptDroppedItemCount = getFirstDefined(
		actionTranscriptSource.droppedItemCount,
		actionTranscriptSource.dropped_item_count,
		actionTranscriptSource.actionTranscriptDroppedItemCount,
		actionTranscriptSource.action_transcript_dropped_item_count,
		payload.actionTranscriptDroppedItemCount,
		payload.action_transcript_dropped_item_count,
		0
	);
	const report =
		getDistributedEditingActionTranscriptSupportReportForSessionState( {
			actionTranscriptItems,
			actionTranscriptDroppedItemCount,
		} );

	return report.available ? report : null;
}

function normalizeDistributedEditingLocalUpdatesImportActionTranscriptReport(
	report
) {
	if ( ! report || typeof report !== 'object' ) {
		return null;
	}

	const normalized =
		getDistributedEditingLocalUpdatesImportActionTranscriptReportFromPayload(
			{
				actionTranscriptReport: report,
			}
		);

	return normalized?.available ? normalized : null;
}

function getDistributedEditingFreshReviewItemActionTranscriptReportContext(
	report
) {
	if ( ! report?.available || ! report.canShareWithSupport ) {
		return null;
	}

	return {
		available: true,
		chronologyStatus: normalizeNullableString( report.chronologyStatus ),
		latestEventLabel: normalizeNullableString( report.latestEventLabel ),
		timelineItemCount: normalizeCount( report.timelineItemCount ),
		droppedItemCount: normalizeCount( report.droppedItemCount ),
		canShareWithSupport: true,
		requiresSaveAuthorityForPersistence:
			report.requiresSaveAuthorityForPersistence !== false,
		entriesRedacted: report.entriesRedacted !== false,
		exposesRawContent: false,
		exposesProofInternals: false,
		exposesTokenMaterial: false,
		exposesActorIds: false,
		dispatchesNotice: false,
		callsRest: false,
		callsSave: false,
		callsRetrySaveEndpoint: false,
		callsNormalSavePost: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function getDistributedEditingFreshReviewItemsWithActionTranscriptReportContext(
	reviewItems,
	report
) {
	const actionTranscriptReportContext =
		getDistributedEditingFreshReviewItemActionTranscriptReportContext(
			report
		);

	return reviewItems.map( ( item ) => ( {
		...item,
		...getDistributedEditingFreshReviewItemAffordanceFields( item ),
		actionTranscriptReportContext,
		hasActionTranscriptReportContext: Boolean(
			actionTranscriptReportContext?.available
		),
		canShowActionTranscriptReportContext: Boolean(
			actionTranscriptReportContext?.available &&
				actionTranscriptReportContext.canShareWithSupport
		),
	} ) );
}

function getDistributedEditingFreshReviewItemAffordanceFields( item ) {
	const jumpToBlockAction =
		createDistributedEditingFreshReviewItemAffordanceDescriptor(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.JUMP_TO_FRESH_REVIEW_ITEM,
			item,
			{
				enabled: Boolean(
					item.blockClientId || item.blockPath?.length
				),
				reason:
					item.blockClientId || item.blockPath?.length
						? null
						: 'missing_block_target',
			}
		);
	const comparisonSurface =
		createDistributedEditingFreshReviewReadOnlyComparisonSurfaceDescriptor(
			item
		);
	const compareAction =
		createDistributedEditingFreshReviewItemAffordanceDescriptor(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.COMPARE_FRESH_REVIEW_ITEM,
			item,
			{
				enabled: Boolean(
					( item.baseContentHash && item.proposedContentHash ) ||
						comparisonSurface.canOpenComparisonSurface
				),
				reason:
					item.baseContentHash && item.proposedContentHash
						? null
						: comparisonSurface.reason || 'missing_hash_evidence',
				comparisonSurface,
			}
		);

	return {
		supportsJumpToBlock: true,
		supportsCompare: true,
		supportsComparePlan: true,
		canJumpToBlock: jumpToBlockAction.enabled,
		canCompare: compareAction.enabled,
		canShowComparePlan: Boolean( compareAction.comparePlan ),
		jumpToBlockAction,
		compareAction,
		affordanceActionDescriptors: [ jumpToBlockAction, compareAction ],
	};
}

function createDistributedEditingFreshReviewComparePlanDescriptor(
	item,
	{ enabled = true, reason = null } = {}
) {
	const hasBaseContentHash = Boolean( item.baseContentHash );
	const hasProposedContentHash = Boolean( item.proposedContentHash );
	const hasReviewedProposedContentHash = Boolean(
		item.reviewedProposedContentHash
	);
	const hashEvidenceFields = [
		hasBaseContentHash ? 'baseContentHash' : null,
		hasProposedContentHash ? 'proposedContentHash' : null,
		hasReviewedProposedContentHash ? 'reviewedProposedContentHash' : null,
	].filter( Boolean );
	const comparisonInputShape =
		createDistributedEditingFreshReviewComparisonInputShapeDescriptor(
			item,
			{
				enabled,
				reason,
				hasBaseContentHash,
				hasProposedContentHash,
				hasReviewedProposedContentHash,
			}
		);
	const comparisonSelectionHandoff =
		createDistributedEditingFreshReviewComparisonSelectionHandoffDescriptor(
			item,
			{
				enabled,
				reason,
				comparisonInputShape,
			}
		);
	const comparisonPreviewShell =
		createDistributedEditingFreshReviewComparisonPreviewShellDescriptor(
			item,
			{
				reason,
				comparisonInputShape,
				comparisonSelectionHandoff,
			}
		);
	const comparisonSurface =
		createDistributedEditingFreshReviewReadOnlyComparisonSurfaceDescriptor(
			item
		);

	return {
		status: enabled ? 'ready' : 'unavailable',
		reason: normalizeNullableString( reason ),
		itemId: normalizeNullableString( item.id ),
		blockClientId: normalizeNullableString( item.blockClientId ),
		blockName: normalizeNullableString( item.blockName ),
		blockLabel: normalizeNullableString( item.blockLabel ),
		changeKind: normalizeNullableString( item.changeKind ),
		evidenceType: 'hash_only_serialized_block_compare_plan',
		hashEvidenceFields,
		hasBaseContentHash,
		hasProposedContentHash,
		hasReviewedProposedContentHash,
		comparisonInputShape,
		comparisonSelectionHandoff,
		comparisonPreviewShell,
		comparisonSurface,
		usesBaseContentHash: hasBaseContentHash,
		usesProposedContentHash: hasProposedContentHash,
		usesReviewedProposedContentHash: hasReviewedProposedContentHash,
		supportsComparisonSelectionHandoff: true,
		supportsComparisonPreviewShell: true,
		supportsReadOnlyComparisonSurface: true,
		canSelectForFutureComparison:
			comparisonSelectionHandoff.canSelectForFutureComparison,
		canOpenComparisonPreviewShell:
			comparisonPreviewShell.canOpenComparisonPreviewShell,
		canOpenReadOnlyComparisonSurface:
			comparisonSurface.canOpenComparisonSurface,
		requiresFutureComparisonSurface:
			! comparisonSurface.canOpenComparisonSurface,
		descriptorOnly: ! comparisonSurface.canOpenComparisonSurface,
		hashValuesRedacted: true,
		exposesHashValues: false,
		rendersDiff: false,
		opensComparison: comparisonSurface.canOpenComparisonSurface,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		movesFocus: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesTokenMaterial: false,
		exposesUserIdentity: false,
		exposesReviewerIds: false,
	};
}

function createDistributedEditingFreshReviewReadOnlyComparisonSurfaceDescriptor(
	item = {}
) {
	const source = normalizeObject(
		getFirstDefined(
			item.readOnlyComparison,
			item.read_only_comparison,
			item.comparisonSurface,
			item.comparison_surface
		)
	);
	const contentKind =
		normalizeNullableString(
			getFirstDefined(
				source.contentKind,
				source.content_kind,
				item.comparisonContentKind,
				item.comparison_content_kind
			)
		) || 'safe_serialized_block';
	const privacyClass = normalizeNullableString(
		getFirstDefined(
			source.privacyClass,
			source.privacy_class,
			item.privacyClass,
			item.privacy_class
		)
	);
	const baseText = normalizeNullableContentString(
		getFirstDefined(
			source.baseText,
			source.base_text,
			source.baseSerializedBlock,
			source.base_serialized_block,
			item.comparisonBaseText,
			item.comparison_base_text,
			item.baseSerializedBlock,
			item.base_serialized_block
		)
	);
	const proposedText = normalizeNullableContentString(
		getFirstDefined(
			source.proposedText,
			source.proposed_text,
			source.proposedSerializedBlock,
			source.proposed_serialized_block,
			item.comparisonProposedText,
			item.comparison_proposed_text,
			item.proposedSerializedBlock,
			item.proposed_serialized_block
		)
	);
	const safeForDisplay = Boolean(
		getFirstDefined(
			source.safeForDisplay,
			source.safe_for_display,
			item.comparisonSafeForDisplay,
			item.comparison_safe_for_display,
			item.safeComparisonContent,
			item.safe_comparison_content,
			privacyClass === 'synthetic-content'
		)
	);
	const supportedContentKind = [
		'plain_text_serialized_block',
		'safe_plain_text',
		'safe_serialized_block',
		'synthetic_safe_serialized_block',
	].includes( contentKind );
	const hasComparisonText = baseText !== null && proposedText !== null;
	const canOpenComparisonSurface = Boolean(
		safeForDisplay && supportedContentKind && hasComparisonText
	);
	let reason = null;

	if ( ! canOpenComparisonSurface ) {
		reason =
			! supportedContentKind || ! safeForDisplay
				? 'unsupported_comparison_boundary'
				: 'missing_comparison_content';
	}

	return {
		status: canOpenComparisonSurface ? 'ready' : 'unavailable',
		reason,
		schemaVersion: 1,
		surfaceKind: 'fresh_review_read_only_comparison_surface',
		mode: 'read_only_side_by_side_block_review',
		itemId: normalizeNullableString( item.id ),
		blockClientId: normalizeNullableString( item.blockClientId ),
		blockName: normalizeNullableString( item.blockName ),
		blockLabel: normalizeNullableString( item.blockLabel ),
		changeKind: normalizeNullableString( item.changeKind ),
		contentKind,
		privacyClass,
		baseLabel: 'Base version',
		proposedLabel: 'Proposed version',
		baseText: canOpenComparisonSurface ? baseText : null,
		proposedText: canOpenComparisonSurface ? proposedText : null,
		baseTextAvailable: canOpenComparisonSurface,
		proposedTextAvailable: canOpenComparisonSurface,
		safeForDisplay,
		safeSerializedBlocksAvailable: canOpenComparisonSurface,
		canOpenComparisonSurface,
		readOnly: true,
		renderable: canOpenComparisonSurface,
		rendersDiff: false,
		derivesPatch: false,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		movesFocus: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
		rawContentIncluded: false,
		exposesHashValues: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesTokenMaterial: false,
		exposesUserIdentity: false,
		exposesReviewerIds: false,
	};
}

function createDistributedEditingFreshReviewComparisonPreviewShellDescriptor(
	item,
	{
		reason = null,
		comparisonInputShape = null,
		comparisonSelectionHandoff = null,
	} = {}
) {
	const requiredInputsAvailable = Boolean(
		comparisonInputShape?.requiredInputsAvailable
	);
	const optionalInputsAvailable = Boolean(
		comparisonInputShape?.optionalInputsAvailable
	);
	const normalizedReason = normalizeNullableString( reason );
	const renderRequirementKeys = [
		'base_serialized_block_content',
		'proposed_serialized_block_content',
		'boundary_safe_diff_renderer',
		'human_review_controls',
	];
	const optionalRenderRequirementKeys = [
		'reviewed_serialized_block_content',
	];
	const boundaryKinds = comparisonInputShape?.boundaryKinds || [
		'serialized_block',
		'html_token',
		'json_token',
		'unicode_scalar',
		'rich_text_attribute',
	];
	const itemIdentity = {
		itemId: normalizeNullableString( item.id ),
		blockClientId: normalizeNullableString( item.blockClientId ),
		blockName: normalizeNullableString( item.blockName ),
		blockLabel: normalizeNullableString( item.blockLabel ),
		changeKind: normalizeNullableString( item.changeKind ),
	};
	const previewShell = {
		status: 'disabled_until_renderer_turn',
		reason: normalizedReason || 'comparison_renderer_not_enabled',
		schemaVersion: 1,
		shellKind: 'fresh_review_side_by_side_preview_shell',
		previewMode: 'side_by_side_block_review',
		rendererStatus: 'not_registered',
		...itemIdentity,
		inputKind:
			comparisonInputShape?.inputKind ||
			'fresh_review_serialized_block_comparison_inputs',
		selectionHandoffKind:
			comparisonSelectionHandoff?.handoffKind ||
			'fresh_review_comparison_selection_readiness',
		requiredInputRoles: comparisonInputShape?.requiredInputRoles || [
			'base',
			'proposed',
		],
		optionalInputRoles: comparisonInputShape?.optionalInputRoles || [
			'reviewed',
		],
		renderRequirementKeys,
		optionalRenderRequirementKeys,
		boundaryPolicy:
			comparisonInputShape?.boundaryPolicy ||
			'serialized_block_hash_only',
		boundaryKinds,
		requiredInputsAvailable,
		optionalInputsAvailable,
		readyForFutureComparisonSelection: Boolean(
			comparisonSelectionHandoff?.readyForFutureComparisonSelection
		),
		disabledByDefault: true,
		requiresFutureRenderer: true,
		requiresExplicitRendererTurn: true,
		canOpenComparisonPreviewShell: false,
		renderable: false,
		previewShellOnly: true,
		descriptorOnly: true,
		statusOnly: true,
		redacted: true,
		hashValuesRedacted: true,
		sourceFieldNamesOnly: true,
		rawContentIncluded: false,
		exposesHashValues: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesTokenMaterial: false,
		exposesUserIdentity: false,
		exposesReviewerIds: false,
		rendersPreview: false,
		rendersDiff: false,
		computesDiff: false,
		opensComparison: false,
		opensPanel: false,
		derivesPatch: false,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		selectsReviewItem: false,
		marksSelected: false,
		movesFocus: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
	const rendererReadiness =
		createDistributedEditingFreshReviewComparisonRendererReadinessDescriptor(
			previewShell,
			{
				candidateRendererCapabilityMap:
					item.rendererCapabilityCandidateMap ||
					item.renderer_capability_candidate_map ||
					{},
			}
		);

	return {
		...previewShell,
		rendererReadiness,
		hasRendererReadiness: true,
		canShowRendererReadiness: true,
		supportReport:
			createDistributedEditingFreshReviewComparisonPreviewShellSupportReportDescriptor(
				previewShell,
				rendererReadiness
			),
		hasSupportReport: true,
		canShowSupportReport: true,
	};
}

const DISTRIBUTED_EDITING_FRESH_REVIEW_COMPARISON_REQUIRED_RENDERER_CAPABILITY_KEYS =
	[ 'boundary_safe_diff_renderer', 'human_review_controls' ];

/**
 * Resolves future fresh-review comparison renderer capabilities without
 * registering, activating, or rendering a comparison renderer.
 *
 * @param {Object} options                                Resolver options.
 * @param {Object} options.candidateRendererCapabilityMap Candidate capability map.
 * @param {Array}  options.requiredRendererCapabilityKeys Required capability keys.
 *
 * @return {Object} Content-free renderer capability resolution.
 */
export function getDistributedEditingFreshReviewComparisonRendererCapabilityResolution( {
	candidateRendererCapabilityMap = {},
	requiredRendererCapabilityKeys = DISTRIBUTED_EDITING_FRESH_REVIEW_COMPARISON_REQUIRED_RENDERER_CAPABILITY_KEYS,
} = {} ) {
	const candidateMap =
		candidateRendererCapabilityMap &&
		typeof candidateRendererCapabilityMap === 'object' &&
		! Array.isArray( candidateRendererCapabilityMap )
			? candidateRendererCapabilityMap
			: {};
	const requiredKeys = Array.isArray( requiredRendererCapabilityKeys )
		? requiredRendererCapabilityKeys.filter( Boolean )
		: DISTRIBUTED_EDITING_FRESH_REVIEW_COMPARISON_REQUIRED_RENDERER_CAPABILITY_KEYS;
	const candidateCapabilityKeys = Object.keys( candidateMap ).filter(
		( key ) => Boolean( candidateMap[ key ] )
	);
	const presentRendererCapabilityKeys = requiredKeys.filter( ( key ) =>
		Boolean( candidateMap[ key ] )
	);
	const missingRendererCapabilityKeys = requiredKeys.filter(
		( key ) => ! Boolean( candidateMap[ key ] )
	);
	const unknownCandidateRendererCapabilityCount =
		candidateCapabilityKeys.filter(
			( key ) => ! requiredKeys.includes( key )
		).length;
	const allRequiredRendererCapabilitiesPresent =
		requiredKeys.length > 0 && missingRendererCapabilityKeys.length === 0;
	let status = 'missing_required_capabilities';
	let reason = 'missing_all_required_capabilities';

	if ( allRequiredRendererCapabilitiesPresent ) {
		status = 'complete_but_disabled';
		reason = 'renderer_disabled_until_explicit_renderer_turn';
	} else if ( presentRendererCapabilityKeys.length > 0 ) {
		status = 'partial_required_capabilities';
		reason = 'missing_some_required_capabilities';
	}

	return {
		status,
		reason,
		available: true,
		schemaVersion: 1,
		resolverKind: 'fresh_review_comparison_renderer_capability_resolver',
		requiredRendererCapabilityKeys: requiredKeys,
		requiredRendererCapabilityCount: requiredKeys.length,
		presentRendererCapabilityKeys,
		presentRendererCapabilityCount: presentRendererCapabilityKeys.length,
		missingRendererCapabilityKeys,
		missingRendererCapabilityCount: missingRendererCapabilityKeys.length,
		candidateRendererCapabilityKeyCount: candidateCapabilityKeys.length,
		unknownCandidateRendererCapabilityCount,
		allRequiredRendererCapabilitiesPresent,
		rendererCapabilitiesComplete: allRequiredRendererCapabilitiesPresent,
		completeButDisabled: allRequiredRendererCapabilitiesPresent,
		candidateMapAccepted: true,
		candidateMapStored: false,
		rendererDisabledAfterResolution: true,
		canRegisterRenderer: false,
		registersRenderer: false,
		hasRegisteredRenderer: false,
		activatesRenderer: false,
		canMakePreviewShellRenderable: false,
		renderable: false,
		resolverOnly: true,
		descriptorOnly: true,
		statusOnly: true,
		redacted: true,
		hashValuesRedacted: true,
		sourceFieldNamesOnly: false,
		rawContentIncluded: false,
		exposesHashValues: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesTokenMaterial: false,
		exposesUserIdentity: false,
		exposesReviewerIds: false,
		exposesActorIds: false,
		rendersPreview: false,
		rendersDiff: false,
		computesDiff: false,
		opensComparison: false,
		opensPanel: false,
		derivesPatch: false,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		selectsReviewItem: false,
		marksSelected: false,
		movesFocus: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

/**
 * Summarizes fresh-review comparison renderer capability resolution for
 * support/export diagnostics without retaining candidate maps or unknown keys.
 *
 * @param {Object} options                                 Summary options.
 * @param {Array}  options.candidateRendererCapabilityMaps Candidate maps.
 * @param {Array}  options.capabilityResolutions           Existing resolutions.
 *
 * @return {Object} Redacted renderer capability support summary.
 */
export function getDistributedEditingFreshReviewComparisonRendererCapabilitySupportSummary( {
	candidateRendererCapabilityMaps = [],
	capabilityResolutions = [],
} = {} ) {
	const resolutions = [
		...( Array.isArray( capabilityResolutions )
			? capabilityResolutions.filter( Boolean )
			: [] ),
		...( Array.isArray( candidateRendererCapabilityMaps )
			? candidateRendererCapabilityMaps.map(
					( candidateRendererCapabilityMap ) =>
						getDistributedEditingFreshReviewComparisonRendererCapabilityResolution(
							{
								candidateRendererCapabilityMap,
							}
						)
			  )
			: [] ),
	];
	const summary = resolutions.reduce(
		( counts, resolution ) => {
			const status = normalizeNullableString( resolution?.status );

			if ( status === 'missing_required_capabilities' ) {
				counts.missingRequiredCapabilitiesCount += 1;
			} else if ( status === 'partial_required_capabilities' ) {
				counts.partialRequiredCapabilitiesCount += 1;
			} else if ( status === 'complete_but_disabled' ) {
				counts.completeButDisabledCount += 1;
			} else {
				counts.unavailableResolutionCount += 1;
			}

			counts.presentRendererCapabilityCount += normalizeCount(
				resolution?.presentRendererCapabilityCount
			);
			counts.missingRendererCapabilityCount += normalizeCount(
				resolution?.missingRendererCapabilityCount
			);
			counts.unknownCandidateRendererCapabilityCount += normalizeCount(
				resolution?.unknownCandidateRendererCapabilityCount
			);
			counts.candidateRendererCapabilityKeyCount += normalizeCount(
				resolution?.candidateRendererCapabilityKeyCount
			);

			return counts;
		},
		{
			missingRequiredCapabilitiesCount: 0,
			partialRequiredCapabilitiesCount: 0,
			completeButDisabledCount: 0,
			unavailableResolutionCount: 0,
			presentRendererCapabilityCount: 0,
			missingRendererCapabilityCount: 0,
			unknownCandidateRendererCapabilityCount: 0,
			candidateRendererCapabilityKeyCount: 0,
		}
	);
	const resolutionCount = resolutions.length;

	return {
		status: resolutionCount > 0 ? 'available' : 'none',
		available: resolutionCount > 0,
		schemaVersion: 1,
		summaryKind:
			'fresh_review_comparison_renderer_capability_support_summary',
		headline: 'Fresh-review renderer capability support summary',
		summaryText:
			resolutionCount > 0
				? 'Renderer capability classifications are summarized for support without candidate maps, unknown key names, raw content, hash values, validation details, tokens, identities, or renderer code.'
				: 'No renderer capability classifications are available for support.',
		requiredRendererCapabilityKeys:
			DISTRIBUTED_EDITING_FRESH_REVIEW_COMPARISON_REQUIRED_RENDERER_CAPABILITY_KEYS,
		requiredRendererCapabilityCount:
			DISTRIBUTED_EDITING_FRESH_REVIEW_COMPARISON_REQUIRED_RENDERER_CAPABILITY_KEYS.length,
		resolutionCount,
		candidateMapCount: resolutionCount,
		missingRequiredCapabilitiesCount:
			summary.missingRequiredCapabilitiesCount,
		partialRequiredCapabilitiesCount:
			summary.partialRequiredCapabilitiesCount,
		completeButDisabledCount: summary.completeButDisabledCount,
		unavailableResolutionCount: summary.unavailableResolutionCount,
		presentRendererCapabilityCount: summary.presentRendererCapabilityCount,
		missingRendererCapabilityCount: summary.missingRendererCapabilityCount,
		unknownCandidateRendererCapabilityCount:
			summary.unknownCandidateRendererCapabilityCount,
		candidateRendererCapabilityKeyCount:
			summary.candidateRendererCapabilityKeyCount,
		hasMissingRequiredCapabilities:
			summary.missingRequiredCapabilitiesCount > 0,
		hasPartialRequiredCapabilities:
			summary.partialRequiredCapabilitiesCount > 0,
		hasCompleteButDisabledCapabilities:
			summary.completeButDisabledCount > 0,
		allCompleteButDisabled:
			resolutionCount > 0 &&
			summary.completeButDisabledCount === resolutionCount,
		aggregateOnly: true,
		resolverOnly: true,
		descriptorOnly: true,
		statusOnly: true,
		redacted: true,
		hashValuesRedacted: true,
		candidateMapsStored: false,
		unknownCandidateKeyNamesIncluded: false,
		rendererCodeIncluded: false,
		rawContentIncluded: false,
		exposesHashValues: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesTokenMaterial: false,
		exposesUserIdentity: false,
		exposesReviewerIds: false,
		exposesActorIds: false,
		canShareWithSupport: true,
		supportExportReady: true,
		supportBundleSafe: true,
		supportDiagnosticsOnly: true,
		requiresFutureRenderer: true,
		requiresExplicitRendererTurn: true,
		registersRenderer: false,
		hasRegisteredRenderer: false,
		activatesRenderer: false,
		renderable: false,
		rendersPreview: false,
		rendersDiff: false,
		computesDiff: false,
		opensComparison: false,
		opensPanel: false,
		derivesPatch: false,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		selectsReviewItem: false,
		marksSelected: false,
		movesFocus: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function createDistributedEditingFreshReviewComparisonRendererReadinessDescriptor(
	previewShell,
	{ candidateRendererCapabilityMap = {} } = {}
) {
	const capabilityResolution =
		getDistributedEditingFreshReviewComparisonRendererCapabilityResolution(
			{
				candidateRendererCapabilityMap,
			}
		);
	const requiredRendererCapabilityKeys =
		capabilityResolution.requiredRendererCapabilityKeys;

	return {
		status: 'disabled_until_renderer_capabilities_registered',
		reason: 'comparison_renderer_capabilities_not_registered',
		available: true,
		schemaVersion: 1,
		registryEntryKind: 'fresh_review_comparison_renderer_readiness',
		registryEntryStatus: 'disabled',
		registryEntryEnabled: false,
		registryEntryDisabledReason:
			'comparison_renderer_capabilities_not_registered',
		rendererId: 'fresh_review_side_by_side_block_comparison_renderer',
		rendererRegistryScope: 'editor_fresh_review_comparison_preview_shell',
		shellStatus: previewShell.status,
		shellReason: previewShell.reason,
		shellKind: previewShell.shellKind,
		previewMode: previewShell.previewMode,
		rendererStatus: previewShell.rendererStatus || 'not_registered',
		registrationStatus: 'not_registered',
		capabilityRegistrationStatus: capabilityResolution.status,
		capabilityRegistrationReason: capabilityResolution.reason,
		requiredRendererCapabilityKeys,
		requiredRendererCapabilityCount:
			capabilityResolution.requiredRendererCapabilityCount,
		registeredRendererCapabilityKeys: [],
		registeredRendererCapabilityCount: 0,
		presentRendererCapabilityKeys:
			capabilityResolution.presentRendererCapabilityKeys,
		presentRendererCapabilityCount:
			capabilityResolution.presentRendererCapabilityCount,
		missingRendererCapabilityKeys:
			capabilityResolution.missingRendererCapabilityKeys,
		missingRendererCapabilityCount:
			capabilityResolution.missingRendererCapabilityCount,
		candidateRendererCapabilityKeyCount:
			capabilityResolution.candidateRendererCapabilityKeyCount,
		unknownCandidateRendererCapabilityCount:
			capabilityResolution.unknownCandidateRendererCapabilityCount,
		allRequiredRendererCapabilitiesPresent:
			capabilityResolution.allRequiredRendererCapabilitiesPresent,
		rendererCapabilitiesComplete:
			capabilityResolution.rendererCapabilitiesComplete,
		completeButDisabled: capabilityResolution.completeButDisabled,
		capabilityResolution,
		hasCapabilityResolution: true,
		canShowCapabilityResolution: true,
		optionalRendererCapabilityKeys: [],
		optionalRendererCapabilityCount: 0,
		satisfiedRendererCapabilityKeys: [],
		satisfiedRendererCapabilityCount: 0,
		rendererRegistrationRequired: true,
		requiresBoundarySafeDiffRenderer: true,
		requiresHumanReviewControls: true,
		disabledByDefault: true,
		requiresFutureRenderer: true,
		requiresExplicitRendererTurn: true,
		canRegisterRenderer: false,
		registersRenderer: false,
		hasRegisteredRenderer: false,
		activatesRenderer: false,
		canMakePreviewShellRenderable: false,
		renderable: false,
		descriptorOnly: true,
		statusOnly: true,
		redacted: true,
		hashValuesRedacted: true,
		sourceFieldNamesOnly: false,
		rawContentIncluded: false,
		exposesHashValues: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesTokenMaterial: false,
		exposesUserIdentity: false,
		exposesReviewerIds: false,
		exposesActorIds: false,
		rendersPreview: false,
		rendersDiff: false,
		computesDiff: false,
		opensComparison: false,
		opensPanel: false,
		derivesPatch: false,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		selectsReviewItem: false,
		marksSelected: false,
		movesFocus: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function createDistributedEditingFreshReviewComparisonPreviewShellSupportReportDescriptor(
	previewShell,
	rendererReadiness = null
) {
	const itemIdentity = {
		itemId: normalizeNullableString( previewShell.itemId ),
		blockClientId: normalizeNullableString( previewShell.blockClientId ),
		blockName: normalizeNullableString( previewShell.blockName ),
		blockLabel: normalizeNullableString( previewShell.blockLabel ),
		changeKind: normalizeNullableString( previewShell.changeKind ),
	};
	const availableItemIdentityFields = Object.keys( itemIdentity ).filter(
		( key ) => itemIdentity[ key ] !== null
	);
	const missingFutureRendererPieceKeys = [
		'boundary_safe_diff_renderer',
		'human_review_controls',
	];
	const rendererCapabilitySupportSummary =
		getDistributedEditingFreshReviewComparisonRendererCapabilitySupportSummary(
			{
				capabilityResolutions: rendererReadiness?.capabilityResolution
					? [ rendererReadiness.capabilityResolution ]
					: [],
			}
		);

	return {
		status: 'available',
		available: true,
		schemaVersion: 1,
		reportKind: 'fresh_review_comparison_preview_shell_support_report',
		headline: 'Fresh-review comparison preview shell support report',
		summaryText:
			'Preview shell is disabled until a renderer turn registers boundary-safe diff rendering and review controls.',
		shellStatus: previewShell.status,
		shellReason: previewShell.reason,
		shellKind: previewShell.shellKind,
		previewMode: previewShell.previewMode,
		rendererStatus: previewShell.rendererStatus,
		itemIdentity,
		availableItemIdentityFields,
		itemIdentityFieldCount: availableItemIdentityFields.length,
		requiredInputRoles: previewShell.requiredInputRoles || [],
		optionalInputRoles: previewShell.optionalInputRoles || [],
		requiredInputsAvailable: Boolean(
			previewShell.requiredInputsAvailable
		),
		optionalInputsAvailable: Boolean(
			previewShell.optionalInputsAvailable
		),
		renderRequirementKeys: previewShell.renderRequirementKeys || [],
		optionalRenderRequirementKeys:
			previewShell.optionalRenderRequirementKeys || [],
		missingFutureRendererPieceKeys,
		missingFutureRendererPieceCount: missingFutureRendererPieceKeys.length,
		rendererReadinessStatus: rendererReadiness?.status || null,
		rendererReadinessRegistrationStatus:
			rendererReadiness?.registrationStatus || null,
		rendererReadinessCapabilityStatus:
			rendererReadiness?.capabilityRegistrationStatus || null,
		rendererCapabilityResolutionStatus:
			rendererReadiness?.capabilityResolution?.status || null,
		rendererCapabilityResolutionReason:
			rendererReadiness?.capabilityResolution?.reason || null,
		presentRendererCapabilityKeys:
			rendererReadiness?.presentRendererCapabilityKeys || [],
		presentRendererCapabilityCount:
			rendererReadiness?.presentRendererCapabilityCount || 0,
		missingRendererCapabilityKeys:
			rendererReadiness?.missingRendererCapabilityKeys || [],
		missingRendererCapabilityCount:
			rendererReadiness?.missingRendererCapabilityCount || 0,
		unknownCandidateRendererCapabilityCount:
			rendererReadiness?.unknownCandidateRendererCapabilityCount || 0,
		rendererCapabilitiesComplete: Boolean(
			rendererReadiness?.rendererCapabilitiesComplete
		),
		rendererCapabilityResolutionResolverOnly: Boolean(
			rendererReadiness?.capabilityResolution?.resolverOnly
		),
		rendererCapabilitySupportSummary,
		hasRendererCapabilitySupportSummary: Boolean(
			rendererCapabilitySupportSummary.available
		),
		canShowRendererCapabilitySupportSummary: Boolean(
			rendererCapabilitySupportSummary.available &&
				rendererCapabilitySupportSummary.canShareWithSupport
		),
		rendererCapabilitySupportSummaryStatus:
			rendererCapabilitySupportSummary.status,
		rendererCapabilitySupportSummaryResolutionCount:
			rendererCapabilitySupportSummary.resolutionCount,
		rendererCapabilitySupportSummaryMissingCount:
			rendererCapabilitySupportSummary.missingRequiredCapabilitiesCount,
		rendererCapabilitySupportSummaryPartialCount:
			rendererCapabilitySupportSummary.partialRequiredCapabilitiesCount,
		rendererCapabilitySupportSummaryCompleteButDisabledCount:
			rendererCapabilitySupportSummary.completeButDisabledCount,
		rendererCapabilitySupportSummaryUnknownCandidateCount:
			rendererCapabilitySupportSummary.unknownCandidateRendererCapabilityCount,
		rendererCapabilitySupportSummaryCandidateMapsStored:
			rendererCapabilitySupportSummary.candidateMapsStored,
		rendererCapabilitySupportSummaryUnknownNamesIncluded:
			rendererCapabilitySupportSummary.unknownCandidateKeyNamesIncluded,
		rendererCapabilitySupportSummaryRendererCodeIncluded:
			rendererCapabilitySupportSummary.rendererCodeIncluded,
		rendererCapabilitySupportSummaryResolverOnly:
			rendererCapabilitySupportSummary.resolverOnly,
		rendererReadinessRegistersRenderer: Boolean(
			rendererReadiness?.registersRenderer
		),
		rendererReadinessRenderable: Boolean( rendererReadiness?.renderable ),
		boundaryPolicy: previewShell.boundaryPolicy,
		boundaryKinds: previewShell.boundaryKinds || [],
		boundaryKindCount: previewShell.boundaryKinds?.length || 0,
		canShareWithSupport: true,
		supportExportReady: true,
		supportBundleSafe: true,
		supportDiagnosticsOnly: true,
		requiresFutureRenderer: true,
		requiresExplicitRendererTurn: true,
		canOpenComparisonPreviewShell: Boolean(
			previewShell.canOpenComparisonPreviewShell
		),
		renderable: Boolean( previewShell.renderable ),
		descriptorOnly: true,
		redacted: true,
		hashValuesRedacted: true,
		sourceFieldNamesOnly: false,
		rawContentIncluded: false,
		exposesHashValues: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesTokenMaterial: false,
		exposesUserIdentity: false,
		exposesReviewerIds: false,
		exposesActorIds: false,
		rendersPreview: false,
		rendersDiff: false,
		computesDiff: false,
		opensComparison: false,
		opensPanel: false,
		derivesPatch: false,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		selectsReviewItem: false,
		marksSelected: false,
		movesFocus: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function createDistributedEditingFreshReviewComparisonSelectionHandoffDescriptor(
	item,
	{ enabled = true, reason = null, comparisonInputShape = null } = {}
) {
	const requiredInputsAvailable = Boolean(
		comparisonInputShape?.requiredInputsAvailable
	);
	const optionalInputsAvailable = Boolean(
		comparisonInputShape?.optionalInputsAvailable
	);
	const canSelectForFutureComparison = Boolean(
		enabled && requiredInputsAvailable
	);
	const normalizedReason = normalizeNullableString( reason );

	return {
		status: canSelectForFutureComparison ? 'ready_to_select' : 'not_ready',
		reason: canSelectForFutureComparison
			? null
			: normalizedReason || 'missing_required_comparison_inputs',
		schemaVersion: 1,
		handoffKind: 'fresh_review_comparison_selection_readiness',
		selectionTarget: 'fresh_review_review_item',
		comparisonMode:
			comparisonInputShape?.comparisonMode || 'side_by_side_block_review',
		inputKind:
			comparisonInputShape?.inputKind ||
			'fresh_review_serialized_block_comparison_inputs',
		itemId: normalizeNullableString( item.id ),
		blockClientId: normalizeNullableString( item.blockClientId ),
		blockName: normalizeNullableString( item.blockName ),
		blockLabel: normalizeNullableString( item.blockLabel ),
		changeKind: normalizeNullableString( item.changeKind ),
		requiredInputRoles: comparisonInputShape?.requiredInputRoles || [
			'base',
			'proposed',
		],
		optionalInputRoles: comparisonInputShape?.optionalInputRoles || [
			'reviewed',
		],
		requiredInputsAvailable,
		optionalInputsAvailable,
		canSelectForFutureComparison,
		readyForFutureComparisonSelection: canSelectForFutureComparison,
		futureSelectionOnly: true,
		requiresUserCommandBeforeSelection: true,
		descriptorOnly: true,
		statusOnly: true,
		redacted: true,
		hashValuesRedacted: true,
		sourceFieldNamesOnly: true,
		rawContentIncluded: false,
		exposesHashValues: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesTokenMaterial: false,
		exposesUserIdentity: false,
		exposesReviewerIds: false,
		rendersDiff: false,
		opensComparison: false,
		opensPanel: false,
		derivesPatch: false,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		selectsReviewItem: false,
		marksSelected: false,
		movesFocus: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function createDistributedEditingFreshReviewComparisonInputShapeDescriptor(
	item,
	{
		enabled = true,
		reason = null,
		hasBaseContentHash = false,
		hasProposedContentHash = false,
		hasReviewedProposedContentHash = false,
	} = {}
) {
	const inputSlots = [
		createDistributedEditingFreshReviewComparisonInputSlotDescriptor( {
			role: 'base',
			sourceField: 'baseContentHash',
			required: true,
			available: hasBaseContentHash,
		} ),
		createDistributedEditingFreshReviewComparisonInputSlotDescriptor( {
			role: 'proposed',
			sourceField: 'proposedContentHash',
			required: true,
			available: hasProposedContentHash,
		} ),
		createDistributedEditingFreshReviewComparisonInputSlotDescriptor( {
			role: 'reviewed',
			sourceField: 'reviewedProposedContentHash',
			required: false,
			available: hasReviewedProposedContentHash,
		} ),
	];
	const availableInputRoles = inputSlots
		.filter( ( slot ) => slot.available )
		.map( ( slot ) => slot.role );
	const requiredInputRoles = inputSlots
		.filter( ( slot ) => slot.required )
		.map( ( slot ) => slot.role );
	const optionalInputRoles = inputSlots
		.filter( ( slot ) => ! slot.required )
		.map( ( slot ) => slot.role );

	return {
		status: enabled ? 'ready' : 'unavailable',
		reason: normalizeNullableString( reason ),
		schemaVersion: 1,
		inputKind: 'fresh_review_serialized_block_comparison_inputs',
		comparisonMode: 'side_by_side_block_review',
		itemId: normalizeNullableString( item.id ),
		blockClientId: normalizeNullableString( item.blockClientId ),
		blockName: normalizeNullableString( item.blockName ),
		blockLabel: normalizeNullableString( item.blockLabel ),
		changeKind: normalizeNullableString( item.changeKind ),
		inputSlots,
		availableInputRoles,
		requiredInputRoles,
		optionalInputRoles,
		requiredInputsAvailable: hasBaseContentHash && hasProposedContentHash,
		optionalInputsAvailable: hasReviewedProposedContentHash,
		boundaryPolicy: 'serialized_block_hash_only',
		boundaryKinds: [
			'serialized_block',
			'html_token',
			'json_token',
			'unicode_scalar',
			'rich_text_attribute',
		],
		usesSerializedBlockBoundaries: true,
		usesHashEvidenceOnly: true,
		descriptorOnly: true,
		redacted: true,
		hashValuesRedacted: true,
		sourceFieldNamesOnly: true,
		rawContentIncluded: false,
		exposesHashValues: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesTokenMaterial: false,
		exposesUserIdentity: false,
		exposesReviewerIds: false,
		rendersDiff: false,
		opensComparison: false,
		derivesPatch: false,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		movesFocus: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function createDistributedEditingFreshReviewComparisonInputSlotDescriptor( {
	role,
	sourceField,
	required = false,
	available = false,
} ) {
	return {
		role,
		sourceField,
		required: Boolean( required ),
		available: Boolean( available ),
		evidenceType: 'hash_field_reference',
		hashValueRedacted: true,
		rawContentIncluded: false,
		exposesHashValue: false,
		exposesRawContent: false,
	};
}

function createDistributedEditingFreshReviewItemAffordanceDescriptor(
	actionKey,
	item,
	{ enabled = true, reason = null, comparisonSurface = null } = {}
) {
	const reportsCommandStatus = [
		DISTRIBUTED_EDITING_NOTICE_ACTIONS.JUMP_TO_FRESH_REVIEW_ITEM,
		DISTRIBUTED_EDITING_NOTICE_ACTIONS.COMPARE_FRESH_REVIEW_ITEM,
	].includes( actionKey );
	let commandStatus = null;

	if (
		actionKey ===
		DISTRIBUTED_EDITING_NOTICE_ACTIONS.JUMP_TO_FRESH_REVIEW_ITEM
	) {
		commandStatus = enabled
			? 'jump-target-available'
			: 'jump-target-unavailable';
	} else if (
		actionKey ===
		DISTRIBUTED_EDITING_NOTICE_ACTIONS.COMPARE_FRESH_REVIEW_ITEM
	) {
		commandStatus = enabled
			? 'compare-evidence-available'
			: 'compare-evidence-unavailable';
	}

	const comparePlan =
		actionKey ===
		DISTRIBUTED_EDITING_NOTICE_ACTIONS.COMPARE_FRESH_REVIEW_ITEM
			? createDistributedEditingFreshReviewComparePlanDescriptor( item, {
					enabled,
					reason,
			  } )
			: null;
	const readOnlyComparisonSurface =
		actionKey ===
		DISTRIBUTED_EDITING_NOTICE_ACTIONS.COMPARE_FRESH_REVIEW_ITEM
			? comparisonSurface ||
			  createDistributedEditingFreshReviewReadOnlyComparisonSurfaceDescriptor(
					item
			  )
			: null;
	const canOpenReadOnlyComparisonSurface = Boolean(
		readOnlyComparisonSurface?.canOpenComparisonSurface
	);

	return {
		actionKey,
		enabled: Boolean( enabled ),
		itemId: normalizeNullableString( item.id ),
		blockClientId: normalizeNullableString( item.blockClientId ),
		blockName: normalizeNullableString( item.blockName ),
		blockLabel: normalizeNullableString( item.blockLabel ),
		blockPath: item.blockPath,
		changeKind: normalizeNullableString( item.changeKind ),
		riskReason: normalizeNullableString( item.riskReason ),
		baseContentHash: normalizeNullableString( item.baseContentHash ),
		proposedContentHash: normalizeNullableString(
			item.proposedContentHash
		),
		reviewedProposedContentHash: normalizeNullableString(
			item.reviewedProposedContentHash
		),
		reason: normalizeNullableString( reason ),
		placement:
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
		descriptorOnly:
			actionKey ===
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.COMPARE_FRESH_REVIEW_ITEM
				? ! canOpenReadOnlyComparisonSurface
				: true,
		reportsCommandStatus,
		commandStatus,
		commandStatusPlacement: reportsCommandStatus
			? 'fresh_review_decision_panel'
			: null,
		comparePlan,
		comparisonSurface: readOnlyComparisonSurface,
		canOpenReadOnlyComparisonSurface,
		callsRestEndpoint: false,
		callsSave: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		savesPost: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		selectsBlock: false,
		movesFocus: false,
		opensComparison: canOpenReadOnlyComparisonSurface,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
		exposesRawContent: false,
		exposesProofSignature: false,
		exposesReviewerIds: false,
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
	const hasProtectedLocalChanges = Boolean(
		normalized.hasPendingChanges ||
			normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates
	);
	const hasConfirmedRetrySaveWithoutProtectedLocalChanges =
		hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
			normalized
		) && ! hasProtectedLocalChanges;
	const requiresFreshReview = Boolean(
		normalized.localUpdatesImportRequiresFreshReview &&
			! hasConfirmedRetrySaveWithoutProtectedLocalChanges
	);
	const actionTranscriptReport = requiresFreshReview
		? normalized.localUpdatesImportActionTranscriptReport
		: null;

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
		actionTranscriptReport,
		hasActionTranscriptReport: Boolean( actionTranscriptReport?.available ),
		canShowActionTranscriptReport: Boolean(
			actionTranscriptReport?.available &&
				actionTranscriptReport.canShareWithSupport
		),
		canExportLocalUpdates:
			requiresFreshReview && normalized.canExportLocalUpdates,
		hasProtectedLocalChanges,
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
	const actionTranscriptReport =
		normalized.localUpdatesImportActionTranscriptReport;
	const reviewItems =
		getDistributedEditingFreshReviewItemsWithActionTranscriptReportContext(
			normalized.localUpdatesImportFreshReviewDecisionItems,
			actionTranscriptReport
		);

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
		reviewItems,
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
		actionTranscriptReport,
		hasActionTranscriptReport: Boolean( actionTranscriptReport?.available ),
		canShowActionTranscriptReport: Boolean(
			actionTranscriptReport?.available &&
				actionTranscriptReport.canShareWithSupport
		),
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
	const saveAuthority = getDistributedEditingSaveAuthorityExportPayload(
		normalizedSessionState
	);
	const actionTranscriptSummary =
		getDistributedEditingActionTranscriptSupportSummaryForSessionState(
			normalizedSessionState
		);
	const actionTranscriptReport =
		getDistributedEditingActionTranscriptSupportReportForSessionState(
			normalizedSessionState
		);
	const rendererCapabilitySupportSummary =
		getDistributedEditingRendererCapabilitySupportExportPayload(
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
		saveAuthority,
		actionTranscriptSummary,
		actionTranscriptReport,
		...( rendererCapabilitySupportSummary
			? { rendererCapabilitySupportSummary }
			: {} ),
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

function getDistributedEditingRendererCapabilitySupportExportPayload(
	sessionState = {}
) {
	const prePublishState =
		getDistributedEditingFreshReviewPrePublishStateForSessionState(
			sessionState
		);
	const summary = prePublishState.rendererCapabilitySupportSummary;

	if (
		! summary?.available ||
		! summary.canShareWithSupport ||
		! summary.supportExportReady
	) {
		return null;
	}

	return {
		...summary,
		exportPayloadSummary: true,
		localUpdatesExportReady: true,
	};
}

function getDistributedEditingSaveAuthorityExportPayload( sessionState = {} ) {
	const saveButtonState =
		getDistributedEditingSaveButtonStateForSessionState( sessionState );

	return {
		state: saveButtonState.authorityState ?? null,
		saveButtonStatus: saveButtonState.status ?? null,
		saveButtonSource: saveButtonState.source ?? null,
		saveButtonReason: saveButtonState.reason ?? null,
		saveButtonClickAction: saveButtonState.clickAction ?? null,
		pendingServerConfirmation: Boolean(
			saveButtonState.pendingServerConfirmation
		),
		authoritativePostUpdated: Boolean(
			saveButtonState.authoritativePostUpdated
		),
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
		typeof postContent === 'string'
			? canonicalizeDistributedEditingCoreBlockCommentDelimiters(
					postContent
			  )
			: ''
	);
	const digest = await subtle.digest( 'SHA-256', bytes );

	return Array.from( new Uint8Array( digest ) )
		.map( ( byte ) => byte.toString( 16 ).padStart( 2, '0' ) )
		.join( '' );
}

/**
 * Prepares content-free block identity request proof from serialized editor
 * content and accepted sync metadata.
 *
 * The descriptor is inert. It does not call REST, save, mutate editor content,
 * persist post content, create revisions, change post locks, or claim saved
 * state.
 *
 * @param {Object}        args                           Request-proof inputs.
 * @param {Object}        args.acceptedSyncMeta          Accepted base sync metadata.
 * @param {string}        args.proposedPostContent       Serialized editor content.
 * @param {string}        [args.proposedPostContentHash] Optional SHA-256 evidence.
 * @param {string|number} [args.clientBaseVersion]       Optional base version.
 *
 * @return {Promise<Object>} Request-proof descriptor.
 */
export async function getDistributedEditingBlockIdentityRequestProofDescriptor( {
	acceptedSyncMeta = null,
	proposedPostContent = '',
	proposedPostContentHash = null,
	clientBaseVersion = null,
} = {} ) {
	const acceptedMeta =
		normalizeDistributedEditingBlockIdentityAcceptedSyncMeta(
			acceptedSyncMeta
		);

	if ( acceptedMeta.status !== 'valid' ) {
		return createDistributedEditingBlockIdentityRequestProofBlockedDescriptor(
			acceptedMeta.reason,
			{
				invalidDetail: acceptedMeta.detail,
			}
		);
	}

	const acceptedBlocks = acceptedMeta.syncMeta.blocks;
	const acceptedBlocksByHash = new Map();
	const acceptedBlocksByOrdinalPath = new Map();

	for ( const block of acceptedBlocks ) {
		if ( acceptedBlocksByHash.has( block.serialized_hash ) ) {
			return createDistributedEditingBlockIdentityRequestProofBlockedDescriptor(
				'accepted_repeated_serialized_hash_ambiguous',
				{
					clientBaseVersion: String(
						getFirstDefined(
							clientBaseVersion,
							acceptedMeta.syncMeta.version
						)
					),
					acceptedBlockCount: acceptedBlocks.length,
				}
			);
		}

		acceptedBlocksByHash.set( block.serialized_hash, block );
		acceptedBlocksByOrdinalPath.set(
			JSON.stringify( block.ordinal_path ),
			block
		);
	}

	const canonicalProposedPostContent =
		canonicalizeDistributedEditingCoreBlockCommentDelimiters(
			proposedPostContent
		);
	const tokens = getSerializedBlockTokens( canonicalProposedPostContent );

	if ( tokens.status !== 'safe' ) {
		return createDistributedEditingBlockIdentityRequestProofBlockedDescriptor(
			'unsafe_serialized_blocks',
			{
				clientBaseVersion: String(
					getFirstDefined(
						clientBaseVersion,
						acceptedMeta.syncMeta.version
					)
				),
				acceptedBlockCount: acceptedBlocks.length,
				unsafeSerializedBlockReason: tokens.reason,
			}
		);
	}

	const calculatedProposedPostContentHash =
		await getDistributedEditingPostContentSha256Hash(
			canonicalProposedPostContent
		);
	const normalizedProposedPostContentHash =
		typeof proposedPostContentHash === 'string' &&
		proposedPostContentHash === calculatedProposedPostContentHash
			? proposedPostContentHash
			: calculatedProposedPostContentHash;

	if (
		! isDistributedEditingBlockIdentitySha256Hash(
			normalizedProposedPostContentHash
		)
	) {
		return createDistributedEditingBlockIdentityRequestProofBlockedDescriptor(
			'missing_hash_evidence',
			{
				clientBaseVersion: String(
					getFirstDefined(
						clientBaseVersion,
						acceptedMeta.syncMeta.version
					)
				),
				acceptedBlockCount: acceptedBlocks.length,
				proposedBlockCount: tokens.blocks.length,
			}
		);
	}

	const proposedBlockHashCounts = new Map();
	const proposedBlocks = [];

	for ( const [ index, serializedBlock ] of tokens.blocks.entries() ) {
		const serializedHash =
			await getDistributedEditingPostContentSha256Hash( serializedBlock );

		if ( ! isDistributedEditingBlockIdentitySha256Hash( serializedHash ) ) {
			return createDistributedEditingBlockIdentityRequestProofBlockedDescriptor(
				'missing_hash_evidence',
				{
					clientBaseVersion: String(
						getFirstDefined(
							clientBaseVersion,
							acceptedMeta.syncMeta.version
						)
					),
					acceptedBlockCount: acceptedBlocks.length,
					proposedBlockCount: tokens.blocks.length,
				}
			);
		}

		const repeatedProposedHashCount =
			proposedBlockHashCounts.get( serializedHash ) ?? 0;

		if ( repeatedProposedHashCount > 0 ) {
			return createDistributedEditingBlockIdentityRequestProofBlockedDescriptor(
				'proposed_repeated_serialized_hash_ambiguous',
				{
					clientBaseVersion: String(
						getFirstDefined(
							clientBaseVersion,
							acceptedMeta.syncMeta.version
						)
					),
					proposedBlockCount: tokens.blocks.length,
				}
			);
		}

		proposedBlockHashCounts.set(
			serializedHash,
			repeatedProposedHashCount + 1
		);

		const blockName =
			getDistributedEditingBlockIdentitySerializedBlockName(
				serializedBlock
			);

		if ( ! blockName ) {
			return createDistributedEditingBlockIdentityRequestProofBlockedDescriptor(
				'unsafe_serialized_blocks',
				{
					clientBaseVersion: String(
						getFirstDefined(
							clientBaseVersion,
							acceptedMeta.syncMeta.version
						)
					),
					acceptedBlockCount: acceptedBlocks.length,
					proposedBlockCount: tokens.blocks.length,
					unsafeSerializedBlockReason: 'block_comment_invalid',
				}
			);
		}

		proposedBlocks.push( {
			blockName,
			ordinalPath: [ index ],
			serializedHash,
		} );
	}

	const retainedBlockUids = [];
	const retainedBlockUidSet = new Set();
	const insertedBlockNonces = [];
	const proposedBlockMap = [];
	const movedBlockUids = [];
	const allAcceptedBlocksRetained = acceptedBlocks.every( ( block ) =>
		proposedBlockHashCounts.has( block.serialized_hash )
	);
	const canRetainSameCountOrdinalBlockEdits =
		proposedBlocks.length === acceptedBlocks.length;

	for ( const [ index, proposedBlock ] of proposedBlocks.entries() ) {
		let acceptedBlock = acceptedBlocksByHash.get(
			proposedBlock.serializedHash
		);

		if ( ! acceptedBlock && canRetainSameCountOrdinalBlockEdits ) {
			const ordinalAcceptedBlock = acceptedBlocksByOrdinalPath.get(
				JSON.stringify( proposedBlock.ordinalPath )
			);

			if (
				ordinalAcceptedBlock &&
				ordinalAcceptedBlock.block_name === proposedBlock.blockName &&
				! retainedBlockUidSet.has( ordinalAcceptedBlock.block_uid )
			) {
				acceptedBlock = ordinalAcceptedBlock;
			}
		}

		if (
			acceptedBlock &&
			! retainedBlockUidSet.has( acceptedBlock.block_uid )
		) {
			retainedBlockUids.push( acceptedBlock.block_uid );
			retainedBlockUidSet.add( acceptedBlock.block_uid );
			proposedBlockMap.push( {
				block_uid: acceptedBlock.block_uid,
				block_name: proposedBlock.blockName,
				ordinal_path: proposedBlock.ordinalPath,
				serialized_hash: proposedBlock.serializedHash,
			} );

			if (
				JSON.stringify( acceptedBlock.ordinal_path ) !==
				JSON.stringify( proposedBlock.ordinalPath )
			) {
				movedBlockUids.push( acceptedBlock.block_uid );
			}

			continue;
		}

		if (
			proposedBlocks.length <= acceptedBlocks.length ||
			! allAcceptedBlocksRetained
		) {
			return createDistributedEditingBlockIdentityRequestProofBlockedDescriptor(
				'unmatched_without_insert_delta',
				{
					clientBaseVersion: String(
						getFirstDefined(
							clientBaseVersion,
							acceptedMeta.syncMeta.version
						)
					),
					acceptedBlockCount: acceptedBlocks.length,
					proposedBlockCount: proposedBlocks.length,
					retainedBlockCount: retainedBlockUidSet.size,
				}
			);
		}

		const insertedBlockNonce = `inserted-${ index }-${ proposedBlock.serializedHash.slice(
			0,
			16
		) }`;
		insertedBlockNonces.push( insertedBlockNonce );
		proposedBlockMap.push( {
			inserted_block_nonce: insertedBlockNonce,
			block_name: proposedBlock.blockName,
			ordinal_path: proposedBlock.ordinalPath,
			serialized_hash: proposedBlock.serializedHash,
		} );
	}

	const deletedBlockUids = acceptedBlocks
		.filter( ( block ) => ! retainedBlockUidSet.has( block.block_uid ) )
		.map( ( block ) => block.block_uid );

	return {
		status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY,
		reason: null,
		requestProof: {
			client_base_version: String(
				getFirstDefined(
					clientBaseVersion,
					acceptedMeta.syncMeta.version
				)
			),
			proposed_post_content_hash: normalizedProposedPostContentHash,
			proposed_block_map: proposedBlockMap,
			retained_block_uids: retainedBlockUids,
			inserted_block_nonces: insertedBlockNonces,
			deleted_block_uids: deletedBlockUids,
			moved_block_uids: movedBlockUids,
		},
		clientBaseVersion: String(
			getFirstDefined( clientBaseVersion, acceptedMeta.syncMeta.version )
		),
		proposedPostContentHash: normalizedProposedPostContentHash,
		acceptedBlockCount: acceptedBlocks.length,
		proposedBlockCount: proposedBlocks.length,
		retainedBlockCount: retainedBlockUids.length,
		insertedBlockCount: insertedBlockNonces.length,
		deletedBlockCount: deletedBlockUids.length,
		movedBlockCount: movedBlockUids.length,
		contentFree: true,
		usesGutenbergClientId: false,
		exposesRawContent: false,
		callsRest: false,
		callsSave: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

/**
 * Determines whether a newer server body and local proposed body both preserve
 * the accepted block identity sequence while inserting blocks in distinct base
 * gaps.
 *
 * The descriptor is inert and content-free. It does not return raw post
 * content, call REST, save, mutate editor content, persist post content, create
 * revisions, change post locks, or claim saved state.
 *
 * @param {Object} args                     Distinct-gap insertion inputs.
 * @param {Object} args.acceptedSyncMeta    Accepted base sync metadata.
 * @param {string} args.serverPostContent   Refetched server serialized content.
 * @param {string} args.proposedPostContent Local proposed serialized content.
 *
 * @return {Promise<Object>} Distinct-gap insertion descriptor.
 */
export async function getDistributedEditingBlockIdentityDistinctGapInsertionDescriptor( {
	acceptedSyncMeta = null,
	serverPostContent = '',
	proposedPostContent = '',
} = {} ) {
	const acceptedMeta =
		normalizeDistributedEditingBlockIdentityAcceptedSyncMeta(
			acceptedSyncMeta
		);

	if ( acceptedMeta.status !== 'valid' ) {
		return createDistributedEditingBlockIdentityDistinctGapInsertionBlockedDescriptor(
			acceptedMeta.reason,
			{
				invalidDetail: acceptedMeta.detail,
			}
		);
	}

	const acceptedBlocks = acceptedMeta.syncMeta.blocks;
	const acceptedBlocksByHash =
		getDistributedEditingAcceptedBlockIdentityBlocksByHash(
			acceptedBlocks
		);

	if ( acceptedBlocksByHash.status !== 'valid' ) {
		return createDistributedEditingBlockIdentityDistinctGapInsertionBlockedDescriptor(
			acceptedBlocksByHash.reason,
			{
				acceptedBlockCount: acceptedBlocks.length,
			}
		);
	}

	const serverSequence =
		await getDistributedEditingBlockIdentityInsertionGapSequence( {
			acceptedBlocks,
			acceptedBlocksByHash: acceptedBlocksByHash.blocksByHash,
			postContent: serverPostContent,
			candidateLabel: 'server',
		} );

	if ( serverSequence.status !== 'valid' ) {
		return createDistributedEditingBlockIdentityDistinctGapInsertionBlockedDescriptor(
			serverSequence.reason,
			{
				acceptedBlockCount: acceptedBlocks.length,
				serverBlockCount: serverSequence.blockCount ?? 0,
				unsafeSerializedBlockReason:
					serverSequence.unsafeSerializedBlockReason ?? null,
			}
		);
	}

	const proposedSequence =
		await getDistributedEditingBlockIdentityInsertionGapSequence( {
			acceptedBlocks,
			acceptedBlocksByHash: acceptedBlocksByHash.blocksByHash,
			postContent: proposedPostContent,
			candidateLabel: 'proposed',
		} );

	if ( proposedSequence.status !== 'valid' ) {
		return createDistributedEditingBlockIdentityDistinctGapInsertionBlockedDescriptor(
			proposedSequence.reason,
			{
				acceptedBlockCount: acceptedBlocks.length,
				serverBlockCount: serverSequence.blockCount,
				proposedBlockCount: proposedSequence.blockCount ?? 0,
				unsafeSerializedBlockReason:
					proposedSequence.unsafeSerializedBlockReason ?? null,
			}
		);
	}

	if (
		serverSequence.insertedGapIndexes.length === 0 ||
		proposedSequence.insertedGapIndexes.length === 0
	) {
		return createDistributedEditingBlockIdentityDistinctGapInsertionBlockedDescriptor(
			'missing_two_sided_insertions',
			{
				acceptedBlockCount: acceptedBlocks.length,
				serverBlockCount: serverSequence.blockCount,
				proposedBlockCount: proposedSequence.blockCount,
				serverInsertedBlockCount:
					serverSequence.insertedGapIndexes.length,
				proposedInsertedBlockCount:
					proposedSequence.insertedGapIndexes.length,
			}
		);
	}

	const serverInsertedGapIndexes = new Set(
		serverSequence.insertedGapIndexes
	);
	const conflictingGapIndex = proposedSequence.insertedGapIndexes.find(
		( gapIndex ) => serverInsertedGapIndexes.has( gapIndex )
	);

	if ( conflictingGapIndex !== undefined ) {
		return createDistributedEditingBlockIdentityDistinctGapInsertionBlockedDescriptor(
			'inserted_block_gap_conflict',
			{
				acceptedBlockCount: acceptedBlocks.length,
				serverBlockCount: serverSequence.blockCount,
				proposedBlockCount: proposedSequence.blockCount,
				serverInsertedBlockCount:
					serverSequence.insertedGapIndexes.length,
				proposedInsertedBlockCount:
					proposedSequence.insertedGapIndexes.length,
				conflictingGapIndex,
			}
		);
	}

	return {
		status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY,
		reason: null,
		requestProof: null,
		acceptedBlockCount: acceptedBlocks.length,
		serverBlockCount: serverSequence.blockCount,
		proposedBlockCount: proposedSequence.blockCount,
		serverInsertedBlockCount: serverSequence.insertedGapIndexes.length,
		proposedInsertedBlockCount: proposedSequence.insertedGapIndexes.length,
		serverInsertedGapIndexes: [ ...serverSequence.insertedGapIndexes ],
		proposedInsertedGapIndexes: [ ...proposedSequence.insertedGapIndexes ],
		conflictingGapIndex: null,
		contentFree: true,
		usesGutenbergClientId: false,
		exposesRawContent: false,
		callsRest: false,
		callsSave: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

/**
 * Determines whether a newer server body and local proposed body preserve the
 * accepted block identity sequence while editing different retained blocks.
 *
 * The descriptor is inert and content-free. It does not return raw post
 * content, call REST, save, mutate editor content, persist post content, create
 * revisions, change post locks, or claim saved state.
 *
 * @param {Object} args                     Retained-edit merge inputs.
 * @param {Object} args.acceptedSyncMeta    Accepted base sync metadata.
 * @param {string} args.acceptedPostContent Accepted base serialized content.
 * @param {string} args.serverPostContent   Refetched server serialized content.
 * @param {string} args.proposedPostContent Local proposed serialized content.
 *
 * @return {Promise<Object>} Retained-edit merge descriptor.
 */
export async function getDistributedEditingBlockIdentityRetainedEditsServerMergeDescriptor( {
	acceptedSyncMeta = null,
	acceptedPostContent = '',
	serverPostContent = '',
	proposedPostContent = '',
} = {} ) {
	const acceptedMeta =
		normalizeDistributedEditingBlockIdentityAcceptedSyncMeta(
			acceptedSyncMeta
		);

	if ( acceptedMeta.status !== 'valid' ) {
		return createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
			acceptedMeta.reason,
			{
				invalidDetail: acceptedMeta.detail,
			}
		);
	}

	const acceptedBlocks = acceptedMeta.syncMeta.blocks;
	const serverSequence =
		await getDistributedEditingBlockIdentityRetainedEditSequence( {
			acceptedBlocks,
			postContent: serverPostContent,
			candidateLabel: 'server',
		} );

	if ( serverSequence.status !== 'valid' ) {
		return createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
			serverSequence.reason,
			{
				acceptedBlockCount: acceptedBlocks.length,
				serverBlockCount: serverSequence.blockCount ?? 0,
				unsafeSerializedBlockReason:
					serverSequence.unsafeSerializedBlockReason ?? null,
			}
		);
	}

	const proposedSequence =
		await getDistributedEditingBlockIdentityRetainedEditSequence( {
			acceptedBlocks,
			postContent: proposedPostContent,
			candidateLabel: 'proposed',
		} );

	if ( proposedSequence.status !== 'valid' ) {
		return createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
			proposedSequence.reason,
			{
				acceptedBlockCount: acceptedBlocks.length,
				serverBlockCount: serverSequence.blockCount,
				proposedBlockCount: proposedSequence.blockCount ?? 0,
				unsafeSerializedBlockReason:
					proposedSequence.unsafeSerializedBlockReason ?? null,
			}
		);
	}

	const serverChangedBlockIndexes = new Set(
		serverSequence.changedBlockIndexes
	);
	const conflictingBlockIndex = proposedSequence.changedBlockIndexes.find(
		( blockIndex ) => serverChangedBlockIndexes.has( blockIndex )
	);

	if ( conflictingBlockIndex !== undefined ) {
		const tableCellMergeDescriptor =
			getDistributedEditingTableCellRetainedBlockMergeDescriptor( {
				acceptedBlocks,
				acceptedPostContent,
				serverBlocks: serverSequence.blocks,
				proposedBlocks: proposedSequence.blocks,
				serverChangedBlockIndexes: serverSequence.changedBlockIndexes,
				proposedChangedBlockIndexes:
					proposedSequence.changedBlockIndexes,
			} );

		if (
			tableCellMergeDescriptor.status !==
			DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY
		) {
			return createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
				'retained_block_edit_conflict',
				{
					acceptedBlockCount: acceptedBlocks.length,
					serverBlockCount: serverSequence.blockCount,
					proposedBlockCount: proposedSequence.blockCount,
					serverChangedBlockCount:
						serverSequence.changedBlockIndexes.length,
					proposedChangedBlockCount:
						proposedSequence.changedBlockIndexes.length,
					serverChangedBlockIndexes:
						serverSequence.changedBlockIndexes,
					proposedChangedBlockIndexes:
						proposedSequence.changedBlockIndexes,
					conflictingBlockIndex,
				}
			);
		}

		return {
			...tableCellMergeDescriptor,
			acceptedBlockCount: acceptedBlocks.length,
			serverBlockCount: serverSequence.blockCount,
			proposedBlockCount: proposedSequence.blockCount,
			serverChangedBlockCount: serverSequence.changedBlockIndexes.length,
			proposedChangedBlockCount:
				proposedSequence.changedBlockIndexes.length,
			serverChangedBlockIndexes: [
				...serverSequence.changedBlockIndexes,
			],
			proposedChangedBlockIndexes: [
				...proposedSequence.changedBlockIndexes,
			],
			conflictingBlockIndex: null,
		};
	}

	if (
		serverSequence.changedBlockIndexes.length === 0 ||
		proposedSequence.changedBlockIndexes.length === 0
	) {
		return createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
			'missing_two_sided_retained_edits',
			{
				acceptedBlockCount: acceptedBlocks.length,
				serverBlockCount: serverSequence.blockCount,
				proposedBlockCount: proposedSequence.blockCount,
				serverChangedBlockCount:
					serverSequence.changedBlockIndexes.length,
				proposedChangedBlockCount:
					proposedSequence.changedBlockIndexes.length,
				serverChangedBlockIndexes: serverSequence.changedBlockIndexes,
				proposedChangedBlockIndexes:
					proposedSequence.changedBlockIndexes,
			}
		);
	}

	return {
		status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY,
		reason: null,
		requestProof: null,
		acceptedBlockCount: acceptedBlocks.length,
		serverBlockCount: serverSequence.blockCount,
		proposedBlockCount: proposedSequence.blockCount,
		serverChangedBlockCount: serverSequence.changedBlockIndexes.length,
		proposedChangedBlockCount: proposedSequence.changedBlockIndexes.length,
		serverChangedBlockIndexes: [ ...serverSequence.changedBlockIndexes ],
		proposedChangedBlockIndexes: [
			...proposedSequence.changedBlockIndexes,
		],
		conflictingBlockIndex: null,
		contentFree: true,
		usesGutenbergClientId: false,
		exposesRawContent: false,
		callsRest: false,
		callsSave: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
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
				localUpdatesImportActionTranscriptReport:
					getDistributedEditingLocalUpdatesImportActionTranscriptReportFromPayload(
						normalizedPayload
					),
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
		clientBaseSyncMeta:
			responseOrError.clientBaseSyncMeta ??
			responseOrError.client_base_sync_meta ??
			responseData.clientBaseSyncMeta ??
			responseData.client_base_sync_meta,
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
	const distributedEditingPostStateHash = normalizeNullableString(
		responseOrError?.state_hash ??
			responseOrError?.stateHash ??
			responseOrError?.data?.state_hash ??
			responseOrError?.data?.stateHash ??
			responseOrError?.distributed_editing?.state_hash ??
			responseOrError?.distributedEditing?.stateHash ??
			currentSessionState.distributedEditingPostStateHash
	);
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
		distributedEditingPostStateHash,
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
	const actionTranscriptState =
		getDistributedEditingActionTranscriptStateForSessionState( normalized );

	if ( normalized.requiresServerStateAcceptance ) {
		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.SERVER_STATE_ACCEPTANCE_REQUIRED,
				status: 'warning',
				priority: 'blocking',
				actionKeys: [
					...( normalized.canExportLocalUpdates &&
					normalized.retrySaveStatus !==
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						  ]
						: [] ),
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
				actionKeys:
					getDistributedEditingStaleBaseStatusActionKeys(
						normalized
					),
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
		const retrySaveReviewRequired =
			normalized.retrySaveStatus ===
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED ||
			normalized.retrySaveRequiresUnfilteredHtmlSaver;
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
					...( ! retrySaveReviewRequired &&
					normalized.canExportLocalUpdates &&
					normalized.retrySaveStatus !==
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						  ]
						: [] ),
					...( ! retrySaveReviewRequired &&
					( normalized.retrySaveStatus ===
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED ||
						normalized.retrySaveHandoffReason ===
							DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED )
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
						  ]
						: [] ),
				],
				isDismissible: retrySaveReviewRequired,
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
					localUpdatesImportActionTranscriptReport:
						localUpdatesImportReviewRequest.actionTranscriptReport,
					localUpdatesImportHasActionTranscriptReport:
						localUpdatesImportReviewRequest.hasActionTranscriptReport,
					localUpdatesImportCanShowActionTranscriptReport:
						localUpdatesImportReviewRequest.canShowActionTranscriptReport,
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
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION &&
		normalized.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE &&
		! hasRetrySaveHandoffBlock
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

	if ( normalized.hasRemoteChanges && ! normalized.saveButtonClickInFlight ) {
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

	if ( actionTranscriptState.status === 'available' ) {
		const shouldSuppressQuietSavedTranscript =
			normalized.retrySaveStatus ===
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED &&
			normalized.retrySaveAccepted &&
			! normalized.hasPendingChanges &&
			! normalized.mustOfferLocalCopy;

		if ( shouldSuppressQuietSavedTranscript ) {
			return descriptors;
		}

		const actionTranscriptSupportReport =
			getDistributedEditingActionTranscriptSupportReportForSessionState(
				normalized
			);

		descriptors.push(
			createNoticeDescriptor( normalized, {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.ACTION_TRANSCRIPT,
				status: 'info',
				priority: 'status',
				extra: {
					actionTranscriptStatus: actionTranscriptState.status,
					actionTranscriptItemCount: actionTranscriptState.itemCount,
					actionTranscriptDroppedItemCount:
						actionTranscriptState.droppedItemCount,
					actionTranscriptLatestEventType:
						actionTranscriptState.latestEventType,
					actionTranscriptLatestEventSource:
						actionTranscriptState.latestEventSource,
					actionTranscriptHasLocalEvents:
						actionTranscriptState.hasLocalEvents,
					actionTranscriptHasRemoteEvents:
						actionTranscriptState.hasRemoteEvents,
					actionTranscriptHasServerEvents:
						actionTranscriptState.hasServerEvents,
					actionTranscriptHasEditorEvents:
						actionTranscriptState.hasEditorEvents,
					actionTranscriptEntriesRedacted:
						actionTranscriptState.entriesRedacted,
					actionTranscriptExposesRawContent:
						actionTranscriptState.exposesRawContent,
					actionTranscriptExposesProofInternals:
						actionTranscriptState.exposesProofInternals,
					actionTranscriptExposesActorIds:
						actionTranscriptState.exposesActorIds,
					actionTranscriptCallsRest: actionTranscriptState.callsRest,
					actionTranscriptCallsSave: actionTranscriptState.callsSave,
					actionTranscriptMutatesEditorContent:
						actionTranscriptState.mutatesEditorContent,
					actionTranscriptChangesPostLock:
						actionTranscriptState.changesPostLock,
					actionTranscriptClaimsSaved:
						actionTranscriptState.claimsSaved,
					actionTranscriptSupportReport,
				},
			} )
		);
	}

	return descriptors;
}

function getDistributedEditingStaleBaseStatusActionKeys( normalized ) {
	const actionKeys = [];
	const canApplyLocalChanges =
		normalized.canAttemptLocalRebase &&
		hasDistributedEditingLocalRebaseInputs( normalized );
	const canPrepareChanges =
		normalized.readyToRetrySubmit && ! normalized.retrySubmitPrepared;
	const canCheckWithWordPress =
		normalized.retrySubmitPrepared &&
		normalized.retrySubmitProofStatus !==
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE;

	if ( canApplyLocalChanges ) {
		actionKeys.push(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES
		);
	} else if ( canPrepareChanges ) {
		actionKeys.push(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT
		);
	} else if ( canCheckWithWordPress ) {
		actionKeys.push(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF
		);
	}

	if (
		normalized.requiresServerStateRefetch ||
		! normalized.refetchedServerState
	) {
		actionKeys.push(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE
		);
	}

	if (
		normalized.canExportLocalUpdates &&
		! normalized.saveButtonClickInFlight
	) {
		actionKeys.push(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES
		);
	}

	return [ ...new Set( actionKeys ) ];
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
		( ( normalized.retrySaveSavesPost &&
			normalized.retrySaveMutatesPostContent &&
			normalized.retrySaveClaimsSaved ) ||
			( normalized.retrySaveIdempotentNoWrite &&
				normalized.retrySaveAlreadyPersisted &&
				normalized.retrySaveClaimsSaved ) )
	);
}

/**
 * Returns session state for a local document-history change that still needs
 * to be saved. Any previous save/review proof is content-bound, so it cannot
 * authorize the newly staged editor content.
 *
 * @param {Object} sessionState Current DE-RTC session state.
 * @param {Object} overrides    Fields to apply after proof state is cleared.
 *
 * @return {Object} Normalized pending local-change state.
 */
export function getDistributedEditingSessionStateForPendingLocalHistoryChange(
	sessionState = {},
	overrides = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return normalizeDistributedEditingSessionState( {
		...normalized,
		disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
		reasonCode: null,
		pendingChangeCount: Math.max(
			1,
			normalizeCount( overrides.pendingChangeCount ) ||
				normalized.pendingChangeCount ||
				1
		),
		hasPendingChanges: true,
		saveButtonClickInFlight: false,
		requiresServerStateAcceptance: false,
		requiresServerStateRefetch: false,
		refetchedServerState: false,
		refetchedServerContent: null,
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
		retrySubmitSaveRequiresExplicitSaveClick: false,
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
		...normalizeRetrySaveReviewMetadataFields(),
		...normalizeRetrySaveReviewApprovalProofFields(),
		...normalizeRetrySaveFreshReviewConsumeValidationFields(),
		...normalizeRiskyBlockReviewMetadataFields(),
		mustOfferLocalCopy: false,
		canExportLocalUpdates: false,
		...overrides,
	} );
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
		! hasProtectedLocalChanges &&
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
		retrySaveConfirmedMergedEdits: normalized.retrySaveConfirmedMergedEdits,
		retrySaveServerMerged: normalized.retrySaveServerMerged,
		retrySaveServerMergeApplied: normalized.retrySaveServerMergeApplied,
		retrySaveServerMergeStatus: normalized.retrySaveServerMergeStatus,
		retrySaveServerMergeStrategy: normalized.retrySaveServerMergeStrategy,
		retrySaveServerMergeBlockCount:
			normalized.retrySaveServerMergeBlockCount,
		retrySaveServerMergeServerChangedIndexes:
			normalized.retrySaveServerMergeServerChangedIndexes,
		retrySaveServerMergeLocalChangedIndexes:
			normalized.retrySaveServerMergeLocalChangedIndexes,
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
	const reviewItems = [
		...normalizeRiskyBlockReviewItems(
			getFirstDefined(
				responseOrError.reviewItems,
				responseOrError.review_items,
				responseData.reviewItems,
				responseData.review_items
			)
		),
		...normalizeRiskyBlockReviewItems(
			getFirstDefined(
				responseOrError.reviewItemDescriptors,
				responseOrError.review_item_descriptors,
				responseData.reviewItemDescriptors,
				responseData.review_item_descriptors
			)
		),
	].filter(
		( item, index, allItems ) =>
			allItems.findIndex( ( candidate ) => candidate.id === item.id ) ===
			index
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
		riskyBlockReviewSaveButtonLabel: reviewRequired ? 'Save' : 'Update',
		riskyBlockReviewSaveClickAction: reviewRequired
			? DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE
			: DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE,
		riskyBlockReviewCanExportLocalUpdates: false,
		riskyBlockReviewRequiresServerStateRefetch: false,
		riskyBlockReviewRawContentIncluded: false,
		riskyBlockReviewExposesRawContent: false,
		riskyBlockReviewDispatchesNotice: false,
		riskyBlockReviewMutatesEditorContent: false,
		riskyBlockReviewCallsNormalSavePost: false,
		riskyBlockReviewCallsRetrySaveEndpoint: false,
		riskyBlockReviewChangesPostLock: false,
		riskyBlockReviewClaimsSaved: false,
		mustOfferLocalCopy: normalizedCurrent.mustOfferLocalCopy,
		canExportLocalUpdates: normalizedCurrent.canExportLocalUpdates,
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

function isDistributedEditingPartialSafePendingReviewState(
	normalized,
	reviewState
) {
	return Boolean(
		normalized.reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT &&
			normalized.retrySaveStatus ===
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED &&
			normalized.refetchedServerState &&
			! normalized.requiresServerStateRefetch &&
			reviewState.hasPendingReviewItems
	);
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
	const hasRetrySaveSavedStateEvidence =
		hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
			normalized
		);
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

	if ( hasProtectedLocalChanges && hasFreshReviewRequest ) {
		if ( requiresFreshReviewDueToAuthority ) {
			status =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED;
			reason =
				decisionLifecycleStatus === 'capability_drift'
					? 'fresh_review_authority_drift_requires_new_review'
					: 'fresh_review_consumed_requires_new_review';
			placement =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW;
			saveButtonLabel = 'Save';
			clickAction =
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
		} else if (
			! hasRetrySaveSavedStateEvidence &&
			( handoffStatus ===
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE ||
				normalized.retrySaveFreshReviewConsumeValidationAccepted ||
				normalized.retrySaveFreshReviewDecisionConsumptionValidated )
		) {
			status =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE;
			reason = 'fresh_review_accepted_for_retry_save';
			placement =
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_SAVE_STATUS;
			saveButtonLabel = 'Save';
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
			saveButtonLabel = 'Checking review...';
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
				saveButtonLabel = 'Save';
				clickAction =
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE;
				requiresServerStateRefetch = true;
			} else {
				status =
					DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.BLOCKED;
				reason = handoffReason || 'fresh_review_handoff_blocked';
				placement =
					DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW;
				saveButtonLabel = 'Save';
				clickAction =
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
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
			saveButtonLabel = 'Save';
			clickAction =
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
		}
	}

	const isActive =
		status !== DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.NONE;
	const actionKeys = [
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
		canExportLocalUpdates: false,
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
	const rendererCapabilitySupportSummary =
		getDistributedEditingFreshReviewComparisonRendererCapabilitySupportSummary(
			{
				capabilityResolutions: reviewItems
					.map(
						( item ) =>
							item.compareAction?.comparePlan
								?.comparisonPreviewShell?.rendererReadiness
								?.capabilityResolution
					)
					.filter( Boolean ),
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
		rendererCapabilitySupportSummary,
		hasRendererCapabilitySupportSummary: Boolean(
			rendererCapabilitySupportSummary.available
		),
		canShowRendererCapabilitySupportSummary: Boolean(
			rendererCapabilitySupportSummary.available &&
				rendererCapabilitySupportSummary.canShareWithSupport
		),
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
		const jumpToBlockAction = item.jumpToBlockAction;
		const compareAction = item.compareAction;

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
			supportsJumpToBlock: item.supportsJumpToBlock,
			supportsCompare: item.supportsCompare,
			supportsComparePlan: item.supportsComparePlan,
			canJumpToBlock: item.canJumpToBlock,
			canCompare: item.canCompare,
			canShowComparePlan: item.canShowComparePlan,
			canApprove: canRecordLocalDecisions && ! isApprovedForRetrySave,
			canReject: canRecordLocalDecisions && ! isRejected,
			approveAction,
			rejectAction,
			jumpToBlockAction,
			compareAction,
			actionDescriptors: [
				jumpToBlockAction,
				compareAction,
				approveAction,
				rejectAction,
			].filter( Boolean ),
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

function getDistributedEditingSaveStateVocabulary( {
	status,
	authorityState,
	authorityStatusText,
	authoritativePostUpdated = false,
	pendingServerConfirmation = false,
	hasProtectedLocalChanges = false,
	canExportLocalUpdates = false,
	hasAcceptedButUnconsumed = false,
	reviewItemCount = 0,
	pendingReviewItemCount = 0,
	approvedReviewItemCount = 0,
	freshReviewPreSaveStatus = null,
} = {} ) {
	let localChangesState =
		DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.NO_PROTECTED_CHANGES;
	let localChangesText = 'No protected local changes are pending.';

	if ( authoritativePostUpdated ) {
		localChangesState =
			DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.AUTHORITATIVE_UPDATE_CONFIRMED;
		localChangesText = 'WordPress saved your changes.';
	} else if ( pendingServerConfirmation ) {
		localChangesState =
			DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.AWAITING_SERVER_CONFIRMATION;
		localChangesText =
			'Protected local changes are waiting for WordPress confirmation.';
	} else if ( hasProtectedLocalChanges && canExportLocalUpdates ) {
		localChangesState =
			DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE;
		localChangesText =
			'Protected local changes remain exportable from this editor.';
	} else if ( hasProtectedLocalChanges ) {
		localChangesState =
			DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES;
		localChangesText = 'Protected local changes remain in this editor.';
	}

	let reviewCheckpointState =
		DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.NO_REVIEW_REQUIRED;
	let reviewCheckpointText = 'No review checkpoint is blocking Save.';

	if ( authoritativePostUpdated ) {
		reviewCheckpointState =
			DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_CONSUMED;
		reviewCheckpointText = 'Save is complete.';
	} else if (
		status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.FRESH_REVIEW_VALIDATING ||
		freshReviewPreSaveStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING
	) {
		reviewCheckpointState =
			DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_VALIDATING;
		reviewCheckpointText =
			'Review is being checked before Save can continue.';
	} else if (
		status === DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REFETCH_REQUIRED ||
		authorityState ===
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.SERVER_REFRESH_REQUIRED_BEFORE_UPDATE
	) {
		reviewCheckpointState =
			DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.SERVER_REFRESH_REQUIRED;
		reviewCheckpointText =
			'Server state must be refreshed before review or Save can continue.';
	} else if (
		status === DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED ||
		status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.WORKFLOW_ACTION_REQUIRED ||
		( pendingReviewItemCount > 0 && hasProtectedLocalChanges )
	) {
		reviewCheckpointState =
			DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_REQUIRED;
		reviewCheckpointText =
			status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.WORKFLOW_ACTION_REQUIRED
				? 'A Distributed Editing recovery step is required before Save can continue.'
				: 'Review is required before WordPress can update the post.';
	} else if (
		status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED ||
		status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS ||
		hasAcceptedButUnconsumed ||
		approvedReviewItemCount > 0
	) {
		reviewCheckpointState =
			DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_ACCEPTED;
		reviewCheckpointText = 'Review is accepted for WordPress Save.';
	}

	let summaryText = 'Save can update the post in WordPress.';

	if ( authoritativePostUpdated ) {
		summaryText = 'Ready for new edits.';
	} else if ( pendingServerConfirmation ) {
		summaryText =
			'Reviewed local changes are waiting for WordPress confirmation before the post updates.';
	} else if (
		reviewCheckpointState ===
		DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_VALIDATING
	) {
		summaryText =
			'Reviewed local changes are being checked before WordPress can update the post.';
	} else if (
		reviewCheckpointState ===
		DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.SERVER_REFRESH_REQUIRED
	) {
		summaryText =
			'Save will check WordPress before updating; protected local changes stay in this editor until Save is confirmed.';
	} else if (
		reviewCheckpointState ===
		DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_REQUIRED
	) {
		summaryText =
			status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.WORKFLOW_ACTION_REQUIRED
				? 'Protected local changes need the next recovery step before WordPress can update the post.'
				: 'Protected local changes need review before WordPress can update the post.';
	} else if (
		reviewCheckpointState ===
		DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_ACCEPTED
	) {
		summaryText =
			'Reviewed local changes are ready for Save; the post in WordPress is not updated yet.';
	}

	return {
		localChangesState,
		reviewCheckpointState,
		authoritativePostState: authorityState,
		localChangesText,
		reviewCheckpointText,
		authoritativePostText: authorityStatusText,
		summaryText,
		reviewItemCount,
		pendingReviewItemCount,
		approvedReviewItemCount,
		descriptorOnly: true,
		rawContentIncluded: false,
		exposesRawContent: false,
		exposesProofInternals: false,
		exposesReviewerIds: false,
		exposesSaverIds: false,
	};
}

function getDistributedEditingRequiredSaveWorkflowAction( normalized ) {
	const hasLocalRebaseInputs =
		hasDistributedEditingLocalRebaseInputs( normalized );
	const requiresManualConflictReview = Boolean(
		normalized.requiresManualConflictResolution
	);
	const canApplyLocalChanges =
		( normalized.canAttemptLocalRebase ||
			normalized.localRebasePlanStatus ===
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY ) &&
		! requiresManualConflictReview &&
		hasLocalRebaseInputs &&
		normalized.localRebaseResultStatus !==
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED;
	const canPrepareChanges =
		normalized.readyToRetrySubmit && ! normalized.retrySubmitPrepared;
	const canCheckWithWordPress =
		normalized.retrySubmitPrepared &&
		normalized.retrySubmitProofStatus !==
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE;

	if ( requiresManualConflictReview ) {
		return {
			reason: 'manual_conflict_review_required_before_save',
			label: 'Save',
			statusText:
				'Resolve the local and WordPress versions before Save can update the post.',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.COMPARE_CONFLICTING_CHANGES,
		};
	}

	if ( canApplyLocalChanges ) {
		return {
			reason: 'local_changes_not_applied_before_save',
			label: 'Apply local changes',
			statusText:
				'Apply protected local changes before Save can update the post.',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.APPLY_LOCAL_CHANGES,
		};
	}

	if ( canPrepareChanges ) {
		return {
			reason: 'retry_submit_handoff_not_prepared_before_save',
			label: 'Continue Save',
			statusText: 'Continue Save before the post can update.',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.PREPARE_CHANGES,
		};
	}

	if ( canCheckWithWordPress ) {
		return {
			reason: 'retry_submit_proof_not_checked_before_save',
			label: 'Continue Save',
			statusText: 'Continue Save before the post can update.',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CHECK_WITH_WORDPRESS,
		};
	}

	return null;
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
	const partialSafePendingReview =
		isDistributedEditingPartialSafePendingReviewState(
			normalized,
			reviewState
		);
	const freshReviewPreSaveState =
		getDistributedEditingFreshReviewPreSaveStateForSessionState(
			normalized
		);
	const freshReviewPreSaveRequiresServerStateRefetch =
		freshReviewPreSaveState.status !==
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.NONE &&
		freshReviewPreSaveState.requiresServerStateRefetch;
	const hasProtectedLocalChanges = Boolean(
		normalized.hasPendingChanges ||
			normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates
	);
	const hasLocalReviewFailureEvidence = Boolean(
		normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates ||
			normalized.riskyBlockReviewCanExportLocalUpdates ||
			normalized.retrySaveStatus ===
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED ||
			normalized.reasonCode ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT ||
			normalized.riskyBlockReviewReasonCode ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT
	);
	const hasLocalRiskyReviewPending =
		reviewState.hasPendingReviewItems && hasLocalReviewFailureEvidence;
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
	const hasAcceptedRetrySubmitProofAwaitingSavePreparation =
		hasAcceptedRetrySubmitProof && ! hasRetrySavePreparation;
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
			hasAcceptedRetrySubmitProof );
	const workflowAction =
		getDistributedEditingRequiredSaveWorkflowAction( normalized );
	let status = DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY;
	let reason = null;
	let source = 'default';
	let label = 'Update';
	let statusText = 'Ready to update';
	let clickAction = DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE;
	let authorityState =
		DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_TO_UPDATE;
	let authorityStatusText = 'Save can update the post in WordPress.';
	let disabled = false;
	let busy = false;
	let opensPrePublishReview = false;
	let requiresServerStateRefetch = false;
	let canRefetchServerState = false;
	let claimsSaved = false;
	let authoritativePostUpdated = false;
	let pendingServerConfirmation = false;

	if ( normalized.saveButtonClickInFlight ) {
		status =
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS;
		reason = 'distributed_editing_save_button_click_in_flight';
		source = 'save_button';
		label = 'Save';
		statusText = 'Saving.';
		clickAction = null;
		disabled = true;
		busy = false;
		authorityState =
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.AWAITING_SERVER_CONFIRMATION;
		authorityStatusText = 'WordPress is saving your changes.';
		pendingServerConfirmation = true;
	} else if (
		normalized.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
	) {
		status =
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS;
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS;
		source = 'retry_save';
		label = 'Saving';
		statusText = 'WordPress is saving your changes.';
		clickAction = null;
		disabled = true;
		busy = true;
		authorityState =
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.AWAITING_SERVER_CONFIRMATION;
		authorityStatusText = 'WordPress is saving your changes.';
		pendingServerConfirmation = true;
	} else if (
		freshReviewPreSaveState.status ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING
	) {
		status =
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.FRESH_REVIEW_VALIDATING;
		reason =
			freshReviewPreSaveState.reason || 'fresh_review_handoff_validating';
		source = 'fresh_review';
		label = 'Checking review...';
		statusText =
			'Review is being checked before WordPress updates the post.';
		clickAction = null;
		disabled = true;
		busy = true;
		authorityState =
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_VALIDATION_IN_PROGRESS;
		authorityStatusText =
			'Review is being checked before WordPress can update the post.';
	} else if (
		reviewState.requiresServerStateRefetch ||
		freshReviewPreSaveRequiresServerStateRefetch ||
		normalized.requiresServerStateRefetch
	) {
		status = DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REFETCH_REQUIRED;
		if ( reviewState.requiresServerStateRefetch ) {
			reason = 'risky_block_review_stale';
			source = 'risky_block_review';
		} else if ( freshReviewPreSaveRequiresServerStateRefetch ) {
			reason =
				freshReviewPreSaveState.reason ||
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED;
			source = 'fresh_review';
		} else {
			reason =
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED;
			source = 'retry_save';
		}
		label = 'Save';
		statusText = 'WordPress will check the current post before saving.';
		clickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE;
		requiresServerStateRefetch = true;
		canRefetchServerState = true;
		authorityState =
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.SERVER_REFRESH_REQUIRED_BEFORE_UPDATE;
		authorityStatusText =
			'WordPress will check the current post before updating it.';
	} else if (
		( hasLocalRiskyReviewPending && ! partialSafePendingReview ) ||
		freshReviewPreSaveState.opensPrePublishReview ||
		freshReviewPreSaveState.status ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED ||
		freshReviewPreSaveState.status ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.BLOCKED
	) {
		const reviewBlockedClickAction = hasLocalRiskyReviewPending
			? DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE
			: freshReviewPreSaveState.clickAction ||
			  DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;
		status = DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED;
		if ( partialSafePendingReview ) {
			reason = 'partial_safe_review_pending';
			source = 'partial_safe_review';
		} else if ( reviewState.hasPendingReviewItems ) {
			reason = 'risky_block_review_required';
			source = 'risky_block_review';
		} else {
			reason = freshReviewPreSaveState.reason || 'fresh_review_required';
			source = 'fresh_review';
		}
		label = 'Save';
		statusText = partialSafePendingReview
			? 'WordPress saved the safe parts. Choose what to do with the blocked HTML.'
			: 'WordPress will save safe edits and keep blocked blocks for review.';
		clickAction = reviewBlockedClickAction;
		opensPrePublishReview =
			reviewBlockedClickAction ===
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;
		authorityState =
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_REQUIRED_BEFORE_UPDATE;
		authorityStatusText = partialSafePendingReview
			? 'Safe edits are already in WordPress; the blocked HTML still needs a decision.'
			: 'WordPress cannot update the post until risky changes are approved or removed.';
	} else if ( partialSafePendingReview ) {
		status =
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED;
		reason = 'partial_safe_review_pending';
		source = 'partial_safe_review';
		label = 'Save';
		statusText =
			'WordPress saved the safe parts. One block is still blocked.';
		clickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
		authorityState =
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_FOR_GUARDED_UPDATE;
		authorityStatusText =
			'Save will check the remaining local changes with WordPress.';
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
		} else if ( hasAcceptedRetrySubmitProofAwaitingSavePreparation ) {
			reason = 'accepted_retry_submit_proof_needs_save_preparation';
			source = 'retry_submit';
		} else {
			reason = 'accepted_retry_submit_proof_unconsumed';
			source = 'retry_submit';
		}
		if ( hasAcceptedRetrySubmitProofAwaitingSavePreparation ) {
			label = 'Continue Save';
		} else if ( source === 'retry_submit' && hasAcceptedRetrySubmitProof ) {
			label = 'Save';
		} else {
			label = 'Save';
		}
		statusText = hasAcceptedRetrySubmitProofAwaitingSavePreparation
			? 'Ready to continue before the post updates.'
			: 'Ready for WordPress.';
		clickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
		authorityState =
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_FOR_GUARDED_UPDATE;
		authorityStatusText =
			'Reviewed changes are ready for WordPress to update the post.';
	} else if ( hasRetrySaveSavedStateEvidence ) {
		status = DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_CONFIRMED;
		reason =
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_ALREADY_CONFIRMED;
		source = 'retry_save';
		label = 'Saved';
		statusText = 'WordPress saved your changes.';
		clickAction = null;
		disabled = true;
		claimsSaved = true;
		authorityState =
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.AUTHORITATIVE_UPDATE_CONFIRMED;
		authorityStatusText = 'WordPress accepted this Save.';
		authoritativePostUpdated = true;
	} else if ( workflowAction ) {
		status =
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.WORKFLOW_ACTION_REQUIRED;
		reason = workflowAction.reason;
		source = 'stale_base_recovery';
		label = workflowAction.label;
		statusText = workflowAction.statusText;
		clickAction = workflowAction.clickAction;
		authorityState =
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_REQUIRED_BEFORE_UPDATE;
		authorityStatusText =
			'Finish the recovery step before WordPress can update the post.';
	}

	const blocksNormalSavePost =
		status !== DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY;
	const canExportLocalUpdates =
		Boolean( normalized.canExportLocalUpdates ) &&
		! pendingServerConfirmation &&
		( hasProtectedLocalChanges || blocksNormalSavePost );
	const actionKeys = [
		canExportLocalUpdates
			? DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES
			: null,
	].filter( Boolean );
	const stateVocabulary = getDistributedEditingSaveStateVocabulary( {
		status,
		authorityState,
		authorityStatusText,
		authoritativePostUpdated,
		pendingServerConfirmation,
		hasProtectedLocalChanges,
		canExportLocalUpdates,
		hasAcceptedButUnconsumed,
		reviewItemCount: reviewState.reviewItemCount,
		pendingReviewItemCount: reviewState.pendingReviewItemCount,
		approvedReviewItemCount: reviewState.approvedReviewItemCount,
		freshReviewPreSaveStatus: freshReviewPreSaveState.status,
	} );

	return {
		status,
		reason,
		source,
		label,
		statusText,
		clickAction,
		authorityState,
		authorityStatusText,
		authoritativePostUpdated,
		pendingServerConfirmation,
		disabled,
		busy,
		blocksNormalSavePost,
		opensPrePublishReview,
		requiresServerStateRefetch,
		canRefetchServerState,
		canExportLocalUpdates,
		hasProtectedLocalChanges,
		localChangesState: stateVocabulary.localChangesState,
		reviewCheckpointState: stateVocabulary.reviewCheckpointState,
		authoritativePostState: stateVocabulary.authoritativePostState,
		saveStateSummaryText: stateVocabulary.summaryText,
		stateVocabulary,
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
 * Returns the current M0 human-loop step for the normal enabled editor shell.
 * This condenses the DE-RTC Save/review/recovery vocabulary into one
 * human-facing next step without exposing proof internals or performing the
 * action it names.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Human-loop step descriptor.
 */
export function getDistributedEditingHumanLoopStepStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const saveButton =
		getDistributedEditingSaveButtonStateForSessionState( normalized );
	const hasProtectedLocalChanges = Boolean(
		saveButton.hasProtectedLocalChanges ||
			normalized.hasPendingChanges ||
			normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates ||
			normalized.isAwaitingServerConfirmation ||
			normalized.pendingChangeCount > 0
	);
	const confirmedByWordPress =
		saveButton.status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_CONFIRMED &&
		saveButton.hasRetrySaveSavedStateEvidence &&
		saveButton.authoritativePostUpdated;
	const hasLocalRebaseInputs =
		normalized.clientBaseContent !== null &&
		normalized.refetchedServerContent !== null;
	const manualConflictNeedsReview = Boolean(
		normalized.requiresManualConflictResolution
	);
	const localRebaseCanApply =
		( normalized.canAttemptLocalRebase ||
			normalized.localRebasePlanStatus ===
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY ) &&
		! manualConflictNeedsReview &&
		hasLocalRebaseInputs &&
		normalized.localRebaseResultStatus !==
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED;
	const retrySubmitCanPrepare = Boolean( normalized.readyToRetrySubmit );
	const retrySubmitCanCheck =
		normalized.retrySubmitHandoffStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED &&
		normalized.retrySubmitPrepared &&
		normalized.retrySubmitProofStatus !==
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE;
	let step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_EDIT;
	let action = 'edit';

	if ( confirmedByWordPress ) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED;
		action = 'none';
	} else if (
		saveButton.status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS ||
		saveButton.status ===
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.FRESH_REVIEW_VALIDATING
	) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.WAITING_FOR_WORDPRESS;
		action = 'keep_tab_open';
	} else if (
		saveButton.status ===
		DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REFETCH_REQUIRED
	) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED;
		action = 'save';
	} else if (
		saveButton.status ===
		DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED
	) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES;
		action = 'review_changes';
	} else if (
		saveButton.status ===
		DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED
	) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE;
		action =
			saveButton.reason ===
			'accepted_retry_submit_proof_needs_save_preparation'
				? 'prepare_save'
				: 'save';
	} else if ( manualConflictNeedsReview ) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED;
		action = 'compare_conflicting_changes';
	} else if ( localRebaseCanApply ) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED;
		action = 'apply_local_changes';
	} else if ( retrySubmitCanPrepare ) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED;
		action = 'prepare_changes';
	} else if ( retrySubmitCanCheck ) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED;
		action = 'check_with_wordpress';
	} else if (
		hasProtectedLocalChanges &&
		saveButton.status !==
			DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY
	) {
		step = DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED;
		action = 'wait_or_export';
	}

	return {
		step,
		action,
		saveButtonStatus: saveButton.status,
		saveButtonReason: saveButton.reason,
		saveButtonLabel: saveButton.label,
		saveButtonStatusText: saveButton.statusText,
		saveButtonDisabled: saveButton.disabled,
		saveButtonBusy: saveButton.busy,
		saveButtonBlocksNormalSavePost: saveButton.blocksNormalSavePost,
		saveButtonStateSummaryText: saveButton.saveStateSummaryText,
		saveButtonAuthorityStatusText: saveButton.authorityStatusText,
		saveAuthorityState: saveButton.authorityState,
		savePolicyAction: saveButton.clickAction,
		hasProtectedLocalChanges,
		requiresServerStateRefetch: saveButton.requiresServerStateRefetch,
		requiresReview: saveButton.opensPrePublishReview,
		hasAcceptedButUnconsumed: saveButton.hasAcceptedButUnconsumed,
		pendingServerConfirmation: saveButton.pendingServerConfirmation,
		confirmedByWordPress,
		descriptorOnly: true,
		callsRestEndpoint: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSavedWithoutEvidence: false,
		exposesRawContent: false,
		exposesProofInternals: false,
		exposesReviewerIds: false,
		exposesSaverIds: false,
	};
}

/**
 * Returns content-free state for the visible same-block Compare action.
 * This records whether the click opened or requested the comparison surface
 * without saving, autosaving, mutating content, or changing post locks.
 *
 * @param {Object} sessionState DE-RTC session state.
 *
 * @return {Object} Compare action state descriptor.
 */
export function getDistributedEditingConflictingChangesComparisonActionStateForSessionState(
	sessionState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const requested = Boolean(
		normalized.conflictingChangesComparisonActionRequested
	);
	const hasProtectedLocalChanges = Boolean(
		normalized.hasPendingChanges ||
			normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates ||
			normalized.isAwaitingServerConfirmation ||
			normalized.pendingChangeCount > 0
	);

	return {
		status: normalized.conflictingChangesComparisonActionStatus,
		reason: normalized.conflictingChangesComparisonActionReason,
		action: DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.COMPARE_CONFLICTING_CHANGES,
		requested,
		openRequested: Boolean(
			normalized.conflictingChangesComparisonOpenRequested
		),
		focusRequested: Boolean(
			normalized.conflictingChangesComparisonFocusRequested
		),
		focusedImmediately: Boolean(
			normalized.conflictingChangesComparisonFocusedImmediately
		),
		surfaceOpened: Boolean(
			normalized.conflictingChangesComparisonSurfaceOpened
		),
		requiresManualConflictResolution: Boolean(
			normalized.requiresManualConflictResolution
		),
		hasProtectedLocalChanges,
		canExportLocalUpdates: Boolean( normalized.canExportLocalUpdates ),
		preservesLocalChanges: true,
		preservesCompareState: true,
		blocksNormalSavePost: requested,
		descriptorOnly: true,
		callsRestEndpoint: false,
		callsServerStateRefetchEndpoint: false,
		callsRetrySubmitEndpoint: false,
		callsNormalSavePost: false,
		callsAutosaveEndpoint: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
		exposesRawContent: false,
		exposesProofInternals: false,
	};
}

function getDistributedEditingSaveJourneyCopyForStep( step, action ) {
	switch ( step ) {
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED:
			if ( action === 'apply_local_changes' ) {
				return {
					title: 'Apply local edits',
					summary: 'Apply local edits in this editor before saving.',
				};
			}

			if ( action === 'prepare_changes' ) {
				return {
					title: 'Continue Save',
					summary: 'Continue Save before updating the post.',
				};
			}

			if ( action === 'check_with_wordpress' ) {
				return {
					title: 'Continue Save',
					summary: 'Continue Save before the post can update.',
				};
			}

			if ( action === 'compare_conflicting_changes' ) {
				return {
					title: 'Resolve changes',
					summary: 'Choose which version to keep before saving.',
				};
			}

			return {
				title: 'Keep editing',
				summary: 'Use Save when you are ready.',
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST:
			return {
				title: 'Save will check WordPress',
				summary: 'Save will check WordPress before updating.',
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES:
			return {
				title: 'HTML review',
				summary: 'Review blocked HTML before saving it.',
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE:
			if ( action === 'prepare_save' ) {
				return {
					title: 'Continue Save',
					summary: 'Continue Save before updating the post.',
				};
			}

			return {
				title: 'Ready to Save',
				summary: 'Use Save to update the post.',
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.WAITING_FOR_WORDPRESS:
			return {
				title: 'Saving',
				summary: 'WordPress is saving your changes.',
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED:
			return {
				title: 'Saved',
				summary: 'Ready for new edits.',
			};
	}

	return {
		title: 'Save is available',
		summary:
			'Use Save when you are ready for WordPress to update this post.',
	};
}

function getDistributedEditingSaveJourneyActionHintForStep( step, action ) {
	switch ( step ) {
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED:
			if ( action === 'apply_local_changes' ) {
				return 'Apply local changes';
			}

			if ( action === 'prepare_changes' ) {
				return 'Continue Save';
			}

			if ( action === 'check_with_wordpress' ) {
				return 'Continue Save';
			}

			if ( action === 'compare_conflicting_changes' ) {
				return 'Save';
			}

			return null;
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST:
			return null;
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES:
			return 'Review before update';
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE:
			if ( action === 'prepare_save' ) {
				return 'Continue Save';
			}

			return 'Send to WordPress';
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.WAITING_FOR_WORDPRESS:
			return null;
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED:
			return null;
	}

	return null;
}

function getDistributedEditingSaveJourneyRequiresActionBeforeSaveForStep(
	step,
	action
) {
	return (
		[ DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES ].includes(
			step
		) ||
		[
			'apply_local_changes',
			'prepare_changes',
			'check_with_wordpress',
			'compare_conflicting_changes',
			'prepare_save',
		].includes( action )
	);
}

/**
 * Returns the current M0 Save journey descriptor for real editor Save controls.
 * This is copy and state only; the descriptor does not perform the Save action
 * or change Save routing.
 *
 * @param {Object}  sessionState    DE-RTC session state.
 * @param {Object}  options         Save journey options.
 * @param {boolean} options.isDirty Whether the editor has local edits.
 *
 * @return {Object} Save journey descriptor.
 */
export function getDistributedEditingSaveJourneyStateForSessionState(
	sessionState = {},
	{ isDirty = false } = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const editorHasDirtyEdits = Boolean( isDirty );
	const humanLoopStep =
		getDistributedEditingHumanLoopStepStateForSessionState( normalized );
	const copy = getDistributedEditingSaveJourneyCopyForStep(
		humanLoopStep.step,
		humanLoopStep.action
	);
	const actionHint = getDistributedEditingSaveJourneyActionHintForStep(
		humanLoopStep.step,
		humanLoopStep.action
	);
	const saveJourneyState = {
		step: humanLoopStep.step,
		action: humanLoopStep.action,
		title: copy.title,
		summary: copy.summary,
		actionHint,
		requiresActionBeforeSave:
			getDistributedEditingSaveJourneyRequiresActionBeforeSaveForStep(
				humanLoopStep.step,
				humanLoopStep.action
			),
		saveButtonStatus: humanLoopStep.saveButtonStatus,
		saveButtonReason: humanLoopStep.saveButtonReason,
		saveButtonLabel: humanLoopStep.saveButtonLabel,
		saveButtonDisabled: humanLoopStep.saveButtonDisabled,
		saveButtonBusy: humanLoopStep.saveButtonBusy,
		statusChromeSummary: humanLoopStep.saveButtonStateSummaryText,
		statusChromeAuthorityState: humanLoopStep.saveAuthorityState,
		statusChromeAuthorityText: humanLoopStep.saveButtonAuthorityStatusText,
		saveButtonBlocksNormalSavePost:
			humanLoopStep.saveButtonBlocksNormalSavePost,
		confirmedByWordPress: humanLoopStep.confirmedByWordPress,
		descriptorOnly: true,
		callsRestEndpoint: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSavedWithoutEvidence: false,
		exposesRawContent: false,
		exposesProofInternals: false,
		exposesReviewerIds: false,
		exposesSaverIds: false,
		dirtyEditorPreflight: false,
	};
	const hasDistributedEditingPendingLocalChanges = Boolean(
		normalized.hasPendingChanges ||
			normalized.pendingChangeCount > 0 ||
			normalized.canExportLocalUpdates ||
			normalized.mustOfferLocalCopy
	);

	if (
		! editorHasDirtyEdits &&
		hasDistributedEditingPendingLocalChanges &&
		saveJourneyState.step ===
			DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_EDIT &&
		saveJourneyState.action === 'edit'
	) {
		return {
			...saveJourneyState,
			step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
			action: 'wait_or_export',
			title: 'Keep editing',
			summary: 'Use Save when you are ready.',
			requiresActionBeforeSave: false,
			statusChromeSummary: 'Use Save when you are ready.',
			statusChromeAuthorityText: 'Save can update the post.',
		};
	}

	if (
		editorHasDirtyEdits &&
		( ( saveJourneyState.step ===
			DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_EDIT &&
			saveJourneyState.action === 'edit' ) ||
			( saveJourneyState.step ===
				DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED &&
				saveJourneyState.action === 'none' ) )
	) {
		return {
			...saveJourneyState,
			step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
			action: 'dirty_save_preflight',
			title: 'Unsaved changes',
			summary: 'Use Save when you are ready.',
			actionHint: null,
			requiresActionBeforeSave: false,
			saveButtonStatus:
				DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY,
			saveButtonReason: null,
			saveButtonLabel: 'Update',
			saveButtonDisabled: false,
			saveButtonBusy: false,
			saveButtonBlocksNormalSavePost: false,
			confirmedByWordPress: false,
			dirtyEditorPreflight: true,
			statusChromeSummary: 'Use Save when you are ready.',
			statusChromeAuthorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_TO_UPDATE,
			statusChromeAuthorityText: 'Save can update the post.',
		};
	}

	return saveJourneyState;
}

/**
 * Returns the content-free vocabulary used by the repeated visible Save proof.
 * This mirrors the browser artifact shape without reading content, calling
 * REST, saving, autosaving, mutating state, or claiming persistence.
 *
 * @param {Object} sessionState DE-RTC session state.
 * @param {Object} [options]    Proof vocabulary inputs.
 *
 * @return {Object} Repeated visible Save proof vocabulary.
 */
export function getDistributedEditingRepeatedVisibleSaveProofStateForSessionState(
	sessionState = {},
	options = {}
) {
	const saveButton =
		getDistributedEditingSaveButtonStateForSessionState( sessionState );
	const saveJourney =
		getDistributedEditingSaveJourneyStateForSessionState( sessionState );
	const viewport = normalizeDistributedEditingProofViewport(
		getFirstDefined( options.viewport, options.view_port, options )
	);
	const requestDeltaAfterRepeatedClick =
		normalizeDistributedEditingRepeatedSaveRequestDelta(
			getFirstDefined(
				options.requestDeltaAfterRepeatedClick,
				options.request_delta_after_repeated_click
			)
		);
	const requestDeltaIsEmpty = Object.values(
		requestDeltaAfterRepeatedClick
	).every( ( count ) => count === 0 );
	const repeatedClickAttempted = Boolean(
		getFirstDefined(
			options.repeatedClickAttempted,
			options.repeated_click_attempted,
			true
		)
	);
	const secondClickFired = Boolean(
		getFirstDefined( options.secondClickFired, options.second_click_fired )
	);
	const delayedRefetchHeld = Boolean(
		getFirstDefined(
			options.delayedRefetchHeld,
			options.delayed_refetch_held
		)
	);
	const delayedRefetchReleased = Boolean(
		getFirstDefined(
			options.delayedRefetchReleased,
			options.delayed_refetch_released
		)
	);
	const delayedServerStateRefetchCount = normalizeCount(
		getFirstDefined(
			options.delayedServerStateRefetchCount,
			options.delayed_server_state_refetch_count
		)
	);
	const localProposalPreserved = Boolean(
		getFirstDefined(
			options.localProposalPreserved,
			options.local_proposal_preserved
		)
	);
	const dirtyStatePreserved = Boolean(
		getFirstDefined(
			options.dirtyStatePreserved,
			options.dirty_state_preserved
		)
	);
	const normalSaveBlocked = Boolean(
		getFirstDefined(
			options.normalSaveBlocked,
			options.normal_save_blocked,
			saveButton.blocksNormalSavePost &&
				! saveButton.shouldCallNormalSavePost
		)
	);
	const duplicateGuardedWritesPrevented = Boolean(
		getFirstDefined(
			options.duplicateGuardedWritesPrevented,
			options.duplicate_guarded_writes_prevented,
			requestDeltaIsEmpty && ! secondClickFired
		)
	);

	return {
		viewport,
		repeatedVisibleSaveIdempotency: {
			repeatedClickAttempted,
			secondClickFired,
			delayedRefetchHeld,
			delayedRefetchReleased,
			delayedServerStateRefetchCount,
			localProposalPreserved,
			dirtyStatePreserved,
			normalSaveBlocked,
			requestDeltaAfterRepeatedClick,
			buttonSnapshot: {
				text: saveButton.label,
				disabled: saveButton.disabled,
				busy: saveButton.busy,
				saveButtonStatus: saveButton.status,
				saveButtonClickAction: saveButton.clickAction,
				saveJourneyAction: saveJourney.action,
				saveButtonStateSummary: saveButton.saveStateSummaryText,
			},
			singlePeerGuardedPipeline: Boolean(
				getFirstDefined(
					options.singlePeerGuardedPipeline,
					options.single_peer_guarded_pipeline,
					repeatedClickAttempted &&
						delayedRefetchHeld &&
						normalSaveBlocked &&
						requestDeltaIsEmpty
				)
			),
			duplicateGuardedWritesPrevented,
			saveLoopPrevented: Boolean(
				getFirstDefined(
					options.saveLoopPrevented,
					options.save_loop_prevented,
					requestDeltaIsEmpty && saveButton.clickAction === null
				)
			),
		},
		descriptorOnly: true,
		contentFree: true,
		callsRestEndpoint: false,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		callsAutosaveEndpoint: false,
		dispatchesNotice: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
		exposesRawContent: false,
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
		clickAction = saveButton.clickAction;
		blocksNormalSavePost = true;
		opensPrePublishReview = Boolean( saveButton.opensPrePublishReview );
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
		DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.WORKFLOW_ACTION_REQUIRED
	) {
		status =
			DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.WORKFLOW_ACTION_REQUIRED;
		reason = saveButton.reason;
		saveButtonLabel = saveButton.label;
		clickAction = saveButton.clickAction;
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
		saveButtonAuthorityState: saveButton.authorityState,
		saveButtonAuthorityStatusText: saveButton.authorityStatusText,
		saveButtonAuthoritativePostUpdated: saveButton.authoritativePostUpdated,
		saveButtonPendingServerConfirmation:
			saveButton.pendingServerConfirmation,
		saveButtonLocalChangesState: saveButton.localChangesState,
		saveButtonReviewCheckpointState: saveButton.reviewCheckpointState,
		saveButtonAuthoritativePostState: saveButton.authoritativePostState,
		saveButtonStateSummaryText: saveButton.saveStateSummaryText,
		saveButtonStateVocabulary: saveButton.stateVocabulary,
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
			? 'Save'
			: 'Update',
		riskyBlockReviewSaveClickAction: hasPendingReviewItems
			? DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE
			: DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
		riskyBlockReviewCanExportLocalUpdates: false,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: false,
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
		riskyBlockReviewSaveButtonLabel: 'Save',
		riskyBlockReviewSaveClickAction:
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE,
		riskyBlockReviewCanExportLocalUpdates: false,
		riskyBlockReviewRequiresServerStateRefetch: true,
		riskyBlockReviewReviewedServerVersion: reviewedServerVersion,
		riskyBlockReviewCurrentServerVersion: currentServerVersion,
		mustOfferLocalCopy: true,
		canExportLocalUpdates: false,
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
		const isRetrySaveInProgress =
			reason ===
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS;
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
			isAwaitingServerConfirmation: isRetrySaveInProgress,
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
	const acceptedClientBaseVersion =
		normalizeNullableString(
			responseOrError.rebasedFromVersion ||
				responseOrError.rebased_from_version ||
				responseData.rebasedFromVersion ||
				responseData.rebased_from_version ||
				responseOrError.clientBaseVersion ||
				responseOrError.client_base_version ||
				responseData.clientBaseVersion ||
				responseData.client_base_version
		) || normalizedCurrent.clientBaseVersion;
	const acceptedServerVersion =
		normalizeNullableString(
			responseOrError.serverVersion ||
				responseOrError.server_version ||
				responseData.serverVersion ||
				responseData.server_version ||
				responseOrError.clientBaseVersion ||
				responseOrError.client_base_version ||
				responseData.clientBaseVersion ||
				responseData.client_base_version
		) || normalizedCurrent.serverVersion;
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
	const hasAcceptedConflictResolutionChoice =
		normalizedCurrent.staleBaseConflictResolutionRequiresFreshProof &&
		[
			DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
			DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
		].includes( normalizedCurrent.staleBaseConflictResolutionChoice ) &&
		[
			DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED,
			DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
		].includes( normalizedCurrent.staleBaseConflictResolutionStatus );

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
			clientBaseVersion: acceptedClientBaseVersion,
			serverVersion: acceptedServerVersion,
			pendingChangeCount,
			remoteChangeCount: 0,
			hasRemoteChanges: false,
			requiresServerStateAcceptance: false,
			requiresServerStateRefetch: false,
			canAttemptLocalRebase: false,
			requiresManualConflictResolution:
				hasAcceptedConflictResolutionChoice
					? false
					: normalizedCurrent.requiresManualConflictResolution,
			staleBaseConflictResolutionRequiresFreshProof:
				hasAcceptedConflictResolutionChoice
					? false
					: normalizedCurrent.staleBaseConflictResolutionRequiresFreshProof,
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
 * @param {Object} options             Preparation options.
 *
 * @return {Object} Normalized DE-RTC session state.
 */
export function getDistributedEditingSessionStateForRetrySubmitSavePreparation(
	currentSessionState = {},
	options = {}
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
		retrySubmitSaveRequiresExplicitSaveClick: Boolean(
			options.requiresExplicitSaveClick
		),
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
		canExportLocalUpdates: ! options.suppressExportDuringSave,
	} );
}

function isDistributedEditingRetrySaveAppliedResult( result ) {
	return (
		result === 'retry_save_applied' || result === 'retry_save_server_merged'
	);
}

function getRetrySaveServerMergeEvidenceFields(
	responseOrError = {},
	responseData = {},
	result = null
) {
	const serverMergeEvidence = normalizeObject(
		responseOrError.serverMerge ||
			responseOrError.server_merge ||
			responseData.serverMerge ||
			responseData.server_merge
	);
	const mergeStatus =
		serverMergeEvidence.mergeStatus || serverMergeEvidence.merge_status;
	const serverMergeApplied = Boolean(
		responseOrError.serverMergeApplied ||
			responseOrError.server_merge_applied ||
			responseData.serverMergeApplied ||
			responseData.server_merge_applied ||
			result === 'retry_save_server_merged' ||
			mergeStatus === 'merged'
	);

	return {
		retrySaveServerMergeApplied: serverMergeApplied,
		retrySaveServerMergeStatus: normalizeNullableString( mergeStatus ),
		retrySaveServerMergeStrategy: normalizeNullableString(
			serverMergeEvidence.mergeStrategy ||
				serverMergeEvidence.merge_strategy
		),
		retrySaveServerMergeBaseVersion: normalizeNullableString(
			serverMergeEvidence.baseVersion || serverMergeEvidence.base_version
		),
		retrySaveServerMergeServerVersion: normalizeNullableString(
			serverMergeEvidence.serverVersion ||
				serverMergeEvidence.server_version
		),
		retrySaveServerMergeBlockCount: normalizeCount(
			serverMergeEvidence.blockCount || serverMergeEvidence.block_count
		),
		retrySaveServerMergeServerChangedIndexes: normalizeBlockPath(
			serverMergeEvidence.serverChangedIndexes ||
				serverMergeEvidence.server_changed_indexes
		),
		retrySaveServerMergeLocalChangedIndexes: normalizeBlockPath(
			serverMergeEvidence.localChangedIndexes ||
				serverMergeEvidence.local_changed_indexes
		),
		retrySaveServerMergeMergedStrippedContentHash: normalizeSha256Hash(
			serverMergeEvidence.mergedStrippedContentHash ||
				serverMergeEvidence.merged_stripped_content_hash
		),
	};
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
	const responseRawPostContent =
		getDistributedEditingRawPostContentFromResponse( responseOrError );
	const responsePostContent = getDistributedEditingComparablePostContent(
		responseRawPostContent
	);
	const responseSyncMeta = getDistributedEditingSyncMetaFromPostContent(
		responseRawPostContent
	);
	const result = normalizeNullableString(
		responseOrError.result || responseData.result
	);
	const retrySaveAppliedResult =
		isDistributedEditingRetrySaveAppliedResult( result );
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
	const retrySaveServerMergeEvidence = getRetrySaveServerMergeEvidenceFields(
		responseOrError,
		responseData,
		result
	);
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
		retrySaveIdempotentNoWrite: Boolean(
			responseOrError.idempotentNoWrite ||
				responseOrError.idempotent_no_write ||
				responseData.idempotentNoWrite ||
				responseData.idempotent_no_write
		),
		retrySaveAlreadyPersisted: Boolean(
			responseOrError.alreadyPersisted ||
				responseOrError.already_persisted ||
				responseData.alreadyPersisted ||
				responseData.already_persisted
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
		retrySaveServerMerged: Boolean(
			responseOrError.serverMerged ||
				responseOrError.server_merged ||
				responseData.serverMerged ||
				responseData.server_merged ||
				retrySaveServerMergeEvidence.retrySaveServerMergeApplied ||
				result === 'retry_save_server_merged'
		),
		...retrySaveServerMergeEvidence,
	};
	const retrySaveConfirmedMergedEdits = Boolean(
		retrySaveFlags.retrySaveServerMerged ||
			retrySaveFlags.retrySaveServerMergeApplied ||
			normalizedCurrent.localRebaseResultStatus ===
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED
	);
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
	const partialSafeMergeApplied = Boolean(
		getFirstDefined(
			responseOrError.partialSafeMergeApplied,
			responseOrError.partial_safe_merge_applied,
			responseData.partialSafeMergeApplied,
			responseData.partial_safe_merge_applied
		)
	);
	const partialSafeMergeContent = partialSafeMergeApplied
		? responsePostContent
		: null;
	const partialSafeMergeFields =
		partialSafeMergeApplied && typeof partialSafeMergeContent === 'string'
			? {
					clientBaseVersion: serverVersion,
					clientBaseContent: partialSafeMergeContent,
					clientBaseSyncMeta:
						responseSyncMeta ??
						normalizedCurrent.clientBaseSyncMeta,
					refetchedServerContent: partialSafeMergeContent,
					refetchedServerState: true,
					requiresServerStateRefetch: false,
			  }
			: {};
	if (
		retrySaveAppliedResult &&
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
			saveButtonClickInFlight: false,
			pendingChangeCount: 0,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
			remoteChangeCount: 0,
			hasRemoteChanges: false,
			requiresServerStateAcceptance: false,
			requiresServerStateRefetch: false,
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
			retrySubmitSaveRequiresExplicitSaveClick: false,
			clientBaseVersion: serverVersion,
			clientBaseContent:
				typeof responsePostContent === 'string'
					? responsePostContent
					: normalizedCurrent.clientBaseContent,
			clientBaseSyncMeta:
				responseSyncMeta ?? normalizedCurrent.clientBaseSyncMeta,
			refetchedServerContent: null,
			refetchedServerState: false,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveReason: null,
			retrySaveAccepted: true,
			retrySaveServerVersion: serverVersion,
			retrySavePreviousServerVersion: previousServerVersion,
			retrySaveConfirmedMergedEdits,
			...retrySaveFlags,
			...normalizeRetrySaveReviewMetadataFields(),
			...normalizeRetrySaveReviewApprovalProofFields(),
			...normalizeRiskyBlockReviewMetadataFields(),
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
	const reasonCode = retrySaveAppliedResult
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
		( retrySaveAppliedResult
			? DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_MISSING_SAVED_STATE_EVIDENCE
			: result );
	const retrySaveReviewMetadata =
		getRetrySaveReviewMetadataFromResponseOrError(
			responseOrError,
			responseData
		);
	const retrySaveServerMergeConflictFields =
		getRetrySaveServerMergeConflictFieldsFromResponseOrError(
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
	const retrySaveRiskyBlockReviewState =
		getDistributedEditingSessionStateForKsesRiskyBlockReviewClassificationResult(
			responseOrError,
			normalizedCurrent
		);
	const retrySaveRiskyBlockReviewMetadata =
		normalizeRiskyBlockReviewMetadataFields(
			retrySaveRiskyBlockReviewState
		);

	return getDistributedEditingRejectedRetrySaveState( {
		normalizedCurrent,
		reasonCode,
		result: retrySaveAppliedResult
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
		retrySaveRiskyBlockReviewMetadata,
		hasAcceptedReviewApprovalProof,
		retrySaveServerMergeConflictFields,
		partialSafeMergeFields,
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
			retrySubmitSaveRequiresExplicitSaveClick: false,
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
	const hasAcceptedRetrySubmitProof =
		normalized.retrySubmitProofStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE &&
		normalized.retrySubmitAccepted &&
		normalized.retrySubmitSavePathRequired;
	const hasPreparedRetrySubmitSavePath =
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
	const hasAcceptedReviewProof = Boolean(
		acceptedReviewApprovalProof || acceptedFreshReviewConsumeValidation
	);
	const hasAcceptedProof =
		hasAcceptedRetrySubmitProof || hasAcceptedReviewProof;
	const hasPreparedSavePath =
		hasPreparedRetrySubmitSavePath || hasAcceptedReviewProof;
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
	const alreadyPersisted = Boolean(
		retrySaveFlags.retrySaveIdempotentNoWrite &&
			retrySaveFlags.retrySaveAlreadyPersisted &&
			retrySaveFlags.retrySaveClaimsSaved
	);

	return Boolean(
		serverVersion &&
			( alreadyPersisted ||
				( retrySaveFlags.retrySaveSavesPost &&
					retrySaveFlags.retrySaveMutatesPostContent &&
					retrySaveFlags.retrySaveClaimsSaved ) )
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
	const hasConflictResolutionChoice = [
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
	].includes( normalized.staleBaseConflictResolutionChoice );
	const conflictResolutionProofAccepted =
		normalized.retrySubmitProofStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE &&
		normalized.retrySubmitAccepted &&
		hasConflictResolutionChoice &&
		! normalized.staleBaseConflictResolutionRequiresFreshProof;
	const conflictResolutionNeedsSavePreparation =
		conflictResolutionProofAccepted &&
		! normalized.retrySubmitSavePrepared &&
		normalized.retrySubmitSaveStatus !==
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY;

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
		staleBaseConflictResolutionStatus:
			normalized.staleBaseConflictResolutionStatus,
		staleBaseConflictResolutionChoice:
			normalized.staleBaseConflictResolutionChoice,
		staleBaseConflictResolutionRequiresFreshProof:
			normalized.staleBaseConflictResolutionRequiresFreshProof,
		conflictResolutionProofAccepted,
		conflictResolutionNeedsSavePreparation,
		conflictResolutionAuthoritativePostUpdated:
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				normalized
			),
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
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING:
			return 'info';
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
		retrySaveConfirmedMergedEdits: normalized.retrySaveConfirmedMergedEdits,
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
		retrySubmitSaveRequiresExplicitSaveClick: false,
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
	retrySaveRiskyBlockReviewMetadata = {},
	retrySaveServerMergeConflictFields = {},
	partialSafeMergeFields = {},
	hasAcceptedReviewApprovalProof = false,
	retrySaveReason = null,
} ) {
	let disposition = normalizedCurrent.disposition;
	let retrySaveStatus = DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE;
	let requiresServerStateRefetch = false;
	let requiresManualConflictResolution =
		normalizedCurrent.requiresManualConflictResolution;
	const partialSafeMergeAcceptedServerState = Boolean(
		partialSafeMergeFields.refetchedServerState &&
			reasonCode ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT
	);
	const shouldPreserveRetrySubmitProof =
		! partialSafeMergeAcceptedServerState &&
		( reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT ||
			reasonCode ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML );

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

		case DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REBASE_FAILED:
			if (
				retrySaveServerMergeConflictFields.requiresManualConflictResolution
			) {
				disposition =
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION;
				retrySaveStatus =
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED;
				requiresServerStateRefetch = false;
				requiresManualConflictResolution = true;
			}
			break;
	}

	if ( result === 'stale_base_rejected' ) {
		disposition =
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION;
		retrySaveStatus =
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED;
		requiresServerStateRefetch = true;
	}

	if ( partialSafeMergeFields.refetchedServerState ) {
		requiresServerStateRefetch = false;
		requiresManualConflictResolution = false;
	}
	const hasHashOnlyRiskyBlockReview =
		reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT &&
		( retrySaveReviewMetadata.retrySaveReviewRawContentIncluded === false ||
			normalizeCount(
				retrySaveRiskyBlockReviewMetadata.riskyBlockReviewPendingCount
			) > 0 ) &&
		! retrySaveRiskyBlockReviewMetadata.riskyBlockReviewRawContentIncluded;
	const shouldSuppressRejectedLocalCopy =
		hasHashOnlyRiskyBlockReview ||
		reasonCode ===
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML;
	const shouldOfferRejectedLocalCopy =
		! shouldSuppressRejectedLocalCopy &&
		normalizeCount( pendingChangeCount ) > 0;

	return normalizeDistributedEditingSessionState( {
		...normalizedCurrent,
		...partialSafeMergeFields,
		disposition,
		reasonCode,
		serverVersion,
		saveButtonClickInFlight: false,
		pendingChangeCount,
		hasPendingChanges: normalizeCount( pendingChangeCount ) > 0,
		isAwaitingServerConfirmation: partialSafeMergeAcceptedServerState
			? false
			: normalizeCount( pendingChangeCount ) > 0,
		requiresServerStateRefetch,
		refetchedServerState: Boolean(
			partialSafeMergeFields.refetchedServerState
		),
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
		retrySubmitSaveRequiresExplicitSaveClick: shouldPreserveRetrySubmitProof
			? normalizedCurrent.retrySubmitSaveRequiresExplicitSaveClick
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
		...retrySaveRiskyBlockReviewMetadata,
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
		...( retrySaveServerMergeConflictFields.requiresManualConflictResolution
			? {
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultReason:
						retrySaveServerMergeConflictFields.localRebaseResultReason,
					canAttemptLocalRebase: false,
			  }
			: {} ),
		mustOfferLocalCopy: shouldOfferRejectedLocalCopy,
		canExportLocalUpdates: shouldOfferRejectedLocalCopy
			? normalizedCurrent.canExportLocalUpdates ||
			  normalizeCount( pendingChangeCount ) > 0
			: false,
	} );
}

function getRetrySaveServerMergeConflictFieldsFromResponseOrError(
	responseOrError = {},
	responseData = {}
) {
	const detail = normalizeNullableString(
		responseOrError.detail ||
			responseData.detail ||
			responseOrError.errorDetail ||
			responseData.errorDetail
	);
	const serverMergeStatus = normalizeNullableString(
		responseOrError.serverMergeStatus ||
			responseOrError.server_merge_status ||
			responseData.serverMergeStatus ||
			responseData.server_merge_status
	);
	const requiresManualConflictResolution = Boolean(
		responseOrError.requiresManualConflictResolution ||
			responseOrError.requires_manual_conflict_resolution ||
			responseData.requiresManualConflictResolution ||
			responseData.requires_manual_conflict_resolution ||
			serverMergeStatus === 'manual_conflict_required'
	);
	let localRebaseResultReason = null;

	if ( detail === 'retry_save_server_merge_same_serialized_block_changed' ) {
		localRebaseResultReason = 'same_block_changed';
	}

	return {
		requiresManualConflictResolution: Boolean(
			requiresManualConflictResolution && localRebaseResultReason
		),
		localRebaseResultReason,
	};
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
	const readOnlyComparison =
		createDistributedEditingFreshReviewReadOnlyComparisonSurfaceDescriptor(
			item
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
		readOnlyComparison,
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
		riskyBlockReviewSaveButtonLabel = 'Save';
		riskyBlockReviewSaveClickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE;
	} else if ( riskyBlockReviewHasPendingItems ) {
		riskyBlockReviewSaveButtonLabel = 'Save';
		riskyBlockReviewSaveClickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
	}

	riskyBlockReviewSaveButtonLabel =
		normalizeNullableString(
			sessionState.riskyBlockReviewSaveButtonLabel
		) || riskyBlockReviewSaveButtonLabel;
	if (
		[ 'Review changes', 'Export changes for review' ].includes(
			riskyBlockReviewSaveButtonLabel
		) ||
		riskyBlockReviewSaveButtonLabel.toLowerCase().includes( 'latest post' )
	) {
		riskyBlockReviewSaveButtonLabel = 'Save';
	}
	riskyBlockReviewSaveClickAction =
		normalizeNullableString(
			sessionState.riskyBlockReviewSaveClickAction
		) || riskyBlockReviewSaveClickAction;
	if (
		riskyBlockReviewSaveClickAction ===
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW &&
		riskyBlockReviewHasPendingItems
	) {
		riskyBlockReviewSaveClickAction =
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE;
	}

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
		riskyBlockReviewCanExportLocalUpdates: Boolean(
			sessionState.riskyBlockReviewCanExportLocalUpdates
		),
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
	const rawReviewStatus = getFirstDefined(
		item.reviewStatus,
		item.review_status,
		item.status,
		item.effectiveStatus
	);
	let mappedReviewStatus = rawReviewStatus;

	if ( rawReviewStatus === 'pending' ) {
		mappedReviewStatus =
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW;
	} else if ( rawReviewStatus === 'discarded' ) {
		mappedReviewStatus =
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED;
	}
	const reviewStatus = VALID_RISKY_BLOCK_REVIEW_ITEM_STATUSES.has(
		mappedReviewStatus
	)
		? mappedReviewStatus
		: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW;

	return {
		id: normalizeNullableString(
			getFirstDefined( item.id, item.reviewItemId, item.review_item_id )
		),
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
			getFirstDefined(
				item.serverVersion,
				item.server_version,
				item.serverSyncVersion,
				item.server_sync_version
			)
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
		sourceAvailable: Boolean(
			getFirstDefined( item.sourceAvailable, item.source_available )
		),
		contentTransport: normalizeNullableString(
			getFirstDefined( item.contentTransport, item.content_transport )
		),
		detailLoaded: Boolean(
			getFirstDefined( item.detailLoaded, item.detail_loaded )
		),
		proposedSourceDisplay: normalizeNullableString(
			getFirstDefined(
				item.proposedSourceDisplay,
				item.proposed_source_display
			)
		),
		ksesFilteredSourceDisplay: normalizeNullableString(
			getFirstDefined(
				item.ksesFilteredSourceDisplay,
				item.kses_filtered_source_display
			)
		),
		proposedSourceLength: normalizeNullableInteger(
			getFirstDefined(
				item.proposedSourceLength,
				item.proposed_source_length
			)
		),
		ksesFilteredSourceLength: normalizeNullableInteger(
			getFirstDefined(
				item.ksesFilteredSourceLength,
				item.kses_filtered_source_length
			)
		),
		canApprove:
			getFirstDefined( item.canApprove, item.can_approve ) !== false,
		canModifyAdopt:
			getFirstDefined( item.canModifyAdopt, item.can_modify_adopt ) !==
			false,
		canReject: getFirstDefined( item.canReject, item.can_reject ) !== false,
		canDiscard: Boolean(
			getFirstDefined( item.canDiscard, item.can_discard )
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
		annotation: normalizeRiskyBlockReviewAnnotation(
			item.annotation,
			item
		),
	};
}

function normalizeRiskyBlockReviewAnnotation( annotation = {}, item = {} ) {
	const blockLabel =
		normalizeNullableString(
			getFirstDefined(
				item.blockLabel,
				item.block_label,
				item.blockName,
				item.block_name
			)
		) || 'Review item';
	const saveAuthorityLabel =
		normalizeNullableString(
			getFirstDefined(
				annotation.saveAuthorityLabel,
				annotation.save_authority_label,
				annotation.accessibleLabel,
				annotation.accessible_label
			)
		) || `HTML review required before Save for ${ blockLabel }`;
	const saveAuthorityMessage =
		normalizeNullableString(
			getFirstDefined(
				annotation.saveAuthorityMessage,
				annotation.save_authority_message,
				annotation.guidance,
				annotation.guidance_message
			)
		) ||
		'This highlighted block needs HTML review before Save can update the post.';

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
		saveAuthorityLabel,
		saveAuthorityMessage,
		hasSaveAuthorityCopy: true,
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
	const actionTranscriptReport =
		normalizeDistributedEditingLocalUpdatesImportActionTranscriptReport(
			options.localUpdatesImportActionTranscriptReport
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
		localUpdatesImportActionTranscriptReport: actionTranscriptReport,
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
		actionTranscriptReport:
			sessionState.localUpdatesImportActionTranscriptReport,
		hasActionTranscriptReport: Boolean(
			sessionState.localUpdatesImportActionTranscriptReport?.available
		),
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

function normalizeNonNegativeInteger( value ) {
	const number = Number( value );
	return Number.isInteger( number ) && number >= 0 ? number : null;
}

function normalizeNullableContentString( value ) {
	return typeof value === 'string' ? value : null;
}

function canonicalizeDistributedEditingCoreBlockCommentDelimiters( value ) {
	if ( typeof value !== 'string' || ! value.includes( 'wp:core/' ) ) {
		return value;
	}

	return value.replace(
		/<!--\s*(\/?)wp:core\/([^\s>]+)([\s\S]*?)-->/g,
		'<!-- $1wp:$2$3-->'
	);
}

function canonicalizeDistributedEditingSerializedBlockBoundaryWhitespace(
	value
) {
	if ( typeof value !== 'string' || ! value.includes( '<!-- wp:' ) ) {
		return value;
	}

	return value
		.replace( /(<!--\s*wp:[\s\S]*?-->)\s+(?=<)/g, '$1' )
		.replace( /(?<=>)\s+(<!--\s*\/wp:[\s\S]*?-->)/g, '$1' )
		.replace( /(<!--\s*\/wp:[\s\S]*?-->)\s+(?=<!--\s*wp:)/g, '$1' );
}

function normalizeDistributedEditingHistoryStack( value ) {
	if ( ! Array.isArray( value ) ) {
		return [];
	}

	return value
		.slice( -20 )
		.map( ( item ) => ( {
			beforeContent: normalizeNullableContentString(
				item?.beforeContent
			),
			afterContent: normalizeNullableContentString( item?.afterContent ),
			label: normalizeNullableString( item?.label ),
			source: normalizeNullableString( item?.source ),
		} ) )
		.filter(
			( item ) =>
				typeof item.beforeContent === 'string' &&
				typeof item.afterContent === 'string'
		);
}

function normalizeDistributedEditingSyncMeta( value ) {
	return value && typeof value === 'object' && ! Array.isArray( value )
		? value
		: null;
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

function normalizeDistributedEditingProofViewport( value = {} ) {
	const viewport = normalizeObject( value );
	const width = normalizeNullableInteger(
		getFirstDefined( viewport.width, viewport.viewportWidth )
	);
	const height = normalizeNullableInteger(
		getFirstDefined( viewport.height, viewport.viewportHeight )
	);

	return width && height ? { width, height } : null;
}

function normalizeDistributedEditingRepeatedSaveRequestDelta( value = {} ) {
	const delta = normalizeObject( value );

	return {
		serverStateRefetch: normalizeCount(
			getFirstDefined(
				delta.serverStateRefetch,
				delta.server_state_refetch
			)
		),
		retrySubmit: normalizeCount(
			getFirstDefined( delta.retrySubmit, delta.retry_submit )
		),
		retrySave: normalizeCount(
			getFirstDefined( delta.retrySave, delta.retry_save )
		),
		distributedEditing: normalizeCount(
			getFirstDefined(
				delta.distributedEditing,
				delta.distributed_editing
			)
		),
		autosave: normalizeCount( delta.autosave ),
		normalPostMutation: normalizeCount(
			getFirstDefined(
				delta.normalPostMutation,
				delta.normal_post_mutation
			)
		),
	};
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

export function getDistributedEditingServerVersionFromResponse(
	responseOrError
) {
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

export function getDistributedEditingPostContentFromResponse(
	responseOrError
) {
	const rawPostContent =
		getDistributedEditingRawPostContentFromResponse( responseOrError );

	return getDistributedEditingComparablePostContent( rawPostContent );
}

export function getDistributedEditingComparablePostContent( postContent ) {
	const strippedPostContent =
		stripDistributedEditingSyncMetaFromPostContent( postContent );

	return canonicalizeDistributedEditingSerializedBlockBoundaryWhitespace(
		canonicalizeDistributedEditingCoreBlockCommentDelimiters(
			strippedPostContent
		)
	);
}

export function getDistributedEditingRawPostContentFromResponse(
	responseOrError
) {
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

export function getDistributedEditingSyncMetaFromPostContent( postContent ) {
	return parseDistributedEditingSyncMetaFromPostContent( postContent )
		?.syncMeta;
}

function parseDistributedEditingSyncMetaFromPostContent( postContent ) {
	const content = normalizeNullableContentString( postContent );

	if ( content === null ) {
		return null;
	}

	const freeformWrappedSyncMetaSource = `(?:<!--\\s*wp:freeform\\s*-->\\s*)?<p>\\s*${ DISTRIBUTED_EDITING_SYNC_META_SCRIPT_SOURCE }\\s*<\\/p>\\s*(?:<!--\\s*\\/wp:freeform\\s*-->\\s*)?`;
	const htmlBlockWrappedSyncMetaSource = `<!--\\s*wp:html\\s*-->\\s*${ DISTRIBUTED_EDITING_SYNC_META_SCRIPT_SOURCE }\\s*<!--\\s*\\/wp:html\\s*-->`;
	const coreSyncMetaBlockSource = `<!--\\s*wp:(?:core\\/)?sync-meta\\b[^>]*-->\\s*${ DISTRIBUTED_EDITING_SYNC_META_SCRIPT_SOURCE }\\s*<!--\\s*\\/wp:(?:core\\/)?sync-meta\\s*-->`;
	const coreSyncMetaBlockPrefixPattern = new RegExp(
		`^\\s*${ coreSyncMetaBlockSource }\\s*`,
		'i'
	);
	const coreSyncMetaBlockPrefixMatch = content.match(
		coreSyncMetaBlockPrefixPattern
	);

	if ( coreSyncMetaBlockPrefixMatch ) {
		return createDistributedEditingSyncMetaParseResult( {
			postContent: content.slice(
				coreSyncMetaBlockPrefixMatch[ 0 ].length
			),
			scriptContent: getDistributedEditingSyncMetaScriptContent(
				coreSyncMetaBlockPrefixMatch
			),
		} );
	}

	const htmlBlockPrefixPattern = new RegExp(
		`^\\s*${ htmlBlockWrappedSyncMetaSource }\\s*`,
		'i'
	);
	const htmlBlockPrefixMatch = content.match( htmlBlockPrefixPattern );

	if ( htmlBlockPrefixMatch ) {
		return createDistributedEditingSyncMetaParseResult( {
			postContent: content.slice( htmlBlockPrefixMatch[ 0 ].length ),
			scriptContent:
				getDistributedEditingSyncMetaScriptContent(
					htmlBlockPrefixMatch
				),
		} );
	}

	const wrappedPrefixPattern = new RegExp(
		`^\\s*${ freeformWrappedSyncMetaSource }\\s*`,
		'i'
	);
	const wrappedPrefixMatch = content.match( wrappedPrefixPattern );

	if ( wrappedPrefixMatch ) {
		return createDistributedEditingSyncMetaParseResult( {
			postContent: content.slice( wrappedPrefixMatch[ 0 ].length ),
			scriptContent:
				getDistributedEditingSyncMetaScriptContent(
					wrappedPrefixMatch
				),
		} );
	}

	const prefixPattern = new RegExp(
		`^\\s*${ DISTRIBUTED_EDITING_SYNC_META_SCRIPT_SOURCE }\\s*`,
		'i'
	);
	const prefixMatch = content.match( prefixPattern );

	if ( prefixMatch ) {
		return createDistributedEditingSyncMetaParseResult( {
			postContent: content.slice( prefixMatch[ 0 ].length ),
			scriptContent:
				getDistributedEditingSyncMetaScriptContent( prefixMatch ),
		} );
	}

	const wrappedTrailerPattern = new RegExp(
		`\\s*${ freeformWrappedSyncMetaSource }\\s*$`,
		'i'
	);
	const wrappedTrailerMatch = content.match( wrappedTrailerPattern );

	if ( wrappedTrailerMatch ) {
		return createDistributedEditingSyncMetaParseResult( {
			postContent: content.slice(
				0,
				content.length - wrappedTrailerMatch[ 0 ].length
			),
			scriptContent:
				getDistributedEditingSyncMetaScriptContent(
					wrappedTrailerMatch
				),
		} );
	}

	const coreSyncMetaBlockTrailerPattern = new RegExp(
		`\\s*${ coreSyncMetaBlockSource }\\s*$`,
		'i'
	);
	const coreSyncMetaBlockTrailerMatch = content.match(
		coreSyncMetaBlockTrailerPattern
	);

	if ( coreSyncMetaBlockTrailerMatch ) {
		return createDistributedEditingSyncMetaParseResult( {
			postContent: content.slice(
				0,
				content.length - coreSyncMetaBlockTrailerMatch[ 0 ].length
			),
			scriptContent: getDistributedEditingSyncMetaScriptContent(
				coreSyncMetaBlockTrailerMatch
			),
		} );
	}

	const htmlBlockTrailerPattern = new RegExp(
		`\\s*${ htmlBlockWrappedSyncMetaSource }\\s*$`,
		'i'
	);
	const htmlBlockTrailerMatch = content.match( htmlBlockTrailerPattern );

	if ( htmlBlockTrailerMatch ) {
		return createDistributedEditingSyncMetaParseResult( {
			postContent: content.slice(
				0,
				content.length - htmlBlockTrailerMatch[ 0 ].length
			),
			scriptContent: getDistributedEditingSyncMetaScriptContent(
				htmlBlockTrailerMatch
			),
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
			scriptContent:
				getDistributedEditingSyncMetaScriptContent( trailerMatch ),
		} );
	}

	return {
		postContent: content,
		syncMeta: null,
	};
}

function getDistributedEditingSyncMetaScriptContent( match ) {
	for ( let index = match.length - 1; index > 0; index-- ) {
		if ( typeof match[ index ] === 'string' ) {
			return match[ index ];
		}
	}

	return '';
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

export async function getDistributedEditingPostContentWithAutomergeSyncMeta( {
	clientBaseContent,
	proposedPostContent,
	existingSyncMeta = null,
	actor = 'editor',
} = {} ) {
	const base =
		getDistributedEditingComparablePostContent( clientBaseContent );
	const proposed =
		getDistributedEditingComparablePostContent( proposedPostContent );

	if ( typeof base !== 'string' || typeof proposed !== 'string' ) {
		return {
			status: 'blocked',
			reason: 'missing_automerge_content_pair',
			postContent: proposedPostContent,
			syncMeta: null,
		};
	}

	const updateDescriptor =
		await getDistributedEditingAutomergeClientUpdateDescriptor( {
			clientBaseContent: base,
			proposedPostContent: proposed,
			actor,
		} );

	if ( updateDescriptor.status !== 'ready' || ! updateDescriptor.update ) {
		return {
			...updateDescriptor,
			postContent: proposed,
			syncMeta: null,
		};
	}

	const clientBaseVersion = normalizeNullableString(
		existingSyncMeta?.version ?? existingSyncMeta?.serverVersion ?? '0'
	);
	const syncMeta = {
		...( existingSyncMeta &&
		typeof existingSyncMeta === 'object' &&
		! Array.isArray( existingSyncMeta )
			? existingSyncMeta
			: {} ),
		schema: DISTRIBUTED_EDITING_AUTOMERGE_BLOCKS_SCHEMA,
		version: clientBaseVersion || '0',
		client_base_version: clientBaseVersion || '0',
		pending_automerge_encoding:
			DISTRIBUTED_EDITING_AUTOMERGE_BLOCKS_UPDATE_FORMAT,
		pending_automerge_update: encodeDistributedEditingBase64Json(
			updateDescriptor.update
		),
	};
	delete syncMeta.automerge_client_update;
	delete syncMeta.automerge_update_role;

	return {
		status: 'ready',
		reason: null,
		postContent: `${ formatDistributedEditingSyncMetaBlock(
			syncMeta
		) }${ proposed }`,
		syncMeta,
		update: updateDescriptor.update,
		changeRange: updateDescriptor.changeRange,
	};
}

function formatDistributedEditingSyncMetaBlock( syncMeta ) {
	const json = JSON.stringify( syncMeta ).replace( /</g, '\\u003c' );

	return (
		'<!-- wp:sync-meta {"format":"automerge"} -->\n' +
		'<script type="application/json" data-wp-sync-meta="distributed-editing" data-sync-meta-format="automerge">' +
		json +
		'</script>\n' +
		'<!-- /wp:sync-meta -->'
	);
}

function encodeDistributedEditingBase64Json( value ) {
	const json = JSON.stringify( value );

	if ( typeof globalThis?.TextEncoder === 'function' ) {
		const bytes = new globalThis.TextEncoder().encode( json );
		let binary = '';

		for ( const byte of bytes ) {
			binary += String.fromCharCode( byte );
		}

		if ( typeof globalThis?.btoa === 'function' ) {
			return globalThis.btoa( binary );
		}
	}

	if ( typeof globalThis?.btoa === 'function' ) {
		return globalThis.btoa( unescape( encodeURIComponent( json ) ) );
	}

	if ( typeof globalThis?.Buffer?.from === 'function' ) {
		return globalThis.Buffer.from( json, 'utf8' ).toString( 'base64' );
	}

	return json;
}

export async function getDistributedEditingAutomergeClientUpdateDescriptor( {
	clientBaseContent,
	proposedPostContent,
	actor = 'editor',
} = {} ) {
	const base = canonicalizeDistributedEditingCoreBlockCommentDelimiters(
		normalizeNullableContentString( clientBaseContent )
	);
	const proposed = canonicalizeDistributedEditingCoreBlockCommentDelimiters(
		normalizeNullableContentString( proposedPostContent )
	);

	if ( typeof base !== 'string' || typeof proposed !== 'string' ) {
		return {
			status: 'blocked',
			reason: 'missing_automerge_content_pair',
			update: null,
		};
	}

	const baseBlocks = getSerializedBlockTokens( base );
	const proposedBlocks = getSerializedBlockTokens( proposed );

	for ( const blockSet of [ baseBlocks, proposedBlocks ] ) {
		if ( blockSet.status !== 'safe' ) {
			return {
				status: 'blocked',
				reason: blockSet.reason,
				update: null,
			};
		}
	}

	const operations =
		await getDistributedEditingAutomergeBlockNativeOperations( {
			baseBlocks: baseBlocks.blocks,
			proposedBlocks: proposedBlocks.blocks,
			actor,
		} );
	const baseContentHash =
		await getDistributedEditingPostContentSha256Hash( base );
	const proposedContentHash =
		await getDistributedEditingPostContentSha256Hash( proposed );

	return {
		status: 'ready',
		reason: null,
		update: {
			format: DISTRIBUTED_EDITING_AUTOMERGE_BLOCKS_UPDATE_FORMAT,
			schema: DISTRIBUTED_EDITING_AUTOMERGE_BLOCKS_SCHEMA,
			operations,
			stateVector:
				operations.length > 0 ? { [ actor ]: operations.length } : {},
			baseContentHash,
			proposedContentHash,
			baseBlockCount: baseBlocks.blocks.length,
			proposedBlockCount: proposedBlocks.blocks.length,
			interop: await getDistributedEditingAutomergeInteropEvidence(),
		},
		changeRange: getDistributedEditingAutomergeContentChangeDescriptor(
			base,
			proposed
		).changeRange,
	};
}

async function getDistributedEditingAutomergeBlockNativeOperations( {
	baseBlocks,
	proposedBlocks,
	actor,
} ) {
	const operations = [];
	const pushOperation = async ( operation ) => {
		const sequence = operations.length;
		operations.push( {
			actor,
			sequence,
			id: `${ actor }:${ sequence }`,
			...operation,
		} );
	};
	const baseHashes = await Promise.all(
		baseBlocks.map( ( block ) =>
			getDistributedEditingPostContentSha256Hash( block )
		)
	);
	const proposedHashes = await Promise.all(
		proposedBlocks.map( ( block ) =>
			getDistributedEditingPostContentSha256Hash( block )
		)
	);

	if (
		baseBlocks.length === proposedBlocks.length &&
		! baseBlocks.every(
			( block, index ) => block === proposedBlocks[ index ]
		) &&
		haveSameSerializedBlockMultiset( baseBlocks, proposedBlocks ) &&
		new Set( baseHashes ).size === baseHashes.length
	) {
		for ( let index = 0; index < baseBlocks.length; index++ ) {
			if ( baseBlocks[ index ] === proposedBlocks[ index ] ) {
				continue;
			}

			const fromIndex = baseHashes.indexOf( proposedHashes[ index ] );

			if ( fromIndex !== -1 && fromIndex !== index ) {
				await pushOperation( {
					type: 'block.move',
					automergePrimitive: 'Automerge.List.move',
					fromPath: [ fromIndex ],
					toPath: [ index ],
					blockUid: `top:${ proposedHashes[ index ] }`,
					blockHash: proposedHashes[ index ],
				} );
			}
		}

		return operations;
	}

	if ( baseBlocks.length === proposedBlocks.length ) {
		for ( let index = 0; index < baseBlocks.length; index++ ) {
			if ( baseBlocks[ index ] === proposedBlocks[ index ] ) {
				continue;
			}

			await pushOperation(
				await getDistributedEditingAutomergeBlockUpdateOperation( {
					baseBlock: baseBlocks[ index ],
					proposedBlock: proposedBlocks[ index ],
					baseBlockHash: baseHashes[ index ],
					proposedBlockHash: proposedHashes[ index ],
					path: [ index ],
				} )
			);
		}

		return operations;
	}

	let prefix = 0;
	while (
		prefix < baseBlocks.length &&
		prefix < proposedBlocks.length &&
		baseBlocks[ prefix ] === proposedBlocks[ prefix ]
	) {
		prefix += 1;
	}

	let suffix = 0;
	while (
		suffix < baseBlocks.length - prefix &&
		suffix < proposedBlocks.length - prefix &&
		baseBlocks[ baseBlocks.length - 1 - suffix ] ===
			proposedBlocks[ proposedBlocks.length - 1 - suffix ]
	) {
		suffix += 1;
	}

	for (
		let index = baseBlocks.length - suffix - 1;
		index >= prefix;
		index--
	) {
		await pushOperation( {
			type: 'block.delete',
			automergePrimitive: 'Automerge.List.delete',
			path: [ index ],
			index,
			blockUid: `top:${ baseHashes[ index ] }`,
			blockHash: baseHashes[ index ],
		} );
	}

	for (
		let index = prefix;
		index < proposedBlocks.length - suffix;
		index++
	) {
		await pushOperation( {
			type: 'block.insert',
			automergePrimitive: 'Automerge.List.insert',
			path: [ index ],
			index,
			blockUid: `top:${ proposedHashes[ index ] }`,
			blockHash: proposedHashes[ index ],
			blockName: getDistributedEditingBlockIdentitySerializedBlockName(
				proposedBlocks[ index ]
			),
			serializedBlock: proposedBlocks[ index ],
		} );
	}

	return operations;
}

async function getDistributedEditingAutomergeBlockUpdateOperation( {
	baseBlock,
	proposedBlock,
	baseBlockHash,
	proposedBlockHash,
	path,
} ) {
	const baseBlockName =
		getDistributedEditingBlockIdentitySerializedBlockName( baseBlock );
	const proposedBlockName =
		getDistributedEditingBlockIdentitySerializedBlockName( proposedBlock );

	if ( baseBlockName && baseBlockName === proposedBlockName ) {
		const richTextChange =
			getDistributedEditingAutomergeRichTextBlockOperation( {
				baseBlock,
				proposedBlock,
				path,
				baseBlockHash,
				proposedBlockHash,
				blockName: baseBlockName,
			} );

		if ( richTextChange ) {
			return richTextChange;
		}

		return {
			type: 'block.update_serialized',
			automergePrimitive: 'Automerge.Map.set',
			path,
			blockUid: `top:${ baseBlockHash }`,
			blockName: baseBlockName,
			baseBlockHash,
			proposedBlockHash,
			changeRange: getDistributedEditingAutomergeContentChangeDescriptor(
				baseBlock,
				proposedBlock
			).changeRange,
			serializedBlock: proposedBlock,
		};
	}

	return {
		type: 'block.replace',
		automergePrimitive: 'Automerge.Map.set+Automerge.List.insert',
		path,
		blockUid: `top:${ proposedBlockHash }`,
		baseBlockHash,
		proposedBlockHash,
		baseBlockName,
		proposedBlockName,
		serializedBlock: proposedBlock,
	};
}

function getDistributedEditingAutomergeRichTextBlockOperation( {
	baseBlock,
	proposedBlock,
	path,
	baseBlockHash,
	proposedBlockHash,
	blockName,
} ) {
	const base = getParagraphRichTextBlockParts( baseBlock );
	const proposed = getParagraphRichTextBlockParts( proposedBlock );

	if (
		! base ||
		! proposed ||
		base.open !== proposed.open ||
		base.close !== proposed.close
	) {
		return null;
	}

	const baseRichText = getRichTextFormatModel( base.html );
	const proposedRichText = getRichTextFormatModel( proposed.html );

	if ( ! baseRichText || ! proposedRichText ) {
		return null;
	}

	if ( baseRichText.text !== proposedRichText.text ) {
		return {
			type: 'block.rich_text_content',
			automergePrimitive: 'Automerge.Text.splice',
			path,
			blockUid: `top:${ baseBlockHash }`,
			blockName,
			field: 'innerHTML',
			baseBlockHash,
			proposedBlockHash,
			textSplice: getRichTextTextSplice(
				baseRichText.text,
				proposedRichText.text
			),
			serializedBlock: proposedBlock,
		};
	}

	return {
		type: 'block.rich_text_format',
		automergePrimitive: 'Automerge.Text.mark',
		path,
		blockUid: `top:${ baseBlockHash }`,
		blockName,
		field: 'innerHTML',
		baseBlockHash,
		proposedBlockHash,
		changedTextIndexes: Array.from(
			getRichTextChangedIndexes( baseRichText, proposedRichText )
		),
		serializedBlock: proposedBlock,
	};
}

function getDistributedEditingAutomergeContentChangeDescriptor(
	base,
	proposed
) {
	let prefix = 0;
	const baseLength = base.length;
	const proposedLength = proposed.length;

	while (
		prefix < baseLength &&
		prefix < proposedLength &&
		base.charCodeAt( prefix ) === proposed.charCodeAt( prefix )
	) {
		prefix += 1;
	}

	let suffix = 0;
	while (
		suffix < baseLength - prefix &&
		suffix < proposedLength - prefix &&
		base.charCodeAt( baseLength - 1 - suffix ) ===
			proposed.charCodeAt( proposedLength - 1 - suffix )
	) {
		suffix += 1;
	}

	const deleteLength = baseLength - prefix - suffix;
	const insertText = proposed.slice( prefix, proposedLength - suffix );

	return {
		index: prefix,
		deleteLength,
		insertText,
		insertLength: insertText.length,
		changeRange: {
			start: prefix,
			end: prefix + deleteLength,
			deleteLength,
			insertLength: insertText.length,
			changed: deleteLength > 0 || insertText.length > 0,
		},
	};
}

function doDistributedEditingAutomergeChangeRangesOverlap( left, right ) {
	if ( ! left?.changed || ! right?.changed ) {
		return false;
	}

	const leftStart = left.start;
	const leftEnd = left.end;
	const rightStart = right.start;
	const rightEnd = right.end;

	if ( leftStart === leftEnd && rightStart === rightEnd ) {
		return leftStart === rightStart;
	}

	if ( leftStart === leftEnd ) {
		return leftStart >= rightStart && leftStart <= rightEnd;
	}

	if ( rightStart === rightEnd ) {
		return rightStart >= leftStart && rightStart <= leftEnd;
	}

	return leftStart < rightEnd && rightStart < leftEnd;
}

/**
 * Returns an Automerge-compatible text merge candidate for a stale local Save.
 *
 * WordPress is still the persistence authority. This mirrors the server's
 * native-automerge-php-v1 range guard so the editor can fetch the latest body, merge
 * non-overlapping local edits into it, and resubmit against the current sync
 * version instead of surfacing a false conflict for same-block edits.
 *
 * @param {Object} args                   Merge inputs.
 * @param {string} args.clientBaseContent Stripped content at the editor base version.
 * @param {string} args.serverContent     Stripped content fetched from WordPress.
 * @param {string} args.localContent      Stripped local editor content.
 *
 * @return {Object} Merge candidate result.
 */
export function getDistributedEditingAutomergeLocalMergeCandidate( {
	clientBaseContent,
	serverContent,
	localContent,
} = {} ) {
	const base = normalizeNullableContentString(
		getDistributedEditingComparablePostContent( clientBaseContent )
	);
	const server = normalizeNullableContentString(
		getDistributedEditingComparablePostContent( serverContent )
	);
	const local = normalizeNullableContentString(
		getDistributedEditingComparablePostContent( localContent )
	);

	if (
		typeof base !== 'string' ||
		typeof server !== 'string' ||
		typeof local !== 'string'
	) {
		return {
			status: 'blocked',
			reason: 'missing_automerge_content_pair',
			hasCandidatePostContent: false,
			candidatePostContent: null,
			mergeStrategy: 'native_automerge_php_v1',
		};
	}

	const serverChange = getDistributedEditingAutomergeContentChangeDescriptor(
		base,
		server
	);
	const localChange = getDistributedEditingAutomergeContentChangeDescriptor(
		base,
		local
	);

	if ( ! localChange.changeRange.changed ) {
		return {
			status: 'no_pending_changes',
			reason: null,
			hasCandidatePostContent: true,
			candidatePostContent: server,
			mergeStrategy: 'native_automerge_php_v1',
			serverChangeRange: serverChange.changeRange,
			localChangeRange: localChange.changeRange,
		};
	}

	if ( ! serverChange.changeRange.changed ) {
		return {
			status: 'merged',
			reason: null,
			hasCandidatePostContent: true,
			candidatePostContent: local,
			mergeStrategy: 'native_automerge_php_v1',
			serverChangeRange: serverChange.changeRange,
			localChangeRange: localChange.changeRange,
		};
	}

	if (
		doDistributedEditingAutomergeChangeRangesOverlap(
			serverChange.changeRange,
			localChange.changeRange
		)
	) {
		return {
			status: 'manual_conflict_required',
			reason: 'automerge_overlapping_change_ranges',
			hasCandidatePostContent: false,
			candidatePostContent: null,
			mergeStrategy: 'native_automerge_php_v1',
			serverChangeRange: serverChange.changeRange,
			localChangeRange: localChange.changeRange,
		};
	}

	const serverDelta = serverChange.insertLength - serverChange.deleteLength;
	const adjustedLocalIndex =
		serverChange.changeRange.end <= localChange.index
			? localChange.index + serverDelta
			: localChange.index;
	const candidatePostContent =
		server.slice( 0, adjustedLocalIndex ) +
		localChange.insertText +
		server.slice( adjustedLocalIndex + localChange.deleteLength );

	return {
		status: 'merged',
		reason: null,
		hasCandidatePostContent: true,
		candidatePostContent,
		mergeStrategy: 'native_automerge_php_v1',
		serverChangeRange: serverChange.changeRange,
		localChangeRange: localChange.changeRange,
	};
}

async function getDistributedEditingAutomergeInteropEvidence() {
	try {
		const automerge =
			await importDistributedEditingAutomergeWithoutInitWarning();
		const doc = automerge.init();
		const saved = automerge.save( doc );
		const heads =
			typeof automerge.getHeads === 'function'
				? automerge.getHeads( doc )
				: [];

		return {
			jsPackage: '@automerge/automerge',
			jsPackageVersion: '3.2.6',
			jsDocumentBytes:
				typeof saved?.byteLength === 'number'
					? saved.byteLength
					: saved?.length ?? 0,
			jsHeads: heads,
			serverEncoding: DISTRIBUTED_EDITING_AUTOMERGE_BLOCKS_UPDATE_FORMAT,
			serverBinaryInteropStatus: 'pending',
		};
	} catch {
		return {
			jsPackage: '@automerge/automerge',
			jsPackageVersion: '3.2.6',
			jsDocumentBytes: null,
			jsHeads: [],
			serverEncoding: DISTRIBUTED_EDITING_AUTOMERGE_BLOCKS_UPDATE_FORMAT,
			serverBinaryInteropStatus: 'unavailable',
		};
	}
}

async function importDistributedEditingAutomergeWithoutInitWarning() {
	const consoleObject =
		typeof globalThis !== 'undefined' ? globalThis.console : null;

	if ( ! consoleObject || typeof consoleObject.warn !== 'function' ) {
		return importDistributedEditingAutomergeSlim();
	}

	const originalWarn = consoleObject.warn;
	consoleObject.warn = ( ...args ) => {
		const message = args.length > 0 ? String( args[ 0 ] ) : '';

		// Automerge 3.2.6's browser bundle initializes its embedded WASM with
		// a deprecated upstream call. The warning is not caused by DE-RTC
		// inputs, so keep Gutenberg's no-console-warning policy focused on our
		// code while still allowing unrelated warnings through.
		if (
			message ===
			'using deprecated parameters for `initSync()`; pass a single object instead'
		) {
			return;
		}

		originalWarn.apply( consoleObject, args );
	};

	try {
		return await importDistributedEditingAutomergeSlim();
	} finally {
		consoleObject.warn = originalWarn;
	}
}

let distributedEditingAutomergeSlim;

async function importDistributedEditingAutomergeSlim() {
	if ( distributedEditingAutomergeSlim ) {
		return distributedEditingAutomergeSlim;
	}

	const automerge = await import( '@automerge/automerge/slim' );
	const { automergeWasmBase64 } = await import(
		'@automerge/automerge/automerge.wasm.base64'
	);

	await automerge.initializeBase64Wasm( automergeWasmBase64 );
	distributedEditingAutomergeSlim = automerge;
	return automerge;
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

	const edgeInsertionCandidate =
		getSerializedBlockEdgeInsertionRebaseCandidate( {
			baseBlocks,
			serverBlocks,
			localBlocks,
		} );

	if ( edgeInsertionCandidate ) {
		return edgeInsertionCandidate;
	}

	const deletionCandidate = getSerializedBlockDeletionRebaseCandidate( {
		baseBlocks,
		serverBlocks,
		localBlocks,
	} );

	if ( deletionCandidate ) {
		return deletionCandidate;
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
			const richTextMerge =
				getRichTextSerializedBlockLocalRebaseCandidate( {
					baseBlock,
					serverBlock,
					localBlock,
				} );

			if ( richTextMerge.status === 'rebased' ) {
				mergedBlocks.push( richTextMerge.candidateBlock );
				continue;
			}

			const reason =
				richTextMerge.reason === 'rich_text_format_ranges_overlap'
					? richTextMerge.reason
					: 'same_block_changed';

			return {
				status: 'manual_conflict_required',
				reason,
			};
		}

		if ( localChanged ) {
			mergedBlocks.push( localBlock );
		} else {
			mergedBlocks.push( serverBlock );
		}
	}

	const mergedBlockSeparator = getSerializedBlockMergeSeparator(
		baseBlocks,
		serverBlocks,
		localBlocks
	);

	return {
		status: 'rebased',
		candidatePostContent: mergedBlocks.join( mergedBlockSeparator ),
		mergedBlockCount: mergedBlocks.length,
	};
}

function getRichTextSerializedBlockLocalRebaseCandidate( {
	baseBlock,
	serverBlock,
	localBlock,
} ) {
	const base = getParagraphRichTextBlockParts( baseBlock );
	const server = getParagraphRichTextBlockParts( serverBlock );
	const local = getParagraphRichTextBlockParts( localBlock );

	if ( ! base || ! server || ! local ) {
		return {
			status: 'manual_conflict_required',
			reason: 'same_block_changed',
		};
	}

	if (
		base.open !== server.open ||
		base.open !== local.open ||
		base.close !== server.close ||
		base.close !== local.close
	) {
		return {
			status: 'manual_conflict_required',
			reason: 'rich_text_block_shell_changed',
		};
	}

	const baseRichText = getRichTextFormatModel( base.html );
	const serverRichText = getRichTextFormatModel( server.html );
	const localRichText = getRichTextFormatModel( local.html );

	if ( ! baseRichText || ! serverRichText || ! localRichText ) {
		return {
			status: 'manual_conflict_required',
			reason: 'rich_text_plain_text_changed',
		};
	}

	const serverSplice = getRichTextTextSplice(
		baseRichText.text,
		serverRichText.text
	);
	const localSplice = getRichTextTextSplice(
		baseRichText.text,
		localRichText.text
	);
	const serverTextChanged = serverSplice.changed;
	const localTextChanged = localSplice.changed;

	if ( ! serverTextChanged && ! localTextChanged ) {
		const serverChanged = getRichTextChangedIndexes(
			baseRichText,
			serverRichText
		);
		const localChanged = getRichTextChangedIndexes(
			baseRichText,
			localRichText
		);

		if ( doRichTextChangedIndexesOverlap( serverChanged, localChanged ) ) {
			return {
				status: 'manual_conflict_required',
				reason: 'rich_text_format_ranges_overlap',
			};
		}

		const merged = mergeRichTextFormatModels( {
			base: baseRichText,
			server: serverRichText,
			serverChanged,
			local: localRichText,
			localChanged,
		} );

		return {
			status: 'rebased',
			candidateBlock: `${ base.open }${ formatRichTextModelHtml(
				merged
			) }${ base.close }`,
		};
	}

	if ( serverTextChanged && localTextChanged ) {
		const merged = mergeRichTextTextSpliceModels( {
			base: baseRichText,
			server: serverRichText,
			serverSplice,
			local: localRichText,
			localSplice,
		} );

		if ( ! merged ) {
			return {
				status: 'manual_conflict_required',
				reason: 'rich_text_plain_text_changed',
			};
		}

		return {
			status: 'rebased',
			candidateBlock: `${ base.open }${ formatRichTextModelHtml(
				merged
			) }${ base.close }`,
		};
	}

	let merged = null;

	if ( serverTextChanged ) {
		const localChanged = getRichTextChangedIndexes(
			baseRichText,
			localRichText
		);
		const serverChanged = getRetainedRichTextMarkChangedIndexes(
			baseRichText,
			serverRichText,
			serverSplice
		);

		if ( doRichTextChangedIndexesOverlap( serverChanged, localChanged ) ) {
			return {
				status: 'manual_conflict_required',
				reason: 'rich_text_format_ranges_overlap',
			};
		}

		merged = mergeRichTextTextAndFormatModels( {
			textChangedModel: serverRichText,
			formatChangedModel: localRichText,
			textSplice: serverSplice,
			formatChangedIndexes: localChanged,
		} );
	} else {
		const serverChanged = getRichTextChangedIndexes(
			baseRichText,
			serverRichText
		);
		const localChanged = getRetainedRichTextMarkChangedIndexes(
			baseRichText,
			localRichText,
			localSplice
		);

		if ( doRichTextChangedIndexesOverlap( localChanged, serverChanged ) ) {
			return {
				status: 'manual_conflict_required',
				reason: 'rich_text_format_ranges_overlap',
			};
		}

		merged = mergeRichTextTextAndFormatModels( {
			textChangedModel: localRichText,
			formatChangedModel: serverRichText,
			textSplice: localSplice,
			formatChangedIndexes: serverChanged,
		} );
	}

	if ( ! merged ) {
		return {
			status: 'manual_conflict_required',
			reason: 'rich_text_plain_text_changed',
		};
	}

	return {
		status: 'rebased',
		candidateBlock: `${ base.open }${ formatRichTextModelHtml( merged ) }${
			base.close
		}`,
	};
}

function getParagraphRichTextBlockParts( block ) {
	if ( typeof block !== 'string' ) {
		return null;
	}

	const match = block.match(
		/^(<!--\s+wp:paragraph\b[\s\S]*?-->\s*<p\b[^>]*>)([\s\S]*?)(<\/p>\s*<!--\s+\/wp:paragraph\s+-->)$/i
	);

	if ( ! match ) {
		return null;
	}

	return {
		open: match[ 1 ],
		html: match[ 2 ],
		close: match[ 3 ],
	};
}

function getRichTextFormatModel( html ) {
	if ( ! globalThis?.document?.createElement ) {
		return null;
	}

	const root = globalThis.document.createElement( 'div' );
	root.innerHTML = html;

	const text = [];
	const marks = [];
	const unsupported = { found: false };

	walkRichTextFormatNode( root, [], text, marks, unsupported );

	if ( unsupported.found ) {
		return null;
	}

	return {
		text: text.join( '' ),
		marks,
	};
}

function walkRichTextFormatNode( node, activeMarks, text, marks, unsupported ) {
	for ( const child of Array.from( node.childNodes || [] ) ) {
		if ( child.nodeType === child.TEXT_NODE ) {
			const value = child.nodeValue || '';
			const start = text.join( '' ).length;
			text.push( value );
			const end = start + value.length;

			for ( const mark of activeMarks ) {
				if ( end > start ) {
					marks.push( {
						type: mark,
						start,
						end,
					} );
				}
			}
			continue;
		}

		if ( child.nodeType !== child.ELEMENT_NODE ) {
			continue;
		}

		const tag = child.tagName.toLowerCase();
		const mark = getRichTextFormatMarkForTag( tag );

		if ( ! mark ) {
			unsupported.found = true;
			return;
		}

		walkRichTextFormatNode(
			child,
			[ ...activeMarks, mark ],
			text,
			marks,
			unsupported
		);

		if ( unsupported.found ) {
			return;
		}
	}
}

function getRichTextFormatMarkForTag( tag ) {
	if ( tag === 'strong' || tag === 'b' ) {
		return 'strong';
	}

	if ( tag === 'em' || tag === 'i' ) {
		return 'em';
	}

	return null;
}

function getRichTextChangedIndexes( base, next ) {
	const changed = new Set();
	const length = Math.max( base.text.length, next.text.length );

	for ( let index = 0; index < length; index++ ) {
		for ( const mark of [ 'strong', 'em' ] ) {
			if (
				hasRichTextMarkAt( base, mark, index ) !==
				hasRichTextMarkAt( next, mark, index )
			) {
				changed.add( index );
			}
		}
	}

	return changed;
}

function doRichTextChangedIndexesOverlap( left, right ) {
	for ( const index of left ) {
		if ( right.has( index ) ) {
			return true;
		}
	}

	return false;
}

function getRichTextTextSplice( baseText, nextText ) {
	if ( baseText === nextText ) {
		return {
			changed: false,
			start: 0,
			deleteCount: 0,
			insertText: '',
			insertCount: 0,
			end: 0,
			delta: 0,
		};
	}

	let prefix = 0;
	while (
		prefix < baseText.length &&
		prefix < nextText.length &&
		baseText[ prefix ] === nextText[ prefix ]
	) {
		prefix += 1;
	}

	let suffix = 0;
	while (
		suffix < baseText.length - prefix &&
		suffix < nextText.length - prefix &&
		baseText[ baseText.length - 1 - suffix ] ===
			nextText[ nextText.length - 1 - suffix ]
	) {
		suffix += 1;
	}

	const deleteCount = baseText.length - prefix - suffix;
	const insertText = nextText.slice( prefix, nextText.length - suffix );

	return {
		changed: true,
		start: prefix,
		deleteCount,
		insertText,
		insertCount: insertText.length,
		end: prefix + deleteCount,
		delta: insertText.length - deleteCount,
	};
}

function transformRichTextBaseIndex( index, splice ) {
	if ( ! splice.changed ) {
		return index;
	}

	if ( index < splice.start ) {
		return index;
	}

	if ( index >= splice.end ) {
		return index + splice.delta;
	}

	return null;
}

function getRetainedRichTextMarkChangedIndexes( base, next, splice ) {
	const changed = new Set();

	for ( let index = 0; index < base.text.length; index++ ) {
		const targetIndex = transformRichTextBaseIndex( index, splice );

		if (
			targetIndex === null ||
			targetIndex < 0 ||
			targetIndex >= next.text.length
		) {
			continue;
		}

		for ( const mark of [ 'strong', 'em' ] ) {
			if (
				hasRichTextMarkAt( base, mark, index ) !==
				hasRichTextMarkAt( next, mark, targetIndex )
			) {
				changed.add( index );
			}
		}
	}

	return changed;
}

function mergeRichTextTextAndFormatModels( {
	textChangedModel,
	formatChangedModel,
	textSplice,
	formatChangedIndexes,
} ) {
	const marksByIndex = new Map();

	for ( let index = 0; index < textChangedModel.text.length; index++ ) {
		for ( const mark of [ 'strong', 'em' ] ) {
			if ( hasRichTextMarkAt( textChangedModel, mark, index ) ) {
				if ( ! marksByIndex.has( index ) ) {
					marksByIndex.set( index, new Set() );
				}
				marksByIndex.get( index ).add( mark );
			}
		}
	}

	for ( const baseIndex of formatChangedIndexes ) {
		const targetIndex = transformRichTextBaseIndex( baseIndex, textSplice );

		if (
			targetIndex === null ||
			targetIndex < 0 ||
			targetIndex >= textChangedModel.text.length
		) {
			return null;
		}

		if ( ! marksByIndex.has( targetIndex ) ) {
			marksByIndex.set( targetIndex, new Set() );
		}

		for ( const mark of [ 'strong', 'em' ] ) {
			if ( hasRichTextMarkAt( formatChangedModel, mark, baseIndex ) ) {
				marksByIndex.get( targetIndex ).add( mark );
			} else {
				marksByIndex.get( targetIndex ).delete( mark );
			}
		}
	}

	const marks = [];

	for ( let index = 0; index < textChangedModel.text.length; index++ ) {
		const activeMarks = marksByIndex.get( index );

		if ( ! activeMarks ) {
			continue;
		}

		for ( const mark of [ 'strong', 'em' ] ) {
			if ( activeMarks.has( mark ) ) {
				marks.push( {
					type: mark,
					start: index,
					end: index + 1,
				} );
			}
		}
	}

	return {
		text: textChangedModel.text,
		marks: coalesceRichTextMarks( marks ),
	};
}

function mergeRichTextTextSpliceModels( {
	base,
	server,
	serverSplice,
	local,
	localSplice,
} ) {
	if ( doRichTextTextSplicesConflict( serverSplice, localSplice ) ) {
		return null;
	}

	const serverMarkChanged = getRetainedRichTextMarkChangedIndexes(
		base,
		server,
		serverSplice
	);
	const localMarkChanged = getRetainedRichTextMarkChangedIndexes(
		base,
		local,
		localSplice
	);

	if (
		doRichTextChangedIndexesOverlap(
			serverMarkChanged,
			localMarkChanged
		) ||
		doRichTextChangedIndexesTouchSplice( serverMarkChanged, localSplice ) ||
		doRichTextChangedIndexesTouchSplice( localMarkChanged, serverSplice )
	) {
		return null;
	}

	const sources = [];
	const splices = [
		{
			kind: 'server',
			model: server,
			splice: serverSplice,
		},
		{
			kind: 'local',
			model: local,
			splice: localSplice,
		},
	].sort(
		( left, right ) =>
			left.splice.start - right.splice.start ||
			left.splice.end - right.splice.end
	);
	let cursor = 0;

	for ( const entry of splices ) {
		const { splice } = entry;

		for ( ; cursor < splice.start; cursor++ ) {
			sources.push( {
				kind: 'base',
				baseIndex: cursor,
			} );
		}

		for ( let offset = 0; offset < splice.insertCount; offset++ ) {
			sources.push( {
				kind: entry.kind,
				model: entry.model,
				modelIndex: splice.start + offset,
			} );
		}

		cursor = splice.end;
	}

	for ( ; cursor < base.text.length; cursor++ ) {
		sources.push( {
			kind: 'base',
			baseIndex: cursor,
		} );
	}

	const text = [];
	const marks = [];

	for ( const [ targetIndex, source ] of sources.entries() ) {
		if ( source.kind === 'base' ) {
			const { baseIndex } = source;
			text.push( base.text[ baseIndex ] );

			for ( const mark of [ 'strong', 'em' ] ) {
				let marked = null;

				if ( localMarkChanged.has( baseIndex ) ) {
					marked = hasRichTextMarkAtTransformedIndex(
						local,
						mark,
						baseIndex,
						localSplice
					);
				} else if ( serverMarkChanged.has( baseIndex ) ) {
					marked = hasRichTextMarkAtTransformedIndex(
						server,
						mark,
						baseIndex,
						serverSplice
					);
				} else {
					marked = hasRichTextMarkAt( base, mark, baseIndex );
				}

				if ( marked === null ) {
					return null;
				}

				if ( marked ) {
					marks.push( {
						type: mark,
						start: targetIndex,
						end: targetIndex + 1,
					} );
				}
			}

			continue;
		}

		if ( source.modelIndex >= source.model.text.length ) {
			return null;
		}

		text.push( source.model.text[ source.modelIndex ] );

		for ( const mark of [ 'strong', 'em' ] ) {
			if ( hasRichTextMarkAt( source.model, mark, source.modelIndex ) ) {
				marks.push( {
					type: mark,
					start: targetIndex,
					end: targetIndex + 1,
				} );
			}
		}
	}

	if ( text.length !== sources.length ) {
		return null;
	}

	return {
		text: text.join( '' ),
		marks: coalesceRichTextMarks( marks ),
	};
}

function doRichTextTextSplicesConflict( left, right ) {
	if ( left.start < right.end && right.start < left.end ) {
		return true;
	}

	return (
		left.deleteCount === 0 &&
		right.deleteCount === 0 &&
		left.start === right.start &&
		left.insertText !== '' &&
		right.insertText !== ''
	);
}

function doRichTextChangedIndexesTouchSplice( indexes, splice ) {
	for ( const index of indexes ) {
		if ( splice.start <= index && index < splice.end ) {
			return true;
		}
	}

	return false;
}

function mergeRichTextFormatModels( {
	base,
	server,
	serverChanged,
	local,
	localChanged,
} ) {
	const marks = [];

	for ( let index = 0; index < base.text.length; index++ ) {
		for ( const mark of [ 'strong', 'em' ] ) {
			let marked = hasRichTextMarkAt( base, mark, index );

			if ( serverChanged.has( index ) ) {
				marked = hasRichTextMarkAt( server, mark, index );
			}

			if ( localChanged.has( index ) ) {
				marked = hasRichTextMarkAt( local, mark, index );
			}

			if ( marked ) {
				marks.push( {
					type: mark,
					start: index,
					end: index + 1,
				} );
			}
		}
	}

	return {
		text: base.text,
		marks: coalesceRichTextMarks( marks ),
	};
}

function hasRichTextMarkAt( model, mark, index ) {
	return model.marks.some(
		( range ) =>
			range.type === mark && range.start <= index && index < range.end
	);
}

function hasRichTextMarkAtTransformedIndex( model, mark, baseIndex, splice ) {
	const targetIndex = transformRichTextBaseIndex( baseIndex, splice );

	if ( targetIndex === null ) {
		return null;
	}

	return hasRichTextMarkAt( model, mark, targetIndex );
}

function coalesceRichTextMarks( marks ) {
	const sorted = [ ...marks ].sort(
		( a, b ) =>
			a.type.localeCompare( b.type ) || a.start - b.start || a.end - b.end
	);
	const coalesced = [];

	for ( const mark of sorted ) {
		const previous = coalesced[ coalesced.length - 1 ];

		if (
			previous &&
			previous.type === mark.type &&
			previous.end === mark.start
		) {
			previous.end = mark.end;
		} else {
			coalesced.push( { ...mark } );
		}
	}

	return coalesced;
}

function formatRichTextModelHtml( model ) {
	const events = new Map();

	for ( const mark of model.marks ) {
		if ( ! events.has( mark.start ) ) {
			events.set( mark.start, { open: [], close: [] } );
		}
		if ( ! events.has( mark.end ) ) {
			events.set( mark.end, { open: [], close: [] } );
		}
		events.get( mark.start ).open.push( mark.type );
		events.get( mark.end ).close.push( mark.type );
	}

	let html = '';

	for ( let index = 0; index <= model.text.length; index++ ) {
		const event = events.get( index );

		if ( event ) {
			for ( const mark of event.close.sort().reverse() ) {
				html += `</${ mark }>`;
			}
			for ( const mark of event.open.sort() ) {
				html += `<${ mark }>`;
			}
		}

		if ( index < model.text.length ) {
			html += escapeRichTextHtml( model.text[ index ] );
		}
	}

	return html;
}

function escapeRichTextHtml( text ) {
	return String( text )
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

function getSerializedBlockDeletionRebaseCandidate( {
	baseBlocks,
	serverBlocks,
	localBlocks,
} ) {
	const serverDeleted =
		serverBlocks.blocks.length < baseBlocks.blocks.length &&
		localBlocks.blocks.length === baseBlocks.blocks.length;
	const localDeleted =
		localBlocks.blocks.length < baseBlocks.blocks.length &&
		serverBlocks.blocks.length === baseBlocks.blocks.length;

	if ( ! serverDeleted && ! localDeleted ) {
		return null;
	}

	const deletingBlocks = serverDeleted ? serverBlocks : localBlocks;
	const stableBlocks = serverDeleted ? localBlocks : serverBlocks;
	const deletion = getSerializedBlockDeletion(
		baseBlocks.blocks,
		deletingBlocks.blocks
	);

	if ( ! deletion ) {
		return null;
	}

	if ( deletion.status === 'ambiguous' ) {
		return {
			status: 'manual_conflict_required',
			reason: 'block_deleted',
		};
	}

	if (
		isPureSerializedBlockReorder( baseBlocks.blocks, stableBlocks.blocks )
	) {
		return {
			status: 'manual_conflict_required',
			reason: 'block_reordered',
		};
	}

	const mergedBlocks = [];
	const deletedIndexes = new Set( deletion.deletedIndexes );

	for ( let index = 0; index < baseBlocks.blocks.length; index++ ) {
		const baseBlock = baseBlocks.blocks[ index ];
		const stableBlock = stableBlocks.blocks[ index ];
		const stableChanged = stableBlock !== baseBlock;

		if ( deletedIndexes.has( index ) ) {
			if ( stableChanged ) {
				return {
					status: 'manual_conflict_required',
					reason: 'block_deleted',
				};
			}

			continue;
		}

		mergedBlocks.push( stableChanged ? stableBlock : baseBlock );
	}

	const mergedBlockSeparator = getSerializedBlockMergeSeparator(
		baseBlocks,
		serverBlocks,
		localBlocks
	);

	return {
		status: 'rebased',
		candidatePostContent: mergedBlocks.join( mergedBlockSeparator ),
		mergedBlockCount: mergedBlocks.length,
	};
}

function getSerializedBlockEdgeInsertionRebaseCandidate( {
	baseBlocks,
	serverBlocks,
	localBlocks,
} ) {
	const serverInserted =
		serverBlocks.blocks.length > baseBlocks.blocks.length &&
		localBlocks.blocks.length === baseBlocks.blocks.length;
	const localInserted =
		localBlocks.blocks.length > baseBlocks.blocks.length &&
		serverBlocks.blocks.length === baseBlocks.blocks.length;

	if ( ! serverInserted && ! localInserted ) {
		return null;
	}

	const insertingBlocks = serverInserted ? serverBlocks : localBlocks;
	const stableBlocks = serverInserted ? localBlocks : serverBlocks;
	const insertion = getSerializedBlockEdgeInsertion(
		baseBlocks.blocks,
		insertingBlocks.blocks
	);

	if ( ! insertion ) {
		return null;
	}

	if ( insertion.position === 'ambiguous' ) {
		return {
			status: 'manual_conflict_required',
			reason: 'block_inserted',
		};
	}

	if (
		isPureSerializedBlockReorder( baseBlocks.blocks, stableBlocks.blocks )
	) {
		return {
			status: 'manual_conflict_required',
			reason: 'block_reordered',
		};
	}

	const mergedBlocks = [];

	if ( insertion.position === 'prepend' ) {
		mergedBlocks.push( ...insertion.blocks );
	}

	for ( let index = 0; index < baseBlocks.blocks.length; index++ ) {
		const baseBlock = baseBlocks.blocks[ index ];
		const stableBlock = stableBlocks.blocks[ index ];

		mergedBlocks.push(
			stableBlock !== baseBlock ? stableBlock : baseBlock
		);
	}

	if ( insertion.position === 'append' ) {
		mergedBlocks.push( ...insertion.blocks );
	}

	const mergedBlockSeparator = getSerializedBlockMergeSeparator(
		baseBlocks,
		serverBlocks,
		localBlocks
	);

	return {
		status: 'rebased',
		candidatePostContent: mergedBlocks.join( mergedBlockSeparator ),
		mergedBlockCount: mergedBlocks.length,
	};
}

function getSerializedBlockEdgeInsertion( baseBlocks, candidateBlocks ) {
	if ( candidateBlocks.length <= baseBlocks.length ) {
		return null;
	}

	const insertedCount = candidateBlocks.length - baseBlocks.length;
	const matchesPrefix = baseBlocks.every(
		( block, index ) => block === candidateBlocks[ index ]
	);
	const matchesSuffix = baseBlocks.every(
		( block, index ) => block === candidateBlocks[ index + insertedCount ]
	);

	if ( matchesPrefix && matchesSuffix ) {
		return {
			position: 'ambiguous',
			blocks: [],
		};
	}

	if ( matchesPrefix ) {
		return {
			position: 'append',
			blocks: candidateBlocks.slice( baseBlocks.length ),
		};
	}

	if ( matchesSuffix ) {
		return {
			position: 'prepend',
			blocks: candidateBlocks.slice( 0, insertedCount ),
		};
	}

	return null;
}

function getSerializedBlockDeletion( baseBlocks, candidateBlocks ) {
	if ( candidateBlocks.length >= baseBlocks.length ) {
		return null;
	}

	const leftmostIndexes = [];
	let candidateIndex = 0;

	for (
		let baseIndex = 0;
		baseIndex < baseBlocks.length &&
		candidateIndex < candidateBlocks.length;
		baseIndex++
	) {
		if ( baseBlocks[ baseIndex ] === candidateBlocks[ candidateIndex ] ) {
			leftmostIndexes.push( baseIndex );
			candidateIndex++;
		}
	}

	if ( candidateIndex !== candidateBlocks.length ) {
		return null;
	}

	const rightmostIndexes = new Array( candidateBlocks.length );
	candidateIndex = candidateBlocks.length - 1;

	for (
		let baseIndex = baseBlocks.length - 1;
		baseIndex >= 0 && candidateIndex >= 0;
		baseIndex--
	) {
		if ( baseBlocks[ baseIndex ] === candidateBlocks[ candidateIndex ] ) {
			rightmostIndexes[ candidateIndex ] = baseIndex;
			candidateIndex--;
		}
	}

	if (
		candidateIndex !== -1 ||
		leftmostIndexes.some(
			( baseIndex, index ) => baseIndex !== rightmostIndexes[ index ]
		)
	) {
		return {
			status: 'ambiguous',
			deletedIndexes: [],
		};
	}

	const matchedIndexes = new Set( leftmostIndexes );
	const deletedIndexes = [];

	for ( let baseIndex = 0; baseIndex < baseBlocks.length; baseIndex++ ) {
		if ( ! matchedIndexes.has( baseIndex ) ) {
			deletedIndexes.push( baseIndex );
		}
	}

	return {
		status: 'deleted',
		deletedIndexes,
	};
}

function getSerializedBlockMergeSeparator(
	baseBlocks,
	serverBlocks,
	localBlocks
) {
	return (
		localBlocks.interBlockSeparator ||
		serverBlocks.interBlockSeparator ||
		baseBlocks.interBlockSeparator ||
		''
	);
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

function createDistributedEditingBlockIdentityRequestProofBlockedDescriptor(
	reason,
	overrides = {}
) {
	return {
		status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.BLOCKED,
		reason,
		requestProof: null,
		clientBaseVersion: overrides.clientBaseVersion ?? null,
		proposedPostContentHash: overrides.proposedPostContentHash ?? null,
		invalidDetail: overrides.invalidDetail ?? null,
		unsafeSerializedBlockReason:
			overrides.unsafeSerializedBlockReason ?? null,
		acceptedBlockCount: overrides.acceptedBlockCount ?? 0,
		proposedBlockCount: overrides.proposedBlockCount ?? 0,
		retainedBlockCount: overrides.retainedBlockCount ?? 0,
		insertedBlockCount: 0,
		deletedBlockCount: 0,
		movedBlockCount: 0,
		contentFree: true,
		usesGutenbergClientId: false,
		exposesRawContent: false,
		callsRest: false,
		callsSave: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function createDistributedEditingBlockIdentityDistinctGapInsertionBlockedDescriptor(
	reason,
	overrides = {}
) {
	return {
		status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.BLOCKED,
		reason,
		requestProof: null,
		invalidDetail: overrides.invalidDetail ?? null,
		unsafeSerializedBlockReason:
			overrides.unsafeSerializedBlockReason ?? null,
		acceptedBlockCount: overrides.acceptedBlockCount ?? 0,
		serverBlockCount: overrides.serverBlockCount ?? 0,
		proposedBlockCount: overrides.proposedBlockCount ?? 0,
		serverInsertedBlockCount: overrides.serverInsertedBlockCount ?? 0,
		proposedInsertedBlockCount: overrides.proposedInsertedBlockCount ?? 0,
		serverInsertedGapIndexes: [],
		proposedInsertedGapIndexes: [],
		conflictingGapIndex: overrides.conflictingGapIndex ?? null,
		contentFree: true,
		usesGutenbergClientId: false,
		exposesRawContent: false,
		callsRest: false,
		callsSave: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
	reason,
	overrides = {}
) {
	return {
		status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.BLOCKED,
		reason,
		requestProof: null,
		invalidDetail: overrides.invalidDetail ?? null,
		unsafeSerializedBlockReason:
			overrides.unsafeSerializedBlockReason ?? null,
		acceptedBlockCount: overrides.acceptedBlockCount ?? 0,
		serverBlockCount: overrides.serverBlockCount ?? 0,
		proposedBlockCount: overrides.proposedBlockCount ?? 0,
		serverChangedBlockCount: overrides.serverChangedBlockCount ?? 0,
		proposedChangedBlockCount: overrides.proposedChangedBlockCount ?? 0,
		serverChangedBlockIndexes: overrides.serverChangedBlockIndexes ?? [],
		proposedChangedBlockIndexes:
			overrides.proposedChangedBlockIndexes ?? [],
		conflictingBlockIndex: overrides.conflictingBlockIndex ?? null,
		contentFree: true,
		usesGutenbergClientId: false,
		exposesRawContent: false,
		callsRest: false,
		callsSave: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function getDistributedEditingTableCellRetainedBlockMergeDescriptor( {
	acceptedBlocks = [],
	acceptedPostContent = '',
	serverBlocks = [],
	proposedBlocks = [],
	serverChangedBlockIndexes = [],
	proposedChangedBlockIndexes = [],
} = {} ) {
	const acceptedTokens = getSerializedBlockTokens( acceptedPostContent );

	if (
		acceptedTokens.status !== 'safe' ||
		acceptedTokens.blocks.length !== acceptedBlocks.length
	) {
		return createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
			'table_cell_merge_missing_accepted_base',
			{
				acceptedBlockCount: acceptedBlocks.length,
				serverChangedBlockIndexes,
				proposedChangedBlockIndexes,
			}
		);
	}

	const serverChangedBlockIndexSet = new Set( serverChangedBlockIndexes );
	const conflictingBlockIndexes = proposedChangedBlockIndexes.filter(
		( blockIndex ) => serverChangedBlockIndexSet.has( blockIndex )
	);

	if ( conflictingBlockIndexes.length === 0 ) {
		return createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
			'table_cell_merge_no_same_block_edits',
			{
				acceptedBlockCount: acceptedBlocks.length,
				serverChangedBlockIndexes,
				proposedChangedBlockIndexes,
			}
		);
	}

	const tableCellMergedIndexes = [];
	const tableCellServerChangedCells = [];
	const tableCellLocalChangedCells = [];

	for ( const blockIndex of conflictingBlockIndexes ) {
		const acceptedBlock = acceptedBlocks[ blockIndex ];

		if ( acceptedBlock?.block_name !== 'core/table' ) {
			return createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
				'table_cell_merge_unsupported_block',
				{
					acceptedBlockCount: acceptedBlocks.length,
					serverChangedBlockIndexes,
					proposedChangedBlockIndexes,
					conflictingBlockIndex: blockIndex,
				}
			);
		}

		const tableCellMerge =
			getDistributedEditingTableCellSerializedBlockMergeDescriptor( {
				baseBlock: acceptedTokens.blocks[ blockIndex ],
				serverBlock: serverBlocks[ blockIndex ],
				proposedBlock: proposedBlocks[ blockIndex ],
			} );

		if ( tableCellMerge.status !== 'ready' ) {
			return createDistributedEditingBlockIdentityRetainedEditsServerMergeBlockedDescriptor(
				tableCellMerge.reason,
				{
					acceptedBlockCount: acceptedBlocks.length,
					serverChangedBlockIndexes,
					proposedChangedBlockIndexes,
					conflictingBlockIndex: blockIndex,
				}
			);
		}

		tableCellMergedIndexes.push( blockIndex );
		tableCellServerChangedCells.push(
			...tableCellMerge.serverChangedCells.map( ( cell ) => ( {
				blockIndex,
				...cell,
			} ) )
		);
		tableCellLocalChangedCells.push(
			...tableCellMerge.localChangedCells.map( ( cell ) => ( {
				blockIndex,
				...cell,
			} ) )
		);
	}

	return {
		status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY,
		reason: null,
		requestProof: null,
		tableCellMergedIndexes,
		tableCellMergedBlockCount: tableCellMergedIndexes.length,
		tableCellServerChangedCells,
		tableCellLocalChangedCells,
		contentFree: true,
		usesGutenbergClientId: false,
		exposesRawContent: false,
		callsRest: false,
		callsSave: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		createsRevision: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function getDistributedEditingTableCellSerializedBlockMergeDescriptor( {
	baseBlock,
	serverBlock,
	proposedBlock,
} = {} ) {
	const base =
		getDistributedEditingTableCellSerializedBlockModel( baseBlock );
	const server =
		getDistributedEditingTableCellSerializedBlockModel( serverBlock );
	const proposed =
		getDistributedEditingTableCellSerializedBlockModel( proposedBlock );

	if ( ! base || ! server || ! proposed ) {
		return {
			status: 'blocked',
			reason: 'table_cell_merge_unsupported_serialized_block',
		};
	}

	if (
		base.shell !== server.shell ||
		base.shell !== proposed.shell ||
		base.cells.length !== server.cells.length ||
		base.cells.length !== proposed.cells.length
	) {
		return {
			status: 'blocked',
			reason: 'table_cell_merge_structure_changed',
		};
	}

	const serverChangedCells = [];
	const localChangedCells = [];

	for ( const [ cellIndex, baseCell ] of base.cells.entries() ) {
		if ( baseCell !== server.cells[ cellIndex ] ) {
			serverChangedCells.push( cellIndex );
		}

		if ( baseCell !== proposed.cells[ cellIndex ] ) {
			localChangedCells.push( cellIndex );
		}
	}

	if ( serverChangedCells.length === 0 || localChangedCells.length === 0 ) {
		return {
			status: 'blocked',
			reason: 'table_cell_merge_missing_two_sided_cells',
		};
	}

	const serverChangedCellSet = new Set( serverChangedCells );

	for ( const cellIndex of localChangedCells ) {
		if (
			serverChangedCellSet.has( cellIndex ) &&
			server.cells[ cellIndex ] !== proposed.cells[ cellIndex ]
		) {
			return {
				status: 'blocked',
				reason: 'table_cell_merge_same_cell_conflict',
			};
		}
	}

	return {
		status: 'ready',
		reason: null,
		serverChangedCells: getDistributedEditingTableCellChangeEvidence(
			base,
			serverChangedCells
		),
		localChangedCells: getDistributedEditingTableCellChangeEvidence(
			base,
			localChangedCells
		),
	};
}

function getDistributedEditingTableCellSerializedBlockModel( serializedBlock ) {
	if (
		typeof serializedBlock !== 'string' ||
		getDistributedEditingBlockIdentitySerializedBlockName(
			serializedBlock
		) !== 'core/table'
	) {
		return null;
	}

	const cellPattern = /<(t[dh])\b[^>]*>([\s\S]*?)<\/\1>/gi;
	const placeholder = '\u0000DE_RTC_TABLE_CELL\u0000';
	const cells = [];
	const cellOffsets = [];
	let shell = '';
	let lastOffset = 0;
	let match;

	while ( ( match = cellPattern.exec( serializedBlock ) ) ) {
		const fullMatch = match[ 0 ];
		const tagName = match[ 1 ].toLowerCase();
		const startTagMatch = fullMatch.match( /^<t[dh]\b[^>]*>/i );
		const closeTag = `</${ tagName }>`;

		if (
			! startTagMatch ||
			! fullMatch.toLowerCase().endsWith( closeTag )
		) {
			return null;
		}

		const contentStart = match.index + startTagMatch[ 0 ].length;
		const contentEnd = match.index + fullMatch.length - closeTag.length;

		shell +=
			serializedBlock.slice( lastOffset, contentStart ) + placeholder;
		lastOffset = contentEnd;
		cells.push( serializedBlock.slice( contentStart, contentEnd ) );
		cellOffsets.push( match.index );
	}

	if ( cells.length === 0 ) {
		return null;
	}

	shell += serializedBlock.slice( lastOffset );

	return {
		shell,
		cells,
		coordinates: getDistributedEditingTableCellCoordinates(
			serializedBlock,
			cellOffsets
		),
	};
}

function getDistributedEditingTableCellCoordinates(
	serializedBlock,
	cellOffsets
) {
	const coordinates = cellOffsets.map( ( _offset, cellIndex ) => ( {
		cellIndex,
		rowIndex: null,
		columnIndex: null,
	} ) );
	const offsetToCellIndex = new Map(
		cellOffsets.map( ( offset, cellIndex ) => [ offset, cellIndex ] )
	);
	const rowPattern = /<tr\b[^>]*>[\s\S]*?<\/tr>/gi;
	let rowMatch;
	let rowIndex = 0;

	while ( ( rowMatch = rowPattern.exec( serializedBlock ) ) ) {
		const rowHtml = rowMatch[ 0 ];
		const rowOffset = rowMatch.index;
		const rowCellPattern = /<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi;
		let rowCellMatch;
		let columnIndex = 0;

		while ( ( rowCellMatch = rowCellPattern.exec( rowHtml ) ) ) {
			const absoluteCellOffset = rowOffset + rowCellMatch.index;
			const cellIndex = offsetToCellIndex.get( absoluteCellOffset );

			if ( cellIndex !== undefined ) {
				coordinates[ cellIndex ] = {
					cellIndex,
					rowIndex,
					columnIndex,
				};
			}

			columnIndex++;
		}

		rowIndex++;
	}

	return coordinates;
}

function getDistributedEditingTableCellChangeEvidence( model, changedCells ) {
	return changedCells.map( ( cellIndex ) => {
		const coordinate = model.coordinates[ cellIndex ] ?? {
			cellIndex,
			rowIndex: null,
			columnIndex: null,
		};

		return {
			cellIndex: coordinate.cellIndex,
			rowIndex: coordinate.rowIndex,
			columnIndex: coordinate.columnIndex,
		};
	} );
}

function getDistributedEditingAcceptedBlockIdentityBlocksByHash(
	acceptedBlocks
) {
	const blocksByHash = new Map();

	for ( const block of acceptedBlocks ) {
		if ( blocksByHash.has( block.serialized_hash ) ) {
			return {
				status: 'invalid',
				reason: 'accepted_repeated_serialized_hash_ambiguous',
				blocksByHash: null,
			};
		}

		blocksByHash.set( block.serialized_hash, block );
	}

	return {
		status: 'valid',
		reason: null,
		blocksByHash,
	};
}

async function getDistributedEditingBlockIdentityRetainedEditSequence( {
	acceptedBlocks,
	postContent,
	candidateLabel,
} ) {
	const tokens = getSerializedBlockTokens( postContent );

	if ( tokens.status !== 'safe' ) {
		return {
			status: 'invalid',
			reason: 'unsafe_serialized_blocks',
			unsafeSerializedBlockReason: tokens.reason,
			blockCount: 0,
			changedBlockIndexes: [],
		};
	}

	if ( tokens.blocks.length !== acceptedBlocks.length ) {
		return {
			status: 'invalid',
			reason: 'retained_block_count_changed',
			blockCount: tokens.blocks.length,
			changedBlockIndexes: [],
		};
	}

	const tokenHashCounts = new Map();
	const changedBlockIndexes = [];

	for ( const [ index, serializedBlock ] of tokens.blocks.entries() ) {
		const serializedHash =
			await getDistributedEditingPostContentSha256Hash( serializedBlock );

		if ( ! isDistributedEditingBlockIdentitySha256Hash( serializedHash ) ) {
			return {
				status: 'invalid',
				reason: 'missing_hash_evidence',
				blockCount: tokens.blocks.length,
				changedBlockIndexes,
			};
		}

		const repeatedHashCount = tokenHashCounts.get( serializedHash ) ?? 0;

		if ( repeatedHashCount > 0 ) {
			return {
				status: 'invalid',
				reason: `${ candidateLabel }_repeated_serialized_hash_ambiguous`,
				blockCount: tokens.blocks.length,
				changedBlockIndexes,
			};
		}

		tokenHashCounts.set( serializedHash, repeatedHashCount + 1 );

		const blockName =
			getDistributedEditingBlockIdentitySerializedBlockName(
				serializedBlock
			);
		const acceptedBlock = acceptedBlocks[ index ];

		if (
			! acceptedBlock ||
			JSON.stringify( acceptedBlock.ordinal_path ) !==
				JSON.stringify( [ index ] )
		) {
			return {
				status: 'invalid',
				reason: 'retained_block_order_changed',
				blockCount: tokens.blocks.length,
				changedBlockIndexes,
			};
		}

		if ( ! blockName || acceptedBlock.block_name !== blockName ) {
			return {
				status: 'invalid',
				reason: 'retained_block_name_changed',
				blockCount: tokens.blocks.length,
				changedBlockIndexes,
			};
		}

		if ( acceptedBlock.serialized_hash !== serializedHash ) {
			changedBlockIndexes.push( index );
		}
	}

	return {
		status: 'valid',
		reason: null,
		blockCount: tokens.blocks.length,
		changedBlockIndexes,
		blocks: tokens.blocks,
	};
}

async function getDistributedEditingBlockIdentityInsertionGapSequence( {
	acceptedBlocks,
	acceptedBlocksByHash,
	postContent,
	candidateLabel,
} ) {
	const tokens = getSerializedBlockTokens( postContent );

	if ( tokens.status !== 'safe' ) {
		return {
			status: 'invalid',
			reason: 'unsafe_serialized_blocks',
			unsafeSerializedBlockReason: tokens.reason,
			blockCount: 0,
		};
	}

	const tokenHashCounts = new Map();
	const insertedGapIndexes = [];
	let nextAcceptedBlockIndex = 0;

	for ( const serializedBlock of tokens.blocks ) {
		const serializedHash =
			await getDistributedEditingPostContentSha256Hash( serializedBlock );

		if ( ! isDistributedEditingBlockIdentitySha256Hash( serializedHash ) ) {
			return {
				status: 'invalid',
				reason: 'missing_hash_evidence',
				blockCount: tokens.blocks.length,
			};
		}

		const repeatedHashCount = tokenHashCounts.get( serializedHash ) ?? 0;

		if ( repeatedHashCount > 0 ) {
			return {
				status: 'invalid',
				reason: `${ candidateLabel }_repeated_serialized_hash_ambiguous`,
				blockCount: tokens.blocks.length,
			};
		}

		tokenHashCounts.set( serializedHash, repeatedHashCount + 1 );

		if ( ! acceptedBlocksByHash.has( serializedHash ) ) {
			insertedGapIndexes.push( nextAcceptedBlockIndex );
			continue;
		}

		const expectedAcceptedBlock = acceptedBlocks[ nextAcceptedBlockIndex ];

		if (
			! expectedAcceptedBlock ||
			expectedAcceptedBlock.serialized_hash !== serializedHash
		) {
			return {
				status: 'invalid',
				reason: 'retained_block_order_changed',
				blockCount: tokens.blocks.length,
			};
		}

		nextAcceptedBlockIndex++;
	}

	if ( nextAcceptedBlockIndex !== acceptedBlocks.length ) {
		return {
			status: 'invalid',
			reason: 'accepted_block_missing',
			blockCount: tokens.blocks.length,
		};
	}

	return {
		status: 'valid',
		reason: null,
		blockCount: tokens.blocks.length,
		insertedGapIndexes,
	};
}

function normalizeDistributedEditingBlockIdentityAcceptedSyncMeta( syncMeta ) {
	if (
		! syncMeta ||
		typeof syncMeta !== 'object' ||
		Array.isArray( syncMeta )
	) {
		return {
			status: 'invalid',
			reason: 'missing_accepted_sync_meta',
			detail: 'block_identity_sync_meta_missing',
			syncMeta: null,
		};
	}

	if ( hasDistributedEditingBlockIdentityRawContentField( syncMeta ) ) {
		return {
			status: 'invalid',
			reason: 'accepted_sync_meta_invalid',
			detail: 'block_identity_raw_content_rejected',
			syncMeta: null,
		};
	}

	if ( hasDistributedEditingBlockIdentityClientIdField( syncMeta ) ) {
		return {
			status: 'invalid',
			reason: 'accepted_sync_meta_invalid',
			detail: 'block_identity_client_id_rejected',
			syncMeta: null,
		};
	}

	const requiredFields = [
		'schema',
		'document_uuid',
		'version',
		'content_hash',
		'blocks',
	];
	const missingField = requiredFields.find(
		( field ) => ! Object.prototype.hasOwnProperty.call( syncMeta, field )
	);

	if ( missingField ) {
		return {
			status: 'invalid',
			reason: 'accepted_sync_meta_invalid',
			detail: 'block_identity_sync_meta_missing_required_field',
			missingField,
			syncMeta: null,
		};
	}

	if (
		syncMeta.schema !== 'de-rtc-block-identity-v1' ||
		typeof syncMeta.document_uuid !== 'string' ||
		syncMeta.document_uuid.length === 0 ||
		! (
			typeof syncMeta.version === 'string' ||
			typeof syncMeta.version === 'number'
		) ||
		String( syncMeta.version ).length === 0 ||
		! isDistributedEditingBlockIdentitySha256Hash(
			syncMeta.content_hash
		) ||
		! Array.isArray( syncMeta.blocks )
	) {
		return {
			status: 'invalid',
			reason: 'accepted_sync_meta_invalid',
			detail: 'block_identity_sync_meta_invalid_required_field',
			syncMeta: null,
		};
	}

	const blockUids = new Set();

	for ( const [ index, block ] of syncMeta.blocks.entries() ) {
		const blockValidation =
			validateDistributedEditingBlockIdentityAcceptedBlock( block );

		if ( blockValidation.status !== 'valid' ) {
			return {
				status: 'invalid',
				reason: 'accepted_sync_meta_invalid',
				detail: blockValidation.detail,
				blockIndex: index,
				missingField: blockValidation.missingField ?? null,
				syncMeta: null,
			};
		}

		if ( blockUids.has( block.block_uid ) ) {
			return {
				status: 'invalid',
				reason: 'accepted_sync_meta_invalid',
				detail: 'block_identity_duplicate_block_uid',
				blockIndex: index,
				syncMeta: null,
			};
		}

		blockUids.add( block.block_uid );
	}

	return {
		status: 'valid',
		reason: null,
		detail: null,
		syncMeta: {
			...syncMeta,
			version: String( syncMeta.version ),
		},
	};
}

function validateDistributedEditingBlockIdentityAcceptedBlock( block ) {
	const requiredFields = [
		'block_uid',
		'parent_uid',
		'block_name',
		'ordinal_path',
		'serialized_hash',
	];

	if ( ! block || typeof block !== 'object' || Array.isArray( block ) ) {
		return {
			status: 'invalid',
			detail: 'block_identity_block_invalid',
		};
	}

	const missingField = requiredFields.find(
		( field ) => ! Object.prototype.hasOwnProperty.call( block, field )
	);

	if ( missingField ) {
		return {
			status: 'invalid',
			detail: 'block_identity_block_missing_required_field',
			missingField,
		};
	}

	if (
		typeof block.block_uid !== 'string' ||
		block.block_uid.length === 0 ||
		! (
			typeof block.parent_uid === 'string' || block.parent_uid === null
		) ||
		typeof block.block_name !== 'string' ||
		block.block_name.length === 0 ||
		! isDistributedEditingBlockIdentityOrdinalPath( block.ordinal_path ) ||
		! isDistributedEditingBlockIdentitySha256Hash( block.serialized_hash )
	) {
		return {
			status: 'invalid',
			detail: 'block_identity_block_invalid_required_field',
		};
	}

	return {
		status: 'valid',
		detail: null,
	};
}

function isDistributedEditingBlockIdentityOrdinalPath( value ) {
	return (
		Array.isArray( value ) &&
		value.length > 0 &&
		value.every(
			( item ) =>
				Number.isInteger( item ) &&
				item >= 0 &&
				Number.isSafeInteger( item )
		)
	);
}

function isDistributedEditingBlockIdentitySha256Hash( value ) {
	return typeof value === 'string' && /^[a-f0-9]{64}$/.test( value );
}

function hasDistributedEditingBlockIdentityRawContentField( value ) {
	if ( Array.isArray( value ) ) {
		return value.some( hasDistributedEditingBlockIdentityRawContentField );
	}

	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	for ( const [ key, nestedValue ] of Object.entries( value ) ) {
		if (
			/^(rawPostContent|postContent|proposedPostContent|sanitizedPostContent|content|html)$/i.test(
				key
			)
		) {
			return true;
		}

		if (
			hasDistributedEditingBlockIdentityRawContentField( nestedValue )
		) {
			return true;
		}
	}

	return false;
}

function hasDistributedEditingBlockIdentityClientIdField( value ) {
	if ( Array.isArray( value ) ) {
		return value.some( hasDistributedEditingBlockIdentityClientIdField );
	}

	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	for ( const [ key, nestedValue ] of Object.entries( value ) ) {
		if (
			[
				'clientId',
				'client_id',
				'blockClientId',
				'block_client_id',
			].includes( key )
		) {
			return true;
		}

		if ( hasDistributedEditingBlockIdentityClientIdField( nestedValue ) ) {
			return true;
		}
	}

	return false;
}

function getDistributedEditingBlockIdentitySerializedBlockName(
	serializedBlock
) {
	if ( typeof serializedBlock !== 'string' ) {
		return null;
	}

	const openingCommentEnd = serializedBlock.indexOf( '-->' );

	if ( openingCommentEnd === -1 ) {
		return null;
	}

	const openingComment = serializedBlock.slice( 0, openingCommentEnd + 3 );
	const openingCommentData =
		getSerializedBlockOpeningCommentData( openingComment );

	if ( ! openingCommentData?.blockName ) {
		return null;
	}

	return openingCommentData.blockName.includes( '/' )
		? openingCommentData.blockName
		: `core/${ openingCommentData.blockName }`;
}

function getSerializedBlockTokens( content ) {
	if ( typeof content !== 'string' ) {
		return {
			status: 'unsafe',
			reason: 'content_not_string',
		};
	}

	content =
		canonicalizeDistributedEditingCoreBlockCommentDelimiters( content );

	const unsafeBlockCommentReason = getUnsafeBlockCommentReason( content );

	if ( unsafeBlockCommentReason ) {
		return {
			status: 'unsafe',
			reason: unsafeBlockCommentReason,
		};
	}

	const blocks = [];
	const interBlockSeparators = [];
	let offset = 0;

	while ( offset < content.length ) {
		const openingCommentStart = content.indexOf( '<!-- wp:', offset );

		if ( openingCommentStart === -1 ) {
			if ( content.slice( offset ).trim() === '' ) {
				break;
			}

			return {
				status: 'unsafe',
				reason: 'freeform_html',
			};
		}

		if ( openingCommentStart !== offset ) {
			const leadingContent = content.slice( offset, openingCommentStart );

			if ( leadingContent.trim() === '' ) {
				if ( blocks.length > 0 ) {
					interBlockSeparators.push( leadingContent );
				}

				offset = openingCommentStart;
			} else {
				return {
					status: 'unsafe',
					reason: 'content_outside_serialized_blocks',
				};
			}
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
		interBlockSeparator:
			interBlockSeparators.find( ( separator ) =>
				separator.includes( '\n\n' )
			) ??
			interBlockSeparators[ 0 ] ??
			'',
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
