/**
 * WordPress dependencies
 */
import { useRef, useCallback, useEffect } from '@wordpress/element';

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
	const previousNode = useRef();
	const focusedBeforeMount = useRef();
	const onFocusReturnRef = useRef( onFocusReturn );
	useEffect( () => {
		onFocusReturnRef.current = onFocusReturn;
	}, [] );

	const ref = useCallback( ( newNode ) => {
		// Unmounting the reference
		if (
			previousNode.current &&
			focusedBeforeMount.current &&
			previousNode.current.ownerDocument.activeElement &&
			previousNode.current.contains(
				previousNode.current.ownerDocument.activeElement
			)
		) {
			// Defer to the component's own explicit focus return behavior,
			// if specified. This allows for support that the `onFocusReturn` decides to allow the
			// default behavior to occur under some conditions.
			if ( onFocusReturnRef.current ) {
				onFocusReturnRef.current();
				return;
			}

			if (
				previousNode.current.ownerDocument.contains(
					focusedBeforeMount.current
				)
			) {
				focusedBeforeMount.current.focus();
			}
		}

		// Mounting the new reference
		focusedBeforeMount.current = newNode?.ownerDocument.activeElement;
		previousNode.current = newNode;
	}, [] );

	return ref;
}

export default useFocusReturn;
