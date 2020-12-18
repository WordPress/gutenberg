/**
 * External dependencies
 */
import { compact, get } from 'lodash';

export function serializeGradientColor( { type, value } ) {
	if ( type === 'literal' ) {
		return value;
	}
	if ( type === 'hex' ) {
		return `#${ value }`;
	}
	return `${ type }(${ value.join( ',' ) })`;
}

export function serializeGradientPosition( position ) {
	if ( ! position ) {
		return '';
	}
	const { value, type } = position;
	return `${ value }${ type }`;
}

export function serializeGradientColorStop( { type, value, length } ) {
	return `${ serializeGradientColor( {
		type,
		value,
	} ) } ${ serializeGradientPosition( length ) }`;
}

export function serializeGradientOrientation( orientation ) {
	if ( ! orientation || orientation.type !== 'angular' ) {
		return;
	}
	return `${ orientation.value }deg`;
}

export function serializeGradient( { type, orientation, colorStops } ) {
	const serializedOrientation = serializeGradientOrientation( orientation );
	const serializedColorStops = colorStops
		.sort( ( colorStop1, colorStop2 ) => {
			return (
				get( colorStop1, [ 'length', 'value' ], 0 ) -
				get( colorStop2, [ 'length', 'value' ], 0 )
			);
		} )
		.map( serializeGradientColorStop );
	return `${ type }(${ compact( [
		serializedOrientation,
		...serializedColorStops,
	] ).join( ',' ) })`;
}

export function serializeControlPoints( gradientAST, newControlPoints ) {
	const serializedOrientation = serializeGradientOrientation(
		gradientAST.orientation
	);
	const serializedColorStops = newControlPoints
		.sort( ( colorStop1, colorStop2 ) => {
			return (
				get( colorStop1, [ 'position' ], 0 ) -
				get( colorStop2, [ 'position' ], 0 )
			);
		} )
		.map( ( { position, color } ) => `${ color } ${ position }%` );
	return `${ gradientAST.type }(${ compact( [
		serializedOrientation,
		...serializedColorStops,
	] ).join( ',' ) })`;
}
