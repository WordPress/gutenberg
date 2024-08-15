/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as privateSelectors from './private-selectors';
import * as actions from './actions';
import * as resolvers from './resolvers';
import createLocksActions from './locks/actions';
import {
	rootEntitiesConfig,
	additionalEntityConfigLoaders,
	getMethodName,
} from './entities';
import { STORE_NAME } from './name';
import { unlock } from './lock-unlock';

// The entity selectors/resolvers and actions are shortcuts to their generic equivalents
// (getEntityRecord, getEntityRecords, updateEntityRecord, updateEntityRecords)
// Instead of getEntityRecord, the consumer could use more user-friendly named selector: getPostType, getTaxonomy...
// The "kind" and the "name" of the entity are combined to generate these shortcuts.
const entitiesConfig = [
	...rootEntitiesConfig,
	...additionalEntityConfigLoaders.filter( ( config ) => !! config.name ),
];

const entitySelectors = entitiesConfig.reduce( ( result, entity ) => {
	const { kind, name, plural } = entity;
	result[ getMethodName( kind, name ) ] = ( state, key, query ) =>
		selectors.getEntityRecord( state, kind, name, key, query );

	if ( plural ) {
		result[ getMethodName( kind, plural, 'get' ) ] = ( state, query ) =>
			selectors.getEntityRecords( state, kind, name, query );
	}
	return result;
}, {} );

const entityResolvers = entitiesConfig.reduce( ( result, entity ) => {
	const { kind, name, plural } = entity;
	result[ getMethodName( kind, name ) ] = ( key, query ) =>
		resolvers.getEntityRecord( kind, name, key, query );

	if ( plural ) {
		const pluralMethodName = getMethodName( kind, plural, 'get' );
		result[ pluralMethodName ] = ( ...args ) =>
			resolvers.getEntityRecords( kind, name, ...args );
		result[ pluralMethodName ].shouldInvalidate = ( action ) =>
			resolvers.getEntityRecords.shouldInvalidate( action, kind, name );
	}
	return result;
}, {} );

const entityActions = entitiesConfig.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name, 'save' ) ] = ( record, options ) =>
		actions.saveEntityRecord( kind, name, record, options );
	result[ getMethodName( kind, name, 'delete' ) ] = ( key, query, options ) =>
		actions.deleteEntityRecord( kind, name, key, query, options );
	return result;
}, {} );

const storeConfig = () => ( {
	reducer,
	actions: { ...actions, ...entityActions, ...createLocksActions() },
	selectors: { ...selectors, ...entitySelectors },
	resolvers: { ...resolvers, ...entityResolvers },
} );

/**
 * Store definition for the code data namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore( STORE_NAME, storeConfig() );
unlock( store ).registerPrivateSelectors( privateSelectors );
register( store ); // Register store after unlocking private selectors to allow resolvers to use them.

export { default as EntityProvider } from './entity-provider';
export * from './entity-provider';
export * from './entity-types';
export * from './fetch';
export * from './hooks';
export * from './private-apis';
