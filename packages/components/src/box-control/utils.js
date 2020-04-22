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
	top: '0px',
	right: '0px',
	bottom: '0px',
	left: '0px',
};

export function isValuesMixed( values ) {
	const vals = Object.values( values );

	return ! vals.every( ( v ) => v === vals[ 0 ] );
}

export function getValues( values, ...args ) {
	const nextValues = [];

	for ( const key in args ) {
		nextValues.push( values[ key ] );
	}

	return nextValues;
}
