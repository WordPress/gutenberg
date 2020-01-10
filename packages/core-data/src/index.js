/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import controls from './controls';
import * as selectors from './selectors';
import * as actions from './actions';
import * as resolvers from './resolvers';
import { defaultEntities, getMethodName } from './entities';
import { REDUCER_KEY } from './name';

// The entity selectors/resolvers and actions are shortcuts to their generic equivalents
// (getEntityRecord, getEntityRecords, updateEntityRecord, updateEntityRecordss)
// Instead of getEntityRecord, the consumer could use more user-frieldly named selector: getPostType, getTaxonomy...
// The "kind" and the "name" of the entity are combined to generate these shortcuts.

const entitySelectors = defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name ) ] = ( state, key ) => selectors.getEntityRecord( state, kind, name, key );
	result[ getMethodName( kind, name, 'get', true ) ] = ( state, ...args ) => selectors.getEntityRecords( state, kind, name, ...args );
	return result;
}, {} );

const entityResolvers = defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name ) ] = ( key ) => resolvers.getEntityRecord( kind, name, key );
	const pluralMethodName = getMethodName( kind, name, 'get', true );
	result[ pluralMethodName ] = ( ...args ) => resolvers.getEntityRecords( kind, name, ...args );
	result[ pluralMethodName ].shouldInvalidate = ( action, ...args ) => resolvers.getEntityRecords.shouldInvalidate( action, kind, name, ...args );
	return result;
}, {} );

const entityActions = defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name, 'save' ) ] = ( key ) => actions.saveEntityRecord( kind, name, key );
	return result;
}, {} );

registerStore( REDUCER_KEY, {
	reducer,
	controls,
	actions: { ...actions, ...entityActions },
	selectors: { ...selectors, ...entitySelectors },
	resolvers: { ...resolvers, ...entityResolvers },
} );

export { default as EntityProvider } from './entity-provider';
export * from './entity-provider';
