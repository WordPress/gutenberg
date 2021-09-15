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

		const { ownerDocument } = node;
		if ( ! ownerDocument ) return;

		const trailingElement = ownerDocument.createElement( 'div' );
		trailingElement.tabIndex = -1;
		node.appendChild( trailingElement );

		node.addEventListener( 'keydown', ( /** @type {Event} */ event ) => {
			if ( ! ( event instanceof window.KeyboardEvent ) ) {
				return;
			}

			if ( event.keyCode !== TAB ) {
				return;
			}

			const action = event.shiftKey ? 'findPrevious' : 'findNext';
			const nextElement = focus.tabbable[ action ](
				/** @type {HTMLElement} */ ( event.target )
			);

			if ( node.contains( /** @type {HTMLElement} */ ( nextElement ) ) ) {
				return;
			}

			// By not preventing default behaviour, the browser will move
			// focus from here in the right direction.
			/** @type {HTMLElement} */ ( event.shiftKey
				? trailingElement
				: node ).focus();
		} );
	}, [] );

	return ref;
}

export default useConstrainedTabbing;
