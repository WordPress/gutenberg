/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
import { controls } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import * as resolvers from './resolvers';
import * as locksSelectors from './locks/selectors';
import * as locksActions from './locks/actions';
import customControls from './controls';
import { defaultEntities, getMethodName } from './entities';
import { STORE_NAME } from './name';

// The entity selectors/resolvers and actions are shortcuts to their generic equivalents
// (getEntityRecord, getEntityRecords, updateEntityRecord, updateEntityRecordss)
// Instead of getEntityRecord, the consumer could use more user-frieldly named selector: getPostType, getTaxonomy...
// The "kind" and the "name" of the entity are combined to generate these shortcuts.

const entitySelectors = defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name ) ] = ( state, key ) =>
		selectors.getEntityRecord( state, kind, name, key );
	result[ getMethodName( kind, name, 'get', true ) ] = ( state, ...args ) =>
		selectors.getEntityRecords( state, kind, name, ...args );
	return result;
}, {} );

const entityResolvers = defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name ) ] = ( key ) =>
		resolvers.getEntityRecord( kind, name, key );
	const pluralMethodName = getMethodName( kind, name, 'get', true );
	result[ pluralMethodName ] = ( ...args ) =>
		resolvers.getEntityRecords( kind, name, ...args );
	result[ pluralMethodName ].shouldInvalidate = ( action, ...args ) =>
		resolvers.getEntityRecords.shouldInvalidate(
			action,
			kind,
			name,
			...args
		);
	return result;
}, {} );

const entityActions = defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name, 'save' ) ] = ( key ) =>
		actions.saveEntityRecord( kind, name, key );
	result[ getMethodName( kind, name, 'delete' ) ] = ( key, query ) =>
		actions.deleteEntityRecord( kind, name, key, query );
	return result;
}, {} );

const storeConfig = {
	reducer,
	controls: { ...customControls, ...controls },
	actions: { ...actions, ...entityActions, ...locksActions },
	selectors: { ...selectors, ...entitySelectors, ...locksSelectors },
	resolvers: { ...resolvers, ...entityResolvers },
};

/**
 * Store definition for the code data namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( STORE_NAME, storeConfig );

register( store );

export { default as EntityProvider } from './entity-provider';
export * from './entity-provider';
export * from './fetch';
