/**
 * WordPress dependencies
 */
import { useRegistry, useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function useMerge( clientId ) {
	const registry = useRegistry();
	const {
		getPreviousBlockClientId,
		getNextBlockClientId,
		getBlockOrder,
		getBlockRootClientId,
	} = useSelect( blockEditorStore );
	const { mergeBlocks, moveBlocksToPosition } =
		useDispatch( blockEditorStore );

	function getTrailing( id ) {
		const order = getBlockOrder( id );

		if ( ! order.length ) {
			return id;
		}

		return getTrailing( order[ order.length - 1 ] );
	}

	function getNext( id ) {
		return (
			getNextBlockClientId( id ) || getNext( getBlockRootClientId( id ) )
		);
	}

	return ( forward ) => {
		if ( forward ) {
			// Forward "merging" (forward delete) should be equal pressing
			// Backspace from the next item. If the next item is not at the top
			// level, the item should be outdented instead of merged.
			if ( getBlockOrder( clientId ).length ) {
				// Should be implemented in `./use-backspace`.
				return;
			}

			const nextBlockClientId = getNext( clientId );
			if ( nextBlockClientId ) {
				registry.batch( () => {
					moveBlocksToPosition(
						getBlockOrder( nextBlockClientId ),
						nextBlockClientId,
						getPreviousBlockClientId( nextBlockClientId )
					);
					mergeBlocks( clientId, nextBlockClientId );
				} );
			}
		} else {
			// Merging is only done from the top level. For lowel levels, the
			// list item is outdented instead.
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
