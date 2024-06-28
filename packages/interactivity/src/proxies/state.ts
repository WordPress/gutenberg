/**
 * External dependencies
 */
import { signal, type Signal } from '@preact/signals';

/**
 * Internal dependencies
 */
import { getProxy, shouldProxy } from './registry';
import { PropSignal } from './signals';

const proxyToProps: WeakMap<
	object,
	Map< string, PropSignal >
> = new WeakMap();

const objToIterable = new WeakMap< object, Signal< number > >();
const descriptor = Object.getOwnPropertyDescriptor;

const stateHandlers: ProxyHandler< object > = {
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
			prop.setGetter( getter );
		} else {
			const value = Reflect.get( target, key, receiver );
			prop.setValue(
				shouldProxy( value )
					? getStateProxy( value, prop.namespace )
					: value
			);
		}

		return prop.getComputed().value;
	},

	defineProperty(
		target: object,
		key: string,
		desc: PropertyDescriptor
	): boolean {
		const isNew = ! ( key in target );
		const result = Reflect.defineProperty( target, key, desc );

		if ( result ) {
			const prop = getPropSignal( getProxy( target ), key );
			const { get, value } = desc;
			if ( get ) {
				prop.setGetter( desc.get! );
			} else {
				prop.setValue(
					shouldProxy( value )
						? getStateProxy( value, prop.namespace )
						: value
				);
			}

			if ( isNew && objToIterable.has( target ) ) {
				objToIterable.get( target )!.value++;
			}

			if ( Array.isArray( target ) ) {
				const receiver = getProxy( target );
				const length = getPropSignal( receiver, 'length' );
				length.setValue( target.length );
			}
		}

		return result;
	},

	deleteProperty( target: object, key: string ): boolean {
		const result = Reflect.deleteProperty( target, key );

		if ( result ) {
			const prop = getPropSignal( getProxy( target ), key );
			prop.setValue( undefined );

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

export const getStateProxy = < T extends object >(
	obj: T,
	namespace: string
) => getProxy( obj, stateHandlers, namespace );

export const peek = ( obj: object, key: string ): unknown => {
	const prop = getPropSignal( obj, key );
	// TODO: it currently returns the value of the internal `valueSignal`,
	// getters are not considered yet.
	return prop.peekValueSignal();
};

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
