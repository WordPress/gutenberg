/**
 * Internal dependencies
 */
import {
	getNormalizedTitle,
	reword,
	addTrailingPeriod,
	createOmitByTitlePrefix,
	createOmitByLabel,
	capitalizeAfterColonSeparatedPrefix,
	getIssueType,
	sortGroup,
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
			'omits project management',
			'Add codeowner',
			undefined,
			{
				...DEFAULT_ISSUE,
				labels: [ { name: 'Project Management' } ],
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

describe( 'createOmitByTitlePrefix', () => {
	it( 'returns identity if not containing matching prefix', () => {
		const result = createOmitByTitlePrefix( [ '[omIT]' ] )( 'Fix' );

		expect( result ).toBe( 'Fix' );
	} );

	it( 'returns undefined if given prefix', () => {
		const result = createOmitByTitlePrefix( [ '[omIT]' ] )( '[omit] Fix' );

		expect( result ).toBe( undefined );
	} );
} );

describe( 'createOmitByLabel', () => {
	it( 'returns identity if label is not assigned to issue', () => {
		const result = createOmitByLabel( [ 'Omit' ] )( 'Fix', { labels: [] } );

		expect( result ).toBe( 'Fix' );
	} );

	it( 'returns undefined if given prefix', () => {
		const result = createOmitByLabel( [ 'Omit' ] )( 'Fix', {
			labels: [ { name: 'Omit' } ],
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

describe( 'sortGroup', () => {
	it( 'returns groups in order', () => {
		const result = [
			'Code Quality',
			'Bug Fixes',
			'Various',
			'New APIs',
			'Enhancements',
			'Performance',
		].sort( sortGroup );

		expect( result ).toEqual( [
			'Enhancements',
			'New APIs',
			'Bug Fixes',
			'Code Quality',
			'Performance',
			'Various',
		] );
	} );
} );
