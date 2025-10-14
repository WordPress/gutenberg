/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { focus } from '@wordpress/dom';

/**
 * Custom hook to focus the first form input element on mount.
 * Falls back to the first focusable element if no form input is found.
 *
 * @return {import('react').RefCallback<HTMLElement>} Ref callback.
 */
export default function useFocusOnFormInput() {
	/**
	 * Sets focus on a DOM element.
	 *
	 * @param {HTMLElement} target The DOM element to set focus to.
	 * @return {void}
	 */
	const setFocus = ( target: HTMLElement ) => {
		target.focus( {
			// When focusing newly mounted dialogs,
			// the position of the popover is often not right on the first render
			// This prevents the layout shifts when focusing the dialogs.
			preventScroll: true,
		} );
	};

	/** @type {import('react').MutableRefObject<ReturnType<setTimeout> | undefined>} */
	const timerIdRef = useRef< ReturnType< typeof setTimeout > >();

	return useRefEffect( ( node ) => {
		if ( ! node || node instanceof Element === false ) {
			return;
		}

		if ( node.contains( node.ownerDocument?.activeElement ?? null ) ) {
			return;
		}

		timerIdRef.current = setTimeout( () => {
			// First, try to find a form input element
			let formInput: HTMLElement | null = null;
			if ( node instanceof Element ) {
				formInput = node.querySelector< HTMLElement >(
					'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
				);
			}

			if ( formInput ) {
				setFocus( formInput );
				return;
			}

			// Fallback to the first focusable element
			const firstFocusable = focus.tabbable.find( node )[ 0 ];
			if ( firstFocusable ) {
				setFocus( firstFocusable );
			}
		}, 0 );

		return () => {
			if ( timerIdRef.current ) {
				clearTimeout( timerIdRef.current );
			}
		};
	}, [] );
}
