import { describe, expect, it } from 'vitest';
import {
	PENDING_ATTRIBUTES,
	markerForNote,
	mergeProposedAttributes,
	proposedAttributes,
	readSuggestionMarker,
	toJsonSafeAttributeValue,
	withProposedAttributes,
	withSuggestionMarker,
	withoutProposedAttributes,
} from '../marker';

describe( 'readSuggestionMarker', () => {
	it( 'returns the marker when it has a known type', () => {
		const marker = { type: 'pending-move', fromIndex: 1 };
		expect(
			readSuggestionMarker( { metadata: { suggestion: marker } } )
		).toBe( marker );
	} );
	it( 'returns null for a missing, malformed, or unknown marker', () => {
		expect( readSuggestionMarker( {} ) ).toBeNull();
		expect(
			readSuggestionMarker( { metadata: { suggestion: 'x' } } )
		).toBeNull();
		expect(
			readSuggestionMarker( {
				metadata: { suggestion: { type: 'future' } },
			} )
		).toBeNull();
		expect(
			readSuggestionMarker( {
				metadata: {
					suggestion: { type: PENDING_ATTRIBUTES, after: 'nope' },
				},
			} )
		).toBeNull();
	} );
} );

describe( 'proposedAttributes', () => {
	it( 'returns a non-empty after and null otherwise', () => {
		expect(
			proposedAttributes( {
				type: PENDING_ATTRIBUTES,
				after: { level: 3 },
			} )
		).toEqual( { level: 3 } );
		expect(
			proposedAttributes( { type: 'pending-move', after: {} } )
		).toBeNull();
		expect( proposedAttributes( null ) ).toBeNull();
	} );
} );

describe( 'toJsonSafeAttributeValue', () => {
	it( 'stringifies string-like objects and leaves JSON values alone', () => {
		const richText = { toString: () => '<p>hi</p>' };
		expect( toJsonSafeAttributeValue( richText ) ).toBe( '<p>hi</p>' );
		expect( toJsonSafeAttributeValue( 3 ) ).toBe( 3 );
		expect( toJsonSafeAttributeValue( { a: [ 1 ] } ) ).toEqual( {
			a: [ 1 ],
		} );
	} );
} );

