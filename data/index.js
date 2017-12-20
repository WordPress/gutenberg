/**
 * External dependencies
 */
import { createStore, combineReducers } from 'redux';
import { flowRight, merge } from 'lodash';
import { ApolloLink, Observable, execute as executeLink } from 'apollo-link';
import { execute } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';

/**
 * Internal dependencies
 */
import createQueryHigherOrderComponent from './query';

/**
 * Module constants
 */
const reducers = {};
const enhancers = [];
if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
	enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
}

const initialReducer = () => ( {} );
const store = createStore( initialReducer, {}, flowRight( enhancers ) );

/**
 * Registers a new sub reducer to the global state
 *
 * @param {String} key     Reducer key
 * @param {Object} reducer Reducer function
 */
export function registerReducer( key, reducer ) {
	reducers[ key ] = reducer;
	store.replaceReducer( combineReducers( reducers ) );
}

export const subscribe = store.subscribe;

export const dispatch = store.dispatch;

export const getState = store.getState;

const schemas = [ `
	type Query {
		hello: String
	}
` ];

const resolvers = [ {
	Query: { hello: () => 'dolly' },
} ];

let schema = makeExecutableSchema( {
	typeDefs: schemas[ 0 ],
	resolvers: resolvers[ 0 ],
} );

/**
 * Registers a sub GraphQL schema
 *
 * @param {String} registeredSchema    The GraphQL schema to register
 * @param {Object} registeredResolver  The GraphQL resolver to register for this schema
 */
export function registerSchema( registeredSchema, registeredResolver ) {
	schemas.push( registeredSchema );
	resolvers.push( registeredResolver );
	schema = makeExecutableSchema( {
		typeDefs: schemas,
		resolvers: merge( ...resolvers ),
	} );
}

const graphLink = new ApolloLink( ( operation ) => {
	return new Observable( observer => {
		return store.subscribe( () => {
			const result = execute(
				schema,
				operation.query,
				null,
				{ state: store.getState() },
				operation.variables,
				operation.operationName
			);
			if ( result.data || result.errors ) {
				observer.next( result );
			} else {
				result.then( observer.next.bind( observer ) );
			}
		} );
	} );
} );

const client = {
	query: ( operation ) => {
		return executeLink( graphLink, operation );
	},
};

export const query = createQueryHigherOrderComponent( client );
