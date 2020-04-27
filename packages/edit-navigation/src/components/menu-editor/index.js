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
import MenuEditorShortcuts from './shortcuts';
<<<<<<< HEAD
import BlockEditorPanel from './block-editor-panel';
import NavigationStructurePanel from './navigation-structure-panel';
=======
import MenuDelete from '../menu-delete';
>>>>>>> adds a new MenuDelete component

export default function MenuEditor( {
	menuId,
	blockEditorSettings,
	onDelete,
} ) {

	const [ blocks, setBlocks, saveBlocks ] = useNavigationBlocks( menuId );
	const isLargeViewport = useViewportMatch( 'medium' );

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<MenuEditorShortcuts.Register />

			<BlockEditorProvider
				value={ blocks }
				onInput={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
				onChange={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
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
				<BlockEditorPanel saveBlocks={ saveBlocks } />
			</BlockEditorProvider>
		</div>
	);
}
