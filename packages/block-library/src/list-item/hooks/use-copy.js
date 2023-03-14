/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function useCopy( clientId ) {
	const { getBlockRootClientId, getBlockName, getBlockAttributes } =
		useSelect( blockEditorStore );

	return useRefEffect( ( node ) => {
		function onCopy( event ) {
			// The event propagates through all nested lists, so don't override
			// when copying nested list items.
			if ( event.clipboardData.getData( '__unstableWrapperBlockName' ) ) {
				return;
			}

			const rootClientId = getBlockRootClientId( clientId );
			event.clipboardData.setData(
				'__unstableWrapperBlockName',
				getBlockName( rootClientId )
			);
			event.clipboardData.setData(
				'__unstableWrapperBlockAttributes',
				JSON.stringify( getBlockAttributes( rootClientId ) )
			);
		}

		node.addEventListener( 'copy', onCopy );
		node.addEventListener( 'cut', onCopy );
		return () => {
			node.removeEventListener( 'copy', onCopy );
			node.removeEventListener( 'cut', onCopy );
		};
	}, [] );
}
