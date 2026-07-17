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
			commentId: null,
			syncedOpsKey: null,
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

	it( 'stamps structural ops with the capture sequence and keeps attribute stamps', () => {
		const withBaseline = overlayReducer( INITIAL, {
			type: 'CAPTURE_BASELINE',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			attributes: { content: 'A' },
		} );
		const withAttr = overlayReducer( withBaseline, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: CLIENT_ID,
			attributes: { content: 'B' },
			seq: 3,
		} );
		const withOp = overlayReducer( withAttr, {
			type: 'SET_STRUCTURAL_OP',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			op: { type: 'block-remove' },
			seq: 5,
		} );
		expect( withOp[ CLIENT_ID ].structuralOpSeq ).toBe( 5 );
		// The attribute stamp survives the structural rewrite of the entry.
		expect( withOp[ CLIENT_ID ].lastEditSeq ).toBe( 3 );
	} );

	it( 'stamps overlay writes with the capture sequence and keeps the last one', () => {
		const withBaseline = overlayReducer( INITIAL, {
			type: 'CAPTURE_BASELINE',
			clientId: CLIENT_ID,
			blockName: 'core/heading',
			attributes: { level: 2 },
		} );
		const first = overlayReducer( withBaseline, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: CLIENT_ID,
			attributes: { level: 3 },
			seq: 7,
		} );
		expect( first[ CLIENT_ID ].lastEditSeq ).toBe( 7 );

		// A later write without a sequence (reducer-level consumers) keeps
		// the previous stamp instead of clearing it.
		const second = overlayReducer( first, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: CLIENT_ID,
			attributes: { level: 4 },
		} );
		expect( second[ CLIENT_ID ].lastEditSeq ).toBe( 7 );

		const third = overlayReducer( second, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: CLIENT_ID,
			attributes: { level: 5 },
			seq: 9,
		} );
		expect( third[ CLIENT_ID ].lastEditSeq ).toBe( 9 );
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

	it( 'stores a comment id on the entry', () => {
		const withEntry = overlayReducer( INITIAL, {
			type: 'CAPTURE_BASELINE',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			attributes: {},
		} );
		const withCommentId = overlayReducer( withEntry, {
			type: 'SET_COMMENT_ID',
			clientId: CLIENT_ID,
			commentId: 42,
		} );
		expect( withCommentId[ CLIENT_ID ].commentId ).toBe( 42 );
		// Clearing the id is permitted.
		const cleared = overlayReducer( withCommentId, {
			type: 'SET_COMMENT_ID',
			clientId: CLIENT_ID,
			commentId: null,
		} );
		expect( cleared[ CLIENT_ID ].commentId ).toBeNull();
	} );

	it( 'stores a synced operations fingerprint on the entry', () => {
		const withEntry = overlayReducer( INITIAL, {
			type: 'CAPTURE_BASELINE',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			attributes: {},
		} );
		const synced = overlayReducer( withEntry, {
			type: 'SET_SYNCED_OPS_KEY',
			clientId: CLIENT_ID,
			syncedOpsKey: 'fingerprint-1',
		} );
		expect( synced[ CLIENT_ID ].syncedOpsKey ).toBe( 'fingerprint-1' );
	} );

	it( 'ignores SET_COMMENT_ID without a captured baseline', () => {
		const next = overlayReducer( INITIAL, {
			type: 'SET_COMMENT_ID',
			clientId: CLIENT_ID,
			commentId: 1,
		} );
		expect( next ).toBe( INITIAL );
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

	it( 'creates an entry on SET_STRUCTURAL_OP when none existed', () => {
		const op = {
			type: 'block-remove',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
		};
		const next = overlayReducer( INITIAL, {
			type: 'SET_STRUCTURAL_OP',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			op,
		} );
		expect( next[ CLIENT_ID ] ).toMatchObject( {
			blockName: 'core/paragraph',
			structuralOp: op,
			baselineAttributes: {},
			overlayAttributes: {},
			commentId: null,
			syncedOpsKey: null,
		} );
	} );

	it( 'preserves attribute-overlay state when adding a structural op to an existing entry', () => {
		let state = overlayReducer( INITIAL, {
			type: 'CAPTURE_BASELINE',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			attributes: { content: 'baseline' },
		} );
		state = overlayReducer( state, {
			type: 'SET_OVERLAY_ATTRIBUTES',
			clientId: CLIENT_ID,
			attributes: { content: 'edited' },
		} );
		state = overlayReducer( state, {
			type: 'SET_STRUCTURAL_OP',
			clientId: CLIENT_ID,
			blockName: 'core/paragraph',
			op: { type: 'block-remove', clientId: CLIENT_ID },
		} );
		expect( state[ CLIENT_ID ].baselineAttributes ).toEqual( {
			content: 'baseline',
		} );
		expect( state[ CLIENT_ID ].overlayAttributes ).toEqual( {
			content: 'edited',
		} );
		expect( state[ CLIENT_ID ].structuralOp ).toEqual( {
			type: 'block-remove',
			clientId: CLIENT_ID,
		} );
	} );
} );
