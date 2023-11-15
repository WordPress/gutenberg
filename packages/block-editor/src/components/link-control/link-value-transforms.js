function isCallable( value ) {
	return value && typeof value === 'function';
}

function buildLinkValueFromData( data, mapping ) {
	const linkValue = {};
	for ( const [ attributeName, valueGetter ] of Object.entries( mapping ) ) {
		if ( typeof valueGetter === 'string' ) {
			linkValue[ attributeName ] = data[ valueGetter ];
		} else if ( isCallable( valueGetter.toLink ) ) {
			linkValue[ attributeName ] = valueGetter.toLink(
				data[ valueGetter.dataKey ],
				data
			);
		} else {
			linkValue[ attributeName ] = data[ valueGetter.dataKey ];
		}
	}
	return linkValue;
}

function buildDataFromLinkValue( linkValue, mapping ) {
	const data = {};
	for ( const [ attributeName, valueGetter ] of Object.entries( mapping ) ) {
		if ( typeof valueGetter === 'string' ) {
			data[ valueGetter ] = linkValue[ attributeName ];
		} else if ( isCallable( valueGetter.toData ) ) {
			data[ valueGetter.dataKey ] = valueGetter.toData(
				linkValue[ attributeName ],
				linkValue,
				data
			);
		} else {
			data[ valueGetter.dataKey ] = linkValue[ attributeName ];
		}
	}
	return data;
}

export default function getLinkValueTransforms( mapping ) {
	return {
		toLink: ( data ) => buildLinkValueFromData( data, mapping ),
		toData: ( linkValue ) => buildDataFromLinkValue( linkValue, mapping ),
	};
}
