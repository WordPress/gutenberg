/**
 * External dependencies
 */
import { batch, signal, type Signal } from '@preact/signals';

/**
 * Internal dependencies
 */
import {
	createProxy,
	getProxyFromObject,
	getNamespaceFromProxy,
	shouldProxy,
	getObjectFromProxy,
} from './registry';
import { PropSignal } from './signals';
import { setNamespace, resetNamespace } from '../namespaces';
import { isPlainObject } from '../utils';

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
 *  Checks wether a {@link PropSignal | `PropSignal`} instance exists for the
 *  given property in the passed proxy.
 *
 * @param proxy Proxy of a state object or array.
 * @param key   The property key.
 * @return `true` when it exists; false otherwise.
 */
export const hasPropSignal = ( proxy: object, key: string ) =>
	proxyToProps.has( proxy ) && proxyToProps.get( proxy )!.has( key );

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
		const ns = getNamespaceFromProxy( proxy );
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
		const result = prop.getComputed().value;

		/*
		 * Check if the property is a synchronous function. If it is, set the
		 * default namespace. Synchronous functions always run in the proper scope,
		 * which is set by the Directives component.
		 */
		if ( typeof result === 'function' ) {
			const ns = getNamespaceFromProxy( receiver );
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
		setNamespace( getNamespaceFromProxy( receiver ) );
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
			const receiver = getProxyFromObject( target )!;
			const prop = getPropSignal( receiver, key );
			const { get, value } = desc;
			if ( get ) {
				prop.setGetter( get );
			} else {
				const ns = getNamespaceFromProxy( receiver );
				prop.setValue(
					shouldProxy( value ) ? proxifyState( ns, value ) : value
				);
			}

			if ( isNew && objToIterable.has( target ) ) {
				objToIterable.get( target )!.value++;
			}

			/*
			 * Modify the `length` property value only if the related
			 * `PropSignal` exists, which means that there are subscriptions to
			 * this property.
			 */
			if (
				Array.isArray( target ) &&
				proxyToProps.get( receiver )?.has( 'length' )
			) {
				const length = getPropSignal( receiver, 'length' );
				length.setValue( target.length );
			}
		}

		return result;
	},

	deleteProperty( target: object, key: string ): boolean {
		const result = Reflect.deleteProperty( target, key );

		if ( result ) {
			const prop = getPropSignal( getProxyFromObject( target )!, key );
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
		/*
		 *This subscribes to the signal while preventing the minifier from
		 * deleting this line in production.
		 */
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

/**
 * Internal recursive implementation for {@link deepMerge | `deepMerge`}.
 *
 * @param target   The target object.
 * @param source   The source object containing new values and props.
 * @param override Whether existing props should be overwritten or not (`true`
 *                 by default).
 */
const deepMergeRecursive = (
	target: any,
	source: any,
	override: boolean = true
) => {
	if ( isPlainObject( target ) && isPlainObject( source ) ) {
		let hasNewKeys = false;
		for ( const key in source ) {
			const isNew = ! ( key in target );
			hasNewKeys = hasNewKeys || isNew;

			const desc = Object.getOwnPropertyDescriptor( source, key );
			if (
				typeof desc?.get === 'function' ||
				typeof desc?.set === 'function'
			) {
				if ( override || isNew ) {
					Object.defineProperty( target, key, {
						...desc,
						configurable: true,
						enumerable: true,
					} );

					const proxy = getProxyFromObject( target );
					if ( desc?.get && proxy && hasPropSignal( proxy, key ) ) {
						const propSignal = getPropSignal( proxy, key );
						propSignal.setGetter( desc.get );
					}
				}
			} else if ( isPlainObject( source[ key ] ) ) {
				if ( isNew ) {
					target[ key ] = {};
				}

				deepMergeRecursive( target[ key ], source[ key ], override );
			} else if ( override || isNew ) {
				Object.defineProperty( target, key, desc! );

				const proxy = getProxyFromObject( target );
				if ( desc?.value && proxy && hasPropSignal( proxy, key ) ) {
					const propSignal = getPropSignal( proxy, key );
					propSignal.setValue( desc.value );
				}
			}
		}

		if ( hasNewKeys && objToIterable.has( target ) ) {
			objToIterable.get( target )!.value++;
		}
	}
};

/**
 * Recursively update prop values inside the passed `target` and nested plain
 * objects, using the values present in `source`. References to plain objects
 * are kept, only updating props containing primitives or arrays. Arrays are
 * replaced instead of merged or concatenated.
 *
 * If the `override` parameter is set to `false`, then all values in `target`
 * are preserved, and only new properties from `source` are added.
 *
 * @param target   The target object.
 * @param source   The source object containing new values and props.
 * @param override Whether existing props should be overwritten or not (`true`
 *                 by default).
 */
export const deepMerge = (
	target: any,
	source: any,
	override: boolean = true
) =>
	batch( () =>
		deepMergeRecursive(
			getObjectFromProxy( target ) || target,
			source,
			override
		)
	);
