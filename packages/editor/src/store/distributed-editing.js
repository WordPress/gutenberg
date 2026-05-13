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
} );

/**
 * Stable action keys that future UI can map to rendered buttons or menu items.
 */
export const DISTRIBUTED_EDITING_NOTICE_ACTIONS = Object.freeze( {
	ACCEPT_SERVER_STATE: 'accept-server-state',
	EXPORT_LOCAL_UPDATES: 'export-local-updates',
	REFETCH_SERVER_STATE: 'refetch-server-state',
	REBASE_LOCAL_UPDATES: 'rebase-local-updates',
	REVIEW_REMOTE_CHANGES: 'review-remote-changes',
} );

/**
 * Stable reasons for browser unload protection.
 */
export const DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS = Object.freeze( {
	PENDING_CHANGES: 'pending-changes',
	AWAITING_SERVER_CONFIRMATION: 'awaiting-server-confirmation',
} );

const VALID_REASON_CODES = new Set(
	Object.values( DISTRIBUTED_EDITING_REASON_CODES )
);

const VALID_DISPOSITIONS = new Set(
	Object.values( DISTRIBUTED_EDITING_DISPOSITIONS )
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
} );

export const DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE = Object.freeze( {
	clientBaseVersion: null,
	serverVersion: null,
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
	canAttemptLocalRebase: false,
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
	const remoteChangeCount = normalizeCount( sessionState.remoteChangeCount );
	const isStaleBaseRejection =
		disposition ===
		DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION;
	const hasPendingChanges =
		Boolean( sessionState.hasPendingChanges ) ||
		pendingChangeCount > 0 ||
		isStaleBaseRejection;
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
	const requiresServerStateRefetch =
		Boolean( sessionState.requiresServerStateRefetch ) ||
		isStaleBaseRejection;
	const requiresManualConflictResolution = Boolean(
		sessionState.requiresManualConflictResolution
	);
	const canAttemptLocalRebase =
		Boolean( sessionState.canAttemptLocalRebase ) &&
		! requiresManualConflictResolution;
	const mustOfferLocalCopy =
		Boolean( sessionState.mustOfferLocalCopy ) ||
		( requiresServerStateAcceptance && hasPendingChanges ) ||
		( requiresServerStateRefetch && hasPendingChanges ) ||
		( requiresManualConflictResolution && hasPendingChanges );
	const canExportLocalUpdates =
		Boolean( sessionState.canExportLocalUpdates ) || mustOfferLocalCopy;

	return {
		clientBaseVersion: normalizeNullableString(
			sessionState.clientBaseVersion
		),
		serverVersion: normalizeNullableString( sessionState.serverVersion ),
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
		canAttemptLocalRebase,
		requiresManualConflictResolution,
		mustOfferLocalCopy,
		canExportLocalUpdates,
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
	const reasonCode = normalizeNullableString(
		responseOrError.code ||
			responseOrError.reasonCode ||
			responseOrError.reason_code
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
	const reasonCode =
		normalizeNullableString(
			responseOrError.code ||
				responseOrError.reasonCode ||
				responseOrError.reason_code
		) || DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED;

	return normalizeDistributedEditingSessionState( {
		clientBaseVersion:
			responseOrError.clientBaseVersion ||
			responseOrError.client_base_version,
		serverVersion:
			responseOrError.serverVersion || responseOrError.server_version,
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode,
		pendingChangeCount:
			responseOrError.pendingChangeCount ||
			responseOrError.pending_change_count ||
			1,
		remoteChangeCount:
			responseOrError.remoteChangeCount ||
			responseOrError.remote_change_count ||
			1,
		requiresServerStateRefetch: true,
		canAttemptLocalRebase:
			responseOrError.canAttemptLocalRebase ??
			responseOrError.can_attempt_local_rebase ??
			false,
		requiresManualConflictResolution:
			responseOrError.requiresManualConflictResolution ||
			responseOrError.requires_manual_conflict_resolution,
		canExportLocalUpdates: true,
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
					...( normalized.canAttemptLocalRebase
						? [
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES,
						  ]
						: [] ),
				],
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
		noticeOptions: {
			id,
			type,
			isDismissible,
		},
	};
}

function normalizeCount( value ) {
	const count = Number( value );
	return Number.isInteger( count ) && count > 0 ? count : 0;
}

function normalizeNullableString( value ) {
	return typeof value === 'string' && value.length > 0 ? value : null;
}
