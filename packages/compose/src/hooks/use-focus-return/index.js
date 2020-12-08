/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

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

	useEffect( () => {
		const ownerDocument = ref.current.ownerDocument;
		const focusedBeforeMount = ownerDocument.activeElement;

		return () => {
			if ( ! ref.current.contains( ownerDocument.activeElement ) ) {
				return;
			}

			// Defer to the component's own explicit focus return behavior,
			// if specified. This allows for support that the `onFocusReturn` decides to allow the
			// default behavior to occur under some conditions.
			if ( onFocusReturn ) {
				onFocusReturn();
				return;
			}

			if ( ownerDocument.contains( focusedBeforeMount ) ) {
				focusedBeforeMount.focus();
			}
		};
	}, [] );

	return ref;
}

export default useFocusReturn;
