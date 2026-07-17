/**
 * Internal dependencies
 */
import { findNewestWithdrawableSuggestion } from '../suggestion-undo-guard';

describe( 'findNewestWithdrawableSuggestion', () => {
	it( 'returns null when nothing is pending', () => {
		expect( findNewestWithdrawableSuggestion( {}, null ) ).toBeNull();
		expect(
			findNewestWithdrawableSuggestion( undefined, null )
		).toBeNull();
	} );

	it( 'ignores entries whose overlay equals their baseline', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 2 },
				lastEditSeq: 5,
			},
		};
		expect( findNewestWithdrawableSuggestion( entries, null ) ).toBeNull();
	} );

	it( 'ignores unstamped attribute entries', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 3 },
			},
		};
		expect( findNewestWithdrawableSuggestion( entries, null ) ).toBeNull();
	} );

	it( 'picks the most recently edited pending attribute entry', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 3 },
				lastEditSeq: 4,
			},
			'block-2': {
				baselineAttributes: { content: 'A' },
				overlayAttributes: { content: 'B' },
				lastEditSeq: 8,
			},
		};
		expect( findNewestWithdrawableSuggestion( entries, null ) ).toEqual( {
			kind: 'attribute',
			clientId: 'block-2',
			entry: entries[ 'block-2' ],
			seq: 8,
		} );
	} );

	it( 'includes a structural entry only while its pending marker is live', () => {
		const entries = {
			'block-1': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-move' },
				structuralOpSeq: 9,
			},
		};
		const withMarker = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-move' } },
			} ),
		};
		expect(
			findNewestWithdrawableSuggestion( entries, withMarker )
		).toEqual( {
			kind: 'structural',
			clientId: 'block-1',
			entry: entries[ 'block-1' ],
			seq: 9,
		} );

		// Marker gone (already resolved or withdrawn): stale overlay state,
		// not a candidate.
		const withoutMarker = {
			getBlockAttributes: () => ( { metadata: {} } ),
		};
		expect(
			findNewestWithdrawableSuggestion( entries, withoutMarker )
		).toBeNull();
	} );

	it( 'leaves block-remove suggestions to the real undo stack', () => {
		const entries = {
			'block-1': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-remove' },
				structuralOpSeq: 9,
			},
		};
		const blockEditor = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-remove' } },
			} ),
		};
		expect(
			findNewestWithdrawableSuggestion( entries, blockEditor )
		).toBeNull();
	} );

	it( 'orders attribute and structural candidates by capture sequence', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 3 },
				lastEditSeq: 12,
			},
			'block-2': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-move' },
				structuralOpSeq: 7,
			},
		};
		const blockEditor = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-move' } },
			} ),
		};
		expect(
			findNewestWithdrawableSuggestion( entries, blockEditor )
		).toMatchObject( { kind: 'attribute', clientId: 'block-1' } );
	} );
} );
