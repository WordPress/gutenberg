/**
 * External dependencies
 */
import { upperFirst, camelCase } from 'lodash';

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
import entities from './entities';

const entityResolvers = entities.reduce( ( memo, { kind, name } ) => {
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix = upperFirst( camelCase( name ) );
	return {
		...memo,
		[ `get${ kindPrefix }${ nameSuffix }` ]: ( state, key ) => resolvers.getEntityRecord( state, kind, name, key ),
	};
}, {} );

const entitySelectors = entities.reduce( ( memo, { kind, name } ) => {
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix = upperFirst( camelCase( name ) );
	return {
		...memo,
		[ `get${ kindPrefix }${ nameSuffix }` ]: ( state, key ) => selectors.getEntityRecord( state, kind, name, key ),
	};
}, {} );

const store = registerStore( 'core', {
	reducer,
	actions,
	selectors: { ...selectors, ...entitySelectors },
	resolvers: { ...resolvers, ...entityResolvers },
} );

export default store;
