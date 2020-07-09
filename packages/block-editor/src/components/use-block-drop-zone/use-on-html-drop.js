/**
 * WordPress dependencies
 */
import { pasteHandler } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

export default function useOnHTMLDrop( rootClientId, blockIndex ) {
	const { insertBlocks } = useDispatch( 'core/block-editor' );

	return ( HTML ) => {
		const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			insertBlocks( blocks, blockIndex, rootClientId );
		}
	};
}
