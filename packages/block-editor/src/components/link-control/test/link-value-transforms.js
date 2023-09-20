/**
 * Internal dependencies
 */
import {
	buildLinkValueFromData,
	buildDataFromLinkValue,
} from '../link-value-transforms';

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
		toData: ( value, currentVal ) => {
			// if the value is truthy and the current value is set
			// then append otherwise just add the value
			if ( value && currentVal ) {
				return `${ currentVal } nofollow`;
			} else if ( value ) {
				return 'nofollow';
			}
		},
	},
	sponsored: {
		dataKey: 'linkRel',
		toLink: ( value ) => value.includes( 'sponsored' ),
		toData: ( value, currentVal ) => {
			// if the value is truthy and the current value is set
			// then append otherwise just add the value
			if ( value && currentVal ) {
				return `${ currentVal } sponsored`;
			} else if ( value ) {
				return 'sponsored';
			}
		},
	},
};

describe( 'buildLinkValueFromData', () => {
	it.each( [
		[
			{
				href: 'https://www.google.com',
				postType: 'post',
				id: 123,
				linkTarget: '_blank',
				linkRel: 'nofollow noopenner sponsored',
				keyToIgnore: 'valueToIgnore',
			},
			{
				url: 'https://www.google.com',
				type: 'post',
				id: 123,
				opensInNewTab: true,
				noFollow: true,
				sponsored: true,
			},
		],
		[
			{
				href: 'https://www.google.com',
				postType: 'post',
				id: 123,
				linkRel: 'sponsored neyfollow',
			},
			{
				url: 'https://www.google.com',
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
			const linkValue = buildLinkValueFromData( data, mapping );

			expect( linkValue ).toEqual( expected );
		}
	);
} );

describe( 'buildDataFromLinkValue', () => {
	it( 'build a valid data object from supplied link value mapping', () => {
		const linkValue = {
			url: 'https://www.google.com',
			type: 'post',
			id: 123,
			opensInNewTab: true,
			noFollow: true,
			sponsored: true,
		};

		const data = buildDataFromLinkValue( linkValue, mapping );

		expect( data ).toEqual( {
			href: 'https://www.google.com',
			postType: 'post',
			id: 123,
			linkTarget: '_blank',
			linkRel: 'nofollow sponsored',
		} );
	} );
} );
