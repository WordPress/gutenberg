const objToProxy = new WeakMap< object, object >();
const proxyToNs = new WeakMap< object, string >();
const ignore = new WeakSet< object >();

const supported = new Set( [ Object, Array ] );

export const getProxy = < T extends object >(
	obj: T,
	handlers?: ProxyHandler< T >,
	namespace?: string
): T => {
	if ( ! objToProxy.has( obj ) && handlers && namespace ) {
		const proxy = new Proxy( obj, handlers );
		ignore.add( proxy );
		objToProxy.set( obj, proxy );
		proxyToNs.set( proxy, namespace );
	}
	return objToProxy.get( obj ) as T;
};

export const getProxyNs = ( proxy: object ): string => proxyToNs.get( proxy )!;

export const shouldProxy = ( val: any ): val is Object | Array< unknown > => {
	if ( typeof val !== 'object' || val === null ) {
		return false;
	}
	return ! ignore.has( val ) && supported.has( val.constructor );
};
