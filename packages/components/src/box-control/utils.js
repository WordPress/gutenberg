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

export function getValues( values, ...args ) {
	const nextValues = [];

	args.forEach( ( key ) => {
		nextValues.push( values[ key ] );
	} );

	return nextValues;
}
