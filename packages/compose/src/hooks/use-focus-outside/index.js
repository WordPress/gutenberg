/**
 * WordPress dependencies
 */
import { useEffect, useCallback, useRef } from '@wordpress/element';

/**
 * Input types which are classified as button types, for use in considering
 * whether element is a (focus-normalized) button.
 *
 * @type {string[]}
 */
const INPUT_BUTTON_TYPES = [ 'button', 'submit' ];

/**
 * Returns true if the given element is a button element subject to focus
 * normalization, or false otherwise.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
 *
 * @param {Element} element Element to test.
 *
 * @return {boolean} Whether element is a button.
 */
function isFocusNormalizedButton( element ) {
	switch ( element.nodeName ) {
		case 'A':
		case 'BUTTON':
			return true;

		case 'INPUT':
			return INPUT_BUTTON_TYPES.includes( element.type );
	}

	return false;
}

/**
 * A react hook that can be used to be notified when
 * the focus moves out of a given container.
 *
 * @param {Function} onFocusOutside A handler to call when the container loses focus.
 * @return {Function} Element Ref.
 *
 * @example
 *
 * ```
 * import { useFocusOutside } from '@wordpress/compose';
 *
 * const WithFocusOutside = () => {
 *     const ref = useFocusOutside( () => {
 *         console.log( 'The focus moved out of the ref container' );
 *     } );
 *
 *     return (
 *         <div ref={ref}>
 *             Something
 *         </div>
 *     );
 * };
 * ```
 */
function useFocusOutside( onFocusOutside ) {
	const currentOnFocusOutside = useRef( onFocusOutside );
	useEffect( () => {
		currentOnFocusOutside.current = onFocusOutside;
	}, [ onFocusOutside ] );
	const ref = useCallback( ( node ) => {
		let preventBlurCheck = false;
		let blurCheckTimeout;

		if ( ! node ) {
			return;
		}

		const cancelBlur = () => {
			clearTimeout( blurCheckTimeout );
		};

		const normalizeButtonFocus = ( event ) => {
			const { type, target } = event;
			const isInteractionEnd = [ 'mouseup', 'touchend' ].includes( type );
			if ( isInteractionEnd ) {
				preventBlurCheck = false;
			} else if ( isFocusNormalizedButton( target ) ) {
				preventBlurCheck = true;
			}
		};

		// On click inside the container prevent the blur from triggering the handler.
		node.addEventListener( 'mousedown', normalizeButtonFocus );
		node.addEventListener( 'mouseup', normalizeButtonFocus );
		node.addEventListener( 'touchstart', normalizeButtonFocus );
		node.addEventListener( 'touchend', normalizeButtonFocus );

		node.addEventListener( 'focusin', cancelBlur );
		node.addEventListener( 'focusout', ( event ) => {
			// Skip blur check if clicking button. See `normalizeButtonFocus`.
			if ( preventBlurCheck ) {
				return;
			}
			blurCheckTimeout = setTimeout( () => {
				// If document is not focused then focus should remain
				// inside the wrapped component and therefore we cancel
				// this blur event thereby leaving focus in place.
				// https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
				if ( ! document.hasFocus() ) {
					event.preventDefault();
					return;
				}

				// In theory, this shouldn't be needed.
				// In fact, it changes the behavior of the hook (and its meaning)
				// For the moment, I'm keeping it to match the previous behavior of withFocusOutside.
				// We should consider finding an alternative to avoid unexpected focus loss.
				const isInDocument = event.target.ownerDocument.body.contains(
					event.target
				);

				if ( ! node || ! isInDocument ) {
					return;
				}

				if ( ! node.contains( node.ownerDocument.activeElement ) ) {
					currentOnFocusOutside.current( event );
				}
			}, 0 );
		} );
	}, [] );

	return ref;
}

export default useFocusOutside;
