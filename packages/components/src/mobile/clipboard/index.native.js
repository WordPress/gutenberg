/**
 * WordPress dependencies
 */
import { createContext, useCallback, useState } from '@wordpress/element';

export const ClipboardContext = createContext( {} );
const { Provider, Consumer } = ClipboardContext;
export { Consumer as ClipboardConsumer };

export default function ClipboardProvider( { children } ) {
	const [ clipboard, setClipboard ] = useState();
	const updateClipboard = useCallback( ( clipboardUpdate ) => {
		setClipboard( clipboardUpdate );
	}, [] );

	return (
		<Provider value={ { clipboard, updateClipboard } }>
			{ children }
		</Provider>
	);
}
