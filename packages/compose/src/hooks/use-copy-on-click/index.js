/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
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

	const [ hasCopied, setHasCopied ] = useState( false );

	useEffect( () => {
		/** @type {number | undefined} */
		let timeoutId;
		/** @type Array<Element>) */
		let triggers = [];

		if ( ! ref.current ) {
			return;
		}

		// `triggers` is always an array, regardless of the value of the `ref` param.
		if ( typeof ref.current === 'string' ) {
			// expect `ref` to be a DOM selector
			triggers = Array.from( document.querySelectorAll( ref.current ) );
		} else if ( 'length' in ref.current ) {
			// Expect `ref` to be a `NodeList`
			triggers = Array.from( ref.current );
		} else {
			// Expect `ref` to be a single `Element`
			triggers = [ ref.current ];
		}

		/**
		 * @param {Event} e
		 */
		const copyTextToClipboard = ( e ) => {
			const trigger = /** @type {HTMLElement | null} */ ( e.target );
			const currentWindow = trigger?.ownerDocument.defaultView || window;
			const textToCopy = typeof text === 'function' ? text() : text || '';

			currentWindow?.navigator?.clipboard
				?.writeText( textToCopy )
				.then( () => {
					if ( timeout ) {
						setHasCopied( true );
						clearTimeout( timeoutId );
						timeoutId = setTimeout(
							() => setHasCopied( false ),
							timeout
						);
					}
				} );
		};

		triggers.forEach( ( t ) =>
			t.addEventListener( 'click', copyTextToClipboard )
		);

		return () => {
			triggers.forEach( ( t ) =>
				t.removeEventListener( 'click', copyTextToClipboard )
			);
			clearTimeout( timeoutId );
		};
	}, [ text, timeout, setHasCopied ] );

	return hasCopied;
}
