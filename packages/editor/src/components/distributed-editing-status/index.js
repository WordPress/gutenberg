/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
} from '../../store/distributed-editing';

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
	const { noticeDescriptors, unloadWarningState } = useSelect( ( select ) => {
		const {
			getDistributedEditingNoticeDescriptors,
			getDistributedEditingUnloadWarningState,
		} = select( editorStore );

		return {
			noticeDescriptors: getDistributedEditingNoticeDescriptors(),
			unloadWarningState: getDistributedEditingUnloadWarningState(),
		};
	}, [] );

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

function normalizeCount( value ) {
	const count = Number( value );
	return Number.isInteger( count ) && count > 0 ? count : 0;
}
