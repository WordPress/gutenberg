// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-undef */
/**
 * External dependencies
 */
import { signal } from '@preact/signals';

const proxyToSignals = new WeakMap();
const objToProxy = new WeakMap();
const knownSymbols = new Set(
	Object.getOwnPropertyNames( Symbol )
		.map( ( key ) => Symbol[ key ] )
		.filter( ( value ) => typeof value === 'symbol' )
);
const supported = new Set( [
	Object,
	Array,
	Int8Array,
	Uint8Array,
	Uint8ClampedArray,
	Int16Array,
	Uint16Array,
	Int32Array,
	Uint32Array,
	Float32Array,
	Float64Array,
] );
const shouldWrap = ( { constructor } ) => {
	const isBuiltIn =
		typeof constructor === 'function' &&
		constructor.name in globalThis &&
		globalThis[ constructor.name ] === constructor;
	return ! isBuiltIn || supported.has( constructor );
};

export const deepSignal = ( obj ) => new Proxy( obj, handlers );
export const options = { returnSignal: /^\$/ };

const handlers = {
	get( target, prop, receiver ) {
		if ( typeof prop === 'symbol' && knownSymbols.has( prop ) )
			return Reflect.get( target, prop, receiver );
		const returnSignal = options.returnSignal.test( prop );
		const key = returnSignal
			? prop.replace( options.returnSignal, '' )
			: prop;
		if ( ! proxyToSignals.has( receiver ) )
			proxyToSignals.set( receiver, new Map() );
		const signals = proxyToSignals.get( receiver );
		if ( ! signals.has( key ) ) {
			let val = Reflect.get( target, key, receiver );
			if ( typeof val === 'object' && val !== null && shouldWrap( val ) )
				val = new Proxy( val, handlers );
			signals.set( key, signal( val ) );
		}
		return returnSignal ? signals.get( key ) : signals.get( key ).value;
	},

	set( target, prop, val, receiver ) {
		let internal = val;
		if ( typeof val === 'object' && val !== null && shouldWrap( val ) ) {
			if ( ! objToProxy.has( val ) )
				objToProxy.set( val, new Proxy( val, handlers ) );
			internal = objToProxy.get( val );
		}
		if ( ! proxyToSignals.has( receiver ) )
			proxyToSignals.set( receiver, new Map() );
		const signals = proxyToSignals.get( receiver );
		if ( ! signals.has( prop ) ) signals.set( prop, signal( internal ) );
		else signals.get( prop ).value = internal;
		return Reflect.set( target, prop, val, receiver );
	},
};
