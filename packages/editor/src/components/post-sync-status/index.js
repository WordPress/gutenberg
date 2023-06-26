/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ToggleControl, PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostSyncStatus() {
	const { editPost } = useDispatch( editorStore );
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
	const onUpdateSync = ( syncStatus ) =>
		editPost( {
			meta: {
				...meta,
				wp_block:
					syncStatus === 'unsynced'
						? { sync_status: syncStatus }
						: null,
			},
		} );
	const syncStatus = meta?.wp_block?.sync_status;
	const isFullySynced = ! syncStatus;

	return (
		<PanelRow className="edit-post-sync-status">
			<span>{ __( 'Syncing' ) }</span>
			<ToggleControl
				__nextHasNoMarginBottom
				label={
					isFullySynced ? __( 'Fully synced' ) : __( 'Not synced' )
				}
				checked={ isFullySynced }
				onChange={ () => {
					onUpdateSync(
						syncStatus === 'unsynced' ? 'fully' : 'unsynced'
					);
				} }
			/>
		</PanelRow>
	);
}
