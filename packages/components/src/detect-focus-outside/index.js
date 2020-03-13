/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/** @typedef {import('react').MouseEvent} ReactMouseEvent */
/** @typedef {import('react').TouchEvent} ReactTouchEvent */
/** @typedef {import('react').SyntheticEvent} ReactSyntheticEvent */
/** @typedef {import('react').ReactNode} ReactNode */

/**
 * @typedef {(event:ReactSyntheticEvent)=>void} OnFocusOutsideProp
 */

/**
 * Input types which are classified as button types, for use in considering
 * whether element is a (focus-normalized) button.
 *
 * @type {Set<string>}
 */
const INPUT_BUTTON_TYPES = new Set( [ 'button', 'submit' ] );

/**
 * Event types which are classified as ends of interaction considered for focus
 * event normalization.
 *
 * @type {Set<string>}
 */
const INTERACTION_END_TYPES = new Set( [ 'mouseup', 'touchend' ] );

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
			const { type } = /** @type {HTMLInputElement} */ ( element );
			return INPUT_BUTTON_TYPES.has( type );
	}

	return false;
}

/**
 * Component used to help detect when focus leaves an element.
 *
 * This can be useful to disambiguate focus transitions within the same element.
 * A React `blur` event will fire even when focus transitions to another element
 * in the same context. `DetectFocusOutside` will only invoke its callback prop
 * when focus has truly left the element
 *
 * @type {import('react').FC}
 *
 * @param {Object}             props                Component props.
 * @param {OnFocusOutsideProp} props.onFocusOutside Callback function to invoke
 *                                                  when focus has left the
 *                                                  rendered element. The
 *                                                  callback will receive the
 *                                                  original blur event.
 * @param {ReactNode}          props.children       Element children.
 */
function DetectFocusOutside( { children, onFocusOutside } ) {
	const blurCheckTimeout = /** @type {import('react').MutableRefObject<number>} */ ( useRef() );
	const preventBlurCheck = useRef( false );
	useEffect( () => cancelBlurCheck );

	/**
	 * Cancels the scheduled blur check, if one is scheduled.
	 */
	function cancelBlurCheck() {
		clearTimeout( blurCheckTimeout.current );
	}

	/**
	 * Schedules a blur check to occur after the current call stack ends, during
	 * which time it may be expected that the check is nullified based on other
	 * interactions.
	 *
	 * @see normalizeButtonFocus
	 *
	 * @param {ReactSyntheticEvent} event Focus event.
	 */
	function queueBlurCheck( event ) {
		// Skip blur check if clicking button. See `normalizeButtonFocus`.
		if ( preventBlurCheck.current ) {
			return;
		}

		// React does not allow using an event reference asynchronously due to
		// recycling behavior, except when explicitly persisted.
		event.persist();

		blurCheckTimeout.current = setTimeout( () => {
			// If document is not focused then focus should remain inside the
			// wrapped component and therefore we cancel this blur event thereby
			// leaving focus in place.
			//
			// See: https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus
			if ( document.hasFocus() ) {
				onFocusOutside( event );
			}
		}, 0 );
	}

	/**
	 * Handles a mousedown or mouseup event to respectively assign and unassign
	 * a flag for preventing blur check on button elements. Some browsers,
	 * namely Firefox and Safari, do not emit a focus event on button elements
	 * when clicked, while others do. The logic here intends to normalize this
	 * as treating click on buttons as focus.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
	 *
	 * @param {ReactMouseEvent|ReactTouchEvent} event Event on which to base
	 *                                                normalize.
	 */
	function normalizeButtonFocus( event ) {
		const { type, target } = event;
		if ( ! ( target instanceof window.Element ) ) {
			return;
		}

		const isInteractionEnd = INTERACTION_END_TYPES.has( type );
		if ( isInteractionEnd ) {
			preventBlurCheck.current = false;
		} else if ( isFocusNormalizedButton( target ) ) {
			preventBlurCheck.current = true;
		}
	}

	// Disable reason: See `normalizeButtonFocus` for browser-specific focus
	// event normalization.

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div
			onFocus={ cancelBlurCheck }
			onMouseDown={ normalizeButtonFocus }
			onMouseUp={ normalizeButtonFocus }
			onTouchStart={ normalizeButtonFocus }
			onTouchEnd={ normalizeButtonFocus }
			onBlur={ queueBlurCheck }
		>
			{ children }
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

export default DetectFocusOutside;
