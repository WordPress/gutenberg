/**
 * External dependencies
 */
import { signal, type Signal } from '@preact/signals';

/**
 * Internal dependencies
 */
import { proxify, getProxy, getProxyNs, shouldProxy } from './proxies';
import { PropSignal } from './signals';
import { withScope } from '../utils';
import { setNamespace, resetNamespace } from '../hooks';
import { stores } from '../store';

const proxyToProps: WeakMap<
	object,
	Map< string, PropSignal >
> = new WeakMap();
const objToIterable = new WeakMap< object, Signal< number > >();

const getPropSignal = ( target: object, key: string ) => {
	const proxy = getProxy( target );
	if ( ! proxyToProps.has( proxy ) ) {
		proxyToProps.set( proxy, new Map() );
	}
	const props = proxyToProps.get( proxy )!;
	if ( ! props.has( key ) ) {
		props.set( key, new PropSignal( proxy ) );
	}
	return props.get( key )!;
};

const descriptor = Object.getOwnPropertyDescriptor;

const isObject = ( item: unknown ): item is Record< string, unknown > =>
	Boolean( item && typeof item === 'object' && item.constructor === Object );

export const stateHandlers: ProxyHandler< object > = {
	get( target: object, key: string, receiver: object ): any {
		/*
		 * First, we get a reference of the property we want to access. The
		 * property object is automatically instanciated if needed.
		 */
		const prop = getPropSignal( target, key );

		/*
		 * When the value is a getter, it updates the internal getter value.
		 * This change triggers the signal only when the getter value changes.
		 */
		const getter = descriptor( target, key )?.get;
		if ( getter ) {
			prop.update( { get: getter } );
			const value = prop.getComputed( withScope ).value;
			return value;
		}

		/*
		 * When it is not a getter, we get the actual value an apply different
		 * logic depending on the type of value. As before, the internal signal
		 * is updated, which only triggers a re-render when the value changes.
		 */
		const value = Reflect.get( target, key, receiver );
		prop.update( {
			value: shouldProxy( value )
				? proxify( value, stateHandlers, prop.namespace )
				: value,
		} );

		return prop.getComputed().value;
	},

	set(
		target: object,
		key: string,
		value: unknown,
		receiver: object
	): boolean {
		if ( typeof descriptor( target, key )?.set === 'function' ) {
			return Reflect.set( target, key, value, receiver );
		}

		const isNew = ! ( key in target );
		const result = Reflect.set( target, key, value, receiver );

		if ( result ) {
			if ( isNew && objToIterable.has( target ) ) {
				objToIterable.get( target )!.value++;
			}

			if ( Array.isArray( target ) ) {
				const length = getPropSignal( target, 'length' );
				length.update( { value: target.length } );
			}
		}

		return result;
	},

	defineProperty(
		target: object,
		key: string,
		desc: PropertyDescriptor
	): boolean {
		const result = Reflect.defineProperty( target, key, desc );

		if ( result ) {
			const prop = getPropSignal( target, key );
			const { value, get } = desc;
			prop.update( {
				value: shouldProxy( value )
					? proxify( value, stateHandlers, prop.namespace )
					: value,
				get,
			} );
		}
		return result;
	},

	deleteProperty( target: object, key: string ): boolean {
		const result = Reflect.deleteProperty( target, key );

		if ( result ) {
			const prop = getPropSignal( target, key );
			prop.update( {} );

			if ( objToIterable.has( target ) ) {
				objToIterable.get( target )!.value++;
			}
		}

		return result;
	},

	ownKeys( target: object ): ( string | symbol )[] {
		if ( ! objToIterable.has( target ) ) {
			objToIterable.set( target, signal( 0 ) );
		}
		( objToIterable as any )._ = objToIterable.get( target )!.value;
		return Reflect.ownKeys( target );
	},
};

export const storeHandlers: ProxyHandler< object > = {
	get: ( target: any, key: string | symbol, receiver: any ) => {
		const result = Reflect.get( target, key );
		const ns = getProxyNs( receiver );

		// Check if the proxy is the store root and no key with that name exist. In
		// that case, return an empty object for the requested key.
		if ( typeof result === 'undefined' && receiver === stores.get( ns ) ) {
			const obj = {};
			Reflect.set( target, key, obj );
			return proxify( obj, storeHandlers, ns );
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
			return proxify( result, storeHandlers, ns );
		}

		return result;
	},
};
