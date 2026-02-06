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
import * as privateActions from './private-actions';
import * as resolvers from './resolvers';
import createLocksActions from './locks/actions';
import {
	rootEntitiesConfig,
	additionalEntityConfigLoaders,
	getMethodName,
} from './entities';
import { STORE_NAME } from './name';
import { unlock } from './lock-unlock';
import { dynamicActions, dynamicSelectors } from './dynamic-entities';
import logEntityDeprecation from './utils/log-entity-deprecation';

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

	const getEntityRecordMethodName = getMethodName( kind, name );
	result[ getEntityRecordMethodName ] = ( state, key, query ) => {
		logEntityDeprecation( kind, name, getEntityRecordMethodName, {
			isShorthandSelector: true,
			alternativeFunctionName: 'getEntityRecord',
		} );
		return selectors.getEntityRecord( state, kind, name, key, query );
	};

	if ( plural ) {
		const getEntityRecordsMethodName = getMethodName( kind, plural, 'get' );
		result[ getEntityRecordsMethodName ] = ( state, query ) => {
			logEntityDeprecation( kind, name, getEntityRecordsMethodName, {
				isShorthandSelector: true,
				alternativeFunctionName: 'getEntityRecords',
			} );
			return selectors.getEntityRecords( state, kind, name, query );
		};
	}
	return result;
}, {} );

const entityResolvers = entitiesConfig.reduce( ( result, entity ) => {
	const { kind, name, plural } = entity;
	const getEntityRecordMethodName = getMethodName( kind, name );
	result[ getEntityRecordMethodName ] = ( key, query ) => {
		logEntityDeprecation( kind, name, getEntityRecordMethodName, {
			isShorthandSelector: true,
			alternativeFunctionName: 'getEntityRecord',
		} );
		return resolvers.getEntityRecord( kind, name, key, query );
	};

	if ( plural ) {
		const getEntityRecordsMethodName = getMethodName( kind, plural, 'get' );
		result[ getEntityRecordsMethodName ] = ( ...args ) => {
			logEntityDeprecation( kind, plural, getEntityRecordsMethodName, {
				isShorthandSelector: true,
				alternativeFunctionName: 'getEntityRecords',
			} );
			return resolvers.getEntityRecords( kind, name, ...args );
		};
		result[ getEntityRecordsMethodName ].shouldInvalidate = ( action ) =>
			resolvers.getEntityRecords.shouldInvalidate( action, kind, name );
	}
	return result;
}, {} );

const entityActions = entitiesConfig.reduce( ( result, entity ) => {
	const { kind, name } = entity;

	const saveEntityRecordMethodName = getMethodName( kind, name, 'save' );
	result[ saveEntityRecordMethodName ] = ( record, options ) => {
		logEntityDeprecation( kind, name, saveEntityRecordMethodName, {
			isShorthandSelector: true,
			alternativeFunctionName: 'saveEntityRecord',
		} );
		return actions.saveEntityRecord( kind, name, record, options );
	};

	const deleteEntityRecordMethodName = getMethodName( kind, name, 'delete' );
	result[ deleteEntityRecordMethodName ] = ( key, query, options ) => {
		logEntityDeprecation( kind, name, deleteEntityRecordMethodName, {
			isShorthandSelector: true,
			alternativeFunctionName: 'deleteEntityRecord',
		} );
		return actions.deleteEntityRecord( kind, name, key, query, options );
	};

	return result;
}, {} );

const storeConfig = () => ( {
	reducer,
	actions: {
		...dynamicActions,
		...actions,
		...entityActions,
		...createLocksActions(),
	},
	selectors: {
		...dynamicSelectors,
		...selectors,
		...entitySelectors,
	},
	resolvers: { ...resolvers, ...entityResolvers },
} );

/**
 * Store definition for the code data namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore( STORE_NAME, storeConfig() );
unlock( store ).registerPrivateSelectors( privateSelectors );
unlock( store ).registerPrivateActions( privateActions );
register( store ); // Register store after unlocking private selectors to allow resolvers to use them.

export { default as EntityProvider } from './entity-provider';
export * from './entity-provider';
export * from './entity-types';
export * from './awareness/types';
export * from './fetch';
export * from './hooks';
export * from './private-apis';
