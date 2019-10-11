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

const entitySelectors = defaultEntities.reduce( ( resultAccumulator, entity ) => {
	const { kind, name } = entity;
	resultAccumulator[ getMethodName( kind, name ) ] = ( state, key ) => selectors.getEntityRecord( state, kind, name, key );
	resultAccumulator[ getMethodName( kind, name, 'get', true ) ] = ( state, ...args ) => selectors.getEntityRecords( state, kind, name, ...args );
	return resultAccumulator;
}, {} );

const entityResolvers = defaultEntities.reduce( ( resultAccumulator, entity ) => {
	const { kind, name } = entity;
	resultAccumulator[ getMethodName( kind, name ) ] = ( key ) => resolvers.getEntityRecord( kind, name, key );
	const pluralMethodName = getMethodName( kind, name, 'get', true );
	resultAccumulator[ pluralMethodName ] = ( ...args ) => resolvers.getEntityRecords( kind, name, ...args );
	resultAccumulator[ pluralMethodName ].shouldInvalidate = ( action, ...args ) => resolvers.getEntityRecords.shouldInvalidate( action, kind, name, ...args );
	return resultAccumulator;
}, {} );

const entityActions = defaultEntities.reduce( ( resultAccumulator, entity ) => {
	const { kind, name } = entity;
	resultAccumulator[ getMethodName( kind, name, 'save' ) ] = ( key ) => actions.saveEntityRecord( kind, name, key );
	return resultAccumulator;
}, {} );

registerStore( REDUCER_KEY, {
	reducer,
	controls,
	actions: { ...actions, ...entityActions },
	selectors: { ...selectors, ...entitySelectors },
	resolvers: { ...resolvers, ...entityResolvers },
} );

export { default as EntityProvider, useEntityProp } from './entity-provider';
