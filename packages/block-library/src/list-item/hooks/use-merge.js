/**
 * WordPress dependencies
 */
import { useRegistry, useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function useMerge( clientId ) {
	const registry = useRegistry();
	const { getPreviousBlockClientId, getNextBlockClientId, getBlockOrder } =
		useSelect( blockEditorStore );
	const { mergeBlocks, moveBlocksToPosition } =
		useDispatch( blockEditorStore );

	function getTrailing( id ) {
		const order = getBlockOrder( id );

		if ( ! order.length ) {
			return id;
		}

		return getTrailing( order[ order.length - 1 ] );
	}

	return ( forward ) => {
		if ( forward ) {
			const nextBlockClientId = getNextBlockClientId( clientId );
			if ( nextBlockClientId ) {
				mergeBlocks( clientId, nextBlockClientId );
			}
		} else {
			const previousBlockClientId = getPreviousBlockClientId( clientId );
			if ( previousBlockClientId ) {
				const trailingClientId = getTrailing( previousBlockClientId );
				registry.batch( () => {
					moveBlocksToPosition(
						getBlockOrder( clientId ),
						clientId,
						previousBlockClientId
					);
					mergeBlocks( trailingClientId, clientId );
				} );
			}
		}
	};
}
