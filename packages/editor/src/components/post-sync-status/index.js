/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';

/**
 * Renders the sync status of a post.
 *
 * @return {React.ReactNode} The rendered sync status component.
 */
export default function PostSyncStatus() {
	const { syncStatus, postType } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const meta = getEditedPostAttribute( 'meta' );

		// When the post is first created, the top level wp_pattern_sync_status is not set so get meta value instead.
		const currentSyncStatus =
			meta?.wp_pattern_sync_status === 'unsynced'
				? 'unsynced'
				: getEditedPostAttribute( 'wp_pattern_sync_status' );

		return {
			syncStatus: currentSyncStatus,
			postType: getEditedPostAttribute( 'type' ),
		};
	} );

	if ( postType !== 'wp_block' ) {
		return null;
	}

	return (
		<PostPanelRow label={ __( 'Sync status' ) }>
			<div className="editor-post-sync-status__value">
				{ syncStatus === 'unsynced'
					? _x( 'Not synced', 'pattern (singular)' )
					: _x( 'Synced', 'pattern (singular)' ) }
			</div>
		</PostPanelRow>
	);
}
