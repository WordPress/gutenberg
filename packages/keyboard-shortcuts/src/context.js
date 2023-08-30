/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const listenersCount = new WeakMap();
const globalShortcuts = new Set();
const globalListener = ( event ) => {
	for ( const keyboardShortcut of globalShortcuts ) {
		keyboardShortcut( event );
	}
};

export const context = createContext( {
	add: ( shortcut, scope = document ) => {
		const previousCount = listenersCount.has( scope )
			? listenersCount.get( scope )
			: 0;
		if ( previousCount === 0 ) {
			scope.addEventListener( 'keydown', globalListener );
		}
		globalShortcuts.add( shortcut );
		listenersCount.set( scope, previousCount + 1 );
	},
	delete: ( shortcut, scope = document ) => {
		globalShortcuts.delete( shortcut );
		listenersCount.set( scope, listenersCount.get( scope ) - 1 );
		if ( listenersCount.get( scope ) === 0 ) {
			scope.removeEventListener( 'keydown', globalListener );
		}
	},
} );
