export function buildLinkValueFromData( data, mapping ) {
	const linkValue = {};
	for ( const [ attributeName, valueGetter ] of Object.entries( mapping ) ) {
		if ( typeof valueGetter === 'string' ) {
			linkValue[ attributeName ] = data[ valueGetter ];
		} else {
			linkValue[ attributeName ] = valueGetter.toLink(
				data[ valueGetter.dataKey ]
			);
		}
	}
	return linkValue;
}

export function buildDataFromLinkValue( linkValue, mapping ) {
	const data = {};
	for ( const [ attributeName, valueGetter ] of Object.entries( mapping ) ) {
		if ( typeof valueGetter === 'string' ) {
			data[ valueGetter ] = linkValue[ attributeName ];
		} else {
			data[ valueGetter.dataKey ] = valueGetter.toData(
				linkValue[ attributeName ],
				data[ valueGetter.dataKey ]
			);
		}
	}
	return data;
}
