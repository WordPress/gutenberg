/**
 * WordPress dependencies
 */
import {
	__experimentalBlockNavigationTree as BlockNavigationTree,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

function useFocusSelectedOnMount() {
	return useCallback( ( node ) => {
		if ( ! node || node.contains( node.ownerDocument.activeElement ) ) {
			return;
		}

		const foundNode = node.querySelector(
			'.block-editor-block-navigation-leaf.is-selected'
		);

		const target = foundNode
			? focus.tabbable.find( foundNode )[ 0 ]
			: focus.tabbable.find( node )[ 0 ];

		if ( target ) {
			target.focus();
		}
	}, [] );
}

export default function ListViewSidebar() {
	const { isListViewOpen, rootBlocks, selectedBlockClientId } = useSelect(
		( select ) => {
			const { getSelectedBlockClientId, __unstableGetBlockTree } = select(
				blockEditorStore
			);
			const { isListViewOpened } = select( editSiteStore );
			return {
				isListViewOpen: isListViewOpened(),
				rootBlocks: __unstableGetBlockTree(),
				selectedBlockClientId: getSelectedBlockClientId(),
			};
		}
	);
	const { selectBlock } = useDispatch( blockEditorStore );
	const { setIsListViewOpened } = useDispatch( editSiteStore );
	const focusSelectedOnMountRef = useFocusSelectedOnMount();

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
				ref={ focusSelectedOnMountRef }
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
