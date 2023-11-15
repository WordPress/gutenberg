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
const mapping = {
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
		toData: ( value, _, { linkRel: currentLinkRel } ) => {
			// if the value is truthy and the current value is set
			// then append otherwise just add the value
			if ( value && currentLinkRel ) {
				return `${ currentLinkRel } nofollow`;
			} else if ( value ) {
				return 'nofollow';
			}
		},
	},
	sponsored: {
		dataKey: 'linkRel',
		toLink: ( value ) => value.includes( 'sponsored' ),
		toData: ( value, _, { linkRel: currentLinkRel } ) => {
			// if the value is truthy and the current value is set
			// then append otherwise just add the value
			if ( value && currentLinkRel ) {
				return `${ currentLinkRel } sponsored`;
			} else if ( value ) {
				return 'sponsored';
			}
		},
	},
};

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
			linkRel: 'nofollow sponsored',
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
