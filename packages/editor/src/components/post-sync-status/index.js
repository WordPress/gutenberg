/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostSyncStatus() {
	const { meta, postType } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		return {
			meta: getEditedPostAttribute( 'meta' ),
			postType: getEditedPostAttribute( 'type' ),
		};
	}, [] );
	if ( postType !== 'wp_block' ) {
		return null;
	}
	const syncStatus = meta?.sync_status;
	const isFullySynced = ! syncStatus;

	return (
		<PanelRow className="edit-post-sync-status">
			<span>{ __( 'Sync status' ) }</span>
			<div>
				{ isFullySynced ? __( 'Fully synced' ) : __( 'Not synced' ) }
			</div>
		</PanelRow>
	);
}
