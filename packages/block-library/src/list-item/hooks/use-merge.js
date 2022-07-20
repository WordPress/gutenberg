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
	const { mergeBlocks, moveBlocksToPosition, removeBlock } =
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
			const [ listClientId ] = getBlockOrder( clientId );
			if ( listClientId ) {
				const [ firstListItem ] = getBlockOrder( listClientId );
				registry.batch( () => {
					mergeBlocks( clientId, firstListItem );
					removeBlock( listClientId );
				} );
			} else {
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
