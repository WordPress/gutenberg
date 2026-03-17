/**
 * Proxies for each object.
 */
const objToProxy = new WeakMap< object, object >();
const proxyToObj = new WeakMap< object, object >();

/**
 * Namespaces for each created proxy.
 */
const proxyToNs = new WeakMap< object, string >();

/**
 * Object types that can be proxied.
 */
const supported = new Set( [ Object, Array ] );

/**
 * Returns a proxy to the passed object with the given handlers, assigning the
 * specified namespace to it. If a proxy for the passed object was created
 * before, that proxy is returned.
 *
 * @param namespace The namespace that will be associated to this proxy.
 * @param obj       The object to proxify.
 * @param handlers  Handlers that the proxy will use.
 *
 * @throws Error if the object cannot be proxified. Use {@link shouldProxy} to
 *         check if a proxy can be created for a specific object.
 *
 * @return The created proxy.
 */
export const createProxy = < T extends object >(
	namespace: string,
	obj: T,
	handlers: ProxyHandler< T >
): T => {
	if ( ! shouldProxy( obj ) ) {
		throw Error( 'This object cannot be proxified.' );
	}
	if ( ! objToProxy.has( obj ) ) {
		const proxy = new Proxy( obj, handlers );
		objToProxy.set( obj, proxy );
		proxyToObj.set( proxy, obj );
		proxyToNs.set( proxy, namespace );
	}
	return objToProxy.get( obj ) as T;
};

/**
 * Returns the proxy for the given object. If there is no associated proxy, the
 * function returns `undefined`.
 *
 * @param obj Object from which to know the proxy.
 * @return Associated proxy or `undefined`.
 */
export const getProxyFromObject = < T extends object >(
	obj: T
): T | undefined => objToProxy.get( obj ) as T;

/**
 * Gets the namespace associated with the given proxy.
 *
 * Proxies have a namespace assigned upon creation. See {@link createProxy}.
 *
 * @param proxy Proxy.
 * @return Namespace.
 */
export const getNamespaceFromProxy = ( proxy: object ): string =>
	proxyToNs.get( proxy )!;

/**
 * Checks if a given object can be proxied.
 *
 * @param candidate Object to know whether it can be proxied.
 * @return True if the passed instance can be proxied.
 */
export const shouldProxy = (
	candidate: any
): candidate is Object | Array< unknown > => {
	if ( typeof candidate !== 'object' || candidate === null ) {
		return false;
	}
	return (
		! proxyToNs.has( candidate ) && supported.has( candidate.constructor )
	);
};

/**
 * Returns the target object for the passed proxy. If the passed object is not a registered proxy, the
 * function returns `undefined`.
 *
 * @param proxy Proxy from which to know the target.
 * @return The target object or `undefined`.
 */
export const getObjectFromProxy = < T extends object >(
	proxy: T
): T | undefined => proxyToObj.get( proxy ) as T;
