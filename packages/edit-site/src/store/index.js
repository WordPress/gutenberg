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
import { STORE_NAME } from './constants';

export default function registerEditSiteStore( initialState ) {
	const store = registerStore( STORE_NAME, {
		reducer,
		actions,
		selectors,
		controls,
		persist: [ 'preferences' ],
		initialState,
	} );

	return store;
}
