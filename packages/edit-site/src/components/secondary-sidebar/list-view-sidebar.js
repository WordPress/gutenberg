/**
 * WordPress dependencies
 */
import {
	__experimentalBlockNavigationTree as BlockNavigationTree,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function ListViewSidebar() {
	const { rootBlocks, selectedBlockClientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId, __unstableGetBlockTree } = select(
			blockEditorStore
		);
		return {
			rootBlocks: __unstableGetBlockTree(),
			selectedBlockClientId: getSelectedBlockClientId(),
		};
	} );
	const { selectBlock } = useDispatch( blockEditorStore );
	const { setIsListViewOpened } = useDispatch( editSiteStore );
	const [ listViewDialogRef, listViewDialogProps ] = useDialog( {
		onClose: () => setIsListViewOpened( false ),
	} );

	return (
		<div className="edit-site-editor__list-view-panel">
			<div className="edit-site-editor__list-view-panel-header">
				<strong>{ __( 'List view' ) }</strong>
				<Button
					icon={ closeSmall }
					label={ __( 'Close list view sidebar' ) }
					onClick={ () => setIsListViewOpened( false ) }
				/>
			</div>
			<div
				className="edit-site-editor__list-view-panel-content"
				ref={ listViewDialogRef }
				{ ...listViewDialogProps }
			>
				<BlockNavigationTree
					blocks={ rootBlocks }
					selectBlock={ selectBlock }
					selectedBlockClientId={ selectedBlockClientId }
					showNestedBlocks
					__experimentalPersistentListViewFeatures
				/>
			</div>
		</div>
	);
}
