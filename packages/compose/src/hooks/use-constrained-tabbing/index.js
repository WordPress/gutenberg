/**
 * WordPress dependencies
 */
import { TAB } from '@wordpress/keycodes';
import { focus } from '@wordpress/dom';
import { useCallback } from '@wordpress/element';

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
	const ref = useCallback( ( /** @type {Element} */ node ) => {
		if ( ! node ) {
			return;
		}
		node.addEventListener( 'keydown', ( /** @type {Event} */ event ) => {
			if ( ! ( event instanceof window.KeyboardEvent ) ) {
				return;
			}

			if ( event.keyCode !== TAB ) {
				return;
			}

			const action = event.shiftKey ? 'findPrevious' : 'findNext';

			if (
				! node.contains(
					/** @type {HTMLElement} */ ( focus.tabbable[ action ](
						/** @type {HTMLElement} */ ( event.target )
					) )
				)
			) {
				/** @type {HTMLElement} */ ( node ).focus();
			}
		} );
	}, [] );

	return ref;
}

export default useConstrainedTabbing;
