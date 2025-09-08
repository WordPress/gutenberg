/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as commandsStore } from './index';

/**
 * Middleware for handling command triggering.
 * When a TRIGGER_COMMAND action is dispatched, it finds the
 * corresponding registered command and executes its callback.
 *
 * @param {Object} store Redux store instance.
 *
 * @return {Function} Redux middleware.
 */
export const commandTriggerer = ( store ) => ( next ) => ( action ) => {
	const result = next( action );

	if ( action.type === 'TRIGGER_COMMAND' ) {
		const { name } = action;
		const allCommands = select( commandsStore ).getCommands();
		let command = select( commandsStore ).getCommand( name );

		if ( ! command ) {
			command = allCommands.find( ( cmd ) => cmd.name === name );
		}

		if ( command && typeof command.callback === 'function' ) {
			const close = () => {
				store.dispatch( { type: 'CLOSE' } );
			};

			command.callback( { close } );
		}
	}

	return result;
};

export default commandTriggerer;
