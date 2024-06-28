/**
 * External dependencies
 */
import { signal, type Signal } from '@preact/signals';

/**
 * Internal dependencies
 */
import { proxify, getProxy, getProxyNs, shouldProxy, getPropSignal } from './';
import { withScope } from '../utils';
import { setNamespace, resetNamespace } from '../hooks';
import { stores } from '../store';

const objToIterable = new WeakMap< object, Signal< number > >();

const descriptor = Object.getOwnPropertyDescriptor;

const isObject = ( item: unknown ): item is Record< string, unknown > =>
	Boolean( item && typeof item === 'object' && item.constructor === Object );

export const stateHandlers: ProxyHandler< object > = {
	get( target: object, key: string, receiver: object ): any {
		/*
		 * First, we get a reference of the property we want to access. The
		 * property object is automatically instanciated if needed.
		 */
		const prop = getPropSignal( receiver, key );

		const getter = descriptor( target, key )?.get;

		/*
		 * When the value is a getter, it updates the internal getter value. If
		 * not, we get the actual value an wrap it with a proxy if needed.
		 *
		 * These updates only triggers a re-render when either the getter or the
		 * value has changed.
		 */
		if ( getter ) {
			prop.update( { get: getter } );
		} else {
			const value = Reflect.get( target, key, receiver );
			prop.update( {
				value: shouldProxy( value )
					? proxify( value, stateHandlers, prop.namespace )
					: value,
			} );
		}

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
				const length = getPropSignal( receiver, 'length' );
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
			const prop = getPropSignal( getProxy( target ), key );
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
			const prop = getPropSignal( getProxy( target ), key );
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
