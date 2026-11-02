/**
 * Several authors' suggestions on one block (#73411, phase C): the block's
 * marker is the outermost suggestion, `nested` holds the others.
 */
import { describe, expect, it } from 'vitest';
import {
	authorMarker,
	displayedProposal,
	markerAnchorKeys,
	readSuggestionMarkers,
	withAuthorMarker,
	withProposedAttributes,
	withoutMarkerEntry,
	withoutOutdatedProposals,
	withoutProposedAttributes,
} from '../marker';
import { clearSuggestionMarkerAttributes } from '../operations';

const anne = 3;
const bob = 7;

describe( 'readSuggestionMarkers', () => {
	it( 'lists the marker and its nested entries, dropping malformed ones', () => {
		const metadata = {
			suggestion: {
				type: 'pending-insert',
				authorId: anne,
				commentId: 12,
				nested: [
					{ type: 'pending-remove', authorId: bob, commentId: 15 },
					{ type: 'future' },
					'x',
				],
			},
		};
		expect(
			readSuggestionMarkers( { metadata } ).map( ( m ) => m.commentId )
		).toEqual( [ 12, 15 ] );
	} );
	it( 'returns an empty list without a marker', () => {
		expect( readSuggestionMarkers( {} ) ).toEqual( [] );
	} );
} );

describe( 'authorMarker', () => {
	const metadata = {
		suggestion: {
			type: 'pending-attributes',
			authorId: anne,
			after: { level: 3 },
			nested: [
				{
					type: 'pending-attributes',
					authorId: bob,
					after: { align: 'wide' },
				},
			],
		},
	};
	it( 'finds the entry the author wrote, outer or nested', () => {
		expect( authorMarker( { metadata }, anne )?.after ).toEqual( {
			level: 3,
		} );
		expect( authorMarker( { metadata }, bob )?.after ).toEqual( {
			align: 'wide',
		} );
		expect( authorMarker( { metadata }, 99 ) ).toBeNull();
	} );
	it( 'treats a marker without an author as anyone’s', () => {
		expect(
			authorMarker(
				{ metadata: { suggestion: { type: 'pending-remove' } } },
				bob
			)?.type
		).toBe( 'pending-remove' );
	} );
} );

describe( 'withProposedAttributes across authors', () => {
	it( 'keys a second author’s change as their own nested proposal', () => {
		const metadata = {
			suggestion: {
				type: 'pending-attributes',
				authorId: anne,
				commentId: 12,
				after: { level: 3 },
			},
		};
		const { metadata: next } = withProposedAttributes( {
			metadata,
			liveAttributes: { level: 2, align: 'none' },
			changes: { align: 'wide' },
			authorId: bob,
		} );
		expect( next.suggestion ).toEqual( {
			type: 'pending-attributes',
			authorId: anne,
			commentId: 12,
			after: { level: 3 },
			nested: [
				{
					type: 'pending-attributes',
					authorId: bob,
					after: { align: 'wide' },
				},
			],
		} );
	} );
	it( 'compares the second author’s change with what they saw', () => {
		const metadata = {
			suggestion: {
				type: 'pending-attributes',
				authorId: anne,
				after: { level: 3 },
			},
		};
		// Bob sets the level Anne proposed: nothing of his own to propose.
		const { metadata: next } = withProposedAttributes( {
			metadata,
			liveAttributes: { level: 2 },
			changes: { level: 3 },
			authorId: bob,
		} );
		expect( next.suggestion.nested ).toBeUndefined();
		expect( next.suggestion.after ).toEqual( { level: 3 } );
	} );
	it( 'drops the nested entry once it proposes nothing', () => {
		const metadata = {
			suggestion: {
				type: 'pending-attributes',
				authorId: anne,
				after: { level: 3 },
				nested: [
					{
						type: 'pending-attributes',
						authorId: bob,
						after: { align: 'wide' },
					},
				],
			},
		};
		const { metadata: next } = withProposedAttributes( {
			metadata,
			liveAttributes: { level: 2, align: 'none' },
			changes: { align: 'none' },
			authorId: bob,
		} );
		expect( next.suggestion ).toEqual( {
			type: 'pending-attributes',
			authorId: anne,
			after: { level: 3 },
		} );
	} );
	it( 'lifts the next suggestion out when the outer one is withdrawn', () => {
		const metadata = {
			suggestion: {
				type: 'pending-attributes',
				authorId: anne,
				after: { level: 3 },
				nested: [
					{
						type: 'pending-attributes',
						authorId: bob,
						commentId: 15,
						after: { align: 'wide' },
					},
				],
			},
		};
		const { metadata: next } = withProposedAttributes( {
			metadata,
			liveAttributes: { level: 2, align: 'none' },
			changes: { level: 2 },
			authorId: anne,
		} );
		expect( next.suggestion ).toEqual( {
			type: 'pending-attributes',
			authorId: bob,
			commentId: 15,
			after: { align: 'wide' },
		} );
	} );
} );

