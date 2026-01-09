export function getValue( data, fieldDef ) {
	if ( ! fieldDef.properties ) {
		return data;
	}

	// When a field is an object, flatten all the properties to the root
	// of the block attributes.
	const mappedValue = {};

	// Convert to field keys.
	Object.keys( fieldDef.properties ).forEach( ( key ) => {
		const attributeKey = fieldDef.properties[ key ].id ?? key;
		if ( data[ attributeKey ] ) {
			mappedValue[ key ] = data[ attributeKey ];
		}
	} );
	return mappedValue;
}

export function setValue( value, fieldDef ) {
	if ( ! fieldDef.properties ) {
		return value;
	}

	// When a field is an object, flatten all the properties to the root
	// of the block attributes.
	const mappedValue = {};

	// Convert to attribute keys.
	Object.keys( fieldDef.properties ).forEach( ( key ) => {
		if ( value[ key ] ) {
			const attributeKey = fieldDef.properties[ key ].id ?? key;
			mappedValue[ attributeKey ] = value[ key ];
		}
	} );
	return mappedValue;
}
