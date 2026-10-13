import { useEffect, useState } from '@wordpress/element';

const breakpoints = [ '40em', '52em', '64em' ];

export const useBreakpointIndex = (
	options: { defaultIndex?: number; enabled?: boolean } = {}
) => {
	const { defaultIndex = 0, enabled = true } = options;

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
		if ( ! enabled ) {
			return;
		}

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

		if ( typeof window !== 'undefined' ) {
			window.addEventListener( 'resize', onResize );
		}
		return () => {
			if ( typeof window !== 'undefined' ) {
				window.removeEventListener( 'resize', onResize );
			}
		};
	}, [ value, enabled ] );

	return value;
};

export function useResponsiveValue< T >(
	values: ( T | undefined )[],
	options: Parameters< typeof useBreakpointIndex >[ 0 ] = {}
): T | undefined {
	// A single value is the same at every breakpoint, so there is nothing to
	// watch. Most callers pass one, and watching for them would mean a media
	// query and a resize listener per component instance.
	const isResponsive = Array.isArray( values ) && values.length > 1;
	const index = useBreakpointIndex( { ...options, enabled: isResponsive } );

	// Allow calling the function with a "normal" value without having to check on the outside.
	if ( ! Array.isArray( values ) && typeof values !== 'function' ) {
		return values;
	}

	const array = values || [];

	return array[ index >= array.length ? array.length - 1 : index ];
}
