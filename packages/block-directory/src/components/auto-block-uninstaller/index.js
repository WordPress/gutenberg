/**
 * WordPress dependencies
 */
import { unregisterBlockType } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as blockDirectoryStore } from '../../store';

export default function AutoBlockUninstaller() {
	const { uninstallBlockType } = useDispatch( blockDirectoryStore );

	const shouldRemoveBlockTypes = useSelect( ( select ) => {
		const { isAutosavingPost, isSavingPost } = select( editorStore );
		return isSavingPost() && ! isAutosavingPost();
	}, [] );

	const unusedBlockTypes = useSelect(
		( select ) => select( blockDirectoryStore ).getUnusedBlockTypes(),
		[]
	);

	useEffect( () => {
		if ( shouldRemoveBlockTypes && unusedBlockTypes.length ) {
			unusedBlockTypes.forEach( ( blockType ) => {
				uninstallBlockType( blockType );
				unregisterBlockType( blockType.name );
			} );
		}
	}, [ shouldRemoveBlockTypes ] );

	return null;
}
