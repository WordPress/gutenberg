/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {boolean|string} focusOnMount Focus on mount mode.
 * @return {Function|undefined} Ref callback.
 *
 * @example
 * ```js
 * import { useFocusOnMount } from '@wordpress/compose';
 *
 * const WithFocusOnMount = () => {
 *     const ref = useFocusOnMount()
 *     return (
 *         <div ref={ ref }>
 *             <Button />
 *             <Button />
 *         </div>
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

		let target = node;

		if ( focusOnMount === 'firstElement' ) {
			const firstTabbable = focus.tabbable.find( node )[ 0 ];

			if ( firstTabbable ) {
				target = firstTabbable;
			}
		}

		target.focus();
	}, [] );

	// If focus doesn't need to be set on mount, no need to return a ref
	// callback.
	if ( ! focusOnMount ) {
		return;
	}

	return ref;
}
