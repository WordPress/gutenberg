/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { clearSelection, copyToClipboard } from '../use-copy-to-clipboard';

/**
 * Copies the text to the clipboard when the element is clicked.
 *
 * @deprecated
 *
 * @param {React.RefObject<string | Element | NodeListOf<Element>>} ref       Reference with the element.
 * @param {string|Function}                                         text      The text to copy.
 * @param {number}                                                  [timeout] Optional timeout to reset the returned
 *                                                                            state. 4 seconds by default.
 *
 * @return {boolean} Whether or not the text has been copied. Resets after the
 *                   timeout.
 */
export default function useCopyOnClick( ref, text, timeout = 4000 ) {
	deprecated( 'wp.compose.useCopyOnClick', {
		since: '5.8',
		alternative: 'wp.compose.useCopyToClipboard',
	} );

	const [ hasCopied, setHasCopied ] = useState( false );

	useEffect( () => {
		/** @type {number | undefined} */
		let timeoutId;
		if ( ! ref.current ) {
			return;
		}

		let targets;
		if ( typeof ref.current === 'string' ) {
			targets =
				typeof document !== 'undefined'
					? Array.from( document.querySelectorAll( ref.current ) )
					: [];
		} else if (
			'length' in ref.current &&
			typeof ref.current.length === 'number'
		) {
			targets = Array.from( ref.current );
		} else {
			targets = [ /** @type {Element} */ ( ref.current ) ];
		}

		if ( targets.length === 0 ) {
			return;
		}

		const handleClick = ( /** @type {Event} */ event ) => {
			const trigger = /** @type {Element} */ ( event.currentTarget );
			if ( ! trigger ) {
				return;
			}
			copyToClipboard(
				typeof text === 'function' ? text() : text || '',
				trigger
			).then( ( success ) => {
				if ( success ) {
					clearSelection( trigger );
					if ( timeout ) {
						setHasCopied( true );
						clearTimeout( timeoutId );
						timeoutId = setTimeout(
							() => setHasCopied( false ),
							timeout
						);
					}
				}
			} );
		};

		for ( const target of targets ) {
			target.addEventListener( 'click', handleClick );
		}
		return () => {
			for ( const target of targets ) {
				target.removeEventListener( 'click', handleClick );
			}
			clearTimeout( timeoutId );
		};
	}, [ ref, text, timeout ] );

	return hasCopied;
}
