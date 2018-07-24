/**
 * WordPress dependencies
 */
import { registerStore, restrictPersistence } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';

const REDUCER_KEY = 'preferences';

const store = registerStore( 'core/nux', {
	reducer: restrictPersistence( reducer, REDUCER_KEY ),
	actions,
	selectors,
	persist: true,
} );

export default store;