describe( 'withAuthorMarker', () => {
	it( 'writes a first marker as the block’s marker', () => {
		expect(
			withAuthorMarker( { noteId: 4 }, bob, {
				type: 'pending-remove',
				authorId: bob,
			} )
		).toEqual( {
			noteId: 4,
			suggestion: { type: 'pending-remove', authorId: bob },
		} );
	} );
	it( 'nests a removal under another author’s insertion', () => {
		const metadata = {
			suggestion: {
				type: 'pending-insert',
				authorId: anne,
				commentId: 12,
			},
		};
		expect(
			withAuthorMarker( metadata, bob, {
				type: 'pending-remove',
				authorId: bob,
			} ).suggestion
		).toEqual( {
			type: 'pending-insert',
			authorId: anne,
			commentId: 12,
			nested: [ { type: 'pending-remove', authorId: bob } ],
		} );
	} );
	it( 'keeps the author’s nested proposal and note on their removal', () => {
		const metadata = {
			suggestion: {
				type: 'pending-move',
				authorId: anne,
				nested: [
					{
						type: 'pending-attributes',
						authorId: bob,
						commentId: 15,
						after: { align: 'wide' },
					},
				],
			},
		};
		expect(
			withAuthorMarker( metadata, bob, {
				type: 'pending-remove',
				authorId: bob,
			} ).suggestion.nested
		).toEqual( [
			{
				type: 'pending-remove',
				authorId: bob,
				commentId: 15,
				after: { align: 'wide' },
			},
		] );
	} );
	it( 'replaces the author’s own marker as before', () => {
		const metadata = {
			suggestion: {
				type: 'pending-attributes',
				authorId: bob,
				commentId: 15,
				after: { align: 'wide' },
			},
		};
		expect(
			withAuthorMarker( metadata, bob, {
				type: 'pending-remove',
				authorId: bob,
			} ).suggestion
		).toEqual( {
			type: 'pending-remove',
			authorId: bob,
			commentId: 15,
			after: { align: 'wide' },
		} );
	} );
} );

describe( 'displayedProposal', () => {
	it( 'merges every proposal in note id order, later ones on top', () => {
		const marker = {
			type: 'pending-attributes' as const,
			authorId: bob,
			commentId: 15,
			after: { align: 'wide', level: 4 },
			nested: [
				{
					type: 'pending-attributes' as const,
					authorId: anne,
					commentId: 12,
					after: { level: 3, metadata: { name: 'A' } },
				},
				// Not saved yet: newest, so last.
				{
					type: 'pending-attributes' as const,
					authorId: 9,
					after: { metadata: { bindings: {} } },
				},
			],
		};
		expect( displayedProposal( marker ) ).toEqual( {
			level: 4,
			align: 'wide',
			metadata: { name: 'A', bindings: {} },
		} );
	} );
	it( 'is null when nothing is proposed', () => {
		expect(
			displayedProposal( { type: 'pending-remove', nested: [] } )
		).toBeNull();
		expect( displayedProposal( null ) ).toBeNull();
	} );
} );

