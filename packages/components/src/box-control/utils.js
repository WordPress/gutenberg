/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const TYPES = [ 'all', 'pairs', 'custom' ];

export const TYPE_PROPS = {
	all: {
		sides: [ 'all' ],
		label: __( 'All sides' ),
	},
	pairs: {
		sides: [ 'top', 'bottom' ],
		label: __( 'Pair of sides' ),
	},
	custom: {
		sides: [ 'top' ],
		label: __( 'Individual sides' ),
	},
};

export const DEFAULT_VALUES = {
	top: [ 0, 'px' ],
	right: [ 0, 'px' ],
	bottom: [ 0, 'px' ],
	left: [ 0, 'px' ],
};

export const parseType = ( values = {} ) => {
	const {
		top: [ top ],
		bottom: [ bottom ],
		left: [ left ],
		right: [ right ],
	} = parseValues( values );

	const isAll = [ top, bottom, left, right ].every(
		( value ) => value === top
	);

	if ( isAll ) {
		return 'all';
	}

	const isVerticalMatch = [ top, bottom ].every( ( value ) => value === top );
	const isHorizontalMatch = [ left, right ].every(
		( value ) => value === left
	);

	const isPairs = isVerticalMatch && isHorizontalMatch;

	if ( isPairs ) {
		return 'pairs';
	}

	return 'custom';
};

export function parseValues( values = {} ) {
	const nextValueProps = {};

	Object.keys( DEFAULT_VALUES ).forEach( ( key ) => {
		const defaultValue = DEFAULT_VALUES[ key ];
		const prop = values[ key ] || [];

		nextValueProps[ key ] = [
			prop?.[ 0 ] || defaultValue[ 0 ],
			prop?.[ 1 ] || defaultValue[ 1 ],
		];
	} );

	return nextValueProps;
}

export function getValues( values, ...args ) {
	const nextValues = [];
	args.forEach( ( key ) => {
		nextValues.push( values[ key ][ 0 ] );
	} );

	return nextValues;
}
