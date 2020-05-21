/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationBlocks from './use-navigation-blocks';
import MenuEditorShortcuts from './shortcuts';
import BlockEditorPanel from './block-editor-panel';
import NavigationStructurePanel from './navigation-structure-panel';

export default function MenuEditor( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const [ blocks, setBlocks, saveBlocks ] = useNavigationBlocks( menuId );

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
				<EditorBody
					menuId={ menuId }
					onDeleteMenu={ onDeleteMenu }
					blocks={ blocks }
					saveBlocks={ saveBlocks }
				/>
			</BlockEditorProvider>
		</div>
	);
}

const EditorBody = ( { menuId, onDeleteMenu, blocks, saveBlocks } ) => {
	const { setAutoFocusEnabled } = useDispatch( 'core/block-editor' );
	const isLargeViewport = useViewportMatch( 'medium' );
	const [ lastInteractedSection, setLastInteractedSection ] = useState(
		null
	);

	useEffect( () => {
		if ( lastInteractedSection === 'navigation' ) {
			setAutoFocusEnabled( false );
		} else if ( lastInteractedSection === 'editor' ) {
			setAutoFocusEnabled( true );
		}
	}, [ lastInteractedSection ] );

	return (
		<>
			<BlockEditorKeyboardShortcuts />
			<MenuEditorShortcuts saveBlocks={ saveBlocks } />
			<NavigationStructurePanel
				blocks={ blocks }
				initialOpen={ isLargeViewport }
				onMouseDown={ () => {
					setLastInteractedSection( 'navigation' );
				} }
			/>
			<BlockEditorPanel
				saveBlocks={ saveBlocks }
				menuId={ menuId }
				onDeleteMenu={ onDeleteMenu }
				onMouseDown={ () => {
					setLastInteractedSection( 'editor' );
				} }
			/>
		</>
	);
};
