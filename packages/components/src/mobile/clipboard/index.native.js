/**
 * WordPress dependencies
 */
import { createContext, useCallback, useRef } from '@wordpress/element';

export const ClipboardContext = createContext( {} );
const { Provider, Consumer } = ClipboardContext;
export { Consumer as ClipboardConsumer };

export default function ClipboardProvider( { children } ) {
	const clipboard = useRef();
	const updateClipboard = useCallback( ( clipboardUpdate ) => {
		clipboard.current = clipboardUpdate;
	}, [] );

	return (
		<Provider value={ { clipboard, updateClipboard } }>
			{ children }
		</Provider>
	);
}
