import {
	NOTE_ANCHOR_META,
	UNKNOWN_ANCHOR,
	countThreadsByAnchor,
	getAnchorLabels,
	getThreadAnchor,
	groupThreadsByAnchor,
} from '../anchors';

const thread = ( id, anchor, status = 'hold' ) => ( {
	id,
	status,
	meta: anchor === undefined ? undefined : { [ NOTE_ANCHOR_META ]: anchor },
} );

const LABELS = {
	'core/button': 'Button',
	typography: 'Typography',
	'theme-colors': 'Colors',
};

describe( 'getThreadAnchor', () => {
	it( 'reads the anchor meta', () => {
		expect( getThreadAnchor( thread( 1, 'core/button' ) ) ).toBe(
			'core/button'
		);
	} );

	it( 'returns an empty string when the note carries no meta', () => {
		expect( getThreadAnchor( thread( 1, undefined ) ) ).toBe( '' );
	} );

	it( 'returns an empty string when the anchor is not a string', () => {
		// The meta is free-form on the server, so a client writing the wrong
		// type must not reach the grouping code as a non-string key.
		expect( getThreadAnchor( thread( 1, 42 ) ) ).toBe( '' );
	} );

	it( 'tolerates a missing thread', () => {
		expect( getThreadAnchor( undefined ) ).toBe( '' );
	} );
} );

describe( 'getAnchorLabels', () => {
	it( 'maps example names to their Style Book titles', () => {
		expect(
			getAnchorLabels( [
				{ name: 'core/button', title: 'Button' },
				{ name: 'typography', title: 'Typography' },
			] )
		).toEqual( { 'core/button': 'Button', typography: 'Typography' } );
	} );

	it( 'keeps the Style Book title rather than the block title', () => {
		// The Style Book renders the Heading block as "Headings".
		expect(
			getAnchorLabels( [ { name: 'core/heading', title: 'Headings' } ] )[
				'core/heading'
			]
		).toBe( 'Headings' );
	} );

	it( 'keeps the first title when a name repeats across categories', () => {
		expect(
			getAnchorLabels( [
				{ name: 'theme-colors', title: 'Colors' },
				{ name: 'theme-colors', title: 'Theme Colors' },
			] )
		).toEqual( { 'theme-colors': 'Colors' } );
	} );

	it( 'preserves example order', () => {
		expect(
			Object.keys(
				getAnchorLabels( [
					{ name: 'typography', title: 'Typography' },
					{ name: 'core/button', title: 'Button' },
				] )
			)
		).toEqual( [ 'typography', 'core/button' ] );
	} );

	it( 'returns an empty map for no examples', () => {
		expect( getAnchorLabels( [] ) ).toEqual( {} );
	} );
} );

describe( 'groupThreadsByAnchor', () => {
	it( 'groups threads under their example', () => {
		const groups = groupThreadsByAnchor(
			[ thread( 1, 'core/button' ), thread( 2, 'core/button' ) ],
			LABELS
		);

		expect( groups ).toHaveLength( 1 );
		expect( groups[ 0 ].anchor ).toBe( 'core/button' );
		expect( groups[ 0 ].label ).toBe( 'Button' );
		expect( groups[ 0 ].threads.map( ( t ) => t.id ) ).toEqual( [ 1, 2 ] );
	} );

	it( 'orders groups the way the Style Book renders its examples', () => {
		const groups = groupThreadsByAnchor(
			[ thread( 1, 'theme-colors' ), thread( 2, 'core/button' ) ],
			LABELS
		);

		expect( groups.map( ( group ) => group.anchor ) ).toEqual( [
			'core/button',
			'theme-colors',
		] );
	} );

	it( 'preserves thread order within a group', () => {
		const groups = groupThreadsByAnchor(
			[ thread( 7, 'typography' ), thread( 3, 'typography' ) ],
			LABELS
		);

		expect( groups[ 0 ].threads.map( ( t ) => t.id ) ).toEqual( [ 7, 3 ] );
	} );

	it( 'collects anchors with no matching example into the unknown bucket', () => {
		const groups = groupThreadsByAnchor(
			[ thread( 1, 'my-plugin/gone' ) ],
			LABELS
		);

		expect( groups ).toHaveLength( 1 );
		expect( groups[ 0 ].anchor ).toBe( UNKNOWN_ANCHOR );
		expect( groups[ 0 ].label ).toBe( 'Other notes' );
	} );

	it( 'puts anchorless notes in the unknown bucket rather than dropping them', () => {
		const groups = groupThreadsByAnchor(
			[ thread( 1, undefined ) ],
			LABELS
		);

		expect( groups[ 0 ].threads.map( ( t ) => t.id ) ).toEqual( [ 1 ] );
	} );

	it( 'sorts the unknown bucket last', () => {
		const groups = groupThreadsByAnchor(
			[ thread( 1, 'my-plugin/gone' ), thread( 2, 'core/button' ) ],
			LABELS
		);

		expect( groups.map( ( group ) => group.anchor ) ).toEqual( [
			'core/button',
			UNKNOWN_ANCHOR,
		] );
	} );

	it( 'omits the unknown bucket when every anchor resolves', () => {
		const groups = groupThreadsByAnchor(
			[ thread( 1, 'core/button' ) ],
			LABELS
		);

		expect(
			groups.some( ( group ) => group.anchor === UNKNOWN_ANCHOR )
		).toBe( false );
	} );

	it( 'returns no groups for no threads', () => {
		expect( groupThreadsByAnchor( [], LABELS ) ).toEqual( [] );
	} );

	it( 'buckets everything as unknown when no examples are registered', () => {
		// A theme that registers no blocks the Style Book can preview still has
		// to show existing notes somewhere.
		const groups = groupThreadsByAnchor(
			[ thread( 1, 'core/button' ) ],
			{}
		);

		expect( groups.map( ( group ) => group.anchor ) ).toEqual( [
			UNKNOWN_ANCHOR,
		] );
	} );
} );

describe( 'countThreadsByAnchor', () => {
	it( 'counts threads per anchor', () => {
		expect(
			countThreadsByAnchor( [
				thread( 1, 'core/button' ),
				thread( 2, 'core/button' ),
				thread( 3, 'typography' ),
			] )
		).toEqual( { 'core/button': 2, typography: 1 } );
	} );

	it( 'counts resolved threads too, so a badge does not vanish on resolve', () => {
		expect(
			countThreadsByAnchor( [ thread( 1, 'core/button', 'approved' ) ] )
		).toEqual( { 'core/button': 1 } );
	} );

	it( 'ignores anchorless threads, which no example can display', () => {
		expect( countThreadsByAnchor( [ thread( 1, undefined ) ] ) ).toEqual(
			{}
		);
	} );

	it( 'returns an empty map for no threads', () => {
		expect( countThreadsByAnchor( [] ) ).toEqual( {} );
	} );
} );
