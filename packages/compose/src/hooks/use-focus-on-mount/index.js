/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { focus } from '@wordpress/dom';

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {boolean | 'firstElement' | ((tabbables: Element[]) => Element | null | undefined) } focusOnMount Focus on mount mode. May optionally be a callback that receives an array of tabbable elements and should return the element to focus.
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
	const timerId = useRef();

	useEffect( () => {
		focusOnMountRef.current = focusOnMount;
	}, [ focusOnMount ] );

	useEffect( () => {
		return () => {
			if ( timerId.current ) {
				clearTimeout( timerId.current );
			}
		};
	}, [] );

	return useCallback( ( node ) => {
		if ( ! node || focusOnMountRef.current === false ) {
			return;
		}

		if ( node.contains( node.ownerDocument?.activeElement ?? null ) ) {
			return;
		}

		if ( focusOnMountRef.current === 'firstElement' ) {
			timerId.current = setTimeout( () => {
				const firstTabbable = focus.tabbable.find( node )[ 0 ];

				if ( firstTabbable ) {
					setFocus( /** @type {HTMLElement} */ ( firstTabbable ) );
				}
			}, 0 );

			return;
		}

		if ( typeof focusOnMountRef?.current === 'function' ) {
			// Store a reference to the function to ensure that the
			// focusOnMountRef will still hold a reference to a function
			// when the timeout fires.
			const focusOnMountFunc = focusOnMountRef.current;

			timerId.current = setTimeout( () => {
				const tabbables = focus.tabbable.find( node );

				const elementToFocus = focusOnMountFunc( tabbables );

				if ( elementToFocus ) {
					setFocus( /** @type {HTMLElement} */ ( elementToFocus ) );
				}
			}, 0 );

			return;
		}

		setFocus( node );
	}, [] );
}
