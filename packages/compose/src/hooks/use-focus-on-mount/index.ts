import { focus } from '@wordpress/dom';
import { useEffect, useRef } from '@wordpress/element';
import useRefEffect from '../use-ref-effect';

/**
 * Determines focus behavior when the element mounts.
 *
 * @param focusOnMount Behavioral mode. Defaults to `"firstElement"` which focuses the
 *                     first tabbable element within; `"firstInputElement"` focuses the
 *                     first value control within; `true` focuses the element itself;
 *                     `false` does nothing.
 * @return Ref callback.
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
export function useFocusOnMount(
	focusOnMount: useFocusOnMount.Mode = 'firstElement'
) {
	const focusOnMountRef = useRef( focusOnMount );

	/**
	 * Sets focus on a DOM element.
	 *
	 * @param target The DOM element to set focus to.
	 */
	const setFocus = ( target: HTMLElement ): void => {
		target.focus( {
			// When focusing newly mounted dialogs,
			// the position of the popover is often not right on the first render
			// This prevents the layout shifts when focusing the dialogs.
			preventScroll: true,
		} );
	};

	useEffect( () => {
		focusOnMountRef.current = focusOnMount;
	}, [ focusOnMount ] );

	return useRefEffect< HTMLElement >( ( node ) => {
		if ( focusOnMountRef.current === false ) {
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

		let timerId: ReturnType< typeof setTimeout >;
		let searchCounter = 0;

		const tryFocus = () => {
			// For 'firstInputElement' mode, try to find a form input element first.
			if ( focusOnMountRef.current === 'firstInputElement' ) {
				const formInput = node.querySelector< HTMLElement >(
					'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
				);

				if ( formInput ) {
					setFocus( formInput );
					return;
				}

				// If the input isn't available yet (e.g. async loading controls),
				// retry until the deadline before falling back.
				if ( searchCounter++ < 4 ) {
					timerId = setTimeout( tryFocus, 50 );
					return;
				}
			}

			// Fallback to the first tabbable element
			const firstTabbable = focus.tabbable.find( node )[ 0 ];
			if ( firstTabbable ) {
				setFocus( firstTabbable );
			}
		};

		timerId = setTimeout( tryFocus, 0 );

		return () => {
			clearTimeout( timerId );
		};
	}, [] );
}

export namespace useFocusOnMount {
	export type Mode = boolean | 'firstElement' | 'firstInputElement';
}
