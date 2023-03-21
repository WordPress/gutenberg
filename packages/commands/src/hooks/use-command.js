/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

/**
 * Attach a command to the Global command menu.
 *
 * @param {string}   name     Command name.
 * @param {string}   label    Command label.
 * @param {Function} callback Command callback.
 */
export default function useCommand( name, label, callback ) {
	const { registerCommand, unregisterCommand } = useDispatch( commandsStore );
	const currentCallback = useRef( callback );
	useEffect( () => {
		currentCallback.current = callback;
	}, [ callback ] );

	useEffect( () => {
		registerCommand( { name, label, callback: currentCallback.current } );
		return () => {
			unregisterCommand( name );
		};
	}, [ name, label, registerCommand, unregisterCommand ] );
}
