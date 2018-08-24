/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';

registerStore( 'core/plugins', {
	reducer,
	selectors,
	actions,
	persist: [ 'preferences' ],
} );
