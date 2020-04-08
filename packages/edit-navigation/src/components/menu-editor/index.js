/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

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
	onDelete,
} ) {
	const kind = 'root';
	const name = 'menu';

	const [ blocks, setBlocks, saveBlocks ] = useNavigationBlocks( menuId );
	const isLargeViewport = useViewportMatch( 'medium' );
	const entities = useSelect( ( select ) =>
		select( 'core' ).getEntitiesByKind( kind )
	);

	const entity = find( entities, { kind, name } );

	const deleteMenu = async ( recordId ) => {
		const path = `${ entity.baseURL + '/' + recordId + '?force=true' }`;
		const deletedRecord = await apiFetch( {
			path,
			method: 'DELETE',
		} );
		return deletedRecord.previous;
	};

	const askToDelete = async () => {
		if (
			// eslint-disable-next-line no-alert
			window.confirm( __( 'Are you sure you want to delete this menu?' ) )
		) {
			const deletedMenu = await deleteMenu( menuId );
			onDelete( deletedMenu );
		}
	};

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
