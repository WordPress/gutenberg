/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Input types which are classified as button types, for use in considering
 * whether element is a (focus-normalized) button.
 *
 * @type {string[]}
 */
const INPUT_BUTTON_TYPES = [ 'button', 'submit' ];

/**
 * @typedef {HTMLButtonElement | HTMLLinkElement | HTMLInputElement} FocusNormalizedButton
 */

// Disable reason: Rule doesn't support predicate return types.
/* eslint-disable jsdoc/valid-types */
/**
 * Returns true if the given element is a button element subject to focus
 * normalization, or false otherwise.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
 *
 * @param {EventTarget} eventTarget The target from a mouse or touch event.
 *
 * @return {eventTarget is FocusNormalizedButton} Whether element is a button.
 */
function isFocusNormalizedButton( eventTarget ) {
	switch ( eventTarget.nodeName ) {
		case 'A':
		case 'BUTTON':
			return true;

		case 'INPUT':
			return includes(
				INPUT_BUTTON_TYPES,
				/** @type {HTMLInputElement} */ ( eventTarget ).type
			);
	}

	return false;
}
/* eslint-enable jsdoc/valid-types */

/**
 * @typedef {import('react').SyntheticEvent} SyntheticEvent
 */

/**
 * @callback EventCallback
 * @param {SyntheticEvent} event input related event.
 */

/**
 * @typedef FocusOutsideReactElement
 * @property {EventCallback} handleFocusOutside callback for a focus outside event.
 */

/**
 * @typedef {import('react').MutableRefObject<FocusOutsideReactElement | undefined>} FocusOutsideRef
 */

/**
 * @typedef {Object} FocusOutsideReturnValue
 * @property {EventCallback} onFocus      An event handler for focus events.
 * @property {EventCallback} onBlur       An event handler for blur events.
 * @property {EventCallback} onMouseDown  An event handler for mouse down events.
 * @property {EventCallback} onMouseUp    An event handler for mouse up events.
 * @property {EventCallback} onTouchStart An event handler for touch start events.
 * @property {EventCallback} onTouchEnd   An event handler for touch end events.
 */

/**
 * A react hook that can be used to check whether focus has moved outside the
 * element the event handlers are bound to.
 *
 * @param {EventCallback} onFocusOutside A callback triggered when focus moves outside
 *                                       the element the event handlers are bound to.
 *
 * @return {FocusOutsideReturnValue} An object containing event handlers. Bind the event handlers
 *                                   to a wrapping element element to capture when focus moves
 *                                   outside that element.
 */
export default function useFocusOutside( onFocusOutside ) {
	const currentOnFocusOutside = useRef( onFocusOutside );
	useEffect( () => {
		currentOnFocusOutside.current = onFocusOutside;
	}, [ onFocusOutside ] );

	const preventBlurCheck = useRef( false );

	/**
	 * @type {import('react').MutableRefObject<number | undefined>}
	 */
	const blurCheckTimeoutId = useRef();

	/**
	 * Cancel a blur check timeout.
	 */
	const cancelBlurCheck = useCallback( () => {
		clearTimeout( blurCheckTimeoutId.current );
	}, [] );

	// Cancel blur checks on unmount.
	useEffect( () => {
		return () => cancelBlurCheck();
	}, [] );

	// Cancel a blur check if the callback or ref is no longer provided.
	useEffect( () => {
		if ( ! onFocusOutside ) {
			cancelBlurCheck();
		}
	}, [ onFocusOutside, cancelBlurCheck ] );

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
	const normalizeButtonFocus = useCallback( ( event ) => {
		const { type, target } = event;
		const isInteractionEnd = includes( [ 'mouseup', 'touchend' ], type );

		if ( isInteractionEnd ) {
			preventBlurCheck.current = false;
		} else if ( isFocusNormalizedButton( target ) ) {
			preventBlurCheck.current = true;
		}
	}, [] );

	/**
	 * A callback triggered when a blur event occurs on the element the handler
	 * is bound to.
	 *
	 * Calls the `onFocusOutside` callback in an immediate timeout if focus has
	 * move outside the bound element and is still within the document.
	 *
	 * @param {SyntheticEvent} event Blur event.
	 */
	const queueBlurCheck = useCallback( ( event ) => {
		// React does not allow using an event reference asynchronously
		// due to recycling behavior, except when explicitly persisted.
		event.persist();

		// Skip blur check if clicking button. See `normalizeButtonFocus`.
		if ( preventBlurCheck.current ) {
			return;
		}

		blurCheckTimeoutId.current = setTimeout( () => {
			if ( 'function' === typeof currentOnFocusOutside.current ) {
				currentOnFocusOutside.current( event );
			}
		}, 0 );
	}, [] );

	return {
		onFocus: cancelBlurCheck,
		onMouseDown: normalizeButtonFocus,
		onMouseUp: normalizeButtonFocus,
		onTouchStart: normalizeButtonFocus,
		onTouchEnd: normalizeButtonFocus,
		onBlur: queueBlurCheck,
	};
}
