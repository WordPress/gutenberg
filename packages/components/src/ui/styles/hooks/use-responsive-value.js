/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { breakpoints } from '../style-system';

/**
 * @param {Node} node
 * @param {Object} [options]
 * @param {number} [options.defaultIndex=0]
 */
export const useBreakpointIndex = ( node, options = {} ) => {
	const { defaultIndex = 0 } = options;

	if ( typeof defaultIndex !== 'number' ) {
		throw new TypeError(
			`Default breakpoint index should be a number. Got: ${ defaultIndex }, ${ typeof defaultIndex }`
		);
	} else if ( defaultIndex < 0 || defaultIndex > breakpoints.length - 1 ) {
		throw new RangeError(
			`Default breakpoint index out of range. Theme has ${ breakpoints.length } breakpoints, got index ${ defaultIndex }`
		);
	}

	const [ value, setValue ] = useState( defaultIndex );

	useEffect( () => {
		const getIndex = () =>
			breakpoints.filter( ( bp ) => {
				return typeof window !== 'undefined'
					? window.matchMedia( `screen and (min-width: ${ bp })` )
							.matches
					: false;
			} ).length;

		const onResize = () => {
			const newValue = getIndex();
			if ( value !== newValue ) {
				setValue( newValue );
			}
		};

		onResize();

		if ( node.ownerDocument ) {
			node.ownerDocument.addEventListener( 'resize', onResize );
		}
		return () => {
			if ( node.ownerDocument ) {
				node.ownerDocument.removeEventListener( 'resize', onResize );
			}
		};
	}, [ value ] );

	return value;
};

/* eslint-disable jsdoc/valid-types */
/**
 * @template T
 * @param {Node} node
 * @param {(() => (T | undefined)[]) | (T | undefined)[]} values
 * @param {Parameters<useBreakpointIndex>[1]} options
 * @return {T | undefined} The responsive value for the breakpoint or the default value.
 */
export function useResponsiveValue( node, values, options = {} ) {
	/* eslint-enable jsdoc/valid-types */
	const index = useBreakpointIndex( node, options );

	// Allow calling the function with a "normal" value without having to check on the outside.
	if ( ! Array.isArray( values ) && typeof values !== 'function' )
		return values;

	let array = values || [];
	if ( typeof values === 'function' ) {
		array = values();
	}

	/* eslint-disable jsdoc/no-undefined-types */
	return /** @type {T[]} */ ( array )[
		/* eslint-enable jsdoc/no-undefined-types */
		index >= array.length ? array.length - 1 : index
	];
}
