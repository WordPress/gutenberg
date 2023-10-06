function buildLinkValueFromData( data, mapping ) {
	const linkValue = {};
	for ( const [ attributeName, valueGetter ] of Object.entries( mapping ) ) {
		if ( typeof valueGetter === 'string' ) {
			linkValue[ attributeName ] = data[ valueGetter ];
		} else {
			linkValue[ attributeName ] = valueGetter.toLink(
				data[ valueGetter.dataKey ],
				data
			);
		}
	}
	return linkValue;
}

function buildDataFromLinkValue( linkValue, mapping ) {
	const data = {};
	for ( const [ attributeName, valueGetter ] of Object.entries( mapping ) ) {
		if ( typeof valueGetter === 'string' ) {
			data[ valueGetter ] = linkValue[ attributeName ];
		} else {
			data[ valueGetter.dataKey ] = valueGetter.toData(
				linkValue[ attributeName ],
				linkValue,
				data
			);
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
