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
 *
 * @param {Function} onFocusOutside
 * @param {import('react').Ref<HTMLElement>} wrapperRef
 */
export default function useFocusOutside( onFocusOutside, wrapperRef ) {
	const ref = useRef( wrapperRef );
	const preventBlurCheck = useRef( false );

	/**
	 * @type {import('react').MutableRefObject<number | undefined>}
	 */
	const blurCheckTimeoutId = useRef();

	const cancelBlurCheck = () => {
		clearTimeout( blurCheckTimeoutId.current );
	};

	useEffect( () => {
		cancelBlurCheck();
	}, [ cancelBlurCheck ] );

	/**
	 * Handles a mousedown or mouseup event to respectively assign and
	 * unassign a flag for preventing blur check on button elements. Some
	 * browsers, namely Firefox and Safari, do not emit a focus event on
	 * button elements when clicked, while others do. The logic here
	 * intends to normalize this as treating click on buttons as focus.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
	 *
	 * @param {import('react').SyntheticEvent} event Event for mousedown or mouseup.
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
	 *
	 *
	 * @param {import('react').SyntheticEvent} event
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
			}
		}, 0 );
	};

	return {
		ref,
		onFocus: cancelBlurCheck,
		onMouseDown: normalizeButtonFocus,
		onMouseUp: normalizeButtonFocus,
		onTouchStart: normalizeButtonFocus,
		onTouchEnd: normalizeButtonFocus,
		onBlur: queueBlurCheck,
	};
}
