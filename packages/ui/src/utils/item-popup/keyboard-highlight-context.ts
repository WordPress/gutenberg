import { createContext, useContext } from '@wordpress/element';

export const KeyboardHighlightContext = createContext( false );

export const useKeyboardHighlight = () =>
	useContext( KeyboardHighlightContext );

export function isKeyboardOpenEvent( event: Event ) {
	return (
		event.type === 'keydown' ||
		( event.type === 'click' && 'detail' in event && event.detail === 0 )
	);
}
