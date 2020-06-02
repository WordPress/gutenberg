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
import { STORE_KEY } from './constants';

export default function registerEditSiteStore( initialState ) {
	return registerStore( STORE_KEY, {
		reducer,
		actions,
		selectors,
		controls,
		persist: [ 'preferences' ],
		initialState,
	} );
}