describe( 'withProposedAttributes', () => {
	const live = { level: 2, align: 'left', metadata: { noteId: [ 7 ] } };
	it( 'opens a pending-attributes marker with the changed keys only', () => {
		const next = withProposedAttributes( {
			metadata: live.metadata,
			liveAttributes: live,
			changes: { level: 3, align: 'left' },
			authorId: 5,
		} );
		expect( next ).toEqual( {
			metadata: {
				noteId: [ 7 ],
				suggestion: {
					type: PENDING_ATTRIBUTES,
					authorId: 5,
					after: { level: 3 },
				},
			},
		} );
	} );
	it( 'keeps what is proposed when an edit echoes stored values', () => {
		// A block support panel reads the stored attributes and writes
		// every attribute it manages.
		const link = { color: { text: 'var:preset|color|accent' } };
		const metadata = {
			suggestion: {
				type: PENDING_ATTRIBUTES,
				authorId: 5,
				after: { textColor: 'accent', style: { elements: { link } } },
			},
		};
		const sized = withProposedAttributes( {
			metadata,
			liveAttributes: { content: 'x', metadata },
			changes: {
				style: undefined,
				textColor: undefined,
				fontFamily: undefined,
				fontSize: 'large',
			},
			authorId: 5,
		} );
		expect( sized.metadata.suggestion.after ).toEqual( {
			textColor: 'accent',
			style: { elements: { link } },
			fontSize: 'large',
		} );
		// Its change to `style` lands on the proposed value.
		const custom = withProposedAttributes( {
			metadata,
			liveAttributes: { content: 'x', metadata },
			changes: {
				style: { typography: { fontSize: '20px' } },
				textColor: undefined,
				fontSize: undefined,
			},
			authorId: 5,
		} );
		expect( custom.metadata.suggestion.after ).toEqual( {
			textColor: 'accent',
			style: {
				elements: { link },
				typography: { fontSize: '20px' },
			},
		} );
	} );
	it( 'withdraws a proposal an edit sets back to the stored value', () => {
		const metadata = {
			suggestion: {
				type: PENDING_ATTRIBUTES,
				authorId: 5,
				after: {
					fontSize: 'large',
					style: { typography: { textAlign: 'center' } },
				},
			},
		};
		// The block's own control, built from what the block is shown.
		const next = withProposedAttributes( {
			metadata,
			liveAttributes: { content: 'x', metadata },
			changes: { style: undefined },
			authorId: 5,
		} );
		expect( next.metadata.suggestion.after ).toEqual( {
			fontSize: 'large',
		} );
		// One setting of several inside `style`.
		const both = {
			suggestion: {
				type: PENDING_ATTRIBUTES,
				authorId: 5,
				after: {
					style: {
						typography: { textAlign: 'center' },
						color: { text: '#f00' },
					},
				},
			},
		};
		const uncentered = withProposedAttributes( {
			metadata: both,
			liveAttributes: { content: 'x', metadata: both },
			changes: { style: { color: { text: '#f00' } } },
			authorId: 5,
		} );
		expect( uncentered.metadata.suggestion.after ).toEqual( {
			style: { color: { text: '#f00' } },
		} );
	} );
	it( 'accumulates onto an existing after and keeps the marker type', () => {
		const metadata = {
			suggestion: {
				type: 'pending-move',
				fromIndex: 0,
				authorId: 5,
				after: { level: 3 },
			},
		};
		const next = withProposedAttributes( {
			metadata,
			liveAttributes: live,
			changes: { align: 'center' },
			authorId: 5,
		} );
		expect( next.metadata.suggestion ).toEqual( {
			type: 'pending-move',
			fromIndex: 0,
			authorId: 5,
			after: { level: 3, align: 'center' },
		} );
	} );
	it( 'drops a key that returns to the live value and clears an emptied pending-attributes marker', () => {
		const metadata = {
			noteId: [ 7 ],
			suggestion: {
				type: PENDING_ATTRIBUTES,
				authorId: 5,
				after: { level: 3 },
			},
		};
		const next = withProposedAttributes( {
			metadata,
			liveAttributes: live,
			changes: { level: 2 },
			authorId: 5,
		} );
		expect( next ).toEqual( { metadata: { noteId: [ 7 ] } } );
	} );
	it( 'keeps a structural marker when its after empties', () => {
		const metadata = {
			suggestion: {
				type: 'pending-move',
				authorId: 5,
				fromIndex: 0,
				after: { level: 3 },
			},
		};
		const next = withProposedAttributes( {
			metadata,
			liveAttributes: live,
			changes: { level: 2 },
			authorId: 5,
		} );
		expect( next.metadata.suggestion ).toEqual( {
			type: 'pending-move',
			authorId: 5,
			fromIndex: 0,
		} );
	} );
	it( 'never lets suggestion or noteId into after.metadata and one-level merges metadata', () => {
		const next = withProposedAttributes( {
			metadata: { noteId: [ 7 ], name: 'Old' },
			liveAttributes: { metadata: { noteId: [ 7 ], name: 'Old' } },
			changes: {
				metadata: {
					name: 'New',
					noteId: [ 9 ],
					suggestion: { type: 'pending-insert' },
				},
			},
			authorId: null,
		} );
		expect( next.metadata.suggestion.after ).toEqual( {
			metadata: { name: 'New' },
		} );
	} );
	it( 'treats an empty metadata change on a block without metadata as no proposal', () => {
		const next = withProposedAttributes( {
			metadata: undefined,
			liveAttributes: { content: 'B' },
			changes: { metadata: {} },
			authorId: 1,
		} );
		expect( next ).toEqual( { metadata: {} } );
	} );
	it( 'stores string-like values as strings', () => {
		const next = withProposedAttributes( {
			metadata: undefined,
			liveAttributes: { content: 'a' },
			changes: { content: { toString: () => 'b' } },
			authorId: 1,
		} );
		expect( next.metadata.suggestion.after ).toEqual( { content: 'b' } );
	} );
} );

