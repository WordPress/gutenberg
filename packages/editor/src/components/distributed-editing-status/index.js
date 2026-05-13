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
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_REASON_CODES,
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
			<DistributedEditingStatus onAction={ onAction } />
		</div>
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
		case 'manualResolution':
			return __( 'Manual resolution' );
	}

	return key;
}

function getRecoveryDryRunCommandStatusLabel( commandStatus ) {
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
