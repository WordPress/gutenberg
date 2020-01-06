/**
 * External dependencies
 */
import { compact, get } from 'lodash';

export function serializeGradientColor( { type, value } ) {
	return `${ type }(${ value.join( ',' ) })`;
}

export function serializeGradientPosition( { type, value } ) {
	return `${ value }${ type }`;
}

export function serializeGradientColorStop( { type, value, length } ) {
	return `${ serializeGradientColor( { type, value } ) } ${ serializeGradientPosition( length ) }`;
}

export function serializeGradientOrientation( orientation ) {
	if ( ! orientation || orientation.type !== 'angular' ) {
		return;
	}
	return `${ orientation.value }deg`;
}

export function serializeGradient( { type, orientation, colorStops } ) {
	const serializedOrientation = serializeGradientOrientation( orientation );
	const serializedColorStops = colorStops.sort( ( colorStop1, colorStop2 ) => {
		return get( colorStop1, [ 'length', 'value' ], 0 ) - get( colorStop2, [ 'length', 'value' ], 0 );
	} ).map( serializeGradientColorStop );
	return `${ type }(${ compact( [ serializedOrientation, ...serializedColorStops ] ).join( ',' ) })`;
}
