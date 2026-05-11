// File copied https://github.com/slab/delta/blob/main/src/AttributeMap.ts with changes:
// - lodash.clonedeep is replaced with JSON parse / stringify
// - lodash.isequal is replaced with fast-deep-equal.

/**
 * External dependencies
 */
import { default as isEqual } from 'fast-deep-equal/es6';

function cloneDeep< T >( value: T ): T {
	return JSON.parse( JSON.stringify( value ) ) as T;
}

interface AttributeMap {
	[ key: string ]: unknown;
}

namespace AttributeMap {
	export function compose(
		a: AttributeMap = {},
		b: AttributeMap = {},
		keepNull = false
	): AttributeMap | undefined {
		if ( typeof a !== 'object' ) {
			a = {};
		}
		if ( typeof b !== 'object' ) {
			b = {};
		}
		let attributes = cloneDeep( b );
		if ( ! keepNull ) {
			attributes = Object.keys( attributes ).reduce< AttributeMap >(
				( copy, key ) => {
					if (
						attributes[ key ] !== null ||
						attributes[ key ] !== undefined
					) {
						copy[ key ] = attributes[ key ];
					}
					return copy;
				},
				{}
			);
		}
		for ( const key in a ) {
			if ( a[ key ] !== undefined && b[ key ] === undefined ) {
				attributes[ key ] = a[ key ];
			}
		}
		return Object.keys( attributes ).length > 0 ? attributes : undefined;
	}

	export function diff(
		a: AttributeMap = {},
		b: AttributeMap = {}
	): AttributeMap | undefined {
		if ( typeof a !== 'object' ) {
			a = {};
		}
		if ( typeof b !== 'object' ) {
			b = {};
		}
		const attributes = Object.keys( a )
			.concat( Object.keys( b ) )
			.reduce< AttributeMap >( ( attrs, key ) => {
				if ( ! isEqual( a[ key ], b[ key ] ) ) {
					attrs[ key ] = b[ key ] === undefined ? null : b[ key ];
				}
				return attrs;
			}, {} );
		return Object.keys( attributes ).length > 0 ? attributes : undefined;
	}

	export function invert(
		attr: AttributeMap = {},
		base: AttributeMap = {}
	): AttributeMap {
		attr = attr || {};
		const baseInverted = Object.keys( base ).reduce< AttributeMap >(
			( memo, key ) => {
				if (
					base[ key ] !== attr[ key ] &&
					attr[ key ] !== undefined
				) {
					memo[ key ] = base[ key ];
				}
				return memo;
			},
			{}
		);
		return Object.keys( attr ).reduce< AttributeMap >( ( memo, key ) => {
			if ( attr[ key ] !== base[ key ] && base[ key ] === undefined ) {
				memo[ key ] = null;
			}
			return memo;
		}, baseInverted );
	}

	export function transform(
		a: AttributeMap | undefined,
		b: AttributeMap | undefined,
		priority = false
	): AttributeMap | undefined {
		if ( typeof a !== 'object' ) {
			return b;
		}
		if ( typeof b !== 'object' ) {
			return undefined;
		}
		if ( ! priority ) {
			return b; // b simply overwrites us without priority
		}
		const attributes = Object.keys( b ).reduce< AttributeMap >(
			( attrs, key ) => {
				if ( a[ key ] === undefined ) {
					attrs[ key ] = b[ key ]; // null is a valid value
				}
				return attrs;
			},
			{}
		);
		return Object.keys( attributes ).length > 0 ? attributes : undefined;
	}
}

export default AttributeMap;
