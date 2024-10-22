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
				if (
					event.target !== node &&
					// Tests for the parent element because in the iframed editor if the click is
					// below the padding the target will be the parent element (html) and should
					// still be treated as intent to append.
					event.target !== node.parentElement
				) {
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
			const { ownerDocument } = node;
			// Adds the listener on the document so that in the iframed editor clicks below the
			// padding can be handled as they too should be treated as intent to append.
			ownerDocument.addEventListener( 'mousedown', onMouseDown );
			return () => {
				ownerDocument.removeEventListener( 'mousedown', onMouseDown );
			};
		},
		[ registry ]
	);
	return enabled ? [ effect, CSS ] : [];
}
