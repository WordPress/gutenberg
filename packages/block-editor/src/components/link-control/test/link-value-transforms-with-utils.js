/**
 * Internal dependencies
 */
import getLinkValueTransforms from '../link-value-transforms';

function identity( value ) {
	return value;
}

/**
 * Maps the standard LinkControl values to a given data object.
 * Complex mappings may supply an object with a `getter` and `setter` function
 * which represent how to get the link value for the given property and how to
 * set it back on the data object.
 */

// Create function that return the mapping object
// with the new mapping for the new attributes
function mappingGenerator() {
	const mapRelAttributeToData = ( currentRelValue, currentAttributes ) => {
		// Map attributes to matching values
		const attributesMapping = {
			opensInNewTab: [ 'noopener', 'noreferer' ],
			noFollow: [ 'nofollow' ],
			sponsored: [ 'sponsored' ],
		};
		// Split the current rel value into an array
		const relValuesArray = currentRelValue
			? currentRelValue.split( /\s+/ )
			: [];

		// Create a Set to store unique values
		const relValueSet = new Set( relValuesArray );

		// Iterate over the attributesMapping
		for ( const attribute in attributesMapping ) {
			const valuesToMatch = attributesMapping[ attribute ];

			if ( currentAttributes[ attribute ] ) {
				// If the current attribute is true, add the mapped values to the set
				valuesToMatch.forEach( ( value ) => relValueSet.add( value ) );
			} else {
				// If the current attribute is false, remove the mapped values from the set
				valuesToMatch.forEach( ( value ) =>
					relValueSet.delete( value )
				);
			}
		}

		// Convert the set back to an array and join it into a string
		const newRelValue = Array.from( relValueSet ).join( ' ' );

		return newRelValue;
	};

	return {
		url: 'href',
		type: 'postType',
		id: 'id',
		opensInNewTab: {
			dataKey: 'linkTarget',
			toLink: ( value ) => value === '_blank',
			toData: ( value ) => ( value ? '_blank' : undefined ),
		},
		noFollow: {
			dataKey: 'linkRel',
			toLink: ( value ) => value.includes( 'nofollow' ),
			toData: ( value, currentVal ) => {
				return mapRelAttributeToData( '', currentVal );
			},
		},
		sponsored: {
			dataKey: 'linkRel',
			toLink: ( value ) => value.includes( 'sponsored' ),
			toData: ( value, currentVal ) => {
				return mapRelAttributeToData( '', currentVal );
			},
		},
	};
}

const mapping = mappingGenerator();

describe( 'building a link value from data', () => {
	it.each( [
		[
			{
				href: 'https://www.wordpress.org',
				postType: 'post',
				id: 123,
				linkTarget: '_blank',
				linkRel: 'nofollow noopenner sponsored',
				keyToIgnore: 'valueToIgnore',
			},
			{
				url: 'https://www.wordpress.org',
				type: 'post',
				id: 123,
				opensInNewTab: true,
				noFollow: true,
				sponsored: true,
			},
		],
		[
			{
				href: 'https://www.wordpress.org',
				postType: 'post',
				id: 123,
				linkRel: 'sponsored neyfollow',
			},
			{
				url: 'https://www.wordpress.org',
				type: 'post',
				id: 123,
				opensInNewTab: false,
				noFollow: false,
				sponsored: true,
			},
		],
	] )(
		'build a valid link value from supplied data mapping',
		( data, expected ) => {
			const { toLink } = getLinkValueTransforms( mapping );

			const linkValue = toLink( data );

			expect( linkValue ).toEqual( expected );
		}
	);

	it( 'returns raw data attribute value when toLink transform is not callable', () => {
		const { toLink } = getLinkValueTransforms( {
			url: {
				dataKey: 'href',
				// allows toLink to be ommitted in case of simple mapping
				// but still allows toData to be defined.
				toData: identity,
			},
		} );

		const linkValue = toLink( {
			href: 'https://www.wordpress.org',
		} );

		expect( linkValue ).toEqual( {
			url: 'https://www.wordpress.org',
		} );
	} );
} );

describe( 'building data from a link value', () => {
	it( 'build a valid data object from supplied link value mapping', () => {
		const linkValue = {
			url: 'https://www.wordpress.org',
			type: 'post',
			id: 123,
			opensInNewTab: true,
			noFollow: true,
			sponsored: true,
		};

		const { toData } = getLinkValueTransforms( mapping );
		const data = toData( linkValue );

		expect( data ).toEqual( {
			href: 'https://www.wordpress.org',
			postType: 'post',
			id: 123,
			linkTarget: '_blank',
			linkRel: 'noopener noreferer nofollow sponsored',
		} );
	} );

	it( 'returns raw link value attribute when toData transform is not callable', () => {
		const { toData } = getLinkValueTransforms( {
			url: {
				dataKey: 'href',
				// allows toData to be ommitted in case of simple mapping
				// but still allows toLink to be defined.
				toLink: identity, // added for example purposes.
			},
		} );

		const data = toData( {
			url: 'https://www.wordpress.org',
		} );

		expect( data ).toEqual( {
			href: 'https://www.wordpress.org',
		} );
	} );
} );
