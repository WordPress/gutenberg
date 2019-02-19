/**
 * WordPress dependencies
 */
import { default as triggerFetch } from '@wordpress/api-fetch';
import { createRegistryControl } from '@wordpress/data';

export function apiFetch( request ) {
	return {
		type: 'API_FETCH',
		request,
	};
}

export function select( storeKey, selectorName, ...args ) {
	return {
		type: 'SELECT',
		storeKey,
		selectorName,
		args,
	};
}

export function resolveSelect( storeKey, selectorName, ...args ) {
	return {
		type: 'RESOLVE_SELECT',
		storeKey,
		selectorName,
		args,
	};
}

export function dispatch( storeKey, actionName, ...args ) {
	return {
		type: 'DISPATCH',
		storeKey,
		actionName,
		args,
	};
}

export default {
	API_FETCH( { request } ) {
		return triggerFetch( request );
	},
	SELECT: createRegistryControl(
		( registry ) => ( { storeKey, selectorName, args } ) => {
			return registry.select( storeKey )[ selectorName ]( ...args );
		}
	),
	DISPATCH: createRegistryControl(
		( registry ) => ( { storeKey, actionName, args } ) => {
			return registry.dispatch( storeKey )[ actionName ]( ...args );
		}
	),
	RESOLVE_SELECT: createRegistryControl(
		( registry ) => ( { storeKey, selectorName, args } ) => {
			return new Promise( ( resolve ) => {
				const hasFinished = () => registry.select( 'core/data' )
					.hasFinishedResolution( storeKey, selectorName, args );
				const getResult = () => registry.select( storeKey )[ selectorName ]
					.apply( null, args );

				// trigger the selector (to trigger the resolver)
				const result = getResult();
				if ( hasFinished() ) {
					return resolve( result );
				}

				const unsubscribe = registry.subscribe( () => {
					if ( hasFinished() ) {
						unsubscribe();
						resolve( getResult() );
					}
				} );
			} );
		}
	),
};
