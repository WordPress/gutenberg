/**
 * External dependencies
 */
import { omit } from 'lodash';

export default function( state = {}, action ) {
	switch ( action.type ) {
		case 'REGISTER_PLUGIN':
			return {
				...state,
				[ action.name ]: action.settings,
			};
		case 'UNREGISTER_PLUGIN':
			return omit( state, action.name );
	}
	return state;
}
