/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Persistent inline notice shown when the user has chosen to continue editing
 * while the sync connection is disconnected. Hides automatically once the
 * connection is restored, and re-appears on subsequent disconnects.
 */
export default function SyncDisconnectedNotice() {
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

		// Stay visible through transient 'connecting' status flips between
		// retries. Hide once we've actually reconnected. The polling manager
		// emits 'connecting' at the start of every poll cycle, which would
		// otherwise cause the notice to flicker on each /updates request.
		const status = coreDataSelect.getSyncConnectionStatus()?.status;
		return status !== 'connected';
	}, [] );

	if ( ! isDisconnected ) {
		return null;
	}

	return (
		<Notice
			className="editor-sync-disconnected-notice"
			isDismissible={ false }
			status="warning"
		>
			{ __(
				"You're disconnected from real-time collaboration and editing locally. Changes will sync automatically when the connection returns."
			) }
		</Notice>
	);
}
