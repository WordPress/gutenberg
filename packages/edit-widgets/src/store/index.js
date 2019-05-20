/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';

const store = registerStore( 'core/edit-widgets', {
	reducer,
	actions,
	selectors,
} );

store.dispatch( { type: 'INIT' } );

export default store;
