/**
 * WordPress Dependencies
 */
import {
	registerStore,
	withRehydratation,
	loadAndPersist,
	subscribe,
	dispatch,
	select,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
import * as actions from './actions';
import * as selectors from './selectors';

/**
 * Module Constants
 */
const STORAGE_KEY = `WP_EDIT_POST_PREFERENCES_${ window.userSettings.uid }`;

const store = registerStore( 'core/edit-post', {
	reducer: withRehydratation( reducer, 'preferences', STORAGE_KEY ),
	actions,
	selectors,
} );

applyMiddlewares( store );
loadAndPersist( store, reducer, 'preferences', STORAGE_KEY );

let lastIsSmall;
subscribe( () => {
	const isSmall = select( 'core/viewport' ).isViewportMatch( '< medium' );
	const hasViewportShrunk = isSmall && ! lastIsSmall;
	lastIsSmall = isSmall;

	// Collapse sidebar when viewport shrinks.
	if ( hasViewportShrunk ) {
		dispatch( 'core/edit-post' ).closeGeneralSidebar();
	}
} );

export default store;
