/**
 * External dependencies
 */
import { signal } from '@preact/signals';

/**
 * Internal dependencies
 */
import { proxify, getProxyNs, shouldProxy } from './proxies';
import { getProperty } from './properties';
import { resetNamespace, setNamespace } from '../hooks';
import { withScope } from '../utils';

const descriptor = Object.getOwnPropertyDescriptor;
const objToIterable = new WeakMap();

export const stateHandlers: ProxyHandler< object > = {
	get( target: object, key: string, receiver: object ): any {
		const ns = getProxyNs( receiver );

		/*
		 * First, we get a reference of the property we want to access. The
		 * property object is automatically instanciated if needed.
		 */
		const prop = getProperty( target, key );

		/*
		 * When the value is a getter, it updates the internal getter value.
		 * This change triggers the signal only when the getter value changes.
		 */
		const getter = descriptor( target, key )?.get;
		if ( getter && ns ) {
			prop.updateGetter( getter );
			setNamespace( ns );
			const result = prop.accessor( withScope ).value;
			resetNamespace();
			return result;
		}

		/*
		 * When it is not a getter, we get the actual value an apply different
		 * logic depending on the type of value. As before, the internal signal
		 * is updated, which only triggers a re-render when the value changes.
		 */
		const value = Reflect.get( target, key, receiver );
		prop.updateSignal(
			shouldProxy( value ) && ns
				? proxify( value, stateHandlers, ns )
				: value
		);

		return prop.accessor().value;
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

		const ns = getProxyNs( receiver );
		if ( shouldProxy( value ) && ns ) {
			value = proxify( value, stateHandlers, ns );
		}

		const result = Reflect.set( target, key, value, receiver );

		if ( result ) {
			const isNew = ! ( key in target );

			if ( isNew && objToIterable.has( target ) ) {
				objToIterable.get( target ).value++;
			}

			if ( Array.isArray( target ) ) {
				const length = getProperty( target, 'length' );
				length.updateSignal( target.length );
			}
		}

		return result;
	},

	defineProperty(
		target: object,
		key: string,
		desc: PropertyDescriptor
	): boolean {
		const prop = getProperty( target, key );
		const result = Reflect.defineProperty( target, key, desc );

		if ( result ) {
			if ( desc.get ) {
				prop.updateGetter( desc.get );
			} else if ( desc.value ) {
				prop.updateSignal( desc.value );
			}
		}
		return result;
	},

	deleteProperty( target: object, key: string ): boolean {
		const result = Reflect.deleteProperty( target, key );

		if ( result ) {
			const prop = getProperty( target, key );
			prop.updateSignal( undefined );

			if ( objToIterable.has( target ) ) {
				objToIterable.get( target ).value++;
			}
		}

		return result;
	},

	ownKeys( target: object ): ( string | symbol )[] {
		if ( ! objToIterable.has( target ) ) {
			objToIterable.set( target, signal( 0 ) );
		}
		( objToIterable as any )._ = objToIterable.get( target ).value;
		return Reflect.ownKeys( target );
	},
};
