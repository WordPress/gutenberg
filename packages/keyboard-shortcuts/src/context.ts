/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

type ShortcutCallback = ( event: KeyboardEvent ) => void;

interface ShortcutContextType {
	add: ( shortcut: ShortcutCallback ) => void;
	delete: ( shortcut: ShortcutCallback ) => void;
}

const globalShortcuts = new Set< ShortcutCallback >();
const globalListener = ( event: KeyboardEvent ) => {
	for ( const keyboardShortcut of globalShortcuts ) {
		keyboardShortcut( event );
	}
};

export const context = createContext< ShortcutContextType >( {
	add: ( shortcut: ShortcutCallback ) => {
		if ( globalShortcuts.size === 0 ) {
			document.addEventListener( 'keydown', globalListener );
		}
		globalShortcuts.add( shortcut );
	},
	delete: ( shortcut: ShortcutCallback ) => {
		globalShortcuts.delete( shortcut );
		if ( globalShortcuts.size === 0 ) {
			document.removeEventListener( 'keydown', globalListener );
		}
	},
} );

context.displayName = 'KeyboardShortcutsContext';
