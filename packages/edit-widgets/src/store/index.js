/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';
import { controls } from '@wordpress/data-controls';

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
	controls,
} );

store.dispatch( { type: 'INIT' } );

export default store;
