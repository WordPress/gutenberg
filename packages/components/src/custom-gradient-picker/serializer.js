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
				( colorStop1?.length?.value ?? 0 ) -
				( colorStop2?.length?.value ?? 0 )
			);
		} )
		.map( serializeGradientColorStop );
	return `${ type }(${ [ serializedOrientation, ...serializedColorStops ]
		.filter( Boolean )
		.join( ',' ) })`;
}
