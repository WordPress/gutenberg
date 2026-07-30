/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';

let origin: Element | null = null;

/**
 * Adds the unmount behavior of returning focus to the element which had it
 * previously as is expected for roles like menus or dialogs.
 *
 * @param onFocusReturn Overrides the default return behavior.
 * @return Element Ref.
 *
 * @example
 * ```ts
 * import { useFocusReturn } from '@wordpress/compose';
 *
 * const WithFocusReturn = () => {
 *     const ref = useFocusReturn()
 *     return (
 *         <div ref={ ref }>
 *             <Button />
 *             <Button />
 *         </div>
 *     );
 * }
 * ```
 */
function useFocusReturn(
	onFocusReturn?: () => void
): React.RefCallback< HTMLElement > {
	const ref = useRef< HTMLElement | null >( null );
	const focusedBeforeMountRef = useRef< Element | null >( null );
	const onFocusReturnRef = useRef< ( () => void ) | undefined >(
		onFocusReturn
	);

	useEffect( () => {
		onFocusReturnRef.current = onFocusReturn;
	}, [ onFocusReturn ] );

	return useCallback( ( node: HTMLElement | null ) => {
		if ( node ) {
			// Set ref to be used when unmounting.
			ref.current = node;

			// Only set when the node mounts.
			if ( focusedBeforeMountRef.current ) {
				return;
			}

			const activeDocument =
				node.ownerDocument.activeElement instanceof
				window.HTMLIFrameElement
					? node.ownerDocument.activeElement.contentDocument
					: node.ownerDocument;

			focusedBeforeMountRef.current =
				activeDocument?.activeElement ?? null;
		} else if ( focusedBeforeMountRef.current ) {
			const isFocused = ref.current?.contains(
				ref.current?.ownerDocument.activeElement ?? null
			);

			if ( ref.current?.isConnected && ! isFocused ) {
				origin ??= focusedBeforeMountRef.current;
				return;
			}

			// Defer to the component's own explicit focus return behavior, if
			// specified. This allows for support that the `onFocusReturn`
			// decides to allow the default behavior to occur under some
			// conditions.
			if ( onFocusReturnRef.current ) {
				onFocusReturnRef.current();
			} else {
				const elementToFocus = (
					! focusedBeforeMountRef.current.isConnected
						? origin
						: focusedBeforeMountRef.current
				) as HTMLElement | SVGElement | null;

				elementToFocus?.focus();
			}
			origin = null;
		}
	}, [] );
}

export default useFocusReturn;
