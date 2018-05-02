/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import * as resolvers from './resolvers';
import { default as entities, getMethodName } from './entities';

const entityResolvers = entities.reduce( ( memo, { kind, name } ) => {
	const methodName = getMethodName( kind, name );
	return {
		...memo,
		[ methodName ]: ( state, key ) => resolvers.getEntityRecord( state, kind, name, key ),
	};
}, {} );

const entitySelectors = entities.reduce( ( memo, { kind, name } ) => {
	const methodName = getMethodName( kind, name );
	return {
		...memo,
		[ methodName ]: ( state, key ) => selectors.getEntityRecord( state, kind, name, key ),
	};
}, {} );

const store = registerStore( 'core', {
	reducer,
	actions,
	selectors: { ...selectors, ...entitySelectors },
	resolvers: { ...resolvers, ...entityResolvers },
} );

export default store;
