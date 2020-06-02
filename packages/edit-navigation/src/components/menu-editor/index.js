/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useNavigationBlocks from './use-navigation-blocks';
import useCreateMissingMenuItems from './use-create-missing-menu-items';
import useSaveNavigationBlocks from './use-save-navigation-blocks';
import MenuEditorShortcuts from './shortcuts';
import BlockEditorPanel from './block-editor-panel';
import NavigationStructurePanel from './navigation-structure-panel';

export default function MenuEditor( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const { blocks, setBlocks, menuItemsRef, query } = useNavigationBlocks(
		menuId
	);
	const saveBlocks = useSaveNavigationBlocks( blocks, menuItemsRef, query );
	const { createMissingMenuItems, onCreated } = useCreateMissingMenuItems(
		menuItemsRef
	);
	const eventuallySaveBlocks = () => onCreated( () => saveBlocks() );

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<MenuEditorShortcuts.Register />

			<BlockEditorProvider
				value={ blocks }
				onInput={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
				onChange={ ( updatedBlocks ) => {
					createMissingMenuItems( updatedBlocks );
					setBlocks( updatedBlocks );
				} }
				settings={ {
					...blockEditorSettings,
					templateLock: 'all',
					hasFixedToolbar: true,
				} }
			>
				<BlockEditorKeyboardShortcuts />
				<MenuEditorShortcuts saveBlocks={ eventuallySaveBlocks } />
				<NavigationStructurePanel
					blocks={ blocks }
					initialOpen={ isLargeViewport }
				/>
				<BlockEditorPanel
					saveBlocks={ eventuallySaveBlocks }
					menuId={ menuId }
					onDeleteMenu={ onDeleteMenu }
				/>
			</BlockEditorProvider>
		</div>
	);
}