describe( 'withSuggestionMarker', () => {
	it( 'keeps an existing after when the marker type changes', () => {
		const metadata = {
			suggestion: { type: PENDING_ATTRIBUTES, after: { level: 3 } },
		};
		expect(
			withSuggestionMarker( metadata, {
				type: 'pending-remove',
				authorId: 2,
			} ).suggestion
		).toEqual( {
			type: 'pending-remove',
			authorId: 2,
			after: { level: 3 },
		} );
	} );
	it( 'carries the note id across a type change so one note keeps both ops', () => {
		const metadata = {
			suggestion: {
				type: PENDING_ATTRIBUTES,
				commentId: 7,
				after: { level: 3 },
			},
		};
		expect(
			withSuggestionMarker( metadata, {
				type: 'pending-move',
				fromIndex: 1,
			} ).suggestion
		).toEqual( {
			type: 'pending-move',
			fromIndex: 1,
			commentId: 7,
			after: { level: 3 },
		} );
	} );
	it( 'lets an explicit after on the new marker win', () => {
		const metadata = {
			suggestion: { type: PENDING_ATTRIBUTES, after: { level: 3 } },
		};
		expect(
			withSuggestionMarker( metadata, {
				type: 'pending-move',
				after: { align: 'wide' },
			} ).suggestion.after
		).toEqual( { align: 'wide' } );
	} );
} );

describe( 'withoutProposedAttributes', () => {
	it( 'drops the whole marker for pending-attributes', () => {
		expect(
			withoutProposedAttributes( {
				noteId: [ 1 ],
				suggestion: { type: PENDING_ATTRIBUTES, after: { level: 3 } },
			} )
		).toEqual( { noteId: [ 1 ] } );
	} );
	it( 'drops only after on a structural marker', () => {
		expect(
			withoutProposedAttributes( {
				suggestion: {
					type: 'pending-move',
					fromIndex: 1,
					after: { level: 3 },
				},
			} )
		).toEqual( { suggestion: { type: 'pending-move', fromIndex: 1 } } );
	} );
	it( 'returns null when there is nothing to drop', () => {
		expect( withoutProposedAttributes( undefined ) ).toBeNull();
		expect(
			withoutProposedAttributes( {
				suggestion: { type: 'pending-move' },
			} )
		).toBeNull();
	} );
} );

describe( 'mergeProposedAttributes', () => {
	it( 'returns live by reference without after, replaces wholesale, deep-merges metadata', () => {
		const live = {
			level: 2,
			style: { color: 'red', fontSize: 'l' },
			metadata: { noteId: [ 1 ] },
		};
		expect( mergeProposedAttributes( live, null ) ).toBe( live );
		expect(
			mergeProposedAttributes( live, { style: { color: 'blue' } } ).style
		).toEqual( { color: 'blue' } );
		expect(
			mergeProposedAttributes( live, { metadata: { name: 'N' } } )
				.metadata
		).toEqual( { noteId: [ 1 ], name: 'N' } );
	} );
} );

describe( 'markerForNote', () => {
	const bob = { type: 'pending-attributes', commentId: 15, after: { a: 1 } };
	const anne = { type: 'pending-move', commentId: 12, nested: [ bob ] };

	it( 'finds the marker or nested entry that names the note', () => {
		const attributes = { metadata: { suggestion: anne } };
		expect( markerForNote( attributes, 12 )?.type ).toBe( 'pending-move' );
		expect( markerForNote( attributes, '15' ) ).toBe( bob );
		expect( markerForNote( attributes, 99 ) ).toBeNull();
	} );

	it( 'takes the only unlinked marker for a note the block links', () => {
		const unlinked = { type: 'pending-attributes', after: { a: 1 } };
		expect(
			markerForNote(
				{ metadata: { noteId: [ 7 ], suggestion: unlinked } },
				7
			)
		).toBe( unlinked );
		// Not linked from the block.
		expect(
			markerForNote( { metadata: { suggestion: unlinked } }, 7 )
		).toBeNull();
		// Two unlinked markers: no telling which is the note's.
		expect(
			markerForNote(
				{
					metadata: {
						noteId: [ 7, 8 ],
						suggestion: {
							type: 'pending-move',
							nested: [ unlinked ],
						},
					},
				},
				7
			)
		).toBeNull();
	} );
} );
