/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

export function usePaddingAppender( enabled ) {
	const registry = useRegistry();
	return useRefEffect(
		( node ) => {
			function onMouseDown( event ) {
				if ( event.target !== node ) {
					return;
				}

				// Only handle clicks under the last child.
				const lastChild = node.lastElementChild;
				if ( ! lastChild ) {
					return;
				}

				const lastChildRect = lastChild.getBoundingClientRect();
				if ( event.clientY < lastChildRect.bottom ) {
					return;
				}

				event.stopPropagation();

				const blockOrder = registry
					.select( blockEditorStore )
					.getBlockOrder( '' );
				const lastBlockClientId = blockOrder[ blockOrder.length - 1 ];

				const lastBlock = registry
					.select( blockEditorStore )
					.getBlock( lastBlockClientId );
				const { selectBlock, insertDefaultBlock } =
					registry.dispatch( blockEditorStore );

				if ( lastBlock && isUnmodifiedDefaultBlock( lastBlock ) ) {
					selectBlock( lastBlockClientId );
				} else {
					insertDefaultBlock();
				}
			}
			if ( enabled ) {
				node.addEventListener( 'mousedown', onMouseDown );
				return () => {
					node.removeEventListener( 'mousedown', onMouseDown );
				};
			}
		},
		[ enabled, registry ]
	);
}
