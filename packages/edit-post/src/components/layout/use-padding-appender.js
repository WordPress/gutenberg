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

				const paddingBottom = defaultView.parseInt(
					defaultView.getComputedStyle( node ).paddingBottom,
					10
				);

				if ( ! paddingBottom ) {
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

				event.preventDefault();

				const blockOrder = registry
					.select( blockEditorStore )
					.getBlockOrder( '' );
				const lastBlockClientId = blockOrder[ blockOrder.length - 1 ];

				// Do nothing when only default block appender is present.
				if ( ! lastBlockClientId ) {
					return;
				}

				const lastBlock = registry
					.select( blockEditorStore )
					.getBlock( lastBlockClientId );
				const { selectBlock, insertDefaultBlock } =
					registry.dispatch( blockEditorStore );

				if ( isUnmodifiedDefaultBlock( lastBlock ) ) {
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
