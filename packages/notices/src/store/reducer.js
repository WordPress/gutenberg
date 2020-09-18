/**
 * External dependencies
 */
import { reject } from 'lodash';

/**
 * Internal dependencies
 */
import onSubKey from './utils/on-sub-key';

/**
 * Reducer returning the next notices state. The notices state is an object
 * where each key is a context, its value an array of notice objects.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
const notices = onSubKey( 'context' )( ( state = [], action ) => {
	switch ( action.type ) {
		case 'CREATE_NOTICE':
			// Avoid duplicates on ID.
			return [
				...reject( state, { id: action.notice.id } ),
				action.notice,
			];

		case 'REMOVE_NOTICE':
			return reject( state, { id: action.id } );
	}

	return state;
} );

export default notices;
