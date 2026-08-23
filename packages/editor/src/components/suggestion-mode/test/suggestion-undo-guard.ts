import { findNewestPendingSuggestion } from '../suggestion-undo-guard';

describe( 'findNewestPendingSuggestion', () => {
	it( 'returns null when nothing is pending', () => {
		expect( findNewestPendingSuggestion( {}, null ) ).toBeNull();
		expect( findNewestPendingSuggestion( undefined, null ) ).toBeNull();
	} );

	it( 'ignores entries whose overlay equals their baseline', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 2 },
				lastEditSeq: 5,
			},
		};
		expect( findNewestPendingSuggestion( entries, null ) ).toBeNull();
	} );

	it( 'ignores unstamped attribute entries', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 3 },
			},
		};
		expect( findNewestPendingSuggestion( entries, null ) ).toBeNull();
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
		expect( findNewestPendingSuggestion( entries, null ) ).toEqual( {
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
		expect( findNewestPendingSuggestion( entries, withMarker ) ).toEqual( {
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
			findNewestPendingSuggestion( entries, withoutMarker )
		).toBeNull();
	} );

	it( 'marks a block-remove as owned by the real undo stack', () => {
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
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( { kind: 'history', clientId: 'block-1', seq: 9 } );
	} );

	it( 'lets a stale block-remove fall away once its marker is gone', () => {
		const entries = {
			'block-1': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-remove' },
				structuralOpSeq: 9,
			},
			'block-2': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-insert-after' },
				structuralOpSeq: 4,
			},
		};
		// The removal has already been reverted through history; only the
		// insertion still carries a live marker.
		const blockEditor = {
			getBlockAttributes: ( clientId: string ) =>
				clientId === 'block-2'
					? {
							metadata: {
								suggestion: { type: 'pending-insert' },
							},
					  }
					: { metadata: {} },
		};
		expect(
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( { kind: 'structural', clientId: 'block-2', seq: 4 } );
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
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( { kind: 'attribute', clientId: 'block-1' } );
	} );

	it( 'lets a newer block-remove shadow an older withdrawable suggestion', () => {
		const entries = {
			'inserted-block': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-insert-after' },
				structuralOpSeq: 4,
			},
			'doomed-block': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-remove' },
				structuralOpSeq: 5,
			},
		};
		const blockEditor = {
			getBlockAttributes: ( clientId: string ) => ( {
				metadata: {
					suggestion: {
						type:
							clientId === 'doomed-block'
								? 'pending-remove'
								: 'pending-insert',
					},
				},
			} ),
		};
		// Newest-first: the removal is the newer action, so the guard must
		// report it rather than the insertion it could withdraw itself.
		expect(
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( {
			kind: 'history',
			clientId: 'doomed-block',
			seq: 5,
		} );
	} );

	it( 'lets a newer block-remove shadow an older attribute suggestion', () => {
		const entries = {
			'heading-block': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 3 },
				lastEditSeq: 4,
			},
			'doomed-block': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-remove' },
				structuralOpSeq: 5,
			},
		};
		const blockEditor = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-remove' } },
			} ),
		};
		expect(
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( { kind: 'history', clientId: 'doomed-block' } );
	} );
} );
