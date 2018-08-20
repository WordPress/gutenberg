/**
 * External Dependencies
 */
import { forOwn } from 'lodash';

/**
 * WordPress Dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
import * as selectors from './selectors';
import * as actions from './actions';
import * as tokens from '../components/rich-text/core-tokens';
import { validateTokenSettings } from '../components/rich-text/tokens';

/**
 * Module Constants
 */
const MODULE_KEY = 'core/editor';

const store = registerStore( MODULE_KEY, {
	reducer,
	selectors,
	actions,
	persist: [ 'preferences' ],
} );
applyMiddlewares( store );

forOwn( tokens, ( { name, settings } ) => {
	settings = validateTokenSettings( name, settings, store.getState() );

	if ( settings ) {
		store.dispatch( actions.registerToken( name, settings ) );
	}
} );

export default store;
