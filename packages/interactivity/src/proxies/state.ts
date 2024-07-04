/**
 * External dependencies
 */
import { signal, type Signal } from '@preact/signals';

/**
 * Internal dependencies
 */
import { createProxy, getProxy, shouldProxy } from './registry';
import { PropSignal } from './signals';
import { setNamespace, resetNamespace } from '../hooks';

type WellKnownSymbols =
	| 'asyncIterator'
	| 'hasInstance'
	| 'isConcatSpreadable'
	| 'iterator'
	| 'match'
	| 'matchAll'
	| 'replace'
	| 'search'
	| 'species'
	| 'split'
	| 'toPrimitive'
	| 'toStringTag'
	| 'unscopables';

const proxyToProps: WeakMap<
	object,
	Map< string | symbol, PropSignal >
> = new WeakMap();

const objToIterable = new WeakMap< object, Signal< number > >();

const wellKnownSymbols = new Set(
	Object.getOwnPropertyNames( Symbol )
		.map( ( key ) => Symbol[ key as WellKnownSymbols ] )
		.filter( ( value ) => typeof value === 'symbol' )
);

const descriptor = Object.getOwnPropertyDescriptor;

let peeking = false;

const stateHandlers: ProxyHandler< object > = {
	get( target: object, key: string, receiver: object ): any {
		const desc = descriptor( target, key );

		/*
		 * If peeking, the property comes from the Object prototype, or the key
		 * is a well-known symbol, then it should not be processed.
		 */
		if (
			peeking ||
			( ! desc && key in Object.prototype ) ||
			( typeof key === 'symbol' && wellKnownSymbols.has( key ) )
		) {
			return Reflect.get( target, key, receiver );
		}

		/*
		 * First, we get a reference of the property we want to access. The
		 * property object is automatically instanciated if needed.
		 */
		const prop = getPropSignal( receiver, key );

		/*
		 * When the value is a getter, it updates the internal getter value. If
		 * not, we get the actual value an wrap it with a proxy if needed.
		 *
		 * These updates only triggers a re-render when either the getter or the
		 * value has changed.
		 */
		const getter = desc?.get;
		if ( getter ) {
			prop.setGetter( getter );
		} else {
			const value = Reflect.get( target, key, receiver );
			prop.setValue(
				shouldProxy( value )
					? proxifyState( prop.namespace, value )
					: value
			);
		}

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
			return ( ...args: unknown[] ) => {
				setNamespace( prop.namespace );
				try {
					return result.call( receiver, ...args );
				} finally {
					resetNamespace();
				}
			};
		}

		return result;
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
						? proxifyState( prop.namespace, value )
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

export const proxifyState = < T extends object >(
	namespace: string,
	obj: T
): T => createProxy( namespace, obj, stateHandlers ) as T;

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

export const getPropSignal = (
	proxy: object,
	key: string | number | symbol
) => {
	if ( ! proxyToProps.has( proxy ) ) {
		proxyToProps.set( proxy, new Map() );
	}
	key = typeof key === 'number' ? `${ key }` : key;
	const props = proxyToProps.get( proxy )!;
	if ( ! props.has( key ) ) {
		props.set( key, new PropSignal( proxy ) );
	}
	return props.get( key )!;
};
