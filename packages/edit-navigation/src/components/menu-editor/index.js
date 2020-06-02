/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useMenuItems from './use-menu-items';
import useNavigationBlocks from './use-navigation-blocks';
import useCreateMissingMenuItems from './use-create-missing-menu-items';
import useSaveNavigationBlocks from './use-save-navigation-blocks';
import MenuEditorShortcuts from './shortcuts';
import BlockEditorPanel from './block-editor-panel';
import NavigationStructurePanel from './navigation-structure-panel';

const useMenuEditor = ( menuId ) => {
	const query = useMemo( () => ( { menus: menuId, per_page: -1 } ), [
		menuId,
	] );
	const menuItems = useMenuItems( query );
	const { blocks, setBlocks, menuItemsRef } = useNavigationBlocks(
		menuItems
	);
	const saveBlocks = useSaveNavigationBlocks( blocks, menuItemsRef, query );
	const { createMissingMenuItems, onCreated } = useCreateMissingMenuItems(
		menuItemsRef
	);
	const eventuallySaveBlocks = () => onCreated( () => saveBlocks() );

	return [ blocks, setBlocks, eventuallySaveBlocks, createMissingMenuItems ];
};

export default function MenuEditor( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const [
		blocks,
		setBlocks,
		saveBlocks,
		createMissingMenuItems,
	] = useMenuEditor( menuId );

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
				<MenuEditorShortcuts saveBlocks={ saveBlocks } />
				<NavigationStructurePanel
					blocks={ blocks }
					initialOpen={ isLargeViewport }
				/>
				<BlockEditorPanel
					saveBlocks={ saveBlocks }
					menuId={ menuId }
					onDeleteMenu={ onDeleteMenu }
				/>
			</BlockEditorProvider>
		</div>
	);
}
