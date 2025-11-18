/**
 * WordPress dependencies
 */
import { createReduxStore, register, dispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import * as resolvers from './resolvers';
import {
	STORE_NAME,
	ENTITY_KIND,
	ENTITY_NAME,
	ENTITY_NAME_CATEGORIES,
} from './constants';

/**
 * The abilities store definition.
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
	resolvers,
} );

register( store );

dispatch( coreStore ).addEntities( [
	{
		name: ENTITY_NAME,
		kind: ENTITY_KIND,
		key: 'name',
		baseURL: '/wp-abilities/v1/abilities',
		baseURLParams: { context: 'edit' },
		plural: 'abilities',
		label: __( 'Abilities' ),
		supportsPagination: true,
	},
	{
		name: ENTITY_NAME_CATEGORIES,
		kind: ENTITY_KIND,
		key: 'slug',
		baseURL: '/wp-abilities/v1/categories',
		baseURLParams: { context: 'edit' },
		plural: 'ability-categories',
		label: __( 'Ability Categories' ),
		supportsPagination: true,
	},
] );
