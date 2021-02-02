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

export default function BlockNavigationSidebar() {
	const {
		isBlockNavigationOpen,
		rootBlocks,
		selectedBlockClientId,
	} = useSelect( ( select ) => {
		const { getSelectedBlockClientId, __unstableGetBlockTree } = select(
			blockEditorStore
		);
		const { isBlockNavigationOpened } = select( 'core/edit-site' );
		return {
			isBlockNavigationOpen: isBlockNavigationOpened(),
			rootBlocks: __unstableGetBlockTree(),
			selectedBlockClientId: getSelectedBlockClientId(),
		};
	} );
	const { selectBlock } = useDispatch( blockEditorStore );
	const { setIsBlockNavigationOpened } = useDispatch( 'core/edit-site' );
	const focusOnMountRef = useFocusOnMount( 'firstElement' );

	useShortcut(
		'core/edit-site/toggle-block-navigation',
		useCallback( () => {
			if ( isBlockNavigationOpen ) {
				setIsBlockNavigationOpened( false );
			} else {
				setIsBlockNavigationOpened( true );
			}
		}, [ isBlockNavigationOpen, setIsBlockNavigationOpened ] ),
		{ bindGlobal: true }
	);

	if ( ! isBlockNavigationOpen ) {
		return null;
	}

	return (
		<div className="edit-site-editor__block-navigation-panel">
			<div className="edit-site-editor__block-navigation-panel-header">
				<strong>{ __( 'List view' ) }</strong>
				<Button
					icon={ closeSmall }
					label={ __( 'Close block navigation sidebar' ) }
					onClick={ () => setIsBlockNavigationOpened( false ) }
				/>
			</div>
			<div
				className="edit-site-editor__block-navigation-panel-content"
				ref={ focusOnMountRef }
			>
				<BlockNavigationTree
					blocks={ rootBlocks }
					selectBlock={ selectBlock }
					selectedBlockClientId={ selectedBlockClientId }
					showNestedBlocks
				/>
			</div>
		</div>
	);
}
