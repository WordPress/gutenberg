const objToProxy = new WeakMap< object, object >();
const proxyToNs = new WeakMap< object, string >();
const ignore = new WeakSet< object >();

export const proxify = < T extends object >(
	obj: T,
	handlers: ProxyHandler< T >,
	namespace: string
): T => {
	if ( ! objToProxy.has( obj ) ) {
		const proxy = new Proxy( obj, handlers );
		ignore.add( proxy );
		objToProxy.set( obj, proxy );
		proxyToNs.set( proxy, namespace );
	}
	return objToProxy.get( obj ) as T;
};

export const getProxyNs = ( proxy: object ) => proxyToNs.get( proxy );
export const getProxy = < T extends object >( obj: T ) =>
	objToProxy.get( obj ) as T;

export const shouldProxy = ( val: any ): val is Object | Array< unknown > => {
	if ( typeof val !== 'object' || val === null ) {
		return false;
	}
	return ! ignore.has( val ) && supported.has( val.constructor );
};

const supported = new Set( [ Object, Array ] );
