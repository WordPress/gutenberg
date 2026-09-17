import { useRefEffect } from '@wordpress/compose';

/**
 * In Firefox, a click on an editable element that cannot hold focus itself (an
 * inert part of the editing host around it) focuses the nearest focusable
 * ancestor, e.g. the wrapper of a parent block, whose focus handler would then
 * select that block. Chromium focuses the editing host. Move focus to the host
 * before the focus handler runs.
 *
 * @return {Function} Ref callback.
 */
export function useFirefoxFocusCompatibility() {
	return useRefEffect( ( node ) => {
		const { ownerDocument } = node;
		let pressTarget;

		function onMouseUp() {
			pressTarget = null;
		}

		function onMouseDown( event ) {
			pressTarget = event.target;
			ownerDocument.addEventListener( 'mouseup', onMouseUp, {
				once: true,
			} );
		}

		function onFocusIn( event ) {
			if (
				event.target !== node ||
				! pressTarget ||
				pressTarget.closest( '[data-block]' ) === node ||
				// Only editable by inheritance from an editing host.
				! node.isContentEditable ||
				node.contentEditable === 'true'
			) {
				return;
			}

			node.parentElement
				.closest( '[contenteditable="true"]' )
				?.focus( { preventScroll: true } );
		}

		node.addEventListener( 'mousedown', onMouseDown );
		node.addEventListener( 'focusin', onFocusIn, true );

		return () => {
			node.removeEventListener( 'mousedown', onMouseDown );
			node.removeEventListener( 'focusin', onFocusIn, true );
			ownerDocument.removeEventListener( 'mouseup', onMouseUp );
		};
	}, [] );
}
