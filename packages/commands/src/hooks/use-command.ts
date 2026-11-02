import { useContext, useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as commandsStore } from '../store';
import type { CommandConfig } from '../store/types';
import { CommandsDisabledContext } from '../commands-disabled-context';

/**
 * Attach a command to the command palette. Used for static commands.
 *
 * @param command command config.
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
export function useCommand( command: CommandConfig ) {
	const { registerCommand, unregisterCommand } = useDispatch( commandsStore );
	const isDisabled =
		useContext( CommandsDisabledContext ) || command.disabled;
	const currentCallbackRef = useRef( command.callback );
	useEffect( () => {
		currentCallbackRef.current = command.callback;
	}, [ command.callback ] );

	useEffect( () => {
		if ( isDisabled ) {
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
			callback: ( ...args: Parameters< CommandConfig[ 'callback' ] > ) =>
				currentCallbackRef.current( ...args ),
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
		isDisabled,
		registerCommand,
		unregisterCommand,
	] );
}

/**
 * Attach multiple commands to the command palette. Used for static commands.
 *
 * @param commands Array of command configs.
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
export function useCommands( commands: CommandConfig[] ) {
	const { registerCommand, unregisterCommand } = useDispatch( commandsStore );
	const isScopeDisabled = useContext( CommandsDisabledContext );
	const currentCallbacksRef = useRef<
		Record< string, CommandConfig[ 'callback' ] >
	>( {} );

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
		if ( ! commands || isScopeDisabled ) {
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
				callback: (
					...args: Parameters< CommandConfig[ 'callback' ] >
				) => {
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
	}, [ commands, isScopeDisabled, registerCommand, unregisterCommand ] );
}
