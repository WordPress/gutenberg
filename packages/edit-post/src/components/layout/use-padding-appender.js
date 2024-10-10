/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

// Ruleset to add space for the typewriter effect. When typing in the last
// block, there needs to be room to scroll up.
const CSS =
	':root :where(.editor-styles-wrapper)::after {content: ""; display: block; height: 40vh;}';

export function usePaddingAppender( enabled ) {
	const registry = useRegistry();
	const effect = useRefEffect(
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
			node.addEventListener( 'mousedown', onMouseDown );
			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[ registry ]
	);
	return enabled ? [ effect, CSS ] : [];
}
