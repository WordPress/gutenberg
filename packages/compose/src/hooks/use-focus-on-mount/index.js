/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { focus } from '@wordpress/dom';

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {boolean | 'firstElement'} focusOnMount Focus on mount mode.
 * @return {import('react').RefCallback<HTMLElement>} Ref callback.
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
export default function useFocusOnMount( focusOnMount = 'firstElement' ) {
	const focusOnMountRef = useRef( focusOnMount );
	useEffect( () => {
		focusOnMountRef.current = focusOnMount;
	}, [ focusOnMount ] );

	return useCallback( ( node ) => {
		if ( ! node || focusOnMountRef.current === false ) {
			return;
		}

		if ( node.contains( node.ownerDocument?.activeElement ?? null ) ) {
			return;
		}

		if ( focusOnMountRef.current !== 'firstElement' ) {
			node.focus( {
				// When focusing newly mounted dialogs,
				// the position of the popover is often not right on the first render
				// This prevents the layout shifts when focusing the dialogs.
				preventScroll: true,
			} );

			return;
		}

		const focusTimeout = setTimeout( () => {
			const firstTabbable = focus.tabbable.find( node )[ 0 ];

			if ( firstTabbable ) {
				/** @type {HTMLElement} */ ( firstTabbable ).focus();
			}
		}, 0 );

		return () => clearTimeout( focusTimeout );
	}, [] );
}
