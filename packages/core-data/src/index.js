/**
 * External dependencies
 */
import { pick } from 'lodash';

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

const createEntityRecordSelector = ( source ) => defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name ) ] = ( state, key ) => source.getEntityRecord( state, kind, name, key );
	result[ getMethodName( kind, name, 'get', true ) ] = ( state, ...args ) => source.getEntityRecords( state, kind, name, ...args );
	return result;
}, {} );

const createEntityRecordAction = ( source ) => defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name ) ] = ( key ) => source.getEntityRecord( kind, name, key );
	result[ getMethodName( kind, name, 'get', true ) ] = ( ...args ) => source.getEntityRecords( kind, name, ...args );
	return result;
}, {} );

const createEntityRecordResolver = ( source ) => defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name ) ] = ( key ) => source.getEntityRecord( kind, name, key );
	const pluralMethodName = getMethodName( kind, name, 'get', true );
	result[ pluralMethodName ] = ( ...args ) => source.getEntityRecords( kind, name, ...args );
	result[ pluralMethodName ].shouldInvalidate = ( action, ...args ) => source.getEntityRecords.shouldInvalidate( action, kind, name, ...args );
	return result;
}, {} );

const entityActions = createEntityRecordAction(
	pick( actions, [ 'saveEntityRecord' ] )
);
const entityResolvers = createEntityRecordResolver( resolvers );
const entitySelectors = createEntityRecordSelector( selectors );

const store = registerStore( REDUCER_KEY, {
	reducer,
	controls,
	actions: { ...actions, ...entityActions },
	selectors: { ...selectors, ...entitySelectors },
	resolvers: { ...resolvers, ...entityResolvers },
} );

export default store;
