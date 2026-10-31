import { describe, expect, test } from 'vitest';
import {
	getMediaLinkDestination,
	getNewTabLinkAttributes,
} from '../link-destinations';

const destinations = [
	{ linkDestination: 'media', url: 'https://example.com/image.jpg' },
	{ linkDestination: 'attachment', url: 'https://example.com/?p=1' },
];

describe( 'getMediaLinkDestination', () => {
	test.each( [
		[ undefined, 'none' ],
		[ '', 'none' ],
		[ 'https://example.com/image.jpg', 'media' ],
		[ 'https://example.com/?p=1', 'attachment' ],
		[ 'https://wordpress.org', 'custom' ],
	] )( 'returns the destination of %s as %s', ( url, expected ) => {
		expect( getMediaLinkDestination( url, destinations ) ).toBe( expected );
	} );
} );

describe( 'getNewTabLinkAttributes', () => {
	test.each( [
		// The toolbar has always joined onto an empty rel this way.
		[ undefined, ' noopener' ],
		[ 'nofollow', 'nofollow noopener' ],
		[ 'noopener nofollow', 'noopener nofollow' ],
	] )(
		'opens in a new tab and adds noopener to a rel of %s',
		( rel, expected ) => {
			expect( getNewTabLinkAttributes( true, rel ) ).toEqual( {
				linkTarget: '_blank',
				rel: expected,
			} );
		}
	);

	test.each( [
		[ undefined, '' ],
		[ 'noopener', undefined ],
		[ 'nofollow noopener', 'nofollow' ],
	] )(
		'stops opening in a new tab and removes noopener from a rel of %s',
		( rel, expected ) => {
			expect( getNewTabLinkAttributes( false, rel ) ).toEqual( {
				linkTarget: undefined,
				rel: expected,
			} );
		}
	);
} );
