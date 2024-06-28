/**
 * Internal dependencies
 */
import { getProxy, getProxyNs, shouldProxy } from './registry';
import { setNamespace, resetNamespace } from '../hooks';
import { stores } from '../store';
import { withScope } from '../utils';

const isObject = ( item: unknown ): item is Record< string, unknown > =>
	Boolean( item && typeof item === 'object' && item.constructor === Object );

const storeHandlers: ProxyHandler< object > = {
	get: ( target: any, key: string | symbol, receiver: any ) => {
		const result = Reflect.get( target, key );
		const ns = getProxyNs( receiver );

		// Check if the proxy is the store root and no key with that name exist. In
		// that case, return an empty object for the requested key.
		if ( typeof result === 'undefined' && receiver === stores.get( ns ) ) {
			const obj = {};
			Reflect.set( target, key, obj );
			return getStoreProxy( obj, ns );
		}

		// Check if the property is a function. If it is, add the store
		// namespace to the stack and wrap the function with the current scope.
		// The `withScope` util handles both synchronous functions and generator
		// functions.
		if ( typeof result === 'function' ) {
			setNamespace( ns );
			const scoped = withScope( result );
			resetNamespace();
			return scoped;
		}

		// Check if the property is an object. If it is, proxyify it.
		if ( isObject( result ) && shouldProxy( result ) ) {
			return getStoreProxy( result, ns );
		}

		return result;
	},
};

export const getStoreProxy = < T extends object >(
	obj: T,
	namespace: string
) => getProxy( obj, storeHandlers, namespace );
