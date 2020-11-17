/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * @type {Set<string>}
 */
const INTERACTION_END_TYPES = new Set( [ 'mouseup', 'touchend' ] );

/**
 * Input types which are classified as button types, for use in considering
 * whether element is a (focus-normalized) button.
 *
 * @type {Set<string>}
 */
const INPUT_BUTTON_TYPES = new Set( [ 'button', 'submit' ] );

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
			return INPUT_BUTTON_TYPES.has( element.type );
	}

	return false;
}

export function useFocusOutside( ref, callback ) {
	useEffect( () => {
		const element = ref.current;
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;

		let timerId;
		let preventBlurCheck;

		function queueBlurCheck( event ) {
			// Skip blur check if clicking button. See `normalizeButtonFocus`.
			if ( preventBlurCheck ) {
				return;
			}

			timerId = defaultView.setTimeout( () => {
				// If document is not focused then focus should remain
				// inside the wrapped component and therefore we cancel
				// this blur event thereby leaving focus in place.
				// https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
				if ( ! ownerDocument.hasFocus() ) {
					event.preventDefault();
					return;
				}

				callback( event );
			} );
		}

		function cancelBlurCheck() {
			clearTimeout( timerId );
		}

		/**
		 * Handles a mousedown or mouseup event to respectively assign and
		 * unassign a flag for preventing blur check on button elements. Some
		 * browsers, namely Firefox and Safari, do not emit a focus event on
		 * button elements when clicked, while others do. The logic here
		 * intends to normalize this as treating click on buttons as focus.
		 *
		 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
		 *
		 * @param {MouseEvent} event Event for mousedown or mouseup.
		 */
		function normalizeButtonFocus( event ) {
			const { type, target } = event;

			if ( INTERACTION_END_TYPES.has( type ) ) {
				preventBlurCheck = false;
			} else if ( isFocusNormalizedButton( target ) ) {
				preventBlurCheck = true;
			}
		}

		element.addEventListener( 'focus', cancelBlurCheck, true );
		element.addEventListener( 'blur', queueBlurCheck, true );
		element.addEventListener( 'mousedown', normalizeButtonFocus );
		element.addEventListener( 'mouseup', normalizeButtonFocus );
		element.addEventListener( 'touchstart', normalizeButtonFocus );
		element.addEventListener( 'touchend', normalizeButtonFocus );

		return () => {
			cancelBlurCheck();
			element.removeEventListener( 'focus', cancelBlurCheck );
			element.removeEventListener( 'blur', queueBlurCheck );
			element.removeEventListener( 'mousedown', normalizeButtonFocus );
			element.removeEventListener( 'mouseup', normalizeButtonFocus );
			element.removeEventListener( 'touchstart', normalizeButtonFocus );
			element.removeEventListener( 'touchend', normalizeButtonFocus );
		};
	}, [ callback ] );
}

export default createHigherOrderComponent(
	( Component ) => ( props ) => {
		const ref = useRef();
		const componentRef = useRef();
		useFocusOutside( ref, ( event ) =>
			componentRef.current.handleFocusOutside( event )
		);
		return (
			<div ref={ ref }>
				<Component { ...props } ref={ componentRef } />
			</div>
		);
	},
	'withFocusOutside'
);
