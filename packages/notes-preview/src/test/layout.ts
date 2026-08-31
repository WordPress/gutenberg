import {
	calculateThreadTops,
	parseNoteIds,
	DEFAULT_GAP,
	DEFAULT_ALIGN_OFFSET,
} from '../layout';

describe( 'calculateThreadTops', () => {
	const heights = { '1': 100, '2': 100, '3': 100 };

	it( 'returns nothing when there is nothing to place', () => {
		expect( calculateThreadTops( { anchors: [], heights: {} } ) ).toEqual(
			{}
		);
	} );

	it( 'places a lone card at its anchor', () => {
		const tops = calculateThreadTops( {
			anchors: [ { id: '1', top: 500 } ],
			heights,
		} );

		expect( tops[ '1' ] ).toBe( 500 + DEFAULT_ALIGN_OFFSET );
	} );

	it( 'leaves cards alone when their anchors are far apart', () => {
		const tops = calculateThreadTops( {
			anchors: [
				{ id: '1', top: 0 },
				{ id: '2', top: 400 },
			],
			heights,
		} );

		expect( tops[ '1' ] ).toBe( DEFAULT_ALIGN_OFFSET );
		expect( tops[ '2' ] ).toBe( 400 + DEFAULT_ALIGN_OFFSET );
	} );

	it( 'pushes a card down rather than letting it overlap the one above', () => {
		const tops = calculateThreadTops( {
			anchors: [
				{ id: '1', top: 0 },
				{ id: '2', top: 20 },
			],
			heights,
		} );

		expect( tops[ '2' ] ).toBe( tops[ '1' ] + 100 + DEFAULT_GAP );
	} );

	it( 'pins the selected card to its anchor and moves the others away', () => {
		const tops = calculateThreadTops( {
			anchors: [
				{ id: '1', top: 0 },
				{ id: '2', top: 20 },
				{ id: '3', top: 40 },
			],
			heights,
			selectedId: '2',
		} );

		// The one being read is exactly where it belongs.
		expect( tops[ '2' ] ).toBe( 20 + DEFAULT_ALIGN_OFFSET );

		// Its neighbours are pushed clear of it, in both directions.
		expect( tops[ '1' ] ).toBe( tops[ '2' ] - DEFAULT_GAP - 100 );
		expect( tops[ '3' ] ).toBe( tops[ '2' ] + 100 + DEFAULT_GAP );
	} );

	it( 'sorts by anchor position rather than trusting the given order', () => {
		const tops = calculateThreadTops( {
			anchors: [
				{ id: '3', top: 800 },
				{ id: '1', top: 0 },
				{ id: '2', top: 400 },
			],
			heights,
		} );

		expect( tops[ '1' ] ).toBeLessThan( tops[ '2' ] );
		expect( tops[ '2' ] ).toBeLessThan( tops[ '3' ] );
	} );

	it( 'treats an unmeasured card as having no height', () => {
		const tops = calculateThreadTops( {
			anchors: [
				{ id: '1', top: 0 },
				{ id: '2', top: 5 },
			],
			heights: {},
		} );

		expect( tops[ '2' ] ).toBe( tops[ '1' ] + DEFAULT_GAP );
	} );
} );

describe( 'parseNoteIds', () => {
	it( 'reads a single id', () => {
		expect( parseNoteIds( '12' ) ).toEqual( [ '12' ] );
	} );

	it( 'reads a comma separated list', () => {
		expect( parseNoteIds( '12,15, 18' ) ).toEqual( [ '12', '15', '18' ] );
	} );

	it( 'ignores anything that is not a note id', () => {
		expect( parseNoteIds( '12,,abc,-3,0x1' ) ).toEqual( [ '12' ] );
	} );

	it( 'copes with a missing attribute', () => {
		expect( parseNoteIds( null ) ).toEqual( [] );
		expect( parseNoteIds( '' ) ).toEqual( [] );
	} );
} );
