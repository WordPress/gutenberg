import { describe, expect, it, vi } from 'vitest';
import {
	REACTIONS_ID_PATTERN,
	applyBlockReactionDelta,
	applyReactionSummaryDelta,
	ensureBlockReactionsId,
	generateReactionsId,
	getBlockReactionsId,
	getReactionsQueryArgs,
} from '../block-reactions';

describe( 'generateReactionsId', () => {
	it( 'matches the server pattern', () => {
		for ( let i = 0; i < 50; i++ ) {
			expect( generateReactionsId() ).toMatch( REACTIONS_ID_PATTERN );
		}
	} );

	it( 'does not repeat across many draws', () => {
		const ids = new Set(
			Array.from( { length: 200 }, () => generateReactionsId() )
		);
		expect( ids.size ).toBe( 200 );
	} );
} );

describe( 'getBlockReactionsId', () => {
	it( 'returns a well-formed id', () => {
		expect( getBlockReactionsId( { reactionsId: 'abc123xy' } ) ).toBe(
			'abc123xy'
		);
	} );

	it( 'ignores a malformed or non-string id', () => {
		expect( getBlockReactionsId( { reactionsId: 'ABC' } ) ).toBeUndefined();
		expect(
			getBlockReactionsId( { reactionsId: 12345678 } )
		).toBeUndefined();
		expect( getBlockReactionsId( undefined ) ).toBeUndefined();
	} );
} );

describe( 'ensureBlockReactionsId', () => {
	const cleanEmptyObject = < T >( object: T ) => object;

	it( 'returns the stored id without writing', () => {
		const updateBlockAttributes = vi.fn();
		const id = ensureBlockReactionsId( 'client', {
			getBlockAttributes: () => ( {
				metadata: { reactionsId: 'stored12' },
			} ),
			updateBlockAttributes,
			cleanEmptyObject,
		} );

		expect( id ).toBe( 'stored12' );
		expect( updateBlockAttributes ).not.toHaveBeenCalled();
	} );

	it( 'mints and writes an id when none is stored', () => {
		const updateBlockAttributes = vi.fn();
		const id = ensureBlockReactionsId( 'client', {
			getBlockAttributes: () => ( {} ),
			updateBlockAttributes,
			cleanEmptyObject,
			generateId: () => 'minted01',
		} );

		expect( id ).toBe( 'minted01' );
		expect( updateBlockAttributes ).toHaveBeenCalledWith( 'client', {
			metadata: { reactionsId: 'minted01' },
		} );
	} );

	it( 'keeps other metadata keys when writing', () => {
		const updateBlockAttributes = vi.fn();
		ensureBlockReactionsId( 'client', {
			getBlockAttributes: () => ( {
				metadata: { noteId: [ 4 ], name: 'Intro' },
			} ),
			updateBlockAttributes,
			cleanEmptyObject,
			generateId: () => 'minted01',
		} );

		expect( updateBlockAttributes ).toHaveBeenCalledWith( 'client', {
			metadata: { noteId: [ 4 ], name: 'Intro', reactionsId: 'minted01' },
		} );
	} );
} );

describe( 'applyReactionSummaryDelta', () => {
	it( 'adds a first reaction', () => {
		expect( applyReactionSummaryDelta( undefined, 'heart', 9 ) ).toEqual( {
			heart: { count: 1, reacted: true, my_reaction_id: 9 },
		} );
	} );

	it( 'increments an existing slug', () => {
		expect(
			applyReactionSummaryDelta(
				{ heart: { count: 2, reacted: false } },
				'heart',
				9
			)
		).toEqual( { heart: { count: 3, reacted: true, my_reaction_id: 9 } } );
	} );

	it( 'decrements and clears reacted', () => {
		expect(
			applyReactionSummaryDelta(
				{ heart: { count: 2, reacted: true, my_reaction_id: 9 } },
				'heart'
			)
		).toEqual( { heart: { count: 1, reacted: false } } );
	} );

	it( 'drops the slug at zero', () => {
		expect(
			applyReactionSummaryDelta(
				{ heart: { count: 1, reacted: true, my_reaction_id: 9 } },
				'heart'
			)
		).toEqual( {} );
	} );

	it( 'ignores removal of an unknown slug', () => {
		const summary = { heart: { count: 1, reacted: false } };
		expect( applyReactionSummaryDelta( summary, 'rocket' ) ).toEqual(
			summary
		);
	} );
} );

describe( 'applyBlockReactionDelta', () => {
	it( 'creates the anchor key', () => {
		expect( applyBlockReactionDelta( {}, 'blockaaa', 'heart', 9 ) ).toEqual(
			{
				blockaaa: {
					heart: { count: 1, reacted: true, my_reaction_id: 9 },
				},
			}
		);
	} );

	it( 'removes an emptied anchor key', () => {
		expect(
			applyBlockReactionDelta(
				{
					blockaaa: {
						heart: { count: 1, reacted: true, my_reaction_id: 9 },
					},
				},
				'blockaaa',
				'heart'
			)
		).toEqual( {} );
	} );

	it( 'leaves other anchors untouched by reference', () => {
		const other = { rocket: { count: 4, reacted: false } };
		const next = applyBlockReactionDelta(
			{ blockbbb: other },
			'blockaaa',
			'heart',
			9
		);
		expect( next.blockbbb ).toBe( other );
	} );
} );

describe( 'getReactionsQueryArgs', () => {
	it( 'scopes a note target by parent', () => {
		expect( getReactionsQueryArgs( { kind: 'note', id: 12 } ) ).toEqual( {
			parent: 12,
			type: 'reaction',
			status: 'all',
		} );
	} );

	it( 'scopes a block target by post, parent 0 and anchor', () => {
		expect(
			getReactionsQueryArgs( {
				kind: 'block',
				postId: 7,
				reactionsId: 'blockaaa',
			} )
		).toEqual( {
			post: 7,
			parent: 0,
			block: 'blockaaa',
			type: 'reaction',
			status: 'all',
		} );
	} );
} );
