/**
 * External dependencies
 */
import type {
	FocusEventHandler,
	EventHandler,
	MouseEventHandler,
	TouchEventHandler,
	FocusEvent,
	MouseEvent,
	TouchEvent,
	MutableRefObject,
} from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Input types which are classified as button types, for use in considering
 * whether element is a (focus-normalized) button.
 */
const INPUT_BUTTON_TYPES = [ 'button', 'submit' ];

type FocusNormalizedButton =
	| HTMLButtonElement
	| HTMLLinkElement
	| HTMLInputElement;

/**
 * Returns true if the given element is a button element subject to focus
 * normalization, or false otherwise.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
 *
 * @param  eventTarget The target from a mouse or touch event.
 *
 * @return Whether element is a button.
 */
function isFocusNormalizedButton(
	eventTarget: EventTarget
): eventTarget is FocusNormalizedButton {
	if ( ! ( eventTarget instanceof window.HTMLElement ) ) {
		return false;
	}
	switch ( eventTarget.nodeName ) {
		case 'A':
		case 'BUTTON':
			return true;

		case 'INPUT':
			return INPUT_BUTTON_TYPES.includes(
				( eventTarget as HTMLInputElement ).type
			);
	}

	return false;
}

type UseFocusOutsideReturn = {
	onFocus: FocusEventHandler;
	onMouseDown: MouseEventHandler;
	onMouseUp: MouseEventHandler;
	onTouchStart: TouchEventHandler;
	onTouchEnd: TouchEventHandler;
	onBlur: FocusEventHandler;
	ref: MutableRefObject< HTMLElement | null >;
};

/**
 * A react hook that can be used to check whether focus has moved outside the
 * element the event handlers are bound to.
 *
 * @param  onFocusOutside A callback triggered when focus moves outside
 *                        the element the event handlers are bound to.
 *
 * @return An object containing event handlers. Bind the event handlers to a
 * wrapping element element to capture when focus moves outside that element.
 */
export default function useFocusOutside(
	onFocusOutside: ( event: FocusEvent ) => void
): UseFocusOutsideReturn {
	const wrapperRef = useRef< HTMLElement | null >( null );
	const currentOnFocusOutside = useRef( onFocusOutside );
	useEffect( () => {
		currentOnFocusOutside.current = onFocusOutside;
	}, [ onFocusOutside ] );

	const preventBlurCheck = useRef( false );

	const blurCheckTimeoutId = useRef< number | undefined >();

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
	 * @param  event
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
	 */
	const normalizeButtonFocus: EventHandler< MouseEvent | TouchEvent > =
		useCallback( ( event ) => {
			const { type, target } = event;
			const isInteractionEnd = [ 'mouseup', 'touchend' ].includes( type );

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
	 */
	const queueBlurCheck: FocusEventHandler = useCallback( ( event ) => {
		// React does not allow using an event reference asynchronously
		// due to recycling behavior, except when explicitly persisted.
		event.persist();

		console.log( `${ event.target } blurred!` );

		// Skip blur check if clicking button. See `normalizeButtonFocus`.
		if ( preventBlurCheck.current ) {
			return;
		}

		// console.log( {
		// 	docAE: document.activeElement,
		// 	wrapperAE: wrapperRef.current?.ownerDocument.activeElement,
		// 	eventAE: event.target.ownerDocument.activeElement,
		// 	relatedTarget: event.relatedTarget,
		// } );

		blurCheckTimeoutId.current = setTimeout( () => {
			const documentLostFocus = ! document.hasFocus();
			const wrapperEl = wrapperRef.current;
			const activeElement =
				wrapperEl?.ownerDocument.activeElement ?? null;
			const activeElementIsInWrapper =
				wrapperEl?.contains( activeElement );

			console.log( {
				documentLostFocus,
				activeElementIsInWrapper,
				wrapperEl,
				activeElement,
			} );

			// If document is not focused then focus should remain
			// inside the wrapped component and therefore we cancel
			// this blur event thereby leaving focus in place.
			// https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
			if ( documentLostFocus || activeElementIsInWrapper ) {
				event.preventDefault();
				return;
			}

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
		ref: wrapperRef,
	};
}
