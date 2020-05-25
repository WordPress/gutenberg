/**
 * Internal dependencies
 */
import {
	getNormalizedTitle,
	addTrailingPeriod,
	omitMobileEntry,
} from '../changelog';

describe( 'getNormalizedTitle', () => {
	const DEFAULT_ISSUE = {
		labels: [],
	};

	it.each( [
		[ 'adds period', 'Fixes a bug', 'Fixes a bug.' ],
		[ 'keeps period', 'Fixes a bug.', 'Fixes a bug.' ],
		[
			'omits mobile by title',
			'[RNMoBILe] Address mobile concern',
			undefined,
		],
		[
			'omits mobile by issue',
			'Address mobile concern',
			undefined,
			{
				...DEFAULT_ISSUE,
				labels: [ { name: 'Mobile App Compatibility' } ],
			},
		],
	] )( '%s', ( _label, original, expected, issue = DEFAULT_ISSUE ) => {
		expect( getNormalizedTitle( original, issue ) ).toBe( expected );
	} );
} );

describe( 'addTrailingPeriod', () => {
	it( 'adds a period if missing', () => {
		const result = addTrailingPeriod( 'Fixes a bug' );

		expect( result ).toBe( 'Fixes a bug.' );
	} );

	it( 'does not add a period if already present', () => {
		const result = addTrailingPeriod( 'Fixes a bug.' );

		expect( result ).toBe( 'Fixes a bug.' );
	} );
} );

describe( 'omitMobileEntry', () => {
	it( 'returns identity if not mobile', () => {
		const result = omitMobileEntry( 'Address web concern', { labels: [] } );

		expect( result ).toBe( 'Address web concern' );
	} );

	it( 'returns undefined if mobile by title', () => {
		const result = omitMobileEntry( '[RNMobile] Address native concern', {
			labels: [],
		} );

		expect( result ).toBe( undefined );
	} );

	it( 'returns undefined if mobile by label', () => {
		const result = omitMobileEntry( 'Address native concern', {
			labels: [ { name: 'Mobile App Compatibility' } ],
		} );

		expect( result ).toBe( undefined );
	} );
} );
