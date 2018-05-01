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
import modelsConfig from './models';

const modelResolvers = modelsConfig.reduce( ( memo, { kind, name } ) => {
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix = upperFirst( camelCase( name ) );
	return {
		...memo,
		[ `get${ kindPrefix }${ nameSuffix }` ]: ( state, primaryKey ) => resolvers.getModelRecord( state, kind, name, primaryKey ),
	};
}, {} );

const modelSelectors = modelsConfig.reduce( ( memo, { kind, name } ) => {
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix = upperFirst( camelCase( name ) );
	return {
		...memo,
		[ `get${ kindPrefix }${ nameSuffix }` ]: ( state, primaryKey ) => selectors.getModelRecord( state, kind, name, primaryKey ),
	};
}, {} );

const store = registerStore( 'core', {
	reducer,
	actions,
	selectors: { ...selectors, ...modelSelectors },
	resolvers: { ...resolvers, ...modelResolvers },
} );

export default store;
