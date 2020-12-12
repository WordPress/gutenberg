/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';

/**
 * Hook used to focus the element on mount.
 *
 * @param {boolean} focusOnMount Whether to set focus on mount.
 *
 * @return {Function|undefined} Ref callback.
 *
 * @example
 * ```js
 * import { useFocusOnMount } from '@wordpress/compose';
 *
 * const WithFocusOnMount = () => {
 *     const ref = useFocusOnMount()
 *     return (
 *         <div tabIndex="-1" ref={ ref }></div>
 *     );
 * }
 * ```
 */
export default function useFocusOnMount( focusOnMount = true ) {
	const didMount = useRef( false );
	const ref = useCallback( ( node ) => {
		if ( ! node || didMount.current === true ) {
			return;
		}

		didMount.current = true;

		if ( node.contains( node.ownerDocument.activeElement ) ) {
			return;
		}

		node.focus();
	}, [] );

	// If focus doesn't need to be set on mount, no need to return a ref
	// callback.
	if ( ! focusOnMount ) {
		return;
	}

	return ref;
}
