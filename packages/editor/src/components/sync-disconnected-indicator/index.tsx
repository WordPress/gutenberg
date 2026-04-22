/**
 * WordPress dependencies
 */
import { Button, Tooltip } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { offline } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const NOTICE_ID = 'editor/sync-disconnected';

const TOOLTIP_TEXT = __(
	"You're disconnected from real-time collaboration. Your changes will sync when the connection returns."
);

/**
 * Surfaces the offline-editing state in two places:
 *
 *  1. A small status pill in the editor header next to the collaborators UI,
 *     so it's always visible without shifting content.
 *  2. A persistent snackbar with the full explanation, dispatched via the
 *     notices store, so users who don't notice the header pill still see the
 *     warning.
 *
 * Both surfaces are gated on the same condition: the user has chosen to edit
 * while disconnected and the sync transport is not currently connected.
 */
export default function SyncDisconnectedIndicator() {
	const isDisconnected = useSelect( ( selectFn ) => {
		if (
			! selectFn( editorStore ).isCollaborationEnabledForCurrentPost()
		) {
			return false;
		}

		const coreDataSelect = selectFn( coreDataStore );
		if ( ! unlock( coreDataSelect ).isEditingWhileDisconnected() ) {
			return false;
		}

		const status = coreDataSelect.getSyncConnectionStatus()?.status;
		return status !== 'connected';
	}, [] );

	const { createNotice, removeNotice } = useDispatch( noticesStore );

	useEffect( () => {
		if ( ! isDisconnected ) {
			removeNotice( NOTICE_ID );
			return;
		}

		createNotice( 'warning', TOOLTIP_TEXT, {
			id: NOTICE_ID,
			type: 'snackbar',
			// Require an explicit close so the snackbar persists for the
			// duration of the outage instead of auto-dismissing.
			explicitDismiss: true,
		} );

		return () => {
			removeNotice( NOTICE_ID );
		};
	}, [ isDisconnected, createNotice, removeNotice ] );

	if ( ! isDisconnected ) {
		return null;
	}

	return (
		<Tooltip text={ TOOLTIP_TEXT }>
			<Button
				className="editor-sync-disconnected-indicator"
				icon={ offline }
				isDestructive
				size="compact"
				variant="tertiary"
			>
				{ __( 'Offline' ) }
			</Button>
		</Tooltip>
	);
}
