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
	const focusedBeforeMount = useRef();
	const isFocused = useRef( false );
	const onFocusReturnRef = useRef( onFocusReturn );
	useEffect( () => {
		onFocusReturnRef.current = onFocusReturn;
	}, [] );

	const ref = useCallback( ( newNode ) => {
		const updateLastFocusedRef = ( { target } ) => {
			isFocused.current = newNode && newNode.contains( target );
		};

		// Unmounting the reference
		if ( ! newNode && focusedBeforeMount.current ) {
			if ( newNode?.ownerDocument ) {
				newNode.ownerDocument.removeEventListener(
					'focusin',
					updateLastFocusedRef
				);
			}

			if ( ! isFocused.current ) {
				return;
			}

			// Defer to the component's own explicit focus return behavior,
			// if specified. This allows for support that the `onFocusReturn` decides to allow the
			// default behavior to occur under some conditions.
			if ( onFocusReturnRef.current ) {
				onFocusReturnRef.current();
				return;
			}

			focusedBeforeMount.current.focus();
		}

		// Mounting the new reference
		focusedBeforeMount.current = newNode?.ownerDocument.activeElement;
		if ( newNode?.ownerDocument ) {
			newNode.ownerDocument.addEventListener(
				'focusin',
				updateLastFocusedRef
			);
		}
	}, [] );

	return ref;
}

export default useFocusReturn;
