/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { Button, Modal, Notice, TextareaControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { safeHTML } from '@wordpress/dom';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	RawHTML,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
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
	getDistributedEditingComparablePostContent,
	getDistributedEditingPostContentFromResponse,
	getDistributedEditingPostContentSha256Hash,
	getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState,
	getDistributedEditingPresenceRosterStateForSessionState,
	getDistributedEditingPresenceStartupPolicyStateForSessionState,
	getDistributedEditingSavePolicyStateForSessionState,
	getDistributedEditingSaveJourneyStateForSessionState,
	getDistributedEditingSessionStateForRetrySubmitSavePreparation,
	getDistributedEditingSessionStateForRetrySubmitProofResult,
	getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult,
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
const DISTRIBUTED_EDITING_DOCUMENT_STATE_HEARTBEAT_DEBOUNCE_MS = 500;
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

function getDistributedEditingPresenceRawPostContent( post ) {
	if ( typeof post?.content === 'string' ) {
		return post.content;
	}

	if ( typeof post?.content?.raw === 'string' ) {
		return post.content.raw;
	}

	return '';
}

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
		.filter(
			( descriptor ) =>
				descriptor?.kind !==
				DISTRIBUTED_EDITING_NOTICE_KINDS.ACTION_TRANSCRIPT
		)
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
				<dt>{ __( 'Save check' ) }</dt>
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
				<dt>{ __( 'WordPress Save' ) }</dt>
				<dd>{ normalized.retrySaveStatus }</dd>
			</div>
			<div>
				<dt>{ __( 'WordPress Save reason' ) }</dt>
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
				{ __( 'Run WordPress Save' ) }
			</Button>
			<dl className="editor-distributed-editing-status__retry-save-state">
				<div>
					<dt>{ __( 'Command' ) }</dt>
					<dd>{ getCommandStatusLabel( commandStatus ) }</dd>
				</div>
				<div>
					<dt>{ __( 'WordPress Save' ) }</dt>
					<dd>{ normalized.retrySaveStatus }</dd>
				</div>
				<div>
					<dt>{ __( 'WordPress Save reason' ) }</dt>
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
			aria-label={ __( 'Distributed editing review payload check' ) }
			className="editor-distributed-editing-status__local-updates-import"
			role="group"
		>
			{ ! isOpen ? (
				<Button
					__next40pxDefaultSize
					onClick={ () => setIsOpen( true ) }
					variant="secondary"
				>
					{ __( 'Run review check' ) }
				</Button>
			) : (
				<>
					<TextareaControl
						className="editor-distributed-editing-status__local-updates-import-payload"
						label={ __( 'Review payload' ) }
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
							{ __( 'Run review check' ) }
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
 * @param {Object}  props                        Component props.
 * @param {boolean} props.forceVisible           Whether to show without requested state.
 * @param {boolean} props.showAffordanceCommands Whether to show inspection command buttons.
 *
 * @return {React.ReactNode} Rendered decision panel.
 */
export function DistributedEditingFreshReviewDecisionPanel( {
	forceVisible = false,
	showAffordanceCommands = true,
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
						const showJumpCommand =
							showAffordanceCommands &&
							item.jumpToBlockAction?.reportsCommandStatus;
						const showCompareCommand =
							showAffordanceCommands &&
							item.compareAction?.reportsCommandStatus;

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
								{ showJumpCommand && (
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
								{ showCompareCommand && (
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
						'No redacted block decisions are available for this requested review yet.'
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
	const statusItems = getDistributedEditingStatusSurfaceItems(
		noticeDescriptors
	).filter(
		( item ) => ! shouldSuppressConfirmedRetrySaveStatusNotice( item )
	);
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
			label: __( 'Saved WordPress version' ),
			text: getVisibleConflictText( comparedBlocks.server ),
		},
		{
			id: 'local',
			label: __( 'Your local version' ),
			text: getVisibleConflictText( comparedBlocks.local ),
		},
	];
	const localSnapshotRows = getConflictReviewSnapshotRows( {
		baseContent: normalized.clientBaseContent,
		conflictBlockIndex: comparedBlocks.blockIndex,
		content: editedPostContent,
		peerContent: normalized.refetchedServerContent,
	} );
	const serverSnapshotRows = getConflictReviewSnapshotRows( {
		baseContent: normalized.clientBaseContent,
		conflictBlockIndex: comparedBlocks.blockIndex,
		content: normalized.refetchedServerContent,
		peerContent: editedPostContent,
	} );
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
		localSnapshotRows,
		serverSnapshotRows,
		conflictBlockCount: Math.max(
			localSnapshotRows.filter( ( row ) => row.isConflict ).length,
			serverSnapshotRows.filter( ( row ) => row.isConflict ).length
		),
		rows,
	};
}

function getConflictReviewSnapshotRows( {
	baseContent,
	conflictBlockIndex,
	content,
	peerContent,
} = {} ) {
	const blocks = getSerializedBlockChunks( content || '' );
	const peerBlocks = getSerializedBlockChunks( peerContent || '' );
	const baseBlocks = getSerializedBlockChunks( baseContent || '' );
	const blockCount = Math.max(
		blocks.length,
		peerBlocks.length,
		baseBlocks.length,
		1
	);
	const rows = [];

	for ( let index = 0; index < blockCount; index++ ) {
		const block = blocks[ index ] || '';
		const peerBlock = peerBlocks[ index ] || '';
		const baseBlock = baseBlocks[ index ] || '';
		const isConflict =
			conflictBlockIndex >= 0
				? index === conflictBlockIndex
				: block !== peerBlock &&
				  ( block !== baseBlock || peerBlock !== baseBlock );

		rows.push( {
			id: `block-${ index + 1 }`,
			index,
			isConflict,
			label: sprintf(
				/* translators: %d: one-based block number. */
				__( 'Block %d' ),
				index + 1
			),
			html: getVisibleConflictHtml( block ),
			text: getVisibleConflictText( block ),
		} );
	}

	return rows;
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

function getVisibleConflictHtml( content ) {
	const withoutUnsafeNodes = String( content || '' )
		.replace( /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ' )
		.replace( /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ' )
		.replace( /<!--[\s\S]*?-->/g, ' ' );
	const html = safeHTML( withoutUnsafeNodes ).trim();

	if ( html ) {
		return html;
	}

	return `<p>${ DISTRIBUTED_EDITING_EMPTY_CONFLICT_TEXT }</p>`;
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

function getDistributedEditingRemoteChangesReviewState( {
	editedPostContent,
	response,
	sessionState = {},
} = {} ) {
	const refetchedSessionState =
		getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
			response,
			sessionState
		);
	const serverContent =
		refetchedSessionState.refetchedServerContent ??
		getDistributedEditingPostContentFromResponse( response );
	const clientBaseContent =
		refetchedSessionState.clientBaseContent ??
		sessionState.clientBaseContent;
	const baseBlocks = getSerializedBlockChunks( clientBaseContent || '' );
	const serverBlocks = getSerializedBlockChunks( serverContent || '' );
	const localBlocks = getSerializedBlockChunks( editedPostContent || '' );
	const reviewItems = getDistributedEditingRemoteChangesReviewItems( {
		baseBlocks,
		clientBaseContent,
		editedPostContent,
		localBlocks,
		remoteChangeCount: refetchedSessionState.remoteChangeCount,
		serverContent,
		serverBlocks,
	} );

	return {
		status: reviewItems.length > 0 ? 'ready' : 'empty',
		isOpen: true,
		baseBlocks,
		clientBaseContent,
		clientBaseVersion:
			refetchedSessionState.clientBaseVersion ??
			sessionState.clientBaseVersion,
		editedPostContent,
		items: reviewItems,
		itemCount: reviewItems.length,
		localBlocks,
		pendingCount: reviewItems.filter(
			( item ) => item.reviewStatus === 'pending'
		).length,
		approvedCount: 0,
		rejectedCount: 0,
		serverBlocks,
		serverContent,
		serverVersion:
			refetchedSessionState.serverVersion ?? sessionState.serverVersion,
		callsServerStateRefetchEndpoint: true,
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		callsAutosaveEndpoint: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function getDistributedEditingRemoteChangesReviewItems( {
	baseBlocks,
	clientBaseContent,
	editedPostContent,
	localBlocks,
	remoteChangeCount = 0,
	serverContent,
	serverBlocks,
} = {} ) {
	const normalizedBaseBlocks = Array.isArray( baseBlocks )
		? baseBlocks
		: getSerializedBlockChunks( clientBaseContent || '' );
	const normalizedServerBlocks = Array.isArray( serverBlocks )
		? serverBlocks
		: getSerializedBlockChunks( serverContent || '' );
	const normalizedLocalBlocks = Array.isArray( localBlocks )
		? localBlocks
		: getSerializedBlockChunks( editedPostContent || '' );
	const hasComparableBase = typeof clientBaseContent === 'string';
	const blockCount = Math.max(
		normalizedBaseBlocks.length,
		normalizedServerBlocks.length,
		normalizedLocalBlocks.length,
		remoteChangeCount
	);
	const reviewItems = [];

	for ( let index = 0; index < blockCount; index++ ) {
		const baseBlock = hasComparableBase
			? normalizedBaseBlocks[ index ] || ''
			: '';
		const serverBlock = normalizedServerBlocks[ index ] || '';
		const localBlock = normalizedLocalBlocks[ index ] || '';
		const comparisonBlock = hasComparableBase ? baseBlock : localBlock;

		if ( ! serverBlock && ! comparisonBlock ) {
			continue;
		}

		if ( serverBlock === comparisonBlock ) {
			continue;
		}

		const changeKind = getDistributedEditingRemoteChangeKind(
			comparisonBlock,
			serverBlock
		);

		reviewItems.push( {
			id: `remote-change-${ index + 1 }`,
			index,
			label: getDistributedEditingRemoteChangeLabel(
				changeKind,
				reviewItems.length
			),
			baseBlock,
			changeKind,
			localBlock,
			serverBlock,
			beforeText: getVisibleConflictText( comparisonBlock ),
			afterText: getVisibleConflictText( serverBlock ),
			reviewStatus: 'pending',
		} );
	}

	if (
		reviewItems.length === 0 &&
		remoteChangeCount > 0 &&
		typeof serverContent === 'string'
	) {
		reviewItems.push( {
			id: 'remote-change-1',
			index: 0,
			label: __( 'Remote change 1' ),
			changeKind: 'modified_block',
			baseBlock: editedPostContent || '',
			localBlock: editedPostContent || '',
			serverBlock: serverContent,
			beforeText: getVisibleConflictText( editedPostContent || '' ),
			afterText: getVisibleConflictText( serverContent ),
			reviewStatus: 'pending',
		} );
	}

	return reviewItems;
}

function getDistributedEditingRemoteChangeKind( beforeBlock, afterBlock ) {
	if ( ! beforeBlock && afterBlock ) {
		return 'added_block';
	}

	if ( beforeBlock && ! afterBlock ) {
		return 'deleted_block';
	}

	return 'modified_block';
}

function getDistributedEditingRemoteChangeLabel( changeKind, index ) {
	const itemNumber = index + 1;

	switch ( changeKind ) {
		case 'added_block':
			return sprintf(
				/* translators: %d: remote change number. */
				__( 'Added block %d' ),
				itemNumber
			);
		case 'deleted_block':
			return sprintf(
				/* translators: %d: remote change number. */
				__( 'Deleted block %d' ),
				itemNumber
			);
	}

	return sprintf(
		/* translators: %d: remote change number. */
		__( 'Changed block %d' ),
		itemNumber
	);
}

function getDistributedEditingRemoteChangesReviewCounts( review = {} ) {
	const items = Array.isArray( review.items ) ? review.items : [];

	return {
		pendingCount: items.filter(
			( item ) => item.reviewStatus === 'pending'
		).length,
		approvedCount: items.filter(
			( item ) => item.reviewStatus === 'approved'
		).length,
		rejectedCount: items.filter(
			( item ) => item.reviewStatus === 'rejected'
		).length,
	};
}

function getDistributedEditingRemoteChangesReviewStateWithDecision(
	review = {},
	itemId,
	decision
) {
	const nextItems = ( Array.isArray( review.items ) ? review.items : [] ).map(
		( item ) =>
			item.id === itemId
				? {
						...item,
						reviewStatus:
							decision === 'rejected' ? 'rejected' : 'approved',
				  }
				: item
	);
	const counts = getDistributedEditingRemoteChangesReviewCounts( {
		items: nextItems,
	} );

	return {
		...review,
		items: nextItems,
		...counts,
		status: counts.pendingCount > 0 ? 'ready' : 'resolved',
		callsNormalSavePost: false,
		callsRetrySaveEndpoint: false,
		callsAutosaveEndpoint: false,
		mutatesEditorContent: false,
		mutatesPersistedPostContent: false,
		changesPostLock: false,
		claimsSaved: false,
	};
}

function getDistributedEditingRemoteChangesReviewCandidatePostContent(
	review = {}
) {
	const counts = getDistributedEditingRemoteChangesReviewCounts( review );

	if ( counts.pendingCount > 0 ) {
		return null;
	}

	const reviewItems = Array.isArray( review.items ) ? review.items : [];
	const reviewItemByIndex = new Map(
		reviewItems.map( ( item ) => [ item.index, item ] )
	);
	const baseBlocks = Array.isArray( review.baseBlocks )
		? review.baseBlocks
		: getSerializedBlockChunks( review.clientBaseContent || '' );
	const serverBlocks = Array.isArray( review.serverBlocks )
		? review.serverBlocks
		: getSerializedBlockChunks( review.serverContent || '' );
	const localBlocks = Array.isArray( review.localBlocks )
		? review.localBlocks
		: getSerializedBlockChunks( review.editedPostContent || '' );
	const blockCount = Math.max(
		baseBlocks.length,
		serverBlocks.length,
		localBlocks.length
	);
	const candidateBlocks = [];

	for ( let index = 0; index < blockCount; index++ ) {
		const baseBlock = baseBlocks[ index ] || '';
		const serverBlock = serverBlocks[ index ] || '';
		const localBlock = localBlocks[ index ] || '';
		const reviewItem = reviewItemByIndex.get( index );
		let nextBlock;

		if ( reviewItem ) {
			if ( reviewItem.reviewStatus === 'approved' ) {
				nextBlock = serverBlock;
			} else if ( reviewItem.reviewStatus === 'rejected' ) {
				nextBlock =
					localBlock && localBlock !== baseBlock
						? localBlock
						: baseBlock;
			} else {
				return null;
			}
		} else if ( localBlock && localBlock !== baseBlock ) {
			nextBlock = localBlock;
		} else if ( serverBlock ) {
			nextBlock = serverBlock;
		} else {
			nextBlock = baseBlock;
		}

		if ( nextBlock ) {
			candidateBlocks.push( nextBlock );
		}
	}

	return candidateBlocks.join( '' );
}

function DistributedEditingRemoteChangesReviewPrePublishPanel( {
	onResolve,
	review,
} ) {
	if ( ! review?.isOpen ) {
		return null;
	}

	const reviewItems = Array.isArray( review.items ) ? review.items : [];
	const hasReviewItems = reviewItems.length > 0;

	return (
		<PluginPrePublishPanel
			className="editor-distributed-editing-status__remote-changes-review-pre-publish-panel"
			initialOpen
			title={ __( 'Review changes' ) }
		>
			<div
				aria-label={ __( 'Remote changes review' ) }
				className="editor-distributed-editing-status__remote-changes-review"
				data-distributed-editing-remote-changes-review-panel
				data-distributed-editing-remote-changes-review-calls-autosave="false"
				data-distributed-editing-remote-changes-review-calls-normal-save="false"
				data-distributed-editing-remote-changes-review-calls-retry-save="false"
				data-distributed-editing-remote-changes-review-changes-post-lock="false"
				data-distributed-editing-remote-changes-review-claims-saved="false"
				data-distributed-editing-remote-changes-review-item-count={
					reviewItems.length
				}
				data-distributed-editing-remote-changes-review-mutates-editor-content="false"
				data-distributed-editing-remote-changes-review-mutates-persisted-content="false"
				data-distributed-editing-remote-changes-review-status={
					review.status
				}
				role="group"
			>
				<p className="editor-distributed-editing-status__remote-changes-review-summary">
					{ hasReviewItems
						? sprintf(
								/* translators: %d: number of remote changes. */
								_n(
									'%d change is ready to review.',
									'%d changes are ready to review.',
									reviewItems.length
								),
								reviewItems.length
						  )
						: __(
								'WordPress did not find a visible change to review.'
						  ) }
				</p>
				{ hasReviewItems && (
					<dl className="editor-distributed-editing-status__remote-changes-review-counts">
						<div>
							<dt>{ __( 'Pending' ) }</dt>
							<dd>{ review.pendingCount }</dd>
						</div>
						<div>
							<dt>{ __( 'Approved' ) }</dt>
							<dd>{ review.approvedCount }</dd>
						</div>
						<div>
							<dt>{ __( 'Rejected' ) }</dt>
							<dd>{ review.rejectedCount }</dd>
						</div>
					</dl>
				) }
				<ul className="editor-distributed-editing-status__remote-changes-review-items">
					{ reviewItems.map( ( item ) => (
						<DistributedEditingRemoteChangesReviewItem
							item={ item }
							key={ item.id }
							onResolve={ onResolve }
						/>
					) ) }
				</ul>
			</div>
		</PluginPrePublishPanel>
	);
}

function DistributedEditingRemoteChangesReviewItem( { item, onResolve } ) {
	const isPending = item.reviewStatus === 'pending';

	return (
		<li
			className="editor-distributed-editing-status__remote-changes-review-item"
			data-distributed-editing-remote-change-kind={ item.changeKind }
			data-distributed-editing-remote-change-review-item={ item.id }
			data-distributed-editing-remote-change-review-status={
				item.reviewStatus
			}
		>
			<div className="editor-distributed-editing-status__remote-changes-review-item-header">
				<strong>{ item.label }</strong>
				<span>
					{ getReviewChangesStatusLabel( item.reviewStatus ) }
				</span>
			</div>
			<dl className="editor-distributed-editing-status__remote-changes-review-item-text">
				<div>
					<dt>{ __( 'Before' ) }</dt>
					<dd>{ item.beforeText }</dd>
				</div>
				<div>
					<dt>{ __( 'WordPress' ) }</dt>
					<dd>{ item.afterText }</dd>
				</div>
			</dl>
			<div className="editor-distributed-editing-status__remote-changes-review-item-actions">
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					disabled={ ! isPending }
					onClick={ () => onResolve?.( item.id, 'approved' ) }
					type="button"
					variant="secondary"
				>
					{ __( 'Approve' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					disabled={ ! isPending }
					isDestructive
					onClick={ () => onResolve?.( item.id, 'rejected' ) }
					type="button"
					variant="tertiary"
				>
					{ __( 'Reject' ) }
				</Button>
			</div>
		</li>
	);
}

function getReviewChangesStatusLabel( reviewStatus ) {
	switch ( reviewStatus ) {
		case 'approved':
			return __( 'Approved' );
		case 'rejected':
			return __( 'Rejected' );
	}

	return __( 'Pending' );
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
	const hasConflictResolutionChoice = [
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
	].includes( normalized.staleBaseConflictResolutionChoice );
	const isRetrySubmitProofAccepted =
		normalized.retrySubmitProofStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE &&
		normalized.retrySubmitAccepted &&
		! normalized.staleBaseConflictResolutionRequiresFreshProof;
	const isCheckedStructuralConflictChoice =
		isStructuralConflictReason &&
		hasConflictResolutionChoice &&
		isRetrySubmitProofAccepted;

	if (
		hasConfirmedRetrySave ||
		( ! isManualStructuralConflict &&
			! isCheckedStructuralConflictChoice ) ||
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
			label: __( 'Saved WordPress structure' ),
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

	const baseSnapshot = snapshots[ 0 ];
	const snapshotsWithChangeCues = snapshots.map( ( snapshot ) => ( {
		...snapshot,
		changeCue: getStructuralConflictSnapshotChangeCue(
			snapshot,
			baseSnapshot
		),
	} ) );

	return {
		baseBlockCount,
		localBlockCount,
		localCountDelta: localBlockCount - baseBlockCount,
		reason: normalized.localRebaseResultReason,
		reasonLabel: getStructuralConflictReasonLabel(
			normalized.localRebaseResultReason
		),
		retrySubmitProofStatus: normalized.retrySubmitProofStatus,
		retrySubmitSavePathRequired: normalized.retrySubmitSavePathRequired,
		retrySubmitSavePrepared: normalized.retrySubmitSavePrepared,
		retrySubmitSaveReady: normalized.retrySubmitSaveReady,
		retrySubmitSaveStatus: normalized.retrySubmitSaveStatus,
		serverBlockCount,
		serverCountDelta: serverBlockCount - baseBlockCount,
		resolutionChoice: normalized.staleBaseConflictResolutionChoice,
		resolutionRequiresFreshProof:
			normalized.staleBaseConflictResolutionRequiresFreshProof,
		resolutionStatus: normalized.staleBaseConflictResolutionStatus,
		snapshots: snapshotsWithChangeCues,
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
		comparisonTexts: visibleTexts,
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

function getStructuralConflictSnapshotChangeCue( snapshot, baseSnapshot ) {
	if ( snapshot.id === 'base' ) {
		return {
			countDelta: 0,
			kind: 'base',
			label: __( 'Original structure' ),
		};
	}

	const countDelta = snapshot.blockCount - baseSnapshot.blockCount;

	if ( countDelta > 0 ) {
		return {
			countDelta,
			kind: 'blocks_added',
			label: sprintf(
				/* translators: %d: number of added blocks. */
				_n( 'Adds %d block', 'Adds %d blocks', countDelta ),
				countDelta
			),
		};
	}

	if ( countDelta < 0 ) {
		const removedCount = Math.abs( countDelta );

		return {
			countDelta,
			kind: 'blocks_deleted',
			label: sprintf(
				/* translators: %d: number of deleted blocks. */
				_n( 'Deletes %d block', 'Deletes %d blocks', removedCount ),
				removedCount
			),
		};
	}

	if (
		! areStructuralConflictTextSequencesEqual(
			snapshot.comparisonTexts,
			baseSnapshot.comparisonTexts
		)
	) {
		return {
			countDelta,
			kind: 'blocks_reordered',
			label: __( 'Reordered' ),
		};
	}

	return {
		countDelta,
		kind: 'same_count',
		label: __( 'Same block count' ),
	};
}

function areStructuralConflictTextSequencesEqual( a = [], b = [] ) {
	if ( a.length !== b.length ) {
		return false;
	}

	return a.every( ( item, index ) => item === b[ index ] );
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
				'Blocks were deleted in both versions. Choose which structure to keep.'
			);
		case 'block_inserted':
			return __(
				'New blocks were added in both versions. Choose which structure to keep.'
			);
		case 'block_reordered':
			return __(
				'Blocks moved while you were editing. Choose which structure to keep.'
			);
	}

	return __(
		'The block structure changed while you were editing. Choose which structure to keep.'
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

function DistributedEditingSameBlockConflictComparison( {
	actionStatus,
	comparison,
	isApplyingLocal,
	isApplyingRemote,
	onAcceptLocalVersion,
	onAcceptLatestWordPressVersion,
} ) {
	if ( ! comparison ) {
		return null;
	}

	return (
		<Modal
			className="editor-distributed-editing-status__conflict-modal"
			focusOnMount
			isDismissible={ false }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			size="large"
			title={ __( 'Review conflict' ) }
		>
			<div
				aria-label={ __( 'Distributed editing conflict comparison' ) }
				className="editor-distributed-editing-status__conflict-comparison editor-distributed-editing-status__conflict-comparison--modal"
				data-distributed-editing-conflict-comparison="same-block"
				data-distributed-editing-conflict-comparison-block-index={
					comparison.blockIndex
				}
				data-distributed-editing-conflict-comparison-calls-save={ formatDataBoolean(
					Boolean( isApplyingLocal )
				) }
				data-distributed-editing-conflict-comparison-calls-rest={ formatDataBoolean(
					Boolean( isApplyingLocal )
				) }
				data-distributed-editing-conflict-comparison-has-local={ formatDataBoolean(
					comparison.hasLocalContent
				) }
				data-distributed-editing-conflict-comparison-has-server={ formatDataBoolean(
					comparison.hasServerContent
				) }
				data-distributed-editing-conflict-comparison-highlighted-block-count={
					comparison.conflictBlockCount
				}
				data-distributed-editing-conflict-comparison-mode="modal_two_version_review"
				data-distributed-editing-conflict-comparison-mutates-editor-content={ formatDataBoolean(
					Boolean( isApplyingRemote )
				) }
				data-distributed-editing-conflict-comparison-read-only="false"
				data-distributed-editing-conflict-comparison-reason={
					comparison.reason
				}
				data-distributed-editing-conflict-resolution-next-step="choose_version"
				role="region"
			>
				<p className="editor-distributed-editing-status__conflict-modal-message">
					{ __(
						'WordPress could not merge these edits automatically. Choose which version to keep.'
					) }
				</p>
				{ actionStatus?.message && (
					<Notice
						className="editor-distributed-editing-status__conflict-modal-notice"
						isDismissible={ false }
						status={ actionStatus.status || 'info' }
					>
						{ actionStatus.message }
					</Notice>
				) }
				<div className="editor-distributed-editing-status__conflict-modal-grid">
					<DistributedEditingConflictModalPane
						actionLabel={ __(
							'Keep mine and overwrite WordPress'
						) }
						actionName="accept_local"
						isBusy={ Boolean( isApplyingLocal ) }
						isDisabled={ Boolean(
							isApplyingLocal || isApplyingRemote
						) }
						label={ __( 'Your version' ) }
						onAction={ onAcceptLocalVersion }
						rows={ comparison.localSnapshotRows }
					/>
					<DistributedEditingConflictModalPane
						actionLabel={ __( 'Use WordPress version' ) }
						actionName="accept_remote"
						isBusy={ Boolean( isApplyingRemote ) }
						isDisabled={ Boolean(
							isApplyingLocal || isApplyingRemote
						) }
						label={ __( 'WordPress version' ) }
						onAction={ onAcceptLatestWordPressVersion }
						rows={ comparison.serverSnapshotRows }
					/>
				</div>
			</div>
		</Modal>
	);
}

function DistributedEditingConflictModalPane( {
	actionLabel,
	actionName,
	isBusy,
	isDisabled,
	label,
	onAction,
	rows,
} ) {
	return (
		<section
			className="editor-distributed-editing-status__conflict-modal-pane"
			data-distributed-editing-conflict-modal-pane={ actionName }
		>
			<div className="editor-distributed-editing-status__conflict-modal-pane-header">
				<strong>{ label }</strong>
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					disabled={ isDisabled }
					data-distributed-editing-conflict-action={ actionName }
					data-distributed-editing-conflict-modal-action={
						actionName
					}
					isBusy={ isBusy }
					type="button"
					variant={
						actionName === 'accept_local' ? 'primary' : 'secondary'
					}
					onClick={ onAction }
				>
					{ actionLabel }
				</Button>
			</div>
			<ol className="editor-distributed-editing-status__conflict-modal-blocks">
				{ rows.map( ( row ) => (
					<li
						className="editor-distributed-editing-status__conflict-modal-block"
						data-distributed-editing-conflict-modal-block={ row.id }
						data-distributed-editing-conflict-modal-block-conflict={ formatDataBoolean(
							row.isConflict
						) }
						key={ row.id }
					>
						<span className="editor-distributed-editing-status__conflict-modal-block-label">
							{ row.label }
						</span>
						<div
							className="editor-distributed-editing-status__conflict-modal-block-preview"
							data-distributed-editing-conflict-modal-block-preview="formatted"
						>
							<RawHTML>{ row.html || row.text }</RawHTML>
						</div>
					</li>
				) ) }
			</ol>
		</section>
	);
}

function getDistributedEditingAcceptedLatestWordPressVersionSessionState(
	sessionState,
	serverContent
) {
	const normalized = normalizeDistributedEditingSessionState( sessionState );
	const serverVersion =
		normalized.serverVersion || normalized.clientBaseVersion || null;

	return normalizeDistributedEditingSessionState( {
		...normalized,
		disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
		reasonCode: null,
		serverVersion,
		clientBaseVersion: serverVersion,
		clientBaseContent: serverContent,
		refetchedServerContent: serverContent,
		refetchedServerState: true,
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
		requiresManualConflictResolution: false,
		staleBaseConflictResolutionStatus:
			DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.NONE,
		staleBaseConflictResolutionChoice: null,
		staleBaseConflictResolutionRequiresFreshProof: false,
		staleBaseConflictResolutionCallsRest: false,
		staleBaseConflictResolutionCallsSave: false,
		staleBaseConflictResolutionMutatesEditorContent: true,
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
		retrySaveAccepted: false,
		retrySaveSavesPost: false,
		retrySaveMutatesPostContent: false,
		retrySaveCreatesRevision: false,
		retrySaveClaimsSaved: false,
		retrySaveRevisionCreated: false,
		retrySaveCreatedRevisionIds: [],
		retrySaveConfirmedMergedEdits: false,
		retrySaveServerMerged: false,
		retrySaveServerMergeApplied: false,
		mustOfferLocalCopy: false,
		canExportLocalUpdates: false,
	} );
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
	const [ areStructureDetailsOpen, setAreStructureDetailsOpen ] =
		useState( false );
	const structuralDetailsId = useId();

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
	let sessionChoiceSnapshotId = null;

	if (
		summary.resolutionChoice ===
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS
	) {
		sessionChoiceSnapshotId = 'server';
	} else if (
		summary.resolutionChoice ===
		DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL
	) {
		sessionChoiceSnapshotId = 'local';
	}
	const selectedChoiceSnapshotId =
		appliedSnapshotId ?? sessionChoiceSnapshotId;
	const structuralChoiceStatus = selectedChoiceSnapshotId
		? `selected_${ selectedChoiceSnapshotId }`
		: 'none';
	const structuralChoiceUndoAvailable = Boolean(
		structuralChoiceState?.undoAvailable
	);
	const structuralChoiceProofAccepted =
		summary.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE;
	const structuralChoiceSaveReady =
		structuralChoiceProofAccepted &&
		summary.retrySubmitSaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY &&
		summary.retrySubmitSavePrepared &&
		summary.retrySubmitSaveReady;
	const structuralChoiceCanPrepareSave = Boolean(
		selectedChoiceSnapshotId &&
			structuralChoiceProofAccepted &&
			summary.retrySubmitSavePathRequired &&
			! structuralChoiceSaveReady
	);
	const structuralChoiceRequiresFreshProof = Boolean(
		selectedChoiceSnapshotId &&
			summary.resolutionRequiresFreshProof &&
			! structuralChoiceProofAccepted
	);
	let structuralChoiceNextStep = 'choose_structural_version';

	if ( structuralChoiceSaveReady ) {
		structuralChoiceNextStep = 'save_guarded_update';
	} else if ( structuralChoiceCanPrepareSave ) {
		structuralChoiceNextStep = 'prepare_structural_save';
	} else if ( structuralChoiceProofAccepted ) {
		structuralChoiceNextStep = 'structural_choice_checked';
	} else if ( structuralChoiceRequiresFreshProof ) {
		structuralChoiceNextStep = 'check_structural_choice';
	} else if ( selectedChoiceSnapshotId ) {
		structuralChoiceNextStep = 'choose_or_check_structure';
	}
	let structuralChoiceStatusMessage = __(
		'Keeping local structure. Save is still paused until Save verifies this choice.'
	);

	if ( structuralChoiceSaveReady ) {
		structuralChoiceStatusMessage = __(
			'Ready to Save this structure. Use Save to ask WordPress to update the post; the saved post has not changed yet.'
		);
	} else if ( structuralChoiceProofAccepted ) {
		structuralChoiceStatusMessage = __(
			'This structure is ready. Continue Save before updating the post.'
		);
	} else if ( selectedChoiceSnapshotId === 'server' ) {
		structuralChoiceStatusMessage = __(
			'Using saved WordPress structure. Save is still paused until this choice is ready.'
		);
	}
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
			aria-label={ __(
				'Distributed editing structural conflict summary'
			) }
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
			data-distributed-editing-structural-details-calls-save="false"
			data-distributed-editing-structural-details-open={ formatDataBoolean(
				areStructureDetailsOpen
			) }
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
				structuralChoiceRequiresFreshProof
			) }
			data-distributed-editing-structural-choice-proof-accepted={ formatDataBoolean(
				structuralChoiceProofAccepted
			) }
			data-distributed-editing-structural-choice-proof-status={
				summary.retrySubmitProofStatus
			}
			data-distributed-editing-structural-choice-save-status={
				summary.retrySubmitSaveStatus
			}
			data-distributed-editing-structural-choice-prepare-save-ready={ formatDataBoolean(
				structuralChoiceCanPrepareSave
			) }
			data-distributed-editing-structural-choice-save-ready={ formatDataBoolean(
				structuralChoiceSaveReady
			) }
			data-distributed-editing-structural-choice-next-step={
				structuralChoiceNextStep
			}
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
			data-distributed-editing-structural-preview-status={ previewStatus }
			role="region"
		>
			<div className="editor-distributed-editing-status__conflict-comparison-header">
				<strong>{ __( 'Choose block structure' ) }</strong>
				<p>{ getStructuralConflictMessage( summary ) }</p>
			</div>
			<ul
				aria-label={ __(
					'Distributed editing structural change summary'
				) }
				className="editor-distributed-editing-status__structural-conflict-cues"
				data-distributed-editing-structural-cue-list="true"
			>
				{ summary.snapshots.map( ( snapshot ) => (
					<li
						className="editor-distributed-editing-status__structural-conflict-cue"
						data-distributed-editing-structural-cue={ snapshot.id }
						data-distributed-editing-structural-cue-block-count={
							snapshot.blockCount
						}
						data-distributed-editing-structural-cue-change-kind={
							snapshot.changeCue.kind
						}
						data-distributed-editing-structural-cue-count-delta={
							snapshot.changeCue.countDelta
						}
						key={ snapshot.id }
					>
						<span className="editor-distributed-editing-status__structural-conflict-cue-version">
							{ snapshot.label }
						</span>
						<strong className="editor-distributed-editing-status__structural-conflict-cue-change">
							{ snapshot.changeCue.label }
						</strong>
						<span className="editor-distributed-editing-status__structural-conflict-cue-count">
							{ getStructuralConflictBlockCountLabel(
								snapshot.blockCount
							) }
						</span>
					</li>
				) ) }
			</ul>
			<Button
				__next40pxDefaultSize
				aria-controls={ structuralDetailsId }
				aria-expanded={ areStructureDetailsOpen }
				className="editor-distributed-editing-status__structural-conflict-details-toggle"
				data-distributed-editing-structural-details-toggle="true"
				data-distributed-editing-structural-details-toggle-calls-save="false"
				onClick={ () =>
					setAreStructureDetailsOpen(
						( isCurrentlyOpen ) => ! isCurrentlyOpen
					)
				}
				type="button"
				variant="tertiary"
			>
				{ areStructureDetailsOpen
					? __( 'Hide block details' )
					: __( 'Show block details' ) }
			</Button>
			<div
				className="editor-distributed-editing-status__structural-conflict-details"
				data-distributed-editing-structural-details-panel="true"
				hidden={ ! areStructureDetailsOpen }
				id={ structuralDetailsId }
			>
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
							data-distributed-editing-structural-conflict-row-change-kind={
								snapshot.changeCue.kind
							}
							data-distributed-editing-structural-conflict-row-count-delta={
								snapshot.changeCue.countDelta
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
							<span className="editor-distributed-editing-status__structural-conflict-change-cue">
								{ snapshot.changeCue.label }
							</span>
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
						<dt>{ __( 'Saved WordPress count change' ) }</dt>
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
			</div>
			<div className="editor-distributed-editing-status__structural-conflict-preview-actions">
				<Button
					__next40pxDefaultSize
					data-distributed-editing-structural-preview-action="preview_latest_wordpress"
					variant={
						previewSnapshotId === 'server' ? 'primary' : 'secondary'
					}
					onClick={ () => setPreviewSnapshotId( 'server' ) }
				>
					{ __( 'Preview saved' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					data-distributed-editing-structural-preview-action="preview_local_editor"
					variant={
						previewSnapshotId === 'local' ? 'primary' : 'secondary'
					}
					onClick={ () => setPreviewSnapshotId( 'local' ) }
				>
					{ __( 'Preview mine' ) }
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
								/* translators: %s: structural version label, such as Saved WordPress structure or Your local editor. */
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
						'Use the saved WordPress block structure in this editor. This does not save until Save verifies the choice and Save confirms.'
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
					{ __( 'Use saved' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					aria-pressed={ selectedChoiceSnapshotId === 'local' }
					data-distributed-editing-structural-choice-action="keep_local_editor"
					data-distributed-editing-structural-choice-action-does-not-save="true"
					title={ __(
						'Keep the local block structure in this editor. This does not save until Save verifies the choice and Save confirms.'
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
					{ __( 'Keep mine' ) }
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
						{ __( 'Undo choice' ) }
					</Button>
				) }
				{ structuralChoiceRequiresFreshProof && (
					<Button
						__next40pxDefaultSize
						data-distributed-editing-structural-choice-action="check_structural_choice"
						data-distributed-editing-structural-choice-action-does-not-save="true"
						title={ __(
							'Ask WordPress to check this block structure before Save. This does not save the post.'
						) }
						variant="secondary"
						onClick={ () =>
							onAction?.(
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF,
								{
									...actionItem,
									nextStepAction: 'check_structural_choice',
								}
							)
						}
					>
						{ __( 'Check structure' ) }
					</Button>
				) }
				{ structuralChoiceCanPrepareSave && (
					<Button
						__next40pxDefaultSize
						data-distributed-editing-structural-choice-action="prepare_structural_save"
						data-distributed-editing-structural-choice-action-does-not-save="true"
						title={ __(
							'Continue Save for this checked structure. This does not save the post.'
						) }
						type="button"
						variant="primary"
						onClick={ () =>
							onAction?.(
								DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE,
								{
									...actionItem,
									nextStepAction: 'prepare_structural_save',
								}
							)
						}
					>
						{ __( 'Continue Save' ) }
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
					{ structuralChoiceStatusMessage }
					{ structuralChoiceUndoAvailable && (
						<span>
							{ __(
								'Undo restores the local structure from before this choice.'
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
	const [ remoteChangesReview, setRemoteChangesReview ] = useState( null );
	const [ structuralChoiceUndoContent, setStructuralChoiceUndoContent ] =
		useState( null );
	const [ conflictModalAction, setConflictModalAction ] = useState( null );
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
		__experimentalSaveDistributedEditingRetryAfterProof,
		editPost,
		openPublishSidebar,
		resetEditorBlocks,
		setDistributedEditingSessionState,
	} = useDispatch( editorStore ) || {};
	const { receiveEntityRecords } = useDispatch( coreStore ) || {};
	const hasConfirmedRetrySave =
		sessionState?.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED;
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
						const isStructuralConflictPrepare =
							item?.id === 'structural-conflict-summary';
						const isSameBlockConflictPrepare =
							item?.id === 'same-block-conflict-comparison' ||
							item?.conflictResolutionProofAccepted === true;
						const prepareSaveResult =
							await __experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof?.(
								{
									requiresExplicitSaveClick:
										isStructuralConflictPrepare ||
										isSameBlockConflictPrepare,
								}
							);

						if (
							isStructuralConflictPrepare &&
							( prepareSaveResult?.status ===
								DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY ||
								prepareSaveResult?.sessionState
									?.retrySubmitSaveReady === true )
						) {
							const preparedState =
								normalizeDistributedEditingSessionState(
									prepareSaveResult?.sessionState || {
										...sessionState,
										retrySubmitSaveStatus:
											DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
										retrySubmitSaveReason: null,
										retrySubmitSavePrepared: true,
										retrySubmitSaveReady: true,
									}
								);

							setDistributedEditingSessionState?.(
								normalizeDistributedEditingSessionState( {
									...preparedState,
									clientBaseContent:
										preparedState.clientBaseContent ??
										sessionState.clientBaseContent,
									disposition:
										DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
									hasPendingChanges: true,
									isAwaitingServerConfirmation: true,
									localRebaseResultReason:
										preparedState.localRebaseResultReason ??
										sessionState.localRebaseResultReason,
									localRebaseResultStatus:
										preparedState.localRebaseResultStatus ??
										sessionState.localRebaseResultStatus,
									reasonCode:
										DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
									refetchedServerContent:
										preparedState.refetchedServerContent ??
										sessionState.refetchedServerContent,
									requiresManualConflictResolution: true,
									staleBaseConflictResolutionChoice:
										preparedState.staleBaseConflictResolutionChoice ??
										sessionState.staleBaseConflictResolutionChoice,
									staleBaseConflictResolutionRequiresFreshProof: false,
									staleBaseConflictResolutionStatus:
										preparedState.staleBaseConflictResolutionStatus ??
										sessionState.staleBaseConflictResolutionStatus,
									retrySubmitSaveStatus:
										DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
									retrySubmitSaveReason: null,
									retrySubmitSavePrepared: true,
									retrySubmitSaveReady: true,
									canExportLocalUpdates: true,
								} )
							);
						}

						let prepareSaveMessage = __(
							'Save prepared. Use Save to send these changes to WordPress.'
						);

						if ( isStructuralConflictPrepare ) {
							prepareSaveMessage = __(
								'Ready to Save this structure. Use Save to ask WordPress to update the post; the saved post has not changed yet.'
							);
						} else if ( isSameBlockConflictPrepare ) {
							prepareSaveMessage = __(
								'Ready to Save this version. Use Save to ask WordPress to update the post; local changes remain protected until WordPress confirms.'
							);
						}

						setActionStatus( {
							status: 'info',
							message: prepareSaveMessage,
						} );
						return prepareSaveResult;
					}
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF: {
						const isStructuralConflictProof =
							item?.id === 'structural-conflict-summary';
						const proposedPostContentHash =
							isStructuralConflictProof
								? await getDistributedEditingPostContentSha256Hash(
										editedPostContent
								  )
								: null;
						const proofResult =
							await __experimentalRefreshDistributedEditingRetrySubmitProof?.(
								isStructuralConflictProof &&
									proposedPostContentHash
									? { proposedPostContentHash }
									: undefined
							);
						const isRetrySubmitProofAccepted =
							proofResult?.result ===
								'retry_submit_accepted_for_future_save' ||
							proofResult?.retrySubmitAccepted === true ||
							proofResult?.retry_submit_accepted === true;

						if (
							isStructuralConflictProof &&
							isRetrySubmitProofAccepted
						) {
							const normalized =
								getDistributedEditingSessionStateForRetrySubmitProofResult(
									proofResult,
									sessionState
								);
							const acceptedProofState =
								normalizeDistributedEditingSessionState( {
									...normalized,
									disposition:
										DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
									reasonCode:
										DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
									requiresManualConflictResolution: true,
									staleBaseConflictResolutionRequiresFreshProof: false,
									retrySubmitProofStatus:
										DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
									retrySubmitProofReason: null,
									retrySubmitAccepted: true,
									retrySubmitSaveStatus:
										DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
									retrySubmitSavePrepared: false,
									retrySubmitSaveReady: false,
									retrySaveStatus:
										DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
									retrySaveAccepted: false,
									retrySaveClaimsSaved: false,
									canExportLocalUpdates: true,
								} );
							const prepareSaveResult =
								await __experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof?.(
									{
										requiresExplicitSaveClick: true,
									}
								);
							const preparedState =
								normalizeDistributedEditingSessionState(
									prepareSaveResult?.sessionState ||
										getDistributedEditingSessionStateForRetrySubmitSavePreparation(
											acceptedProofState
										)
								);
							const isPreparedForSave =
								preparedState.retrySubmitSaveStatus ===
									DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY ||
								preparedState.retrySubmitSaveReady === true;

							setDistributedEditingSessionState?.(
								normalizeDistributedEditingSessionState( {
									...preparedState,
									clientBaseContent:
										preparedState.clientBaseContent ??
										acceptedProofState.clientBaseContent,
									disposition:
										DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
									hasPendingChanges: true,
									isAwaitingServerConfirmation: true,
									localRebaseResultReason:
										preparedState.localRebaseResultReason ??
										acceptedProofState.localRebaseResultReason,
									localRebaseResultStatus:
										preparedState.localRebaseResultStatus ??
										acceptedProofState.localRebaseResultStatus,
									reasonCode:
										DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
									refetchedServerContent:
										preparedState.refetchedServerContent ??
										acceptedProofState.refetchedServerContent,
									requiresManualConflictResolution: true,
									staleBaseConflictResolutionChoice:
										preparedState.staleBaseConflictResolutionChoice ??
										acceptedProofState.staleBaseConflictResolutionChoice,
									staleBaseConflictResolutionRequiresFreshProof: false,
									staleBaseConflictResolutionStatus:
										preparedState.staleBaseConflictResolutionStatus ??
										acceptedProofState.staleBaseConflictResolutionStatus,
									retrySubmitProofStatus:
										DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
									retrySubmitProofReason: null,
									retrySubmitAccepted: true,
									retrySubmitSaveStatus: isPreparedForSave
										? DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY
										: preparedState.retrySubmitSaveStatus,
									retrySubmitSaveReason: isPreparedForSave
										? null
										: preparedState.retrySubmitSaveReason,
									retrySubmitSavePrepared: isPreparedForSave
										? true
										: preparedState.retrySubmitSavePrepared,
									retrySubmitSaveReady: isPreparedForSave
										? true
										: preparedState.retrySubmitSaveReady,
									retrySaveStatus:
										DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
									retrySaveAccepted: false,
									retrySaveClaimsSaved: false,
									canExportLocalUpdates: true,
								} )
							);
							const structuralProofMessage = isPreparedForSave
								? __(
										'Ready to Save this structure. Use Save to ask WordPress to update the post; the saved post has not changed yet.'
								  )
								: __(
										'This structure is ready. Continue Save before updating the post.'
								  );

							setActionStatus( {
								status: 'info',
								message: structuralProofMessage,
							} );
							return {
								...proofResult,
								prepareSaveResult,
								retrySubmitSavePrepared: isPreparedForSave,
								savesPost: false,
							};
						}

						let retrySubmitProofMessage = __(
							'These changes are ready. Continue Save before updating the post.'
						);

						if ( isStructuralConflictProof ) {
							retrySubmitProofMessage = __(
								'This structure is ready. Continue Save before updating the post.'
							);
						} else if (
							item?.id === 'same-block-conflict-comparison'
						) {
							retrySubmitProofMessage = __(
								'This version is ready. Continue Save before updating the post.'
							);
						}

						setActionStatus( {
							status: 'info',
							message: retrySubmitProofMessage,
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
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES: {
						if (
							typeof __experimentalRefreshDistributedEditingServerStateAfterStaleBase !==
							'function'
						) {
							setActionStatus( {
								status: 'warning',
								message: __(
									'Review is not available yet. Protected local changes remain in this editor session.'
								),
							} );
							return {
								status: 'remote_changes_review_unavailable',
								callsServerStateRefetchEndpoint: false,
								callsNormalSavePost: false,
								callsRetrySaveEndpoint: false,
								mutatesEditorContent: false,
								mutatesPersistedPostContent: false,
								changesPostLock: false,
								claimsSaved: false,
							};
						}

						setActionStatus( {
							status: 'info',
							message: __( 'Loading changes. Nothing is saved.' ),
						} );
						const reviewResult =
							await __experimentalRefreshDistributedEditingServerStateAfterStaleBase();
						const nextRemoteChangesReview =
							getDistributedEditingRemoteChangesReviewState( {
								editedPostContent,
								response: reviewResult,
								sessionState,
							} );

						setRemoteChangesReview( nextRemoteChangesReview );
						setDistributedEditingSessionState?.(
							normalizeDistributedEditingSessionState( {
								...sessionState,
								remoteChangesReviewItemCount:
									nextRemoteChangesReview.itemCount,
								remoteChangesReviewPrePublishPanelRequired:
									nextRemoteChangesReview.itemCount > 0,
								remoteChangesReviewStatus:
									nextRemoteChangesReview.status,
							} )
						);
						openPublishSidebar?.();
						setActionStatus( {
							status: 'info',
							message: __( 'Review loaded. Nothing was saved.' ),
						} );
						return {
							...reviewResult,
							status:
								reviewResult?.status ||
								'remote_changes_review_loaded',
							reviewsRemoteChanges: true,
							opensReviewSidebar: true,
							reviewItemCount: nextRemoteChangesReview.itemCount,
							callsServerStateRefetchEndpoint: true,
							callsNormalSavePost: false,
							callsRetrySaveEndpoint: false,
							mutatesEditorContent: false,
							mutatesPersistedPostContent: false,
							changesPostLock: false,
							claimsSaved: false,
						};
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
			openPublishSidebar,
			sessionState,
			setDistributedEditingSessionState,
		]
	);
	const handleResolveRemoteChangesReview = useCallback(
		async ( itemId, decision ) => {
			const nextRemoteChangesReview =
				getDistributedEditingRemoteChangesReviewStateWithDecision(
					remoteChangesReview,
					itemId,
					decision
				);

			setRemoteChangesReview( nextRemoteChangesReview );

			if ( nextRemoteChangesReview.pendingCount > 0 ) {
				setActionStatus( {
					status: 'info',
					message:
						decision === 'rejected'
							? __( 'Change rejected.' )
							: __( 'Change approved.' ),
				} );
				return nextRemoteChangesReview;
			}

			const candidatePostContent =
				getDistributedEditingRemoteChangesReviewCandidatePostContent(
					nextRemoteChangesReview
				);

			if ( typeof candidatePostContent !== 'string' ) {
				setActionStatus( {
					status: 'warning',
					message: __(
						'Review needs another look before Save can update the post.'
					),
				} );
				return nextRemoteChangesReview;
			}

			const candidateBlocks = parse( candidatePostContent );

			if ( candidateBlocks.length || ! candidatePostContent ) {
				resetEditorBlocks?.( candidateBlocks, {
					__unstableShouldCreateUndoLevel: false,
				} );
			}

			editPost?.(
				{ content: candidatePostContent },
				{ undoIgnore: true }
			);

			if (
				candidatePostContent === nextRemoteChangesReview.serverContent
			) {
				setDistributedEditingSessionState?.(
					normalizeDistributedEditingSessionState( {
						...sessionState,
						disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
						reasonCode: null,
						clientBaseContent: null,
						clientBaseVersion:
							nextRemoteChangesReview.serverVersion ??
							sessionState.serverVersion,
						serverVersion:
							nextRemoteChangesReview.serverVersion ??
							sessionState.serverVersion,
						pendingChangeCount: 0,
						remoteChangeCount: 0,
						hasPendingChanges: false,
						hasRemoteChanges: false,
						isAwaitingServerConfirmation: false,
						requiresManualConflictResolution: false,
						requiresServerStateAcceptance: false,
						requiresServerStateRefetch: false,
						retrySubmitProofStatus:
							DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
						retrySubmitAccepted: false,
						retrySubmitSavePathRequired: false,
						retrySubmitSaveStatus:
							DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
						retrySubmitSavePrepared: false,
						retrySubmitSaveReady: false,
						retrySaveStatus:
							DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
						remoteChangesReviewItemCount: 0,
						remoteChangesReviewPrePublishPanelRequired: false,
						remoteChangesReviewStatus: 'resolved',
					} )
				);
				setRemoteChangesReview( {
					...nextRemoteChangesReview,
					candidatePostContent,
					status: 'resolved',
				} );
				setActionStatus( {
					status: 'success',
					message: __(
						'Review complete. The editor matches WordPress.'
					),
				} );
				return nextRemoteChangesReview;
			}

			const proposedPostContentHash =
				await getDistributedEditingPostContentSha256Hash(
					candidatePostContent
				);
			const latestServerVersion =
				nextRemoteChangesReview.serverVersion ??
				sessionState.serverVersion ??
				sessionState.clientBaseVersion;
			const rebasedFromVersion =
				nextRemoteChangesReview.clientBaseVersion ??
				sessionState.clientBaseVersion ??
				latestServerVersion;
			const pendingChangeCount = Math.max(
				1,
				nextRemoteChangesReview.approvedCount +
					nextRemoteChangesReview.rejectedCount
			);

			setDistributedEditingSessionState?.(
				normalizeDistributedEditingSessionState( {
					...sessionState,
					disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
					reasonCode: null,
					clientBaseContent: nextRemoteChangesReview.serverContent,
					clientBaseVersion: latestServerVersion,
					serverVersion: latestServerVersion,
					refetchedServerContent:
						nextRemoteChangesReview.serverContent,
					refetchedServerState: true,
					pendingChangeCount,
					remoteChangeCount: 0,
					hasPendingChanges: true,
					hasRemoteChanges: false,
					isAwaitingServerConfirmation: true,
					requiresManualConflictResolution: false,
					requiresServerStateAcceptance: false,
					requiresServerStateRefetch: false,
					canAttemptLocalRebase: false,
					readyToRetrySubmit: true,
					mustOfferLocalCopy: true,
					canExportLocalUpdates: true,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
					retrySubmitProofReason: null,
					retrySubmitAccepted: false,
					retrySubmitSavePathRequired: false,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
					retrySubmitSaveReason: null,
					retrySubmitSavePrepared: false,
					retrySubmitSaveReady: false,
					retrySubmitSaveRequiresExplicitSaveClick: false,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
					retrySaveAccepted: false,
					retrySaveClaimsSaved: false,
					remoteChangesReviewItemCount:
						nextRemoteChangesReview.itemCount,
					remoteChangesReviewPrePublishPanelRequired: false,
					remoteChangesReviewStatus: 'save-ready',
				} )
			);

			await __experimentalRefreshDistributedEditingRetrySubmitProof?.( {
				clientBaseVersion: latestServerVersion,
				rebasedFromVersion,
				pendingChangeCount,
				proposedPostContentHash,
			} );
			const prepareSaveResult =
				await __experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof?.(
					{
						requiresExplicitSaveClick: true,
					}
				);

			setRemoteChangesReview( {
				...nextRemoteChangesReview,
				candidatePostContent,
				candidatePostContentHash: proposedPostContentHash,
				prepareSaveResult,
				status: 'save-ready',
			} );
			setActionStatus( {
				status: 'success',
				message: __( 'Ready to Save. Use Save to update the post.' ),
			} );

			return {
				...nextRemoteChangesReview,
				candidatePostContent,
				candidatePostContentHash: proposedPostContentHash,
				prepareSaveResult,
			};
		},
		[
			__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof,
			__experimentalRefreshDistributedEditingRetrySubmitProof,
			editPost,
			remoteChangesReview,
			resetEditorBlocks,
			sessionState,
			setDistributedEditingSessionState,
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
						'This version is not available. Protected local changes remain exportable.'
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
							'Using the saved WordPress version in this editor. Save is still paused until Save verifies this choice again.'
					  )
					: __(
							'Keeping your local text in this editor. Save is still paused until Save verifies this choice again.'
					  ),
			} );

			return nextSessionState;
		},
		[ editPost, sessionState, setDistributedEditingSessionState ]
	);
	const handleAcceptLocalVersion = useCallback( async () => {
		setConflictModalAction( 'local' );
		setActionStatus( {
			status: 'info',
			message: __( 'Saving your version.' ),
		} );

		try {
			const selectedState = handleSelectConflictVersion(
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL
			);

			if ( ! selectedState ) {
				return null;
			}

			const proofResult =
				await __experimentalRefreshDistributedEditingRetrySubmitProof?.();
			const prepareResult =
				await __experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof?.();
			const saveResult =
				await __experimentalSaveDistributedEditingRetryAfterProof?.( {
					__experimentalDistributedEditingExplicitSaveClick: true,
					proposedPostContent: editedPostContent,
				} );

			setActionStatus( {
				status: 'success',
				message: __( 'Saved your version.' ),
			} );

			return {
				selectedState,
				proofResult,
				prepareResult,
				saveResult,
			};
		} catch ( error ) {
			try {
				await __experimentalRefreshDistributedEditingServerStateAfterStaleBase?.();
			} catch {}

			setActionStatus( {
				status: 'error',
				message: __(
					'WordPress changed again. Review the updated WordPress version before choosing.'
				),
			} );

			return {
				status: 'conflict_modal_local_override_failed',
				error,
			};
		} finally {
			setConflictModalAction( null );
		}
	}, [
		__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof,
		__experimentalRefreshDistributedEditingRetrySubmitProof,
		__experimentalRefreshDistributedEditingServerStateAfterStaleBase,
		__experimentalSaveDistributedEditingRetryAfterProof,
		editedPostContent,
		handleSelectConflictVersion,
	] );
	const handleAcceptLatestWordPressVersion = useCallback( () => {
		setConflictModalAction( 'remote' );
		const normalized =
			normalizeDistributedEditingSessionState( sessionState );
		const serverContent = normalized.refetchedServerContent;

		if ( typeof serverContent !== 'string' ) {
			setActionStatus( {
				status: 'warning',
				message: __(
					'The WordPress version is not available. Keep this tab open and try again.'
				),
			} );
			setConflictModalAction( null );
			return null;
		}

		const parsedBlocks = parse( serverContent );

		if ( parsedBlocks.length || ! serverContent ) {
			resetEditorBlocks?.( parsedBlocks, {
				__unstableShouldCreateUndoLevel: false,
			} );
		}

		if ( currentPost?.type && currentPost?.id ) {
			receiveEntityRecords?.( 'postType', currentPost.type, [
				{
					...currentPost,
					content:
						currentPost.content &&
						typeof currentPost.content === 'object'
							? {
									...currentPost.content,
									raw: serverContent,
							  }
							: serverContent,
				},
			] );
		}

		editPost?.(
			{ content: serverContent },
			{
				undoIgnore: true,
			}
		);
		setDistributedEditingSessionState?.(
			getDistributedEditingAcceptedLatestWordPressVersionSessionState(
				normalized,
				serverContent
			)
		);
		setActionStatus( {
			status: 'success',
			message: __( 'Using the WordPress version.' ),
		} );
		setConflictModalAction( null );

		return {
			status: 'latest_wordpress_version_accepted',
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			mutatesEditorContent: true,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
		};
	}, [
		currentPost,
		editPost,
		receiveEntityRecords,
		resetEditorBlocks,
		sessionState,
		setDistributedEditingSessionState,
	] );
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
							'Using saved WordPress structure. Save is still paused until Save verifies this choice.'
					  )
					: __(
							'Keeping local structure. Save is still paused until Save verifies this choice.'
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

		const normalized =
			normalizeDistributedEditingSessionState( sessionState );

		const parsedBlocks = parse( structuralChoiceUndoContent );

		if ( parsedBlocks.length || ! structuralChoiceUndoContent ) {
			resetEditorBlocks?.( parsedBlocks, {
				__unstableShouldCreateUndoLevel: false,
			} );
		}

		editPost?.(
			{ content: structuralChoiceUndoContent },
			{ undoIgnore: true }
		);
		setStructuralChoiceUndoContent( null );

		const nextSessionState = setStructuralChoiceSessionState( {
			choice: DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
			mutatesEditorContent: true,
			normalized,
		} );

		setActionStatus( {
			status: 'info',
			message: __(
				'Restored local structure. Save is still paused until Save verifies this choice.'
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
				actionStatus={ hasConfirmedRetrySave ? null : actionStatus }
				noticeDescriptors={ noticeDescriptors }
				onAction={ handleAction }
				placement={ placement }
				unloadWarningState={ unloadWarningState }
			/>
			<DistributedEditingSameBlockConflictComparison
				actionStatus={ actionStatus }
				comparison={ conflictComparison }
				isApplyingLocal={ conflictModalAction === 'local' }
				isApplyingRemote={ conflictModalAction === 'remote' }
				onAcceptLatestWordPressVersion={
					handleAcceptLatestWordPressVersion
				}
				onAcceptLocalVersion={ handleAcceptLocalVersion }
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
			<DistributedEditingRemoteChangesReviewPrePublishPanel
				onResolve={ handleResolveRemoteChangesReview }
				review={ remoteChangesReview }
			/>
		</>
	);
}

function getActionErrorMessage( actionKey ) {
	switch ( actionKey ) {
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES:
			return __(
				'Protected local changes could not be copied. They remain in this editor session.'
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
				'Latest post could not be loaded. Protected local changes remain in this editor session; keep this tab open before trying again.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES:
			return __(
				'Latest post could not be loaded for review. Protected local changes remain in this editor session; keep this tab open before trying again.'
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
			'Recording the fresh-review decision locally without saving or sending review data.'
		);
	}

	if ( commandStatus === 'resolved' ) {
		return __(
			'Fresh-review decision recorded locally. No save was made, and the reviewed-block evidence remains redacted.'
		);
	}

	if ( commandStatus === 'submitting' ) {
		return __(
			'Submitting the fresh-review decision without saving or changing editor content.'
		);
	}

	if ( commandStatus === 'submitted' ) {
		return __(
			'Fresh-review decision recorded for the request. No save was made, and the reviewed-block evidence remained redacted.'
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
		'Fresh-review decisions can be recorded after every review item is approved or rejected.'
	);
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
				'Local changes are protected and remain exportable while WordPress waits for confirmation.'
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
				'WordPress accepted this Save. You can keep editing; WordPress will protect any new local changes.'
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
			'WordPress will protect local changes and show status here when review, refresh, or confirmation is needed.'
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
			'Save can update the post in WordPress.'
		),
		saveButtonAuthorityStatusText: __(
			'Save can update the post in WordPress.'
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
		saveStateSummaryText: __( 'Save can update the post in WordPress.' ),
		authorityStatusText: __( 'Save can update the post in WordPress.' ),
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
			'WordPress will protect local changes and show status here when review, refresh, or confirmation is needed.'
		),
	};
}

function getDistributedEditingHumanLoopStepCopy( humanLoopStepState ) {
	switch ( humanLoopStepState.step ) {
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED:
			return {
				title: __( 'Local changes protected' ),
				summary: __(
					'Keep editing. If WordPress confirmation is delayed, export this session before closing the tab.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST:
			return {
				title: __( 'Save will check WordPress' ),
				summary: __(
					'Use Save to check the current WordPress copy before the post updates.'
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
				title: __( 'Saving' ),
				summary: __( 'WordPress is saving your changes.' ),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED:
			return {
				title: __( 'Saved by WordPress' ),
				summary: __(
					'WordPress accepted this Save. No protected local changes remain pending for this save.'
				),
			};
	}

	return {
		title: __( 'Ready to edit' ),
		summary: __(
			'Edit normally. WordPress will step in if review, refresh, or confirmation is needed.'
		),
	};
}

function getDistributedEditingHumanLoopSaveJourneyCopy( humanLoopStepState ) {
	switch ( humanLoopStepState.step ) {
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED:
			return {
				title: __( 'Keep editing' ),
				summary: __( 'Use Save when you are ready.' ),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST:
			return {
				title: __( 'Save will check WordPress' ),
				summary: __(
					'Save will check the current WordPress copy before updating.'
				),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES:
			return {
				title: __( 'Review changes' ),
				summary: __( 'Review changes before saving.' ),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE:
			return {
				title: __( 'Ready to Save' ),
				summary: __( 'Use Save to update the post.' ),
			};
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.WAITING_FOR_WORDPRESS:
			return {
				title: __( 'Saving' ),
				summary: __( 'WordPress is saving your changes.' ),
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

	if (
		shellState.confirmedSaveShellQuieted &&
		shellState.confirmedSaveMergedEdits
	) {
		return __( 'Merged by WordPress' );
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

	if (
		shellState.confirmedSaveShellQuieted &&
		shellState.confirmedSaveMergedEdits
	) {
		return __( 'Ready for new edits.' );
	}

	if ( shellState.humanLoopStepState.confirmedByWordPress ) {
		return __( 'Ready for new edits.' );
	}

	return __( 'Other editors in this post appear below.' );
}

function getDistributedEditingEnabledShellSaveLine( shellState ) {
	switch ( shellState.humanLoopStep ) {
		case DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST:
			return __( 'Save checks WordPress before updating.' );
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
			</div>
		</div>
	);
}

/**
 * Renders the DE-RTC active-editor caterpillar for the editor toolbar.
 *
 * Presence transport still lives with the roster component; this wrapper only
 * changes the visible chrome so the toolbar shows avatars without the old
 * status labels or setup copy.
 *
 * @return {React.ReactNode} Rendered toolbar presence caterpillar.
 */
export function DistributedEditingPresenceToolbar() {
	const { editorSettings, sessionState } = useSelect( ( select ) => {
		const { getDistributedEditingSessionState, getEditorSettings } =
			select( editorStore );

		return {
			editorSettings: getEditorSettings?.() || {},
			sessionState: getDistributedEditingSessionState?.() || {},
		};
	}, [] );

	if ( ! editorSettings?.distributedEditing?.enabled ) {
		return null;
	}

	return (
		<DistributedEditingPresenceRoster
			initialPresenceRoster={
				editorSettings.distributedEditing?.initialPresenceRoster
			}
			presenceRepeatedRefreshRuntime={
				editorSettings.distributedEditing
					?.presenceRepeatedRefreshRuntime
			}
			presenceStorageReadiness={
				editorSettings.distributedEditing?.presenceStorageReadiness
			}
			presenceStartupPolicy={
				editorSettings.distributedEditing?.presenceStartupPolicy
			}
			sessionState={ sessionState }
			variant="toolbar"
		/>
	);
}

export function DistributedEditingPresenceRoster( {
	initialPresenceRoster,
	presenceRepeatedRefreshRuntime,
	presenceStorageReadiness,
	presenceStartupPolicy,
	sessionState = {},
	variant = 'status',
} ) {
	const isToolbarVariant = variant === 'toolbar';
	const distributedEditingDispatch = useDispatch( editorStore ) || {};
	const {
		__experimentalRefreshDistributedEditingPresenceSnapshot,
		__experimentalRefreshDistributedEditingPresenceStorageReadiness,
		__experimentalSendDistributedEditingPresenceHeartbeat,
		updateDistributedEditingSessionState,
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
	const [ pinnedPresenceEntryKey, setPinnedPresenceEntryKey ] =
		useState( null );
	const [ hoveredPresenceEntryKey, setHoveredPresenceEntryKey ] =
		useState( null );
	const expandedPresenceEntryKey =
		pinnedPresenceEntryKey || hoveredPresenceEntryKey;
	const presenceDetailsBaseId = useId();
	const presenceCaterpillarRef = useRef( null );
	const repeatedRefreshSchedulerTokenRef = useRef( null );
	const documentStateHeartbeatKeyRef = useRef( null );
	const startupHeartbeatRuntimeKeyRef = useRef( null );
	const startupHeartbeatRuntimeSentRef = useRef( false );
	const startupSnapshotRuntimeKeyRef = useRef( null );
	const startupSnapshotRuntimeSentRef = useRef( false );
	const setAuthorshipFocusEntry = useCallback(
		( entry ) => {
			updateDistributedEditingSessionState?.( {
				authorshipFocusAttributionKey: entry?.attributionKey || null,
				authorshipFocusPresenceEntryKey: entry?.key || null,
				authorshipFocusDisplayName:
					entry?.displayName ||
					getPresenceRosterEntryDisplayName( entry ) ||
					null,
				authorshipFocusActive: Boolean( entry?.attributionKey ),
			} );
		},
		[ updateDistributedEditingSessionState ]
	);
	const clearAuthorshipFocusEntry = useCallback(
		( options = {} ) => {
			if ( pinnedPresenceEntryKey && ! options.force ) {
				return;
			}

			updateDistributedEditingSessionState?.( {
				authorshipFocusAttributionKey: null,
				authorshipFocusPresenceEntryKey: null,
				authorshipFocusDisplayName: null,
				authorshipFocusActive: false,
			} );
		},
		[ pinnedPresenceEntryKey, updateDistributedEditingSessionState ]
	);
	const presenceEditorContentState = useSelect( ( select ) => {
		const { getCurrentPost, getEditedPostContent } = select( editorStore );
		const currentPost = getCurrentPost?.() || {};

		return {
			currentPostContent:
				getDistributedEditingPresenceRawPostContent( currentPost ),
			editedPostContent: getEditedPostContent?.() || '',
		};
	}, [] );
	const presenceSelectionStateKey = useSelect( ( select ) => {
		const blockEditorSelect = select( blockEditorStore );
		const selectionStart = blockEditorSelect.getSelectionStart?.();
		const selectionEnd = blockEditorSelect.getSelectionEnd?.();

		return [
			selectionStart?.clientId || '',
			selectionStart?.attributeKey || '',
			selectionStart?.offset ?? '',
			selectionEnd?.clientId || '',
			selectionEnd?.attributeKey || '',
			selectionEnd?.offset ?? '',
			blockEditorSelect.getSelectedBlockClientId?.() || '',
		].join( ':' );
	}, [] );
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
	const presenceBaseContent =
		typeof effectiveSessionState.clientBaseContent === 'string'
			? effectiveSessionState.clientBaseContent
			: presenceEditorContentState.currentPostContent;
	const presenceComparableEditedPostContent =
		typeof presenceEditorContentState.editedPostContent === 'string'
			? getDistributedEditingComparablePostContent(
					presenceEditorContentState.editedPostContent
			  )
			: null;
	const presenceComparableBaseContent =
		typeof presenceBaseContent === 'string'
			? getDistributedEditingComparablePostContent( presenceBaseContent )
			: null;
	const hasPresenceLocalContentChanges =
		typeof presenceComparableEditedPostContent === 'string' &&
		typeof presenceComparableBaseContent === 'string' &&
		presenceComparableEditedPostContent !== presenceComparableBaseContent;
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
	const rosterDisplayEntries = getPresenceRosterDisplayEntries(
		rosterState.entries
	);
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
	const documentStateHeartbeatKey = [
		effectiveSessionState.serverVersion ||
			effectiveSessionState.clientBaseVersion ||
			'',
		effectiveSessionState.distributedEditingPostStateHash || '',
		normalizeCount( effectiveSessionState.pendingChangeCount ),
		effectiveSessionState.hasPendingChanges ? 'pending' : 'clean',
		hasPresenceLocalContentChanges ? 'dirty' : 'clean',
		hasPresenceLocalContentChanges
			? presenceComparableEditedPostContent
			: '',
		presenceSelectionStateKey,
	].join( ':' );
	const shouldRunDocumentStateHeartbeat =
		storageReadyForStartupHeartbeat &&
		startupPolicyState.serverContact !== 'degraded' &&
		typeof __experimentalSendDistributedEditingPresenceHeartbeat ===
			'function' &&
		Boolean(
			effectiveSessionState.serverVersion ||
				effectiveSessionState.clientBaseVersion
		);
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

	useEffect( () => {
		if ( ! expandedPresenceEntryKey ) {
			return undefined;
		}

		const ownerDocument =
			presenceCaterpillarRef.current?.ownerDocument ||
			globalThis.document;

		if ( ! ownerDocument ) {
			return undefined;
		}

		const handlePointerDown = ( event ) => {
			if (
				presenceCaterpillarRef.current &&
				! presenceCaterpillarRef.current.contains( event.target )
			) {
				setPinnedPresenceEntryKey( null );
				setHoveredPresenceEntryKey( null );
			}
		};
		const handleKeyDown = ( event ) => {
			if ( event.key === 'Escape' ) {
				setPinnedPresenceEntryKey( null );
				setHoveredPresenceEntryKey( null );
			}
		};

		ownerDocument.addEventListener( 'mousedown', handlePointerDown );
		ownerDocument.addEventListener( 'keydown', handleKeyDown );

		return () => {
			ownerDocument.removeEventListener( 'mousedown', handlePointerDown );
			ownerDocument.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [ expandedPresenceEntryKey ] );

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
		if ( ! shouldRunDocumentStateHeartbeat ) {
			documentStateHeartbeatKeyRef.current = null;
			return undefined;
		}

		if (
			documentStateHeartbeatKeyRef.current === documentStateHeartbeatKey
		) {
			return undefined;
		}

		documentStateHeartbeatKeyRef.current = documentStateHeartbeatKey;

		let isCancelled = false;
		const timeoutId = globalThis.setTimeout( async () => {
			if ( isCancelled ) {
				return;
			}

			setPresenceHeartbeatUserInitiated( false );
			setHeartbeatCommandStatus( 'sending' );

			try {
				await __experimentalSendDistributedEditingPresenceHeartbeat();

				if ( ! isCancelled ) {
					setHeartbeatCommandStatus( 'sent' );
				}
			} catch ( error ) {
				const didDegrade =
					error?.code ===
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE;

				if ( ! isCancelled ) {
					setHeartbeatCommandStatus(
						didDegrade ? 'degraded' : 'failed'
					);
				}
			}
		}, DISTRIBUTED_EDITING_DOCUMENT_STATE_HEARTBEAT_DEBOUNCE_MS );

		return () => {
			isCancelled = true;
			globalThis.clearTimeout( timeoutId );
		};
	}, [
		__experimentalSendDistributedEditingPresenceHeartbeat,
		documentStateHeartbeatKey,
		shouldRunDocumentStateHeartbeat,
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

	if ( isToolbarVariant && rosterDisplayEntries.length === 0 ) {
		return null;
	}

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
	const presenceRosterClassName = [
		'editor-distributed-editing-status__presence-roster',
		isToolbarVariant &&
			'editor-distributed-editing-status__presence-roster--toolbar',
	]
		.filter( Boolean )
		.join( ' ' );
	const presenceCaterpillarClassName = [
		'editor-distributed-editing-status__presence-caterpillar',
		isToolbarVariant &&
			'editor-distributed-editing-status__presence-caterpillar--toolbar',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div
			aria-label={
				isToolbarVariant
					? __( 'Active editors' )
					: __( 'Distributed editing presence' )
			}
			className={ presenceRosterClassName }
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
			data-distributed-editing-presence-exposes-selection-presence={ formatDataBoolean(
				rosterState.exposesSelectionPresence
			) }
			data-distributed-editing-presence-exposes-raw-selected-text={ formatDataBoolean(
				rosterState.exposesRawSelectedText
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
				! isToolbarVariant && shouldShowPresenceFreshnessIndicator
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
				! isToolbarVariant && shouldShowPresenceStartupPolicy
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
				! isToolbarVariant && shouldShowPresenceStorageReadiness
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
			data-distributed-editing-presence-display="caterpillar"
			data-distributed-editing-presence-caterpillar-overlap="true"
			data-distributed-editing-presence-caterpillar-click-details="true"
			data-distributed-editing-presence-placement={
				isToolbarVariant ? 'toolbar' : 'status'
			}
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
				! isToolbarVariant && shouldShowPresenceRefreshHint
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
				! isToolbarVariant &&
					Boolean( rosterState.copy.otherEditorActivityCue )
			) }
			data-distributed-editing-presence-actions-visible={ formatDataBoolean(
				! isToolbarVariant && shouldShowPresenceActions
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
				rosterDisplayEntries.length
			}
			data-distributed-editing-presence-visible-labels={ formatDataBoolean(
				! isToolbarVariant
			) }
			role="group"
		>
			{ ! isToolbarVariant && (
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
			) }
			{ ! isToolbarVariant && shouldShowPresenceRefreshHint && (
				<div
					className="editor-distributed-editing-status__presence-refresh-hint"
					data-distributed-editing-presence-refresh-hint-copy={
						rosterState.copy.refreshHint
					}
				>
					{ rosterState.copy.refreshHint }
				</div>
			) }
			{ ! isToolbarVariant && shouldShowPresenceFreshnessIndicator && (
				<div
					aria-live="polite"
					className="editor-distributed-editing-status__presence-freshness-indicator"
					data-distributed-editing-presence-freshness-indicator-visible="true"
				>
					<strong>{ presenceFreshnessIndicator.label }</strong>
					<div>{ presenceFreshnessIndicator.summary }</div>
				</div>
			) }
			{ ! isToolbarVariant && shouldShowPresenceStartupPolicy && (
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
			{ ! isToolbarVariant && shouldShowPresenceStorageReadiness && (
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
			{ ! isToolbarVariant && shouldShowPresenceActions && (
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
			{ ! isToolbarVariant && shouldShowPresenceRefreshCommandStatus && (
				<div role="status">
					{ getPresenceRefreshCommandStatusText( commandStatus ) }
				</div>
			) }
			{ ! isToolbarVariant &&
				shouldShowPresenceHeartbeatCommandStatus && (
					<div role="status">
						{ getPresenceHeartbeatCommandStatusText(
							heartbeatCommandStatus
						) }
					</div>
				) }
			{ rosterDisplayEntries.length > 0 && (
				<ul
					aria-label={
						isToolbarVariant
							? __( 'Active editors' )
							: __( 'Visible editors' )
					}
					className={ presenceCaterpillarClassName }
					data-distributed-editing-presence-caterpillar="overlapping-avatars"
					data-distributed-editing-presence-caterpillar-accessible="true"
					data-distributed-editing-presence-caterpillar-click-details="true"
					data-distributed-editing-presence-caterpillar-hover-expands="true"
					data-distributed-editing-presence-caterpillar-layout-stable="true"
					data-distributed-editing-presence-caterpillar-placement={
						isToolbarVariant ? 'toolbar' : 'status'
					}
					data-distributed-editing-presence-row-compaction="same-user-tabs"
					data-distributed-editing-presence-row-treatment-list="compact-status-badges"
					data-distributed-editing-presence-row-order="remote-editors-first"
					data-distributed-editing-presence-row-visual-treatment-list="subtle-status-stripe"
					ref={ presenceCaterpillarRef }
				>
					{ rosterDisplayEntries.map( ( entry, index ) => {
						const displayName =
							getPresenceRosterEntryDisplayName( entry );
						const statusLabel =
							getPresenceRosterEntryStatusLabel( entry );
						const statusTone =
							getPresenceRosterEntryStatusTone( entry );
						const isExpanded =
							expandedPresenceEntryKey === entry.key;
						const isPinned = pinnedPresenceEntryKey === entry.key;
						const detailsId = `${ presenceDetailsBaseId }-${ index }`;
						const sessionDurationLabel =
							getPresenceRosterEntrySessionDurationLabel( entry );
						const avatarUrl =
							getPresenceRosterEntryAvatarUrl( entry );
						const hasAvatarImage = Boolean( avatarUrl );
						const permissionItems =
							getPresenceRosterEntryPermissionItems( entry );
						const hasPermissions = permissionItems.length > 0;
						const documentState =
							getPresenceRosterEntryDocumentState(
								entry,
								sessionState
							);
						const documentStateLabel =
							getPresenceRosterEntryDocumentStateLabel(
								documentState
							);
						const accessibleStatusLabel = documentState.available
							? sprintf(
									/* translators: 1: presence status, 2: document state. */
									__( '%1$s, %2$s' ),
									statusLabel,
									documentStateLabel
							  )
							: statusLabel;
						const documentStateDetails =
							getPresenceRosterEntryDocumentStateDetails(
								entry,
								documentState
							);
						const selectionLabel =
							getPresenceRosterEntrySelectionLabel( entry );
						const rowClassName = [
							'editor-distributed-editing-status__presence-roster-item',
							'editor-distributed-editing-status__presence-caterpillar-item',
							`editor-distributed-editing-status__presence-roster-item--${ statusTone }`,
							`editor-distributed-editing-status__presence-caterpillar-item--document-${ documentState.status }`,
							isExpanded &&
								'editor-distributed-editing-status__presence-caterpillar-item--expanded',
						]
							.filter( Boolean )
							.join( ' ' );
						const avatarClassName = [
							'editor-distributed-editing-status__presence-roster-avatar',
							'editor-distributed-editing-status__presence-caterpillar-avatar',
							`editor-distributed-editing-status__presence-roster-avatar--${ statusTone }`,
						].join( ' ' );

						return (
							<li
								aria-label={ sprintf(
									/* translators: 1: editor display name, 2: presence and document status. */
									__( '%1$s, %2$s' ),
									displayName,
									accessibleStatusLabel
								) }
								className={ rowClassName }
								data-distributed-editing-presence-row-document-state={
									documentState.status
								}
								data-distributed-editing-presence-row-document-state-authoritative-for-save="false"
								data-distributed-editing-presence-row-document-state-available={ formatDataBoolean(
									documentState.available
								) }
								data-distributed-editing-presence-row-document-state-has-pending-changes={ formatDataBoolean(
									documentState.hasPendingChanges
								) }
								data-distributed-editing-presence-row-document-state-visual-color-only="false"
								data-distributed-editing-presence-row-current={ formatDataBoolean(
									isPresenceRosterEntryCurrent( entry )
								) }
								data-distributed-editing-presence-row-exposes-cursor="false"
								data-distributed-editing-presence-row-exposes-private-fields="false"
								data-distributed-editing-presence-row-exposes-raw-content="false"
								data-distributed-editing-presence-row-exposes-selection="false"
								data-distributed-editing-presence-row-exposes-selection-presence={ formatDataBoolean(
									Boolean( entry.selectionState?.available )
								) }
								data-distributed-editing-presence-row-exposes-raw-selected-text="false"
								data-distributed-editing-presence-row-freshness={
									statusTone
								}
								data-distributed-editing-presence-row-has-avatar-image={ formatDataBoolean(
									hasAvatarImage
								) }
								data-distributed-editing-presence-row-has-avatar-initial={ formatDataBoolean(
									! hasAvatarImage
								) }
								data-distributed-editing-presence-row-has-status-affordance="true"
								data-distributed-editing-presence-row-permissions-visible={ formatDataBoolean(
									hasPermissions
								) }
								data-distributed-editing-presence-row-relationship={ getPresenceRosterEntryRelationship(
									entry
								) }
								data-distributed-editing-presence-row-scan-treatment="avatar-name-status-chip"
								data-distributed-editing-presence-row-status-affordance="dot-and-label"
								data-distributed-editing-presence-row-status-tone={
									statusTone
								}
								data-distributed-editing-presence-row-tooltip-open={ formatDataBoolean(
									isExpanded
								) }
								data-distributed-editing-presence-row-tooltip-pinned={ formatDataBoolean(
									isPinned
								) }
								data-distributed-editing-presence-row-authorship-focus-available={ formatDataBoolean(
									Boolean( entry.authorshipFocusAvailable )
								) }
								data-distributed-editing-presence-row-treatment="compact-status-badge"
								data-distributed-editing-presence-row-visual-treatment="subtle-status-stripe"
								data-distributed-editing-presence-row-visual-treatment-color-only="false"
								data-distributed-editing-presence-row-visual-treatment-layout-stable="true"
								key={ entry.key }
								onMouseEnter={ () => {
									setHoveredPresenceEntryKey( entry.key );
									if ( ! pinnedPresenceEntryKey ) {
										setAuthorshipFocusEntry( entry );
									}
								} }
								onMouseLeave={ () => {
									if (
										pinnedPresenceEntryKey !== entry.key
									) {
										setHoveredPresenceEntryKey(
											( currentKey ) =>
												currentKey === entry.key
													? null
													: currentKey
										);
										clearAuthorshipFocusEntry();
									}
								} }
							>
								<button
									aria-controls={
										isExpanded ? detailsId : undefined
									}
									aria-describedby={
										isExpanded ? detailsId : undefined
									}
									aria-expanded={ isExpanded }
									aria-label={ sprintf(
										/* translators: 1: editor display name, 2: presence and document status. */
										__(
											'%1$s, %2$s. Show editing details'
										),
										displayName,
										accessibleStatusLabel
									) }
									className="editor-distributed-editing-status__presence-caterpillar-button"
									data-distributed-editing-presence-avatar-button="true"
									onClick={ ( event ) => {
										event.preventDefault();
										if ( isPinned ) {
											setPinnedPresenceEntryKey( null );
											clearAuthorshipFocusEntry( {
												force: true,
											} );
										} else {
											setPinnedPresenceEntryKey(
												entry.key
											);
											setAuthorshipFocusEntry( entry );
										}
										setHoveredPresenceEntryKey( null );
									} }
									onBlur={ () => {
										if (
											pinnedPresenceEntryKey !== entry.key
										) {
											setHoveredPresenceEntryKey(
												( currentKey ) =>
													currentKey === entry.key
														? null
														: currentKey
											);
											clearAuthorshipFocusEntry();
										}
									} }
									onFocus={ () => {
										setHoveredPresenceEntryKey( entry.key );
										if ( ! pinnedPresenceEntryKey ) {
											setAuthorshipFocusEntry( entry );
										}
									} }
									type="button"
								>
									<span
										aria-hidden="true"
										className={ avatarClassName }
									>
										{ hasAvatarImage ? (
											<img
												alt=""
												className="editor-distributed-editing-status__presence-caterpillar-avatar-image"
												data-distributed-editing-presence-avatar-image="true"
												src={ avatarUrl }
											/>
										) : (
											getPresenceRosterEntryAvatarText(
												entry
											)
										) }
									</span>
									<span className="editor-distributed-editing-status__presence-caterpillar-status-dot" />
									<span
										aria-hidden="true"
										className={ `editor-distributed-editing-status__presence-caterpillar-document-cue editor-distributed-editing-status__presence-caterpillar-document-cue--${ documentState.status }` }
									/>
								</button>
								{ isExpanded && (
									<div
										className="editor-distributed-editing-status__presence-caterpillar-details"
										data-distributed-editing-presence-details-exposes-private-fields="false"
										data-distributed-editing-presence-details-exposes-raw-content="false"
										id={ detailsId }
										role="tooltip"
									>
										<strong className="editor-distributed-editing-status__presence-caterpillar-details-name">
											{ displayName }
										</strong>
										<span className="editor-distributed-editing-status__presence-caterpillar-details-status">
											{ statusLabel }
										</span>
										{ sessionDurationLabel && (
											<span className="editor-distributed-editing-status__presence-caterpillar-details-duration">
												{ sessionDurationLabel }
											</span>
										) }
										{ documentStateDetails.map(
											( item ) => (
												<span
													className="editor-distributed-editing-status__presence-caterpillar-details-document-state"
													key={ item.key }
												>
													{ item.label }
												</span>
											)
										) }
										{ selectionLabel && (
											<span className="editor-distributed-editing-status__presence-caterpillar-details-selection-state">
												{ selectionLabel }
											</span>
										) }
										{ hasPermissions && (
											<ul
												aria-label={ __(
													'Permissions'
												) }
												className="editor-distributed-editing-status__presence-caterpillar-permissions"
											>
												{ permissionItems.map(
													( item ) => (
														<li
															className="editor-distributed-editing-status__presence-caterpillar-permission"
															key={ item.key }
														>
															{ item.label }
														</li>
													)
												) }
											</ul>
										) }
									</div>
								) }
							</li>
						);
					} ) }
				</ul>
			) }
		</div>
	);
}

function getPresenceRosterDisplayEntries( entries = [] ) {
	const sortedEntries = [ ...entries ].sort( ( a, b ) => {
		const relationshipPriority =
			getPresenceRosterEntryRelationshipPriority( a ) -
			getPresenceRosterEntryRelationshipPriority( b );

		if ( relationshipPriority !== 0 ) {
			return relationshipPriority;
		}

		const freshnessPriority =
			getPresenceRosterEntryFreshnessPriority( a ) -
			getPresenceRosterEntryFreshnessPriority( b );

		if ( freshnessPriority !== 0 ) {
			return freshnessPriority;
		}

		return 0;
	} );

	let hasRenderedSameUserOtherTab = false;

	return sortedEntries.filter( ( entry ) => {
		if (
			getPresenceRosterEntryRelationship( entry ) !==
			'same_user_other_tab'
		) {
			return true;
		}

		if ( hasRenderedSameUserOtherTab ) {
			return false;
		}

		hasRenderedSameUserOtherTab = true;

		return true;
	} );
}

function getPresenceRosterEntryRelationshipPriority( entry ) {
	switch ( getPresenceRosterEntryRelationship( entry ) ) {
		case 'other_user':
			return 0;
		case 'same_user_other_tab':
			return 1;
		case 'current_user_current_tab':
			return 2;
		default:
			return 3;
	}
}

function getPresenceRosterEntryFreshnessPriority( entry ) {
	return isPresenceRosterEntryCurrent( entry ) ? 0 : 1;
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

function getPresenceRosterEntryDocumentState( entry, sessionState = {} ) {
	const documentState = entry?.documentState || {};
	const localBaseVersion =
		normalizeDisplayValue( sessionState.serverVersion ) ||
		normalizeDisplayValue( sessionState.clientBaseVersion );
	const localStateHash = normalizeDisplayValue(
		sessionState.distributedEditingPostStateHash
	);
	const remoteBaseVersion = normalizeDisplayValue(
		documentState.confirmedBaseVersion
	);
	const remoteStateHash = normalizeDisplayValue(
		documentState.confirmedStateHash
	);
	const hasPendingChanges = Boolean( documentState.hasPendingChanges );
	const baseMatches =
		documentState.available &&
		isPresenceRosterEntryCurrent( entry ) &&
		localBaseVersion &&
		remoteBaseVersion &&
		localBaseVersion === remoteBaseVersion;
	const hashMatches =
		! localStateHash ||
		( remoteStateHash && localStateHash === remoteStateHash );
	let status = 'unknown';

	if ( baseMatches && hashMatches ) {
		status = hasPendingChanges ? 'same-pending' : 'same-clean';
	} else if (
		documentState.available &&
		isPresenceRosterEntryCurrent( entry ) &&
		localBaseVersion &&
		remoteBaseVersion &&
		( ! localStateHash || remoteStateHash )
	) {
		status = hasPendingChanges ? 'different-pending' : 'different-clean';
	}

	return {
		status,
		available: Boolean( documentState.available ),
		hasPendingChanges,
		confirmedAtGmt:
			normalizeDisplayValue( documentState.confirmedAtGmt ) ||
			normalizeDisplayValue( documentState.reportedAtGmt ),
		presenceUpdatedAtGmt:
			normalizeDisplayValue( documentState.presenceUpdatedAtGmt ) ||
			normalizeDisplayValue( entry?.presenceUpdatedAtGmt ),
	};
}

function getPresenceRosterEntryDocumentStateLabel( documentState ) {
	switch ( documentState.status ) {
		case 'same-clean':
			return __( 'Same saved copy' );
		case 'same-pending':
			return __( 'Same saved copy, unsaved changes in that tab' );
		case 'different-clean':
			return __( 'Older saved copy' );
		case 'different-pending':
			return __( 'Older saved copy, unsaved changes in that tab' );
		default:
			return __( 'Copy status unknown' );
	}
}

function getPresenceRosterEntryDocumentStateDetails( entry, documentState ) {
	const items = [
		{
			key: 'document-state',
			label: getPresenceRosterEntryDocumentStateLabel( documentState ),
		},
	];
	const presenceUpdatedLabel = getPresenceRosterEntryRelativeTimeLabel(
		documentState.presenceUpdatedAtGmt,
		__( 'Presence updated' )
	);
	const confirmedAtLabel = getPresenceRosterEntryRelativeTimeLabel(
		documentState.confirmedAtGmt,
		__( 'Confirmed copy reported' )
	);

	if ( documentState.status === 'same-clean' ) {
		items.push( {
			key: 'document-clean',
			label: __( 'No unsaved changes reported' ),
		} );
	}

	if ( presenceUpdatedLabel ) {
		items.push( {
			key: 'presence-updated',
			label: presenceUpdatedLabel,
		} );
	}

	if ( documentState.available && confirmedAtLabel ) {
		items.push( {
			key: 'document-confirmed',
			label: confirmedAtLabel,
		} );
	} else if ( ! documentState.available ) {
		items.push( {
			key: 'document-unknown',
			label: __( 'Confirmed copy age unknown' ),
		} );
	}

	return items;
}

function getPresenceRosterEntrySelectionLabel( entry ) {
	const selectionState = entry?.selectionState;

	if ( ! selectionState?.available ) {
		return null;
	}

	switch ( selectionState.kind ) {
		case 'caret':
			return __( 'Cursor shared' );
		case 'rich_text':
		case 'range':
			return __( 'Selection shared' );
		case 'multi_block':
			return __( 'Multi-block selection shared' );
		case 'block':
			return __( 'Block focus shared' );
		case 'unsupported_surface':
			return __( 'Selection is outside the editable canvas' );
		default:
			return null;
	}
}

function getPresenceRosterEntryRelativeTimeLabel( timestamp, prefix ) {
	const normalizedTimestamp = normalizeDisplayValue( timestamp );

	if ( ! normalizedTimestamp ) {
		return null;
	}

	const parsedTime = Date.parse(
		normalizedTimestamp.includes( 'T' )
			? normalizedTimestamp
			: `${ normalizedTimestamp } UTC`
	);

	if ( Number.isNaN( parsedTime ) ) {
		return null;
	}

	const elapsedSeconds = Math.max(
		0,
		Math.floor( ( Date.now() - parsedTime ) / 1000 )
	);

	if ( elapsedSeconds < 60 ) {
		return sprintf(
			/* translators: 1: presence/document timestamp label, 2: elapsed seconds. */
			_n( '%1$s %2$d sec ago', '%1$s %2$d sec ago', elapsedSeconds ),
			prefix,
			elapsedSeconds
		);
	}

	const elapsedMinutes = Math.floor( elapsedSeconds / 60 );

	if ( elapsedMinutes < 60 ) {
		return sprintf(
			/* translators: 1: presence/document timestamp label, 2: elapsed minutes. */
			_n( '%1$s %2$d min ago', '%1$s %2$d min ago', elapsedMinutes ),
			prefix,
			elapsedMinutes
		);
	}

	const elapsedHours = Math.floor( elapsedMinutes / 60 );

	return sprintf(
		/* translators: 1: presence/document timestamp label, 2: elapsed hours. */
		_n( '%1$s %2$d hr ago', '%1$s %2$d hr ago', elapsedHours ),
		prefix,
		elapsedHours
	);
}

function getPresenceRosterEntryAvatarText( entry ) {
	if ( entry.identityVisibility === 'anonymous' ) {
		return __( 'A' );
	}

	const displayName = getPresenceRosterEntryDisplayName( entry );
	const initial = displayName.trim().charAt( 0 ).toUpperCase();

	return initial || __( 'A' );
}

function getPresenceRosterEntryAvatarUrl( entry ) {
	if ( entry?.identityVisibility === 'anonymous' ) {
		return null;
	}

	if ( typeof entry?.avatarUrl !== 'string' ) {
		return null;
	}

	const avatarUrl = entry.avatarUrl.trim();

	return avatarUrl || null;
}

function getPresenceRosterEntrySessionDurationLabel( entry ) {
	const durationSeconds = Number( entry?.sessionDurationSeconds );

	if ( ! Number.isInteger( durationSeconds ) || durationSeconds < 0 ) {
		return null;
	}

	if ( durationSeconds < 60 ) {
		return __( 'Editing for less than a minute' );
	}

	const durationMinutes = Math.floor( durationSeconds / 60 );

	if ( durationMinutes < 60 ) {
		return sprintf(
			/* translators: %d: editing session duration in minutes. */
			_n( 'Editing for %d min', 'Editing for %d min', durationMinutes ),
			durationMinutes
		);
	}

	const durationHours = Math.floor( durationMinutes / 60 );

	return sprintf(
		/* translators: %d: editing session duration in hours. */
		_n( 'Editing for %d hr', 'Editing for %d hr', durationHours ),
		durationHours
	);
}

function getPresenceRosterEntryPermissionsAvailable( entry ) {
	return Boolean( entry?.permissionsAvailable );
}

function getPresenceRosterEntryPermissions( entry ) {
	return {
		canEdit: Boolean( entry?.permissions?.canEdit ),
		canPublish: Boolean( entry?.permissions?.canPublish ),
		canSaveDangerousHtml: Boolean(
			entry?.permissions?.canSaveDangerousHtml
		),
	};
}

function getPresenceRosterEntryPermissionItems( entry ) {
	if ( ! getPresenceRosterEntryPermissionsAvailable( entry ) ) {
		return [];
	}

	const permissions = getPresenceRosterEntryPermissions( entry );
	const items = [];

	if ( permissions.canEdit ) {
		items.push( {
			key: 'can-edit',
			label: __( 'Can edit' ),
		} );
	}

	if ( permissions.canPublish ) {
		items.push( {
			key: 'can-publish',
			label: __( 'Can publish' ),
		} );
	}

	if ( permissions.canSaveDangerousHtml ) {
		items.push( {
			key: 'can-save-custom-html',
			label: __( 'Can save custom HTML' ),
		} );
	}

	return items;
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
			<DistributedEditingFreshReviewDecisionPanel
				showAffordanceCommands={ false }
			/>
			<DistributedEditingStatus
				onAction={ onAction }
				placement="editor-interface-notices"
			/>
		</>
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
				retrySaveConfirmedMergedEdits:
					descriptor.retrySaveConfirmedMergedEdits,
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

function shouldSuppressConfirmedRetrySaveStatusNotice( item ) {
	return (
		isConfirmedRetrySaveStatusItem( item ) &&
		! item?.actionTranscriptLatestEventType &&
		! isRetrySaveFreshReviewRetrySaveItem( item )
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
			"Merged edits saved. Your changes and the other editor's non-conflicting changes are now in WordPress. Open details for version and revision evidence."
		);
	}

	return __( 'WordPress saved your changes. Ready for new edits.' );
}

function getPendingChangesMessage( descriptor ) {
	if (
		descriptor.localUpdatesImportStatus ===
		DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE
	) {
		if ( descriptor.localUpdatesImportHasAcceptedReviewApprovalProof ) {
			return __(
				'Admin-reviewed changes are ready for WordPress Save. They remain protected and exportable until WordPress confirms the update.'
			);
		}

		return __(
			'Protected recovery changes are ready for WordPress Save. They remain protected and exportable until WordPress confirms the update.'
		);
	}

	if (
		descriptor.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
	) {
		return __( 'WordPress is saving your changes.' );
	}

	if (
		descriptor.retrySubmitSaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY
	) {
		if ( isConflictResolutionProofAccepted( descriptor ) ) {
			return __(
				'Ready to Save this version. Use Save to ask WordPress to update the post; local changes remain protected until WordPress confirms.'
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
				'This version is ready. Continue Save before updating the post; the WordPress post has not changed yet.'
			);
		}

		return __(
			'These changes are ready. Continue Save before updating the post; local changes remain pending.'
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
	if (
		descriptor.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
	) {
		return {
			title: __( 'Saving' ),
			message: getPendingChangesMessage( descriptor ),
		};
	}

	if ( isConflictResolutionProofAccepted( descriptor ) ) {
		const savePrepared =
			descriptor.retrySubmitSaveStatus ===
			DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY;

		return {
			title: savePrepared
				? __( 'Ready to Save' )
				: __( 'Version checked' ),
			message: getPendingChangesMessage( descriptor ),
			nextStepAction: savePrepared
				? 'save_guarded_update'
				: 'prepare_guarded_save',
			nextStepMessage: savePrepared
				? __( 'Use Save to ask WordPress to update the post.' )
				: __(
						'Continue Save, then use Save to ask WordPress to update the post.'
				  ),
			conflictResolutionContinuationAction: savePrepared
				? 'save_guarded_update'
				: 'prepare_guarded_save',
			saveNowContextAction: savePrepared ? 'use_editor_save' : undefined,
			saveNowContextMessage: savePrepared
				? __( 'Save now: use the editor Save button.' )
				: undefined,
			saveNowContextStep: savePrepared
				? DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE
				: undefined,
		};
	}

	return {
		title: __( 'Save needed' ),
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
				'Save safety verified and kept the activity record content-free.'
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
				'WordPress saved your changes and kept the activity record private.'
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
			return __( 'The editor sent the review result.' );
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED:
			return __(
				'The editor validated the fresh-review handoff and kept the activity record content-free.'
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
		.filter(
			( actionKey ) =>
				actionKey !==
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES &&
				! (
					isRetrySaveReviewRequiredItem( item ) &&
					[
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
					].includes( actionKey )
				) &&
				! (
					actionKey ===
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES &&
					item.retrySaveStatus ===
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
				)
		)
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
			return null;
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES:
			return null;
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT:
			return __( 'Continue Save' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE:
			if ( item?.conflictResolutionProofAccepted ) {
				return __( 'Continue Save' );
			}
			return __( 'Continue Save' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF:
			return __( 'Continue Save' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE:
			return null;
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
			'Fresh-review handoff copied. Send it to an admin reviewer; local changes remain protected until a new review is completed.'
		);
	}

	if ( isRetrySaveReviewRequiredItem( item ) ) {
		return __(
			'Protected local changes copied for HTML review. Keep this copy until a user with unfiltered HTML permission can inspect it.'
		);
	}

	return __(
		'Protected local changes copied. Keep this copy until WordPress confirms the update.'
	);
}

function FreshReviewAuthorityStatus() {
	return null;
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
			return __( 'Ready to Save' );
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING:
			return __( 'Checking review' );
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE:
			return __( 'Ready to Save' );
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
						'Protected changes need admin HTML review before Save can continue. %s No normal Save has run; protected local changes remain exportable.'
					),
					getFreshReviewReviewItemCountMessage( descriptor )
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATION_REQUIRED:
			return {
				title: __( 'Ready to Save' ),
				message: __(
					'Save will ask WordPress to check the reviewed changes before updating the post. Local changes remain protected until WordPress confirms Save.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING:
			return {
				title: __( 'Checking review' ),
				message: __(
					'WordPress is checking the review before it can update the post. Local changes remain protected until this finishes.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE:
			return {
				title: __( 'Ready to Save' ),
				message: __(
					'Reviewed changes are ready for Save. Local changes remain protected until WordPress confirms Save.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REFETCH_REQUIRED:
			return {
				title: __( 'Save will check WordPress' ),
				message: __(
					'Save will check the current WordPress copy before fresh review can continue. It will not save over protected local changes, which remain exportable.'
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
						'This fresh-review decision was already used by WordPress Save. Request a new fresh review before continuing; protected local changes remain exportable.'
					),
				};
			}

			return {
				title: __( 'Fresh review blocked' ),
				message: __(
					'Fresh review cannot continue from the current review state. Request a new review before continuing; protected local changes remain exportable.'
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
			'This transcript is diagnostic only; WordPress Save evidence is still required before treating these changes as saved.'
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
			'Activity context: %1$s; %2$s%3$s. Diagnostic only; WordPress Save evidence is still required.'
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
		return __( 'Checking the reviewed changes and the admin review.' );
	}

	if ( commandStatus === 'failed' ) {
		return __(
			'Review check failed before any local change was applied. Protected local changes remain protected, and no server request was sent.'
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
				'Review checked. These changes are ready in this editor for WordPress Save. They remain protected until WordPress confirms Save.'
			);
		}

		return __(
			'Recovery changes are ready in this editor for WordPress Save. They remain protected until WordPress confirms Save.'
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
				'Review check blocked: the pasted protected-changes text is missing or malformed. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FORMAT_MISMATCH:
			return __(
				'Review check blocked: the pasted text is not a protected local-changes copy. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_ROUTE_MISMATCH:
			return __(
				'Review check blocked: the protected changes are for a different editor route. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_POST_CONTENT:
			return __(
				'Review check blocked: the protected changes do not include post content. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_HASH_EVIDENCE:
			return __(
				'Review check blocked: the protected changes are missing content check evidence. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_CONTENT_HASH_MISMATCH:
			return __(
				'Review check blocked: the protected changes do not match the approved review. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_REVIEW_APPROVAL_PROOF:
			return __(
				'Review check blocked: this admin review is missing accepted approval. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXPIRED_REVIEW_APPROVAL_PROOF:
			return __(
				'Review check blocked: the admin-reviewed changes token or approval has expired. Local changes remain protected and exportable.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED:
			return __(
				'Review needs checking: this reviewed copy needs a fresh admin check before WordPress can Save it. Your local changes remain protected and exportable.'
			);
		case DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXTRA_SESSION_STATE_OVEREXPOSED:
			return __(
				'Review check blocked: this reviewed copy exposes extra editor session state. Local changes remain protected.'
			);
	}

	return __(
		'Review check was blocked before any local change was applied. Protected local changes remain protected, and no server request was sent.'
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
			'Fresh review decisions are ready for a future Save step. No Save was made; protected local changes remain exportable until that review path exists.'
		);
	}

	if (
		descriptor?.localUpdatesImportReviewRequestStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED &&
		descriptor?.localUpdatesImportFreshReviewDecisionPanelRequired
	) {
		return __(
			'Fresh review request was accepted. A reviewer can approve or reject the redacted block decisions in the internal review panel; no Save was made.'
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
			'This reviewed copy needs a fresh admin check before WordPress can Save it. Request a new admin review before saving; nothing was saved or sent to WordPress.'
		);
	}

	return __(
		'Review check is blocked. Nothing was saved or sent to the server.'
	);
}

function getRefetchSuccessMessage( item ) {
	if ( isRetrySaveFreshReviewRetrySaveItem( item ) ) {
		return __(
			'Latest post loaded for fresh-review Save. Protected local changes remain in this editor session before retrying.'
		);
	}

	if ( isRetrySaveReviewRequiredItem( item ) ) {
		return __(
			'Latest post loaded for HTML review. Protected local changes remain in this editor session before retrying.'
		);
	}

	return __(
		'Latest post loaded. Protected local changes remain in this editor session before retrying.'
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
			return __( 'Ready to continue Save' );
		case 'staleBaseRetryProofAccepted':
			return __( 'Save ready' );
		case 'staleBaseRetryProofStale':
			return __( 'Save will check WordPress' );
		case 'staleBaseRetrySaveReady':
			return __( 'Save ready' );
		case 'staleBaseRetrySaveBlockedPermission':
			return __( 'Save blocked' );
		case 'staleBaseRetrySaveSaving':
			return __( 'Saving' );
		case 'staleBaseRetrySaveSaved':
			return __( 'Saved' );
		case 'staleBaseRetrySaveStale':
			return __( 'Save will check WordPress' );
		case 'staleBaseRetrySaveTampered':
			return __( 'Save changed' );
		case 'staleBaseRetrySaveUnfilteredHtml':
			return __( 'HTML review required before Save' );
		case 'staleBaseRetrySaveHandoffBlockedProof':
			return __( 'Save unavailable' );
		case 'staleBaseRetrySaveHandoffRefetch':
			return __( 'Save will check WordPress' );
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
					'Compare local changes with the WordPress copy before choosing what to keep.'
				),
			};
		case 'choose_structural_version':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Choose saved WordPress or local structure below before saving.'
				),
			};
		case 'export_for_html_review':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Ask someone with unfiltered HTML permission to review these changes.'
				),
			};
		case 'export_fresh_review_for_html_review':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Ask someone with unfiltered HTML permission to complete a fresh review.'
				),
			};
		case 'wait_for_save_proof':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Try Save again after WordPress accepts these changes.'
				),
			};
		case 'export_then_reload':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Keep this tab open until WordPress can check the latest copy.'
				),
			};
		case 'export_then_save':
			return {
				nextStepAction,
				nextStepMessage: __(
					'Keep this tab open, then try Save again.'
				),
			};
		case 'keep_tab_open':
			return {
				nextStepAction,
				nextStepMessage: __( 'WordPress is saving your changes.' ),
			};
		case 'export_before_continuing':
			return {
				nextStepAction,
				nextStepMessage: __( 'Keep this tab open before continuing.' ),
			};
	}

	return {};
}

function getStaleBaseStatusText( descriptor ) {
	if ( isSameBlockManualLocalRebaseConflict( descriptor ) ) {
		return {
			title: __( 'Conflicting update not saved' ),
			message: __(
				'Nothing was overwritten. Your local changes are protected in this editor. Compare the saved WordPress version with your local version, then choose one to keep.'
			),
		};
	}

	if ( isStructuralManualLocalRebaseConflict( descriptor ) ) {
		const remoteReviewContextMessage =
			getRemoteReviewContextMessage( descriptor );
		const saveNowContext = getSaveNowContext( descriptor );

		return {
			title: __( 'Choose block structure' ),
			message: getManualLocalRebaseConflictMessage( descriptor ),
			remoteReviewContextMessage,
			...saveNowContext,
			...getNextStepDescriptor( 'choose_structural_version' ),
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
			title: __( 'Save will check WordPress' ),
			message: __(
				'Save will check the current WordPress copy before updating.'
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
			title: __( 'Save will check WordPress' ),
			message: __(
				'Save will check the current WordPress copy before updating.'
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
			title: __( 'Ready to continue Save' ),
			message: __(
				'Local changes are ready. Continue Save before updating the post.'
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
					'WordPress checked the post and local changes were applied in this editor. Continue Save before updating the post.'
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
					'Save needs to check WordPress before applying local changes.'
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
			title: __( 'WordPress check incomplete' ),
			message: __(
				'The editor needs both the starting post and current WordPress copy before it can apply local changes. Keep this tab open while WordPress checks the post.'
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
			title: __( 'WordPress checked' ),
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
			'Save will check WordPress and then say whether local changes can be applied, need comparison, or are ready to update.'
		),
		remoteReviewContextMessage,
		...saveNowContext,
	};
}

function getSaveNowContext( descriptor ) {
	if ( isStructuralManualLocalRebaseConflict( descriptor ) ) {
		return {
			saveNowContextAction: 'choose_block_structure',
			saveNowContextMessage: __(
				'Save is paused until you choose a block structure.'
			),
			saveNowContextStep:
				DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
		};
	}

	if (
		descriptor?.requiresManualConflictResolution ||
		descriptor?.localRebaseResultStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED
	) {
		return {
			saveNowContextAction: 'compare_conflicting_changes',
			saveNowContextMessage: sprintf(
				/* translators: %s: Distributed Editing action needed before Save can update the post, such as "resolve changes". */
				__( 'Save now: %s before Save can update the post.' ),
				__( 'resolve changes' )
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
			/* translators: %s: Distributed Editing action needed before Save can update the post, such as "resolve changes". */
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

function getRemoteReviewContextMessage() {
	/*
	 * Remote-review context duplicated the visible next step and made automatic
	 * Save recovery flash an unrelated review path. Keep the status surface
	 * focused on the Save action that is actually available.
	 */
	return null;
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

function isStructuralManualLocalRebaseConflict( descriptor ) {
	return (
		descriptor?.localRebaseResultStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED &&
		DISTRIBUTED_EDITING_STRUCTURAL_CONFLICT_REASONS.has(
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
				title: __( 'Saving' ),
				message: __( 'WordPress is saving your changes.' ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED:
			return {
				title: __( 'Saved' ),
				message: getRetrySaveConfirmedMessage( descriptor ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED:
			return {
				title: __( 'Save will check WordPress' ),
				message: __( 'Save will check WordPress before trying again.' ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED:
			if (
				descriptor.reasonCode ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML
			) {
				return {
					title: __( 'Save needs HTML permission' ),
					message: __(
						'The HTML review was accepted, but this account cannot perform the final HTML-capable save. Ask someone with HTML permission to complete the save.'
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
			if ( isRetrySaveReviewRequiredItem( descriptor ) ) {
				return {
					title: __( 'Safe parts saved' ),
					message: __(
						'WordPress saved the safe parts, but one block was blocked.'
					),
				};
			}
			return {
				title: __( 'HTML review required before Save' ),
				message: __(
					'One block needs review from someone with HTML permission. Safe edits that WordPress accepted stay in the post, and the blocked block stays pending in this editor.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED:
			if (
				isExpiredOpaqueReviewApprovalProofTokenRetrySave( descriptor )
			) {
				return {
					title: __( 'Reviewed changes token expired' ),
					message: __(
						'The reviewed changes token has expired and is no longer usable for Save. No server save was made. Request a fresh admin review before trying again; protected local changes remain exportable.'
					),
				};
			}

			return {
				title: __( 'Save not completed' ),
				message: __(
					'WordPress could not verify this Save. Your changes remain in this editor.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED:
			if (
				descriptor.reasonCode !==
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED
			) {
				return {
					title: __( 'Save not completed' ),
					message: __(
						'WordPress could not finish Save. Your changes remain in this editor.'
					),
				};
			}

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
						'The reviewed changes token could not be found in server storage and is no longer usable for Save. No server save was made. Request a fresh admin review before trying again; protected local changes remain exportable.'
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
			'WordPress returned an unrecognized Save state. Protected local changes remain exportable until WordPress confirms a save.'
		),
	};
}

function getFreshReviewRetrySaveStatusText( descriptor ) {
	switch ( descriptor.retrySaveStatus ) {
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING:
			return {
				title: __( 'Saving' ),
				message: __( 'WordPress is saving your changes.' ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED:
			return {
				title: __( 'Fresh-review Save confirmed' ),
				message: getFreshReviewRetrySaveConfirmedMessage( descriptor ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED:
			return {
				title: __( 'Save will check WordPress' ),
				message: __( 'Save will check WordPress before trying again.' ),
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
					'One block still needs review from someone with HTML permission. Safe edits that WordPress accepted stay in the post, and the blocked block stays pending in this editor.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED:
			if ( isAlreadyConsumedFreshReviewLifecycle( descriptor ) ) {
				return {
					title: __( 'Fresh-review decision already consumed' ),
					message: __(
						'This fresh-review decision was already used by WordPress Save. Protected local changes remain exportable; request a new fresh review before continuing.'
					),
				};
			}

			return {
				title: __( 'Fresh-review Save rejected' ),
				message: __(
					'WordPress could not verify the reviewed Save before saving. Protected local changes are still exportable for a new review; no normal save fallback was used.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED:
			if (
				descriptor.reasonCode !==
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED
			) {
				return {
					title: __( 'Fresh-review Save not completed' ),
					message: __(
						'WordPress could not finish the reviewed Save. Your changes remain in this editor.'
					),
				};
			}

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
	if ( descriptor.retrySaveConfirmedMergedEdits ) {
		return __( 'WordPress saved the merged edits. Ready for new edits.' );
	}

	return __( 'WordPress saved your changes. Ready for new edits.' );
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
				title: __( 'Save unavailable' ),
				message: __( 'Try Save again in a moment.' ),
				...getNextStepDescriptor( 'wait_for_save_proof' ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED:
			return {
				title: __( 'Save will check WordPress' ),
				message: __( 'Save will check WordPress before trying again.' ),
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
				title: __( 'Saving' ),
				message: __( 'WordPress is saving your changes.' ),
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
				'New blocks were added in both versions. Choose which structure to keep before saving.'
			);
		case 'block_deleted':
			return __(
				'Blocks were deleted in both versions. Choose which structure to keep before saving.'
			);
		case 'block_reordered':
			return __(
				'Blocks moved while you were editing. Choose which structure to keep before saving.'
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
