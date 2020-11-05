/**
 * WordPress dependencies
 */
import { unregisterBlockType } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

export default function AutoBlockUninstaller() {
	const { uninstallBlockType } = useDispatch( 'core/block-directory' );

	const shouldRemoveBlockTypes = useSelect( ( select ) => {
		const { isAutosavingPost, isSavingPost } = select( 'core/editor' );
		return isSavingPost() && ! isAutosavingPost();
	}, [] );

	const unusedBlockTypes = useSelect(
		( select ) => select( 'core/block-directory' ).getUnusedBlockTypes(),
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