describe( 'withoutMarkerEntry', () => {
	const metadata = {
		noteId: [ 12, 15 ],
		suggestion: {
			type: 'pending-insert',
			authorId: anne,
			commentId: 12,
			nested: [
				{ type: 'pending-remove', authorId: bob, commentId: 15 },
			],
		},
	};
	it( 'drops a nested entry by note id', () => {
		expect( withoutMarkerEntry( metadata, 15 ) ).toEqual( {
			noteId: [ 12, 15 ],
			suggestion: {
				type: 'pending-insert',
				authorId: anne,
				commentId: 12,
			},
		} );
	} );
	it( 'lifts the next entry out when the outer one goes', () => {
		expect( withoutMarkerEntry( metadata, 12 ) ).toEqual( {
			noteId: [ 12, 15 ],
			suggestion: {
				type: 'pending-remove',
				authorId: bob,
				commentId: 15,
			},
		} );
	} );
	it( 'returns null when no entry has that note', () => {
		expect( withoutMarkerEntry( metadata, 99 ) ).toBeNull();
	} );
} );

describe( 'clearing the outer marker keeps the nested ones', () => {
	it( 'lifts the first nested entry out', () => {
		expect(
			clearSuggestionMarkerAttributes( {
				metadata: {
					suggestion: {
						type: 'pending-insert',
						authorId: anne,
						nested: [
							{
								type: 'pending-remove',
								authorId: bob,
								commentId: 15,
							},
						],
					},
				},
			} )
		).toEqual( {
			metadata: {
				suggestion: {
					type: 'pending-remove',
					authorId: bob,
					commentId: 15,
				},
			},
		} );
	} );
	it( 'drops a proposal on the outer marker only', () => {
		expect(
			withoutProposedAttributes( {
				suggestion: {
					type: 'pending-attributes',
					authorId: anne,
					after: { level: 3 },
					nested: [
						{
							type: 'pending-attributes',
							authorId: bob,
							after: { align: 'wide' },
						},
					],
				},
			} )
		).toEqual( {
			suggestion: {
				type: 'pending-attributes',
				authorId: bob,
				after: { align: 'wide' },
			},
		} );
	} );
} );

describe( 'withoutOutdatedProposals', () => {
	it( 'drops attribute proposals that no longer change the block', () => {
		const metadata = {
			suggestion: {
				type: 'pending-attributes',
				authorId: anne,
				commentId: 12,
				after: { level: 3 },
				nested: [
					{
						type: 'pending-attributes',
						authorId: bob,
						commentId: 15,
						after: { level: 3, align: 'wide' },
					},
					{
						type: 'pending-remove',
						authorId: 9,
						commentId: 18,
					},
				],
			},
		};
		// Anne's level 3 was just accepted.
		expect(
			withoutOutdatedProposals( metadata, { level: 3, align: 'none' } )
		).toEqual( {
			suggestion: {
				type: 'pending-attributes',
				authorId: bob,
				commentId: 15,
				after: { align: 'wide' },
				nested: [
					{
						type: 'pending-remove',
						authorId: 9,
						commentId: 18,
					},
				],
			},
		} );
	} );
	it( 'returns the metadata untouched when every proposal still applies', () => {
		const metadata = {
			suggestion: {
				type: 'pending-attributes',
				authorId: anne,
				after: { level: 3 },
			},
		};
		expect( withoutOutdatedProposals( metadata, { level: 2 } ) ).toBe(
			metadata
		);
	} );
} );

describe( 'markerAnchorKeys', () => {
	it( 'anchors each entry by its own note', () => {
		expect(
			markerAnchorKeys( {
				noteId: [ 12, 15, 20 ],
				suggestion: {
					type: 'pending-insert',
					authorId: anne,
					commentId: 12,
					nested: [
						{
							type: 'pending-attributes',
							authorId: bob,
							commentId: 15,
							after: { align: 'wide' },
						},
					],
				},
			} )
		).toEqual( [
			[ 12, 'pending-insert' ],
			[ 15, 'pending-attributes' ],
		] );
	} );
	it( 'falls back to the block’s note links for a marker without an id', () => {
		expect(
			markerAnchorKeys( {
				noteId: [ 12 ],
				suggestion: {
					type: 'pending-move',
					after: { align: 'wide' },
				},
			} )
		).toEqual( [
			[ 12, 'pending-move' ],
			[ 12, 'pending-attributes' ],
		] );
	} );
} );
