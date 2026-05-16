/**
 * WordPress dependencies
 */
import { Button, Notice, TextareaControl } from '@wordpress/components';
import { parse } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS,
	DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS,
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES,
	DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES,
	DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES,
	DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS,
	DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES,
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	getDistributedEditingFreshReviewDecisionStateForSessionState,
	getDistributedEditingFreshReviewPreSaveStateForSessionState,
	getDistributedEditingHumanLoopStepStateForSessionState,
	getDistributedEditingLocalUpdatesExportPayload,
	getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState,
	getDistributedEditingPresenceRosterStateForSessionState,
	getDistributedEditingPresenceStartupPolicyStateForSessionState,
	getDistributedEditingSavePolicyStateForSessionState,
	getDistributedEditingSaveJourneyStateForSessionState,
	normalizeDistributedEditingSessionState,
} from '../../store/distributed-editing';
import PluginPrePublishPanel from '../plugin-pre-publish-panel';

const DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_REJECTION_DETAILS =
	Object.freeze( {
		UNKNOWN: 'unknown_retry_save_review_approval_proof_token',
		EXPIRED: 'retry_save_review_approval_proof_token_expired',
	} );

const distributedEditingStartupHeartbeatRuntimeKeys = new Set();
const DISTRIBUTED_EDITING_STARTUP_SNAPSHOT_DELAY_MS = 1000;
const DISTRIBUTED_EDITING_CONFIRMED_SAVE_SHELL_HOLD_MS = 4000;
const DISTRIBUTED_EDITING_CONFIRMED_SAVE_STATUS_HOLD_MS = 7000;
const DISTRIBUTED_EDITING_SAME_BLOCK_CONFLICT_REASONS = new Set( [
	'same_block_changed',
	'same_serialized_block_changed',
] );
const DISTRIBUTED_EDITING_STRUCTURAL_CONFLICT_REASONS = new Set( [
	'block_count_changed',
	'block_deleted',
	'block_inserted',
	'block_reordered',
] );
const DISTRIBUTED_EDITING_EMPTY_CONFLICT_TEXT = __( 'No visible text.' );

const DISTRIBUTED_EDITING_STATUS_CONTROL_STATE_DEFINITIONS = Object.freeze( {
	idle: Object.freeze( {} ),
	pendingLocalChanges: Object.freeze( {
		pendingChangeCount: 2,
	} ),
	degradedConnection: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK,
		isConnectionDegraded: true,
	} ),
	remoteChanges: Object.freeze( {
		remoteChangeCount: 2,
	} ),
	serverStateConflict: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
		pendingChangeCount: 1,
	} ),
	staleBaseRejected: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
	} ),
	staleBaseRebaseReady: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: false,
		refetchedServerState: true,
		canAttemptLocalRebase: true,
		canExportLocalUpdates: true,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
		clientBaseContent: '',
		refetchedServerContent: '',
	} ),
	staleBaseRebaseMissingInputs: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: false,
		refetchedServerState: true,
		canAttemptLocalRebase: true,
		canExportLocalUpdates: true,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
		refetchedServerContent: '',
	} ),
	staleBaseRebased: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: false,
		refetchedServerState: true,
		canExportLocalUpdates: true,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
		localRebaseResultStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
		readyToRetrySubmit: true,
		clientBaseContent: '',
		refetchedServerContent: '',
	} ),
	staleBaseRebaseConflict: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: false,
		refetchedServerState: true,
		canExportLocalUpdates: true,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
		localRebaseResultStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
		localRebaseResultReason: 'same_block_changed',
		requiresManualConflictResolution: true,
		clientBaseContent: '',
		refetchedServerContent: '',
	} ),
	staleBaseRebaseBlockInserted: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: false,
		refetchedServerState: true,
		canExportLocalUpdates: true,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
		localRebaseResultStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
		localRebaseResultReason: 'block_inserted',
		requiresManualConflictResolution: true,
		clientBaseContent: '',
		refetchedServerContent: '',
	} ),
	staleBaseRebaseBlockReordered: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: false,
		refetchedServerState: true,
		canExportLocalUpdates: true,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
		localRebaseResultStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
		localRebaseResultReason: 'block_reordered',
		requiresManualConflictResolution: true,
		clientBaseContent: '',
		refetchedServerContent: '',
	} ),
	staleBaseRebaseFreeformHtml: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: false,
		refetchedServerState: true,
		canExportLocalUpdates: true,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
		localRebaseResultStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.UNSAFE_CONTENT_BOUNDARY,
		localRebaseResultReason: 'freeform_html',
		requiresManualConflictResolution: true,
		clientBaseContent: '',
		refetchedServerContent: '',
	} ),
	staleBaseRetryPrepared: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: false,
		refetchedServerState: true,
		canExportLocalUpdates: true,
		localRebasePlanStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
		localRebaseResultStatus:
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
		retrySubmitHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
		retrySubmitPrepared: true,
		clientBaseContent: '',
		refetchedServerContent: '',
	} ),
	staleBaseRetryProofAccepted: Object.freeze( {
		pendingChangeCount: 1,
		retrySubmitHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
		retrySubmitPrepared: true,
		retrySubmitProofStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
		retrySubmitAccepted: true,
		retrySubmitSavePathRequired: true,
		canExportLocalUpdates: true,
		mustOfferLocalCopy: true,
	} ),
	staleBaseRetryProofStale: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: true,
		canExportLocalUpdates: true,
		retrySubmitProofStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED,
		retrySubmitProofReason:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		clientBaseContent: '',
	} ),
	staleBaseRetrySaveReady: Object.freeze( {
		pendingChangeCount: 1,
		retrySubmitProofStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
		retrySubmitAccepted: true,
		retrySubmitSavePathRequired: true,
		retrySubmitSaveStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
		retrySubmitSavePrepared: true,
		retrySubmitSaveReady: true,
		canExportLocalUpdates: true,
		mustOfferLocalCopy: true,
	} ),
	staleBaseRetrySaveBlockedPermission: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
		reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
		pendingChangeCount: 1,
		retrySubmitProofStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_PERMISSION_DENIED,
		retrySubmitProofReason:
			DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
		retrySubmitSaveStatus:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
		retrySubmitSaveReason:
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.PERMISSION_DENIED,
		canExportLocalUpdates: true,
	} ),
	staleBaseRetrySaveSaving: Object.freeze( {
		pendingChangeCount: 1,
		retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
		canExportLocalUpdates: true,
		mustOfferLocalCopy: true,
	} ),
	staleBaseRetrySaveSaved: Object.freeze( {
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
	} ),
	staleBaseRetrySaveStale: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
		pendingChangeCount: 1,
		remoteChangeCount: 1,
		requiresServerStateRefetch: true,
		canExportLocalUpdates: true,
		retrySaveStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED,
		retrySaveReason:
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
	} ),
	staleBaseRetrySaveTampered: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
		reasonCode: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
		pendingChangeCount: 1,
		canExportLocalUpdates: true,
		retrySaveStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
		retrySaveReason:
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
	} ),
	staleBaseRetrySaveUnfilteredHtml: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
		pendingChangeCount: 1,
		requiresServerStateRefetch: true,
		requiresManualConflictResolution: true,
		canExportLocalUpdates: true,
		retrySaveStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
		retrySaveReason:
			DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
	} ),
	staleBaseRetrySaveHandoffBlockedProof: Object.freeze( {
		pendingChangeCount: 1,
		hasPendingChanges: true,
		isAwaitingServerConfirmation: true,
		canExportLocalUpdates: true,
		retrySaveHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
		retrySaveHandoffReason:
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
		retrySaveHandoffBlocksNormalSave: true,
	} ),
	staleBaseRetrySaveHandoffRefetch: Object.freeze( {
		pendingChangeCount: 1,
		hasPendingChanges: true,
		isAwaitingServerConfirmation: true,
		requiresServerStateRefetch: true,
		canExportLocalUpdates: true,
		retrySaveHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
		retrySaveHandoffReason:
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
		retrySaveHandoffBlocksNormalSave: true,
	} ),
	staleBaseRetrySaveHandoffMissingRoute: Object.freeze( {
		pendingChangeCount: 1,
		hasPendingChanges: true,
		isAwaitingServerConfirmation: true,
		canExportLocalUpdates: true,
		retrySaveHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
		retrySaveHandoffReason:
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_POST_ROUTE,
		retrySaveHandoffBlocksNormalSave: true,
	} ),
	staleBaseRetrySaveHandoffMissingContent: Object.freeze( {
		pendingChangeCount: 1,
		hasPendingChanges: true,
		isAwaitingServerConfirmation: true,
		canExportLocalUpdates: true,
		retrySaveHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
		retrySaveHandoffReason:
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_PROPOSED_CONTENT,
		retrySaveHandoffBlocksNormalSave: true,
	} ),
	staleBaseRetrySaveHandoffInProgress: Object.freeze( {
		pendingChangeCount: 1,
		hasPendingChanges: true,
		isAwaitingServerConfirmation: true,
		canExportLocalUpdates: true,
		retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
		retrySaveHandoffStatus:
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
		retrySaveHandoffReason:
			DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
		retrySaveHandoffBlocksNormalSave: true,
	} ),
	manualResolution: Object.freeze( {
		disposition:
			DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
		reasonCode:
			DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_UNAVAILABLE_AFTER_REVISION_SCAN,
		canExportLocalUpdates: true,
	} ),
} );

/**
 * Returns inert, renderable status items for DE-RTC notice descriptors.
 *
 * @param {Array} noticeDescriptors DE-RTC notice descriptors.
 *
 * @return {Array} Status items.
 */
export function getDistributedEditingStatusSurfaceItems(
	noticeDescriptors = []
) {
	return noticeDescriptors
		.map( getDistributedEditingStatusSurfaceItem )
		.filter( Boolean );
}

/**
 * Returns whether the selector-backed DE-RTC status surface should mount for
 * the current internal session state.
 *
 * @param {Object} sessionState       DE-RTC session state.
 * @param {Object} unloadWarningState DE-RTC unload-warning state.
 *
 * @return {boolean} Whether the status surface should render.
 */
export function shouldRenderDistributedEditingStatus(
	sessionState = {},
	unloadWarningState = {}
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return (
		normalized.disposition !== DISTRIBUTED_EDITING_DISPOSITIONS.IDLE ||
		normalized.hasPendingChanges ||
		normalized.isAwaitingServerConfirmation ||
		normalized.isConnectionDegraded ||
		normalized.hasRemoteChanges ||
		normalized.actionTranscriptItemCount > 0 ||
		normalized.requiresServerStateAcceptance ||
		normalized.mustOfferLocalCopy ||
		normalized.retrySaveStatus !==
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE ||
		normalized.retrySaveHandoffStatus !==
			DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.NONE ||
		( normalized.localUpdatesImportStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED &&
			normalized.localUpdatesImportReason ===
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED ) ||
		Boolean( unloadWarningState?.shouldWarn )
	);
}

/**
 * Returns representative DE-RTC session states for internal status-surface
 * checks. These are not transport fixtures and are not mounted in production
 * editor chrome.
 *
 * @return {Object} Session states keyed by control name.
 */
export function getDistributedEditingStatusControlStates() {
	return Object.fromEntries(
		Object.entries(
			DISTRIBUTED_EDITING_STATUS_CONTROL_STATE_DEFINITIONS
		).map( ( [ key, sessionState ] ) => [ key, { ...sessionState } ] )
	);
}

/**
 * Renders internal controls that can place the editor store into representative
 * DE-RTC status states without network transport.
 *
 * @param {Object}   props          Component props.
 * @param {Object}   props.states   Optional keyed session states.
 * @param {Function} props.onSelect Optional selection observer.
 *
 * @return {React.ReactNode} Rendered internal controls.
 */
export function DistributedEditingStatusTestControls( {
	states = getDistributedEditingStatusControlStates(),
	onSelect,
} ) {
	const {
		resetDistributedEditingSessionState,
		setDistributedEditingSessionState,
	} = useDispatch( editorStore );

	return (
		<div
			aria-label={ __( 'Distributed editing status test controls' ) }
			className="editor-distributed-editing-status__test-controls"
			role="group"
		>
			{ Object.entries( states ).map( ( [ key, sessionState ] ) => (
				<Button
					__next40pxDefaultSize
					key={ key }
					onClick={ () => {
						if ( key === 'idle' ) {
							resetDistributedEditingSessionState();
						} else {
							setDistributedEditingSessionState( sessionState );
						}

						onSelect?.( key, sessionState );
					} }
					variant="secondary"
				>
					{ getDistributedEditingStatusControlLabel( key ) }
				</Button>
			) ) }
		</div>
	);
}

/**
 * Renders the internal DE-RTC status inspection surface. This deliberately
 * combines the status controls and mounted status surface without transport so
 * manual browser checks can exercise representative states before the runtime
 * integration exists.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onAction Optional status action handler.
 * @param {Function} props.onSelect Optional control selection observer.
 *
 * @return {React.ReactNode} Rendered internal inspection surface.
 */
export function DistributedEditingStatusInspector( { onAction, onSelect } ) {
	return (
		<div
			aria-label={ __( 'Distributed editing status inspection' ) }
			className="editor-distributed-editing-status__inspector"
			role="group"
		>
			<DistributedEditingStatusTestControls onSelect={ onSelect } />
			<DistributedEditingRecoveryDryRunControls />
			<DistributedEditingRetrySaveControls />
			<DistributedEditingLocalUpdatesImportControls forceVisible />
			<DistributedEditingFreshReviewDecisionPanel />
			<DistributedEditingLocalRebaseStateInspector />
			<DistributedEditingStatus
				onAction={ onAction }
				placement="internal-inspector"
			/>
		</div>
	);
}

/**
 * Renders internal local-rebase state details for manual inspection.
 *
 * The inspector exposes readiness booleans and status enum values only. It does
 * not render retained post content, dispatch actions, save, retry submits,
 * persist editor state, or change post locks.
 *
 * @return {React.ReactNode} Rendered internal local-rebase state inspector.
 */
export function DistributedEditingLocalRebaseStateInspector() {
	const sessionState = useSelect( ( select ) => {
		const { getDistributedEditingSessionState } = select( editorStore );

		return getDistributedEditingSessionState();
	}, [] );
	const normalized = normalizeDistributedEditingSessionState( sessionState );

	return (
		<dl className="editor-distributed-editing-status__local-rebase-state">
			<div>
				<dt>{ __( 'Local rebase plan' ) }</dt>
				<dd>{ normalized.localRebasePlanStatus }</dd>
			</div>
			<div>
				<dt>{ __( 'Local rebase result' ) }</dt>
				<dd>{ normalized.localRebaseResultStatus }</dd>
			</div>
			<div>
				<dt>{ __( 'Local rebase reason' ) }</dt>
				<dd>{ normalized.localRebaseResultReason || __( 'None' ) }</dd>
			</div>
			<div>
				<dt>{ __( 'Client base input' ) }</dt>
				<dd>
					{ normalized.clientBaseContent !== null
						? __( 'Available' )
						: __( 'Missing' ) }
				</dd>
			</div>
			<div>
				<dt>{ __( 'Refetched server input' ) }</dt>
				<dd>
					{ normalized.refetchedServerContent !== null
						? __( 'Available' )
						: __( 'Missing' ) }
				</dd>
			</div>
			<div>
				<dt>{ __( 'Retry submit' ) }</dt>
				<dd>
					{ normalized.readyToRetrySubmit
						? __( 'Ready' )
						: __( 'Not ready' ) }
				</dd>
			</div>
			<div>
				<dt>{ __( 'Retry handoff' ) }</dt>
				<dd>{ normalized.retrySubmitHandoffStatus }</dd>
			</div>
			<div>
				<dt>{ __( 'Retry proof' ) }</dt>
				<dd>{ normalized.retrySubmitProofStatus }</dd>
			</div>
			<div>
				<dt>{ __( 'Retry accepted' ) }</dt>
				<dd>
					{ normalized.retrySubmitAccepted
						? __( 'Accepted for future save' )
						: __( 'Not accepted' ) }
				</dd>
			</div>
			<div>
				<dt>{ __( 'Retry save' ) }</dt>
				<dd>{ normalized.retrySubmitSaveStatus }</dd>
			</div>
			<div>
				<dt>{ __( 'Retry save reason' ) }</dt>
				<dd>{ normalized.retrySubmitSaveReason || __( 'None' ) }</dd>
			</div>
			<div>
				<dt>{ __( 'Guarded retry save' ) }</dt>
				<dd>{ normalized.retrySaveStatus }</dd>
			</div>
			<div>
				<dt>{ __( 'Guarded retry save reason' ) }</dt>
				<dd>{ normalized.retrySaveReason || __( 'None' ) }</dd>
			</div>
		</dl>
	);
}

/**
 * Renders the internal recovery dry-run control for manual inspection.
 *
 * The control calls the proof-only dry-run action and exposes the normalized
 * editor state it records. It does not save, apply recovery, persist state,
 * dispatch notices, or change post locks.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onResult Optional success observer.
 * @param {Function} props.onError  Optional failure observer.
 *
 * @return {React.ReactNode} Rendered internal dry-run controls.
 */
export function DistributedEditingRecoveryDryRunControls( {
	onResult,
	onError,
} ) {
	const [ commandStatus, setCommandStatus ] = useState( 'idle' );
	const { __experimentalRefreshDistributedEditingRecoveryDryRun } =
		useDispatch( editorStore );
	const sessionState = useSelect( ( select ) => {
		const { getDistributedEditingSessionState } = select( editorStore );

		return getDistributedEditingSessionState();
	}, [] );
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const isRunning = commandStatus === 'running';

	async function runRecoveryDryRun() {
		setCommandStatus( 'running' );

		try {
			const response =
				await __experimentalRefreshDistributedEditingRecoveryDryRun();

			setCommandStatus( 'succeeded' );
			onResult?.( response );
		} catch ( error ) {
			setCommandStatus( 'failed' );
			onError?.( error );
		}
	}

	return (
		<div
			aria-label={ __( 'Distributed editing recovery dry-run' ) }
			className="editor-distributed-editing-status__recovery-dry-run"
			role="group"
		>
			<Button
				__next40pxDefaultSize
				accessibleWhenDisabled
				disabled={ isRunning }
				isBusy={ isRunning }
				onClick={ runRecoveryDryRun }
				variant="secondary"
			>
				{ __( 'Run recovery dry run' ) }
			</Button>
			<dl className="editor-distributed-editing-status__recovery-dry-run-state">
				<div>
					<dt>{ __( 'Command' ) }</dt>
					<dd>
						{ getRecoveryDryRunCommandStatusLabel( commandStatus ) }
					</dd>
				</div>
				<div>
					<dt>{ __( 'Disposition' ) }</dt>
					<dd>{ normalized.disposition }</dd>
				</div>
				<div>
					<dt>{ __( 'Reason' ) }</dt>
					<dd>{ normalized.reasonCode || __( 'None' ) }</dd>
				</div>
			</dl>
		</div>
	);
}

/**
 * Renders the internal guarded retry-save control for manual inspection.
 *
 * The control calls the existing retry-save action and shows the normalized
 * state recorded by the store. It is deliberately mounted only in the internal
 * inspector, and it does not call the normal editor save path, dispatch
 * notices, expose retained post content, or change post locks.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onResult Optional success observer.
 * @param {Function} props.onError  Optional failure observer.
 *
 * @return {React.ReactNode} Rendered internal retry-save controls.
 */
export function DistributedEditingRetrySaveControls( { onResult, onError } ) {
	const [ commandStatus, setCommandStatus ] = useState( 'idle' );
	const { __experimentalSaveDistributedEditingRetryAfterProof } =
		useDispatch( editorStore );
	const sessionState = useSelect( ( select ) => {
		const { getDistributedEditingSessionState } = select( editorStore );

		return getDistributedEditingSessionState();
	}, [] );
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const isRunning = commandStatus === 'running';

	async function runRetrySave() {
		setCommandStatus( 'running' );

		try {
			const response =
				await __experimentalSaveDistributedEditingRetryAfterProof();

			setCommandStatus( 'succeeded' );
			onResult?.( response );
		} catch ( error ) {
			setCommandStatus( 'failed' );
			onError?.( error );
		}
	}

	return (
		<div
			aria-label={ __( 'Distributed editing retry save' ) }
			className="editor-distributed-editing-status__retry-save"
			role="group"
		>
			<Button
				__next40pxDefaultSize
				accessibleWhenDisabled
				disabled={ isRunning }
				isBusy={ isRunning }
				onClick={ runRetrySave }
				variant="secondary"
			>
				{ __( 'Run guarded retry save' ) }
			</Button>
			<dl className="editor-distributed-editing-status__retry-save-state">
				<div>
					<dt>{ __( 'Command' ) }</dt>
					<dd>{ getCommandStatusLabel( commandStatus ) }</dd>
				</div>
				<div>
					<dt>{ __( 'Guarded retry save' ) }</dt>
					<dd>{ normalized.retrySaveStatus }</dd>
				</div>
				<div>
					<dt>{ __( 'Guarded retry save reason' ) }</dt>
					<dd>{ normalized.retrySaveReason || __( 'None' ) }</dd>
				</div>
			</dl>
		</div>
	);
}

/**
 * Renders the local protected-updates import workflow.
 *
 * The control delegates validation to the editor action before content can
 * change. It reports only local command status and does not dispatch global
 * notices, save, call REST, or change post locks.
 *
 * @param {Object}   props              Component props.
 * @param {boolean}  props.forceVisible Whether to show without DE-RTC settings.
 * @param {Function} props.onResult     Optional success/block observer.
 * @param {Function} props.onError      Optional failure observer.
 *
 * @return {React.ReactNode} Rendered local-updates import controls.
 */
