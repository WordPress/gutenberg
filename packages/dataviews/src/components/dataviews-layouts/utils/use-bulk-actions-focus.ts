import {
	useCallback,
	useLayoutEffect,
	useRef,
	type RefObject,
} from '@wordpress/element';

/**
 * Moves focus when the bulk actions toolbar is shown or hidden, but only when
 * an interaction asked for it. Selection can be controlled by the consumer and
 * change asynchronously, for example when it is kept in the URL, so the move
 * cannot always happen in the event handler itself.
 *
 * @param options         Options.
 * @param options.isShown Whether the bulk actions toolbar shows actions.
 *
 * @return A function that asks to focus `target` once the toolbar is shown or
 *         hidden.
 */
export default function useBulkActionsFocus( {
	isShown,
}: {
	isShown: boolean;
} ) {
	const targetRef = useRef< RefObject< HTMLElement | null > | null >( null );

	// Layout effects run before the effects of ancestors, such as a router
	// that moves focus when a navigation removes the focused element.
	useLayoutEffect( () => {
		targetRef.current?.current?.focus();
		targetRef.current = null;
	}, [ isShown ] );

	return useCallback( ( target: RefObject< HTMLElement | null > ) => {
		targetRef.current = target;
	}, [] );
}
