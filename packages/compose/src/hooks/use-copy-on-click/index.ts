/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import type { RefObject } from 'react';

/**
 * Internal dependencies
 */
import { clearSelection, copyToClipboard } from '../use-copy-to-clipboard';

/**
 * Copies the text to the clipboard when the element is clicked.
 *
 * @deprecated
 * @param ref      Reference with the element.
 * @param text    The text to copy.
 * @param timeout Optional timeout to reset the returned
 *                state. 4 seconds by default.
 * @return   Whether or not the text has been copied. Resets after the
 *           timeout.
 */
export default function useCopyOnClick(
	ref: RefObject< string | Element | NodeListOf< Element > >,
	text: string | ( () => string ),
	timeout: number = 4000
): boolean {
	deprecated( 'wp.compose.useCopyOnClick', {
		since: '5.8',
		alternative: 'wp.compose.useCopyToClipboard',
	} );

	const [ hasCopied, setHasCopied ] = useState( false );

	useEffect( () => {
		// Flag to prevent state updates after unmount when the Promise resolves.
		let isActive = true;
		let timeoutId: ReturnType< typeof setTimeout > | undefined;
		if ( ! ref.current ) {
			return;
		}

		let targets: Element[];
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
			targets = [ ref.current as Element ];
		}

		if ( targets.length === 0 ) {
			return;
		}

		const handleClick = async ( event: Event ) => {
			const trigger = event.currentTarget as Element;
			if ( ! trigger ) {
				return;
			}
			const success = await copyToClipboard(
				typeof text === 'function' ? text() : text || '',
				trigger
			);
			if ( ! isActive ) {
				return;
			}
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
		};

		for ( const target of targets ) {
			target.addEventListener( 'click', handleClick );
		}
		return () => {
			isActive = false;
			for ( const target of targets ) {
				target.removeEventListener( 'click', handleClick );
			}
			clearTimeout( timeoutId );
		};
	}, [ ref, text, timeout ] );

	return hasCopied;
}
