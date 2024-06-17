/**
 * Internal dependencies
 */
import { getUpdatedLinkAttributes } from '../get-updated-link-attributes';

describe( 'getUpdatedLinkAttributes function', () => {
	it( 'should correctly handle unassigned rel', () => {
		const options = {
			href: 'example.com',
			opensInNewTab: true,
			nofollow: false,
		};

		const result = getUpdatedLinkAttributes( options );

		expect( result.href ).toEqual( 'http://example.com' );
		expect( result.linkTarget ).toEqual( '_blank' );
		expect( result.rel ).toEqual( 'noreferrer noopener' );
	} );

	it( 'should return empty rel value as undefined', () => {
		const options = {
			href: 'example.com',
			opensInNewTab: false,
			nofollow: false,
		};

		const result = getUpdatedLinkAttributes( options );

		expect( result.href ).toEqual( 'http://example.com' );
		expect( result.linkTarget ).toEqual( undefined );
		expect( result.rel ).toEqual( undefined );
	} );

	it( 'should correctly handle rel with existing values', () => {
		const options = {
			href: 'example.com',
			opensInNewTab: true,
			nofollow: true,
			rel: 'rel_value',
		};

		const result = getUpdatedLinkAttributes( options );

		expect( result.href ).toEqual( 'http://example.com' );
		expect( result.linkTarget ).toEqual( '_blank' );
		expect( result.rel ).toEqual(
			'rel_value noreferrer noopener nofollow'
		);
	} );

	it( 'should correctly update link attributes with opensInNewTab', () => {
		const options = {
			href: 'example.com',
			opensInNewTab: true,
			nofollow: false,
			rel: 'rel_value',
		};

		const result = getUpdatedLinkAttributes( options );

		expect( result.href ).toEqual( 'http://example.com' );
		expect( result.linkTarget ).toEqual( '_blank' );
		expect( result.rel ).toEqual( 'rel_value noreferrer noopener' );
	} );

	it( 'should correctly update link attributes with nofollow', () => {
		const options = {
			href: 'example.com',
			opensInNewTab: false,
			nofollow: true,
			rel: 'rel_value',
		};

		const result = getUpdatedLinkAttributes( options );

		expect( result.href ).toEqual( 'http://example.com' );
		expect( result.linkTarget ).toEqual( undefined );
		expect( result.rel ).toEqual( 'rel_value nofollow' );
	} );

	it( 'should correctly handle rel with existing nofollow values and remove duplicates', () => {
		const options = {
			href: 'example.com',
			opensInNewTab: true,
			nofollow: true,
			rel: 'rel_value nofollow',
		};

		const result = getUpdatedLinkAttributes( options );

		expect( result.href ).toEqual( 'http://example.com' );
		expect( result.linkTarget ).toEqual( '_blank' );
		expect( result.rel ).toEqual(
			'rel_value nofollow noreferrer noopener'
		);
	} );

	it( 'should correctly handle rel with existing new tab values and remove duplicates', () => {
		const options = {
			href: 'example.com',
			opensInNewTab: true,
			nofollow: false,
			rel: 'rel_value noreferrer noopener',
		};

		const result = getUpdatedLinkAttributes( options );

		expect( result.href ).toEqual( 'http://example.com' );
		expect( result.linkTarget ).toEqual( '_blank' );
		expect( result.rel ).toEqual( 'rel_value noreferrer noopener' );
	} );
} );
