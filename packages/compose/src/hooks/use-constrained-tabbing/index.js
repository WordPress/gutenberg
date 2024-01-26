/**
 * WordPress dependencies
 */
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
			const { key, shiftKey, target } = event;

			if ( key !== 'Tab' ) {
				return;
			}

			const action = shiftKey ? 'findPrevious' : 'findNext';
			const nextElement =
				focus.tabbable[ action ](
					/** @type {HTMLElement} */ ( target )
				) || null;

			// When the target element contains the element that is about to
			// receive focus, for example when the target is a tabbable
			// container, browsers may disagree on where to move focus next.
			// In this case we can't rely on native browsers behavior. We need
			// to manage focus instead.
			// See https://github.com/WordPress/gutenberg/issues/46041.
			if (
				/** @type {HTMLElement} */ ( target ).contains( nextElement )
			) {
				event.preventDefault();
				/** @type {HTMLElement} */ ( nextElement )?.focus();
				return;
			}

			// If the element that is about to receive focus is inside the
			// area, rely on native browsers behavior and let tabbing follow
			// the native tab sequence.
			if ( node.contains( nextElement ) ) {
				return;
			}

			// If the element that is about to receive focus is outside the
			// area, move focus to a div and insert it at the start or end of
			// the area, depending on the direction. Without preventing default
			// behaviour, the browser will then move focus to the next element.
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
