/**
 * WordPress dependencies
 */
import { TAB } from '@wordpress/keycodes';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/**
 * In Dialogs/modals, the tabbing must be constrained to the content of
 * the wrapper element. This hook adds the behavior to the returned ref.
 *
 * @return {import('react').RefCallback<Element>} Element Ref.
 *
 * @example
 * ```js
 * import { useConstrainedTabbing } from '@wordpress/compose';
 *
 * const ConstrainedTabbingExample = () => {
 *     const constrainedTabbingRef = useConstrainedTabbing()
 *     return (
 *         <div ref={ constrainedTabbingRef }>
 *             <Button />
 *             <Button />
 *         </div>
 *     );
 * }
 * ```
 */
function useConstrainedTabbing() {
	return useRefEffect( ( /** @type {HTMLElement} */ node ) => {
		function onKeyDown( /** @type {KeyboardEvent} */ event ) {
			const { keyCode, shiftKey, target } = event;

			if ( keyCode !== TAB ) {
				return;
			}

			const action = shiftKey ? 'findPrevious' : 'findNext';
			const nextElement =
				focus.tabbable[ action ](
					/** @type {HTMLElement} */ ( target )
				) || null;

			// If the element that is about to receive focus is outside the
			// area, move focus to a div and insert it at the start or end of
			// the area, depending on the direction. Without preventing default
			// behaviour, the browser will then move focus to the next element.
			if ( node.contains( nextElement ) ) {
				return;
			}

			const domAction = shiftKey ? 'append' : 'prepend';
			const { ownerDocument } = node;
			const trap = ownerDocument.createElement( 'div' );

			trap.tabIndex = -1;
			node[ domAction ]( trap );

			// Remove itself when the trap loses focus.
			trap.addEventListener( 'blur', () => node.removeChild( trap ) );

			trap.focus();
		}

		node.addEventListener( 'keydown', onKeyDown );
		return () => {
			node.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}

export default useConstrainedTabbing;
