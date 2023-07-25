/**
 * External dependencies
 */
import type gradientParser from 'gradient-parser';

export function serializeGradientColor( {
	type,
	value,
}: gradientParser.ColorStop ) {
	if ( type === 'literal' ) {
		return value;
	}
	if ( type === 'hex' ) {
		return `#${ value }`;
	}
	return `${ type }(${ value.join( ',' ) })`;
}

export function serializeGradientPosition(
	position: gradientParser.ColorStop[ 'length' ]
) {
	if ( ! position ) {
		return '';
	}
	const { value, type } = position;
	return `${ value }${ type }`;
}

export function serializeGradientColorStop( {
	type,
	value,
	length,
}: gradientParser.ColorStop ) {
	return `${ serializeGradientColor( {
		type,
		value,
	} as gradientParser.ColorStop ) } ${ serializeGradientPosition( length ) }`;
}

export function serializeGradientOrientation(
	orientation: gradientParser.GradientNode[ 'orientation' ]
) {
	if (
		Array.isArray( orientation ) ||
		! orientation ||
		orientation.type !== 'angular'
	) {
		return;
	}
	return `${ orientation.value }deg`;
}

export function serializeGradient( {
	type,
	orientation,
	colorStops,
}: gradientParser.GradientNode ) {
	const serializedOrientation = serializeGradientOrientation( orientation );
	const serializedColorStops = colorStops
		.sort( ( colorStop1, colorStop2 ) => {
			const getNumericStopValue = (
				colorStop: gradientParser.ColorStop
			) => {
				return colorStop?.length?.value === undefined
					? 0
					: parseInt( colorStop.length.value );
			};

			return (
				getNumericStopValue( colorStop1 ) -
				getNumericStopValue( colorStop2 )
			);
		} )
		.map( serializeGradientColorStop );
	return `${ type }(${ [ serializedOrientation, ...serializedColorStops ]
		.filter( Boolean )
		.join( ',' ) })`;
}
