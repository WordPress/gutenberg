/**
 * WordPress dependencies
 */
import {
	registerStore,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';

const store = registerStore( 'core/plugins', {
	reducer,
	actions,
	selectors,
} );

export default store;
