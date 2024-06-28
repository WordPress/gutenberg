/**
 * Internal dependencies
 */
import { stateHandlers, storeHandlers } from './handlers';
import { PropSignal } from './signals';

const objToProxy = new WeakMap< object, object >();
const proxyToNs = new WeakMap< object, string >();
const ignore = new WeakSet< object >();

const supported = new Set( [ Object, Array ] );

const proxyToProps: WeakMap<
	object,
	Map< string, PropSignal >
> = new WeakMap();

export const getPropSignal = ( proxy: object, key: string ) => {
	if ( ! proxyToProps.has( proxy ) ) {
		proxyToProps.set( proxy, new Map() );
	}
	const props = proxyToProps.get( proxy )!;
	if ( ! props.has( key ) ) {
		props.set( key, new PropSignal( proxy ) );
	}
	return props.get( key )!;
};

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

export const getProxyNs = ( proxy: object ): string => proxyToNs.get( proxy )!;
export const getProxy = < T extends object >( obj: T ) =>
	objToProxy.get( obj ) as T;

export const shouldProxy = ( val: any ): val is Object | Array< unknown > => {
	if ( typeof val !== 'object' || val === null ) {
		return false;
	}
	return ! ignore.has( val ) && supported.has( val.constructor );
};

export const getStateProxy = < T extends object >(
	obj: T,
	namespace: string
) => proxify( obj, stateHandlers, namespace );

export const getStoreProxy = < T extends object >(
	obj: T,
	namespace: string
) => proxify( obj, storeHandlers, namespace );

export const peek = ( obj: object, key: string ): unknown => {
	const prop = getPropSignal( obj, key );
	// TODO: what about the scope?
	return prop.getComputed().peek();
};
