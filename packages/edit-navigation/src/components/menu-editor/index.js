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
import MenuEditorShortcuts from './shortcuts';
import BlockEditorArea from './block-editor-area';
import NavigationStructureArea from './navigation-structure-area';

export default function MenuEditor( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const query = useMemo( () => ( { menus: menuId, per_page: -1 } ), [
		menuId,
	] );
	const {
		menuItems,
		eventuallySaveMenuItems,
		createMissingMenuItems,
	} = useMenuItems( query );
	const { blocks, setBlocks, menuItemsRef } = useNavigationBlocks(
		menuItems
	);
	const saveMenuItems = () => eventuallySaveMenuItems( blocks, menuItemsRef );

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<MenuEditorShortcuts.Register />

			<BlockEditorProvider
				value={ blocks }
				onInput={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
				onChange={ ( updatedBlocks ) => {
					createMissingMenuItems( updatedBlocks, menuItemsRef );
					setBlocks( updatedBlocks );
				} }
				settings={ {
					...blockEditorSettings,
					templateLock: 'all',
					hasFixedToolbar: true,
				} }
			>
				<BlockEditorKeyboardShortcuts />
				<MenuEditorShortcuts saveBlocks={ saveMenuItems } />
				<NavigationStructureArea
					blocks={ blocks[ 0 ]?.innerBlocks || [] }
					initialOpen={ isLargeViewport }
				/>
				<BlockEditorArea
					saveBlocks={ saveMenuItems }
					menuId={ menuId }
					onDeleteMenu={ onDeleteMenu }
				/>
			</BlockEditorProvider>
		</div>
	);
}
