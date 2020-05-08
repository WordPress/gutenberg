/**
 * External dependencies
 */
import Clipboard from 'clipboard';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';

export default function useCopyOnClick( ref, text, timeout = 4000 ) {
	const clipboard = useRef();
	const [ hasCopied, setHasCopied ] = useState( false );

	useEffect( () => {
		let timeoutId;

		clipboard.current = new Clipboard( ref.current, {
			text: () => ( typeof text === 'function' ? text() : text ),
			container: ref.current,
		} );

		clipboard.current.on( 'success', ( { clearSelection } ) => {
			// Clearing selection will move focus back to the triggering button,
			// ensuring that it is not reset to the body, and further that it is
			// kept within the rendered node.
			clearSelection();

			if ( timeout ) {
				setHasCopied( true );
				clearTimeout( timeoutId );
				timeoutId = setTimeout( () => setHasCopied( false ), timeout );
			}
		} );

		return () => {
			clipboard.current.destroy();
			clearTimeout( timeoutId );
		};
	}, [ text, timeout, setHasCopied ] );

	return hasCopied;
}
