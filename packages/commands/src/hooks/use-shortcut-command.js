/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

/**
 * Hook that binds a keyboard shortcut to a command.
 *
 * @param {string}  shortcutName       The name of the keyboard shortcut.
 * @param {string}  commandName        The name of the command to trigger.
 * @param {Object}  options            Shortcut options.
 * @param {boolean} options.isDisabled Whether to disable the shortcut.
 */
export default function useShortcutCommand(
	shortcutName,
	commandName,
	{ isDisabled = false } = {}
) {
	const command = useSelect(
		( select ) => {
			const allCommands = select( commandsStore ).getCommands();
			return allCommands.find( ( cmd ) => cmd.name === commandName );
		},
		[ commandName ]
	);

	const { triggerCommand, close: closeCommandPalette } =
		useDispatch( commandsStore );

	useShortcut(
		shortcutName,
		( event ) => {
			event.preventDefault();

			// If we have the command and it has a callback, execute it directly
			// This is a fallback in case the triggerCommand doesn't work.
			if ( command && typeof command.callback === 'function' ) {
				const closeFunction = () => {
					if ( typeof closeCommandPalette === 'function' ) {
						closeCommandPalette();
					}
				};

				command.callback( {
					close: closeFunction,
				} );
			} else {
				triggerCommand( commandName );
			}
		},
		{ isDisabled }
	);
}
