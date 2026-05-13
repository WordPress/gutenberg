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
	readyToRetrySubmit: false,
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
	const readyToRetrySubmit =
		Boolean( sessionState.readyToRetrySubmit ) &&
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
		readyToRetrySubmit,
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

function normalizeNullableContentString( value ) {
	return typeof value === 'string' ? value : null;
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

	return normalizeNullableString(
		responseOrError.serverVersion ||
			responseOrError.server_version ||
			responseData.serverVersion ||
			responseData.server_version ||
			distributedEditingData.serverVersion ||
			distributedEditingData.server_version ||
			responseOrError.modified_gmt ||
			responseOrError.modified ||
			responseData.modified_gmt ||
			responseData.modified
	);
}

function getDistributedEditingPostContentFromResponse( responseOrError ) {
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
			reason: 'block_count_changed',
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
