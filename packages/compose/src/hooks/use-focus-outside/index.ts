/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

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

function isIframe( element?: Element | null ): element is HTMLIFrameElement {
	return element?.tagName === 'IFRAME';
}

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
	onFocusOutside: ( event: React.FocusEvent ) => void
): UseFocusOutsideReturn {
	const currentOnFocusOutside = useRef( onFocusOutside );
	useEffect( () => {
		currentOnFocusOutside.current = onFocusOutside;
	}, [ onFocusOutside ] );

	const preventBlurCheck = useRef( false );

	const blurCheckTimeoutId = useRef< number | undefined >();

	const [ pollingData, setPollingData ] = useState< {
		event: React.FocusEvent< Element >;
		wrapperEl: Element;
	} | null >( null );
	const pollingIntervalId = useRef< number | undefined >();

	// Thoughts:
	// - it needs to always stop when component unmounted
	// - it needs to work when resuming focus from another doc and clicking
	//   immediately on the backdrop

	// Sometimes the blur event is not reliable, for example when focus moves
	// to an iframe inside the wrapper. In these scenarios, we resort to polling,
	// and we explicitly check if focus has indeed moved outside the wrapper.
	useEffect( () => {
		if ( pollingData ) {
			const { wrapperEl, event } = pollingData;

			pollingIntervalId.current = window.setInterval( () => {
				const focusedElement = wrapperEl.ownerDocument.activeElement;

				if (
					! wrapperEl.contains( focusedElement ) &&
					wrapperEl.ownerDocument.hasFocus()
				) {
					// If focus is not inside the wrapper (but the document is in focus),
					// we can fire the `onFocusOutside` callback and stop polling.
					currentOnFocusOutside.current( event );
					setPollingData( null );
				} else if ( ! isIframe( focusedElement ) ) {
					// If focus is still inside the wrapper, but an iframe is not the
					// element currently focused, we can stop polling, because the regular
					// blur events will fire as expected.
					setPollingData( null );
				}
			}, 50 );
		} else if ( pollingIntervalId.current ) {
			window.clearInterval( pollingIntervalId.current );
			pollingIntervalId.current = undefined;
		}

		return () => {
			if ( pollingIntervalId.current ) {
				window.clearInterval( pollingIntervalId.current );
				pollingIntervalId.current = undefined;
			}
		};
	}, [ pollingData ] );

	/**
	 * Cancel a blur check timeout.
	 */
	const cancelBlurCheck = useCallback( () => {
		clearTimeout( blurCheckTimeoutId.current );
	}, [] );

	// Cancel blur checks on unmount.
	useEffect( () => {
		return () => cancelBlurCheck();
	}, [ cancelBlurCheck ] );

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
	const queueBlurCheck: React.FocusEventHandler = useCallback( ( event ) => {
		// React does not allow using an event reference asynchronously
		// due to recycling behavior, except when explicitly persisted.
		event.persist();

		// Grab currentTarget immediately,
		// otherwise it will change as the event bubbles up.
		const wrapperEl = event.currentTarget;

		// Skip blur check if clicking button. See `normalizeButtonFocus`.
		if ( preventBlurCheck.current ) {
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

		blurCheckTimeoutId.current = setTimeout( () => {
			const activeElement = wrapperEl.ownerDocument.activeElement;

			// On blur events, the onFocusOutside prop should not be called:
			// 1. If document is not focused
			//    https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
			// 2. If the focus was moved to an element inside the wrapper component
			//    (this would be the case, for example, of an iframe)
			if (
				! wrapperEl.ownerDocument.hasFocus() ||
				( activeElement && wrapperEl.contains( activeElement ) )
			) {
				event.preventDefault();

				// If focus is moved to an iframe inside the wrapper, start manually
				// polling to check for correct focus outside events. See the useEffect
				// above for more information.
				if ( isIframe( activeElement ) ) {
					setPollingData( { wrapperEl, event } );
				}

				return;
			}

			if ( 'function' === typeof currentOnFocusOutside.current ) {
				currentOnFocusOutside.current( event );
			}
			// the timeout delay is necessary to wait for browser's focus event to
			// fire after the blur event, and therefore for this callback to be able
			// to retrieve the correct document.activeElement.
		}, 50 );
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
