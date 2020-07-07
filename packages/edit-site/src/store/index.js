/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';
import { controls as dataControls } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import controls from './controls';
import { STORE_KEY } from './constants';

export default function registerEditSiteStore( initialState ) {
	const store = registerStore( STORE_KEY, {
		reducer,
		actions,
		selectors,
		controls: { ...dataControls, ...controls },
		persist: [ 'preferences' ],
		initialState,
	} );

	const { showOnFront, pageOnFront } = initialState.home;
	const initialPage = {
		path: '/',
		context:
			showOnFront === 'page'
				? {
						postType: 'page',
						postId: pageOnFront,
				  }
				: {},
	};

	// We set the initial page here to include the template fetch which will
	// resolve the correct homepage template.
	store.dispatch( actions.setupState( initialPage ) );
	return store;
}
