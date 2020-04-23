/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { parseUnit } from '../unit-control/utils';

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

export function useBoxControlState( values = {} ) {
	return useState( {
		...DEFAULT_VALUES,
		...values,
	} );
}

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

export function getAllValue( values = {} ) {
	const parsedValues = Object.keys( values ).reduce( ( acc, key ) => {
		const value = values[ key ];
		return [ ...acc, parseUnit( value ) ];
	}, [] );

	const allValues = parsedValues.map( ( value ) => value[ 0 ] );
	const allUnits = parsedValues.map( ( value ) => value[ 1 ] );

	const value = allValues.every( ( v ) => v === allValues[ 0 ] )
		? allValues[ 0 ]
		: '';
	const unit = allUnits.every( ( v ) => v === allUnits[ 0 ] )
		? allUnits[ 0 ]
		: '';

	const allValue = `${ value }${ unit }`;

	return allValue;
}
