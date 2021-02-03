/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
import { controls } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

export let store = null;

export default function registerEditSiteStore( initialState ) {
	if ( store !== null ) {
		return;
	}

	const _store = createReduxStore( STORE_NAME, {
		reducer,
		actions,
		selectors,
		controls,
		persist: [ 'preferences' ],
		initialState,
	} );
	register( _store );

	store = _store;

	return _store;
}
