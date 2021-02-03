/**
 * WordPress dependencies
 */
import {
	__experimentalBlockNavigationTree as BlockNavigationTree,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useFocusOnMount } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

export default function ListViewSidebar() {
	const { isListViewOpen, rootBlocks, selectedBlockClientId } = useSelect(
		( select ) => {
			const { getSelectedBlockClientId, __unstableGetBlockTree } = select(
				blockEditorStore
			);
			const { isListViewOpened } = select( 'core/edit-site' );
			return {
				isListViewOpen: isListViewOpened(),
				rootBlocks: __unstableGetBlockTree(),
				selectedBlockClientId: getSelectedBlockClientId(),
			};
		}
	);
	const { selectBlock } = useDispatch( blockEditorStore );
	const { setIsListViewOpened } = useDispatch( 'core/edit-site' );
	const focusOnMountRef = useFocusOnMount( 'firstElement' );

	useShortcut(
		'core/edit-site/toggle-list-view',
		useCallback( () => {
			if ( isListViewOpen ) {
				setIsListViewOpened( false );
			} else {
				setIsListViewOpened( true );
			}
		}, [ isListViewOpen, isListViewOpen ] ),
		{ bindGlobal: true }
	);

	if ( ! isListViewOpen ) {
		return null;
	}

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
				ref={ focusOnMountRef }
			>
				<BlockNavigationTree
					blocks={ rootBlocks }
					highlightBlocksOnHover
					selectBlock={ selectBlock }
					selectedBlockClientId={ selectedBlockClientId }
					showNestedBlocks
				/>
			</div>
		</div>
	);
}