export function DistributedEditingLocalUpdatesImportControls( {
	forceVisible = false,
	onResult,
	onError,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ payloadText, setPayloadText ] = useState( '' );
	const [ commandStatus, setCommandStatus ] = useState( 'idle' );
	const [ importResult, setImportResult ] = useState( null );
	const { __experimentalImportDistributedEditingLocalUpdates } =
		useDispatch( editorStore ) || {};
	const { editorSettings, sessionState } = useSelect( ( select ) => {
		const { getDistributedEditingSessionState, getEditorSettings } =
			select( editorStore );

		return {
			editorSettings: getEditorSettings?.() || {},
			sessionState: getDistributedEditingSessionState?.() || {},
		};
	}, [] );
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const isDistributedEditingEnabled = Boolean(
		editorSettings?.distributedEditing?.enabled
	);
	const importStatus =
		importResult?.status || normalized.localUpdatesImportStatus;
	const shouldRender =
		forceVisible ||
		isDistributedEditingEnabled ||
		importStatus !== DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.NONE;

	if ( ! shouldRender ) {
		return null;
	}

	const isRunning = commandStatus === 'running';
	const statusMessage = getLocalUpdatesImportStatusMessage( {
		commandStatus,
		importResult,
		normalized,
	} );
	const actionTranscriptReportMessage =
		getActionTranscriptSupportReportMessage(
			importResult?.actionTranscriptReport ||
				normalized.localUpdatesImportActionTranscriptReport
		);

	async function importLocalUpdates() {
		setCommandStatus( 'running' );

		try {
			const result =
				await __experimentalImportDistributedEditingLocalUpdates?.(
					payloadText
				);

			setImportResult( result );
			onResult?.( result );

			if (
				result?.status ===
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE
			) {
				setPayloadText( '' );
				setCommandStatus( 'succeeded' );
			} else {
				setCommandStatus( 'blocked' );
			}

			return result;
		} catch ( error ) {
			setCommandStatus( 'failed' );
			setImportResult( null );
			onError?.( error );
			return null;
		}
	}

	return (
		<div
			aria-label={ __( 'Distributed editing reviewed changes import' ) }
			className="editor-distributed-editing-status__local-updates-import"
			role="group"
		>
			{ ! isOpen ? (
				<Button
					__next40pxDefaultSize
					onClick={ () => setIsOpen( true ) }
					variant="secondary"
				>
					{ __( 'Import reviewed changes' ) }
				</Button>
			) : (
				<>
					<TextareaControl
						className="editor-distributed-editing-status__local-updates-import-payload"
						label={ __( 'Reviewed changes payload' ) }
						onChange={ setPayloadText }
						value={ payloadText }
					/>
					<div className="editor-distributed-editing-status__local-updates-import-actions">
						<Button
							__next40pxDefaultSize
							accessibleWhenDisabled
							disabled={ isRunning }
							isBusy={ isRunning }
							onClick={ importLocalUpdates }
							variant="primary"
						>
							{ __( 'Validate review proof and import' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							accessibleWhenDisabled
							disabled={ isRunning }
							onClick={ () => {
								setIsOpen( false );
								setPayloadText( '' );
							} }
							variant="tertiary"
						>
							{ __( 'Cancel' ) }
						</Button>
					</div>
				</>
			) }
			{ statusMessage && (
				<div
					aria-live="polite"
					className="editor-distributed-editing-status__local-updates-import-status"
					data-distributed-editing-local-updates-import-status={
						importStatus ||
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.NONE
					}
					role="status"
				>
					{ statusMessage }
					{ actionTranscriptReportMessage && (
						<>
							{ ' ' }
							<span className="editor-distributed-editing-status__local-updates-import-report">
								{ actionTranscriptReportMessage }
							</span>
						</>
					) }
				</div>
			) }
		</div>
	);
}

/**
 * Renders the internal fresh-review decision panel for requested review
 * handoffs. It records only hash-evidence approve/reject decisions in local
 * editor state and never saves, submits proof, dispatches notices, or changes
 * post locks.
 *
 * @param {Object}  props              Component props.
 * @param {boolean} props.forceVisible Whether to show without requested state.
 *
 * @return {React.ReactNode} Rendered decision panel.
 */
export function DistributedEditingFreshReviewDecisionPanel( {
	forceVisible = false,
} ) {
	const [ commandStatus, setCommandStatus ] = useState( 'idle' );
	const [ selectedComparisonItemId, setSelectedComparisonItemId ] =
		useState( null );
	const {
		__experimentalResolveDistributedEditingFreshReviewDecisionItem,
		__experimentalSubmitDistributedEditingFreshReviewDecision,
	} = useDispatch( editorStore ) || {};
	const decisionState = useSelect( ( select ) => {
		const {
			getDistributedEditingFreshReviewDecisionState,
			getDistributedEditingSessionState,
		} = select( editorStore );
		const sessionState = getDistributedEditingSessionState?.() || {};

		return (
			getDistributedEditingFreshReviewDecisionState?.() ||
			getDistributedEditingFreshReviewDecisionStateForSessionState(
				sessionState
			)
		);
	}, [] );
	const shouldRender =
		forceVisible ||
		decisionState?.panelRequired ||
		decisionState?.requestStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED ||
		decisionState?.reviewItemCount > 0;

	if ( ! shouldRender ) {
		return null;
	}

	const actionTranscriptReportMessage =
		getActionTranscriptSupportReportMessage(
			decisionState?.actionTranscriptReport
		);

	async function resolveDecision( reviewItem, decision ) {
		setCommandStatus( 'running' );

		const result =
			await __experimentalResolveDistributedEditingFreshReviewDecisionItem?.(
				{
					reviewItemId: reviewItem.id,
					decision,
					rejectionReason:
						decision === 'rejected' ? 'reviewer_rejected' : null,
				}
			);

		setCommandStatus( 'resolved' );
		return result;
	}

	function inspectJumpTarget( reviewItem ) {
		const jumpAction = reviewItem?.jumpToBlockAction;
		const nextCommandStatus =
			jumpAction?.commandStatus ||
			( jumpAction?.enabled
				? 'jump-target-available'
				: 'jump-target-unavailable' );

		setCommandStatus( nextCommandStatus );
		return jumpAction;
	}

	function inspectCompareEvidence( reviewItem ) {
		const compareAction = reviewItem?.compareAction;
		const comparisonSurface = compareAction?.comparisonSurface;

		if ( comparisonSurface?.canOpenComparisonSurface ) {
			setSelectedComparisonItemId( reviewItem.id );
			setCommandStatus( 'comparison-surface-open' );
			return compareAction;
		}

		const nextCommandStatus =
			compareAction?.commandStatus ||
			( compareAction?.enabled
				? 'compare-evidence-available'
				: 'compare-evidence-unavailable' );

		setSelectedComparisonItemId( null );
		setCommandStatus( nextCommandStatus );
		return compareAction;
	}

	async function submitDecision() {
		setCommandStatus( 'submitting' );

		const result =
			await __experimentalSubmitDistributedEditingFreshReviewDecision?.();

		setCommandStatus(
			result?.accepted || result?.status === 'recorded'
				? 'submitted'
				: 'submit-failed'
		);
		return result;
	}
	const selectedComparisonItem =
		decisionState?.reviewItems?.find(
			( item ) => item.id === selectedComparisonItemId
		) || null;

	return (
		<div
			aria-label={ __( 'Distributed editing fresh review decisions' ) }
			className="editor-distributed-editing-status__fresh-review-decisions"
			role="group"
		>
			<strong>{ __( 'Fresh review decisions' ) }</strong>
			{ actionTranscriptReportMessage && (
				<p className="editor-distributed-editing-status__fresh-review-decision-report">
					{ actionTranscriptReportMessage }
				</p>
			) }
			<dl className="editor-distributed-editing-status__fresh-review-decision-state">
				<div>
					<dt>{ __( 'Decision status' ) }</dt>
					<dd>{ decisionState?.status }</dd>
				</div>
				<div>
					<dt>{ __( 'Decision readiness' ) }</dt>
					<dd>
						{ decisionState?.ready
							? __( 'Ready' )
							: __( 'Awaiting review' ) }
					</dd>
				</div>
				<div>
					<dt>{ __( 'Reviewed items' ) }</dt>
					<dd>
						{ sprintf(
							/* translators: 1: approved review item count, 2: rejected review item count, 3: pending review item count. */
							__( '%1$d approved, %2$d rejected, %3$d pending' ),
							decisionState?.approvedReviewItemCount || 0,
							decisionState?.rejectedReviewItemCount || 0,
							decisionState?.pendingReviewItemCount || 0
						) }
					</dd>
				</div>
			</dl>
			{ decisionState?.reviewItemCount > 0 ? (
				<ul className="editor-distributed-editing-status__fresh-review-decision-items">
					{ decisionState.reviewItems.map( ( item ) => {
						const label =
							item.blockLabel ||
							item.blockName ||
							item.id ||
							__( 'Review item' );
						const actionTranscriptReportContextMessage =
							getFreshReviewDecisionItemActionTranscriptContextMessage(
								item.actionTranscriptReportContext
							);
						const affordanceMessages =
							getFreshReviewDecisionItemAffordanceMessages(
								item
							);

						return (
							<li
								className="editor-distributed-editing-status__fresh-review-decision-item"
								key={ item.id }
							>
								<Button
									__next40pxDefaultSize
									accessibleWhenDisabled
									aria-label={ sprintf(
										/* translators: %s: review item label. */
										__( 'Approve %s' ),
										label
									) }
									disabled={ commandStatus === 'running' }
									onClick={ () =>
										resolveDecision( item, 'approved' )
									}
									variant="primary"
								>
									{ __( 'Approve' ) }
								</Button>
								<span>{ label }</span>
								<span>{ item.reviewStatus }</span>
								{ actionTranscriptReportContextMessage && (
									<span className="editor-distributed-editing-status__fresh-review-decision-item-report">
										{ actionTranscriptReportContextMessage }
									</span>
								) }
								{ affordanceMessages.map(
									( { key, message } ) => (
										<span
											className="editor-distributed-editing-status__fresh-review-decision-item-affordance"
											data-distributed-editing-fresh-review-item-affordance={
												key
											}
											key={ key }
										>
											{ message }
										</span>
									)
								) }
								{ item.jumpToBlockAction
									?.reportsCommandStatus && (
									<Button
										__next40pxDefaultSize
										accessibleWhenDisabled
										aria-label={ sprintf(
											/* translators: %s: review item label. */
											__( 'Inspect jump target for %s' ),
											label
										) }
										className="editor-distributed-editing-status__fresh-review-decision-item-affordance-command"
										data-distributed-editing-fresh-review-item-affordance-command="jump-to-block"
										disabled={
											! item.jumpToBlockAction.enabled ||
											[
												'running',
												'submitting',
											].includes( commandStatus )
										}
										onClick={ () =>
											inspectJumpTarget( item )
										}
										variant="tertiary"
									>
										{ __( 'Jump target' ) }
									</Button>
								) }
								{ item.compareAction?.reportsCommandStatus && (
									<Button
										__next40pxDefaultSize
										accessibleWhenDisabled
										aria-label={ sprintf(
											/* translators: %s: review item label. */
											__(
												'Inspect compare evidence for %s'
											),
											label
										) }
										className="editor-distributed-editing-status__fresh-review-decision-item-affordance-command"
										data-distributed-editing-fresh-review-item-affordance-command="compare"
										disabled={
											! item.compareAction.enabled ||
											[
												'running',
												'submitting',
											].includes( commandStatus )
										}
										onClick={ () =>
											inspectCompareEvidence( item )
										}
										variant="tertiary"
									>
										{ __( 'Compare' ) }
									</Button>
								) }
								<Button
									__next40pxDefaultSize
									accessibleWhenDisabled
									aria-label={ sprintf(
										/* translators: %s: review item label. */
										__( 'Reject %s' ),
										label
									) }
									disabled={ commandStatus === 'running' }
									isDestructive
									onClick={ () =>
										resolveDecision( item, 'rejected' )
									}
									variant="tertiary"
								>
									{ __( 'Reject' ) }
								</Button>
							</li>
						);
					} ) }
				</ul>
			) : (
				<p>
					{ __(
						'No hash-only block decisions are available for this requested review yet.'
					) }
				</p>
			) }
			<DistributedEditingFreshReviewComparisonSurface
				onBack={ () => {
					setSelectedComparisonItemId( null );
					setCommandStatus( 'comparison-surface-closed' );
				} }
				reviewItem={ selectedComparisonItem }
			/>
			<Button
				__next40pxDefaultSize
				accessibleWhenDisabled
				className="editor-distributed-editing-status__fresh-review-submit"
				disabled={
					! decisionState?.ready ||
					[ 'running', 'submitting' ].includes( commandStatus )
				}
				onClick={ submitDecision }
				variant="secondary"
			>
				{ __( 'Submit decision' ) }
			</Button>
			<div
				aria-live="polite"
				className="editor-distributed-editing-status__fresh-review-decision-command"
				data-distributed-editing-fresh-review-decision-status={
					commandStatus
				}
				role="status"
			>
				{ getFreshReviewDecisionCommandMessage( commandStatus ) }
			</div>
		</div>
	);
}

/**
 * Renders the fresh-review decision surface inside the existing pre-publish
 * flow. It presents hash-only approve/reject controls and records only local
 * reviewer decisions. It does not save, call retry-save, dispatch notices,
 * mutate editor content, or change post locks.
 *
 * @param {Object}  props              Component props.
 * @param {boolean} props.forceVisible Whether to show without requested state.
 *
 * @return {React.ReactNode} Rendered pre-publish Fill.
 */
export function DistributedEditingFreshReviewPrePublishPanel( {
	forceVisible = false,
} ) {
	const { decisionState, preSaveState } = useSelect( ( select ) => {
		const {
			getDistributedEditingFreshReviewDecisionState,
			getDistributedEditingFreshReviewPreSaveState,
			getDistributedEditingSessionState,
		} = select( editorStore );
		const sessionState = getDistributedEditingSessionState?.() || {};

		return {
			decisionState:
				getDistributedEditingFreshReviewDecisionState?.() ||
				getDistributedEditingFreshReviewDecisionStateForSessionState(
					sessionState
				),
			preSaveState:
				getDistributedEditingFreshReviewPreSaveState?.() ||
				getDistributedEditingFreshReviewPreSaveStateForSessionState(
					sessionState
				),
		};
	}, [] );
	const shouldRender =
		forceVisible ||
		preSaveState?.opensPrePublishReview ||
		decisionState?.panelRequired ||
		decisionState?.reviewItemCount > 0;

	if ( ! shouldRender ) {
		return null;
	}

	return (
		<PluginPrePublishPanel
			className="editor-distributed-editing-status__fresh-review-pre-publish-panel"
			initialOpen
			title={ __( 'Distributed Editing fresh review' ) }
		>
			<div
				data-distributed-editing-fresh-review-blocks-normal-save={ formatDataBoolean(
					preSaveState?.blocksNormalSavePost
				) }
				data-distributed-editing-fresh-review-pre-publish-panel
				data-distributed-editing-fresh-review-redacted="true"
				data-distributed-editing-fresh-review-review-item-count={
					decisionState?.reviewItemCount || undefined
				}
				data-distributed-editing-pre-save-placement={
					preSaveState?.placement || undefined
				}
				data-distributed-editing-pre-save-status={
					preSaveState?.status || undefined
				}
				data-testid="distributed-editing-fresh-review-pre-publish-panel"
			>
				<DistributedEditingFreshReviewDecisionPanel
					forceVisible={
						forceVisible || preSaveState?.opensPrePublishReview
					}
				/>
			</div>
		</PluginPrePublishPanel>
	);
}

/**
 * Renders an inert DE-RTC status surface from pure selector output.
 *
 * @param {Object}   props                    Component props.
 * @param {Array}    props.noticeDescriptors  DE-RTC notice descriptors.
 * @param {Object}   props.unloadWarningState DE-RTC unload-warning state.
 * @param {Object}   props.actionStatus       Local action status.
 * @param {Function} props.onAction           Optional action handler.
 * @param {string}   props.placement          Status surface placement.
 *
 * @return {React.ReactNode} Rendered status surface.
 */
export function DistributedEditingStatusSurface( {
	noticeDescriptors = [],
	unloadWarningState = {},
	actionStatus = null,
	onAction,
	placement = 'standalone-status-surface',
} ) {
	const statusItems =
		getDistributedEditingStatusSurfaceItems( noticeDescriptors );
	const confirmedSaveStatusItems = statusItems.filter(
		isConfirmedRetrySaveStatusItem
	);
	const confirmedSaveStatusItemIdsKey = confirmedSaveStatusItems
		.map( ( item ) => item.id )
		.join( '|' );
	const confirmedSaveStatusItemsKey = confirmedSaveStatusItems
		.map(
			( item ) =>
				`${ item.id }:${ item.title }:${ item.message }:${ item.retrySaveStatus }`
		)
		.join( '|' );
	const confirmedSaveStatusHoldMs =
		getDistributedEditingConfirmedSaveStatusHoldMs();
	const [ quietedConfirmedSaveStatusIds, setQuietedConfirmedSaveStatusIds ] =
		useState( [] );
	const unloadWarningMessage =
		getDistributedEditingUnloadWarningMessage( unloadWarningState );
	const actionStatusMessage = actionStatus?.message;

	useEffect( () => {
		if ( ! confirmedSaveStatusItemsKey ) {
			setQuietedConfirmedSaveStatusIds( [] );
			return;
		}

		setQuietedConfirmedSaveStatusIds( [] );
		const timeoutId = setTimeout( () => {
			setQuietedConfirmedSaveStatusIds(
				confirmedSaveStatusItemIdsKey.split( '|' ).filter( Boolean )
			);
		}, confirmedSaveStatusHoldMs );

		return () => {
			clearTimeout( timeoutId );
		};
	}, [
		confirmedSaveStatusHoldMs,
		confirmedSaveStatusItemIdsKey,
		confirmedSaveStatusItemsKey,
	] );

	if (
		! statusItems.length &&
		! unloadWarningMessage &&
		! actionStatusMessage
	) {
		return null;
	}

	return (
		<div
			aria-label={ __( 'Distributed editing status' ) }
			className="editor-distributed-editing-status"
			data-distributed-editing-placement={ placement }
			role="region"
		>
			{ statusItems.map( ( item ) => {
				const freshReviewAuthorityStatus =
					getFreshReviewAuthorityStatusProps( item );
				const nextStepMessage = item.nextStepMessage;
				const actionTranscriptReportMessage =
					getActionTranscriptSupportReportMessage(
						item.actionTranscriptSupportReport ||
							item.localUpdatesImportActionTranscriptReport
					);
				const actionTranscriptSupportReport =
					item.actionTranscriptSupportReport;
				const isConfirmedSaveStatus =
					isConfirmedRetrySaveStatusItem( item );
				const isQuietedConfirmedSaveStatus =
					isConfirmedSaveStatus &&
					quietedConfirmedSaveStatusIds.includes( item.id );

				return (
					<div
						key={ item.id }
						data-testid={ getFreshReviewStatusItemTestId(
							item,
							freshReviewAuthorityStatus
						) }
						data-distributed-editing-pre-save-placement={
							item.freshReviewPreSavePlacement || undefined
						}
						data-distributed-editing-pre-save-status={
							item.freshReviewPreSaveStatus || undefined
						}
						data-distributed-editing-fresh-review-action={
							freshReviewAuthorityStatus?.action || undefined
						}
						data-distributed-editing-fresh-review-blocks-normal-save={ formatDataBoolean(
							freshReviewAuthorityStatus?.blocksNormalSavePost
						) }
						data-distributed-editing-fresh-review-exportable={ formatDataBoolean(
							freshReviewAuthorityStatus?.canExportLocalUpdates
						) }
						data-distributed-editing-fresh-review-lifecycle={
							freshReviewAuthorityStatus?.lifecycleStatus ||
							undefined
						}
						data-distributed-editing-fresh-review-redacted={
							freshReviewAuthorityStatus ? 'true' : undefined
						}
						data-distributed-editing-fresh-review-review-item-count={
							freshReviewAuthorityStatus?.reviewItemCount ||
							undefined
						}
						data-distributed-editing-fresh-review-surface={
							freshReviewAuthorityStatus?.surface || undefined
						}
						data-distributed-editing-transcript-event-type={
							item.actionTranscriptLatestEventType || undefined
						}
						data-distributed-editing-transcript-item-count={
							item.actionTranscriptItemCount || undefined
						}
						data-distributed-editing-transcript-redacted={ formatDataBoolean(
							item.actionTranscriptEntriesRedacted
						) }
						data-distributed-editing-transcript-support-report={ formatDataBoolean(
							actionTranscriptSupportReport?.available
						) }
						data-distributed-editing-transcript-support-shareable={ formatDataBoolean(
							actionTranscriptSupportReport?.canShareWithSupport
						) }
						data-distributed-editing-transcript-support-save-authority-required={ formatDataBoolean(
							actionTranscriptSupportReport?.requiresSaveAuthorityForPersistence
						) }
						data-distributed-editing-conflict-proof-accepted={ formatDataBoolean(
							item.conflictResolutionProofAccepted
						) }
						data-distributed-editing-conflict-proof-continuation={
							item.conflictResolutionContinuationAction ||
							undefined
						}
						data-distributed-editing-conflict-authoritative-post-updated={ formatDataBoolean(
							item.conflictResolutionAuthoritativePostUpdated
						) }
						data-distributed-editing-confirmed-save-status-evidence-retained={
							isConfirmedSaveStatus ? 'true' : undefined
						}
						data-distributed-editing-confirmed-save-status-quieted={
							isConfirmedSaveStatus
								? formatDataBoolean(
										isQuietedConfirmedSaveStatus
								  )
								: undefined
						}
						data-distributed-editing-confirmed-save-merged-edits={
							isConfirmedSaveStatus
								? formatDataBoolean(
										item.retrySaveConfirmedMergedEdits
								  )
								: undefined
						}
						data-distributed-editing-next-step={
							item.nextStepAction || undefined
						}
						data-distributed-editing-remote-review-context={ formatDataBoolean(
							Boolean( item.remoteReviewContextMessage )
						) }
						data-distributed-editing-save-now-context={ formatDataBoolean(
							Boolean( item.saveNowContextMessage )
						) }
						data-distributed-editing-save-now-action={
							item.saveNowContextAction || undefined
						}
						data-distributed-editing-save-now-step={
							item.saveNowContextStep || undefined
						}
					>
						<Notice
							className="editor-distributed-editing-status__notice"
							isDismissible={ false }
							status={ item.status }
							actions={ getNoticeActions( item, onAction ) }
						>
							<strong>{ item.title }</strong>
							{ isQuietedConfirmedSaveStatus ? (
								<>
									<div>
										{ getQuietedConfirmedSaveStatusMessage(
											item
										) }
									</div>
									<details
										className="editor-distributed-editing-status__confirmed-save-details"
										data-distributed-editing-confirmed-save-status-details="retained"
									>
										<summary>
											{ __( 'Show Save evidence' ) }
										</summary>
										<div>{ item.message }</div>
									</details>
								</>
							) : (
								<div>{ item.message }</div>
							) }
							{ nextStepMessage && (
								<div className="editor-distributed-editing-status__next-step">
									<strong>{ __( 'Next step:' ) }</strong>{ ' ' }
									{ nextStepMessage }
								</div>
							) }
							{ item.remoteReviewContextMessage && (
								<div className="editor-distributed-editing-status__remote-review-context">
									{ item.remoteReviewContextMessage }
								</div>
							) }
							{ item.saveNowContextMessage && (
								<div className="editor-distributed-editing-status__save-now-context">
									{ item.saveNowContextMessage }
								</div>
							) }
							{ actionTranscriptReportMessage && (
								<div className="editor-distributed-editing-status__support-report">
									{ actionTranscriptReportMessage }
								</div>
							) }
							<ActionTranscriptSupportTimeline
								report={ actionTranscriptSupportReport }
							/>
							<FreshReviewAuthorityStatus
								status={ freshReviewAuthorityStatus }
							/>
						</Notice>
					</div>
				);
			} ) }
			{ unloadWarningMessage && (
				<div className="editor-distributed-editing-status__unload-warning">
					{ unloadWarningMessage }
				</div>
			) }
			{ actionStatusMessage && (
				<div
					aria-live="polite"
					className="editor-distributed-editing-status__action-status"
					data-distributed-editing-action-status={
						actionStatus?.status || 'info'
					}
					role="status"
				>
					{ actionStatusMessage }
				</div>
			) }
		</div>
	);
}

function getDistributedEditingSameBlockConflictComparison(
	sessionState,
	editedPostContent
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const hasConfirmedRetrySave =
		normalized.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED &&
		normalized.retrySaveAccepted &&
		normalized.retrySaveClaimsSaved;

	if ( hasConfirmedRetrySave ) {
		return null;
	}

	const isSameBlockConflictReason =
		DISTRIBUTED_EDITING_SAME_BLOCK_CONFLICT_REASONS.has(
			normalized.localRebaseResultReason
		);
	const hasConflictResolutionChoice = [
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
	].includes( normalized.staleBaseConflictResolutionChoice );
	const isRetrySubmitProofAccepted =
		normalized.retrySubmitProofStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE &&
		normalized.retrySubmitAccepted &&
		! normalized.staleBaseConflictResolutionRequiresFreshProof;
	const isManualSameBlockConflict =
		normalized.disposition ===
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION &&
		normalized.localRebaseResultStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED &&
		isSameBlockConflictReason;
	const isCheckedSameBlockConflictChoice =
		isSameBlockConflictReason &&
		hasConflictResolutionChoice &&
		isRetrySubmitProofAccepted;

	if (
		( ! isManualSameBlockConflict && ! isCheckedSameBlockConflictChoice ) ||
		typeof normalized.clientBaseContent !== 'string' ||
		typeof normalized.refetchedServerContent !== 'string' ||
		typeof editedPostContent !== 'string'
	) {
		return null;
	}

	if (
		! normalized.clientBaseContent &&
		! normalized.refetchedServerContent &&
		! editedPostContent
	) {
		return null;
	}

	const comparedBlocks = getComparedSerializedBlockConflict(
		normalized.clientBaseContent,
		normalized.refetchedServerContent,
		editedPostContent
	);
	const rows = [
		{
			id: 'base',
			label: __( 'Base version' ),
			text: getVisibleConflictText( comparedBlocks.base ),
		},
		{
			id: 'server',
			label: __( 'Latest from WordPress' ),
			text: getVisibleConflictText( comparedBlocks.server ),
		},
		{
			id: 'local',
			label: __( 'Your local version' ),
			text: getVisibleConflictText( comparedBlocks.local ),
		},
	];
	const savePrepared =
		normalized.retrySubmitSaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY;
	const canRequestFreshProof =
		Boolean( normalized.staleBaseConflictResolutionChoice ) &&
		normalized.staleBaseConflictResolutionRequiresFreshProof &&
		normalized.retrySubmitProofStatus !==
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE;
	const canPrepareSave =
		Boolean( normalized.staleBaseConflictResolutionChoice ) &&
		isRetrySubmitProofAccepted &&
		! savePrepared;
	let nextStepAction = 'choose_conflict_version';

	if ( canRequestFreshProof ) {
		nextStepAction = 'check_conflict_choice';
	}

	if ( canPrepareSave ) {
		nextStepAction = 'prepare_guarded_save';
	}

	if ( savePrepared ) {
		nextStepAction = 'save_guarded_update';
	}

	return {
		blockIndex: comparedBlocks.blockIndex,
		hasBaseContent:
			rows[ 0 ].text !== DISTRIBUTED_EDITING_EMPTY_CONFLICT_TEXT,
		hasServerContent:
			rows[ 1 ].text !== DISTRIBUTED_EDITING_EMPTY_CONFLICT_TEXT,
		hasLocalContent:
			rows[ 2 ].text !== DISTRIBUTED_EDITING_EMPTY_CONFLICT_TEXT,
		reason: normalized.localRebaseResultReason,
		resolutionChoice: normalized.staleBaseConflictResolutionChoice,
		resolutionRequiresFreshProof:
			normalized.staleBaseConflictResolutionRequiresFreshProof,
		resolutionStatus: normalized.staleBaseConflictResolutionStatus,
		canRequestFreshProof,
		retrySubmitProofStatus: normalized.retrySubmitProofStatus,
		retrySubmitSaveStatus: normalized.retrySubmitSaveStatus,
		canPrepareSave,
		nextStepAction,
		saveReady: savePrepared,
		savePrepared,
		rows,
	};
}

function getComparedSerializedBlockConflict(
	baseContent,
	serverContent,
	localContent
) {
	const baseBlocks = getSerializedBlockChunks( baseContent );
	const serverBlocks = getSerializedBlockChunks( serverContent );
	const localBlocks = getSerializedBlockChunks( localContent );
	const blockCount = Math.max(
		baseBlocks.length,
		serverBlocks.length,
		localBlocks.length
	);

	for ( let index = 0; index < blockCount; index++ ) {
		const baseBlock = baseBlocks[ index ] || '';
		const serverBlock = serverBlocks[ index ] || '';
		const localBlock = localBlocks[ index ] || '';

		if (
			baseBlock &&
			serverBlock &&
			localBlock &&
			serverBlock !== baseBlock &&
			localBlock !== baseBlock &&
			serverBlock !== localBlock
		) {
			return {
				base: baseBlock,
				server: serverBlock,
				local: localBlock,
				blockIndex: index,
			};
		}
	}

	return {
		base: baseContent,
		server: serverContent,
		local: localContent,
		blockIndex: -1,
	};
}

function getSerializedBlockChunks( content ) {
	const matches = content.match(
		/<!--\s+wp:[\s\S]*?-->(?:(?!<!--\s+\/wp:)[\s\S])*?<!--\s+\/wp:[\s\S]*?-->/g
	);

	return matches?.length ? matches : [ content ];
}

function getVisibleConflictText( content ) {
	const withoutScripts = content
		.replace( /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ' )
		.replace( /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ' )
		.replace( /<!--[\s\S]*?-->/g, ' ' )
		.replace( /<[^>]*>/g, ' ' );
	const decoded = decodeDistributedEditingHtmlEntities( withoutScripts )
		.replace( /\s+/g, ' ' )
		.trim();

	return decoded || DISTRIBUTED_EDITING_EMPTY_CONFLICT_TEXT;
}

function decodeDistributedEditingHtmlEntities( value ) {
	if ( globalThis?.document?.createElement ) {
		const textarea = globalThis.document.createElement( 'textarea' );
		textarea.innerHTML = value;
		return textarea.value;
	}

	return value
		.replace( /&nbsp;/g, ' ' )
		.replace( /&amp;/g, '&' )
		.replace( /&lt;/g, '<' )
		.replace( /&gt;/g, '>' )
		.replace( /&quot;/g, '"' )
		.replace( /&#039;/g, "'" );
}

function getConflictComparisonRows( text ) {
	return Math.min( 8, Math.max( 3, text.split( '\n' ).length ) );
}

function getDistributedEditingStructuralConflictSummary(
	sessionState,
	editedPostContent
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const hasConfirmedRetrySave =
		normalized.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED &&
		normalized.retrySaveAccepted &&
		normalized.retrySaveClaimsSaved;
	const isStructuralConflictReason =
		DISTRIBUTED_EDITING_STRUCTURAL_CONFLICT_REASONS.has(
			normalized.localRebaseResultReason
		);
	const isManualStructuralConflict =
		normalized.disposition ===
			DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION &&
		normalized.localRebaseResultStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED &&
		isStructuralConflictReason;

	if (
		hasConfirmedRetrySave ||
		! isManualStructuralConflict ||
		typeof normalized.clientBaseContent !== 'string' ||
		typeof normalized.refetchedServerContent !== 'string' ||
		typeof editedPostContent !== 'string'
	) {
		return null;
	}

	const snapshots = [
		getStructuralConflictSnapshot( {
			content: normalized.clientBaseContent,
			id: 'base',
			label: __( 'Starting post' ),
		} ),
		getStructuralConflictSnapshot( {
			content: normalized.refetchedServerContent,
			id: 'server',
			label: __( 'Latest from WordPress' ),
		} ),
		getStructuralConflictSnapshot( {
			content: editedPostContent,
			id: 'local',
			label: __( 'Your local editor' ),
		} ),
	];
	const baseBlockCount = snapshots[ 0 ].blockCount;
	const serverBlockCount = snapshots[ 1 ].blockCount;
	const localBlockCount = snapshots[ 2 ].blockCount;

	if (
		baseBlockCount === 0 &&
		serverBlockCount === 0 &&
		localBlockCount === 0
	) {
		return null;
	}

	return {
		baseBlockCount,
		localBlockCount,
		localCountDelta: localBlockCount - baseBlockCount,
		reason: normalized.localRebaseResultReason,
		reasonLabel: getStructuralConflictReasonLabel(
			normalized.localRebaseResultReason
		),
		serverBlockCount,
		serverCountDelta: serverBlockCount - baseBlockCount,
		resolutionChoice: normalized.staleBaseConflictResolutionChoice,
		resolutionRequiresFreshProof:
			normalized.staleBaseConflictResolutionRequiresFreshProof,
		resolutionStatus: normalized.staleBaseConflictResolutionStatus,
		snapshots,
	};
}

function getStructuralConflictSnapshot( { content, id, label } ) {
	const blockChunks = getSerializedBlockChunksForStructuralSummary( content );
	const visibleTexts = blockChunks
		.map( getVisibleConflictText )
		.filter( ( text ) => text !== DISTRIBUTED_EDITING_EMPTY_CONFLICT_TEXT );
	const sampleTexts = visibleTexts.slice( 0, 3 );
	const previewTexts = visibleTexts.slice( 0, 8 );

	return {
		blockCount: blockChunks.length,
		id,
		label,
		overflowCount: Math.max( 0, blockChunks.length - sampleTexts.length ),
		sampleTexts:
			sampleTexts.length > 0
				? sampleTexts
				: [ DISTRIBUTED_EDITING_EMPTY_CONFLICT_TEXT ],
		previewOverflowCount: Math.max(
			0,
			blockChunks.length - previewTexts.length
		),
		previewTexts:
			previewTexts.length > 0
				? previewTexts
				: [ DISTRIBUTED_EDITING_EMPTY_CONFLICT_TEXT ],
	};
}

function getSerializedBlockChunksForStructuralSummary( content ) {
	if ( typeof content !== 'string' || content.trim() === '' ) {
		return [];
	}

	return getSerializedBlockChunks( content ).filter(
		( block ) => block.trim() !== ''
	);
}

function getStructuralConflictReasonLabel( reason ) {
	switch ( reason ) {
		case 'block_deleted':
			return __( 'Blocks deleted' );
		case 'block_inserted':
			return __( 'Blocks inserted' );
		case 'block_reordered':
			return __( 'Blocks reordered' );
	}

	return __( 'Block structure changed' );
}

function getStructuralConflictMessage( summary ) {
	switch ( summary.reason ) {
		case 'block_deleted':
			return __(
				'Blocks were deleted in more than one place. Compare the starting post, latest WordPress version, and your local editor before choosing what to keep.'
			);
		case 'block_inserted':
			return __(
				'Blocks were inserted in more than one place. Compare the starting post, latest WordPress version, and your local editor before choosing what to keep.'
			);
		case 'block_reordered':
			return __(
				'Blocks were reordered while local changes were pending. Compare the starting post, latest WordPress version, and your local editor before choosing what to keep.'
			);
	}

	return __(
		'The block structure changed while local edits were pending. Compare the starting post, latest WordPress version, and your local editor before choosing what to keep.'
	);
}

function getStructuralConflictBlockCountLabel( count ) {
	return sprintf(
		/* translators: %d: number of blocks. */
		_n( '%d block', '%d blocks', count ),
		count
	);
}

function getStructuralConflictCountDeltaLabel( delta ) {
	if ( delta > 0 ) {
		return sprintf(
			/* translators: %d: number of added blocks. */
			_n( '+%d block', '+%d blocks', delta ),
			delta
		);
	}

	if ( delta < 0 ) {
		const removedCount = Math.abs( delta );

		return sprintf(
			/* translators: %d: number of removed blocks. */
			_n( '-%d block', '-%d blocks', removedCount ),
			removedCount
		);
	}

	return __( 'No count change' );
}

function getConflictComparisonGuide( comparison ) {
	const isLocalChoice =
		comparison.resolutionChoice ===
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL;
	const isLatestWordPressChoice =
		comparison.resolutionChoice ===
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS;
	const isProofAccepted =
		comparison.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE;

	if ( isProofAccepted && comparison.savePrepared ) {
		return {
			status: 'save_prepared',
			currentStep: 'save',
			title: __( 'Save is prepared' ),
			message: __(
				'Use the editor Save button to update WordPress. Local changes remain pending until WordPress confirms.'
			),
		};
	}

	if ( isProofAccepted ) {
		return {
			status: 'choice_checked',
			currentStep: 'prepare',
			title: __( 'WordPress checked this choice' ),
			message: __(
				'Prepare Save before using the editor Save button. WordPress has not changed the post yet.'
			),
		};
	}

	if ( isLocalChoice || isLatestWordPressChoice ) {
		return {
			status: isLocalChoice
				? 'local_version_selected'
				: 'latest_wordpress_selected',
			currentStep: 'check',
			title: isLocalChoice
				? __( 'Your local version is selected' )
				: __( 'Latest WordPress version is selected' ),
			message: __(
				'Check this choice with WordPress before using Save. The WordPress post has not changed yet.'
			),
		};
	}

	return {
		status: 'choose_version',
		currentStep: 'choose',
		title: __( 'Choose a version to keep' ),
		message: __(
			'WordPress is waiting because this editor and the saved post changed the same block. Choosing here does not save yet.'
		),
	};
}

function getConflictComparisonGuideSteps( currentStep ) {
	const steps = [
		{
			id: 'choose',
			label: __( 'Choose version' ),
		},
		{
			id: 'check',
			label: __( 'Check choice' ),
		},
		{
			id: 'prepare',
			label: __( 'Prepare Save' ),
		},
		{
			id: 'save',
			label: __( 'Use Save' ),
		},
	];
	const currentIndex = Math.max(
		0,
		steps.findIndex( ( step ) => step.id === currentStep )
	);

	return steps.map( ( step, index ) => {
		let status = 'upcoming';

		if ( index < currentIndex ) {
			status = 'complete';
		} else if ( index === currentIndex ) {
			status = 'current';
		}

		return {
			...step,
			isCurrent: status === 'current',
			status,
		};
	} );
}

function getConflictComparisonGuideStepAriaLabel( step ) {
	if ( step.status === 'complete' ) {
		return sprintf(
			/* translators: %s: conflict resolution step label. */
			__( '%s, complete' ),
			step.label
		);
	}

	if ( step.status === 'current' ) {
		return sprintf(
			/* translators: %s: conflict resolution step label. */
			__( '%s, current step' ),
			step.label
		);
	}

	return sprintf(
		/* translators: %s: conflict resolution step label. */
		__( '%s, upcoming' ),
		step.label
	);
}

function DistributedEditingSameBlockConflictComparison( {
	comparison,
	onAction,
	onSelectLocalVersion,
	onSelectLatestWordPressVersion,
	onRequestFreshProof,
	onPrepareSave,
} ) {
	if ( ! comparison ) {
		return null;
	}

	const actionItem = {
		id: 'same-block-conflict-comparison',
		conflictResolutionChoice: comparison.resolutionChoice,
		localRebaseResultReason: comparison.reason,
		nextStepAction: comparison.nextStepAction,
	};
	const guide = getConflictComparisonGuide( comparison );
	const guideSteps = getConflictComparisonGuideSteps( guide.currentStep );
	const isLocalChoiceSelected =
		comparison.resolutionChoice ===
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL;
	const isLatestWordPressChoiceSelected =
		comparison.resolutionChoice ===
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS;
	let selectedRowId = null;

	if ( isLocalChoiceSelected ) {
		selectedRowId = 'local';
	} else if ( isLatestWordPressChoiceSelected ) {
		selectedRowId = 'server';
	}

	const isPreparedComparisonCompact = Boolean(
		comparison.saveReady && selectedRowId
	);
	const visibleRows = isPreparedComparisonCompact
		? comparison.rows.filter( ( row ) => row.id === selectedRowId )
		: comparison.rows;
	const comparisonHeaderTitle = isPreparedComparisonCompact
		? __( 'Selected version is ready to Save' )
		: __( 'Compare changes' );
	const comparisonHeaderMessage = isPreparedComparisonCompact
		? __(
				'The selected version is shown below. Use Save to update WordPress, or change to the other version before saving.'
		  )
		: __(
				'This editor and WordPress changed the same block. Choose the local version or the latest WordPress version before trying Save again.'
		  );
	const showGuide = ! isPreparedComparisonCompact;
	const visibleGuideSteps = isPreparedComparisonCompact ? [] : guideSteps;
	const comparisonActionsLayout = isPreparedComparisonCompact
		? 'prepared_recovery_inline'
		: 'standard_grouped';
	const supportActionsMode = isPreparedComparisonCompact
		? 'quiet_recovery'
		: 'standard_recovery';
	const exportActionVariant = isPreparedComparisonCompact
		? 'tertiary'
		: 'secondary';
	const conflictChoiceActions = isPreparedComparisonCompact
		? [
				isLocalChoiceSelected
					? {
							id: 'latest-wordpress',
							isSelected: false,
							label: __( 'Change to latest from WordPress' ),
							onClick: onSelectLatestWordPressVersion,
							targetRow: 'server',
							title: __(
								'Change the selected version. This does not save until WordPress checks the choice and Save confirms.'
							),
							variant: 'tertiary',
					  }
					: {
							id: 'local',
							isSelected: false,
							label: __( 'Change to local version' ),
							onClick: onSelectLocalVersion,
							targetRow: 'local',
							title: __(
								'Change the selected version. This does not save until WordPress checks the choice and Save confirms.'
							),
							variant: 'tertiary',
					  },
		  ]
		: [
				{
					id: 'local',
					isSelected: isLocalChoiceSelected,
					label: __( 'Keep your local version' ),
					onClick: onSelectLocalVersion,
					targetRow: 'local',
					title: __(
						'Select your local version. This does not save until WordPress checks the choice and Save confirms.'
					),
					variant: isLocalChoiceSelected ? 'primary' : 'secondary',
				},
				{
					id: 'latest-wordpress',
					isSelected: isLatestWordPressChoiceSelected,
					label: __( 'Use latest from WordPress' ),
					onClick: onSelectLatestWordPressVersion,
					targetRow: 'server',
					title: __(
						'Select the latest WordPress version. This does not save until WordPress checks the choice and Save confirms.'
					),
					variant: isLatestWordPressChoiceSelected
						? 'primary'
						: 'secondary',
				},
		  ];

	return (
		<div
			aria-label={ __( 'Distributed editing conflict comparison' ) }
			className="editor-distributed-editing-status__conflict-comparison"
			data-distributed-editing-conflict-comparison="same-block"
			data-distributed-editing-conflict-comparison-block-index={
				comparison.blockIndex
			}
			data-distributed-editing-conflict-comparison-calls-rest="false"
			data-distributed-editing-conflict-comparison-calls-save="false"
			data-distributed-editing-conflict-comparison-has-base={ formatDataBoolean(
				comparison.hasBaseContent
			) }
			data-distributed-editing-conflict-comparison-has-local={ formatDataBoolean(
				comparison.hasLocalContent
			) }
			data-distributed-editing-conflict-comparison-has-server={ formatDataBoolean(
				comparison.hasServerContent
			) }
			data-distributed-editing-conflict-comparison-guide-steps-visible={ formatDataBoolean(
				! isPreparedComparisonCompact
			) }
			data-distributed-editing-conflict-comparison-guide-visible={ formatDataBoolean(
				showGuide
			) }
			data-distributed-editing-conflict-comparison-header-mode={
				isPreparedComparisonCompact
					? 'selected_version_ready_to_save'
					: 'compare_versions'
			}
			data-distributed-editing-conflict-comparison-choice-control-mode={
				isPreparedComparisonCompact
					? 'change_only'
					: 'choose_between_versions'
			}
			data-distributed-editing-conflict-comparison-prepared-compact={ formatDataBoolean(
				isPreparedComparisonCompact
			) }
			data-distributed-editing-conflict-comparison-selected-row={
				selectedRowId || undefined
			}
			data-distributed-editing-conflict-comparison-mutates-editor-content="false"
			data-distributed-editing-conflict-comparison-read-only="true"
			data-distributed-editing-conflict-comparison-reason={
				comparison.reason
			}
			data-distributed-editing-conflict-comparison-visible-row-count={
				visibleRows.length
			}
			data-distributed-editing-conflict-comparison-visible-choice-count={
				conflictChoiceActions.length
			}
			data-distributed-editing-conflict-comparison-actions-layout={
				comparisonActionsLayout
			}
			data-distributed-editing-conflict-support-actions-mode={
				supportActionsMode
			}
			data-distributed-editing-conflict-resolution-choice={
				comparison.resolutionChoice || undefined
			}
			data-distributed-editing-conflict-resolution-requires-fresh-proof={ formatDataBoolean(
				comparison.resolutionRequiresFreshProof
			) }
			data-distributed-editing-conflict-resolution-status={
				comparison.resolutionStatus
			}
			data-distributed-editing-conflict-resolution-proof-action={
				comparison.canRequestFreshProof
					? DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF
					: undefined
			}
			data-distributed-editing-conflict-resolution-proof-ready={ formatDataBoolean(
				comparison.canRequestFreshProof
			) }
			data-distributed-editing-conflict-resolution-proof-status={
				comparison.retrySubmitProofStatus
			}
			data-distributed-editing-conflict-resolution-prepare-save-ready={ formatDataBoolean(
				comparison.canPrepareSave
			) }
			data-distributed-editing-conflict-resolution-save-prepared={ formatDataBoolean(
				comparison.savePrepared
			) }
			data-distributed-editing-conflict-resolution-save-ready={ formatDataBoolean(
				comparison.saveReady
			) }
			data-distributed-editing-conflict-resolution-save-status={
				comparison.retrySubmitSaveStatus
			}
			data-distributed-editing-conflict-resolution-next-step={
				comparison.nextStepAction
			}
			data-distributed-editing-conflict-resolution-guide-status={
				guide.status
			}
			role="region"
		>
			<div className="editor-distributed-editing-status__conflict-comparison-header">
				<strong>{ comparisonHeaderTitle }</strong>
				<p>{ comparisonHeaderMessage }</p>
			</div>
			{ showGuide && (
				<div
					aria-live="polite"
					className="editor-distributed-editing-status__conflict-comparison-guide"
					data-distributed-editing-conflict-resolution-guide={
						guide.status
					}
				>
					<strong>{ guide.title }</strong>
					<p>{ guide.message }</p>
					{ visibleGuideSteps.length > 0 && (
						<ol className="editor-distributed-editing-status__conflict-comparison-steps">
							{ visibleGuideSteps.map( ( step ) => (
								<li
									aria-current={
										step.isCurrent ? 'step' : undefined
									}
									aria-label={ getConflictComparisonGuideStepAriaLabel(
										step
									) }
									className="editor-distributed-editing-status__conflict-comparison-step"
									data-distributed-editing-conflict-resolution-step={
										step.id
									}
									data-distributed-editing-conflict-resolution-step-current={ formatDataBoolean(
										step.isCurrent
									) }
									data-distributed-editing-conflict-resolution-step-status={
										step.status
									}
									key={ step.id }
								>
									{ step.label }
								</li>
							) ) }
						</ol>
					) }
				</div>
			) }
			<div
				className={
					isPreparedComparisonCompact
						? 'editor-distributed-editing-status__conflict-comparison-grid editor-distributed-editing-status__conflict-comparison-grid--prepared'
						: 'editor-distributed-editing-status__conflict-comparison-grid'
				}
			>
				{ visibleRows.map( ( row ) => {
					const isSelectedRow = row.id === selectedRowId;

					return (
						<div
							className="editor-distributed-editing-status__conflict-comparison-row"
							data-distributed-editing-conflict-comparison-row={
								row.id
							}
							data-distributed-editing-conflict-comparison-row-selected={ formatDataBoolean(
								isSelectedRow
							) }
							key={ row.id }
						>
							<span className="editor-distributed-editing-status__conflict-comparison-label">
								{ row.label }
								{ isSelectedRow && (
									<span className="editor-distributed-editing-status__conflict-comparison-selected-badge">
										{ __( 'Selected' ) }
									</span>
								) }
							</span>
							<textarea
								aria-label={ row.label }
								className="editor-distributed-editing-status__conflict-comparison-text"
								readOnly
								rows={ getConflictComparisonRows( row.text ) }
								value={ row.text }
							/>
						</div>
					);
				} ) }
			</div>
			<div
				className={
					isPreparedComparisonCompact
						? 'editor-distributed-editing-status__conflict-comparison-actions editor-distributed-editing-status__conflict-comparison-actions--prepared'
						: 'editor-distributed-editing-status__conflict-comparison-actions'
				}
			>
				<div
					className={
						isPreparedComparisonCompact
							? 'editor-distributed-editing-status__conflict-comparison-action-group editor-distributed-editing-status__conflict-comparison-action-group--choices editor-distributed-editing-status__conflict-comparison-action-group--choices-prepared'
							: 'editor-distributed-editing-status__conflict-comparison-action-group editor-distributed-editing-status__conflict-comparison-action-group--choices'
					}
				>
					{ conflictChoiceActions.map( ( choiceAction ) => (
						<Button
							__next40pxDefaultSize
							aria-pressed={ choiceAction.isSelected }
							data-distributed-editing-conflict-choice-compact-change={ formatDataBoolean(
								isPreparedComparisonCompact
							) }
							data-distributed-editing-conflict-choice-selected={ formatDataBoolean(
								choiceAction.isSelected
							) }
							data-distributed-editing-conflict-choice-selection-does-not-save="true"
							data-distributed-editing-conflict-choice-target={
								choiceAction.targetRow
							}
							key={ choiceAction.id }
							title={ choiceAction.title }
							variant={ choiceAction.variant }
							onClick={ choiceAction.onClick }
						>
							{ choiceAction.label }
						</Button>
					) ) }
				</div>
				<div
					className={
						isPreparedComparisonCompact
							? 'editor-distributed-editing-status__conflict-comparison-action-group editor-distributed-editing-status__conflict-comparison-action-group--supporting editor-distributed-editing-status__conflict-comparison-action-group--supporting-quiet'
							: 'editor-distributed-editing-status__conflict-comparison-action-group editor-distributed-editing-status__conflict-comparison-action-group--supporting'
					}
				>
					{ comparison.canRequestFreshProof && (
						<Button
							__next40pxDefaultSize
							data-distributed-editing-conflict-action="check_choice"
							data-distributed-editing-conflict-action-does-not-save="true"
							title={ __(
								'Ask WordPress to check this choice. This does not save the post.'
							) }
							variant="secondary"
							onClick={ () =>
								onRequestFreshProof?.( actionItem )
							}
						>
							{ __( 'Check this choice' ) }
						</Button>
					) }
					{ comparison.canPrepareSave && (
						<Button
							__next40pxDefaultSize
							data-distributed-editing-conflict-action="prepare_save"
							data-distributed-editing-conflict-action-does-not-save="true"
							title={ __(
								'Prepare this checked choice for the editor Save button. This does not save the post.'
							) }
							variant="primary"
							onClick={ () => onPrepareSave?.( actionItem ) }
						>
							{ __( 'Prepare Save' ) }
						</Button>
					) }
					<Button
						__next40pxDefaultSize
						data-distributed-editing-conflict-support-action="export_for_review"
						data-distributed-editing-conflict-support-action-emphasis={
							supportActionsMode
						}
						variant={ exportActionVariant }
						onClick={ () =>
							onAction?.(
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
								actionItem
							)
						}
					>
						{ __( 'Export for review' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						data-distributed-editing-conflict-support-action="get_latest_post"
						data-distributed-editing-conflict-support-action-emphasis={
							supportActionsMode
						}
						variant="tertiary"
						onClick={ () =>
							onAction?.(
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
								actionItem
							)
						}
					>
						{ __( 'Get latest post' ) }
					</Button>
				</div>
			</div>
		</div>
	);
}

function DistributedEditingStructuralConflictSummary( {
	onAction,
	onApplyStructuralChoice,
	onUndoStructuralChoice,
	structuralChoiceState,
	summary,
} ) {
	const [ previewSnapshotId, setPreviewSnapshotId ] = useState( null );
	const [ appliedSnapshotId, setAppliedSnapshotId ] = useState( null );

	if ( ! summary ) {
		return null;
	}

	const actionItem = {
		id: 'structural-conflict-summary',
		localRebaseResultReason: summary.reason,
		nextStepAction: 'manual_structural_review',
	};
	const previewSnapshot =
		summary.snapshots.find(
			( snapshot ) => snapshot.id === previewSnapshotId
		) ?? null;
	const previewStatus = previewSnapshot
		? `previewing_${ previewSnapshot.id }`
		: 'inactive';
	const sessionChoiceSnapshotId =
		summary.resolutionChoice ===
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS
			? 'server'
			: summary.resolutionChoice ===
			  DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL
			? 'local'
			: null;
	const selectedChoiceSnapshotId =
		appliedSnapshotId ?? sessionChoiceSnapshotId;
	const structuralChoiceStatus = selectedChoiceSnapshotId
		? `selected_${ selectedChoiceSnapshotId }`
		: 'none';
	const structuralChoiceUndoAvailable = Boolean(
		structuralChoiceState?.undoAvailable
	);
	const applyStructuralChoice = ( choice, snapshotId ) => {
		const result = onApplyStructuralChoice?.( choice );

		if ( result ) {
			setAppliedSnapshotId( snapshotId );
			setPreviewSnapshotId( snapshotId );
		}
	};
	const undoStructuralChoice = () => {
		const result = onUndoStructuralChoice?.();

		if ( result ) {
			setAppliedSnapshotId( 'local' );
			setPreviewSnapshotId( 'local' );
		}
	};

	return (
		<div
			aria-label={ __( 'Distributed editing structural conflict summary' ) }
			className="editor-distributed-editing-status__conflict-comparison editor-distributed-editing-status__structural-conflict"
			data-distributed-editing-structural-conflict={ summary.reason }
			data-distributed-editing-structural-conflict-base-block-count={
				summary.baseBlockCount
			}
			data-distributed-editing-structural-conflict-calls-rest="false"
			data-distributed-editing-structural-conflict-calls-save="false"
			data-distributed-editing-structural-conflict-local-block-count={
				summary.localBlockCount
			}
			data-distributed-editing-structural-conflict-local-count-delta={
				summary.localCountDelta
			}
			data-distributed-editing-structural-conflict-mutates-editor-content="false"
			data-distributed-editing-structural-conflict-read-only="true"
			data-distributed-editing-structural-conflict-reason={
				summary.reason
			}
			data-distributed-editing-structural-conflict-server-block-count={
				summary.serverBlockCount
			}
			data-distributed-editing-structural-conflict-server-count-delta={
				summary.serverCountDelta
			}
			data-distributed-editing-structural-choice-calls-rest="false"
			data-distributed-editing-structural-choice-calls-save="false"
			data-distributed-editing-structural-choice-changes-post-lock="false"
			data-distributed-editing-structural-choice-claims-saved="false"
			data-distributed-editing-structural-choice-creates-revision="false"
			data-distributed-editing-structural-choice-mutates-editor-content={ formatDataBoolean(
				selectedChoiceSnapshotId === 'server'
			) }
			data-distributed-editing-structural-choice-mutates-persisted-content="false"
			data-distributed-editing-structural-choice-requires-fresh-proof={ formatDataBoolean(
				Boolean( selectedChoiceSnapshotId )
			) }
			data-distributed-editing-structural-choice-selected={
				selectedChoiceSnapshotId ?? 'none'
			}
			data-distributed-editing-structural-choice-status={
				structuralChoiceStatus
			}
			data-distributed-editing-structural-choice-undo-available={ formatDataBoolean(
				structuralChoiceUndoAvailable
			) }
			data-distributed-editing-structural-preview-calls-rest="false"
			data-distributed-editing-structural-preview-calls-save="false"
			data-distributed-editing-structural-preview-changes-post-lock="false"
			data-distributed-editing-structural-preview-content-safe="true"
			data-distributed-editing-structural-preview-creates-revision="false"
			data-distributed-editing-structural-preview-mutates-editor-content="false"
			data-distributed-editing-structural-preview-mutates-persisted-content="false"
			data-distributed-editing-structural-preview-selected={
				previewSnapshot?.id ?? 'none'
			}
			data-distributed-editing-structural-preview-status={
				previewStatus
			}
			role="region"
		>
			<div className="editor-distributed-editing-status__conflict-comparison-header">
				<strong>{ __( 'Compare block structure' ) }</strong>
				<p>{ getStructuralConflictMessage( summary ) }</p>
			</div>
			<div className="editor-distributed-editing-status__structural-conflict-grid">
				{ summary.snapshots.map( ( snapshot ) => (
					<div
						className="editor-distributed-editing-status__structural-conflict-column"
						data-distributed-editing-structural-conflict-row={
							snapshot.id
						}
						data-distributed-editing-structural-conflict-row-block-count={
							snapshot.blockCount
						}
						key={ snapshot.id }
					>
						<div className="editor-distributed-editing-status__structural-conflict-column-header">
							<strong>{ snapshot.label }</strong>
							<span>
								{ getStructuralConflictBlockCountLabel(
									snapshot.blockCount
								) }
							</span>
						</div>
						<ul className="editor-distributed-editing-status__structural-conflict-samples">
							{ snapshot.sampleTexts.map( ( text, index ) => (
								<li
									data-distributed-editing-structural-conflict-sample={
										snapshot.id
									}
									key={ `${ snapshot.id }-${ index }` }
								>
									{ text }
								</li>
							) ) }
							{ snapshot.overflowCount > 0 && (
								<li className="editor-distributed-editing-status__structural-conflict-overflow">
									{ sprintf(
										/* translators: %d: number of additional blocks not shown in the compact structural summary. */
										_n(
											'%d more block not shown',
											'%d more blocks not shown',
											snapshot.overflowCount
										),
										snapshot.overflowCount
									) }
								</li>
							) }
						</ul>
					</div>
				) ) }
			</div>
			<dl className="editor-distributed-editing-status__structural-conflict-counts">
				<div>
					<dt>{ __( 'Latest WordPress count change' ) }</dt>
					<dd>
						{ getStructuralConflictCountDeltaLabel(
							summary.serverCountDelta
						) }
					</dd>
				</div>
				<div>
					<dt>{ __( 'Local editor count change' ) }</dt>
					<dd>
						{ getStructuralConflictCountDeltaLabel(
							summary.localCountDelta
						) }
					</dd>
				</div>
				<div>
					<dt>{ __( 'Reason' ) }</dt>
					<dd>{ summary.reasonLabel }</dd>
				</div>
			</dl>
			<div className="editor-distributed-editing-status__structural-conflict-preview-actions">
				<Button
					__next40pxDefaultSize
					data-distributed-editing-structural-preview-action="preview_latest_wordpress"
					variant={
						previewSnapshotId === 'server'
							? 'primary'
							: 'secondary'
					}
					onClick={ () => setPreviewSnapshotId( 'server' ) }
				>
					{ __( 'Preview latest structure' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					data-distributed-editing-structural-preview-action="preview_local_editor"
					variant={
						previewSnapshotId === 'local'
							? 'primary'
							: 'secondary'
					}
					onClick={ () => setPreviewSnapshotId( 'local' ) }
				>
					{ __( 'Preview local structure' ) }
				</Button>
				{ previewSnapshot && (
					<Button
						__next40pxDefaultSize
						data-distributed-editing-structural-preview-action="close_preview"
						variant="tertiary"
						onClick={ () => setPreviewSnapshotId( null ) }
					>
						{ __( 'Close preview' ) }
					</Button>
				) }
			</div>
			{ previewSnapshot && (
				<div
					aria-label={ __(
						'Distributed editing structural preview'
					) }
					className="editor-distributed-editing-status__structural-conflict-preview"
					data-distributed-editing-structural-preview-panel={
						previewSnapshot.id
					}
					data-distributed-editing-structural-preview-panel-block-count={
						previewSnapshot.blockCount
					}
					role="region"
				>
					<div className="editor-distributed-editing-status__structural-conflict-preview-header">
						<strong>
							{ sprintf(
								/* translators: %s: structural version label, such as Latest from WordPress or Your local editor. */
								__( 'Previewing %s' ),
								previewSnapshot.label
							) }
						</strong>
						<span>
							{ __(
								'Preview only: no editor content changes, no Save, no request.'
							) }
						</span>
					</div>
					<ol className="editor-distributed-editing-status__structural-conflict-preview-list">
						{ previewSnapshot.previewTexts.map( ( text, index ) => (
							<li
								data-distributed-editing-structural-preview-row={
									previewSnapshot.id
								}
								key={ `${ previewSnapshot.id }-preview-${ index }` }
							>
								{ text }
							</li>
						) ) }
						{ previewSnapshot.previewOverflowCount > 0 && (
							<li className="editor-distributed-editing-status__structural-conflict-overflow">
								{ sprintf(
									/* translators: %d: number of additional blocks not shown in the structural preview. */
									_n(
										'%d more block not shown',
										'%d more blocks not shown',
										previewSnapshot.previewOverflowCount
									),
									previewSnapshot.previewOverflowCount
								) }
							</li>
						) }
					</ol>
				</div>
			) }
			<div className="editor-distributed-editing-status__structural-conflict-choice-actions">
				<Button
					__next40pxDefaultSize
					aria-pressed={ selectedChoiceSnapshotId === 'server' }
					data-distributed-editing-structural-choice-action="use_latest_wordpress"
					data-distributed-editing-structural-choice-action-does-not-save="true"
					title={ __(
						'Use the latest WordPress block structure in this editor. This does not save until WordPress checks the choice and Save confirms.'
					) }
					variant={
						selectedChoiceSnapshotId === 'server'
							? 'primary'
							: 'secondary'
					}
					onClick={ () =>
						applyStructuralChoice(
							DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
							'server'
						)
					}
				>
					{ __( 'Use latest structure in editor' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					aria-pressed={ selectedChoiceSnapshotId === 'local' }
					data-distributed-editing-structural-choice-action="keep_local_editor"
					data-distributed-editing-structural-choice-action-does-not-save="true"
					title={ __(
						'Keep the local block structure in this editor. This does not save until WordPress checks the choice and Save confirms.'
					) }
					variant={
						selectedChoiceSnapshotId === 'local'
							? 'primary'
							: 'secondary'
					}
					onClick={ () =>
						applyStructuralChoice(
							DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
							'local'
						)
					}
				>
					{ __( 'Keep local structure' ) }
				</Button>
				{ structuralChoiceUndoAvailable && (
					<Button
						__next40pxDefaultSize
						data-distributed-editing-structural-choice-action="undo_structural_choice"
						data-distributed-editing-structural-choice-action-does-not-save="true"
						title={ __(
							'Restore the local block structure from before this choice. This does not save the post.'
						) }
						variant="tertiary"
						onClick={ undoStructuralChoice }
					>
						{ __( 'Undo structure choice' ) }
					</Button>
				) }
			</div>
			{ selectedChoiceSnapshotId && (
				<div
					className="editor-distributed-editing-status__structural-conflict-choice-status"
					data-distributed-editing-structural-choice-status-message={
						structuralChoiceStatus
					}
					role="status"
				>
					{ selectedChoiceSnapshotId === 'server'
						? __(
								'Latest WordPress structure is now in this editor. Save is still paused until WordPress checks this choice.'
						  )
						: __(
								'Local structure is selected in this editor. Save is still paused until WordPress checks this choice.'
						  ) }
					{ structuralChoiceUndoAvailable && (
						<span>
							{ __(
								' Undo restores the local structure from before this choice.'
							) }
						</span>
					) }
				</div>
			) }
			<div className="editor-distributed-editing-status__conflict-comparison-actions editor-distributed-editing-status__conflict-comparison-actions--prepared">
				<Button
					__next40pxDefaultSize
					data-distributed-editing-structural-conflict-support-action="export_for_review"
					variant="secondary"
					onClick={ () =>
						onAction?.(
							DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
							actionItem
						)
					}
				>
					{ __( 'Export for review' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					data-distributed-editing-structural-conflict-support-action="get_latest_post"
					variant="tertiary"
					onClick={ () =>
						onAction?.(
							DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
							actionItem
						)
					}
				>
					{ __( 'Get latest post' ) }
				</Button>
			</div>
		</div>
	);
}

/**
 * Renders the selector-backed DE-RTC status surface.
 *
 * @param {Object}   props           Component props.
 * @param {Function} props.onAction  Optional action handler.
 * @param {string}   props.placement Status surface placement.
 *
 * @return {React.ReactNode} Rendered status surface.
 */
export default function DistributedEditingStatus( {
	onAction,
	placement = 'selector-backed-status',
} ) {
	const [ actionStatus, setActionStatus ] = useState( null );
	const [ structuralChoiceUndoContent, setStructuralChoiceUndoContent ] =
		useState( null );
	const {
		currentPost,
		editedPostContent,
		sessionState,
		noticeDescriptors,
		unloadWarningState,
	} = useSelect( ( select ) => {
		const {
			getCurrentPost,
			getDistributedEditingSessionState,
			getDistributedEditingNoticeDescriptors,
			getDistributedEditingUnloadWarningState,
			getEditedPostContent,
		} = select( editorStore );

		return {
			currentPost: getCurrentPost?.() || {},
			editedPostContent: getEditedPostContent?.() || '',
			sessionState: getDistributedEditingSessionState(),
			noticeDescriptors: getDistributedEditingNoticeDescriptors(),
			unloadWarningState: getDistributedEditingUnloadWarningState(),
		};
	}, [] );
	const {
		__experimentalPlanDistributedEditingLocalRebaseAfterStaleBase,
		__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase,
		__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof,
		__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates,
		__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase,
		__experimentalRefreshDistributedEditingRetrySubmitProof,
		__experimentalRefreshDistributedEditingServerStateAfterStaleBase,
		editPost,
		resetEditorBlocks,
		setDistributedEditingSessionState,
	} = useDispatch( editorStore ) || {};
	const handleAction = useCallback(
		async ( actionKey, item ) => {
			try {
				onAction?.( actionKey, item );

				switch ( actionKey ) {
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES: {
						const copiedPayload =
							await copyDistributedEditingLocalUpdatesToClipboard(
								{
									currentPost,
									editedPostContent,
									sessionState,
								}
							);

						if ( copiedPayload ) {
							setActionStatus( {
								status: 'success',
								message: getExportSuccessMessage( item ),
							} );
						} else {
							setActionStatus( {
								status: 'warning',
								message: __(
									'Clipboard unavailable. Protected local changes remain in this editor session; keep this tab open and try exporting again after clipboard access is available.'
								),
							} );
						}

						return copiedPayload;
					}
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT: {
						const prepareResult =
							await __experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase?.();
						setActionStatus( {
							status: 'info',
							message: __(
								'Changes are ready for WordPress to check. Nothing has been saved yet.'
							),
						} );
						return prepareResult;
					}
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE: {
						const prepareSaveResult =
							await __experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof?.();
						setActionStatus( {
							status: 'info',
							message: __(
								'Save prepared. Use Save to send these changes to WordPress.'
							),
						} );
						return prepareSaveResult;
					}
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF: {
						const proofResult =
							await __experimentalRefreshDistributedEditingRetrySubmitProof?.();
						setActionStatus( {
							status: 'info',
							message:
								item?.id === 'same-block-conflict-comparison'
									? __(
											'WordPress checked this choice. Prepare Save before updating the post.'
									  )
									: __(
											'WordPress checked these changes. Prepare Save before updating the post.'
									  ),
						} );
						return proofResult;
					}
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE: {
						const refetchResult =
							await __experimentalRefreshDistributedEditingServerStateAfterStaleBase?.();
						setActionStatus( {
							status: 'info',
							message: getRefetchSuccessMessage( item ),
						} );
						return refetchResult;
					}
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES: {
						if ( item?.hasLocalRebaseInputs ) {
							const rebaseResult =
								await __experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase?.();
							setActionStatus( {
								status: 'info',
								message: __(
									'Local changes applied to the latest post.'
								),
							} );
							return rebaseResult;
						}

						const planResult =
							await __experimentalPlanDistributedEditingLocalRebaseAfterStaleBase?.();
						setActionStatus( {
							status: 'info',
							message: __(
								'Checked whether local changes can be applied.'
							),
						} );
						return planResult;
					}
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW: {
						setActionStatus( {
							status: 'info',
							message: __(
								'Requesting a fresh admin review without saving or changing editor content.'
							),
						} );
						const requestResult =
							await __experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates?.();
						setActionStatus( {
							status: requestResult?.accepted
								? 'success'
								: 'warning',
							message:
								getFreshReviewRequestActionMessage(
									requestResult
								),
						} );
						return requestResult;
					}
				}
			} catch {
				setActionStatus( {
					status: 'error',
					message: getActionErrorMessage( actionKey ),
				} );
				return null;
			}

			return undefined;
		},
		[
			__experimentalPlanDistributedEditingLocalRebaseAfterStaleBase,
			__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase,
			__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof,
			__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates,
			__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase,
			__experimentalRefreshDistributedEditingRetrySubmitProof,
			__experimentalRefreshDistributedEditingServerStateAfterStaleBase,
			currentPost,
			editedPostContent,
			onAction,
			sessionState,
		]
	);
	const handleSelectConflictVersion = useCallback(
		( choice ) => {
			const normalized =
				normalizeDistributedEditingSessionState( sessionState );
			const isLatestChoice =
				choice ===
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS;
			const isLocalChoice =
				choice ===
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL;

			if (
				! DISTRIBUTED_EDITING_SAME_BLOCK_CONFLICT_REASONS.has(
					normalized.localRebaseResultReason
				) ||
				normalized.localRebaseResultStatus !==
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED ||
				( isLatestChoice &&
					typeof normalized.refetchedServerContent !== 'string' ) ||
				( ! isLatestChoice && ! isLocalChoice )
			) {
				setActionStatus( {
					status: 'warning',
					message: __(
						'This conflict choice is not available. Protected local changes remain exportable.'
					),
				} );
				return null;
			}

			if ( isLatestChoice ) {
				editPost?.(
					{ content: normalized.refetchedServerContent },
					{ undoIgnore: true }
				);
			}

			const resolutionStatus = isLatestChoice
				? DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED
				: DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED;
			const nextSessionState = normalizeDistributedEditingSessionState( {
				...normalized,
				canExportLocalUpdates: true,
				requiresManualConflictResolution: true,
				staleBaseConflictResolutionStatus: resolutionStatus,
				staleBaseConflictResolutionChoice: choice,
				staleBaseConflictResolutionRequiresFreshProof: true,
				staleBaseConflictResolutionCallsRest: false,
				staleBaseConflictResolutionCallsSave: false,
				staleBaseConflictResolutionMutatesEditorContent: isLatestChoice,
				staleBaseConflictResolutionMutatesPersistedPostContent: false,
				staleBaseConflictResolutionCreatesRevision: false,
				staleBaseConflictResolutionChangesPostLock: false,
				staleBaseConflictResolutionClaimsSaved: false,
				readyToRetrySubmit: false,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
				retrySubmitPrepared: false,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
				retrySubmitAccepted: false,
				retrySubmitSavePathRequired: false,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
				retrySubmitSavePrepared: false,
				retrySubmitSaveReady: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				retrySaveAccepted: false,
				retrySaveClaimsSaved: false,
			} );

			setDistributedEditingSessionState?.( nextSessionState );
			setActionStatus( {
				status: 'info',
				message: isLatestChoice
					? __(
							'Using the latest WordPress text in this editor. Save is still paused until WordPress checks this choice again.'
					  )
					: __(
							'Keeping your local text in this editor. Save is still paused until WordPress checks this choice again.'
					  ),
			} );

			return nextSessionState;
		},
		[ editPost, sessionState, setDistributedEditingSessionState ]
	);
	const handleSelectLocalVersion = useCallback(
		() =>
			handleSelectConflictVersion(
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL
			),
		[ handleSelectConflictVersion ]
	);
	const handleSelectLatestWordPressVersion = useCallback(
		() =>
			handleSelectConflictVersion(
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS
			),
		[ handleSelectConflictVersion ]
	);
	const setStructuralChoiceSessionState = useCallback(
		( { choice, mutatesEditorContent, normalized } ) => {
			const isLatestChoice =
				choice ===
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS;
			const resolutionStatus = isLatestChoice
				? DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED
				: DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED;
			const nextSessionState = normalizeDistributedEditingSessionState( {
				...normalized,
				canExportLocalUpdates: true,
				requiresManualConflictResolution: true,
				staleBaseConflictResolutionStatus: resolutionStatus,
				staleBaseConflictResolutionChoice: choice,
				staleBaseConflictResolutionRequiresFreshProof: true,
				staleBaseConflictResolutionCallsRest: false,
				staleBaseConflictResolutionCallsSave: false,
				staleBaseConflictResolutionMutatesEditorContent:
					mutatesEditorContent,
				staleBaseConflictResolutionMutatesPersistedPostContent: false,
				staleBaseConflictResolutionCreatesRevision: false,
				staleBaseConflictResolutionChangesPostLock: false,
				staleBaseConflictResolutionClaimsSaved: false,
				readyToRetrySubmit: false,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
				retrySubmitPrepared: false,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
				retrySubmitAccepted: false,
				retrySubmitSavePathRequired: false,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
				retrySubmitSavePrepared: false,
				retrySubmitSaveReady: false,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				retrySaveAccepted: false,
				retrySaveClaimsSaved: false,
			} );

			setDistributedEditingSessionState?.( nextSessionState );

			return nextSessionState;
		},
		[ setDistributedEditingSessionState ]
	);
	const handleSelectStructuralChoice = useCallback(
		( choice ) => {
			const normalized =
				normalizeDistributedEditingSessionState( sessionState );
			const isLatestChoice =
				choice ===
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS;
			const isLocalChoice =
				choice ===
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL;

			if (
				! DISTRIBUTED_EDITING_STRUCTURAL_CONFLICT_REASONS.has(
					normalized.localRebaseResultReason
				) ||
				normalized.localRebaseResultStatus !==
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED ||
				( isLatestChoice &&
					typeof normalized.refetchedServerContent !== 'string' ) ||
				( ! isLatestChoice && ! isLocalChoice )
			) {
				setActionStatus( {
					status: 'warning',
					message: __(
						'This structural choice is not available. Protected local changes remain exportable.'
					),
				} );
				return null;
			}

			let mutatesEditorContent = false;
			const applyContentToEditor = ( content ) => {
				const parsedBlocks = parse( content );

				if ( parsedBlocks.length || ! content ) {
					resetEditorBlocks?.( parsedBlocks, {
						__unstableShouldCreateUndoLevel: false,
					} );
				}

				editPost?.( { content }, { undoIgnore: true } );
			};

			if ( isLatestChoice ) {
				if ( editedPostContent !== normalized.refetchedServerContent ) {
					setStructuralChoiceUndoContent( editedPostContent );
					applyContentToEditor( normalized.refetchedServerContent );
					mutatesEditorContent = true;
				}
			} else if ( typeof structuralChoiceUndoContent === 'string' ) {
				applyContentToEditor( structuralChoiceUndoContent );
				setStructuralChoiceUndoContent( null );
				mutatesEditorContent = true;
			}

			const nextSessionState = setStructuralChoiceSessionState( {
				choice,
				mutatesEditorContent,
				normalized,
			} );

			setActionStatus( {
				status: 'info',
				message: isLatestChoice
					? __(
							'Latest WordPress structure is now in this editor. Save is still paused until WordPress checks this choice.'
					  )
					: __(
							'Local structure is selected in this editor. Save is still paused until WordPress checks this choice.'
					  ),
			} );

			return nextSessionState;
		},
		[
			editPost,
			editedPostContent,
			resetEditorBlocks,
			sessionState,
			setStructuralChoiceSessionState,
			structuralChoiceUndoContent,
		]
	);
	const handleUndoStructuralChoice = useCallback( () => {
		if ( typeof structuralChoiceUndoContent !== 'string' ) {
			setActionStatus( {
				status: 'warning',
				message: __(
					'No structural choice can be undone. Protected local changes remain exportable.'
				),
			} );
			return null;
		}

		const normalized = normalizeDistributedEditingSessionState(
			sessionState
		);

		const parsedBlocks = parse( structuralChoiceUndoContent );

		if ( parsedBlocks.length || ! structuralChoiceUndoContent ) {
			resetEditorBlocks?.( parsedBlocks, {
				__unstableShouldCreateUndoLevel: false,
			} );
		}

		editPost?.( { content: structuralChoiceUndoContent }, { undoIgnore: true } );
		setStructuralChoiceUndoContent( null );

		const nextSessionState = setStructuralChoiceSessionState( {
			choice:
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
			mutatesEditorContent: true,
			normalized,
		} );

		setActionStatus( {
			status: 'info',
			message: __(
				'Restored the local structure in this editor. Save is still paused until WordPress checks this choice.'
			),
		} );

		return nextSessionState;
	}, [
		editPost,
		resetEditorBlocks,
		sessionState,
		setStructuralChoiceSessionState,
		structuralChoiceUndoContent,
	] );

	if (
		! shouldRenderDistributedEditingStatus(
			sessionState,
			unloadWarningState
		)
	) {
		return null;
	}

	const conflictComparison = getDistributedEditingSameBlockConflictComparison(
		sessionState,
		editedPostContent
	);
	const structuralConflictSummary =
		getDistributedEditingStructuralConflictSummary(
			sessionState,
			editedPostContent
		);

	return (
		<>
			<DistributedEditingStatusSurface
				actionStatus={ actionStatus }
				noticeDescriptors={ noticeDescriptors }
				onAction={ handleAction }
				placement={ placement }
				unloadWarningState={ unloadWarningState }
			/>
			<DistributedEditingSameBlockConflictComparison
				comparison={ conflictComparison }
				onAction={ handleAction }
				onRequestFreshProof={ ( item ) =>
					handleAction(
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF,
						item
					)
				}
				onPrepareSave={ ( item ) =>
					handleAction(
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE,
						item
					)
				}
				onSelectLatestWordPressVersion={
					handleSelectLatestWordPressVersion
				}
				onSelectLocalVersion={ handleSelectLocalVersion }
			/>
			<DistributedEditingStructuralConflictSummary
				onAction={ handleAction }
				onApplyStructuralChoice={ handleSelectStructuralChoice }
				onUndoStructuralChoice={ handleUndoStructuralChoice }
				structuralChoiceState={ {
					undoAvailable:
						typeof structuralChoiceUndoContent === 'string',
				} }
				summary={ structuralConflictSummary }
			/>
		</>
	);
}

function getActionErrorMessage( actionKey ) {
	switch ( actionKey ) {
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES:
			return __(
				'Protected local changes could not be copied. They remain in this editor session and can still be exported after clipboard access is available.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT:
			return __(
				'Local changes could not be staged. They remain protected.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE:
			return __(
				'Save could not be prepared. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF:
			return __(
				'Save safety could not be checked. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE:
			return __(
				'Latest post could not be loaded. Protected local changes remain in this editor session and can still be exported; keep this tab open before trying again.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES:
			return __(
				'Local changes could not be applied to the latest post. They remain protected in this editor session.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW:
			return __(
				'Fresh-review request could not be accepted. No save or editor content change was made, and local changes remain protected.'
			);
	}

	return __(
		'Distributed editing action failed. Local changes remain protected.'
	);
}

function getFreshReviewRequestActionMessage( requestResult ) {
	if ( requestResult?.accepted ) {
		return __(
			'Fresh review request accepted for admin review. No save was made, and protected local changes remain exportable.'
		);
	}

	return __(
		'Fresh review request finished without a review handoff. No save was made, and protected local changes remain exportable.'
	);
}

function getFreshReviewDecisionCommandMessage( commandStatus ) {
	if ( commandStatus === 'running' ) {
		return __(
			'Recording the fresh-review decision locally without saving or submitting proof.'
		);
	}

	if ( commandStatus === 'resolved' ) {
		return __(
			'Fresh-review decision recorded locally. No save was made, and the reviewed-block evidence remains hash-only.'
		);
	}

	if ( commandStatus === 'submitting' ) {
		return __(
			'Submitting the fresh-review decision without saving or changing editor content.'
		);
	}

	if ( commandStatus === 'submitted' ) {
		return __(
			'Fresh-review decision recorded for the request. No save was made, and the reviewed-block evidence remained hash-only.'
		);
	}

	if ( commandStatus === 'submit-failed' ) {
		return __(
			'Fresh-review decision could not be recorded. No save was made, and protected local changes remain exportable.'
		);
	}

	if ( commandStatus === 'jump-target-available' ) {
		return __(
			'Jump target checked. The editor found a block target for this review item; no block was selected, no focus moved, and no save was made.'
		);
	}

	if ( commandStatus === 'jump-target-unavailable' ) {
		return __(
			'Jump target checked. This review item does not have a block target yet; no block was selected, no focus moved, and no save was made.'
		);
	}

	if ( commandStatus === 'compare-evidence-available' ) {
		return __(
			'Compare evidence checked. The editor found hash evidence for this review item; no comparison was opened, no content changed, and no save was made.'
		);
	}

	if ( commandStatus === 'compare-evidence-unavailable' ) {
		return __(
			'Compare evidence checked. This review item does not have hash evidence yet; no comparison was opened, no content changed, and no save was made.'
		);
	}

	if ( commandStatus === 'comparison-surface-open' ) {
		return __(
			'Read-only comparison opened. The editor shows safe base and proposed block text below; no content changed, no save was made, and no server request was sent.'
		);
	}

	if ( commandStatus === 'comparison-surface-closed' ) {
		return __(
			'Read-only comparison closed. The fresh-review decision remains local and no save was made.'
		);
	}

	return __(
		'Fresh-review decisions can be recorded after every hash-only item is approved or rejected.'
	);
}

function getFreshReviewComparePlanTitle( comparePlan ) {
	return comparePlan?.status === 'ready'
		? __( 'Compare plan ready' )
		: __( 'Compare plan unavailable' );
}

function getFreshReviewComparePlanMessage( comparePlan ) {
	if ( comparePlan?.comparisonSurface?.canOpenComparisonSurface ) {
		return __(
			'A read-only comparison is available for this safe block item. It shows base and proposed text locally without saving, calling the server, or changing editor content.'
		);
	}

	if ( comparePlan?.status === 'ready' ) {
		return __(
			'A future comparison can use base and proposed hash evidence for this review item. No comparison is open, no content is shown, and no save was made.'
		);
	}

	return __(
		'This review item is missing hash evidence for a future comparison. No comparison is open, no content is shown, and no save was made.'
	);
}

function getFreshReviewComparisonReadinessMessage( comparisonHandoff ) {
	if ( comparisonHandoff?.canSelectForFutureComparison ) {
		return __(
			'This review item is ready for a future side-by-side comparison surface. No block is selected, no focus moves, no panel opens, and no save was made.'
		);
	}

	return __(
		'This review item is not ready for a future side-by-side comparison surface. No block is selected, no focus moves, no panel opens, and no save was made.'
	);
}

function getFreshReviewComparisonPreviewShellMessage( previewShell ) {
	if ( previewShell?.status === 'disabled_until_renderer_turn' ) {
		return __(
			'A future preview shell would need base and proposed block content, a boundary-safe diff renderer, and review controls. The shell is disabled; no preview is rendered, no diff is computed, no panel opens, and no save was made.'
		);
	}

	return __(
		'The comparison preview shell is not available. No preview is rendered, no diff is computed, no panel opens, and no save was made.'
	);
}

function getFreshReviewComparisonPreviewShellSupportReportMessage(
	supportReport
) {
	if ( supportReport?.available && supportReport.canShareWithSupport ) {
		return __(
			'Support report available: renderer registration and review controls are not present yet. It records item identity, boundary policy, and requirement keys only; no raw content, hashes, proof details, or user identity are included.'
		);
	}

	return __(
		'No shareable support report is available for the comparison preview shell.'
	);
}

function getFreshReviewComparisonRendererReadinessMessage( rendererReadiness ) {
	if (
		rendererReadiness?.status ===
		'disabled_until_renderer_capabilities_registered'
	) {
		return __(
			'Renderer readiness: boundary-safe diff rendering and review controls must be registered before this preview shell can render. No renderer is registered, no preview opens, no diff is computed, and no save was made.'
		);
	}

	return __(
		'Renderer readiness is unavailable. No renderer is registered, no preview opens, no diff is computed, and no save was made.'
	);
}

function getFreshReviewComparisonRendererCapabilityResolutionMessage(
	capabilityResolution
) {
	if ( capabilityResolution?.status === 'complete_but_disabled' ) {
		return __(
			'Capability resolver: all required renderer capabilities are present in the candidate map, but the renderer remains disabled until a future renderer turn. No renderer is registered, no preview opens, no diff is computed, and no save was made.'
		);
	}

	if ( capabilityResolution?.status === 'partial_required_capabilities' ) {
		return __(
			'Capability resolver: only part of the required renderer capabilities is present in the candidate map. This only classifies readiness; no renderer is registered, no preview opens, no diff is computed, and no save was made.'
		);
	}

	return __(
		'Capability resolver: no required renderer capabilities are present in the candidate map. This only classifies readiness; no renderer is registered, no preview opens, no diff is computed, and no save was made.'
	);
}

function getFreshReviewComparisonRendererCapabilityResolutionLabel(
	capabilityResolution
) {
	switch ( capabilityResolution?.status ) {
		case 'complete_but_disabled':
			return __( 'Complete but disabled' );
		case 'partial_required_capabilities':
			return __( 'Partial' );
		case 'missing_required_capabilities':
			return __( 'Missing' );
		default:
			return __( 'Unavailable' );
	}
}

function getFreshReviewComparisonRendererCapabilitySupportSummaryMessage(
	supportSummary
) {
	if ( supportSummary?.available && supportSummary.canShareWithSupport ) {
		return __(
			'Capability support summary: renderer capability classifications are aggregated for support without candidate maps, unknown key names, raw content, hashes, proof details, tokens, identities, or renderer code. No renderer is registered, no preview opens, no diff is computed, and no save was made.'
		);
	}

	return __(
		'No renderer capability support summary is available. No renderer is registered, no preview opens, no diff is computed, and no save was made.'
	);
}

function getFreshReviewComparePlanEvidenceLabel( available ) {
	return available ? __( 'Available' ) : __( 'Unavailable' );
}

async function copyDistributedEditingLocalUpdatesToClipboard( {
	currentPost,
	editedPostContent,
	sessionState,
} ) {
	const clipboard = globalThis?.navigator?.clipboard;

	if ( typeof clipboard?.writeText !== 'function' ) {
		return null;
	}

	const payload = getDistributedEditingLocalUpdatesExportPayload( {
		currentPost,
		editedPostContent,
		sessionState,
	} );
	const text = JSON.stringify( payload );

	await clipboard.writeText( text );

	return payload;
}

function getDistributedEditingEnabledShellState( sessionState ) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const savePolicyState =
		getDistributedEditingSavePolicyStateForSessionState( normalized );
	const humanLoopStepState =
		getDistributedEditingHumanLoopStepStateForSessionState( normalized );
	const humanLoopStepCopy =
		getDistributedEditingHumanLoopStepCopy( humanLoopStepState );
	const saveJourneyCopy =
		getDistributedEditingHumanLoopSaveJourneyCopy( humanLoopStepState );
	const isConnectionDegraded = Boolean(
		normalized.isConnectionDegraded ||
			normalized.disposition ===
				DISTRIBUTED_EDITING_DISPOSITIONS.ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK
	);
	const hasProtectedLocalChanges = Boolean(
		normalized.hasPendingChanges ||
			normalized.mustOfferLocalCopy ||
			normalized.canExportLocalUpdates ||
			normalized.isAwaitingServerConfirmation ||
			normalized.pendingChangeCount > 0
	);
	if ( isConnectionDegraded ) {
		return {
			serverContact: 'degraded',
			localProtection: hasProtectedLocalChanges ? 'protected' : 'idle',
			saveState: savePolicyState.status,
			saveAction: savePolicyState.clickAction || 'none',
			authorityState: savePolicyState.saveButtonAuthorityState,
			saveStateSummaryText: savePolicyState.saveButtonStateSummaryText,
			authorityStatusText: savePolicyState.saveButtonAuthorityStatusText,
			humanLoopStepState,
			humanLoopStep: humanLoopStepState.step,
			humanLoopAction: humanLoopStepState.action,
			humanLoopTitle: humanLoopStepCopy.title,
			humanLoopSummary: humanLoopStepCopy.summary,
			saveJourneyTitle: saveJourneyCopy.title,
			saveJourneySummary: saveJourneyCopy.summary,
			confirmedSaveMergedEdits: false,
			confirmedSaveEvidenceRetained: false,
			confirmedSaveShellQuieted: false,
			message: __(
				'Updates may be delayed. Local changes remain protected and exportable.'
			),
		};
	}

	if ( hasProtectedLocalChanges ) {
		return {
			serverContact: 'nominal',
			localProtection: 'protected',
			saveState: savePolicyState.status,
			saveAction: savePolicyState.clickAction || 'none',
			authorityState: savePolicyState.saveButtonAuthorityState,
			saveStateSummaryText: savePolicyState.saveButtonStateSummaryText,
			authorityStatusText: savePolicyState.saveButtonAuthorityStatusText,
			humanLoopStepState,
			humanLoopStep: humanLoopStepState.step,
			humanLoopAction: humanLoopStepState.action,
			humanLoopTitle: humanLoopStepCopy.title,
			humanLoopSummary: humanLoopStepCopy.summary,
			saveJourneyTitle: saveJourneyCopy.title,
			saveJourneySummary: saveJourneyCopy.summary,
			confirmedSaveMergedEdits: false,
			confirmedSaveEvidenceRetained: false,
			confirmedSaveShellQuieted: false,
			message: __(
				'Local changes are protected and remain exportable while WordPress waits for server confirmation.'
			),
		};
	}

	if ( humanLoopStepState.confirmedByWordPress ) {
		return {
			serverContact: 'nominal',
			localProtection: 'idle',
			saveState: savePolicyState.status,
			saveAction: savePolicyState.clickAction || 'none',
			authorityState: savePolicyState.saveButtonAuthorityState,
			saveStateSummaryText: savePolicyState.saveButtonStateSummaryText,
			authorityStatusText: savePolicyState.saveButtonAuthorityStatusText,
			humanLoopStepState,
			humanLoopStep: humanLoopStepState.step,
			humanLoopAction: humanLoopStepState.action,
			humanLoopTitle: humanLoopStepCopy.title,
			humanLoopSummary: humanLoopStepCopy.summary,
			saveJourneyTitle: saveJourneyCopy.title,
			saveJourneySummary: saveJourneyCopy.summary,
			confirmedSaveMergedEdits: Boolean(
				normalized.retrySaveConfirmedMergedEdits
			),
			confirmedSaveEvidenceRetained: true,
			confirmedSaveShellQuieted: false,
			message: __(
				'WordPress accepted this Distributed Editing Save. You can keep editing; WordPress will protect any new local changes.'
			),
		};
	}

	return {
		serverContact: 'nominal',
		localProtection: 'idle',
		saveState: savePolicyState.status,
		saveAction: savePolicyState.clickAction || 'none',
		authorityState: savePolicyState.saveButtonAuthorityState,
		saveStateSummaryText: savePolicyState.saveButtonStateSummaryText,
		authorityStatusText: savePolicyState.saveButtonAuthorityStatusText,
		humanLoopStepState,
		humanLoopStep: humanLoopStepState.step,
		humanLoopAction: humanLoopStepState.action,
		humanLoopTitle: humanLoopStepCopy.title,
		humanLoopSummary: humanLoopStepCopy.summary,
		saveJourneyTitle: saveJourneyCopy.title,
		saveJourneySummary: saveJourneyCopy.summary,
		confirmedSaveMergedEdits: false,
		confirmedSaveEvidenceRetained: false,
		confirmedSaveShellQuieted: false,
		message: __(
			'WordPress will protect local changes and show sync status here when review, refresh, or server confirmation is needed.'
		),
	};
}

function getDistributedEditingConfirmedSaveShellHoldMs() {
	const holdMs =
		globalThis.__experimentalDistributedEditingConfirmedSaveShellHoldMs;

	if (
		typeof holdMs === 'number' &&
		Number.isFinite( holdMs ) &&
		holdMs >= 0
	) {
		return holdMs;
	}

	return DISTRIBUTED_EDITING_CONFIRMED_SAVE_SHELL_HOLD_MS;
}

function getDistributedEditingConfirmedSaveStatusHoldMs() {
	const holdMs =
		globalThis.__experimentalDistributedEditingConfirmedSaveStatusHoldMs;

	if (
		typeof holdMs === 'number' &&
		Number.isFinite( holdMs ) &&
		holdMs >= 0
	) {
		return holdMs;
	}

	return DISTRIBUTED_EDITING_CONFIRMED_SAVE_STATUS_HOLD_MS;
}

function getDistributedEditingQuietedConfirmedSaveShellState( shellState ) {
	const humanLoopStepState = {
		...shellState.humanLoopStepState,
		step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_EDIT,
		action: 'edit',
		saveButtonStatus: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY,
		saveButtonReason: null,
		saveButtonLabel: __( 'Update' ),
		saveButtonStatusText: __( 'Ready to update' ),
		saveButtonDisabled: false,
		saveButtonBusy: false,
		saveButtonBlocksNormalSavePost: false,
		saveButtonStateSummaryText: __(
			'Save can update the authoritative WordPress post.'
		),
		saveButtonAuthorityStatusText: __(
			'Save can update the authoritative WordPress post.'
		),
		saveAuthorityState:
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_TO_UPDATE,
		savePolicyAction: DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE,
		hasProtectedLocalChanges: false,
		requiresServerStateRefetch: false,
		requiresReview: false,
		hasAcceptedButUnconsumed: false,
		pendingServerConfirmation: false,
		confirmedByWordPress: false,
	};
	const humanLoopStepCopy =
		getDistributedEditingHumanLoopStepCopy( humanLoopStepState );
	const saveJourneyCopy =
		getDistributedEditingHumanLoopSaveJourneyCopy( humanLoopStepState );

	return {
		...shellState,
		saveState: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.UPDATE_READY,
		saveAction: DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE,
		authorityState:
			DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_TO_UPDATE,
		saveStateSummaryText: __(
			'Save can update the authoritative WordPress post.'
		),
		authorityStatusText: __(
			'Save can update the authoritative WordPress post.'
		),
		humanLoopStepState,
		humanLoopStep: humanLoopStepState.step,
		humanLoopAction: humanLoopStepState.action,
		humanLoopTitle: humanLoopStepCopy.title,
		humanLoopSummary: humanLoopStepCopy.summary,
		saveJourneyTitle: saveJourneyCopy.title,
		saveJourneySummary: saveJourneyCopy.summary,
		confirmedSaveEvidenceRetained: true,
		confirmedSaveShellQuieted: true,
		message: __(
			'WordPress will protect local changes and show sync status here when review, refresh, or server confirmation is needed.'
		),
	};
}

function getDistributedEditingHumanLoopStepCopy( humanLoopStepState ) {
	switch ( humanLoopStepState.step ) {
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED:
			return {
				title: __( 'Local changes protected' ),
				summary: __(
					'Keep editing. If server confirmation is delayed, export this session before closing the tab.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST:
			return {
				title: __( 'Get latest post' ),
				summary: __(
					'Getting the latest post only refreshes server state. Local changes stay protected and WordPress is not updated yet.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES:
			return {
				title: __( 'Review changes' ),
				summary: __(
					'Save will open review before WordPress updates the post.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE:
			return {
				title: __( 'Ready to Save' ),
				summary: __(
					'Reviewed changes are ready. Use Save to ask WordPress to update the post.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.WAITING_FOR_WORDPRESS:
			return {
				title: __( 'Waiting for WordPress' ),
				summary: __(
					'Keep this tab open until WordPress confirms whether the post was updated.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED:
			return {
				title: __( 'Saved by WordPress' ),
				summary: __(
					'WordPress accepted the Distributed Editing Save. No protected local changes remain pending for this save.'
				),
			};
	}

	return {
		title: __( 'Ready to edit' ),
		summary: __(
			'Edit normally. Distributed Editing will step in if review, refresh, or server confirmation is needed.'
		),
	};
}

function getDistributedEditingHumanLoopSaveJourneyCopy( humanLoopStepState ) {
	switch ( humanLoopStepState.step ) {
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED:
			return {
				title: __( 'Save keeps changes protected' ),
				summary: __(
					'You can keep editing. If you use Save, keep this tab open until WordPress confirms the update.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST:
			return {
				title: __( 'Save needs the latest post' ),
				summary: __(
					'Getting the latest post refreshes server state before Save; local changes stay protected and WordPress is not updated yet.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES:
			return {
				title: __( 'Save opens review' ),
				summary: __(
					'Review highlighted changes before WordPress updates the post.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE:
			return {
				title: __( 'Save is ready' ),
				summary: __(
					'Save will send reviewed changes to WordPress for a guarded update.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.WAITING_FOR_WORDPRESS:
			return {
				title: __( 'Save is waiting for WordPress' ),
				summary: __(
					'Keep this tab open until WordPress confirms whether the post was updated.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED:
			return {
				title: __( 'Saved' ),
				summary: __( 'WordPress confirmed the update.' ),
			};
	}

	return {
		title: __( 'Save is available' ),
		summary: __(
			'Use Save when you are ready for WordPress to update this post.'
		),
	};
}

function getDistributedEditingEnabledShellTitle( shellState ) {
	if ( shellState.serverContact === 'degraded' ) {
		return __( 'Editing together delayed' );
	}

	if ( shellState.humanLoopStepState.confirmedByWordPress ) {
		if ( shellState.confirmedSaveMergedEdits ) {
			return __( 'Merged by WordPress' );
		}

		return __( 'Saved' );
	}

	if ( shellState.localProtection === 'protected' ) {
		return __( 'Protected' );
	}

	return __( 'Editing together' );
}

function getDistributedEditingEnabledShellProtectionLine( shellState ) {
	if ( shellState.localProtection === 'protected' ) {
		return __( 'Your changes are protected.' );
	}

	if ( shellState.humanLoopStepState.confirmedByWordPress ) {
		return __( 'Ready for new edits.' );
	}

	return __( 'Other editors in this post appear below.' );
}

function getDistributedEditingEnabledShellSaveLine( shellState ) {
	switch ( shellState.humanLoopStep ) {
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST:
			return __( 'Getting the latest post only refreshes server state.' );
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES:
			return __( 'Review changes before Save.' );
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE:
			return __( 'Ready for WordPress Save.' );
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.WAITING_FOR_WORDPRESS:
			return __( 'Waiting for WordPress confirmation.' );
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED:
			return '';
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED:
			return __( 'Save checks WordPress before updating.' );
	}

	return '';
}

/**
 * Renders the always-visible DE-RTC enabled shell in editor chrome.
 *
 * This shell communicates that the feature is enabled even when there are no
 * pending actions. It is deliberately inert: it does not dispatch, fetch,
 * mutate editor content, save, or change post locks.
 *
 * @param {Object} props           Component props.
 * @param {string} props.placement Chrome placement label.
 *
 * @return {React.ReactNode} Rendered enabled shell.
 */
export function DistributedEditingEnabledShell( {
	placement = 'editor-interface-notices',
} ) {
	const { editorSettings, sessionState } = useSelect( ( select ) => {
		const { getDistributedEditingSessionState, getEditorSettings } =
			select( editorStore );

		return {
			editorSettings: getEditorSettings?.() || {},
			sessionState: getDistributedEditingSessionState?.() || {},
		};
	}, [] );

	const rawShellState =
		getDistributedEditingEnabledShellState( sessionState );
	const isConfirmedSaveShell =
		rawShellState.localProtection === 'idle' &&
		rawShellState.humanLoopStepState.confirmedByWordPress;
	const confirmedSaveShellKey = [
		sessionState.retrySaveStatus || '',
		sessionState.retrySaveServerVersion || '',
		sessionState.retrySavePreviousServerVersion || '',
		sessionState.retrySaveRevisionCreated ? 'revision' : 'no-revision',
	].join( ':' );
	const confirmedSaveShellHoldMs =
		getDistributedEditingConfirmedSaveShellHoldMs();
	const [ isConfirmedSaveShellQuieted, setIsConfirmedSaveShellQuieted ] =
		useState( false );

	useEffect( () => {
		if ( ! isConfirmedSaveShell ) {
			setIsConfirmedSaveShellQuieted( false );
			return;
		}

		setIsConfirmedSaveShellQuieted( false );
		const timeoutId = setTimeout( () => {
			setIsConfirmedSaveShellQuieted( true );
		}, confirmedSaveShellHoldMs );

		return () => {
			clearTimeout( timeoutId );
		};
	}, [
		confirmedSaveShellHoldMs,
		confirmedSaveShellKey,
		isConfirmedSaveShell,
	] );

	if ( ! editorSettings?.distributedEditing?.enabled ) {
		return null;
	}

	const shellState =
		isConfirmedSaveShell && isConfirmedSaveShellQuieted
			? getDistributedEditingQuietedConfirmedSaveShellState(
					rawShellState
			  )
			: rawShellState;
	const shellTone =
		shellState.serverContact === 'degraded'
			? 'degraded'
			: shellState.localProtection;
	const shellTitle = getDistributedEditingEnabledShellTitle( shellState );
	const protectionLine =
		getDistributedEditingEnabledShellProtectionLine( shellState );
	const saveLine = getDistributedEditingEnabledShellSaveLine( shellState );

	return (
		<div
			aria-label={ __( 'Distributed editing enabled status' ) }
			className="editor-distributed-editing-status__enabled-shell"
			data-distributed-editing-confirmed-save-evidence-retained={ formatDataBoolean(
				Boolean( shellState.confirmedSaveEvidenceRetained )
			) }
			data-distributed-editing-confirmed-save-merged-edits={ formatDataBoolean(
				Boolean( shellState.confirmedSaveMergedEdits )
			) }
			data-distributed-editing-confirmed-save-shell-quieted={ formatDataBoolean(
				Boolean( shellState.confirmedSaveShellQuieted )
			) }
			data-distributed-editing-enabled-shell-save-guidance-visible={ formatDataBoolean(
				Boolean( saveLine )
			) }
			data-distributed-editing-enabled-shell-scan-layout="compact-summary-row"
			data-distributed-editing-enabled-shell-visible-labels="false"
			data-distributed-editing-authority-state={
				shellState.authorityState
			}
			data-distributed-editing-local-protection={
				shellState.localProtection
			}
			data-distributed-editing-save-action={ shellState.saveAction }
			data-distributed-editing-save-journey-action={
				shellState.humanLoopAction
			}
			data-distributed-editing-save-journey-step={
				shellState.humanLoopStep
			}
			data-distributed-editing-save-state={ shellState.saveState }
			data-distributed-editing-server-contact={ shellState.serverContact }
			data-distributed-editing-shell="enabled"
			data-distributed-editing-shell-placement={ placement }
			data-distributed-editing-human-loop-action={
				shellState.humanLoopAction
			}
			data-distributed-editing-human-loop-step={
				shellState.humanLoopStep
			}
			role="region"
		>
			<div
				aria-live="polite"
				className={ [
					'editor-distributed-editing-status__enabled-shell-panel',
					`editor-distributed-editing-status__enabled-shell-panel--${ shellTone }`,
				].join( ' ' ) }
			>
				<div className="editor-distributed-editing-status__enabled-shell-header">
					<dl
						aria-label={ __( 'Distributed editing summary' ) }
						className="editor-distributed-editing-status__enabled-shell-summary"
					>
						<div
							className="editor-distributed-editing-status__enabled-shell-summary-item editor-distributed-editing-status__enabled-shell-summary-item--mode"
							data-distributed-editing-enabled-shell-summary-item="mode"
						>
							<dt className="screen-reader-text">
								{ __( 'Mode' ) }
							</dt>
							<dd className="editor-distributed-editing-status__enabled-shell-summary-value">
								<strong className="editor-distributed-editing-status__enabled-shell-title">
									{ shellTitle }
								</strong>
							</dd>
						</div>
						<div
							className="editor-distributed-editing-status__enabled-shell-summary-item editor-distributed-editing-status__enabled-shell-summary-item--protection"
							data-distributed-editing-enabled-shell-summary-item="protection"
						>
							<dt className="screen-reader-text">
								{ __( 'Local protection' ) }
							</dt>
							<dd className="editor-distributed-editing-status__enabled-shell-summary-value editor-distributed-editing-status__enabled-shell-protection">
								{ protectionLine }
							</dd>
						</div>
						<div
							className={ [
								'editor-distributed-editing-status__enabled-shell-summary-item',
								'editor-distributed-editing-status__enabled-shell-summary-item--save',
								! saveLine &&
									'editor-distributed-editing-status__enabled-shell-summary-item--hidden',
							]
								.filter( Boolean )
								.join( ' ' ) }
							data-distributed-editing-enabled-shell-summary-item="save"
							data-distributed-editing-enabled-shell-summary-item-visible={ formatDataBoolean(
								Boolean( saveLine )
							) }
						>
							<dt className="screen-reader-text">
								{ __( 'Save' ) }
							</dt>
							<dd
								className="editor-distributed-editing-status__enabled-shell-summary-value editor-distributed-editing-status__enabled-shell-save-state"
								data-distributed-editing-save-journey-calls-normal-save="false"
								data-distributed-editing-save-journey-calls-rest="false"
								data-distributed-editing-save-journey-calls-retry-save="false"
								data-distributed-editing-save-journey-changes-post-lock="false"
								data-distributed-editing-save-journey-authority-state={
									shellState.authorityState
								}
								data-distributed-editing-save-journey-authority-summary={
									shellState.authorityStatusText
								}
								data-distributed-editing-save-journey-claims-saved-without-evidence={ formatDataBoolean(
									shellState.humanLoopStepState
										.claimsSavedWithoutEvidence
								) }
								data-distributed-editing-save-journey-descriptor-only="true"
								data-distributed-editing-save-journey-exposes-proof-internals="false"
								data-distributed-editing-save-journey-exposes-raw-content="false"
								data-distributed-editing-save-journey-mutates-editor-content="false"
								data-distributed-editing-save-journey-mutates-persisted-post-content="false"
								data-distributed-editing-save-journey-status={
									shellState.humanLoopStep
								}
								data-distributed-editing-save-journey-status-summary={
									shellState.saveStateSummaryText
								}
							>
								{ saveLine }
							</dd>
						</div>
					</dl>
				</div>
				<div
					className="editor-distributed-editing-status__enabled-shell-authority-state"
					data-distributed-editing-authority-status-summary={
						shellState.authorityStatusText
					}
				/>
				<div
					className="editor-distributed-editing-status__enabled-shell-human-loop"
					data-distributed-editing-human-loop-calls-normal-save="false"
					data-distributed-editing-human-loop-calls-rest="false"
					data-distributed-editing-human-loop-calls-retry-save="false"
					data-distributed-editing-human-loop-changes-post-lock="false"
					data-distributed-editing-human-loop-claims-saved-without-evidence={ formatDataBoolean(
						shellState.humanLoopStepState.claimsSavedWithoutEvidence
					) }
					data-distributed-editing-human-loop-confirmed-by-wordpress={ formatDataBoolean(
						shellState.humanLoopStepState.confirmedByWordPress
					) }
					data-distributed-editing-human-loop-descriptor-only="true"
					data-distributed-editing-human-loop-exposes-proof-internals="false"
					data-distributed-editing-human-loop-exposes-raw-content="false"
					data-distributed-editing-human-loop-mutates-editor-content="false"
					data-distributed-editing-human-loop-mutates-persisted-post-content="false"
					data-distributed-editing-human-loop-step-status={
						shellState.humanLoopStep
					}
				/>
				<DistributedEditingPresenceRoster
					initialPresenceRoster={
						editorSettings.distributedEditing?.initialPresenceRoster
					}
					presenceRepeatedRefreshRuntime={
						editorSettings.distributedEditing
							?.presenceRepeatedRefreshRuntime
					}
					presenceStorageReadiness={
						editorSettings.distributedEditing
							?.presenceStorageReadiness
					}
					presenceStartupPolicy={
						editorSettings.distributedEditing?.presenceStartupPolicy
					}
					sessionState={ sessionState }
				/>
			</div>
		</div>
	);
}

function DistributedEditingPresenceRoster( {
	initialPresenceRoster,
	presenceRepeatedRefreshRuntime,
	presenceStorageReadiness,
	presenceStartupPolicy,
	sessionState = {},
} ) {
	const distributedEditingDispatch = useDispatch( editorStore ) || {};
	const {
		__experimentalRefreshDistributedEditingPresenceSnapshot,
		__experimentalRefreshDistributedEditingPresenceStorageReadiness,
		__experimentalSendDistributedEditingPresenceHeartbeat,
	} = distributedEditingDispatch;
	const [ commandStatus, setCommandStatus ] = useState( 'idle' );
	const [ heartbeatCommandStatus, setHeartbeatCommandStatus ] =
		useState( 'idle' );
	const [ presenceRefreshUserInitiated, setPresenceRefreshUserInitiated ] =
		useState( false );
	const [
		presenceHeartbeatUserInitiated,
		setPresenceHeartbeatUserInitiated,
	] = useState( false );
	const [
		repeatedRefreshSchedulerStatus,
		setRepeatedRefreshSchedulerStatus,
	] = useState( 'idle' );
	const [
		repeatedRefreshSchedulerTickCount,
		setRepeatedRefreshSchedulerTickCount,
	] = useState( 0 );
	const [ startupHeartbeatRuntimeStatus, setStartupHeartbeatRuntimeStatus ] =
		useState( 'idle' );
	const [
		presenceStorageSetupNavigationStatus,
		setPresenceStorageSetupNavigationStatus,
	] = useState( 'idle' );
	const [
		presenceStorageReadinessRecheckStatus,
		setPresenceStorageReadinessRecheckStatus,
	] = useState( 'idle' );
	const [
		presenceStorageReadinessRecheckResult,
		setPresenceStorageReadinessRecheckResult,
	] = useState( null );
	const repeatedRefreshSchedulerTokenRef = useRef( null );
	const startupHeartbeatRuntimeKeyRef = useRef( null );
	const startupHeartbeatRuntimeSentRef = useRef( false );
	const startupSnapshotRuntimeKeyRef = useRef( null );
	const startupSnapshotRuntimeSentRef = useRef( false );
	const handleOpenPresenceStorageSetup = useCallback( () => {
		setPresenceStorageSetupNavigationStatus( 'settings_opened' );
	}, [] );
	const handleRefreshPresence = useCallback( async () => {
		setPresenceRefreshUserInitiated( true );

		if ( ! __experimentalRefreshDistributedEditingPresenceSnapshot ) {
			setCommandStatus( 'failed' );
			return;
		}

		setCommandStatus( 'refreshing' );

		try {
			await __experimentalRefreshDistributedEditingPresenceSnapshot();
			setCommandStatus( 'refreshed' );
		} catch {
			setCommandStatus( 'failed' );
		}
	}, [ __experimentalRefreshDistributedEditingPresenceSnapshot ] );
	const handleSendPresenceHeartbeat = useCallback( async () => {
		setPresenceHeartbeatUserInitiated( true );

		if ( ! __experimentalSendDistributedEditingPresenceHeartbeat ) {
			setHeartbeatCommandStatus( 'failed' );
			return;
		}

		setHeartbeatCommandStatus( 'sending' );

		try {
			await __experimentalSendDistributedEditingPresenceHeartbeat();
			setHeartbeatCommandStatus( 'sent' );
		} catch ( error ) {
			setHeartbeatCommandStatus(
				error?.code ===
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE
					? 'degraded'
					: 'failed'
			);
		}
	}, [ __experimentalSendDistributedEditingPresenceHeartbeat ] );
	const handleRecheckPresenceStorageReadiness = useCallback( async () => {
		if (
			! __experimentalRefreshDistributedEditingPresenceStorageReadiness
		) {
			setPresenceStorageReadinessRecheckStatus( 'failed' );
			return;
		}

		setPresenceStorageReadinessRecheckStatus( 'checking' );

		try {
			const response =
				await __experimentalRefreshDistributedEditingPresenceStorageReadiness();
			const nextStatus = [
				'ready',
				'setup_required',
				'upgrade_required',
			].includes( response?.status )
				? response.status
				: 'checked';

			setPresenceStorageReadinessRecheckResult( response );
			setPresenceStorageReadinessRecheckStatus( nextStatus );
		} catch ( error ) {
			if (
				error?.code ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED
			) {
				setPresenceStorageReadinessRecheckStatus( 'feature_disabled' );
			} else if (
				error?.code ===
					DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT ||
				error?.code === 'rest_cannot_edit'
			) {
				setPresenceStorageReadinessRecheckStatus( 'permission_denied' );
			} else if (
				error?.code ===
					DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID ||
				error?.code === 'rest_post_invalid_id'
			) {
				setPresenceStorageReadinessRecheckStatus( 'route_mismatch' );
			} else {
				setPresenceStorageReadinessRecheckStatus( 'failed' );
			}
		}
	}, [ __experimentalRefreshDistributedEditingPresenceStorageReadiness ] );
	const effectiveSessionState = {
		...( presenceRepeatedRefreshRuntime &&
		! sessionState.distributedEditingPresenceRepeatedRefreshRuntime
			? {
					distributedEditingPresenceRepeatedRefreshRuntime:
						presenceRepeatedRefreshRuntime,
			  }
			: {} ),
		...( presenceStartupPolicy &&
		! sessionState.distributedEditingPresenceStartupPolicy
			? {
					distributedEditingPresenceStartupPolicy:
						presenceStartupPolicy,
			  }
			: {} ),
		...sessionState,
	};
	const sessionPresenceStatus =
		effectiveSessionState.presenceRosterStatus ||
		DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.HIDDEN;
	const presenceHeartbeatStatus =
		effectiveSessionState.presenceHeartbeatStatus ||
		DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.NONE;
	const hasSessionPresence =
		effectiveSessionState.presenceRosterEntries?.length > 0 ||
		sessionPresenceStatus !==
			DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.HIDDEN;
	const rosterInput = hasSessionPresence
		? effectiveSessionState
		: {
				distributedEditingPresenceRoster: initialPresenceRoster,
				presenceRosterStatus:
					DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.EMPTY,
		  };
	const rosterState =
		getDistributedEditingPresenceRosterStateForSessionState( rosterInput );
	const repeatedRefreshState =
		getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState(
			effectiveSessionState
		);
	const startupPolicyState =
		getDistributedEditingPresenceStartupPolicyStateForSessionState(
			effectiveSessionState
		);
	const activePresenceStorageReadiness =
		presenceStorageReadinessRecheckResult ||
		effectiveSessionState.presenceStorageReadinessRecheckResult ||
		presenceStorageReadiness;
	const presenceStorageReadinessState = getPresenceStorageReadinessState(
		activePresenceStorageReadiness
	);
	const presenceStorageSetupAffordanceState =
		getPresenceStorageSetupAffordanceState(
			presenceStorageReadinessState,
			presenceStorageSetupNavigationStatus
		);
	const presenceStorageReadinessRecheckState =
		getPresenceStorageReadinessRecheckState(
			presenceStorageReadinessRecheckStatus,
			presenceStorageSetupAffordanceState
		);
	const repeatedRefreshDelayMs =
		getPresenceRepeatedRefreshDelayMs( repeatedRefreshState );
	const startupHeartbeatDelayMs =
		getPresenceStartupHeartbeatDelayMs( startupPolicyState );
	const storageReadyForStartupHeartbeat =
		presenceStorageReadinessState.status === 'ready' &&
		presenceStorageReadinessState.tableExists &&
		presenceStorageReadinessState.schemaCurrent;
	const shouldRunRepeatedRefreshScheduler =
		repeatedRefreshState.status ===
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED &&
		repeatedRefreshState.explicitOptIn &&
		repeatedRefreshState.schedulesNextRefresh &&
		repeatedRefreshDelayMs !== null &&
		typeof __experimentalRefreshDistributedEditingPresenceSnapshot ===
			'function';
	const startupHeartbeatPolicyAllowsRuntime =
		[
			DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.AUTOMATIC_HEARTBEAT_ALLOWED,
			DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED,
		].includes( startupPolicyState.status ) &&
		startupPolicyState.maySendInitialHeartbeatAutomatically &&
		startupHeartbeatDelayMs !== null &&
		startupPolicyState.serverContact !== 'degraded' &&
		typeof __experimentalSendDistributedEditingPresenceHeartbeat ===
			'function';
	const shouldRunStartupHeartbeatRuntime =
		startupHeartbeatPolicyAllowsRuntime && storageReadyForStartupHeartbeat;
	const shouldRunStartupSnapshotRuntime =
		shouldRunStartupHeartbeatRuntime &&
		typeof __experimentalRefreshDistributedEditingPresenceSnapshot ===
			'function';
	const startupHeartbeatRuntimeState =
		getPresenceStartupHeartbeatRuntimeState( {
			delayMs: startupHeartbeatDelayMs,
			startupHeartbeatPolicyAllowsRuntime,
			storageReadyForStartupHeartbeat,
			shouldRunStartupHeartbeatRuntime,
			status: startupHeartbeatRuntimeStatus,
			startupPolicyState,
		} );
	const presenceFreshnessIndicator = getPresenceFreshnessIndicator( {
		commandStatus,
		heartbeatCommandStatus,
		presenceStorageReadinessState,
		repeatedRefreshDelayMs,
		repeatedRefreshSchedulerStatus,
		repeatedRefreshState,
		rosterState,
		startupHeartbeatRuntimeState,
	} );
	const shouldShowPresenceFreshnessIndicator =
		presenceFreshnessIndicator.tone === 'warning' ||
		[ 'paused', 'delayed', 'degraded' ].includes(
			presenceFreshnessIndicator.state
		);
	const shouldShowPresenceRefreshHint =
		shouldShowPresenceFreshnessIndicator &&
		Boolean( rosterState.copy.refreshHint );
	const shouldShowPresenceStartupPolicy =
		startupPolicyState.serverContact === 'degraded' ||
		[ 'failed', 'degraded', 'paused' ].includes(
			startupHeartbeatRuntimeState.status
		) ||
		startupHeartbeatRuntimeState.blockedByStorageReadiness;
	const shouldShowPresenceStorageReadiness =
		presenceStorageSetupAffordanceState.visible ||
		presenceStorageReadinessRecheckState.visible;
	const shouldShowPresenceActions = shouldShowPresenceFreshnessIndicator;
	const hasOtherEditorActivityCue = Boolean(
		rosterState.copy.otherEditorActivityCue
	);
	const presenceSummaryText =
		( hasOtherEditorActivityCue &&
			rosterState.copy.otherEditorActivityCue ) ||
		rosterState.copy.summary;
	const presenceSummaryClassName = [
		'editor-distributed-editing-status__presence-roster-summary',
		hasOtherEditorActivityCue &&
			'editor-distributed-editing-status__presence-other-editor-cue',
		hasOtherEditorActivityCue &&
			`editor-distributed-editing-status__presence-other-editor-cue--${ rosterState.copy.otherEditorActivityCueTone }`,
	]
		.filter( Boolean )
		.join( ' ' );
	const presenceSummaryAccessibilityLabel = sprintf(
		/* translators: %s: current Distributed Editing presence summary. */
		__( 'Presence: %s' ),
		presenceSummaryText
	);
	const shouldShowPresenceRefreshCommandStatus =
		commandStatus !== 'idle' &&
		( presenceRefreshUserInitiated || commandStatus === 'failed' );
	const shouldShowPresenceHeartbeatCommandStatus =
		heartbeatCommandStatus !== 'idle' &&
		( presenceHeartbeatUserInitiated ||
			[ 'degraded', 'failed' ].includes( heartbeatCommandStatus ) );

	useEffect( () => {
		if (
			startupPolicyState.status ===
				DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.PAUSED_DEGRADED_TRANSPORT ||
			startupPolicyState.serverContact === 'degraded'
		) {
			startupHeartbeatRuntimeKeyRef.current = null;
			startupHeartbeatRuntimeSentRef.current = false;
			startupSnapshotRuntimeKeyRef.current = null;
			startupSnapshotRuntimeSentRef.current = false;
			setStartupHeartbeatRuntimeStatus( 'paused' );
			return;
		}

		if ( ! shouldRunStartupHeartbeatRuntime ) {
			startupHeartbeatRuntimeKeyRef.current = null;
			startupHeartbeatRuntimeSentRef.current = false;
			startupSnapshotRuntimeKeyRef.current = null;
			startupSnapshotRuntimeSentRef.current = false;
			setStartupHeartbeatRuntimeStatus( 'idle' );
			return;
		}

		const runtimeKey = [
			startupPolicyState.status,
			startupPolicyState.hostProfile,
			startupPolicyState.serverContact,
			startupHeartbeatDelayMs,
		].join( ':' );

		if ( startupHeartbeatRuntimeKeyRef.current !== runtimeKey ) {
			startupHeartbeatRuntimeKeyRef.current = runtimeKey;
			startupHeartbeatRuntimeSentRef.current = false;
		}

		let isCancelled = false;
		const timeoutId = globalThis.setTimeout( async () => {
			if ( isCancelled ) {
				return;
			}

			if ( startupHeartbeatRuntimeSentRef.current ) {
				return;
			}

			if (
				distributedEditingStartupHeartbeatRuntimeKeys.has( runtimeKey )
			) {
				return;
			}

			distributedEditingStartupHeartbeatRuntimeKeys.add( runtimeKey );
			startupHeartbeatRuntimeSentRef.current = true;
			setPresenceHeartbeatUserInitiated( false );
			setStartupHeartbeatRuntimeStatus( 'sending' );
			setHeartbeatCommandStatus( 'sending' );

			try {
				await __experimentalSendDistributedEditingPresenceHeartbeat();

				if ( ! isCancelled ) {
					setHeartbeatCommandStatus( 'sent' );
					setStartupHeartbeatRuntimeStatus( 'sent' );
				}
			} catch ( error ) {
				const didDegrade =
					error?.code ===
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE;

				if ( ! isCancelled ) {
					setHeartbeatCommandStatus(
						didDegrade ? 'degraded' : 'failed'
					);
					setStartupHeartbeatRuntimeStatus(
						didDegrade ? 'degraded' : 'failed'
					);
				}
			}
		}, startupHeartbeatDelayMs );

		setStartupHeartbeatRuntimeStatus( 'scheduled' );

		return () => {
			isCancelled = true;
			globalThis.clearTimeout( timeoutId );
		};
	}, [
		__experimentalSendDistributedEditingPresenceHeartbeat,
		shouldRunStartupHeartbeatRuntime,
		startupHeartbeatDelayMs,
		startupPolicyState.hostProfile,
		startupPolicyState.serverContact,
		startupPolicyState.status,
	] );

	useEffect( () => {
		if (
			! shouldRunStartupSnapshotRuntime ||
			startupHeartbeatRuntimeStatus !== 'sent'
		) {
			if ( ! shouldRunStartupSnapshotRuntime ) {
				startupSnapshotRuntimeKeyRef.current = null;
				startupSnapshotRuntimeSentRef.current = false;
			}
			return;
		}

		const runtimeKey = [
			startupPolicyState.status,
			startupPolicyState.hostProfile,
			startupPolicyState.serverContact,
			startupHeartbeatDelayMs,
			'startup-snapshot',
		].join( ':' );

		if ( startupSnapshotRuntimeKeyRef.current !== runtimeKey ) {
			startupSnapshotRuntimeKeyRef.current = runtimeKey;
			startupSnapshotRuntimeSentRef.current = false;
		}

		if ( startupSnapshotRuntimeSentRef.current ) {
			return;
		}

		let isCancelled = false;
		startupSnapshotRuntimeSentRef.current = true;
		const timeoutId = globalThis.setTimeout( () => {
			if ( isCancelled ) {
				return;
			}

			setPresenceRefreshUserInitiated( false );
			setCommandStatus( 'refreshing' );

			__experimentalRefreshDistributedEditingPresenceSnapshot()
				.then( () => {
					if ( ! isCancelled ) {
						setCommandStatus( 'refreshed' );
					}
				} )
				.catch( () => {
					if ( ! isCancelled ) {
						setCommandStatus( 'failed' );
					}
				} );
		}, DISTRIBUTED_EDITING_STARTUP_SNAPSHOT_DELAY_MS );

		return () => {
			isCancelled = true;
			globalThis.clearTimeout( timeoutId );
		};
	}, [
		__experimentalRefreshDistributedEditingPresenceSnapshot,
		shouldRunStartupSnapshotRuntime,
		startupHeartbeatDelayMs,
		startupHeartbeatRuntimeStatus,
		startupPolicyState.hostProfile,
		startupPolicyState.serverContact,
		startupPolicyState.status,
	] );

	useEffect( () => {
		if (
			repeatedRefreshState.status ===
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT
		) {
			repeatedRefreshSchedulerTokenRef.current = null;
			setRepeatedRefreshSchedulerStatus( 'paused' );
			return;
		}

		if ( ! shouldRunRepeatedRefreshScheduler ) {
			repeatedRefreshSchedulerTokenRef.current = null;
			setRepeatedRefreshSchedulerStatus( 'idle' );
			return;
		}

		let isCancelled = false;
		const schedulerToken = {};
		repeatedRefreshSchedulerTokenRef.current = schedulerToken;
		const timeoutId = globalThis.setTimeout( async () => {
			if ( isCancelled ) {
				return;
			}

			if ( repeatedRefreshSchedulerTokenRef.current !== schedulerToken ) {
				return;
			}

			let didFail = false;
			let didDegrade = false;

			setPresenceRefreshUserInitiated( false );
			setRepeatedRefreshSchedulerStatus( 'running' );
			setCommandStatus( 'refreshing' );

			try {
				await __experimentalRefreshDistributedEditingPresenceSnapshot();

				if ( ! isCancelled ) {
					setCommandStatus( 'refreshed' );
				}
			} catch {
				didFail = true;

				if ( ! isCancelled ) {
					setCommandStatus( 'failed' );
				}
			}

			if (
				! isCancelled &&
				repeatedRefreshSchedulerTokenRef.current === schedulerToken &&
				repeatedRefreshState.schedulesNextHeartbeat
			) {
				if (
					typeof __experimentalSendDistributedEditingPresenceHeartbeat !==
					'function'
				) {
					didFail = true;
					setHeartbeatCommandStatus( 'failed' );
				} else {
					setPresenceHeartbeatUserInitiated( false );
					setHeartbeatCommandStatus( 'sending' );

					try {
						await __experimentalSendDistributedEditingPresenceHeartbeat();

						if ( ! isCancelled ) {
							setHeartbeatCommandStatus( 'sent' );
						}
					} catch ( error ) {
						didDegrade =
							error?.code ===
							DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE;

						if ( ! isCancelled ) {
							setHeartbeatCommandStatus(
								didDegrade ? 'degraded' : 'failed'
							);
						}

						if ( ! didDegrade ) {
							didFail = true;
						}
					}
				}
			}

			if (
				! isCancelled &&
				repeatedRefreshSchedulerTokenRef.current === schedulerToken
			) {
				let nextSchedulerStatus = 'completed';

				if ( didFail ) {
					nextSchedulerStatus = 'failed';
				} else if ( didDegrade ) {
					nextSchedulerStatus = 'degraded';
				}

				setRepeatedRefreshSchedulerTickCount(
					( tickCount ) => tickCount + 1
				);
				setRepeatedRefreshSchedulerStatus( nextSchedulerStatus );
			}
		}, repeatedRefreshDelayMs );

		setRepeatedRefreshSchedulerStatus( 'scheduled' );

		return () => {
			isCancelled = true;
			if ( repeatedRefreshSchedulerTokenRef.current === schedulerToken ) {
				repeatedRefreshSchedulerTokenRef.current = null;
			}
			globalThis.clearTimeout( timeoutId );
		};
	}, [
		__experimentalRefreshDistributedEditingPresenceSnapshot,
		__experimentalSendDistributedEditingPresenceHeartbeat,
		repeatedRefreshDelayMs,
		repeatedRefreshSchedulerTickCount,
		repeatedRefreshState.schedulesNextHeartbeat,
		repeatedRefreshState.status,
		shouldRunRepeatedRefreshScheduler,
	] );

	return (
		<div
			aria-label={ __( 'Distributed editing presence' ) }
			className="editor-distributed-editing-status__presence-roster"
			data-distributed-editing-presence-blocks-publish={ formatDataBoolean(
				rosterState.blocksPublish
			) }
			data-distributed-editing-presence-calls-rest={ formatDataBoolean(
				rosterState.callsRestEndpoint
			) }
			data-distributed-editing-presence-calls-save={ formatDataBoolean(
				rosterState.callsSave
			) }
			data-distributed-editing-presence-changes-post-lock={ formatDataBoolean(
				rosterState.changesPostLock
			) }
			data-distributed-editing-presence-claims-absence={ formatDataBoolean(
				rosterState.claimsAbsence
			) }
			data-distributed-editing-presence-claims-saved={ formatDataBoolean(
				rosterState.claimsSaved
			) }
			data-distributed-editing-presence-exposes-cursor={ formatDataBoolean(
				rosterState.exposesCursorOffset
			) }
			data-distributed-editing-presence-exposes-raw-content={ formatDataBoolean(
				rosterState.exposesRawContent
			) }
			data-distributed-editing-presence-exposes-selection={ formatDataBoolean(
				rosterState.exposesSelection
			) }
			data-distributed-editing-presence-freshness={
				rosterState.freshness
			}
			data-distributed-editing-presence-freshness-indicator-calls-save="false"
			data-distributed-editing-presence-freshness-indicator-changes-post-lock="false"
			data-distributed-editing-presence-freshness-indicator-claims-absence="false"
			data-distributed-editing-presence-freshness-indicator-claims-saved="false"
			data-distributed-editing-presence-freshness-indicator-correctness-independent="true"
			data-distributed-editing-presence-freshness-indicator-exposes-private-fields="false"
			data-distributed-editing-presence-freshness-indicator-state={
				presenceFreshnessIndicator.state
			}
			data-distributed-editing-presence-freshness-indicator-tone={
				presenceFreshnessIndicator.tone
			}
			data-distributed-editing-presence-freshness-indicator-visible={ formatDataBoolean(
				shouldShowPresenceFreshnessIndicator
			) }
			data-distributed-editing-presence-heartbeat-calls-rest={ formatDataBoolean(
				sessionState.presenceHeartbeatCallsRestEndpoint
			) }
			data-distributed-editing-presence-heartbeat-calls-save={ formatDataBoolean(
				sessionState.presenceHeartbeatCallsSave
			) }
			data-distributed-editing-presence-heartbeat-changes-post-lock={ formatDataBoolean(
				sessionState.presenceHeartbeatChangesPostLock
			) }
			data-distributed-editing-presence-heartbeat-claims-saved={ formatDataBoolean(
				sessionState.presenceHeartbeatClaimsSaved
			) }
			data-distributed-editing-presence-heartbeat-command-status={
				heartbeatCommandStatus
			}
			data-distributed-editing-presence-heartbeat-mutates-editor-content={ formatDataBoolean(
				sessionState.presenceHeartbeatMutatesEditorContent
			) }
			data-distributed-editing-presence-heartbeat-raw-session-key={ formatDataBoolean(
				sessionState.presenceHeartbeatRawSessionKeyIncluded
			) }
			data-distributed-editing-presence-heartbeat-local-roster-entry-visible={ formatDataBoolean(
				sessionState.presenceHeartbeatLocalRosterEntryVisible
			) }
			data-distributed-editing-presence-heartbeat-marks-local-editor-current={ formatDataBoolean(
				sessionState.presenceHeartbeatMarksLocalEditorCurrent
			) }
			data-distributed-editing-presence-heartbeat-marks-local-editor-delayed={ formatDataBoolean(
				sessionState.presenceHeartbeatMarksLocalEditorDelayed
			) }
			data-distributed-editing-presence-heartbeat-local-roster-entry-freshness={
				sessionState.presenceHeartbeatLocalRosterEntryFreshness || ''
			}
			data-distributed-editing-presence-heartbeat-records-heartbeat={ formatDataBoolean(
				sessionState.presenceHeartbeatRecordsPresenceHeartbeat
			) }
			data-distributed-editing-presence-heartbeat-status={
				presenceHeartbeatStatus
			}
			data-distributed-editing-presence-refresh-command-status={
				commandStatus
			}
			data-distributed-editing-presence-repeated-refresh-calls-heartbeat-now={ formatDataBoolean(
				repeatedRefreshState.callsHeartbeatEndpointNow
			) }
			data-distributed-editing-presence-repeated-refresh-calls-rest-now={ formatDataBoolean(
				repeatedRefreshState.callsPresenceReadEndpointNow
			) }
			data-distributed-editing-presence-repeated-refresh-calls-save={ formatDataBoolean(
				repeatedRefreshState.callsSave
			) }
			data-distributed-editing-presence-repeated-refresh-changes-post-lock={ formatDataBoolean(
				repeatedRefreshState.changesPostLock
			) }
			data-distributed-editing-presence-repeated-refresh-claims-absence={ formatDataBoolean(
				repeatedRefreshState.claimsAbsence
			) }
			data-distributed-editing-presence-repeated-refresh-claims-saved={ formatDataBoolean(
				repeatedRefreshState.claimsSaved
			) }
			data-distributed-editing-presence-repeated-refresh-scheduler-calls-save="false"
			data-distributed-editing-presence-repeated-refresh-scheduler-changes-post-lock="false"
			data-distributed-editing-presence-repeated-refresh-scheduler-delay-ms={
				repeatedRefreshDelayMs ?? ''
			}
			data-distributed-editing-presence-repeated-refresh-scheduler-mutates-editor-content="false"
			data-distributed-editing-presence-repeated-refresh-scheduler-status={
				repeatedRefreshSchedulerStatus
			}
			data-distributed-editing-presence-repeated-refresh-scheduler-tick-count={
				repeatedRefreshSchedulerTickCount
			}
			data-distributed-editing-presence-repeated-refresh-scheduler-timer-active={ formatDataBoolean(
				shouldRunRepeatedRefreshScheduler
			) }
			data-distributed-editing-presence-repeated-refresh-correctness-independent={ formatDataBoolean(
				repeatedRefreshState.correctnessIndependentOfTransport
			) }
			data-distributed-editing-presence-repeated-refresh-explicit-opt-in={ formatDataBoolean(
				repeatedRefreshState.explicitOptIn
			) }
			data-distributed-editing-presence-repeated-refresh-exposes-raw-content={ formatDataBoolean(
				repeatedRefreshState.exposesRawContent
			) }
			data-distributed-editing-presence-repeated-refresh-local-connection-state={
				repeatedRefreshState.localConnectionState
			}
			data-distributed-editing-presence-repeated-refresh-raw-session-key={ formatDataBoolean(
				repeatedRefreshState.rawSessionKeyIncluded
			) }
			data-distributed-editing-presence-repeated-refresh-runtime-enabled-by-default={ formatDataBoolean(
				repeatedRefreshState.runtimeEnabledByDefault
			) }
			data-distributed-editing-presence-repeated-refresh-schedules-next-heartbeat={ formatDataBoolean(
				repeatedRefreshState.schedulesNextHeartbeat
			) }
			data-distributed-editing-presence-repeated-refresh-schedules-next-refresh={ formatDataBoolean(
				repeatedRefreshState.schedulesNextRefresh
			) }
			data-distributed-editing-presence-repeated-refresh-selected-heartbeat-interval={
				repeatedRefreshState.selectedHeartbeatIntervalSeconds ?? ''
			}
			data-distributed-editing-presence-repeated-refresh-selected-interval={
				repeatedRefreshState.selectedIntervalSeconds ?? ''
			}
			data-distributed-editing-presence-repeated-refresh-starts-polling={ formatDataBoolean(
				repeatedRefreshState.startsPollingImmediately
			) }
			data-distributed-editing-presence-repeated-refresh-status={
				repeatedRefreshState.status
			}
			data-distributed-editing-presence-startup-policy-calls-heartbeat-now={ formatDataBoolean(
				startupPolicyState.callsHeartbeatEndpointNow
			) }
			data-distributed-editing-presence-startup-policy-calls-save={ formatDataBoolean(
				startupPolicyState.callsSave
			) }
			data-distributed-editing-presence-startup-policy-changes-post-lock={ formatDataBoolean(
				startupPolicyState.changesPostLock
			) }
			data-distributed-editing-presence-startup-policy-claims-absence={ formatDataBoolean(
				startupPolicyState.claimsAbsence
			) }
			data-distributed-editing-presence-startup-policy-claims-saved={ formatDataBoolean(
				startupPolicyState.claimsSaved
			) }
			data-distributed-editing-presence-startup-policy-correctness-independent={ formatDataBoolean(
				startupPolicyState.correctnessIndependentOfTransport
			) }
			data-distributed-editing-presence-startup-policy-exposes-raw-content={ formatDataBoolean(
				startupPolicyState.exposesRawContent
			) }
			data-distributed-editing-presence-startup-policy-host-profile={
				startupPolicyState.hostProfile ?? ''
			}
			data-distributed-editing-presence-startup-policy-may-auto-heartbeat={ formatDataBoolean(
				startupPolicyState.maySendInitialHeartbeatAutomatically
			) }
			data-distributed-editing-presence-startup-policy-raw-session-key={ formatDataBoolean(
				startupPolicyState.rawSessionKeyIncluded
			) }
			data-distributed-editing-presence-startup-policy-reason={
				startupPolicyState.reason
			}
			data-distributed-editing-presence-startup-policy-requires-explicit-enablement={ formatDataBoolean(
				startupPolicyState.requiresExplicitEnablement
			) }
			data-distributed-editing-presence-startup-policy-selected-delay={
				startupPolicyState.selectedInitialHeartbeatDelaySeconds ?? ''
			}
			data-distributed-editing-presence-startup-policy-server-contact={
				startupPolicyState.serverContact
			}
			data-distributed-editing-presence-startup-policy-slow-auto-heartbeat={ formatDataBoolean(
				startupPolicyState.slowAutomaticHeartbeatAllowed
			) }
			data-distributed-editing-presence-startup-policy-starts-polling-now={ formatDataBoolean(
				startupPolicyState.startsPollingNow
			) }
			data-distributed-editing-presence-startup-policy-starts-timer-now={ formatDataBoolean(
				startupPolicyState.startsTimerNow
			) }
			data-distributed-editing-presence-startup-policy-status={
				startupPolicyState.status
			}
			data-distributed-editing-presence-startup-policy-visible={ formatDataBoolean(
				shouldShowPresenceStartupPolicy
			) }
			data-distributed-editing-presence-startup-policy-writes-presence-now={ formatDataBoolean(
				startupPolicyState.writesPresenceNow
			) }
			data-distributed-editing-presence-startup-heartbeat-runtime-calls-heartbeat-endpoint={ formatDataBoolean(
				startupHeartbeatRuntimeState.callsHeartbeatEndpoint
			) }
			data-distributed-editing-presence-startup-heartbeat-runtime-calls-presence-read-endpoint="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-calls-save="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-changes-post-lock="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-claims-absence="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-claims-saved="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-blocked-by-storage-readiness={ formatDataBoolean(
				startupHeartbeatRuntimeState.blockedByStorageReadiness
			) }
			data-distributed-editing-presence-startup-heartbeat-runtime-can-retry-after-install={ formatDataBoolean(
				startupHeartbeatRuntimeState.canRetryAfterInstall
			) }
			data-distributed-editing-presence-startup-heartbeat-runtime-correctness-independent="true"
			data-distributed-editing-presence-startup-heartbeat-runtime-delay-ms={
				startupHeartbeatRuntimeState.delayMs ?? ''
			}
			data-distributed-editing-presence-startup-heartbeat-runtime-exposes-raw-content="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-mutates-editor-content="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-mutates-persisted-post-content="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-raw-session-key="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-starts-polling="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-status={
				startupHeartbeatRuntimeState.status
			}
			data-distributed-editing-presence-startup-heartbeat-runtime-storage-ready={ formatDataBoolean(
				startupHeartbeatRuntimeState.storageTableReady
			) }
			data-distributed-editing-presence-startup-heartbeat-runtime-timer-active={ formatDataBoolean(
				startupHeartbeatRuntimeState.timerActive
			) }
			data-distributed-editing-presence-startup-heartbeat-runtime-transport-required-for-correctness="false"
			data-distributed-editing-presence-startup-heartbeat-runtime-writes-presence={ formatDataBoolean(
				startupHeartbeatRuntimeState.writesPresence
			) }
			data-distributed-editing-presence-storage-readiness-automatic-install={ formatDataBoolean(
				presenceStorageReadinessState.automaticPerRequestInstall
			) }
			data-distributed-editing-presence-storage-readiness-calls-save={ formatDataBoolean(
				presenceStorageReadinessState.callsSave
			) }
			data-distributed-editing-presence-storage-readiness-changes-post-lock={ formatDataBoolean(
				presenceStorageReadinessState.changesPostLock
			) }
			data-distributed-editing-presence-storage-readiness-claims-absence={ formatDataBoolean(
				presenceStorageReadinessState.claimsAbsence
			) }
			data-distributed-editing-presence-storage-readiness-claims-saved={ formatDataBoolean(
				presenceStorageReadinessState.claimsSaved
			) }
			data-distributed-editing-presence-storage-readiness-content-free={ formatDataBoolean(
				presenceStorageReadinessState.contentFree
			) }
			data-distributed-editing-presence-storage-readiness-correctness-independent={ formatDataBoolean(
				presenceStorageReadinessState.correctnessIndependentOfTransport
			) }
			data-distributed-editing-presence-storage-readiness-diagnostic-only={ formatDataBoolean(
				presenceStorageReadinessState.diagnosticOnly
			) }
			data-distributed-editing-presence-storage-readiness-expected-startup-heartbeat={
				presenceStorageReadinessState.expectedStartupHeartbeatStatus
			}
			data-distributed-editing-presence-storage-readiness-exposes-private-fields={ formatDataBoolean(
				presenceStorageReadinessState.exposesPrivateFields
			) }
			data-distributed-editing-presence-storage-readiness-exposes-raw-content={ formatDataBoolean(
				presenceStorageReadinessState.exposesRawContent
			) }
			data-distributed-editing-presence-storage-readiness-installs-table={ formatDataBoolean(
				presenceStorageReadinessState.installsPresenceTable
			) }
			data-distributed-editing-presence-storage-readiness-schema-current={ formatDataBoolean(
				presenceStorageReadinessState.schemaCurrent
			) }
			data-distributed-editing-presence-storage-readiness-setup-action={
				presenceStorageReadinessState.setupAction
			}
			data-distributed-editing-presence-storage-readiness-setup-required={ formatDataBoolean(
				presenceStorageReadinessState.setupRequired
			) }
			data-distributed-editing-presence-storage-readiness-status={
				presenceStorageReadinessState.status
			}
			data-distributed-editing-presence-storage-readiness-table-ready={ formatDataBoolean(
				presenceStorageReadinessState.tableExists
			) }
			data-distributed-editing-presence-storage-readiness-transport-required-for-correctness={ formatDataBoolean(
				presenceStorageReadinessState.transportRequiredForCorrectness
			) }
			data-distributed-editing-presence-storage-readiness-visible={ formatDataBoolean(
				shouldShowPresenceStorageReadiness
			) }
			data-distributed-editing-presence-storage-readiness-recheck-available={ formatDataBoolean(
				presenceStorageReadinessRecheckState.available
			) }
			data-distributed-editing-presence-storage-readiness-recheck-calls-rest-on-click={ formatDataBoolean(
				presenceStorageReadinessRecheckState.callsRestOnClick
			) }
			data-distributed-editing-presence-storage-readiness-recheck-calls-save="false"
			data-distributed-editing-presence-storage-readiness-recheck-changes-post-lock="false"
			data-distributed-editing-presence-storage-readiness-recheck-claims-absence="false"
			data-distributed-editing-presence-storage-readiness-recheck-claims-saved="false"
			data-distributed-editing-presence-storage-readiness-recheck-content-free="true"
			data-distributed-editing-presence-storage-readiness-recheck-correctness-independent="true"
			data-distributed-editing-presence-storage-readiness-recheck-exposes-private-fields="false"
			data-distributed-editing-presence-storage-readiness-recheck-exposes-raw-content="false"
			data-distributed-editing-presence-storage-readiness-recheck-installs-table="false"
			data-distributed-editing-presence-storage-readiness-recheck-mutates-editor-content="false"
			data-distributed-editing-presence-storage-readiness-recheck-mutates-persisted-post-content="false"
			data-distributed-editing-presence-storage-readiness-recheck-records-heartbeat="false"
			data-distributed-editing-presence-storage-readiness-recheck-starts-polling="false"
			data-distributed-editing-presence-storage-readiness-recheck-status={
				presenceStorageReadinessRecheckState.status
			}
			data-distributed-editing-presence-storage-readiness-recheck-writes-presence="false"
			data-distributed-editing-presence-storage-setup-affordance-calls-save="false"
			data-distributed-editing-presence-storage-setup-affordance-changes-post-lock="false"
			data-distributed-editing-presence-storage-setup-affordance-correctness-independent="true"
			data-distributed-editing-presence-storage-setup-affordance-exposes-private-fields="false"
			data-distributed-editing-presence-storage-setup-affordance-exposes-raw-content="false"
			data-distributed-editing-presence-storage-setup-affordance-href={
				presenceStorageSetupAffordanceState.settingsHref
			}
			data-distributed-editing-presence-storage-setup-affordance-opens-settings-new-tab={ formatDataBoolean(
				presenceStorageSetupAffordanceState.opensSettingsInNewTab
			) }
			data-distributed-editing-presence-storage-setup-affordance-mutates-editor-content="false"
			data-distributed-editing-presence-storage-setup-affordance-mutates-persisted-post-content="false"
			data-distributed-editing-presence-storage-setup-affordance-navigates-to-writing-settings={ formatDataBoolean(
				presenceStorageSetupAffordanceState.navigatesToWritingSettings
			) }
			data-distributed-editing-presence-storage-setup-affordance-reload-action-available="false"
			data-distributed-editing-presence-storage-setup-affordance-reload-prompt-visible={ formatDataBoolean(
				presenceStorageSetupAffordanceState.reloadPromptVisible
			) }
			data-distributed-editing-presence-storage-setup-affordance-reload-requires-protected-local-changes={ formatDataBoolean(
				presenceStorageSetupAffordanceState.reloadRequiresProtectedLocalChanges
			) }
			data-distributed-editing-presence-storage-setup-affordance-refresh-instruction-visible={ formatDataBoolean(
				presenceStorageSetupAffordanceState.refreshInstructionVisible
			) }
			data-distributed-editing-presence-storage-setup-affordance-reloads-editor-now="false"
			data-distributed-editing-presence-storage-setup-affordance-runs-setup-from-editor="false"
			data-distributed-editing-presence-storage-setup-affordance-settings-opened={ formatDataBoolean(
				presenceStorageSetupAffordanceState.settingsOpened
			) }
			data-distributed-editing-presence-storage-setup-affordance-status={
				presenceStorageSetupAffordanceState.status
			}
			data-distributed-editing-presence-storage-setup-affordance-visible={ formatDataBoolean(
				presenceStorageSetupAffordanceState.visible
			) }
			data-distributed-editing-presence-row-treatment="compact-status-badges"
			data-distributed-editing-presence-row-treatment-accessible="true"
			data-distributed-editing-presence-row-treatment-calls-save="false"
			data-distributed-editing-presence-row-treatment-changes-post-lock="false"
			data-distributed-editing-presence-row-treatment-claims-absence="false"
			data-distributed-editing-presence-row-treatment-correctness-independent="true"
			data-distributed-editing-presence-row-treatment-exposes-private-fields="false"
			data-distributed-editing-presence-row-visual-treatment="subtle-status-stripe"
			data-distributed-editing-presence-row-visual-treatment-accessible="true"
			data-distributed-editing-presence-row-visual-treatment-color-only="false"
			data-distributed-editing-presence-row-visual-treatment-content-free="true"
			data-distributed-editing-presence-row-visual-treatment-layout-stable="true"
			data-distributed-editing-presence-mutates-editor-content={ formatDataBoolean(
				rosterState.mutatesEditorContent
			) }
			data-distributed-editing-presence-status={ rosterState.status }
			data-distributed-editing-presence-summary-calls-save="false"
			data-distributed-editing-presence-summary-changes-post-lock="false"
			data-distributed-editing-presence-summary-claims-absence="false"
			data-distributed-editing-presence-summary-claims-saved="false"
			data-distributed-editing-presence-summary-correctness-independent="true"
			data-distributed-editing-presence-summary-current-count={
				rosterState.currentVisibleCount
			}
			data-distributed-editing-presence-summary-delayed-count={
				rosterState.delayedVisibleCount
			}
			data-distributed-editing-presence-summary-exposes-private-fields="false"
			data-distributed-editing-presence-summary-hidden-count={
				rosterState.hiddenCount
			}
			data-distributed-editing-presence-summary-has-accessible-name="true"
			data-distributed-editing-presence-summary-live-region="polite"
			data-distributed-editing-presence-summary-scan-layout="single-line-primary-cue"
			data-distributed-editing-presence-refresh-hint={
				rosterState.copy.refreshHint
			}
			data-distributed-editing-presence-refresh-hint-visible={ formatDataBoolean(
				shouldShowPresenceRefreshHint
			) }
			data-distributed-editing-presence-other-editor-cue={
				rosterState.copy.otherEditorActivityCue
			}
			data-distributed-editing-presence-other-editor-cue-blocks-editing="false"
			data-distributed-editing-presence-other-editor-cue-calls-save="false"
			data-distributed-editing-presence-other-editor-cue-changes-post-lock="false"
			data-distributed-editing-presence-other-editor-cue-content-free="true"
			data-distributed-editing-presence-other-editor-cue-exposes-private-fields="false"
			data-distributed-editing-presence-other-editor-cue-claims-absence="false"
			data-distributed-editing-presence-other-editor-cue-tone={
				rosterState.copy.otherEditorActivityCueTone
			}
			data-distributed-editing-presence-other-editor-cue-treats-delayed-as-error="false"
			data-distributed-editing-presence-other-editor-cue-visible={ formatDataBoolean(
				Boolean( rosterState.copy.otherEditorActivityCue )
			) }
			data-distributed-editing-presence-actions-visible={ formatDataBoolean(
				shouldShowPresenceActions
			) }
			data-distributed-editing-presence-label={ rosterState.copy.label }
			data-distributed-editing-presence-summary-expired-count={
				rosterState.expiredCount
			}
			data-distributed-editing-presence-summary-local-current-tab-visible={ formatDataBoolean(
				rosterState.localCurrentTabVisible
			) }
			data-distributed-editing-presence-summary-remote-current-count={
				rosterState.remoteCurrentVisibleCount
			}
			data-distributed-editing-presence-summary-remote-delayed-count={
				rosterState.remoteDelayedVisibleCount
			}
			data-distributed-editing-presence-summary-same-user-other-tab-visible={ formatDataBoolean(
				rosterState.sameUserOtherTabVisible
			) }
			data-distributed-editing-presence-visible-count={
				rosterState.visibleCount
			}
			role="group"
		>
			<div
				aria-label={ presenceSummaryAccessibilityLabel }
				aria-live="polite"
				className={ presenceSummaryClassName }
				data-distributed-editing-presence-other-editor-cue-copy={
					rosterState.copy.otherEditorActivityCue
				}
				data-distributed-editing-presence-summary-visible="true"
			>
				{ presenceSummaryText }
			</div>
			{ shouldShowPresenceRefreshHint && (
				<div
					className="editor-distributed-editing-status__presence-refresh-hint"
					data-distributed-editing-presence-refresh-hint-copy={
						rosterState.copy.refreshHint
					}
				>
					{ rosterState.copy.refreshHint }
				</div>
			) }
			{ shouldShowPresenceFreshnessIndicator && (
				<div
					aria-live="polite"
					className="editor-distributed-editing-status__presence-freshness-indicator"
					data-distributed-editing-presence-freshness-indicator-visible="true"
				>
					<strong>{ presenceFreshnessIndicator.label }</strong>
					<div>{ presenceFreshnessIndicator.summary }</div>
				</div>
			) }
			{ shouldShowPresenceStartupPolicy && (
				<div
					className="editor-distributed-editing-status__presence-startup-policy"
					data-distributed-editing-presence-startup-policy-visible="true"
				>
					<strong>{ startupPolicyState.copy.label }</strong>
					<div>{ startupPolicyState.copy.summary }</div>
					<div
						aria-live="polite"
						className="editor-distributed-editing-status__presence-startup-heartbeat-runtime"
						data-distributed-editing-presence-startup-heartbeat-runtime-visible="true"
					>
						<strong>
							{ startupHeartbeatRuntimeState.copy.label }
						</strong>
						<div>{ startupHeartbeatRuntimeState.copy.summary }</div>
					</div>
				</div>
			) }
			{ shouldShowPresenceStorageReadiness && (
				<div
					className="editor-distributed-editing-status__presence-storage-readiness"
					data-distributed-editing-presence-storage-readiness-visible="true"
				>
					<strong>
						{ presenceStorageReadinessState.copy.label }
					</strong>
					<div>{ presenceStorageReadinessState.copy.summary }</div>
					{ presenceStorageSetupAffordanceState.visible && (
						<div
							className="editor-distributed-editing-status__presence-storage-setup-affordance"
							data-distributed-editing-presence-storage-setup-affordance-panel-visible="true"
						>
							<strong>
								{
									presenceStorageSetupAffordanceState.copy
										.label
								}
							</strong>
							<div>
								{
									presenceStorageSetupAffordanceState.copy
										.summary
								}
							</div>
							<Button
								variant="secondary"
								href={
									presenceStorageSetupAffordanceState.settingsHref
								}
								onClick={ handleOpenPresenceStorageSetup }
								rel="noreferrer"
								target="_blank"
								__next40pxDefaultSize
							>
								{ __( 'Open Writing settings' ) }
							</Button>
							<Button
								variant="secondary"
								onClick={
									handleRecheckPresenceStorageReadiness
								}
								type="button"
								isBusy={
									presenceStorageReadinessRecheckState.status ===
									'checking'
								}
								accessibleWhenDisabled
								disabled={
									presenceStorageReadinessRecheckState.status ===
									'checking'
								}
								__next40pxDefaultSize
							>
								{ __( 'Check setup status' ) }
							</Button>
						</div>
					) }
					{ presenceStorageReadinessRecheckState.visible && (
						<div
							aria-live="polite"
							className="editor-distributed-editing-status__presence-storage-readiness-recheck"
							role="status"
						>
							<strong>
								{
									presenceStorageReadinessRecheckState.copy
										.label
								}
							</strong>
							<div>
								{
									presenceStorageReadinessRecheckState.copy
										.summary
								}
							</div>
						</div>
					) }
				</div>
			) }
			{ shouldShowPresenceActions && (
				<div className="editor-distributed-editing-status__presence-actions">
					<Button
						variant="tertiary"
						onClick={ handleRefreshPresence }
						isBusy={ commandStatus === 'refreshing' }
						accessibleWhenDisabled
						disabled={ commandStatus === 'refreshing' }
						__next40pxDefaultSize
					>
						{ __( 'Refresh editing list' ) }
					</Button>
					<Button
						variant="tertiary"
						onClick={ handleSendPresenceHeartbeat }
						isBusy={ heartbeatCommandStatus === 'sending' }
						accessibleWhenDisabled
						disabled={ heartbeatCommandStatus === 'sending' }
						__next40pxDefaultSize
					>
						{ __( 'Update my presence' ) }
					</Button>
				</div>
			) }
			{ shouldShowPresenceRefreshCommandStatus && (
				<div role="status">
					{ getPresenceRefreshCommandStatusText( commandStatus ) }
				</div>
			) }
			{ shouldShowPresenceHeartbeatCommandStatus && (
				<div role="status">
					{ getPresenceHeartbeatCommandStatusText(
						heartbeatCommandStatus
					) }
				</div>
			) }
			{ rosterState.visibleCount > 0 && (
				<ul
					aria-label={ __( 'Visible editors' ) }
					className="editor-distributed-editing-status__presence-roster-list"
					data-distributed-editing-presence-row-treatment-list="compact-status-badges"
					data-distributed-editing-presence-row-visual-treatment-list="subtle-status-stripe"
				>
					{ rosterState.entries.map( ( entry ) => {
						const displayName =
							getPresenceRosterEntryDisplayName( entry );
						const statusLabel =
							getPresenceRosterEntryStatusLabel( entry );
						const statusTone =
							getPresenceRosterEntryStatusTone( entry );
						const rowClassName = [
							'editor-distributed-editing-status__presence-roster-item',
							`editor-distributed-editing-status__presence-roster-item--${ statusTone }`,
						].join( ' ' );
						const avatarClassName = [
							'editor-distributed-editing-status__presence-roster-avatar',
							`editor-distributed-editing-status__presence-roster-avatar--${ statusTone }`,
						].join( ' ' );
						const badgeClassName = [
							'editor-distributed-editing-status__presence-roster-badge',
							`editor-distributed-editing-status__presence-roster-badge--${ statusTone }`,
						].join( ' ' );

						return (
							<li
								aria-label={ sprintf(
									/* translators: 1: editor display name, 2: presence status. */
									__( '%1$s, %2$s' ),
									displayName,
									statusLabel
								) }
								className={ rowClassName }
								data-distributed-editing-presence-row-current={ formatDataBoolean(
									isPresenceRosterEntryCurrent( entry )
								) }
								data-distributed-editing-presence-row-exposes-cursor="false"
								data-distributed-editing-presence-row-exposes-private-fields="false"
								data-distributed-editing-presence-row-exposes-raw-content="false"
								data-distributed-editing-presence-row-exposes-selection="false"
								data-distributed-editing-presence-row-freshness={
									statusTone
								}
								data-distributed-editing-presence-row-has-avatar-initial="true"
								data-distributed-editing-presence-row-has-status-affordance="true"
								data-distributed-editing-presence-row-relationship={ getPresenceRosterEntryRelationship(
									entry
								) }
								data-distributed-editing-presence-row-scan-treatment="avatar-name-status-chip"
								data-distributed-editing-presence-row-status-affordance="dot-and-label"
								data-distributed-editing-presence-row-status-tone={
									statusTone
								}
								data-distributed-editing-presence-row-treatment="compact-status-badge"
								data-distributed-editing-presence-row-visual-treatment="subtle-status-stripe"
								data-distributed-editing-presence-row-visual-treatment-color-only="false"
								data-distributed-editing-presence-row-visual-treatment-layout-stable="true"
								key={ entry.key }
							>
								<span
									aria-hidden="true"
									className={ avatarClassName }
								>
									{ getPresenceRosterEntryAvatarText(
										entry
									) }
								</span>
								<span className="editor-distributed-editing-status__presence-roster-entry">
									<span className="editor-distributed-editing-status__presence-roster-name">
										{ displayName }
									</span>
									<span className={ badgeClassName }>
										{ statusLabel }
									</span>
								</span>
							</li>
						);
					} ) }
				</ul>
			) }
		</div>
	);
}

function getPresenceStorageReadinessState( readiness = {} ) {
	const status = [
		'ready',
		'setup_required',
		'upgrade_required',
		'feature_disabled',
	].includes( readiness?.status )
		? readiness.status
		: 'unknown';
	const tableExists = Boolean( readiness?.tableExists );
	const schemaCurrent = Boolean( readiness?.schemaCurrent );
	const setupRequired = Boolean( readiness?.setupRequired );
	const expectedStartupHeartbeatStatus =
		readiness?.expectedStartupHeartbeatStatus || 'unknown';
	let label = __( 'Presence storage status' );
	let summary = __(
		'Presence storage readiness has not been reported yet. Editing can continue.'
	);

	if ( status === 'ready' ) {
		label = __( 'Presence storage ready' );
		summary = __(
			'Presence storage is ready. Startup presence can record liveness without extra setup.'
		);
	} else if ( status === 'setup_required' ) {
		label = __( 'Presence storage setup needed' );
		summary = __(
			'Presence storage is not set up yet. Automatic startup presence may be delayed until setup is run deliberately.'
		);
	} else if ( status === 'upgrade_required' ) {
		label = __( 'Presence storage update needed' );
		summary = __(
			'Presence storage exists but needs a deliberate setup check before startup presence can be treated as ready.'
		);
	} else if ( status === 'feature_disabled' ) {
		label = __( 'Presence storage idle' );
		summary = __(
			'Presence storage waits while Distributed Editing is disabled.'
		);
	}

	return {
		status,
		tableExists,
		schemaCurrent,
		expectedStartupHeartbeatStatus,
		setupRequired,
		setupAction:
			readiness?.setupAction || 'call_wp_de_rtc_install_presence_table',
		automaticPerRequestInstall: Boolean(
			readiness?.automaticPerRequestInstall
		),
		callsSave: Boolean( readiness?.callsSave ),
		changesPostLock: Boolean( readiness?.changesPostLock ),
		claimsAbsence: Boolean( readiness?.claimsAbsence ),
		claimsSaved: Boolean( readiness?.claimsSaved ),
		contentFree: readiness?.contentFree !== false,
		correctnessIndependentOfTransport:
			readiness?.correctnessIndependentOfTransport !== false,
		diagnosticOnly: readiness?.diagnosticOnly !== false,
		exposesPrivateFields: Boolean(
			readiness?.exposesUserIds ||
				readiness?.exposesLogins ||
				readiness?.exposesEmail ||
				readiness?.exposesCursorOffset ||
				readiness?.exposesSelection
		),
		exposesRawContent: Boolean( readiness?.exposesRawContent ),
		installsPresenceTable: Boolean( readiness?.installsPresenceTable ),
		transportRequiredForCorrectness: Boolean(
			readiness?.transportRequiredForCorrectness
		),
		copy: {
			label,
			summary,
		},
	};
}

function getPresenceStorageSetupAffordanceState(
	readinessState,
	navigationStatus = 'idle'
) {
	const visible = [ 'setup_required', 'upgrade_required' ].includes(
		readinessState.status
	);
	const settingsOpened = visible && navigationStatus === 'settings_opened';
	const settingsHref = 'options-writing.php#wp_de_rtc_enabled';
	let label = __( 'Presence setup in Writing settings' );
	let summary = __(
		'Open Writing settings to run the deliberate presence storage setup. After setup completes, check status here or reload this editor after protecting local changes.'
	);

	if ( readinessState.status === 'upgrade_required' ) {
		label = __( 'Presence storage update in Writing settings' );
		summary = __(
			'Open Writing settings to run the deliberate presence storage setup check. After setup completes, check status here or reload this editor after protecting local changes.'
		);
	}

	if ( settingsOpened ) {
		label = __( 'Check after setup finishes' );
		summary = __(
			'When setup completes in Writing settings, check setup status here. If local changes are sensitive, reload only after protecting them.'
		);
	}

	let status = 'hidden';

	if ( settingsOpened ) {
		status = 'settings_opened_reload_recommended';
	} else if ( visible ) {
		status = readinessState.status;
	}

	return {
		status,
		visible,
		settingsHref,
		settingsOpened,
		opensSettingsInNewTab: visible,
		navigatesToWritingSettings: visible,
		refreshInstructionVisible: visible,
		reloadPromptVisible: settingsOpened,
		reloadRequiresProtectedLocalChanges: visible,
		copy: {
			label,
			summary,
		},
	};
}

function getPresenceStorageReadinessRecheckState(
	status = 'idle',
	setupAffordanceState = {}
) {
	const available = Boolean( setupAffordanceState.visible );
	let label = __( 'Presence setup status' );
	let summary = __(
		'Presence storage setup status has not been checked again in this editor.'
	);

	if ( status === 'checking' ) {
		label = __( 'Checking presence setup' );
		summary = __(
			'Checking whether presence storage setup completed. This does not save, write presence, or change the post.'
		);
	} else if ( status === 'ready' ) {
		label = __( 'Presence setup confirmed' );
		summary = __(
			'Presence storage is ready in this editor. Startup presence can proceed when enabled.'
		);
	} else if ( status === 'setup_required' ) {
		label = __( 'Presence setup still needed' );
		summary = __(
			'Presence storage still needs setup. Editing can continue; saves do not depend on presence.'
		);
	} else if ( status === 'upgrade_required' ) {
		label = __( 'Presence storage update still needed' );
		summary = __(
			'Presence storage still needs an update. Editing can continue; saves do not depend on presence.'
		);
	} else if ( status === 'feature_disabled' ) {
		label = __( 'Distributed Editing disabled' );
		summary = __(
			'The setup status check could not continue because Distributed Editing is disabled for this post.'
		);
	} else if ( status === 'permission_denied' ) {
		label = __( 'Setup status unavailable' );
		summary = __(
			'The setup status check could not continue because editing permission changed.'
		);
	} else if ( status === 'route_mismatch' ) {
		label = __( 'Setup status route mismatch' );
		summary = __(
			'The setup status check targeted a different post route. Local editing state is unchanged.'
		);
	} else if ( status === 'failed' || status === 'checked' ) {
		label = __( 'Setup status check failed' );
		summary = __(
			'The setup status check did not return a usable readiness state. Local editing state is unchanged.'
		);
	}

	return {
		status,
		available,
		visible: status !== 'idle',
		callsRestOnClick: available,
		copy: {
			label,
			summary,
		},
	};
}

function getPresenceFreshnessIndicator( {
	commandStatus,
	heartbeatCommandStatus,
	presenceStorageReadinessState,
	repeatedRefreshDelayMs,
	repeatedRefreshSchedulerStatus,
	repeatedRefreshState,
	rosterState,
	startupHeartbeatRuntimeState,
} ) {
	if (
		repeatedRefreshState.status ===
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT ||
		repeatedRefreshSchedulerStatus === 'paused'
	) {
		return {
			state: 'paused',
			tone: 'warning',
			label: __( 'Presence updates paused' ),
			summary: __(
				'Server contact is degraded. Editing can continue; saves do not depend on presence.'
			),
		};
	}

	if (
		presenceStorageReadinessState.status === 'setup_required' ||
		presenceStorageReadinessState.status === 'upgrade_required'
	) {
		return {
			state: 'degraded',
			tone: 'warning',
			label: __( 'Presence live updates degraded' ),
			summary: __(
				'Presence storage is not ready. Editing can continue; saves do not depend on presence.'
			),
		};
	}

	if (
		repeatedRefreshSchedulerStatus === 'degraded' ||
		repeatedRefreshSchedulerStatus === 'failed' ||
		heartbeatCommandStatus === 'degraded' ||
		heartbeatCommandStatus === 'failed' ||
		commandStatus === 'failed' ||
		rosterState.status === 'degraded' ||
		rosterState.freshness === 'stale'
	) {
		return {
			state: 'delayed',
			tone: 'warning',
			label: __( 'Presence may be delayed' ),
			summary: __(
				'Editing can continue. The editing list may update late.'
			),
		};
	}

	if (
		repeatedRefreshState.status ===
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED &&
		repeatedRefreshState.explicitOptIn
	) {
		const intervalSummary = getPresenceRefreshIntervalSummary(
			repeatedRefreshDelayMs
		);

		return {
			state: 'connected',
			tone: 'success',
			label: __( 'Presence connected' ),
			summary: intervalSummary
				? sprintf(
						/* translators: %s: human-readable repeated presence refresh interval. */
						__( 'Editing list updates %s.' ),
						intervalSummary
				  )
				: __( 'Editing list updates in the background.' ),
		};
	}

	if (
		presenceStorageReadinessState.status === 'ready' &&
		startupHeartbeatRuntimeState.status === 'sent'
	) {
		return {
			state: 'ready',
			tone: 'success',
			label: __( 'Presence ready' ),
			summary: __(
				'Your startup presence was recorded. Editing can continue if later updates are delayed.'
			),
		};
	}

	if (
		presenceStorageReadinessState.status === 'ready' &&
		startupHeartbeatRuntimeState.status === 'scheduled'
	) {
		return {
			state: 'ready',
			tone: 'info',
			label: __( 'Presence startup scheduled' ),
			summary: __(
				'Presence storage is ready and the startup update is waiting on its configured delay. Saves do not depend on presence.'
			),
		};
	}

	if ( presenceStorageReadinessState.status === 'ready' ) {
		return {
			state: 'ready',
			tone: 'success',
			label: __( 'Presence ready' ),
			summary: __(
				'Presence storage is ready. Automatic presence can begin when enabled.'
			),
		};
	}

	if ( rosterState.freshness === 'recent' ) {
		return {
			state: 'delayed',
			tone: 'warning',
			label: __( 'Presence may be delayed' ),
			summary: __(
				'Editing can continue. The editing list may update late.'
			),
		};
	}

	return {
		state: 'manual',
		tone: 'info',
		label: __( 'Presence updates on request' ),
		summary: __(
			'Use Refresh editing list to check again. Editing can continue.'
		),
	};
}

function getPresenceRepeatedRefreshDelayMs( repeatedRefreshState ) {
	const selectedIntervalSeconds =
		repeatedRefreshState.selectedIntervalSeconds;

	return Number.isInteger( selectedIntervalSeconds ) &&
		selectedIntervalSeconds > 0
		? selectedIntervalSeconds * 1000
		: null;
}

function getPresenceStartupHeartbeatDelayMs( startupPolicyState ) {
	const selectedDelaySeconds =
		startupPolicyState.selectedInitialHeartbeatDelaySeconds;

	return Number.isInteger( selectedDelaySeconds ) && selectedDelaySeconds > 0
		? selectedDelaySeconds * 1000
		: null;
}

function getPresenceStartupHeartbeatRuntimeState( {
	delayMs,
	startupHeartbeatPolicyAllowsRuntime,
	storageReadyForStartupHeartbeat,
	shouldRunStartupHeartbeatRuntime,
	startupPolicyState,
	status,
} ) {
	const blockedByStorageReadiness =
		startupHeartbeatPolicyAllowsRuntime &&
		! storageReadyForStartupHeartbeat;
	const effectiveStatus = blockedByStorageReadiness
		? 'degraded_storage_setup_required'
		: status;
	const timerActive = effectiveStatus === 'scheduled';
	const didAttemptHeartbeat = [
		'scheduled',
		'sending',
		'sent',
		'degraded',
		'failed',
	].includes( effectiveStatus );
	let label = __( 'Presence startup heartbeat' );
	let summary = __( 'Initial presence updates manually.' );

	if (
		startupPolicyState.status ===
		DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.PAUSED_DEGRADED_TRANSPORT
	) {
		summary = __(
			'Initial presence waits while server contact is degraded.'
		);
	} else if ( blockedByStorageReadiness ) {
		label = __( 'Presence startup delayed' );
		summary = __(
			'Presence storage setup is required before automatic startup presence can begin.'
		);
	} else if ( effectiveStatus === 'scheduled' && delayMs ) {
		label = __( 'Presence startup scheduled' );
		summary =
			delayMs === 1000
				? __( 'Initial presence will update after about a second.' )
				: sprintf(
						/* translators: %d: initial presence heartbeat delay in seconds. */
						__(
							'Initial presence will update after about %d seconds.'
						),
						delayMs / 1000
				  );
	} else if ( effectiveStatus === 'sending' ) {
		summary = __( 'Initial presence is updating.' );
	} else if ( effectiveStatus === 'sent' ) {
		summary = __(
			'Initial presence updated. Editing can continue if later updates are delayed.'
		);
	} else if ( effectiveStatus === 'degraded' ) {
		summary = __(
			'Initial presence update was delayed. Editing can continue.'
		);
	} else if ( effectiveStatus === 'failed' ) {
		summary = __( 'Initial presence update failed. Editing can continue.' );
	} else if ( shouldRunStartupHeartbeatRuntime && delayMs ) {
		summary = __( 'Initial presence is waiting for its startup timer.' );
	}

	if ( effectiveStatus === 'paused' ) {
		label = __( 'Presence startup paused' );
	}

	return {
		status: effectiveStatus,
		timerActive,
		delayMs,
		blockedByStorageReadiness,
		canRetryAfterInstall: blockedByStorageReadiness,
		storageTableReady: storageReadyForStartupHeartbeat,
		callsHeartbeatEndpoint: didAttemptHeartbeat,
		writesPresence:
			didAttemptHeartbeat &&
			effectiveStatus !== 'degraded' &&
			effectiveStatus !== 'failed',
		copy: {
			label,
			summary,
		},
	};
}

function getPresenceRefreshIntervalSummary( repeatedRefreshDelayMs ) {
	if (
		! Number.isInteger( repeatedRefreshDelayMs ) ||
		repeatedRefreshDelayMs <= 0
	) {
		return null;
	}

	const intervalSeconds = repeatedRefreshDelayMs / 1000;

	if ( ! Number.isInteger( intervalSeconds ) || intervalSeconds <= 0 ) {
		return null;
	}

	if ( intervalSeconds === 1 ) {
		return __( 'about every second' );
	}

	return sprintf(
		/* translators: %d: repeated presence refresh interval in seconds. */
		__( 'about every %d seconds' ),
		intervalSeconds
	);
}

function getPresenceRefreshCommandStatusText( commandStatus ) {
	if ( commandStatus === 'refreshing' ) {
		return __( 'Refreshing editing list.' );
	}

	if ( commandStatus === 'refreshed' ) {
		return __( 'Editing list refreshed.' );
	}

	return __( 'Editing list refresh failed. Presence may be delayed.' );
}

function getPresenceHeartbeatCommandStatusText( commandStatus ) {
	if ( commandStatus === 'sending' ) {
		return __( 'Updating presence.' );
	}

	if ( commandStatus === 'sent' ) {
		return __( 'Presence updated.' );
	}

	if ( commandStatus === 'degraded' ) {
		return __( 'Presence update delayed. Editing can continue.' );
	}

	return __( 'Presence update failed. Editing can continue.' );
}

function getPresenceRosterEntryDisplayName( entry ) {
	if ( entry.relationship === 'current_user_current_tab' ) {
		return __( 'This tab' );
	}

	if ( entry.relationship === 'same_user_other_tab' ) {
		return __( 'Another tab' );
	}

	if ( entry.identityVisibility === 'anonymous' ) {
		return __( 'Another editor' );
	}

	return entry.displayName || __( 'Another editor' );
}

function getPresenceRosterEntryRelationship( entry ) {
	if (
		entry.relationship === 'current_user_current_tab' ||
		entry.relationship === 'same_user_other_tab' ||
		entry.relationship === 'other_user'
	) {
		return entry.relationship;
	}

	return 'other_user';
}

function isPresenceRosterEntryCurrent( entry ) {
	return entry.freshness === 'current' || entry.freshness === 'active';
}

function getPresenceRosterEntryStatusLabel( entry ) {
	return isPresenceRosterEntryCurrent( entry )
		? __( 'Active now' )
		: __( 'Presence may be delayed' );
}

function getPresenceRosterEntryStatusTone( entry ) {
	return isPresenceRosterEntryCurrent( entry ) ? 'current' : 'delayed';
}

function getPresenceRosterEntryAvatarText( entry ) {
	if ( entry.identityVisibility === 'anonymous' ) {
		return __( 'A' );
	}

	const displayName = getPresenceRosterEntryDisplayName( entry );
	const initial = displayName.trim().charAt( 0 ).toUpperCase();

	return initial || __( 'A' );
}

/**
 * Renders the selector-backed DE-RTC status in production editor chrome.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onAction Optional action handler.
 *
 * @return {React.ReactNode} Rendered status chrome.
 */
export function DistributedEditingStatusChrome( { onAction } ) {
	return (
		<>
			<DistributedEditingEnabledShell />
			<DistributedEditingLocalUpdatesImportControls />
			<DistributedEditingStatus
				onAction={ onAction }
				placement="editor-interface-notices"
			/>
			<DistributedEditingFreshReviewJumpInspectionStatus />
			<DistributedEditingFreshReviewCompareInspectionStatus />
			<DistributedEditingFreshReviewComparePlanStatus />
		</>
	);
}

function DistributedEditingFreshReviewJumpInspectionStatus() {
	const [ commandStatus, setCommandStatus ] = useState( 'idle' );
	const decisionState = useSelect( ( select ) => {
		const {
			getDistributedEditingFreshReviewDecisionState,
			getDistributedEditingSessionState,
		} = select( editorStore );
		const sessionState = getDistributedEditingSessionState?.() || {};

		return (
			getDistributedEditingFreshReviewDecisionState?.() ||
			getDistributedEditingFreshReviewDecisionStateForSessionState(
				sessionState
			)
		);
	}, [] );
	const reviewItem = decisionState?.reviewItems?.find(
		( item ) => item.jumpToBlockAction?.reportsCommandStatus
	);

	if ( ! reviewItem ) {
		return null;
	}

	const label =
		reviewItem.blockLabel ||
		reviewItem.blockName ||
		reviewItem.id ||
		__( 'Review item' );

	function inspectJumpTarget() {
		const jumpAction = reviewItem.jumpToBlockAction;
		const nextCommandStatus =
			jumpAction?.commandStatus ||
			( jumpAction?.enabled
				? 'jump-target-available'
				: 'jump-target-unavailable' );

		setCommandStatus( nextCommandStatus );
		return jumpAction;
	}

	return (
		<div
			aria-label={ __( 'Distributed editing fresh review jump status' ) }
			className="editor-distributed-editing-status__fresh-review-jump-inspection"
			data-distributed-editing-fresh-review-jump-inspection
			data-distributed-editing-fresh-review-jump-inspection-placement="editor-interface-notices"
			role="group"
		>
			<Button
				__next40pxDefaultSize
				accessibleWhenDisabled
				aria-label={ sprintf(
					/* translators: %s: review item label. */
					__( 'Inspect jump target for %s' ),
					label
				) }
				data-distributed-editing-fresh-review-item-affordance-command="jump-to-block"
				disabled={ ! reviewItem.jumpToBlockAction?.enabled }
				onClick={ inspectJumpTarget }
				variant="tertiary"
			>
				{ __( 'Jump target' ) }
			</Button>
			<div
				aria-live="polite"
				className="editor-distributed-editing-status__fresh-review-jump-inspection-command"
				data-distributed-editing-fresh-review-jump-inspection-status={
					commandStatus
				}
				role="status"
			>
				{ getFreshReviewDecisionCommandMessage( commandStatus ) }
			</div>
		</div>
	);
}

function DistributedEditingFreshReviewCompareInspectionStatus() {
	const [ commandStatus, setCommandStatus ] = useState( 'idle' );
	const [ selectedComparisonItemId, setSelectedComparisonItemId ] =
		useState( null );
	const decisionState = useSelect( ( select ) => {
		const {
			getDistributedEditingFreshReviewDecisionState,
			getDistributedEditingSessionState,
		} = select( editorStore );
		const sessionState = getDistributedEditingSessionState?.() || {};

		return (
			getDistributedEditingFreshReviewDecisionState?.() ||
			getDistributedEditingFreshReviewDecisionStateForSessionState(
				sessionState
			)
		);
	}, [] );
	const reviewItem = decisionState?.reviewItems?.find(
		( item ) => item.compareAction?.reportsCommandStatus
	);

	if ( ! reviewItem ) {
		return null;
	}

	const label =
		reviewItem.blockLabel ||
		reviewItem.blockName ||
		reviewItem.id ||
		__( 'Review item' );

	function inspectCompareEvidence() {
		const compareAction = reviewItem.compareAction;
		const comparisonSurface = compareAction?.comparisonSurface;

		if ( comparisonSurface?.canOpenComparisonSurface ) {
			setSelectedComparisonItemId( reviewItem.id );
			setCommandStatus( 'comparison-surface-open' );
			return compareAction;
		}

		const nextCommandStatus =
			compareAction?.commandStatus ||
			( compareAction?.enabled
				? 'compare-evidence-available'
				: 'compare-evidence-unavailable' );

		setSelectedComparisonItemId( null );
		setCommandStatus( nextCommandStatus );
		return compareAction;
	}
	const selectedComparisonItem =
		decisionState?.reviewItems?.find(
			( item ) => item.id === selectedComparisonItemId
		) || null;

	return (
		<div
			aria-label={ __(
				'Distributed editing fresh review compare status'
			) }
			className="editor-distributed-editing-status__fresh-review-compare-inspection"
			data-distributed-editing-fresh-review-compare-inspection
			data-distributed-editing-fresh-review-compare-inspection-placement="editor-interface-notices"
			role="group"
		>
			<Button
				__next40pxDefaultSize
				accessibleWhenDisabled
				aria-label={ sprintf(
					/* translators: %s: review item label. */
					__( 'Inspect compare evidence for %s' ),
					label
				) }
				data-distributed-editing-fresh-review-item-affordance-command="compare"
				disabled={ ! reviewItem.compareAction?.enabled }
				onClick={ inspectCompareEvidence }
				variant="tertiary"
			>
				{ __( 'Compare' ) }
			</Button>
			<div
				aria-live="polite"
				className="editor-distributed-editing-status__fresh-review-compare-inspection-command"
				data-distributed-editing-fresh-review-compare-inspection-status={
					commandStatus
				}
				role="status"
			>
				{ getFreshReviewDecisionCommandMessage( commandStatus ) }
			</div>
			<DistributedEditingFreshReviewComparisonSurface
				onBack={ () => {
					setSelectedComparisonItemId( null );
					setCommandStatus( 'comparison-surface-closed' );
				} }
				reviewItem={ selectedComparisonItem }
			/>
		</div>
	);
}

function DistributedEditingFreshReviewComparisonSurface( {
	reviewItem = null,
	onBack,
} ) {
	const comparisonSurface = reviewItem?.compareAction?.comparisonSurface;
	const label =
		reviewItem?.blockLabel ||
		reviewItem?.blockName ||
		reviewItem?.id ||
		__( 'Review item' );

	if ( ! comparisonSurface?.canOpenComparisonSurface ) {
		return null;
	}

	return (
		<div
			aria-label={ sprintf(
				/* translators: %s: review item label. */
				__( 'Distributed editing fresh review comparison for %s' ),
				label
			) }
			className="editor-distributed-editing-status__fresh-review-comparison-surface"
			data-distributed-editing-fresh-review-comparison-surface
			data-distributed-editing-fresh-review-comparison-surface-calls-rest={ formatDataBoolean(
				comparisonSurface.callsRestEndpoint
			) }
			data-distributed-editing-fresh-review-comparison-surface-calls-save={ formatDataBoolean(
				comparisonSurface.callsSave
			) }
			data-distributed-editing-fresh-review-comparison-surface-changes-post-lock={ formatDataBoolean(
				comparisonSurface.changesPostLock
			) }
			data-distributed-editing-fresh-review-comparison-surface-claims-saved={ formatDataBoolean(
				comparisonSurface.claimsSaved
			) }
			data-distributed-editing-fresh-review-comparison-surface-derives-patch={ formatDataBoolean(
				comparisonSurface.derivesPatch
			) }
			data-distributed-editing-fresh-review-comparison-surface-item-id={
				comparisonSurface.itemId || undefined
			}
			data-distributed-editing-fresh-review-comparison-surface-mode={
				comparisonSurface.mode || undefined
			}
			data-distributed-editing-fresh-review-comparison-surface-mutates-editor-content={ formatDataBoolean(
				comparisonSurface.mutatesEditorContent
			) }
			data-distributed-editing-fresh-review-comparison-surface-mutates-persisted-post-content={ formatDataBoolean(
				comparisonSurface.mutatesPersistedPostContent
			) }
			data-distributed-editing-fresh-review-comparison-surface-read-only={ formatDataBoolean(
				comparisonSurface.readOnly
			) }
			data-distributed-editing-fresh-review-comparison-surface-renders-diff={ formatDataBoolean(
				comparisonSurface.rendersDiff
			) }
			data-distributed-editing-fresh-review-comparison-surface-safe-serialized-blocks={ formatDataBoolean(
				comparisonSurface.safeSerializedBlocksAvailable
			) }
			data-distributed-editing-fresh-review-comparison-surface-status="open"
			role="group"
		>
			<strong>{ __( 'Read-only comparison' ) }</strong>
			<p>
				{ __(
					'Review the base and proposed block text. This comparison is local and read-only; it does not save, call the server, change editor content, or change post locks.'
				) }
			</p>
			<div className="editor-distributed-editing-status__fresh-review-comparison-columns">
				<section>
					<strong>{ __( 'Base version' ) }</strong>
					<pre>{ comparisonSurface.baseText }</pre>
				</section>
				<section>
					<strong>{ __( 'Proposed version' ) }</strong>
					<pre>{ comparisonSurface.proposedText }</pre>
				</section>
			</div>
			{ onBack && (
				<Button
					__next40pxDefaultSize
					onClick={ onBack }
					variant="tertiary"
				>
					{ __( 'Back to review' ) }
				</Button>
			) }
		</div>
	);
}

function DistributedEditingFreshReviewComparePlanStatus() {
	const decisionState = useSelect( ( select ) => {
		const {
			getDistributedEditingFreshReviewDecisionState,
			getDistributedEditingSessionState,
		} = select( editorStore );
		const sessionState = getDistributedEditingSessionState?.() || {};

		return (
			getDistributedEditingFreshReviewDecisionState?.() ||
			getDistributedEditingFreshReviewDecisionStateForSessionState(
				sessionState
			)
		);
	}, [] );
	const reviewItem = decisionState?.reviewItems?.find(
		( item ) => item.compareAction?.comparePlan
	);
	const comparePlan = reviewItem?.compareAction?.comparePlan;
	const comparisonSelectionHandoff = comparePlan?.comparisonSelectionHandoff;
	const comparisonPreviewShell = comparePlan?.comparisonPreviewShell;
	const comparisonSurface = comparePlan?.comparisonSurface;
	const comparisonPreviewShellSupportReport =
		comparisonPreviewShell?.supportReport;
	const comparisonRendererCapabilitySupportSummary =
		comparisonPreviewShellSupportReport?.rendererCapabilitySupportSummary;
	const comparisonRendererReadiness =
		comparisonPreviewShell?.rendererReadiness;
	const comparisonRendererCapabilityResolution =
		comparisonRendererReadiness?.capabilityResolution;

	if ( ! comparePlan ) {
		return null;
	}

	return (
		<div
			aria-label={ __( 'Distributed editing fresh review compare plan' ) }
			className="editor-distributed-editing-status__fresh-review-compare-plan"
			data-distributed-editing-fresh-review-compare-plan
			data-distributed-editing-fresh-review-compare-plan-base-hash-evidence={ formatDataBoolean(
				comparePlan.hasBaseContentHash
			) }
			data-distributed-editing-fresh-review-compare-plan-calls-rest={ formatDataBoolean(
				comparePlan.callsRestEndpoint
			) }
			data-distributed-editing-fresh-review-compare-plan-calls-save={ formatDataBoolean(
				comparePlan.callsSave
			) }
			data-distributed-editing-fresh-review-comparison-readiness-can-select={ formatDataBoolean(
				comparisonSelectionHandoff?.canSelectForFutureComparison
			) }
			data-distributed-editing-fresh-review-comparison-readiness-moves-focus={ formatDataBoolean(
				comparisonSelectionHandoff?.movesFocus
			) }
			data-distributed-editing-fresh-review-comparison-readiness-opens-comparison={ formatDataBoolean(
				comparisonSelectionHandoff?.opensComparison
			) }
			data-distributed-editing-fresh-review-comparison-readiness-opens-panel={ formatDataBoolean(
				comparisonSelectionHandoff?.opensPanel
			) }
			data-distributed-editing-fresh-review-comparison-readiness-selects-block={ formatDataBoolean(
				comparisonSelectionHandoff?.selectsBlock
			) }
			data-distributed-editing-fresh-review-comparison-readiness-status={
				comparisonSelectionHandoff?.status || undefined
			}
			data-distributed-editing-fresh-review-comparison-surface-available={ formatDataBoolean(
				comparisonSurface?.canOpenComparisonSurface
			) }
			data-distributed-editing-fresh-review-comparison-surface-read-only={ formatDataBoolean(
				comparisonSurface?.readOnly
			) }
			data-distributed-editing-fresh-review-comparison-surface-reason={
				comparisonSurface?.reason || undefined
			}
			data-distributed-editing-fresh-review-comparison-surface-status={
				comparisonSurface?.status || undefined
			}
			data-distributed-editing-fresh-review-comparison-preview-shell-calls-rest={ formatDataBoolean(
				comparisonPreviewShell?.callsRestEndpoint
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-calls-save={ formatDataBoolean(
				comparisonPreviewShell?.callsSave
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-report-calls-rest={ formatDataBoolean(
				comparisonPreviewShellSupportReport?.callsRestEndpoint
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-report-calls-save={ formatDataBoolean(
				comparisonPreviewShellSupportReport?.callsSave
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-report-computes-diff={ formatDataBoolean(
				comparisonPreviewShellSupportReport?.computesDiff
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-report-export-ready={ formatDataBoolean(
				comparisonPreviewShellSupportReport?.supportExportReady
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-report-hash-values={ formatDataBoolean(
				comparisonPreviewShellSupportReport?.exposesHashValues
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-report-missing-renderer-pieces={
				comparisonPreviewShellSupportReport?.missingFutureRendererPieceCount ===
				undefined
					? undefined
					: String(
							comparisonPreviewShellSupportReport.missingFutureRendererPieceCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-preview-shell-report-raw-content={ formatDataBoolean(
				comparisonPreviewShellSupportReport?.exposesRawContent
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-report-renders-preview={ formatDataBoolean(
				comparisonPreviewShellSupportReport?.rendersPreview
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-report-shareable={ formatDataBoolean(
				comparisonPreviewShellSupportReport?.canShareWithSupport
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-report-status={
				comparisonPreviewShellSupportReport?.status || undefined
			}
			data-distributed-editing-fresh-review-comparison-renderer-readiness-calls-rest={ formatDataBoolean(
				comparisonRendererReadiness?.callsRestEndpoint
			) }
			data-distributed-editing-fresh-review-comparison-renderer-readiness-calls-save={ formatDataBoolean(
				comparisonRendererReadiness?.callsSave
			) }
			data-distributed-editing-fresh-review-comparison-renderer-readiness-capability-status={
				comparisonRendererReadiness?.capabilityRegistrationStatus ||
				undefined
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-candidate-map-stored={ formatDataBoolean(
				comparisonRendererCapabilityResolution?.candidateMapStored
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-complete={ formatDataBoolean(
				comparisonRendererCapabilityResolution?.rendererCapabilitiesComplete
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-missing-capabilities={
				comparisonRendererCapabilityResolution?.missingRendererCapabilityCount ===
				undefined
					? undefined
					: String(
							comparisonRendererCapabilityResolution.missingRendererCapabilityCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-present-capabilities={
				comparisonRendererCapabilityResolution?.presentRendererCapabilityCount ===
				undefined
					? undefined
					: String(
							comparisonRendererCapabilityResolution.presentRendererCapabilityCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-reason={
				comparisonRendererCapabilityResolution?.reason || undefined
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-registers-renderer={ formatDataBoolean(
				comparisonRendererCapabilityResolution?.registersRenderer
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-renderable={ formatDataBoolean(
				comparisonRendererCapabilityResolution?.renderable
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-resolver-only={ formatDataBoolean(
				comparisonRendererCapabilityResolution?.resolverOnly
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-status={
				comparisonRendererCapabilityResolution?.status || undefined
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-unknown-candidates={
				comparisonRendererCapabilityResolution?.unknownCandidateRendererCapabilityCount ===
				undefined
					? undefined
					: String(
							comparisonRendererCapabilityResolution.unknownCandidateRendererCapabilityCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-candidate-maps-stored={ formatDataBoolean(
				comparisonRendererCapabilitySupportSummary?.candidateMapsStored
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-complete={ formatDataBoolean(
				comparisonRendererCapabilitySupportSummary?.hasCompleteButDisabledCapabilities
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-complete-count={
				comparisonRendererCapabilitySupportSummary?.completeButDisabledCount ===
				undefined
					? undefined
					: String(
							comparisonRendererCapabilitySupportSummary.completeButDisabledCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-missing-count={
				comparisonRendererCapabilitySupportSummary?.missingRequiredCapabilitiesCount ===
				undefined
					? undefined
					: String(
							comparisonRendererCapabilitySupportSummary.missingRequiredCapabilitiesCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-partial-count={
				comparisonRendererCapabilitySupportSummary?.partialRequiredCapabilitiesCount ===
				undefined
					? undefined
					: String(
							comparisonRendererCapabilitySupportSummary.partialRequiredCapabilitiesCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-raw-content={ formatDataBoolean(
				comparisonRendererCapabilitySupportSummary?.exposesRawContent
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-renderable={ formatDataBoolean(
				comparisonRendererCapabilitySupportSummary?.renderable
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-renderer-code={ formatDataBoolean(
				comparisonRendererCapabilitySupportSummary?.rendererCodeIncluded
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-resolution-count={
				comparisonRendererCapabilitySupportSummary?.resolutionCount ===
				undefined
					? undefined
					: String(
							comparisonRendererCapabilitySupportSummary.resolutionCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-resolver-only={ formatDataBoolean(
				comparisonRendererCapabilitySupportSummary?.resolverOnly
			) }
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-status={
				comparisonRendererCapabilitySupportSummary?.status || undefined
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-unknown-candidates={
				comparisonRendererCapabilitySupportSummary?.unknownCandidateRendererCapabilityCount ===
				undefined
					? undefined
					: String(
							comparisonRendererCapabilitySupportSummary.unknownCandidateRendererCapabilityCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-unknown-names={ formatDataBoolean(
				comparisonRendererCapabilitySupportSummary?.unknownCandidateKeyNamesIncluded
			) }
			data-distributed-editing-fresh-review-comparison-renderer-readiness-computes-diff={ formatDataBoolean(
				comparisonRendererReadiness?.computesDiff
			) }
			data-distributed-editing-fresh-review-comparison-renderer-readiness-has-registered-renderer={ formatDataBoolean(
				comparisonRendererReadiness?.hasRegisteredRenderer
			) }
			data-distributed-editing-fresh-review-comparison-renderer-readiness-missing-capabilities={
				comparisonRendererReadiness?.missingRendererCapabilityCount ===
				undefined
					? undefined
					: String(
							comparisonRendererReadiness.missingRendererCapabilityCount
					  )
			}
			data-distributed-editing-fresh-review-comparison-renderer-readiness-opens-panel={ formatDataBoolean(
				comparisonRendererReadiness?.opensPanel
			) }
			data-distributed-editing-fresh-review-comparison-renderer-readiness-registers-renderer={ formatDataBoolean(
				comparisonRendererReadiness?.registersRenderer
			) }
			data-distributed-editing-fresh-review-comparison-renderer-readiness-registration-status={
				comparisonRendererReadiness?.registrationStatus || undefined
			}
			data-distributed-editing-fresh-review-comparison-renderer-readiness-renderable={ formatDataBoolean(
				comparisonRendererReadiness?.renderable
			) }
			data-distributed-editing-fresh-review-comparison-renderer-readiness-renders-preview={ formatDataBoolean(
				comparisonRendererReadiness?.rendersPreview
			) }
			data-distributed-editing-fresh-review-comparison-renderer-readiness-status={
				comparisonRendererReadiness?.status || undefined
			}
			data-distributed-editing-fresh-review-comparison-preview-shell-computes-diff={ formatDataBoolean(
				comparisonPreviewShell?.computesDiff
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-moves-focus={ formatDataBoolean(
				comparisonPreviewShell?.movesFocus
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-opens-comparison={ formatDataBoolean(
				comparisonPreviewShell?.opensComparison
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-opens-panel={ formatDataBoolean(
				comparisonPreviewShell?.opensPanel
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-renderable={ formatDataBoolean(
				comparisonPreviewShell?.renderable
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-renders-preview={ formatDataBoolean(
				comparisonPreviewShell?.rendersPreview
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-selects-block={ formatDataBoolean(
				comparisonPreviewShell?.selectsBlock
			) }
			data-distributed-editing-fresh-review-comparison-preview-shell-status={
				comparisonPreviewShell?.status || undefined
			}
			data-distributed-editing-fresh-review-compare-plan-opens-comparison={ formatDataBoolean(
				comparePlan.opensComparison
			) }
			data-distributed-editing-fresh-review-compare-plan-placement="editor-interface-notices"
			data-distributed-editing-fresh-review-compare-plan-proposed-hash-evidence={ formatDataBoolean(
				comparePlan.hasProposedContentHash
			) }
			data-distributed-editing-fresh-review-compare-plan-renders-diff={ formatDataBoolean(
				comparePlan.rendersDiff
			) }
			data-distributed-editing-fresh-review-compare-plan-review-hash-evidence={ formatDataBoolean(
				comparePlan.hasReviewedProposedContentHash
			) }
			data-distributed-editing-fresh-review-compare-plan-status={
				comparePlan.status
			}
			role="group"
		>
			<strong>{ getFreshReviewComparePlanTitle( comparePlan ) }</strong>
			<p>{ getFreshReviewComparePlanMessage( comparePlan ) }</p>
			{ comparisonSelectionHandoff && (
				<p>
					{ getFreshReviewComparisonReadinessMessage(
						comparisonSelectionHandoff
					) }
				</p>
			) }
			{ comparisonPreviewShell && (
				<p>
					{ getFreshReviewComparisonPreviewShellMessage(
						comparisonPreviewShell
					) }
				</p>
			) }
			{ comparisonPreviewShellSupportReport && (
				<p>
					{ getFreshReviewComparisonPreviewShellSupportReportMessage(
						comparisonPreviewShellSupportReport
					) }
				</p>
			) }
			{ comparisonRendererReadiness && (
				<p>
					{ getFreshReviewComparisonRendererReadinessMessage(
						comparisonRendererReadiness
					) }
				</p>
			) }
			{ comparisonRendererCapabilityResolution && (
				<p>
					{ getFreshReviewComparisonRendererCapabilityResolutionMessage(
						comparisonRendererCapabilityResolution
					) }
				</p>
			) }
			{ comparisonRendererCapabilitySupportSummary && (
				<p>
					{ getFreshReviewComparisonRendererCapabilitySupportSummaryMessage(
						comparisonRendererCapabilitySupportSummary
					) }
				</p>
			) }
			<dl className="editor-distributed-editing-status__fresh-review-compare-plan-evidence">
				<div>
					<dt>{ __( 'Base hash evidence' ) }</dt>
					<dd>
						{ getFreshReviewComparePlanEvidenceLabel(
							comparePlan.hasBaseContentHash
						) }
					</dd>
				</div>
				<div>
					<dt>{ __( 'Proposed hash evidence' ) }</dt>
					<dd>
						{ getFreshReviewComparePlanEvidenceLabel(
							comparePlan.hasProposedContentHash
						) }
					</dd>
				</div>
				<div>
					<dt>{ __( 'Reviewed hash evidence' ) }</dt>
					<dd>
						{ getFreshReviewComparePlanEvidenceLabel(
							comparePlan.hasReviewedProposedContentHash
						) }
					</dd>
				</div>
				{ comparisonSelectionHandoff && (
					<div>
						<dt>{ __( 'Comparison readiness' ) }</dt>
						<dd>
							{ getFreshReviewComparePlanEvidenceLabel(
								comparisonSelectionHandoff.canSelectForFutureComparison
							) }
						</dd>
					</div>
				) }
				{ comparisonPreviewShell && (
					<div>
						<dt>{ __( 'Preview shell' ) }</dt>
						<dd>
							{ comparisonPreviewShell.renderable
								? __( 'Available' )
								: __( 'Disabled' ) }
						</dd>
					</div>
				) }
				{ comparisonPreviewShellSupportReport && (
					<div>
						<dt>{ __( 'Preview shell support report' ) }</dt>
						<dd>
							{ comparisonPreviewShellSupportReport.canShareWithSupport
								? __( 'Available' )
								: __( 'Unavailable' ) }
						</dd>
					</div>
				) }
				{ comparisonRendererReadiness && (
					<div>
						<dt>{ __( 'Renderer readiness' ) }</dt>
						<dd>
							{ comparisonRendererReadiness.hasRegisteredRenderer
								? __( 'Registered' )
								: __( 'Not registered' ) }
						</dd>
					</div>
				) }
				{ comparisonRendererCapabilityResolution && (
					<div>
						<dt>{ __( 'Capability resolver' ) }</dt>
						<dd>
							{ getFreshReviewComparisonRendererCapabilityResolutionLabel(
								comparisonRendererCapabilityResolution
							) }
						</dd>
					</div>
				) }
				{ comparisonRendererCapabilitySupportSummary && (
					<div>
						<dt>{ __( 'Capability support summary' ) }</dt>
						<dd>
							{ comparisonRendererCapabilitySupportSummary.canShareWithSupport
								? __( 'Shareable' )
								: __( 'Unavailable' ) }
						</dd>
					</div>
				) }
			</dl>
		</div>
	);
}

function getDistributedEditingStatusSurfaceItem( descriptor ) {
	switch ( descriptor?.kind ) {
		case DISTRIBUTED_EDITING_NOTICE_KINDS.SERVER_STATE_ACCEPTANCE_REQUIRED:
			return {
				...getBaseStatusItem( descriptor ),
				title: __( 'Latest post available' ),
				message: __( 'Accept the latest post before continuing.' ),
			};
		case DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED:
			return {
				...getBaseStatusItem( descriptor ),
				...getStaleBaseStatusText( descriptor ),
				hasLocalRebaseInputs: descriptor.hasLocalRebaseInputs,
			};
		case DISTRIBUTED_EDITING_NOTICE_KINDS.MANUAL_RESOLUTION_REQUIRED:
			return {
				...getBaseStatusItem( descriptor ),
				title: __( 'Manual resolution required' ),
				message: __( 'Sync metadata is unavailable.' ),
			};
		case DISTRIBUTED_EDITING_NOTICE_KINDS.CONNECTION_DEGRADED:
			return {
				...getBaseStatusItem( descriptor ),
				title: __( 'Connection degraded' ),
				message: __( 'Live editing updates may be delayed.' ),
			};
		case DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED:
			return {
				...getBaseStatusItem( descriptor ),
				title: __( 'Remote changes received' ),
				message: getRemoteChangesMessage( descriptor ),
			};
		case DISTRIBUTED_EDITING_NOTICE_KINDS.PENDING_CHANGES:
			return {
				...getBaseStatusItem( descriptor ),
				...getPendingChangesStatusText( descriptor ),
				conflictResolutionProofAccepted:
					descriptor.conflictResolutionProofAccepted,
				conflictResolutionNeedsSavePreparation:
					descriptor.conflictResolutionNeedsSavePreparation,
				conflictResolutionAuthoritativePostUpdated:
					descriptor.conflictResolutionAuthoritativePostUpdated,
			};
		case DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE:
			return {
				...getBaseStatusItem( descriptor ),
				...getRetrySaveStatusText( descriptor ),
				retrySaveReviewRequired: descriptor.retrySaveReviewRequired,
				retrySaveStatus: descriptor.retrySaveStatus,
				retrySaveFreshReviewConsumed:
					descriptor.retrySaveFreshReviewConsumed,
				retrySaveFreshReviewRetrySaveAccepted:
					descriptor.retrySaveFreshReviewRetrySaveAccepted,
				retrySaveFreshReviewRetrySaveRejected:
					descriptor.retrySaveFreshReviewRetrySaveRejected,
				retrySaveFreshReviewReviewedBlockItemCount:
					descriptor.retrySaveFreshReviewReviewedBlockItemCount,
				retrySaveFreshReviewRequiresFreshReview:
					descriptor.retrySaveFreshReviewRequiresFreshReview,
				retrySaveFreshReviewConsumeValidationStatus:
					descriptor.retrySaveFreshReviewConsumeValidationStatus,
				retrySaveFreshReviewConsumeValidationReason:
					descriptor.retrySaveFreshReviewConsumeValidationReason,
				retrySaveFreshReviewDecisionStatus:
					descriptor.retrySaveFreshReviewDecisionStatus,
				retrySaveFreshReviewDecisionLifecycleStatus:
					descriptor.retrySaveFreshReviewDecisionLifecycleStatus,
				retrySaveFreshReviewDecisionLifecycleAction:
					descriptor.retrySaveFreshReviewDecisionLifecycleAction,
				reviewTokenRecoveryStatus: descriptor.reviewTokenRecoveryStatus,
				reviewTokenRecoveryReason: descriptor.reviewTokenRecoveryReason,
				reviewTokenRecoveryRequiresFreshReview:
					descriptor.reviewTokenRecoveryRequiresFreshReview,
				freshReviewLifecycleStatus:
					descriptor.freshReviewLifecycleStatus ||
					descriptor.freshReviewDecisionLifecycleStatus,
				freshReviewLifecycleAction:
					descriptor.freshReviewLifecycleAction ||
					descriptor.freshReviewDecisionLifecycleAction,
			};
		case DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED:
			return {
				...getBaseStatusItem( descriptor ),
				title: getLocalUpdatesImportReviewRequestTitle( descriptor ),
				message:
					getLocalUpdatesImportReviewRequestMessage( descriptor ),
				localUpdatesImportStatus: descriptor.localUpdatesImportStatus,
				localUpdatesImportReason: descriptor.localUpdatesImportReason,
				localUpdatesImportRequiresFreshReview:
					descriptor.localUpdatesImportRequiresFreshReview,
				localUpdatesImportReviewRequestStatus:
					descriptor.localUpdatesImportReviewRequestStatus,
				localUpdatesImportReviewActionKey:
					descriptor.localUpdatesImportReviewActionKey,
				localUpdatesImportFreshReviewDecisionStatus:
					descriptor.localUpdatesImportFreshReviewDecisionStatus,
				localUpdatesImportFreshReviewDecisionPanelRequired:
					descriptor.localUpdatesImportFreshReviewDecisionPanelRequired,
				localUpdatesImportFreshReviewDecisionReady:
					descriptor.localUpdatesImportFreshReviewDecisionReady,
				localUpdatesImportFreshReviewDecisionItemCount:
					descriptor.localUpdatesImportFreshReviewDecisionItemCount,
				localUpdatesImportFreshReviewDecisionPendingCount:
					descriptor.localUpdatesImportFreshReviewDecisionPendingCount,
				localUpdatesImportFreshReviewDecisionApprovedCount:
					descriptor.localUpdatesImportFreshReviewDecisionApprovedCount,
				localUpdatesImportFreshReviewDecisionRejectedCount:
					descriptor.localUpdatesImportFreshReviewDecisionRejectedCount,
				localUpdatesImportFreshReviewDecisionReviewedBlockItemCount:
					descriptor.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount,
				localUpdatesImportFreshReviewRetrySaveHandoffStatus:
					descriptor.localUpdatesImportFreshReviewRetrySaveHandoffStatus,
				localUpdatesImportFreshReviewRetrySaveHandoffReason:
					descriptor.localUpdatesImportFreshReviewRetrySaveHandoffReason,
				localUpdatesImportFreshReviewRetrySaveHandoffReady:
					descriptor.localUpdatesImportFreshReviewRetrySaveHandoffReady,
				localUpdatesImportFreshReviewRetrySaveHandoffValidating:
					descriptor.localUpdatesImportFreshReviewRetrySaveHandoffValidating,
				localUpdatesImportFreshReviewRetrySaveHandoffAccepted:
					descriptor.localUpdatesImportFreshReviewRetrySaveHandoffAccepted,
				localUpdatesImportActionTranscriptReport:
					descriptor.localUpdatesImportActionTranscriptReport,
				localUpdatesImportHasActionTranscriptReport:
					descriptor.localUpdatesImportHasActionTranscriptReport,
				localUpdatesImportCanShowActionTranscriptReport:
					descriptor.localUpdatesImportCanShowActionTranscriptReport,
				freshReviewPreSaveStatus: descriptor.freshReviewPreSaveStatus,
				freshReviewPreSaveReason: descriptor.freshReviewPreSaveReason,
				freshReviewPreSavePlacement:
					descriptor.freshReviewPreSavePlacement,
				freshReviewPreSaveClickAction:
					descriptor.freshReviewPreSaveClickAction,
				freshReviewPreSaveBlocksNormalSavePost:
					descriptor.freshReviewPreSaveBlocksNormalSavePost,
				freshReviewPreSaveOpensPrePublishReview:
					descriptor.freshReviewPreSaveOpensPrePublishReview,
				freshReviewPreSaveRequiresServerStateRefetch:
					descriptor.freshReviewPreSaveRequiresServerStateRefetch,
				freshReviewPreSaveCanExportLocalUpdates:
					descriptor.freshReviewPreSaveCanExportLocalUpdates,
				freshReviewLifecycleStatus:
					descriptor.freshReviewLifecycleStatus ||
					descriptor.freshReviewDecisionLifecycleStatus ||
					descriptor.localUpdatesImportFreshReviewLifecycleStatus ||
					descriptor.localUpdatesImportFreshReviewDecisionLifecycleStatus,
				freshReviewLifecycleAction:
					descriptor.freshReviewLifecycleAction ||
					descriptor.freshReviewDecisionLifecycleAction ||
					descriptor.localUpdatesImportFreshReviewLifecycleAction ||
					descriptor.localUpdatesImportFreshReviewDecisionLifecycleAction,
			};
		case DISTRIBUTED_EDITING_NOTICE_KINDS.ACTION_TRANSCRIPT:
			return {
				...getBaseStatusItem( descriptor ),
				title: __( 'Recent editing activity' ),
				message: getActionTranscriptMessage( descriptor ),
				actionTranscriptItemCount: descriptor.actionTranscriptItemCount,
				actionTranscriptLatestEventType:
					descriptor.actionTranscriptLatestEventType,
				actionTranscriptLatestEventSource:
					descriptor.actionTranscriptLatestEventSource,
				actionTranscriptEntriesRedacted:
					descriptor.actionTranscriptEntriesRedacted,
				actionTranscriptSupportReport:
					descriptor.actionTranscriptSupportReport,
			};
	}

	return null;
}

function getBaseStatusItem( descriptor ) {
	return {
		id: descriptor.id || descriptor.kind,
		kind: descriptor.kind,
		status: descriptor.status || 'info',
		actionKeys: Array.isArray( descriptor.actionKeys )
			? descriptor.actionKeys
			: [],
	};
}

function getFreshReviewStatusItemTestId( item, freshReviewAuthorityStatus ) {
	if ( item.actionTranscriptLatestEventType ) {
		return 'distributed-editing-action-transcript-status';
	}

	if ( item.freshReviewPreSaveStatus ) {
		return 'distributed-editing-pre-save-status';
	}

	if ( freshReviewAuthorityStatus ) {
		return 'distributed-editing-fresh-review-status';
	}

	return undefined;
}

function isConfirmedRetrySaveStatusItem( item ) {
	return (
		item?.kind === DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE &&
		item?.retrySaveStatus === DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED
	);
}

function getQuietedConfirmedSaveStatusMessage( item ) {
	if ( isRetrySaveFreshReviewRetrySaveItem( item ) ) {
		return __(
			'WordPress confirmed the reviewed update. Open details for version and revision evidence.'
		);
	}

	if ( item?.retrySaveConfirmedMergedEdits ) {
		return __(
			'WordPress confirmed the merged edits. Open details for version and revision evidence.'
		);
	}

	return __(
		'WordPress confirmed the update. Open details for version and revision evidence.'
	);
}

function getPendingChangesMessage( descriptor ) {
	if (
		descriptor.localUpdatesImportStatus ===
		DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE
	) {
		if ( descriptor.localUpdatesImportHasAcceptedReviewApprovalProof ) {
			return __(
				'Admin-reviewed changes were imported locally with signed review proof and are ready for WordPress Save. They remain protected and exportable until WordPress confirms the update.'
			);
		}

		return __(
			'Protected recovery changes were imported locally and are ready for WordPress Save. They remain protected and exportable until WordPress confirms the update.'
		);
	}

	if (
		descriptor.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
	) {
		return __(
			'Save is waiting for WordPress confirmation. Protected local changes remain pending and exportable until confirmation.'
		);
	}

	if (
		descriptor.retrySubmitSaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY
	) {
		if ( isConflictResolutionProofAccepted( descriptor ) ) {
			return __(
				'Save is prepared for this conflict choice. Use Save to update WordPress; local changes remain pending until WordPress confirms.'
			);
		}

		return __(
			'Save is prepared for WordPress. Local changes remain pending until Save finishes.'
		);
	}

	if (
		descriptor.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE
	) {
		if ( isConflictResolutionProofAccepted( descriptor ) ) {
			return __(
				'WordPress checked this conflict choice. Prepare Save before updating the post; the WordPress post has not changed yet.'
			);
		}

		return __(
			'WordPress checked these changes. Prepare Save before updating the post; local changes remain pending.'
		);
	}

	const count = normalizeCount( descriptor.pendingChangeCount );

	if ( count > 0 ) {
		return sprintf(
			/* translators: %d: number of pending local changes. */
			_n(
				'%d local change is awaiting confirmation.',
				'%d local changes are awaiting confirmation.',
				count
			),
			count
		);
	}

	return __( 'Local changes are awaiting confirmation.' );
}

function getPendingChangesStatusText( descriptor ) {
	if ( isConflictResolutionProofAccepted( descriptor ) ) {
		const savePrepared =
			descriptor.retrySubmitSaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY;

		return {
			title: savePrepared
				? __( 'Save prepared' )
				: __( 'Conflict choice checked' ),
			message: getPendingChangesMessage( descriptor ),
			nextStepAction: savePrepared
				? 'save_guarded_update'
				: 'prepare_guarded_save',
			nextStepMessage: savePrepared
				? __( 'Use Save to send the guarded update to WordPress.' )
				: __(
						'Prepare Save, then use Save to send the guarded update.'
				  ),
			conflictResolutionContinuationAction: savePrepared
				? 'save_guarded_update'
				: 'prepare_guarded_save',
		};
	}

	return {
		title: __( 'Changes pending' ),
		message: getPendingChangesMessage( descriptor ),
	};
}

function isConflictResolutionProofAccepted( descriptor ) {
	return Boolean(
		descriptor?.conflictResolutionProofAccepted ||
			( descriptor?.retrySubmitProofStatus ===
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE &&
				descriptor?.retrySubmitAccepted &&
				[
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
				].includes( descriptor?.staleBaseConflictResolutionChoice ) &&
				! descriptor?.staleBaseConflictResolutionRequiresFreshProof )
	);
}

function getRemoteChangesMessage( descriptor ) {
	const count = normalizeCount( descriptor.remoteChangeCount );

	if ( count > 0 ) {
		return sprintf(
			/* translators: %d: number of remote changes. */
			_n(
				'%d remote change is available for review.',
				'%d remote changes are available for review.',
				count
			),
			count
		);
	}

	return __( 'Remote changes are available for review.' );
}

function getActionTranscriptMessage( descriptor ) {
	switch ( descriptor.actionTranscriptLatestEventType ) {
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION:
			return __(
				'A local editor action was recorded without exposing post content.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED:
			return __(
				'Remote editing activity was recorded for review without exposing post content.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED:
			return __(
				'WordPress loaded the latest post and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_APPLIED:
			return __(
				'The editor applied local changes to the latest post and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_STAGED:
			return __(
				'The editor staged local changes for a Save safety check and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED:
			return __(
				'WordPress checked Save safety and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_PREPARED:
			return __(
				'The editor prepared Save for WordPress confirmation and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED:
			return __(
				'The editor started Save and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED:
			return __(
				'WordPress confirmed Save and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REVIEW_REQUIRED:
			return __(
				'The editor recorded that review is required without exposing the reviewed content.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED:
			return __(
				'The editor requested fresh review and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED:
			return __(
				'The editor submitted a fresh-review decision and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED:
			return __(
				'The editor validated fresh-review handoff proof and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED:
			return __(
				'WordPress confirmed the fresh-review Save and kept the activity record content-free.'
			);
	}

	const count = normalizeCount( descriptor.actionTranscriptItemCount );

	if ( count > 0 ) {
		return sprintf(
			/* translators: %d: number of content-free transcript events. */
			_n(
				'%d content-free editing activity is available.',
				'%d content-free editing activities are available.',
				count
			),
			count
		);
	}

	return __( 'Content-free editing activity is available.' );
}

function getDistributedEditingUnloadWarningMessage( unloadWarningState ) {
	if ( ! unloadWarningState?.shouldWarn ) {
		return null;
	}

	const count = normalizeCount( unloadWarningState.pendingChangeCount );

	if (
		unloadWarningState.reason ===
			DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS.PENDING_CHANGES &&
		count > 0
	) {
		return sprintf(
			/* translators: %d: number of unconfirmed local changes. */
			_n(
				'Leaving now may lose %d unconfirmed local change.',
				'Leaving now may lose %d unconfirmed local changes.',
				count
			),
			count
		);
	}

	return __( 'Leaving now may lose unconfirmed local changes.' );
}

function getNoticeActions( item, onAction ) {
	if ( typeof onAction !== 'function' ) {
		return [];
	}

	return item.actionKeys
		.map( ( actionKey ) => {
			const label = getActionLabel( actionKey, item );

			if ( ! label ) {
				return null;
			}

			return {
				label,
				onClick: () => onAction( actionKey, item ),
			};
		} )
		.filter( Boolean );
}

function getActionLabel( actionKey, item ) {
	switch ( actionKey ) {
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.ACCEPT_SERVER_STATE:
			return __( 'Accept latest post' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES:
			if ( isRetrySaveFreshReviewRetrySaveRejectedItem( item ) ) {
				return __( 'Export for fresh review' );
			}
			if ( isRetrySaveFreshReviewRequiredItem( item ) ) {
				return __( 'Export for fresh review' );
			}
			if ( isRetrySaveReviewRequiredItem( item ) ) {
				return __( 'Export changes for review' );
			}
			return __( 'Export local changes' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT:
			return __( 'Prepare changes' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE:
			return __( 'Prepare Save' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF:
			return __( 'Check with WordPress' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE:
			return __( 'Get latest post' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES:
			return __( 'Apply local changes' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES:
			return __( 'Review changes' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW:
			return __( 'Request fresh review' );
	}

	return null;
}

function getExportSuccessMessage( item ) {
	if ( isRetrySaveFreshReviewRetrySaveRejectedItem( item ) ) {
		return __(
			'Fresh-review handoff copied. Keep this copy until the latest post is loaded or a new review can be completed.'
		);
	}

	if ( isRetrySaveFreshReviewRequiredItem( item ) ) {
		return __(
			'Fresh-review handoff copied. Send it to an admin reviewer; local changes remain protected until a new review proof is issued.'
		);
	}

	if ( isRetrySaveReviewRequiredItem( item ) ) {
		return __(
			'Protected local changes exported for HTML review. Keep this copy until a user with unfiltered HTML permission can inspect it.'
		);
	}

	return __(
		'Protected local changes exported. Keep this copy until the server confirms the update.'
	);
}

function FreshReviewAuthorityStatus( { status } ) {
	if ( ! status ) {
		return null;
	}

	const rows = [
		status.preSaveStatusLabel
			? {
					label: __( 'Pre-save state' ),
					value: status.preSaveStatusLabel,
			  }
			: null,
		status.lifecycleStatusLabel
			? {
					label: __( 'Review lifecycle' ),
					value: status.lifecycleStatusLabel,
			  }
			: null,
		status.reviewItemCount > 0
			? {
					label: __( 'Review items' ),
					value: sprintf(
						/* translators: %d: number of redacted fresh-review items. */
						_n(
							'%d redacted item',
							'%d redacted items',
							status.reviewItemCount
						),
						status.reviewItemCount
					),
			  }
			: null,
	].filter( Boolean );

	if ( ! rows.length ) {
		return null;
	}

	return (
		<dl
			className="editor-distributed-editing-status__fresh-review-authority"
			data-testid="distributed-editing-fresh-review-authority"
			data-distributed-editing-fresh-review-redacted="true"
		>
			{ rows.map( ( row ) => (
				<div
					key={ row.label }
					className="editor-distributed-editing-status__fresh-review-authority-row"
				>
					<dt>{ row.label }</dt>
					<dd>{ row.value }</dd>
				</div>
			) ) }
		</dl>
	);
}

function getFreshReviewAuthorityStatusProps( item ) {
	const preSaveStatus = getActiveFreshReviewPreSaveStatus(
		item?.freshReviewPreSaveStatus
	);
	const lifecycleStatus = getFreshReviewLifecycleStatus( item );
	const reviewItemCount = getFreshReviewReviewItemCount( item );

	if ( ! preSaveStatus && ! lifecycleStatus && reviewItemCount <= 0 ) {
		return null;
	}

	return {
		action:
			item.freshReviewPreSaveClickAction ||
			item.freshReviewLifecycleAction ||
			item.retrySaveFreshReviewDecisionLifecycleAction ||
			undefined,
		blocksNormalSavePost: Boolean(
			item.freshReviewPreSaveBlocksNormalSavePost
		),
		canExportLocalUpdates: Boolean(
			item.freshReviewPreSaveCanExportLocalUpdates ||
				item.canExportLocalUpdates ||
				item.actionKeys?.includes(
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES
				)
		),
		lifecycleStatus,
		lifecycleStatusLabel:
			getFreshReviewLifecycleStatusLabel( lifecycleStatus ),
		preSaveStatus,
		preSaveStatusLabel: getFreshReviewPreSaveStatusLabel( preSaveStatus ),
		reviewItemCount,
		surface:
			item.freshReviewPreSavePlacement ||
			( item.freshReviewPreSaveOpensPrePublishReview
				? DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW
				: undefined ),
	};
}

function getActiveFreshReviewPreSaveStatus( status ) {
	if (
		! status ||
		status === DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.NONE
	) {
		return null;
	}

	return status;
}

function getFreshReviewLifecycleStatus( item ) {
	return (
		normalizeDisplayValue(
			item?.freshReviewLifecycleStatus ||
				item?.freshReviewDecisionLifecycleStatus ||
				item?.retrySaveFreshReviewDecisionLifecycleStatus
		) ||
		( item?.retrySaveFreshReviewConsumed ? 'retry_save_consumed' : null )
	);
}

function getFreshReviewReviewItemCount( item ) {
	return Math.max(
		normalizeCount(
			item?.localUpdatesImportFreshReviewDecisionReviewedBlockItemCount
		),
		normalizeCount( item?.localUpdatesImportFreshReviewDecisionItemCount ),
		normalizeCount( item?.retrySaveFreshReviewReviewedBlockItemCount )
	);
}

function getFreshReviewPreSaveStatusLabel( status ) {
	switch ( status ) {
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED:
			return __( 'Review required' );
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATION_REQUIRED:
			return __( 'Validation required' );
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING:
			return __( 'Validating review' );
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE:
			return __( 'Ready for WordPress Save' );
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REFETCH_REQUIRED:
			return __( 'Server refresh required' );
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.BLOCKED:
			return __( 'Blocked' );
	}

	return null;
}

function getFreshReviewLifecycleStatusLabel( status ) {
	switch ( status ) {
		case 'already_consumed':
		case 'fresh_review_decision_already_consumed_for_retry_save':
			return __( 'Already consumed' );
		case 'retry_save_consumed':
		case 'consumed':
		case 'retry_save_consumed_for_post':
			return __( 'Used by WordPress Save' );
		case 'accepted':
		case 'accepted_for_retry_save':
			return __( 'Accepted for WordPress Save' );
		case 'blocked':
			return __( 'Blocked' );
		case 'review_required':
			return __( 'Review required' );
	}

	return null;
}

function getFreshReviewPreSaveStatusText( descriptor ) {
	const status = getActiveFreshReviewPreSaveStatus(
		descriptor?.freshReviewPreSaveStatus
	);

	switch ( status ) {
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED:
			return {
				title: __( 'Fresh review required' ),
				message: sprintf(
					/* translators: %s: review item count sentence. */
					__(
						'Protected changes need hash-only admin review before Save can continue. %s No normal Save has run; protected local changes remain exportable.'
					),
					getFreshReviewReviewItemCountMessage( descriptor )
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATION_REQUIRED:
			return {
				title: __( 'Fresh review validation required' ),
				message: __(
					'Reviewed changes need WordPress validation before Save can continue. Save should continue only after fresh-review validation; no normal Save fallback has run, and protected local changes remain exportable.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING:
			return {
				title: __( 'Fresh review validating' ),
				message: __(
					'The editor is validating hash-only fresh-review proof before WordPress updates the post. No normal Save has run; keep protected local changes exportable until validation finishes.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE:
			return {
				title: __( 'Fresh review ready for WordPress Save' ),
				message: __(
					'Hash-only fresh review proof is accepted for WordPress Save. Save may continue only through the reviewed WordPress path; no normal Save fallback has run, and protected local changes remain exportable until WordPress confirms the update.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REFETCH_REQUIRED:
			return {
				title: __( 'Fresh review needs server refresh' ),
				message: __(
					'The latest post must be loaded before fresh review can continue. Loading it only fetches server state; it does not save over protected local changes, which remain exportable.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.BLOCKED:
			if (
				isAlreadyConsumedFreshReviewLifecycle( descriptor ) ||
				descriptor?.freshReviewPreSaveReason ===
					'fresh_review_decision_already_consumed_for_retry_save'
			) {
				return {
					title: __( 'Fresh review already used' ),
					message: __(
						'This fresh-review decision was already used by WordPress Save. Request a new fresh review or get the latest post before continuing; protected local changes remain exportable.'
					),
				};
			}

			return {
				title: __( 'Fresh review blocked' ),
				message: __(
					'Fresh review cannot continue from the current proof state. Request a new review or get the latest post before continuing; protected local changes remain exportable.'
				),
			};
	}

	return null;
}

function getFreshReviewReviewItemCountMessage( descriptor ) {
	const count = getFreshReviewReviewItemCount( descriptor );

	if ( count > 0 ) {
		return sprintf(
			/* translators: %d: number of redacted risky-block review items. */
			_n(
				'%d risky block is represented only by redacted review evidence.',
				'%d risky blocks are represented only by redacted review evidence.',
				count
			),
			count
		);
	}

	return __(
		'Risky block evidence remains redacted until the review surface opens.'
	);
}

function ActionTranscriptSupportTimeline( { report } ) {
	if (
		! report?.available ||
		! report.canShareWithSupport ||
		! Array.isArray( report.timelineItems ) ||
		report.timelineItems.length === 0
	) {
		return null;
	}

	return (
		<ol
			aria-label={ __( 'Distributed editing transcript timeline' ) }
			className="editor-distributed-editing-status__support-report-timeline"
			data-distributed-editing-transcript-timeline-count={
				report.timelineItems.length
			}
		>
			{ report.timelineItems.map( ( item ) => (
				<li
					key={ `${ item.sequence }-${ item.eventType }` }
					data-distributed-editing-transcript-timeline-event-type={
						item.eventType || undefined
					}
					data-distributed-editing-transcript-timeline-redacted={ formatDataBoolean(
						item.redacted
					) }
				>
					{ item.label }
				</li>
			) ) }
		</ol>
	);
}

function getActionTranscriptSupportReportMessage( report ) {
	if ( ! report?.available || ! report.canShareWithSupport ) {
		return null;
	}

	return [
		report.chronologyText,
		report.summaryText,
		__(
			'This transcript is diagnostic only; save authority evidence is still required before treating these changes as saved.'
		),
	]
		.filter( Boolean )
		.join( ' ' );
}

function getFreshReviewDecisionItemActionTranscriptContextMessage( context ) {
	if ( ! context?.available || ! context.canShareWithSupport ) {
		return null;
	}

	const eventCount = context.timelineItemCount || 0;
	const droppedCount = context.droppedItemCount || 0;
	const eventText = sprintf(
		/* translators: %d: redacted transcript event count. */
		_n(
			'%d redacted transcript event',
			'%d redacted transcript events',
			eventCount
		),
		eventCount
	);
	const droppedText =
		droppedCount > 0
			? sprintf(
					/* translators: %d: unsafe transcript entry count. */
					_n(
						', %d unsafe entry dropped',
						', %d unsafe entries dropped',
						droppedCount
					),
					droppedCount
			  )
			: '';
	const latestEventLabel =
		context.latestEventLabel ||
		__( 'Distributed Editing activity recorded' );

	return sprintf(
		/* translators: 1: latest transcript event label, 2: transcript event count text, 3: dropped unsafe entry text. */
		__(
			'Activity context: %1$s; %2$s%3$s. Diagnostic only; save-authority evidence is still required.'
		),
		latestEventLabel,
		eventText,
		droppedText
	);
}

function getFreshReviewDecisionItemAffordanceMessages( item ) {
	const messages = [];

	if ( item?.jumpToBlockAction?.descriptorOnly ) {
		messages.push( {
			key: 'jump-to-block',
			message: item.jumpToBlockAction.enabled
				? __( 'Jump target identified.' )
				: __( 'Jump target unavailable.' ),
		} );
	}

	if ( item?.compareAction?.descriptorOnly ) {
		messages.push( {
			key: 'compare',
			message: item.compareAction.enabled
				? __( 'Compare evidence available.' )
				: __( 'Compare evidence unavailable.' ),
		} );
	}

	if ( item?.compareAction?.comparisonSurface ) {
		messages.push( {
			key: 'read-only-comparison',
			message: item.compareAction.comparisonSurface
				.canOpenComparisonSurface
				? __( 'Read-only comparison available.' )
				: __(
						'Read-only comparison unavailable for this review item.'
				  ),
		} );
	}

	return messages;
}

function getLocalUpdatesImportStatusMessage( {
	commandStatus,
	importResult,
	normalized,
} ) {
	if ( commandStatus === 'running' ) {
		return __(
			'Checking the reviewed changes payload, editor route, content hash, and signed admin review proof.'
		);
	}

	if ( commandStatus === 'failed' ) {
		return __(
			'Reviewed changes import failed before any local change was applied. Protected local changes remain protected, and no server request was sent.'
		);
	}

	const status = importResult?.status || normalized.localUpdatesImportStatus;
	const reason = importResult?.reason || normalized.localUpdatesImportReason;
	const hasAcceptedReviewApprovalProof =
		importResult?.hasAcceptedReviewApprovalProof ||
		normalized.localUpdatesImportHasAcceptedReviewApprovalProof;

	if (
		status ===
		DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE
	) {
		if ( hasAcceptedReviewApprovalProof ) {
			return __(
				'Admin-reviewed changes were imported into this editor only, with route, hash, and signed review proof checks passing. They remain protected until WordPress confirms Save; no server request was sent.'
			);
		}

		return __(
			'Protected recovery changes were imported into this editor only, with route and hash checks passing. They remain protected until WordPress confirms Save; no server request was sent.'
		);
	}

	if (
		status === DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED
	) {
		return getLocalUpdatesImportBlockedMessage( reason );
	}

	return null;
}

function getLocalUpdatesImportBlockedMessage( reason ) {
	switch ( reason ) {
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MALFORMED_PAYLOAD:
			return __(
				'Import blocked: the pasted protected-changes payload is missing or malformed. Nothing was imported, and local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FORMAT_MISMATCH:
			return __(
				'Import blocked: the pasted payload is not a protected local-updates export. Nothing was imported, and local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_ROUTE_MISMATCH:
			return __(
				'Import blocked: the protected changes target a different editor route. Nothing was imported, and local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_POST_CONTENT:
			return __(
				'Import blocked: the payload does not include protected post content. Nothing was imported, and local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_HASH_EVIDENCE:
			return __(
				'Import blocked: the protected changes are missing content hash evidence. Nothing was imported, and local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_CONTENT_HASH_MISMATCH:
			return __(
				'Import blocked: the protected post-content hash does not match the approved proof. Nothing was imported, and local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_REVIEW_APPROVAL_PROOF:
			return __(
				'Import blocked: this admin review handoff is missing accepted review proof. Nothing was imported, and local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXPIRED_REVIEW_APPROVAL_PROOF:
			return __(
				'Import blocked: the admin-reviewed changes token or proof has expired and is no longer usable. Nothing was imported, and local changes remain protected and exportable.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED:
			return __(
				'Import blocked: this reviewed-changes handoff needs a fresh admin review before it can be imported for Save. Nothing was imported, and local changes remain protected and exportable.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXTRA_SESSION_STATE_OVEREXPOSED:
			return __(
				'Import blocked: this reviewed-changes payload exposes extra distributed editing session state. Nothing was imported, and local changes remain protected.'
			);
	}

	return __(
		'Reviewed changes import was blocked before any local change was applied. Protected local changes remain protected, and no server request was sent.'
	);
}

function getLocalUpdatesImportReviewRequestTitle( descriptor ) {
	const freshReviewPreSaveText =
		getFreshReviewPreSaveStatusText( descriptor );

	if ( freshReviewPreSaveText ) {
		return freshReviewPreSaveText.title;
	}

	if (
		[
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING,
			DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
		].includes(
			descriptor?.localUpdatesImportFreshReviewRetrySaveHandoffStatus
		)
	) {
		return __( 'Fresh review validation' );
	}

	if (
		descriptor?.localUpdatesImportReviewRequestStatus ===
		DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED
	) {
		return __( 'Fresh review requested' );
	}

	return __( 'Fresh review needed' );
}

function getLocalUpdatesImportReviewRequestMessage( descriptor ) {
	const freshReviewPreSaveText =
		getFreshReviewPreSaveStatusText( descriptor );

	if ( freshReviewPreSaveText ) {
		return freshReviewPreSaveText.message;
	}

	if (
		descriptor?.localUpdatesImportFreshReviewRetrySaveHandoffStatus ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE
	) {
		return __(
			'Fresh review validation is accepted for WordPress Save. No Save was made, and protected local changes remain exportable.'
		);
	}

	if (
		descriptor?.localUpdatesImportFreshReviewRetrySaveHandoffStatus ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING
	) {
		return __(
			'Fresh review decision is staged for WordPress validation before Save can continue. No Save was made, and protected local changes remain exportable.'
		);
	}

	if (
		descriptor?.localUpdatesImportReviewRequestStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED &&
		descriptor?.localUpdatesImportFreshReviewDecisionStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY
	) {
		return __(
			'Fresh review decisions are ready for a future WordPress check. No Save was made; protected local changes remain exportable until that proof path exists.'
		);
	}

	if (
		descriptor?.localUpdatesImportReviewRequestStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED &&
		descriptor?.localUpdatesImportFreshReviewDecisionPanelRequired
	) {
		return __(
			'Fresh review request was accepted. A reviewer can approve or reject the hash-only block decisions in the internal review panel; no Save was made.'
		);
	}

	if (
		descriptor?.localUpdatesImportReviewRequestStatus ===
		DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED
	) {
		return __(
			'Fresh review request was accepted for admin review. No Save was made; protected local changes remain exportable until review returns.'
		);
	}

	if (
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.STALE_BASE_REJECTED,
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_FEATURE_DISABLED,
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_PERMISSION_DENIED,
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_ROUTE_MISMATCH,
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_SYNC_META_TAMPERED,
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
		].includes( descriptor?.localUpdatesImportReviewRequestStatus )
	) {
		return __(
			'Fresh review request was rejected before any save. Protected local changes remain exportable; keep this editor session open before trying again.'
		);
	}

	if (
		descriptor?.localUpdatesImportReason ===
		DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED
	) {
		return __(
			'This fresh-review handoff cannot be imported for Save because it has no usable accepted review proof. Request a new admin review before saving; nothing was imported, saved, or sent to the server.'
		);
	}

	return __(
		'Reviewed changes import is blocked. Nothing was imported, saved, or sent to the server.'
	);
}

function getRefetchSuccessMessage( item ) {
	if ( isRetrySaveFreshReviewRetrySaveItem( item ) ) {
		return __(
			'Latest post loaded for fresh-review Save. Protected local changes remain in this editor session and can still be exported before retrying.'
		);
	}

	if ( isRetrySaveReviewRequiredItem( item ) ) {
		return __(
			'Latest post loaded for HTML review. Protected local changes remain in this editor session and can still be exported before retrying.'
		);
	}

	return __(
		'Latest post loaded. Protected local changes remain in this editor session and can still be exported before retrying.'
	);
}

function isRetrySaveReviewRequiredItem( item ) {
	return (
		item?.retrySaveReviewRequired ||
		item?.retrySaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED
	);
}

function isRetrySaveFreshReviewRequiredItem( item ) {
	return (
		item?.reviewTokenRecoveryRequiresFreshReview ||
		item?.reviewTokenRecoveryStatus ===
			DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.FRESH_REVIEW_REQUIRED
	);
}

function isRetrySaveFreshReviewRetrySaveItem( item ) {
	return Boolean(
		item?.retrySaveFreshReviewConsumed ||
			item?.retrySaveFreshReviewConsumeValidationAccepted ||
			item?.retrySaveFreshReviewDecisionConsumptionValidated
	);
}

function isRetrySaveFreshReviewRetrySaveRejectedItem( item ) {
	return (
		isRetrySaveFreshReviewRetrySaveItem( item ) &&
		item?.retrySaveStatus !==
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING &&
		item?.retrySaveStatus !== DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED
	);
}

function getDistributedEditingStatusControlLabel( key ) {
	switch ( key ) {
		case 'idle':
			return __( 'Idle' );
		case 'pendingLocalChanges':
			return __( 'Pending local changes' );
		case 'degradedConnection':
			return __( 'Degraded connection' );
		case 'remoteChanges':
			return __( 'Remote changes' );
		case 'serverStateConflict':
			return __( 'Server state conflict' );
		case 'staleBaseRejected':
			return __( 'Stale base rejected' );
		case 'staleBaseRebaseReady':
			return __( 'Local rebase ready' );
		case 'staleBaseRebaseMissingInputs':
			return __( 'Local rebase inputs missing' );
		case 'staleBaseRebased':
			return __( 'Local changes rebased' );
		case 'staleBaseRebaseConflict':
			return __( 'Local rebase conflict' );
		case 'staleBaseRebaseBlockInserted':
			return __( 'Block inserted conflict' );
		case 'staleBaseRebaseBlockReordered':
			return __( 'Block reordered conflict' );
		case 'staleBaseRebaseFreeformHtml':
			return __( 'Freeform HTML blocked' );
		case 'staleBaseRetryPrepared':
			return __( 'Retry handoff prepared' );
		case 'staleBaseRetryProofAccepted':
			return __( 'Retry proof accepted' );
		case 'staleBaseRetryProofStale':
			return __( 'Retry proof stale' );
		case 'staleBaseRetrySaveReady':
			return __( 'Save ready' );
		case 'staleBaseRetrySaveBlockedPermission':
			return __( 'Save blocked' );
		case 'staleBaseRetrySaveSaving':
			return __( 'Saving' );
		case 'staleBaseRetrySaveSaved':
			return __( 'Save confirmed' );
		case 'staleBaseRetrySaveStale':
			return __( 'Save needs latest post' );
		case 'staleBaseRetrySaveTampered':
			return __( 'Save proof changed' );
		case 'staleBaseRetrySaveUnfilteredHtml':
			return __( 'HTML review required before Save' );
		case 'staleBaseRetrySaveHandoffBlockedProof':
			return __( 'Save proof missing' );
		case 'staleBaseRetrySaveHandoffRefetch':
			return __( 'Save needs latest post' );
		case 'staleBaseRetrySaveHandoffMissingRoute':
			return __( 'Save route missing' );
		case 'staleBaseRetrySaveHandoffMissingContent':
			return __( 'Save content missing' );
		case 'staleBaseRetrySaveHandoffInProgress':
			return __( 'Save already running' );
		case 'manualResolution':
			return __( 'Manual resolution' );
	}

	return key;
}

function getRecoveryDryRunCommandStatusLabel( commandStatus ) {
	return getCommandStatusLabel( commandStatus );
}

function getCommandStatusLabel( commandStatus ) {
	switch ( commandStatus ) {
		case 'running':
			return __( 'Running' );
		case 'succeeded':
			return __( 'Succeeded' );
		case 'failed':
			return __( 'Failed' );
	}

	return __( 'Idle' );
}

function normalizeCount( value ) {
	const count = Number( value );
	return Number.isInteger( count ) && count > 0 ? count : 0;
}

function getNextStepDescriptor( nextStepAction ) {
	switch ( nextStepAction ) {
		case 'export_for_manual_conflict_review':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Compare the local changes with the latest post before choosing what to keep.'
				),
			};
		case 'export_for_html_review':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Export changes for review by someone with unfiltered HTML permission.'
				),
			};
		case 'export_fresh_review_for_html_review':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Export a new review handoff for someone with unfiltered HTML permission.'
				),
			};
		case 'wait_for_save_proof':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Try Save again after WordPress accepts the Save proof.'
				),
			};
		case 'get_latest_post':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Get the latest post before trying Save again.'
				),
			};
		case 'export_then_reload':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Export local changes, then reload the editor.'
				),
			};
		case 'export_then_save':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Export local changes, then try Save again.'
				),
			};
		case 'keep_tab_open':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Keep this tab open until WordPress confirms Save.'
				),
			};
		case 'export_before_continuing':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Export local changes before continuing.'
				),
			};
	}

	return {};
}

function getStaleBaseStatusText( descriptor ) {
	if ( isSameBlockManualLocalRebaseConflict( descriptor ) ) {
		return {
			title: __( 'Conflicting update not saved' ),
			message: __(
				'WordPress did not save the conflicting update. Your local changes are protected in this editor. Compare the local and WordPress versions below, then choose which one to keep.'
			),
		};
	}

	const remoteReviewContextMessage =
		getRemoteReviewContextMessage( descriptor );
	const saveNowContext = getSaveNowContext( descriptor );

	if (
		descriptor.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED
	) {
		return {
			title: __( 'Save needs the latest post' ),
			message: __(
				'The post changed again before Save finished. Protected local changes are still exportable; get the latest post before trying again.'
			),
			remoteReviewContextMessage,
			...saveNowContext,
		};
	}

	if (
		descriptor.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED
	) {
		return {
			title: __( 'WordPress check is stale' ),
			message: __(
				'The post changed after WordPress checked these changes. Protected local changes remain exportable; get the latest post before continuing.'
			),
			remoteReviewContextMessage,
			...saveNowContext,
		};
	}

	if (
		descriptor.retrySubmitHandoffStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED
	) {
		return {
			title: __( 'Ready for WordPress check' ),
			message: __(
				'Local changes are prepared against the latest post. Check with WordPress before preparing Save; nothing has been saved yet.'
			),
			remoteReviewContextMessage,
			...saveNowContext,
		};
	}

	switch ( descriptor.localRebaseResultStatus ) {
		case DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED:
			return {
				title: __( 'Local changes applied' ),
				message: __(
					'The latest post is loaded and local changes were applied in this editor. Prepare these changes for a WordPress check before updating the post.'
				),
				remoteReviewContextMessage,
				...saveNowContext,
			};
		case DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED:
			return {
				title: __( 'Compare conflicting changes' ),
				message: getManualLocalRebaseConflictMessage( descriptor ),
				remoteReviewContextMessage,
				...saveNowContext,
				...getNextStepDescriptor( 'export_for_manual_conflict_review' ),
			};
		case DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.UNSAFE_CONTENT_BOUNDARY:
			return {
				title: __( 'Local changes blocked' ),
				message: getUnsafeLocalRebaseBoundaryMessage( descriptor ),
				remoteReviewContextMessage,
				...saveNowContext,
				...getNextStepDescriptor( 'export_for_manual_conflict_review' ),
			};
		case DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.BLOCKED_NEEDS_READY_PLAN:
			return {
				title: __( 'Local changes not ready' ),
				message: __(
					'The latest post is not loaded yet. Get latest post before applying local changes.'
				),
				remoteReviewContextMessage,
				...saveNowContext,
			};
	}

	if (
		descriptor.localRebasePlanStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY &&
		descriptor.hasLocalRebaseInputs === false
	) {
		return {
			title: __( 'Latest post data missing' ),
			message: __(
				'The editor needs both the starting post and latest post before it can apply local changes. Export local changes before reloading.'
			),
			remoteReviewContextMessage,
			...saveNowContext,
		};
	}

	if (
		descriptor.localRebasePlanStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY &&
		descriptor.hasLocalRebaseInputs
	) {
		return {
			title: __( 'Latest post loaded' ),
			message: __(
				'Apply local changes in this editor before trying Save again; WordPress is not updated yet.'
			),
			remoteReviewContextMessage,
			...saveNowContext,
		};
	}

	return {
		title: __( 'Post changed on the server' ),
		message: __(
			'Get latest post first. Then this editor will say whether local changes can be applied, need comparison, or are ready for WordPress to check.'
		),
		remoteReviewContextMessage,
		...saveNowContext,
	};
}

function getSaveNowContext( descriptor ) {
	if (
		descriptor?.requiresManualConflictResolution ||
		descriptor?.localRebaseResultStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED
	) {
		return {
			saveNowContextAction: 'compare_conflicting_changes',
			saveNowContextMessage: sprintf(
				/* translators: %s: Distributed Editing action needed before Save can update the post, such as "Get latest first". */
				__( 'Save now: %s before Save can update the post.' ),
				__( 'Compare changes' )
			),
			saveNowContextStep:
				DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
		};
	}

	const saveJourneyState =
		getDistributedEditingSaveJourneyStateForSessionState(
			getSaveJourneyContextState( descriptor )
		);

	if (
		! saveJourneyState.requiresActionBeforeSave ||
		! saveJourneyState.actionHint
	) {
		return {};
	}

	return {
		saveNowContextAction: saveJourneyState.action,
		saveNowContextMessage: sprintf(
			/* translators: %s: Distributed Editing action needed before Save can update the post, such as "Get latest first". */
			__( 'Save now: %s before Save can update the post.' ),
			saveJourneyState.actionHint
		),
		saveNowContextStep: saveJourneyState.step,
	};
}

function getSaveJourneyContextState( descriptor ) {
	if ( descriptor?.hasLocalRebaseInputs !== true ) {
		return descriptor;
	}

	// Preserve the redacted notice-descriptor boundary. The Save journey only
	// needs content availability here, not the retained post content itself.
	return {
		...descriptor,
		clientBaseContent: '',
		refetchedServerState: true,
		refetchedServerContent: '',
		requiresServerStateRefetch: false,
	};
}

function getRemoteReviewContextMessage( descriptor ) {
	if ( normalizeCount( descriptor?.remoteChangeCount ) <= 0 ) {
		return null;
	}

	return __(
		"Review changes tracks remote activity separately. Use this notice's next step to keep local changes protected before Save."
	);
}

function isSameBlockManualLocalRebaseConflict( descriptor ) {
	return (
		descriptor?.localRebaseResultStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED &&
		DISTRIBUTED_EDITING_SAME_BLOCK_CONFLICT_REASONS.has(
			descriptor?.localRebaseResultReason
		)
	);
}

function getRetrySaveStatusText( descriptor ) {
	if (
		descriptor.retrySaveHandoffStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED
	) {
		return getRetrySaveHandoffBlockedText( descriptor );
	}

	if ( isRetrySaveFreshReviewRetrySaveItem( descriptor ) ) {
		const freshReviewText = getFreshReviewRetrySaveStatusText( descriptor );

		if ( freshReviewText ) {
			return freshReviewText;
		}
	}

	switch ( descriptor.retrySaveStatus ) {
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING:
			return {
				title: __( 'Saving to WordPress' ),
				message: __(
					'The editor is sending the prepared changes to WordPress. Keep this tab open; protected local changes remain exportable until WordPress confirms the save.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED:
			return {
				title: __( 'Save confirmed' ),
				message: getRetrySaveConfirmedMessage( descriptor ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED:
			return {
				title: __( 'Save needs the latest post' ),
				message: __(
					'The post changed again before Save finished. Protected local changes are still exportable; get the latest post before trying again.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED:
			if (
				descriptor.reasonCode ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML
			) {
				return {
					title: __( 'Save needs HTML permission' ),
					message: __(
						'The HTML review proof was accepted, but this account cannot perform the final HTML-capable save. Protected local changes and the hash-only review proof remain exportable for someone with unfiltered HTML permission.'
					),
				};
			}

			return {
				title: __( 'Save permission changed' ),
				message: __(
					'Editing permission changed before Save finished. Protected local changes are still exportable; ask for access before trying again.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED:
			return {
				title: __( 'HTML review required before Save' ),
				message: __(
					'Save did not update the authoritative post because these changes may alter unfiltered HTML. Export them for review by someone with unfiltered HTML permission, or get the latest post before deciding how to continue. Protected local changes remain exportable.'
				),
				...getNextStepDescriptor( 'export_for_html_review' ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED:
			if (
				isExpiredOpaqueReviewApprovalProofTokenRetrySave( descriptor )
			) {
				return {
					title: __( 'Reviewed changes token expired' ),
					message: __(
						'The imported reviewed-changes token has expired and is no longer usable for Save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.'
					),
				};
			}

			return {
				title: __( 'Save proof rejected' ),
				message: __(
					'WordPress rejected the Save proof because the sync metadata or proof flags changed unexpectedly. Protected local changes are still exportable; export them before continuing.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED:
			return {
				title: __( 'Save disabled' ),
				message: __(
					'Distributed Editing was disabled before Save finished. Protected local changes are still exportable; try again after Distributed Editing is enabled.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_ROUTE_MISMATCH:
			return {
				title: __( 'Save route changed' ),
				message: __(
					'The Save request targeted a different editor route. Protected local changes are still exportable; reload the editor only after exporting them.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD:
			if (
				isUnknownOpaqueReviewApprovalProofTokenRetrySave( descriptor )
			) {
				return {
					title: __( 'Reviewed changes token unavailable' ),
					message: __(
						'The imported reviewed-changes token could not be found in server storage and is no longer usable for Save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.'
					),
				};
			}

			return {
				title: __( 'Save payload rejected' ),
				message: __(
					'The Save payload was incomplete or malformed. Protected local changes are still exportable; export them before trying again.'
				),
			};
	}

	return {
		title: __( 'Save unavailable' ),
		message: __(
			'WordPress returned an unrecognized Save state. Protected local changes remain exportable until the server confirms a save.'
		),
	};
}

function getFreshReviewRetrySaveStatusText( descriptor ) {
	switch ( descriptor.retrySaveStatus ) {
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING:
			return {
				title: __( 'Fresh-review Save in progress' ),
				message: __(
					'The editor is sending reviewed local changes to WordPress. Keep this tab open; protected local changes remain exportable until WordPress confirms Save.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED:
			return {
				title: __( 'Fresh-review Save confirmed' ),
				message: getFreshReviewRetrySaveConfirmedMessage( descriptor ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED:
			return {
				title: __( 'Fresh-review Save needs the latest post' ),
				message: __(
					'The server changed after fresh review was validated. Protected local changes are still exportable; get the latest post before trying again.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED:
			return {
				title: __( 'Fresh-review Save needs permission' ),
				message: __(
					'Permission changed before the reviewed changes could be saved. Protected local changes are still exportable for another fresh review or a later retry.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED:
			return {
				title: __( 'Fresh-review Save needs HTML review' ),
				message: __(
					'The authoritative post was not updated because the server still requires HTML review. Export a new review handoff, or get the latest post before deciding how to continue. Protected local changes remain exportable.'
				),
				...getNextStepDescriptor(
					'export_fresh_review_for_html_review'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED:
			if ( isAlreadyConsumedFreshReviewLifecycle( descriptor ) ) {
				return {
					title: __( 'Fresh-review decision already consumed' ),
					message: __(
						'This fresh-review decision was already used by WordPress Save. Protected local changes remain exportable; request a new fresh review or get the latest post before continuing.'
					),
				};
			}

			return {
				title: __( 'Fresh-review Save proof rejected' ),
				message: __(
					'WordPress rejected the reviewed Save proof before saving. Protected local changes are still exportable for a new review; no normal save fallback was used.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED:
			return {
				title: __( 'Fresh-review Save disabled' ),
				message: __(
					'Distributed Editing was disabled before the reviewed changes could be saved. Protected local changes are still exportable for a later retry.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_ROUTE_MISMATCH:
			return {
				title: __( 'Fresh-review Save route changed' ),
				message: __(
					'The reviewed Save request targeted a different editor route. Protected local changes are still exportable; reload only after exporting them.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD:
			return {
				title: __( 'Fresh-review Save payload rejected' ),
				message: __(
					'The reviewed Save payload was incomplete or malformed. Protected local changes are still exportable for a new review before trying again.'
				),
			};
	}

	return null;
}

function isExpiredOpaqueReviewApprovalProofTokenRetrySave( descriptor ) {
	return (
		descriptor.retrySaveReason ===
		DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_REJECTION_DETAILS.EXPIRED
	);
}

function isUnknownOpaqueReviewApprovalProofTokenRetrySave( descriptor ) {
	return (
		descriptor.retrySaveReason ===
		DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_REJECTION_DETAILS.UNKNOWN
	);
}

function getRetrySaveConfirmedMessage( descriptor ) {
	const serverVersion = normalizeDisplayValue(
		descriptor.retrySaveServerVersion
	);
	const previousServerVersion = normalizeDisplayValue(
		descriptor.retrySavePreviousServerVersion
	);
	const revisionCount = getRetrySaveRevisionCount( descriptor );
	const savedChangeDescription = descriptor.retrySaveConfirmedMergedEdits
		? __( 'merged edits' )
		: __( 'prepared changes' );

	if ( serverVersion && previousServerVersion && revisionCount > 0 ) {
		return sprintf(
			/* translators: 1: saved change description, such as "prepared changes" or "merged edits"; 2: previous sync version, 3: saved sync version, 4: number of revisions. */
			_n(
				'WordPress saved the %1$s, advanced the sync version from %2$s to %3$s, and recorded %4$d revision. Protected local changes are no longer pending for this save.',
				'WordPress saved the %1$s, advanced the sync version from %2$s to %3$s, and recorded %4$d revisions. Protected local changes are no longer pending for this save.',
				revisionCount
			),
			savedChangeDescription,
			previousServerVersion,
			serverVersion,
			revisionCount
		);
	}

	if ( serverVersion && previousServerVersion ) {
		return sprintf(
			/* translators: 1: saved change description, such as "prepared changes" or "merged edits"; 2: previous sync version, 3: saved sync version. */
			__(
				'WordPress saved the %1$s and advanced the sync version from %2$s to %3$s. Protected local changes are no longer pending for this save.'
			),
			savedChangeDescription,
			previousServerVersion,
			serverVersion
		);
	}

	if ( serverVersion && revisionCount > 0 ) {
		return sprintf(
			/* translators: 1: saved change description, such as "prepared changes" or "merged edits"; 2: saved sync version, 3: number of revisions. */
			_n(
				'WordPress saved the %1$s at sync version %2$s and recorded %3$d revision. Protected local changes are no longer pending for this save.',
				'WordPress saved the %1$s at sync version %2$s and recorded %3$d revisions. Protected local changes are no longer pending for this save.',
				revisionCount
			),
			savedChangeDescription,
			serverVersion,
			revisionCount
		);
	}

	if ( serverVersion ) {
		return sprintf(
			/* translators: 1: saved change description, such as "prepared changes" or "merged edits"; 2: saved sync version. */
			__(
				'WordPress saved the %1$s at sync version %2$s. Protected local changes are no longer pending for this save.'
			),
			savedChangeDescription,
			serverVersion
		);
	}

	if ( revisionCount > 0 ) {
		return sprintf(
			/* translators: 1: saved change description, such as "prepared changes" or "merged edits"; 2: number of revisions. */
			_n(
				'WordPress saved the %1$s and recorded %2$d revision. Protected local changes are no longer pending for this save.',
				'WordPress saved the %1$s and recorded %2$d revisions. Protected local changes are no longer pending for this save.',
				revisionCount
			),
			savedChangeDescription,
			revisionCount
		);
	}

	return sprintf(
		/* translators: %s: saved change description, such as "prepared changes" or "merged edits". */
		__(
			'WordPress saved the %s. Protected local changes are no longer pending for this save.'
		),
		savedChangeDescription
	);
}

function getFreshReviewRetrySaveConfirmedMessage( descriptor ) {
	const serverVersion = normalizeDisplayValue(
		descriptor.retrySaveServerVersion
	);
	const previousServerVersion = normalizeDisplayValue(
		descriptor.retrySavePreviousServerVersion
	);
	const revisionCount = getRetrySaveRevisionCount( descriptor );

	if ( serverVersion && previousServerVersion && revisionCount > 0 ) {
		return sprintf(
			/* translators: 1: previous sync version, 2: saved sync version, 3: number of revisions. */
			_n(
				'WordPress confirmed fresh-review Save, advanced the sync version from %1$s to %2$s, and recorded %3$d revision. Protected local changes are no longer pending for this save.',
				'WordPress confirmed fresh-review Save, advanced the sync version from %1$s to %2$s, and recorded %3$d revisions. Protected local changes are no longer pending for this save.',
				revisionCount
			),
			previousServerVersion,
			serverVersion,
			revisionCount
		);
	}

	if ( serverVersion && previousServerVersion ) {
		return sprintf(
			/* translators: 1: previous sync version, 2: saved sync version. */
			__(
				'WordPress confirmed fresh-review Save and advanced the sync version from %1$s to %2$s. Protected local changes are no longer pending for this save.'
			),
			previousServerVersion,
			serverVersion
		);
	}

	if ( serverVersion ) {
		return sprintf(
			/* translators: %s: saved sync version. */
			__(
				'WordPress confirmed fresh-review Save at sync version %s. Protected local changes are no longer pending for this save.'
			),
			serverVersion
		);
	}

	return __(
		'WordPress confirmed fresh-review Save. Protected local changes are no longer pending for this save.'
	);
}

function getRetrySaveRevisionCount( descriptor ) {
	if ( Array.isArray( descriptor.retrySaveCreatedRevisionIds ) ) {
		const count = descriptor.retrySaveCreatedRevisionIds.filter(
			( revisionId ) => normalizeDisplayValue( revisionId ) !== null
		).length;

		if ( count > 0 ) {
			return count;
		}
	}

	return descriptor.retrySaveRevisionCreated ? 1 : 0;
}

function normalizeDisplayValue( value ) {
	if ( value === null || value === undefined || value === '' ) {
		return null;
	}

	return String( value );
}

function formatDataBoolean( value ) {
	if ( value === null || value === undefined ) {
		return undefined;
	}

	return value ? 'true' : 'false';
}

function isAlreadyConsumedFreshReviewLifecycle( descriptor ) {
	return (
		[
			descriptor?.freshReviewLifecycleStatus,
			descriptor?.freshReviewDecisionLifecycleStatus,
			descriptor?.retrySaveFreshReviewDecisionLifecycleStatus,
			descriptor?.freshReviewPreSaveReason,
			descriptor?.retrySaveFreshReviewConsumeValidationReason,
			descriptor?.retrySaveReason,
		].includes( 'fresh_review_decision_already_consumed_for_retry_save' ) ||
		[
			descriptor?.freshReviewLifecycleStatus,
			descriptor?.freshReviewDecisionLifecycleStatus,
			descriptor?.retrySaveFreshReviewDecisionLifecycleStatus,
		].includes( 'already_consumed' )
	);
}

function getRetrySaveHandoffBlockedText( descriptor ) {
	switch ( descriptor.retrySaveHandoffReason ) {
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED:
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_SAVE_NOT_READY:
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_VERSION_PROOF:
			return {
				title: __( 'Save needs accepted proof' ),
				message: __(
					'The editor could not verify accepted Save proof for this save. Protected local changes are still exportable; try again after the proof is ready.'
				),
				...getNextStepDescriptor( 'wait_for_save_proof' ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED:
			return {
				title: __( 'Save needs the latest post' ),
				message: __(
					'Getting the latest post only refreshes server state; it does not discard protected local changes or save over other edits. Try Save again after it loads.'
				),
				...getNextStepDescriptor( 'get_latest_post' ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_POST_ROUTE:
			return {
				title: __( 'Save route unavailable' ),
				message: __(
					'The editor could not identify the route for Save. Protected local changes are still exportable; reload the editor only after exporting them.'
				),
				...getNextStepDescriptor( 'export_then_reload' ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_PROPOSED_CONTENT:
			return {
				title: __( 'Save content unavailable' ),
				message: __(
					'The editor could not read the proposed post content for Save. Protected local changes are still exportable; export them before trying again.'
				),
				...getNextStepDescriptor( 'export_then_save' ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS:
			return {
				title: __( 'Save already in progress' ),
				message: __(
					'Save is already waiting for WordPress confirmation. Protected local changes remain exportable; keep this tab open until it finishes.'
				),
				...getNextStepDescriptor( 'keep_tab_open' ),
			};
	}

	return {
		title: __( 'Save blocked' ),
		message: __(
			'The editor blocked Save before normal save could run. Protected local changes are still exportable; export them before continuing.'
		),
		...getNextStepDescriptor( 'export_before_continuing' ),
	};
}

function getManualLocalRebaseConflictMessage( descriptor ) {
	switch ( descriptor.localRebaseResultReason ) {
		case 'block_inserted':
			return __(
				'The latest post is loaded, but blocks were inserted in more than one place. Compare local changes with the latest post before choosing what to keep.'
			);
		case 'block_deleted':
			return __(
				'The latest post is loaded, but blocks were deleted in more than one place. Compare local changes with the latest post before choosing what to keep.'
			);
		case 'block_reordered':
			return __(
				'The latest post is loaded, but blocks were reordered while local edits were pending. Compare local changes with the latest post before choosing what to keep.'
			);
		case 'same_block_changed':
			return __(
				'The latest post is loaded, but local changes and the latest post touched the same block. Compare both before choosing what to keep.'
			);
	}

	return __(
		'The latest post is loaded, but local changes could not be merged automatically. Compare both before choosing what to keep.'
	);
}

function getUnsafeLocalRebaseBoundaryMessage( descriptor ) {
	if ( descriptor.localRebaseResultReason === 'freeform_html' ) {
		return __(
			'The content is not represented by whole serialized blocks and needs manual review.'
		);
	}

	return __( 'The local change boundary is unsafe and needs manual review.' );
}
