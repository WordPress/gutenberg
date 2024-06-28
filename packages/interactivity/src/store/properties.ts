/**
 * External dependencies
 */
import {
	computed,
	signal,
	batch,
	type Signal,
	type ReadonlySignal,
} from '@preact/signals-core';

/**
 * Internal dependencies
 */
import { getProxy } from './proxies';
import { getScope } from '../hooks';

const DEFAULT_SCOPE = {};
const objToProps: WeakMap< object, Map< string, Property > > = new WeakMap();

export const getProperty = ( target: object, key: string ) => {
	if ( ! objToProps.has( target ) ) {
		objToProps.set( target, new Map() );
	}
	const props = objToProps.get( target )!;
	if ( ! props.has( key ) ) {
		props.set( key, new Property( target ) );
	}
	return props.get( key )!;
};

class Property {
	private owner: object;
	private accessors: WeakMap< object, ReadonlySignal >;
	private signal?: Signal;
	private getter?: Signal< ( () => any ) | undefined >;

	constructor( owner: object ) {
		this.owner = owner;
		this.accessors = new WeakMap();
	}

	updateSignal( value: unknown | undefined ) {
		if ( ! this.signal ) {
			this.signal = signal( value );
			this.getter = signal( undefined );
		} else if ( value !== this.signal.peek() ) {
			batch( () => {
				this.signal!.value = value;
				this.getter!.value = undefined;
			} );
		}
	}

	updateGetter( getter: () => any | undefined ) {
		if ( ! this.getter ) {
			this.signal = signal( undefined );
			this.getter = signal( getter );
		} else if ( getter !== this.getter.peek() ) {
			batch( () => {
				this.signal!.value = undefined;
				this.getter!.value = getter;
			} );
		}
	}

	accessor(
		wrapper?: < G extends () => any >( getter: G ) => G
	): ReadonlySignal {
		const scope = getScope() || DEFAULT_SCOPE;

		if ( ! this.accessors.has( scope ) ) {
			this.accessors.set(
				scope,
				computed( () => {
					const getter = this.getter?.value;
					if ( getter ) {
						return wrapper
							? wrapper( () =>
									getter.call( getProxy( this.owner ) )
							  )()
							: getter.call( this.owner );
					}
					return this.signal?.value;
				} )
			);
		}
		return this.accessors.get( scope )!;
	}
}
