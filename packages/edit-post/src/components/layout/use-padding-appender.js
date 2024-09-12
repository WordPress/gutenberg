/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

export function usePaddingAppender() {
	const registry = useRegistry();
	return useRefEffect(
		( node ) => {
			function onMouseDown( event ) {
				if ( event.target !== node ) {
					return;
				}

				const { ownerDocument } = node;
				const { defaultView } = ownerDocument;

				const pseudoHeight = defaultView.parseInt(
					defaultView.getComputedStyle( node, ':after' ).height,
					10
				);

				if ( ! pseudoHeight ) {
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
			node.addEventListener( 'mousedown', onMouseDown );
			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[ registry ]
	);
}
