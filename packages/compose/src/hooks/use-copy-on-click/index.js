/**
 * External dependencies
 */
import Clipboard from 'clipboard';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/* eslint-disable jsdoc/no-undefined-types */
/**
 * Copies the text to the clipboard when the element is clicked.
 *
 * @deprecated
 *
 * @param {import('react').RefObject<string | Element | NodeListOf<Element>>} ref       Reference with the element.
 * @param {string|Function}                                                   text      The text to copy.
 * @param {number}                                                            [timeout] Optional timeout to reset the returned
 *                                                                                      state. 4 seconds by default.
 *
 * @return {boolean} Whether or not the text has been copied. Resets after the
 *                   timeout.
 */
export default function useCopyOnClick( ref, text, timeout = 4000 ) {
	/* eslint-enable jsdoc/no-undefined-types */
	deprecated( 'wp.compose.useCopyOnClick', {
		since: '5.8',
		alternative: 'wp.compose.useCopyToClipboard',
	} );

	/** @type {import('react').MutableRefObject<Clipboard | undefined>} */
	const clipboard = useRef();
	const [ hasCopied, setHasCopied ] = useState( false );

	useEffect( () => {
		/** @type {number | undefined} */
		let timeoutId;

		if ( ! ref.current ) {
			return;
		}

		// Clipboard listens to click events.
		clipboard.current = new Clipboard( ref.current, {
			text: () => ( typeof text === 'function' ? text() : text ),
		} );

		clipboard.current.on( 'success', ( { clearSelection, trigger } ) => {
			// Clearing selection will move focus back to the triggering button,
			// ensuring that it is not reset to the body, and further that it is
			// kept within the rendered node.
			clearSelection();

			// Handle ClipboardJS focus bug, see https://github.com/zenorocha/clipboard.js/issues/680
			if ( trigger ) {
				/** @type {HTMLElement} */ ( trigger ).focus();
			}

			if ( timeout ) {
				setHasCopied( true );
				clearTimeout( timeoutId );
				timeoutId = setTimeout( () => setHasCopied( false ), timeout );
			}
		} );

		return () => {
			if ( clipboard.current ) {
				clipboard.current.destroy();
			}
			clearTimeout( timeoutId );
		};
	}, [ text, timeout, setHasCopied ] );

	return hasCopied;
}
