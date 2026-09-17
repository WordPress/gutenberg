import { useRefEffect } from '@wordpress/compose';

/**
 * In Firefox, a click on an editable element that cannot hold focus itself (an
 * inert part of the editing host around it) focuses the nearest focusable
 * ancestor, e.g. the wrapper of a parent block, whose focus handler would then
 * select that block. Chromium focuses the editing host. The caret says where
 * the click landed: when it sits in a descendant block, move focus to the host
 * before the focus handler runs.
 *
 * @return {Function} Ref callback.
 */
export function useFirefoxFocusCompatibility() {
	return useRefEffect( ( node ) => {
		const { ownerDocument } = node;

		function onFocusIn( event ) {
			if (
				event.target !== node ||
				// Only editable by inheritance from an editing host.
				! node.isContentEditable ||
				node.contentEditable === 'true'
			) {
				return;
			}

			const { anchorNode } = ownerDocument.defaultView.getSelection();
			const element =
				anchorNode?.nodeType === anchorNode?.ELEMENT_NODE
					? anchorNode
					: anchorNode?.parentElement;

			if (
				! element ||
				! node.contains( element ) ||
				element.closest( '[data-block]' ) === node
			) {
				return;
			}

			node.parentElement
				.closest( '[contenteditable="true"]' )
				?.focus( { preventScroll: true } );
		}

		node.addEventListener( 'focusin', onFocusIn, true );

		return () => {
			node.removeEventListener( 'focusin', onFocusIn, true );
		};
	}, [] );
}
