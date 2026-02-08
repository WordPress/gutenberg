import { focus } from '@wordpress/dom';
import { useEffect, useRef } from '@wordpress/element';
import useRefEffect from '../use-ref-effect';

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param focusOnMount Focus on mount mode.
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
export default function useFocusOnMount(
	focusOnMount:
		| boolean
		| 'firstElement'
		| 'firstInputElement' = 'firstElement'
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

		const timerId = setTimeout( () => {
			// For 'firstInputElement' mode, try to find a form input element first
			if ( focusOnMountRef.current === 'firstInputElement' ) {
				const formInput = node.querySelector< HTMLElement >(
					'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
				);

				if ( formInput ) {
					setFocus( formInput );
					return;
				}
			}

			// Fallback to the first tabbable element
			const firstTabbable = focus.tabbable.find( node )[ 0 ];
			if ( firstTabbable ) {
				setFocus( firstTabbable );
			}
		}, 0 );

		return () => {
			clearTimeout( timerId );
		};
	}, [] );
}
