import { describe, expect, it } from 'vitest';
import {
	PENDING_ATTRIBUTES,
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
