/**
 * WordPress Dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import * as resolvers from './resolvers';

const store = registerStore( 'core', {
	reducer,
	actions,
	selectors,
	resolvers,
} );

export default store;
