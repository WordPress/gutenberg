import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	type RefObject,
} from '@wordpress/element';

interface FocusRequest {
	target: RefObject< HTMLElement | null >;
	isShown: boolean;
	cancel: () => void;
}

/**
 * Moves focus when the bulk actions toolbar is shown or hidden, but only when
 * an interaction asked for it. The interaction records where focus should go,
 * and the move happens once the toolbar reaches the expected state. Selection
 * can be controlled by the consumer and change asynchronously, for example
 * when it is kept in the URL, so the move cannot always happen in the event
 * handler itself.
 *
 * A request is dropped when focus moves outside of `containerRef`, so that a
 * later, unrelated change of selection does not move focus.
 *
 * @param isShown      Whether the bulk actions toolbar shows actions.
 * @param containerRef The element that holds focus while a request waits,
 *                     such as the bulk actions toolbar.
 *
 * @return A function that asks to focus `target` once the toolbar reaches the
 *         `isShown` state.
 */
export default function useBulkActionsFocus(
	isShown: boolean,
	containerRef: RefObject< HTMLElement | null >
) {
	const requestRef = useRef< FocusRequest | null >( null );

	// Layout effects run before the effects of ancestors, such as a router
	// that moves focus when a navigation removes the focused element.
	useLayoutEffect( () => {
		const request = requestRef.current;
		if ( request?.isShown !== isShown ) {
			return;
		}
		request.cancel();
		request.target.current?.focus();
	}, [ isShown ] );

	useEffect( () => () => requestRef.current?.cancel(), [] );

	return useCallback(
		(
			target: RefObject< HTMLElement | null >,
			{ isShown: expected }: { isShown: boolean }
		) => {
			requestRef.current?.cancel();
			const ownerDocument =
				containerRef.current?.ownerDocument ??
				target.current?.ownerDocument;
			const onFocusIn = ( event: FocusEvent ) => {
				if (
					! containerRef.current?.contains( event.target as Node ) &&
					event.target !== target.current
				) {
					request.cancel();
				}
			};
			const request: FocusRequest = {
				target,
				isShown: expected,
				cancel: () => {
					ownerDocument?.removeEventListener( 'focusin', onFocusIn );
					if ( requestRef.current === request ) {
						requestRef.current = null;
					}
				},
			};
			ownerDocument?.addEventListener( 'focusin', onFocusIn );
			requestRef.current = request;
		},
		[ containerRef ]
	);
}
