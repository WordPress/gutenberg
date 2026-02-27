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
 * @param {boolean | 'firstElement' | 'firstInputElement'} focusOnMount Focus on mount mode.
 * @return {React.RefCallback<HTMLElement>} Ref callback.
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

	/** @type {React.MutableRefObject<ReturnType<setTimeout> | undefined>} */
	const timerIdRef = useRef( undefined );

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

		if (
			focusOnMountRef.current !== 'firstElement' &&
			focusOnMountRef.current !== 'firstInputElement'
		) {
			setFocus( node );
			return;
		}

		const focusFirstTabbable = () => {
			const firstTabbable = focus.tabbable.find( node )[ 0 ];
			if ( firstTabbable ) {
				setFocus( firstTabbable );
			}
		};

		timerIdRef.current = setTimeout( () => {
			// For 'firstInputElement' mode, try to find a form input element first
			if ( focusOnMountRef.current === 'firstInputElement' ) {
				/** @type {() => HTMLElement | null} */
				const findFormInput = () => {
					if (
						typeof window !== 'undefined' &&
						node instanceof window.Element
					) {
						return /** @type {HTMLElement | null} */ (
							node.querySelector(
								'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
							)
						);
					}
					return null;
				};

				const formInput = findFormInput();
				if ( formInput ) {
					setFocus( formInput );
					return;
				}

				// Retry for up to 200ms to accommodate async loading
				// controls that may show a placeholder before the input.
				let retries = 4;
				const retry = () => {
					timerIdRef.current = setTimeout( () => {
						const input = findFormInput();
						if ( input ) {
							setFocus( input );
						} else if ( --retries > 0 ) {
							retry();
						} else {
							focusFirstTabbable();
						}
					}, 50 );
				};
				retry();
				return;
			}

			focusFirstTabbable();
		}, 0 );

		return () => {
			if ( timerIdRef.current ) {
				clearTimeout( timerIdRef.current );
			}
		};
	}, [] );
}
