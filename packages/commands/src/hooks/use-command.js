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
 * @param {import('../store/actions').WPCommandConfig} command command config.
 */
export default function useCommand( command ) {
	const { registerCommand, unregisterCommand } = useDispatch( commandsStore );
	const currentCallback = useRef( command.callback );
	useEffect( () => {
		currentCallback.current = command.callback;
	}, [ command.callback ] );

	useEffect( () => {
		registerCommand( {
			name: command.name,
			context: command.context,
			label: command.label,
			searchLabel: command.searchLabel,
			icon: command.icon,
			callback: ( ...args ) => currentCallback.current( ...args ),
		} );
		return () => {
			unregisterCommand( command.name );
		};
	}, [
		command.name,
		command.label,
		command.searchLabel,
		command.icon,
		command.context,
		registerCommand,
		unregisterCommand,
	] );
}
