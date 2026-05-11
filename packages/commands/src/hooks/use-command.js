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
 * Attach a command to the command palette. Used for static commands.
 *
 * @param {import('../store/actions').WPCommandConfig} command command config.
 *
 * @example
 * ```js
 * import { useCommand } from '@wordpress/commands';
 * import { plus } from '@wordpress/icons';
 *
 * useCommand( {
 *     name: 'myplugin/my-command-name',
 *     label: __( 'Add new post' ),
 *	   icon: plus,
 *     category: 'command',
 *     callback: ({ close }) => {
 *         document.location.href = 'post-new.php';
 *         close();
 *     },
 * } );
 * ```
 */
export function useCommand( command ) {
	const { registerCommand, unregisterCommand } = useDispatch( commandsStore );
	const currentCallbackRef = useRef( command.callback );
	useEffect( () => {
		currentCallbackRef.current = command.callback;
	}, [ command.callback ] );

	useEffect( () => {
		if ( command.disabled ) {
			return;
		}
		registerCommand( {
			name: command.name,
			context: command.context,
			category: command.category,
			label: command.label,
			searchLabel: command.searchLabel,
			icon: command.icon,
			keywords: command.keywords,
			callback: ( ...args ) => currentCallbackRef.current( ...args ),
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
		command.category,
		command.keywords,
		command.disabled,
		registerCommand,
		unregisterCommand,
	] );
}

/**
 * Attach multiple commands to the command palette. Used for static commands.
 *
 * @param {import('../store/actions').WPCommandConfig[]} commands Array of command configs.
 *
 * @example
 * ```js
 * import { useCommands } from '@wordpress/commands';
 * import { plus, pencil } from '@wordpress/icons';
 *
 * useCommands( [
 *     {
 *         name: 'myplugin/add-post',
 *         label: __( 'Add new post' ),
 *         icon: plus,
 *         category: 'command',
 *         callback: ({ close }) => {
 *             document.location.href = 'post-new.php';
 *             close();
 *         },
 *     },
 *     {
 *         name: 'myplugin/edit-posts',
 *         label: __( 'Edit posts' ),
 *         icon: pencil,
 *         category: 'view',
 *         callback: ({ close }) => {
 *             document.location.href = 'edit.php';
 *             close();
 *         },
 *     },
 * ] );
 * ```
 */
export function useCommands( commands ) {
	const { registerCommand, unregisterCommand } = useDispatch( commandsStore );
	const currentCallbacksRef = useRef( {} );

	useEffect( () => {
		if ( ! commands ) {
			return;
		}
		commands.forEach( ( command ) => {
			if ( command.callback ) {
				currentCallbacksRef.current[ command.name ] = command.callback;
			}
		} );
	}, [ commands ] );

	useEffect( () => {
		if ( ! commands ) {
			return;
		}
		commands.forEach( ( command ) => {
			if ( command.disabled ) {
				return;
			}
			registerCommand( {
				name: command.name,
				context: command.context,
				category: command.category,
				label: command.label,
				searchLabel: command.searchLabel,
				icon: command.icon,
				keywords: command.keywords,
				callback: ( ...args ) => {
					const callback =
						currentCallbacksRef.current[ command.name ];
					if ( callback ) {
						callback( ...args );
					}
				},
			} );
		} );

		return () => {
			commands.forEach( ( command ) => {
				unregisterCommand( command.name );
			} );
		};
	}, [ commands, registerCommand, unregisterCommand ] );
}
