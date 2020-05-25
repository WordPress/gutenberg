/**
 * Internal dependencies
 */
import {
	getNormalizedTitle,
	reword,
	addTrailingPeriod,
	omitMobileEntry,
	capitalizeAfterColonSeparatedPrefix,
	getIssueType,
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
		[
			'avoids reword of joined terms',
			'e2e-tests: Improve test stability',
			'e2e-tests: Improve test stability.',
		],
		[
			'rewords',
			'Improve e2e url stability',
			'Improve end-to-end URL stability.',
		],
		[ 'capitalizes', 'fix bug', 'Fix bug.' ],
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

describe( 'reword', () => {
	it( 'avoids reword of joined terms', () => {
		const result = reword( 'e2e-tests: Improve test stability' );

		expect( result ).toBe( 'e2e-tests: Improve test stability' );
	} );

	it( 'rewords terms', () => {
		const result = reword( 'Improve e2e url stability' );

		expect( result ).toBe( 'Improve end-to-end URL stability' );
	} );
} );

describe( 'capitalizeAfterColonSeparatedPrefix', () => {
	it( 'capitalizes the last segment after a colon', () => {
		const result = capitalizeAfterColonSeparatedPrefix( 'blocks: fix bug' );

		expect( result ).toBe( 'blocks: Fix bug' );
	} );
} );

describe( 'getIssueType', () => {
	it( 'returns various if unable to find appropriate type by label', () => {
		const result = getIssueType( { labels: [] } );

		expect( result ).toBe( 'Various' );
	} );

	it( 'returns type by label', () => {
		const result = getIssueType( {
			labels: [ { name: '[Type] Code Quality' } ],
		} );

		expect( result ).toBe( 'Code Quality' );
	} );

	it( 'returns remapped type by label', () => {
		const result = getIssueType( { labels: [ { name: '[Type] Bug' } ] } );

		expect( result ).toBe( 'Bug Fixes' );
	} );
} );
