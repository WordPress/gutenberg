/**
 * Internal dependencies
 */
import { overlayReducer } from '../overlay-context';

describe( 'overlayReducer', () => {
	const CLIENT_ID = 'abc-123';
	const INITIAL = Object.freeze( {} );

	it( 'captures a baseline once per client id', () => {
		const afterFirst = overlayReducer( INITIAL, {
			type: 'CAPTURE_BASELINE',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			attributes: { content: 'Hello' },
		} );
		expect( afterFirst[ CLIENT_ID ] ).toEqual( {
			blockName: 'core/paragraph',
			baselineAttributes: { content: 'Hello' },
			overlayAttributes: {},
		} );

		const afterSecond = overlayReducer( afterFirst, {
			type: 'CAPTURE_BASELINE',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			attributes: { content: 'CHANGED' },
		} );
		expect( afterSecond ).toBe( afterFirst );
	} );

	it( 'merges overlay attributes over an existing entry', () => {
		const withBaseline = overlayReducer( INITIAL, {
			type: 'CAPTURE_BASELINE',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			attributes: { content: 'A', level: 2 },
		} );
		const withOverlay = overlayReducer( withBaseline, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: CLIENT_ID,
			attributes: { content: 'B' },
		} );
		expect( withOverlay[ CLIENT_ID ].overlayAttributes ).toEqual( {
			content: 'B',
		} );
		expect( withOverlay[ CLIENT_ID ].baselineAttributes ).toEqual( {
			content: 'A',
			level: 2,
		} );

		const updated = overlayReducer( withOverlay, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: CLIENT_ID,
			attributes: { level: 3 },
		} );
		expect( updated[ CLIENT_ID ].overlayAttributes ).toEqual( {
			content: 'B',
			level: 3,
		} );
	} );

	it( 'ignores overlay writes without a captured baseline', () => {
		const next = overlayReducer( INITIAL, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: CLIENT_ID,
			attributes: { content: 'Nope' },
		} );
		expect( next ).toBe( INITIAL );
	} );

	it( 'removes an entry on clear', () => {
		const withEntry = overlayReducer( INITIAL, {
			type: 'CAPTURE_BASELINE',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			attributes: {},
		} );
		const cleared = overlayReducer( withEntry, {
			type: 'CLEAR_OVERLAY',
			clientId: CLIENT_ID,
		} );
		expect( cleared ).toEqual( {} );
		expect( cleared ).not.toBe( withEntry );
	} );

	it( 'returns the same reference for unknown actions', () => {
		const next = overlayReducer( INITIAL, { type: 'UNKNOWN' } );
		expect( next ).toBe( INITIAL );
	} );

	it( 'prunes entries whose clientId is no longer live', () => {
		const state = {
			'alive-1': {
				blockName: 'core/paragraph',
				baselineAttributes: {},
				overlayAttributes: { content: 'hi' },
			},
			'orphan-1': {
				blockName: 'core/paragraph',
				baselineAttributes: {},
				overlayAttributes: { content: 'gone' },
			},
		};
		const next = overlayReducer( state, {
			type: 'PRUNE_ORPHANS',
			liveClientIds: new Set( [ 'alive-1' ] ),
		} );
		expect( Object.keys( next ) ).toEqual( [ 'alive-1' ] );
	} );

	it( 'returns the same reference when no orphans are present', () => {
		const state = {
			'alive-1': {
				blockName: 'core/paragraph',
				baselineAttributes: {},
				overlayAttributes: {},
			},
		};
		const next = overlayReducer( state, {
			type: 'PRUNE_ORPHANS',
			liveClientIds: new Set( [ 'alive-1', 'other' ] ),
		} );
		expect( next ).toBe( state );
	} );

	it( 'isolates overlays between multiple blocks', () => {
		// Two blocks both get baselines and overlays; each is tracked
		// independently.
		let state = overlayReducer( INITIAL, {
			type: 'CAPTURE_BASELINE',
			clientId: 'block-a',
			blockName: 'core/paragraph',
			attributes: { content: 'A-original' },
		} );
		state = overlayReducer( state, {
			type: 'CAPTURE_BASELINE',
			clientId: 'block-b',
			blockName: 'core/heading',
			attributes: { content: 'B-original', level: 2 },
		} );
		state = overlayReducer( state, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: 'block-a',
			attributes: { content: 'A-proposed' },
		} );
		state = overlayReducer( state, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: 'block-b',
			attributes: { level: 3 },
		} );

		expect( state[ 'block-a' ].overlayAttributes ).toEqual( {
			content: 'A-proposed',
		} );
		expect( state[ 'block-b' ].overlayAttributes ).toEqual( { level: 3 } );
		expect( state[ 'block-b' ].baselineAttributes ).toEqual( {
			content: 'B-original',
			level: 2,
		} );

		// Clearing one doesn't affect the other.
		const afterClear = overlayReducer( state, {
			type: 'CLEAR_OVERLAY',
			clientId: 'block-a',
		} );
		expect( afterClear[ 'block-a' ] ).toBeUndefined();
		expect( afterClear[ 'block-b' ] ).toEqual( state[ 'block-b' ] );
	} );

	it( 'seeds a full entry from a persisted suggestion comment', () => {
		// The hydrator path bypasses CAPTURE_BASELINE / SET_OVERLAY_ATTRIBUTES
		// in favor of one atomic write so a hydrated entry is identifiable
		// (via `hydratedFromCommentId`) and never collides with the existing
		// "CAPTURE_BASELINE is a no-op when an entry exists" rule.
		const seeded = overlayReducer( INITIAL, {
			type: 'SEED_FROM_COMMENT',
			clientId: 'block-a',
			blockName: 'core/paragraph',
			commentId: 42,
			baselineAttributes: { content: 'before' },
			overlayAttributes: { content: 'after' },
		} );

		expect( seeded[ 'block-a' ] ).toEqual( {
			blockName: 'core/paragraph',
			baselineAttributes: { content: 'before' },
			overlayAttributes: { content: 'after' },
			commentId: 42,
			authorId: null,
			syncedOpsKey: null,
			hydratedFromCommentId: 42,
		} );
	} );

	it( 'records the suggestion author id on a seeded entry', () => {
		// The author id lets the overlay tint inline marks with the
		// suggester's color rather than the current viewer's.
		const seeded = overlayReducer( INITIAL, {
			type: 'SEED_FROM_COMMENT',
			clientId: 'block-a',
			blockName: 'core/paragraph',
			commentId: 42,
			baselineAttributes: { content: 'before' },
			overlayAttributes: { content: 'after' },
			authorId: 7,
		} );

		expect( seeded[ 'block-a' ].authorId ).toBe( 7 );
	} );

	it( 'preserves an existing syncedOpsKey when re-seeding the same entry', () => {
		// After auto-save sets the sync fingerprint, a re-hydration on the
		// next mount must not zero it out — otherwise auto-save would re-fire
		// for an already-persisted payload on every reload.
		const withSynced = {
			'block-a': {
				blockName: 'core/paragraph',
				baselineAttributes: { content: 'before' },
				overlayAttributes: { content: 'after' },
				commentId: 42,
				syncedOpsKey: 'op-hash',
				hydratedFromCommentId: 42,
			},
		};
		const reseeded = overlayReducer( withSynced, {
			type: 'SEED_FROM_COMMENT',
			clientId: 'block-a',
			blockName: 'core/paragraph',
			commentId: 42,
			baselineAttributes: { content: 'before' },
			overlayAttributes: { content: 'after-2' },
		} );

		expect( reseeded[ 'block-a' ].syncedOpsKey ).toBe( 'op-hash' );
		expect( reseeded[ 'block-a' ].overlayAttributes ).toEqual( {
			content: 'after-2',
		} );
	} );
} );
