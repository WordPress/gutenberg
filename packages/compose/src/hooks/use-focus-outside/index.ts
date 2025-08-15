/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Input types which are classified as button types, for use in considering
 * whether element is a (focus-normalized) button.
 */
const INPUT_BUTTON_TYPES = [ 'button', 'submit' ];

/**
 * List of HTML button elements subject to focus normalization
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
 */
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
 * @param eventTarget The target from a mouse or touch event.
 *
 * @return Whether the element is a button element subject to focus normalization.
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
	onFocus: React.FocusEventHandler;
	onMouseDown: React.MouseEventHandler;
	onMouseUp: React.MouseEventHandler;
	onTouchStart: React.TouchEventHandler;
	onTouchEnd: React.TouchEventHandler;
	onBlur: React.FocusEventHandler;
};

/**
 * A react hook that can be used to check whether focus has moved outside the
 * element the event handlers are bound to.
 *
 * @param onFocusOutside A callback triggered when focus moves outside
 *                       the element the event handlers are bound to.
 *
 * @return An object containing event handlers. Bind the event handlers to a
 * wrapping element element to capture when focus moves outside that element.
 */
export default function useFocusOutside(
	onFocusOutside: ( ( event: React.FocusEvent ) => void ) | undefined
): UseFocusOutsideReturn {
	const currentOnFocusOutsideRef = useRef( onFocusOutside );
	useEffect( () => {
		currentOnFocusOutsideRef.current = onFocusOutside;
	}, [ onFocusOutside ] );

	const preventBlurCheckRef = useRef( false );

	const blurCheckTimeoutIdRef = useRef< number | undefined >();

	/**
	 * Cancel a blur check timeout.
	 */
	const cancelBlurCheck = useCallback( () => {
		clearTimeout( blurCheckTimeoutIdRef.current );
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
	 * @param event
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
	 */
	const normalizeButtonFocus: React.EventHandler<
		React.MouseEvent | React.TouchEvent
	> = useCallback( ( event ) => {
		const { type, target } = event;
		const isInteractionEnd = [ 'mouseup', 'touchend' ].includes( type );

		if ( isInteractionEnd ) {
			preventBlurCheckRef.current = false;
		} else if ( isFocusNormalizedButton( target ) ) {
			preventBlurCheckRef.current = true;
		}
	}, [] );

	/**
	 * A callback triggered when a blur event occurs on the element the handler
	 * is bound to.
	 *
	 * Calls the `onFocusOutside` callback in an immediate timeout if focus has
	 * move outside the bound element and is still within the document.
	 */
	const queueBlurCheck: React.FocusEventHandler = useCallback( ( event ) => {
		// React does not allow using an event reference asynchronously
		// due to recycling behavior, except when explicitly persisted.
		event.persist();

		// Skip blur check if clicking button. See `normalizeButtonFocus`.
		if ( preventBlurCheckRef.current ) {
			return;
		}

		// The usage of this attribute should be avoided. The only use case
		// would be when we load modals that are not React components and
		// therefore don't exist in the React tree. An example is opening
		// the Media Library modal from another dialog.
		// This attribute should contain a selector of the related target
		// we want to ignore, because we still need to trigger the blur event
		// on all other cases.
		const ignoreForRelatedTarget = event.target.getAttribute(
			'data-unstable-ignore-focus-outside-for-relatedtarget'
		);
		if (
			ignoreForRelatedTarget &&
			event.relatedTarget?.closest( ignoreForRelatedTarget )
		) {
			return;
		}

		blurCheckTimeoutIdRef.current = setTimeout( () => {
			// If document is not focused then focus should remain
			// inside the wrapped component and therefore we cancel
			// this blur event thereby leaving focus in place.
			// https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
			if ( ! document.hasFocus() ) {
				event.preventDefault();
				return;
			}

			if ( 'function' === typeof currentOnFocusOutsideRef.current ) {
				currentOnFocusOutsideRef.current( event );
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
