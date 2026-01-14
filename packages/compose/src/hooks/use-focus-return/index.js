/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';

/** @type {Element|null} */
let origin = null;

/**
 * Adds the unmount behavior of returning focus to the element which had it
 * previously as is expected for roles like menus or dialogs.
 *
 * @param {() => void} [onFocusReturn] Overrides the default return behavior.
 * @return {import('react').RefCallback<HTMLElement>} Element Ref.
 *
 * @example
 * ```js
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
function useFocusReturn( onFocusReturn ) {
	/** @type {import('react').MutableRefObject<null | HTMLElement>} */
	const ref = useRef( null );
	/** @type {import('react').MutableRefObject<null | Element>} */
	const focusedBeforeMount = useRef( null );
	const onFocusReturnRef = useRef( onFocusReturn );
	useEffect( () => {
		onFocusReturnRef.current = onFocusReturn;
	}, [ onFocusReturn ] );

	return useCallback( ( node ) => {
		if ( node ) {
			// Set ref to be used when unmounting.
			ref.current = node;

			// Only set when the node mounts.
			if ( focusedBeforeMount.current ) {
				return;
			}

			const activeDocument =
				node.ownerDocument.activeElement instanceof
				window.HTMLIFrameElement
					? node.ownerDocument.activeElement.contentDocument
					: node.ownerDocument;

			focusedBeforeMount.current = activeDocument?.activeElement ?? null;
		} else if ( focusedBeforeMount.current ) {
			const isFocused = ref.current?.contains(
				ref.current?.ownerDocument.activeElement
			);

			if ( ref.current?.isConnected && ! isFocused ) {
				origin ??= focusedBeforeMount.current;
				return;
			}

			// Defer to the component's own explicit focus return behavior, if
			// specified. This allows for support that the `onFocusReturn`
			// decides to allow the default behavior to occur under some
			// conditions.
			if ( onFocusReturnRef.current ) {
				onFocusReturnRef.current();
			} else {
				/** @type {null|HTMLElement} */ (
					! focusedBeforeMount.current.isConnected
						? origin
						: focusedBeforeMount.current
				)?.focus();
			}
			origin = null;
		}
	}, [] );
}

export default useFocusReturn;
