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
			meta: { ...meta, wp_block: { sync_status: syncStatus } },
		} );
	const syncStatus = meta?.wp_block?.sync_status;
	return (
		<PanelRow className="edit-post-sync-status">
			<span>{ __( 'Sync status' ) }</span>
			<ToggleControl
				__nextHasNoMarginBottom
				label={
					syncStatus === 'fully'
						? __( 'Fully synced' )
						: __( 'Not synced' )
				}
				checked={ syncStatus === 'fully' }
				onChange={ () => {
					onUpdateSync(
						syncStatus === 'fully' ? 'unsynced' : 'fully'
					);
				} }
			/>
		</PanelRow>
	);
}
