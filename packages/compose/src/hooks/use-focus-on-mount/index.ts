import { focus } from '@wordpress/dom';
import { useEffect, useRef } from '@wordpress/element';
import useRefEffect from '../use-ref-effect';

/**
 * Determines focus behavior when the element mounts.
 *
 * @param focusOnMount Focus options. Defaults to `"firstElement"` which focuses the
 *                     first tabbable element within; `"firstInputElement"` focuses the
 *                     first value control within; `true` focuses the element itself;
 *                     `false` does nothing. For dynamic resolution of the focus option
 *                     pass a callback whose return value is one of the preceding
 *                     options, `undefined` to default or an `HTMLElement` to focus.
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
	focusOnMount: useFocusOnMount.FocusOptions = 'firstElement'
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
		const currentFocusOnMount = focusOnMountRef.current;
		if ( currentFocusOnMount === false ) {
			return;
		}

		if ( node.contains( node.ownerDocument?.activeElement ?? null ) ) {
			return;
		}

		if ( currentFocusOnMount === true ) {
			setFocus( node );
			return;
		}

		const timerId = setTimeout( () => {
			let usedFocusOnMount;
			if ( typeof currentFocusOnMount === 'function' ) {
				usedFocusOnMount =
					currentFocusOnMount( node ) ?? 'firstElement';
				if ( typeof usedFocusOnMount === 'boolean' ) {
					if ( usedFocusOnMount ) {
						setFocus( node );
					}
					return;
				}
				// Focus the element returned.
				if ( ! ( typeof usedFocusOnMount === 'string' ) ) {
					setFocus( usedFocusOnMount );
					return;
				}
			}
			usedFocusOnMount ??= 'firstElement';
			// For 'firstInputElement' mode, try to find a form input element first
			if ( currentFocusOnMount === 'firstInputElement' ) {
				const formInput = node.querySelector< HTMLElement >(
					'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
				);

				if ( formInput ) {
					setFocus( formInput );
					return;
				}
			}
			// Fallback to the first tabbable element
			if ( usedFocusOnMount === 'firstElement' ) {
				const firstTabbable = focus.tabbable.find( node )[ 0 ];
				if ( firstTabbable ) {
					setFocus( firstTabbable );
				}
			}
		}, 0 );

		return () => {
			clearTimeout( timerId );
		};
	}, [] );
}

export namespace useFocusOnMount {
	export type Mode = boolean | 'firstElement' | 'firstInputElement';
	export type ModeResolver = (
		node: HTMLElement
	) => Mode | HTMLElement | undefined;
	export type FocusOptions = Mode | ModeResolver;
}
