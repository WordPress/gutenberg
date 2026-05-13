/**
 * WordPress dependencies
 */
import { Button, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	normalizeDistributedEditingSessionState,
} from '../../store/distributed-editing';

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
		normalized.requiresServerStateAcceptance ||
		normalized.mustOfferLocalCopy ||
		normalized.retrySaveStatus !==
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE ||
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
			<DistributedEditingLocalRebaseStateInspector />
			<DistributedEditingStatus onAction={ onAction } />
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
 * Renders an inert DE-RTC status surface from pure selector output.
 *
 * @param {Object}   props                    Component props.
 * @param {Array}    props.noticeDescriptors  DE-RTC notice descriptors.
 * @param {Object}   props.unloadWarningState DE-RTC unload-warning state.
 * @param {Function} props.onAction           Optional action handler.
 *
 * @return {React.ReactNode} Rendered status surface.
 */
export function DistributedEditingStatusSurface( {
	noticeDescriptors = [],
	unloadWarningState = {},
	onAction,
} ) {
	const statusItems =
		getDistributedEditingStatusSurfaceItems( noticeDescriptors );
	const unloadWarningMessage =
		getDistributedEditingUnloadWarningMessage( unloadWarningState );

	if ( ! statusItems.length && ! unloadWarningMessage ) {
		return null;
	}

	return (
		<div
			aria-label={ __( 'Distributed editing status' ) }
			className="editor-distributed-editing-status"
			role="region"
		>
			{ statusItems.map( ( item ) => (
				<Notice
					className="editor-distributed-editing-status__notice"
					isDismissible={ false }
					key={ item.id }
					status={ item.status }
					actions={ getNoticeActions( item, onAction ) }
				>
					<strong>{ item.title }</strong>
					<div>{ item.message }</div>
				</Notice>
			) ) }
			{ unloadWarningMessage && (
				<div className="editor-distributed-editing-status__unload-warning">
					{ unloadWarningMessage }
				</div>
			) }
		</div>
	);
}

/**
 * Renders the selector-backed DE-RTC status surface.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onAction Optional action handler.
 *
 * @return {React.ReactNode} Rendered status surface.
 */
export default function DistributedEditingStatus( { onAction } ) {
	const { sessionState, noticeDescriptors, unloadWarningState } = useSelect(
		( select ) => {
			const {
				getDistributedEditingSessionState,
				getDistributedEditingNoticeDescriptors,
				getDistributedEditingUnloadWarningState,
			} = select( editorStore );

			return {
				sessionState: getDistributedEditingSessionState(),
				noticeDescriptors: getDistributedEditingNoticeDescriptors(),
				unloadWarningState: getDistributedEditingUnloadWarningState(),
			};
		},
		[]
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
			noticeDescriptors={ noticeDescriptors }
			onAction={ onAction }
			unloadWarningState={ unloadWarningState }
		/>
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

function getPendingChangesMessage( descriptor ) {
	if (
		descriptor.retrySaveStatus ===
		DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
	) {
		return __(
			'Retry save is waiting for server confirmation. Local changes remain pending.'
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
			const label = getActionLabel( actionKey );

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

function getActionLabel( actionKey ) {
	switch ( actionKey ) {
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.ACCEPT_SERVER_STATE:
			return __( 'Accept server version' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES:
			return __( 'Export local changes' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE:
			return __( 'Refresh server version' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES:
			return __( 'Retry local changes' );
		case DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES:
			return __( 'Review changes' );
	}

	return null;
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
				'The server changed before retry save completed. Refresh the server version before continuing.'
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
				'The server changed after retry submit was prepared. Refresh the server version before continuing.'
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
			'Refresh the server version before retrying local changes.'
		),
	};
}

function getRetrySaveStatusText( descriptor ) {
	switch ( descriptor.retrySaveStatus ) {
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING:
			return {
				title: __( 'Retry save in progress' ),
				message: __(
					'Local changes are being sent through the guarded retry-save path.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED:
			return {
				title: __( 'Retry save confirmed' ),
				message: __(
					'The server confirmed the retry-save update and cleared local pending changes.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED:
			return {
				title: __( 'Retry save stale' ),
				message: __(
					'The server changed before retry save completed. Refresh the server version before continuing.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED:
			return {
				title: __( 'Retry save blocked' ),
				message: __(
					'Permission changed before the retry save completed. Export local changes before continuing.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED:
			return {
				title: __( 'Retry save rejected' ),
				message: __(
					'The retry-save proof was rejected. Export local changes before continuing.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED:
			return {
				title: __( 'Retry save disabled' ),
				message: __(
					'Distributed Editing was disabled before the retry save completed.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_ROUTE_MISMATCH:
			return {
				title: __( 'Retry save route mismatch' ),
				message: __(
					'The retry-save request did not match the current post route.'
				),
			};
		case DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD:
			return {
				title: __( 'Retry save malformed' ),
				message: __(
					'The retry-save payload could not be accepted. Export local changes before continuing.'
				),
			};
	}

	return {
		title: __( 'Retry save unavailable' ),
		message: __( 'Retry save did not return a recognized state.' ),
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
