/**
 * WordPress dependencies
 */
import { Button, Notice, TextareaControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
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
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	getDistributedEditingFreshReviewDecisionStateForSessionState,
	getDistributedEditingFreshReviewPreSaveStateForSessionState,
	getDistributedEditingLocalUpdatesExportPayload,
	getDistributedEditingSavePolicyStateForSessionState,
	normalizeDistributedEditingSessionState,
} from '../../store/distributed-editing';
import PluginPrePublishPanel from '../plugin-pre-publish-panel';

const DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_REJECTION_DETAILS =
	Object.freeze( {
		UNKNOWN: 'unknown_retry_save_review_approval_proof_token',
		EXPIRED: 'retry_save_review_approval_proof_token_expired',
	} );

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

	return (
		<div
			aria-label={ __( 'Distributed editing fresh review decisions' ) }
			className="editor-distributed-editing-status__fresh-review-decisions"
			role="group"
		>
			<strong>{ __( 'Fresh review decisions' ) }</strong>
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
	const unloadWarningMessage =
		getDistributedEditingUnloadWarningMessage( unloadWarningState );
	const actionStatusMessage = actionStatus?.message;

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
					>
						<Notice
							className="editor-distributed-editing-status__notice"
							isDismissible={ false }
							status={ item.status }
							actions={ getNoticeActions( item, onAction ) }
						>
							<strong>{ item.title }</strong>
							<div>{ item.message }</div>
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
								'Retry submit prepared. Request server proof when ready.'
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
								'Guarded save path prepared. Save again to submit through the retry path.'
							),
						} );
						return prepareSaveResult;
					}
					case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF: {
						const proofResult =
							await __experimentalRefreshDistributedEditingRetrySubmitProof?.();
						setActionStatus( {
							status: 'info',
							message: __(
								'Retry submit proof refreshed. Save again to continue through the guarded retry path.'
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
									'Local changes retried over the refreshed server version.'
								),
							} );
							return rebaseResult;
						}

						const planResult =
							await __experimentalPlanDistributedEditingLocalRebaseAfterStaleBase?.();
						setActionStatus( {
							status: 'info',
							message: __( 'Local rebase readiness refreshed.' ),
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

	if (
		! shouldRenderDistributedEditingStatus(
			sessionState,
			unloadWarningState
		)
	) {
		return null;
	}

	return (
		<DistributedEditingStatusSurface
			actionStatus={ actionStatus }
			noticeDescriptors={ noticeDescriptors }
			onAction={ handleAction }
			placement={ placement }
			unloadWarningState={ unloadWarningState }
		/>
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
				'Retry submit could not be prepared. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE:
			return __(
				'Guarded save path could not be prepared. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF:
			return __(
				'Retry submit proof could not be refreshed. Local changes remain protected.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE:
			return __(
				'Server version could not be refreshed. Protected local changes remain in this editor session and can still be exported; keep this tab open before trying again.'
			);
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES:
			return __(
				'Local changes could not be retried. They remain protected in this editor session.'
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

	return __(
		'Fresh-review decisions can be recorded after every hash-only item is approved or rejected.'
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
			message: __(
				'Local changes are protected and remain exportable while WordPress waits for server confirmation.'
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
		message: __(
			'WordPress will protect local changes and show sync status here when review, refresh, or server confirmation is needed.'
		),
	};
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

	if ( ! editorSettings?.distributedEditing?.enabled ) {
		return null;
	}

	const shellState = getDistributedEditingEnabledShellState( sessionState );

	return (
		<div
			aria-label={ __( 'Distributed editing enabled status' ) }
			className="editor-distributed-editing-status__enabled-shell"
			data-distributed-editing-authority-state={
				shellState.authorityState
			}
			data-distributed-editing-local-protection={
				shellState.localProtection
			}
			data-distributed-editing-save-action={ shellState.saveAction }
			data-distributed-editing-save-state={ shellState.saveState }
			data-distributed-editing-server-contact={ shellState.serverContact }
			data-distributed-editing-shell="enabled"
			data-distributed-editing-shell-placement={ placement }
			role="region"
		>
			<Notice status="info" isDismissible={ false }>
				<strong>{ __( 'Distributed Editing enabled' ) }</strong>
				<div>{ shellState.message }</div>
				<div className="editor-distributed-editing-status__enabled-shell-save-state">
					<strong>{ __( 'Save state' ) }</strong>
					<div>{ shellState.saveStateSummaryText }</div>
				</div>
				<div className="editor-distributed-editing-status__enabled-shell-authority-state">
					<strong>{ __( 'WordPress post' ) }</strong>
					<div>{ shellState.authorityStatusText }</div>
				</div>
			</Notice>
		</div>
	);
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
		</>
	);
}

function getDistributedEditingStatusSurfaceItem( descriptor ) {
	switch ( descriptor?.kind ) {
		case DISTRIBUTED_EDITING_NOTICE_KINDS.SERVER_STATE_ACCEPTANCE_REQUIRED:
			return {
				...getBaseStatusItem( descriptor ),
				title: __( 'Server version available' ),
				message: __( 'Accept the server version before continuing.' ),
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
				title: __( 'Changes pending' ),
				message: getPendingChangesMessage( descriptor ),
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

function getPendingChangesMessage( descriptor ) {
	if (
		descriptor.localUpdatesImportStatus ===
		DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE
	) {
		if ( descriptor.localUpdatesImportHasAcceptedReviewApprovalProof ) {
			return __(
				'Admin-reviewed changes were imported locally with signed review proof and are ready for guarded save. They remain protected and exportable until the server confirms that path.'
			);
		}

		return __(
			'Protected recovery changes were imported locally and are ready for guarded save. They remain protected and exportable until the server confirms that path.'
		);
	}

	if (
		descriptor.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
	) {
		return __(
			'The guarded retry save is waiting for server confirmation. Protected local changes remain pending and exportable until confirmation.'
		);
	}

	if (
		descriptor.retrySubmitSaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY
	) {
		return __(
			'Retry submit is ready for the guarded save path. Local changes remain pending until that save finishes.'
		);
	}

	if (
		descriptor.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE
	) {
		return __(
			'Retry submit accepted the rebased changes for a future save. Local changes are still awaiting confirmation.'
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
				'WordPress refreshed server state and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED:
			return __(
				'WordPress refreshed retry proof and kept the activity record content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED:
			return __(
				'The editor Save state changed and the activity record stayed content-free.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REVIEW_REQUIRED:
			return __(
				'The editor recorded that review is required without exposing the reviewed content.'
			);
		case DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED:
			return __(
				'The editor requested fresh review and kept the activity record content-free.'
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
			return __( 'Accept server version' );
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
			return __( 'Prepare retry submit' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE:
			return __( 'Prepare guarded save' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF:
			return __( 'Refresh retry proof' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE:
			return __( 'Refresh server version' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES:
			return __( 'Retry local changes' );
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
			'Fresh-review handoff copied. Keep this copy until the server version is refreshed or a new review can be completed.'
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
			return __( 'Ready for guarded save' );
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
			return __( 'Consumed by retry save' );
		case 'accepted':
		case 'accepted_for_retry_save':
			return __( 'Accepted for retry save' );
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
						'Protected changes need hash-only admin review before Save can continue. %s No normal save or retry save has run; protected local changes remain exportable.'
					),
					getFreshReviewReviewItemCountMessage( descriptor )
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATION_REQUIRED:
			return {
				title: __( 'Fresh review validation required' ),
				message: __(
					'Reviewed changes are ready for server validation before guarded retry save. Save should continue only through fresh-review validation; no normal save fallback has run, and protected local changes remain exportable.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING:
			return {
				title: __( 'Fresh review validating' ),
				message: __(
					'The editor is validating hash-only fresh-review proof before any guarded retry save. No normal save has run; keep protected local changes exportable until validation finishes.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE:
			return {
				title: __( 'Fresh review ready for guarded save' ),
				message: __(
					'Hash-only fresh review proof is accepted for a future guarded retry save. Save may continue only through that guarded path; no normal save fallback has run, and protected local changes remain exportable until server confirmation.'
				),
			};
		case DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REFETCH_REQUIRED:
			return {
				title: __( 'Fresh review needs server refresh' ),
				message: __(
					'The server version must be refreshed before fresh review can continue. Refreshing only fetches server state; it does not save over protected local changes, which remain exportable.'
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
						'This fresh-review decision was already consumed by a retry save. Request a new fresh review or refresh the server version before continuing; protected local changes remain exportable.'
					),
				};
			}

			return {
				title: __( 'Fresh review blocked' ),
				message: __(
					'Fresh review cannot continue from the current proof state. Request a new review or refresh the server version before continuing; protected local changes remain exportable.'
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
				'Admin-reviewed changes were imported into this editor only, with route, hash, and signed review proof checks passing. They remain protected until guarded save is confirmed; no server request was sent.'
			);
		}

		return __(
			'Protected recovery changes were imported into this editor only, with route and hash checks passing. They remain protected until guarded save is confirmed; no server request was sent.'
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
				'Import blocked: this reviewed-changes handoff needs a fresh admin review before it can be imported for retry save. Nothing was imported, and local changes remain protected and exportable.'
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
			'Fresh review validation is accepted for a future guarded retry save. No retry save or normal save was made, and protected local changes remain exportable.'
		);
	}

	if (
		descriptor?.localUpdatesImportFreshReviewRetrySaveHandoffStatus ===
		DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING
	) {
		return __(
			'Fresh review decision is staged for validation before a future guarded retry save. No retry save or normal save was made, and protected local changes remain exportable.'
		);
	}

	if (
		descriptor?.localUpdatesImportReviewRequestStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED &&
		descriptor?.localUpdatesImportFreshReviewDecisionStatus ===
			DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY
	) {
		return __(
			'Fresh review decisions are ready for a future proof handoff. No retry save or normal save was made; protected local changes remain exportable until that proof path exists.'
		);
	}

	if (
		descriptor?.localUpdatesImportReviewRequestStatus ===
			DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED &&
		descriptor?.localUpdatesImportFreshReviewDecisionPanelRequired
	) {
		return __(
			'Fresh review request was accepted. A reviewer can approve or reject the hash-only block decisions in the internal review panel; no retry save or normal save was made.'
		);
	}

	if (
		descriptor?.localUpdatesImportReviewRequestStatus ===
		DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED
	) {
		return __(
			'Fresh review request was accepted for admin review. No retry save or normal save was made; protected local changes remain exportable until review returns.'
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
			'This fresh-review handoff cannot be imported for retry save because it has no usable accepted review proof. Request a new admin review before retry save; nothing was imported, saved, or sent to the server.'
		);
	}

	return __(
		'Reviewed changes import is blocked. Nothing was imported, saved, or sent to the server.'
	);
}

function getRefetchSuccessMessage( item ) {
	if ( isRetrySaveFreshReviewRetrySaveItem( item ) ) {
		return __(
			'Server version refreshed for fresh-review retry save. Protected local changes remain in this editor session and can still be exported before retrying.'
		);
	}

	if ( isRetrySaveReviewRequiredItem( item ) ) {
		return __(
			'Server version refreshed for HTML review. Protected local changes remain in this editor session and can still be exported before retrying.'
		);
	}

	return __(
		'Server version refreshed for review. Protected local changes remain in this editor session and can still be exported before retrying.'
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
			return __( 'Retry save ready' );
		case 'staleBaseRetrySaveBlockedPermission':
			return __( 'Retry save blocked' );
		case 'staleBaseRetrySaveSaving':
			return __( 'Retry save saving' );
		case 'staleBaseRetrySaveSaved':
			return __( 'Retry save saved' );
		case 'staleBaseRetrySaveStale':
			return __( 'Retry save stale' );
		case 'staleBaseRetrySaveTampered':
			return __( 'Retry save tampered' );
		case 'staleBaseRetrySaveUnfilteredHtml':
			return __( 'HTML review required before Save' );
		case 'staleBaseRetrySaveHandoffBlockedProof':
			return __( 'Retry save proof missing' );
		case 'staleBaseRetrySaveHandoffRefetch':
			return __( 'Retry save needs refresh' );
		case 'staleBaseRetrySaveHandoffMissingRoute':
			return __( 'Retry save route missing' );
		case 'staleBaseRetrySaveHandoffMissingContent':
			return __( 'Retry save content missing' );
		case 'staleBaseRetrySaveHandoffInProgress':
			return __( 'Retry save already running' );
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

function getStaleBaseStatusText( descriptor ) {
	if (
		descriptor.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED
	) {
		return {
			title: __( 'Retry save stale' ),
			message: __(
				'The server changed again before this retry save finished. Protected local changes are still exportable; refresh the server version before trying again.'
			),
		};
	}

	if (
		descriptor.retrySubmitProofStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED
	) {
		return {
			title: __( 'Retry submit stale' ),
			message: __(
				'The server changed after retry submit was prepared. Protected local changes remain exportable; refresh the server version before continuing.'
			),
		};
	}

	if (
		descriptor.retrySubmitHandoffStatus ===
		DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED
	) {
		return {
			title: __( 'Retry submit prepared' ),
			message: __(
				'Local changes are staged for the future retry path. No save has been sent yet.'
			),
		};
	}

	switch ( descriptor.localRebaseResultStatus ) {
		case DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED:
			return {
				title: __( 'Local changes rebased' ),
				message: __(
					'Local changes were merged with the server version and are ready for the next submit.'
				),
			};
		case DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED:
			return {
				title: __( 'Local rebase needs review' ),
				message: getManualLocalRebaseConflictMessage( descriptor ),
			};
		case DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.UNSAFE_CONTENT_BOUNDARY:
			return {
				title: __( 'Local rebase blocked' ),
				message: getUnsafeLocalRebaseBoundaryMessage( descriptor ),
			};
		case DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.BLOCKED_NEEDS_READY_PLAN:
			return {
				title: __( 'Local rebase not ready' ),
				message: __(
					'Refresh and prepare the server version before retrying local changes.'
				),
			};
	}

	if (
		descriptor.localRebasePlanStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY &&
		descriptor.hasLocalRebaseInputs === false
	) {
		return {
			title: __( 'Local rebase inputs missing' ),
			message: __(
				'Retain both the client base and refreshed server version before retrying local changes.'
			),
		};
	}

	if (
		descriptor.localRebasePlanStatus ===
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY &&
		descriptor.hasLocalRebaseInputs
	) {
		return {
			title: __( 'Local rebase ready' ),
			message: __(
				'Local changes can be rebased over the refreshed server version.'
			),
		};
	}

	return {
		title: __( 'Server version changed' ),
		message: __(
			'Refresh the server version before retrying local changes. Protected local changes remain in this editor session and can be exported before leaving.'
		),
	};
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
				title: __( 'Retry save in progress' ),
				message: __(
					'The editor is sending rebased changes through the guarded retry-save path. Keep this tab open; protected local changes remain exportable until the server confirms the save.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED:
			return {
				title: __( 'Retry save confirmed' ),
				message: getRetrySaveConfirmedMessage( descriptor ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED:
			return {
				title: __( 'Retry save stale' ),
				message: __(
					'The server changed again before this retry save finished. Protected local changes are still exportable; refresh the server version before trying again.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED:
			if (
				descriptor.reasonCode ===
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML
			) {
				return {
					title: __( 'Retry save needs HTML permission' ),
					message: __(
						'The HTML review proof was accepted, but this account cannot perform the final HTML-capable save. Protected local changes and the hash-only review proof remain exportable for someone with unfiltered HTML permission.'
					),
				};
			}

			return {
				title: __( 'Retry save permission changed' ),
				message: __(
					'Editing permission changed before the retry save finished. Protected local changes are still exportable; ask for access before retrying.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED:
			return {
				title: __( 'HTML review required before Save' ),
				message: __(
					'Save did not update the authoritative post because these changes may alter unfiltered HTML. Export them for review by someone with unfiltered HTML permission, or refresh the server version before deciding how to continue. Protected local changes remain exportable.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED:
			if (
				isExpiredOpaqueReviewApprovalProofTokenRetrySave( descriptor )
			) {
				return {
					title: __( 'Reviewed changes token expired' ),
					message: __(
						'The imported reviewed-changes token has expired and is no longer usable for retry save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.'
					),
				};
			}

			return {
				title: __( 'Retry save proof rejected' ),
				message: __(
					'The server rejected the retry-save proof because the sync metadata or proof flags changed unexpectedly. Protected local changes are still exportable; export them before continuing.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED:
			return {
				title: __( 'Retry save disabled' ),
				message: __(
					'Distributed Editing was disabled before the retry save finished. Protected local changes are still exportable; retry after Distributed Editing is enabled.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_ROUTE_MISMATCH:
			return {
				title: __( 'Retry save route changed' ),
				message: __(
					'The retry-save request targeted a different editor route. Protected local changes are still exportable; reload the editor only after exporting them.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD:
			if (
				isUnknownOpaqueReviewApprovalProofTokenRetrySave( descriptor )
			) {
				return {
					title: __( 'Reviewed changes token unavailable' ),
					message: __(
						'The imported reviewed-changes token could not be found in server storage and is no longer usable for retry save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.'
					),
				};
			}

			return {
				title: __( 'Retry save payload rejected' ),
				message: __(
					'The retry-save payload was incomplete or malformed. Protected local changes are still exportable; export them before trying again.'
				),
			};
	}

	return {
		title: __( 'Retry save unavailable' ),
		message: __(
			'Retry save returned an unrecognized state. Protected local changes remain exportable until the server confirms a save.'
		),
	};
}

function getFreshReviewRetrySaveStatusText( descriptor ) {
	switch ( descriptor.retrySaveStatus ) {
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING:
			return {
				title: __( 'Fresh-review retry save in progress' ),
				message: __(
					'The editor is sending reviewed local changes through the guarded retry-save path. Keep this tab open; protected local changes remain exportable until the server confirms the save.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED:
			return {
				title: __( 'Fresh-review retry save confirmed' ),
				message: getFreshReviewRetrySaveConfirmedMessage( descriptor ),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED:
			return {
				title: __( 'Fresh-review retry save stale' ),
				message: __(
					'The server changed after fresh review was validated. Protected local changes are still exportable; refresh the server version before trying again.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED:
			return {
				title: __( 'Fresh-review retry save needs permission' ),
				message: __(
					'Permission changed before the reviewed changes could be saved. Protected local changes are still exportable for another fresh review or a later retry.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED:
			return {
				title: __( 'Fresh-review Save needs HTML review' ),
				message: __(
					'The authoritative post was not updated because the server still requires HTML review. Export a new review handoff, or refresh the server version before deciding how to continue. Protected local changes remain exportable.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED:
			if ( isAlreadyConsumedFreshReviewLifecycle( descriptor ) ) {
				return {
					title: __( 'Fresh-review decision already consumed' ),
					message: __(
						'This fresh-review decision was already used by a server retry save. Protected local changes remain exportable; request a new fresh review or refresh the server version before continuing.'
					),
				};
			}

			return {
				title: __( 'Fresh-review retry save proof rejected' ),
				message: __(
					'The server rejected the reviewed retry-save proof before saving. Protected local changes are still exportable for a new review; no normal save fallback was used.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED:
			return {
				title: __( 'Fresh-review retry save disabled' ),
				message: __(
					'Distributed Editing was disabled before the reviewed changes could be saved. Protected local changes are still exportable for a later retry.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_ROUTE_MISMATCH:
			return {
				title: __( 'Fresh-review retry save route changed' ),
				message: __(
					'The reviewed retry-save request targeted a different editor route. Protected local changes are still exportable; reload only after exporting them.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD:
			return {
				title: __( 'Fresh-review retry save payload rejected' ),
				message: __(
					'The reviewed retry-save payload was incomplete or malformed. Protected local changes are still exportable for a new review before trying again.'
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

	if ( serverVersion && previousServerVersion && revisionCount > 0 ) {
		return sprintf(
			/* translators: 1: previous sync version, 2: saved sync version, 3: number of revisions. */
			_n(
				'Server confirmed the guarded retry-save, advanced the sync version from %1$s to %2$s, and recorded %3$d revision. Protected local changes are no longer pending for this save.',
				'Server confirmed the guarded retry-save, advanced the sync version from %1$s to %2$s, and recorded %3$d revisions. Protected local changes are no longer pending for this save.',
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
				'Server confirmed the guarded retry-save and advanced the sync version from %1$s to %2$s. Protected local changes are no longer pending for this save.'
			),
			previousServerVersion,
			serverVersion
		);
	}

	if ( serverVersion && revisionCount > 0 ) {
		return sprintf(
			/* translators: 1: saved sync version, 2: number of revisions. */
			_n(
				'Server confirmed the guarded retry-save at sync version %1$s and recorded %2$d revision. Protected local changes are no longer pending for this save.',
				'Server confirmed the guarded retry-save at sync version %1$s and recorded %2$d revisions. Protected local changes are no longer pending for this save.',
				revisionCount
			),
			serverVersion,
			revisionCount
		);
	}

	if ( serverVersion ) {
		return sprintf(
			/* translators: %s: saved sync version. */
			__(
				'Server confirmed the guarded retry-save at sync version %s. Protected local changes are no longer pending for this save.'
			),
			serverVersion
		);
	}

	if ( revisionCount > 0 ) {
		return sprintf(
			/* translators: %d: number of revisions. */
			_n(
				'Server confirmed the guarded retry-save and recorded %d revision. Protected local changes are no longer pending for this save.',
				'Server confirmed the guarded retry-save and recorded %d revisions. Protected local changes are no longer pending for this save.',
				revisionCount
			),
			revisionCount
		);
	}

	return __(
		'Server confirmed the guarded retry-save. Protected local changes are no longer pending for this save.'
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
				'Server confirmed the fresh-review retry-save, advanced the sync version from %1$s to %2$s, and recorded %3$d revision. Protected local changes are no longer pending for this save.',
				'Server confirmed the fresh-review retry-save, advanced the sync version from %1$s to %2$s, and recorded %3$d revisions. Protected local changes are no longer pending for this save.',
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
				'Server confirmed the fresh-review retry-save and advanced the sync version from %1$s to %2$s. Protected local changes are no longer pending for this save.'
			),
			previousServerVersion,
			serverVersion
		);
	}

	if ( serverVersion ) {
		return sprintf(
			/* translators: %s: saved sync version. */
			__(
				'Server confirmed the fresh-review retry-save at sync version %s. Protected local changes are no longer pending for this save.'
			),
			serverVersion
		);
	}

	return __(
		'Server confirmed the fresh-review retry-save. Protected local changes are no longer pending for this save.'
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
				title: __( 'Retry save needs accepted proof' ),
				message: __(
					'The editor could not verify accepted retry-save proof for this save. Protected local changes are still exportable; retry after the proof is ready.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED:
			return {
				title: __( 'Retry save needs server refresh' ),
				message: __(
					'The server state must be refreshed before retry-save can continue. Protected local changes are still exportable; refreshing only fetches server state and does not save over local changes.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_POST_ROUTE:
			return {
				title: __( 'Retry save route unavailable' ),
				message: __(
					'The editor could not identify the route for retry-save. Protected local changes are still exportable; reload the editor only after exporting them.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_PROPOSED_CONTENT:
			return {
				title: __( 'Retry save content unavailable' ),
				message: __(
					'The editor could not read the proposed post content for retry-save. Protected local changes are still exportable; export them before trying again.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS:
			return {
				title: __( 'Retry save already in progress' ),
				message: __(
					'A retry save is already waiting for server confirmation. Protected local changes remain exportable; keep this tab open until it finishes.'
				),
			};
	}

	return {
		title: __( 'Retry save blocked' ),
		message: __(
			'The editor blocked retry-save before normal save could run. Protected local changes are still exportable; export them before continuing.'
		),
	};
}

function getManualLocalRebaseConflictMessage( descriptor ) {
	switch ( descriptor.localRebaseResultReason ) {
		case 'block_inserted':
			return __(
				'Blocks were inserted in more than one version. Review the local and server versions before continuing.'
			);
		case 'block_deleted':
			return __(
				'Blocks were deleted in more than one version. Review the local and server versions before continuing.'
			);
		case 'block_reordered':
			return __(
				'Blocks were reordered while local edits were pending. Review the local and server versions before continuing.'
			);
		case 'same_block_changed':
			return __(
				'Local and server changes touched the same block. Review both versions before continuing.'
			);
	}

	return __( 'Local and server changes could not be merged automatically.' );
}

function getUnsafeLocalRebaseBoundaryMessage( descriptor ) {
	if ( descriptor.localRebaseResultReason === 'freeform_html' ) {
		return __(
			'The content is not represented by whole serialized blocks and needs manual review.'
		);
	}

	return __( 'The local change boundary is unsafe and needs manual review.' );
}
