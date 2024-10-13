/**
 * Internal dependencies
 */
import { createProxy, getNamespaceFromProxy, shouldProxy } from './registry';
/**
 * External dependencies
 */
import { setNamespace, resetNamespace } from '../namespaces';
import { withScope, isPlainObject } from '../utils';

/**
 * Identifies the store proxies handling the root objects of each store.
 */
const storeRoots = new WeakSet();

/**
 * Handlers for store proxies.
 */
const storeHandlers: ProxyHandler< object > = {
	get: ( target: any, key: string | symbol, receiver: any ) => {
		const result = Reflect.get( target, key );
		const ns = getNamespaceFromProxy( receiver );

		/*
		 * Check if the proxy is the store root and no key with that name exist. In
		 * that case, return an empty object for the requested key.
		 */
		if ( typeof result === 'undefined' && storeRoots.has( receiver ) ) {
			const obj = {};
			Reflect.set( target, key, obj );
			return proxifyStore( ns, obj, false );
		}

		/*
		 * Check if the property is a function. If it is, add the store
		 * namespace to the stack and wrap the function with the current scope.
		 * The `withScope` util handles both synchronous functions and generator
		 * functions.
		 */
		if ( typeof result === 'function' ) {
			setNamespace( ns );
			const scoped = withScope( result );
			resetNamespace();
			return scoped;
		}

		// Check if the property is an object. If it is, proxyify it.
		if ( isPlainObject( result ) && shouldProxy( result ) ) {
			return proxifyStore( ns, result, false );
		}

		return result;
	},
};

/**
 * Returns the proxy associated with the given store object, creating it if it
 * does not exist.
 *
 * @param namespace The namespace that will be associated to this proxy.
 * @param obj       The object to proxify.
 *
 * @param isRoot    Whether the passed object is the store root object.
 * @throws Error if the object cannot be proxified. Use {@link shouldProxy} to
 *         check if a proxy can be created for a specific object.
 *
 * @return The associated proxy.
 */
export const proxifyStore = < T extends object >(
	namespace: string,
	obj: T,
	isRoot = true
): T => {
	const proxy = createProxy( namespace, obj, storeHandlers );
	if ( proxy && isRoot ) {
		storeRoots.add( proxy );
	}
	return proxy as T;
};
