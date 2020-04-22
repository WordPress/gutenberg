/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const LABELS = {
	all: __( 'All' ),
	top: __( 'Top' ),
	bottom: __( 'Bottom' ),
	left: __( 'Left' ),
	right: __( 'Right' ),
};

export const DEFAULT_VALUES = {
	top: [ 0, 'px' ],
	right: [ 0, 'px' ],
	bottom: [ 0, 'px' ],
	left: [ 0, 'px' ],
};

export function parseValues( values = {} ) {
	const nextValueProps = {};

	for ( const key in DEFAULT_VALUES ) {
		const defaultValue = DEFAULT_VALUES[ key ];
		const prop = values[ key ] || [];

		nextValueProps[ key ] = [
			prop?.[ 0 ] || defaultValue[ 0 ],
			prop?.[ 1 ] || defaultValue[ 1 ],
		];
	}

	return nextValueProps;
}

export function getValues( values, ...args ) {
	const nextValues = [];

	args.forEach( ( key ) => {
		nextValues.push( values[ key ][ 0 ] );
	} );

	return nextValues;
}

export function getUnits( values, ...args ) {
	const nextValues = [];

	args.forEach( ( key ) => {
		nextValues.push( values[ key ][ 1 ] );
	} );

	return nextValues;
}
