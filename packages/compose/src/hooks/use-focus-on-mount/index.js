/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

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

	/**
	 * Sets focus on a DOM element.
	 *
	 * @param {HTMLElement} target The DOM element to set focus to.
	 * @return {void}
	 */
	const setFocus = ( target ) => {
		target.focus( {
			// When focusing newly mounted dialogs,
			// the position of the popover is often not right on the first render
			// This prevents the layout shifts when focusing the dialogs.
			preventScroll: true,
		} );
	};

	/** @type {import('react').MutableRefObject<ReturnType<setTimeout> | undefined>} */
	const timerIdRef = useRef();

	useEffect( () => {
		focusOnMountRef.current = focusOnMount;
	}, [ focusOnMount ] );

	return useRefEffect( ( node ) => {
		if ( ! node || focusOnMountRef.current === false ) {
			return;
		}

		if ( node.contains( node.ownerDocument?.activeElement ?? null ) ) {
			return;
		}

		if ( focusOnMountRef.current !== 'firstElement' ) {
			setFocus( node );
			return;
		}

		timerIdRef.current = setTimeout( () => {
			const firstTabbable = focus.tabbable.find( node )[ 0 ];
			if ( firstTabbable ) {
				setFocus( firstTabbable );
			}
		}, 0 );

		return () => {
			if ( timerIdRef.current ) {
				clearTimeout( timerIdRef.current );
			}
		};
	}, [] );
}
