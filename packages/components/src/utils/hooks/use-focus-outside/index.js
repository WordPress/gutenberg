/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

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
 * @param {HTMLElement} element Element to test.
 *
 * @return {boolean} Whether element is a button.
 */
function isFocusNormalizedButton( element ) {
	switch ( element.nodeName ) {
		case 'A':
		case 'BUTTON':
			return true;

		case 'INPUT':
			return includes(
				INPUT_BUTTON_TYPES,
				/** @type {HTMLInputElement} */ ( element ).type
			);
	}

	return false;
}

/**
 * @typedef {import('react').SyntheticEvent} SyntheticEvent
 */

/**
 * @typedef {Object} FocusOutsideReactElement
 * @property {(event:SyntheticEvent)=>void} handleFocusOutside
 *     callback for a focus outside event.
 */
/**
 * @typedef {import('react').MutableRefObject<FocusOutsideReactElement | undefined>} FocusOutsideRef
 */

/**
 * A react hook that can be used to check whether focus has moved outside the
 * element the event handlers are bound to.
 *
 * @param {Function} onFocusOutside
 * @param {FocusOutsideRef} __unstableNodeRef
 */
export default function useFocusOutside( onFocusOutside, __unstableNodeRef ) {
	const preventBlurCheck = useRef( false );

	/**
	 * @type {import('react').MutableRefObject<number | undefined>}
	 */
	const blurCheckTimeoutId = useRef();

	const cancelBlurCheck = () => {
		clearTimeout( blurCheckTimeoutId.current );
	};

	// Cancel blur checks on unmount.
	useEffect( () => {
		return () => cancelBlurCheck();
	}, [] );

	useEffect( () => {
		if ( ! onFocusOutside && ! __unstableNodeRef.current ) {
			cancelBlurCheck();
		}
	}, [ onFocusOutside, __unstableNodeRef ] );

	/**
	 * Handles a mousedown or mouseup event to respectively assign and
	 * unassign a flag for preventing blur check on button elements. Some
	 * browsers, namely Firefox and Safari, do not emit a focus event on
	 * button elements when clicked, while others do. The logic here
	 * intends to normalize this as treating click on buttons as focus.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
	 *
	 * @param {SyntheticEvent} event Event for mousedown or mouseup.
	 */
	const normalizeButtonFocus = ( event ) => {
		const { type, target } = event;
		const isInteractionEnd = includes( [ 'mouseup', 'touchend' ], type );

		if ( isInteractionEnd ) {
			preventBlurCheck.current = false;
		} else if (
			isFocusNormalizedButton( /** @type {HTMLElement} */ ( target ) )
		) {
			preventBlurCheck.current = true;
		}
	};

	/**
	 * A callback triggered when a blur event occurs on the element the handler
	 * is bound to.
	 *
	 * Calls the `onFocusOutside` callback in an immediate timeout if focus has
	 * move outside the bound element and is still within the document.
	 *
	 * @param {SyntheticEvent} event Blur event.
	 */
	const queueBlurCheck = ( event ) => {
		// React does not allow using an event reference asynchronously
		// due to recycling behavior, except when explicitly persisted.
		event.persist();

		// Skip blur check if clicking button. See `normalizeButtonFocus`.
		if ( preventBlurCheck.current ) {
			return;
		}

		blurCheckTimeoutId.current = setTimeout( () => {
			// If document is not focused then focus should remain
			// inside the wrapped component and therefore we cancel
			// this blur event thereby leaving focus in place.
			// https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
			if ( ! document.hasFocus() ) {
				event.preventDefault();
				return;
			}

			if ( 'function' === typeof onFocusOutside ) {
				onFocusOutside( event );
			} else if (
				'function' ===
				typeof __unstableNodeRef.current?.handleFocusOutside
			) {
				// Call the legacy `handleFocusOutside` method if defined
				// as a fallback for the `withFocusOutside` HOC.
				const node = __unstableNodeRef.current;
				const callback = __unstableNodeRef.current.handleFocusOutside;
				callback.call( node, event );
			}
		}, 0 );
	};

	return {
		onFocus: cancelBlurCheck,
		onMouseDown: normalizeButtonFocus,
		onMouseUp: normalizeButtonFocus,
		onTouchStart: normalizeButtonFocus,
		onTouchEnd: normalizeButtonFocus,
		onBlur: queueBlurCheck,
	};
}
