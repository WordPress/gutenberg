/**
 * External dependencies
 */
import { signal, type Signal } from '@preact/signals';

/**
 * Internal dependencies
 */
import { createProxy, getProxy, getProxyNs, shouldProxy } from './registry';
import { PropSignal } from './signals';
import { setNamespace, resetNamespace } from '../namespaces';

/**
 * Set of built-in symbols.
 */
const wellKnownSymbols = new Set(
	Object.getOwnPropertyNames( Symbol )
		.map( ( key ) => Symbol[ key ] )
		.filter( ( value ) => typeof value === 'symbol' )
);

/**
 * Relates each proxy with a map of {@link PropSignal} instances, representing
 * the proxy's accessed properties.
 */
const proxyToProps: WeakMap<
	object,
	Map< string | symbol, PropSignal >
> = new WeakMap();

/**
 * Returns the {@link PropSignal | `PropSignal`} instance associated with the
 * specified prop in the passed proxy.
 *
 * The `PropSignal` instance is generated if it doesn't exist yet, using the
 * `initial` parameter to initialize the internal signals.
 *
 * @param proxy   Proxy of a state object or array.
 * @param key     The property key.
 * @param initial Initial data for the `PropSignal` instance.
 * @return The `PropSignal` instance.
 */
const getPropSignal = (
	proxy: object,
	key: string | number | symbol,
	initial?: PropertyDescriptor
) => {
	if ( ! proxyToProps.has( proxy ) ) {
		proxyToProps.set( proxy, new Map() );
	}
	key = typeof key === 'number' ? `${ key }` : key;
	const props = proxyToProps.get( proxy )!;
	if ( ! props.has( key ) ) {
		const ns = getProxyNs( proxy );
		const prop = new PropSignal( proxy );
		props.set( key, prop );
		if ( initial ) {
			const { get, value } = initial;
			if ( get ) {
				prop.setGetter( get );
			} else {
				prop.setValue(
					shouldProxy( value ) ? proxifyState( ns, value ) : value
				);
			}
		}
	}
	return props.get( key )!;
};

/**
 * Relates each proxied object (i.e., the original object) with a signal that
 * tracks changes in the number of properties.
 */
const objToIterable = new WeakMap< object, Signal< number > >();

/**
 * When this flag is `true`, it avoids any signal subscription, overriding state
 * props' "reactive" behavior.
 */
let peeking = false;

/**
 * Handlers for reactive objects and arrays in the state.
 */
const stateHandlers: ProxyHandler< object > = {
	get( target: object, key: string | symbol, receiver: object ): any {
		/*
		 * The property should not be reactive for the following cases:
		 * 1. While using the `peek` function to read the property.
		 * 2. The property exists but comes from the Object or Array prototypes.
		 * 3. The property key is a known symbol.
		 */
		if (
			peeking ||
			( ! target.hasOwnProperty( key ) && key in target ) ||
			( typeof key === 'symbol' && wellKnownSymbols.has( key ) )
		) {
			return Reflect.get( target, key, receiver );
		}

		// At this point, the property should be reactive.
		const desc = Object.getOwnPropertyDescriptor( target, key );
		const prop = getPropSignal( receiver, key, desc );

		if ( peeking ) {
			return prop.getComputed().peek();
		}

		const result = prop.getComputed().value;

		/*
		 * Check if the property is a synchronous function. If it is, set the
		 * default namespace. Synchronous functions always run in the proper scope,
		 * which is set by the Directives component.
		 */
		if ( typeof result === 'function' ) {
			const ns = getProxyNs( receiver );
			return ( ...args: unknown[] ) => {
				setNamespace( ns );
				try {
					return result.call( receiver, ...args );
				} finally {
					resetNamespace();
				}
			};
		}

		return result;
	},

	set(
		target: object,
		key: string,
		value: unknown,
		receiver: object
	): boolean {
		setNamespace( getProxyNs( receiver ) );
		try {
			return Reflect.set( target, key, value, receiver );
		} finally {
			resetNamespace();
		}
	},

	defineProperty(
		target: object,
		key: string,
		desc: PropertyDescriptor
	): boolean {
		const isNew = ! ( key in target );
		const result = Reflect.defineProperty( target, key, desc );

		if ( result ) {
			const receiver = getProxy( target );
			const prop = getPropSignal( receiver, key );
			const { get, value } = desc;
			if ( get ) {
				prop.setGetter( desc.get! );
			} else {
				const ns = getProxyNs( receiver );
				prop.setValue(
					shouldProxy( value ) ? proxifyState( ns, value ) : value
				);
			}

			if ( isNew && objToIterable.has( target ) ) {
				objToIterable.get( target )!.value++;
			}

			if ( Array.isArray( target ) ) {
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

/**
 * Returns the proxy associated with the given state object, creating it if it
 * does not exist.
 *
 * @param namespace The namespace that will be associated to this proxy.
 * @param obj       The object to proxify.
 *
 * @throws Error if the object cannot be proxified. Use {@link shouldProxy} to
 *         check if a proxy can be created for a specific object.
 *
 * @return The associated proxy.
 */
export const proxifyState = < T extends object >(
	namespace: string,
	obj: T
): T => createProxy( namespace, obj, stateHandlers ) as T;

/**
 * Reads the value of the specified property without subscribing to it.
 *
 * @param obj The object to read the property from.
 * @param key The property key.
 * @return The property value.
 */
export const peek = < T extends object, K extends keyof T >(
	obj: T,
	key: K
): T[ K ] => {
	peeking = true;
	try {
		return obj[ key ];
	} finally {
		peeking = false;
	}
};
