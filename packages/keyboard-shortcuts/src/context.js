/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const globalShortcuts = { current: new Set() };
document.addEventListener( 'DOMContentLoaded', () => {
	document.body.addEventListener( 'keydown', ( event ) => {
		for ( const keyboardShortcut of globalShortcuts.current ) {
			keyboardShortcut( event );
		}
	} );
} );

export const context = createContext( globalShortcuts );
