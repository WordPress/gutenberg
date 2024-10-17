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

const readOnlyProxies = new WeakSet();

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
				const readOnly = readOnlyProxies.has( proxy );
				prop.setValue(
					shouldProxy( value )
						? proxifyState( ns, value, { readOnly } )
						: value
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
		if ( readOnlyProxies.has( receiver ) ) {
			return false;
		}
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
		if ( readOnlyProxies.has( getProxyFromObject( target )! ) ) {
			return false;
		}

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
		if ( readOnlyProxies.has( getProxyFromObject( target )! ) ) {
			return false;
		}

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
 * @param namespace        The namespace that will be associated to this proxy.
 * @param obj              The object to proxify.
 * @param options          Options.
 * @param options.readOnly Read-only.
 *
 * @throws Error if the object cannot be proxified. Use {@link shouldProxy} to
 *         check if a proxy can be created for a specific object.
 *
 * @return The associated proxy.
 */
export const proxifyState = < T extends object >(
	namespace: string,
	obj: T,
	options?: { readOnly?: boolean }
): T => {
	const proxy = createProxy( namespace, obj, stateHandlers ) as T;
	if ( options?.readOnly ) {
		readOnlyProxies.add( proxy );
	}
	return proxy;
};

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
	// If target is not a plain object and the source is, we don't need to merge
	// them because the source will be used as the new value of the target.
	if ( ! ( isPlainObject( target ) && isPlainObject( source ) ) ) {
		return;
	}

	let hasNewKeys = false;

	for ( const key in source ) {
		const isNew = ! ( key in target );
		hasNewKeys = hasNewKeys || isNew;

		const desc = Object.getOwnPropertyDescriptor( source, key )!;
		const proxy = getProxyFromObject( target );
		const propSignal =
			!! proxy &&
			hasPropSignal( proxy, key ) &&
			getPropSignal( proxy, key );

		// Handle getters and setters
		if (
			typeof desc.get === 'function' ||
			typeof desc.set === 'function'
		) {
			if ( override || isNew ) {
				// Because we are setting a getter or setter, we need to use
				// Object.defineProperty to define the property on the target object.
				Object.defineProperty( target, key, {
					...desc,
					configurable: true,
					enumerable: true,
				} );
				// Update the getter in the property signal if it exists
				if ( desc.get && propSignal ) {
					propSignal.setGetter( desc.get );
				}
			}

			// Handle nested objects
		} else if ( isPlainObject( source[ key ] ) ) {
			if ( isNew || ( override && ! isPlainObject( target[ key ] ) ) ) {
				// Create a new object if the property is new or needs to be overridden
				target[ key ] = {};
				if ( propSignal ) {
					// Create a new proxified state for the nested object
					const ns = getNamespaceFromProxy( proxy );
					propSignal.setValue(
						proxifyState( ns, target[ key ] as Object )
					);
				}
			}
			// Both target and source are plain objects, merge them recursively
			if ( isPlainObject( target[ key ] ) ) {
				deepMergeRecursive( target[ key ], source[ key ], override );
			}

			// Handle primitive values and non-plain objects
		} else if ( override || isNew ) {
			Object.defineProperty( target, key, desc );
			if ( propSignal ) {
				const { value } = desc;
				const ns = getNamespaceFromProxy( proxy );
				// Proxify the value if necessary before setting it in the signal
				propSignal.setValue(
					shouldProxy( value ) ? proxifyState( ns, value ) : value
				);
			}
		}
	}

	if ( hasNewKeys && objToIterable.has( target ) ) {
		objToIterable.get( target )!.value++;
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
