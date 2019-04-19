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
import controls from './controls';

const store = registerStore( 'core/edit-widgets', {
	reducer,
	actions,
	selectors,
	controls,
} );

store.dispatch( { type: 'INIT' } );

export default store;
