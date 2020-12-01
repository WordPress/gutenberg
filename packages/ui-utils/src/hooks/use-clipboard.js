/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { copyToClipboard } from '../clipboard';

/**
 * Copies text to the clipboard with a custom timeout.
 *
 * Source:
 * https://github.com/chakra-ui/chakra-ui/blob/master/packages/hooks/src/use-clipboard.ts
 *
 * @param {string} text Text to copy to the clipboard
 * @param {number} timeout
 *
 * @return {{ hasCopied: boolean, onCopy: () => void, value: string }} The copied state, callback function, and value.
 */
export function useClipboard( text, timeout = 1500 ) {
	const [ hasCopied, setHasCopied ] = useState( false );

	const onCopy = useCallback( () => {
		const didCopy = copyToClipboard( text );
		setHasCopied( didCopy );
	}, [ text ] );

	useEffect( () => {
		if ( hasCopied ) {
			const id = setTimeout( () => {
				setHasCopied( false );
			}, timeout );

			return () => clearTimeout( id );
		}
		return undefined;
	}, [ timeout, hasCopied ] );

	return { hasCopied, onCopy, value: text };
}
