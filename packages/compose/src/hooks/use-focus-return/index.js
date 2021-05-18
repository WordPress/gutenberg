/**
 * WordPress dependencies
 */
import { useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useFreshRef from '../use-fresh-ref';

/**
 * When opening modals/sidebars/dialogs, the focus
 * must move to the opened area and return to the
 * previously focused element when closed.
 * The current hook implements the returning behavior.
 *
 * @param {Function?} onFocusReturn Overrides the default return behavior.
 * @return {Function} Element Ref.
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
	const ref = useRef();
	const focusedBeforeMount = useRef();
	const onFocusReturnRef = useFreshRef( onFocusReturn );

	return useCallback( ( node ) => {
		if ( node ) {
			// Set ref to be used when unmounting.
			ref.current = node;

			// Only set when the node mounts.
			if ( focusedBeforeMount.current ) {
				return;
			}

			focusedBeforeMount.current = node.ownerDocument.activeElement;
		} else if ( focusedBeforeMount.current ) {
			const isFocused = ref.current.contains(
				ref.current.ownerDocument.activeElement
			);

			if ( ref.current.isConnected && ! isFocused ) {
				return;
			}

			// Defer to the component's own explicit focus return behavior, if
			// specified. This allows for support that the `onFocusReturn`
			// decides to allow the default behavior to occur under some
			// conditions.
			if ( onFocusReturnRef.current ) {
				onFocusReturnRef.current();
			} else {
				focusedBeforeMount.current.focus();
			}
		}
	}, [] );
}

export default useFocusReturn;
