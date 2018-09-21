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

const createEntityRecordResolver = ( source ) => defaultEntities.reduce( ( result, entity ) => {
	const { kind, name } = entity;
	result[ getMethodName( kind, name ) ] = ( key ) => source.getEntityRecord( kind, name, key );
	result[ getMethodName( kind, name, 'get', true ) ] = ( ...args ) => source.getEntityRecords( kind, name, ...args );
	return result;
}, {} );

const entityResolvers = createEntityRecordResolver( resolvers );
const entitySelectors = createEntityRecordSelector( selectors );

const store = registerStore( REDUCER_KEY, {
	reducer,
	actions,
	controls,
	selectors: { ...selectors, ...entitySelectors },
	resolvers: { ...resolvers, ...entityResolvers },
} );

export default store;
