/**
 * WordPress dependencies
 */
import { createReduxStore, register, combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import widgetTypes from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import * as resolvers from './resolvers';

export const STORE_NAME = 'core/widget-types';

export const store = createReduxStore( STORE_NAME, {
	reducer: combineReducers( { widgetTypes } ),
	actions,
	selectors,
	resolvers,
} );

register( store );
