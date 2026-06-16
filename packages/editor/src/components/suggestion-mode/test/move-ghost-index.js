/**
 * Internal dependencies
 */
import { buildMoveGhostIndex } from '../move-ghost-index';

const resolvers = ( existingIds, siblingsByParent ) => ( {
	blockExists: ( id ) => existingIds.includes( id ),
	getSiblings: ( parentId ) => siblingsByParent[ parentId ] ?? [],
} );

describe( 'buildMoveGhostIndex', () => {
	it( 'indexes a move with a live previous-sibling anchor under "after"', () => {
		const moved = [
			{
				clientId: 'm1',
				name: 'core/paragraph',
				authorId: 7,
				fromAnchorClientId: 'a1',
				fromParentClientId: '',
				fromIndex: 3,
			},
		];
		const { after, before } = buildMoveGhostIndex(
			moved,
			resolvers( [ 'a1' ], {} )
		);
		expect( after.get( 'a1' ) ).toEqual( [ moved[ 0 ] ] );
		expect( before.size ).toBe( 0 );
	} );

	it( "falls back to the old parent's first sibling when the anchor is null", () => {
		const moved = [
			{
				clientId: 'm1',
				name: 'core/paragraph',
				authorId: null,
				fromAnchorClientId: null,
				fromParentClientId: 'grp',
				fromIndex: 0,
			},
		];
		const { after, before } = buildMoveGhostIndex(
			moved,
			resolvers( [], { grp: [ 'm1', 's1', 's2' ] } )
		);
		// 'm1' is skipped (it is the moved block); first real sibling is 's1'.
		expect( before.get( 's1' ) ).toEqual( [ moved[ 0 ] ] );
		expect( after.size ).toBe( 0 );
	} );

	it( 'falls back to "before" when the anchor block no longer exists', () => {
		const moved = [
			{
				clientId: 'm1',
				name: 'core/paragraph',
				authorId: null,
				fromAnchorClientId: 'gone',
				fromParentClientId: '',
				fromIndex: 2,
			},
		];
		const { after, before } = buildMoveGhostIndex(
			moved,
			resolvers( [], { '': [ 'top1', 'm1' ] } )
		);
		expect( before.get( 'top1' ) ).toEqual( [ moved[ 0 ] ] );
		expect( after.size ).toBe( 0 );
	} );

	it( 'groups multiple moves sharing an anchor in fromIndex order', () => {
		const later = {
			clientId: 'm2',
			name: 'core/heading',
			authorId: 1,
			fromAnchorClientId: 'a1',
			fromParentClientId: '',
			fromIndex: 9,
		};
		const earlier = {
			clientId: 'm1',
			name: 'core/paragraph',
			authorId: 1,
			fromAnchorClientId: 'a1',
			fromParentClientId: '',
			fromIndex: 4,
		};
		const { after } = buildMoveGhostIndex(
			[ later, earlier ],
			resolvers( [ 'a1' ], {} )
		);
		expect( after.get( 'a1' ) ).toEqual( [ earlier, later ] );
	} );

	it( 'skips a previous-sibling anchor that is itself pending-moved', () => {
		// `b` was `c`'s previous sibling, but `b` is also moving away. Using
		// `b` as the anchor would render `c`'s ghost wherever `b` lands, not
		// at `c`'s original spot, so `c` falls back to the first surviving
		// sibling instead.
		const movedB = {
			clientId: 'b',
			name: 'core/paragraph',
			authorId: 1,
			fromAnchorClientId: 'a',
			fromParentClientId: '',
			fromIndex: 1,
		};
		const movedC = {
			clientId: 'c',
			name: 'core/heading',
			authorId: 1,
			fromAnchorClientId: 'b',
			fromParentClientId: '',
			fromIndex: 2,
		};
		const { after, before } = buildMoveGhostIndex(
			[ movedB, movedC ],
			// `a` and `b` both still exist in the tree; `a` survives, `b` is moved.
			resolvers( [ 'a', 'b' ], { '': [ 'a', 'd' ] } )
		);
		// `b` anchors to the surviving `a`; `c` cannot anchor to the moved
		// `b`, so it falls back to the first surviving sibling `a`.
		expect( after.get( 'a' ) ).toEqual( [ movedB ] );
		expect( after.has( 'b' ) ).toBe( false );
		expect( before.get( 'a' ) ).toEqual( [ movedC ] );
	} );

	it( 'excludes pending-moved blocks from the first-sibling fallback', () => {
		// `m1` was the first child (null anchor). Its first remaining sibling
		// `s1` is itself pending-moved, so the ghost must skip it and anchor
		// on the next surviving sibling `s2`. `s1` is given its own surviving
		// anchor so its placement doesn't collide with the assertion.
		const movedFirst = {
			clientId: 'm1',
			name: 'core/paragraph',
			authorId: null,
			fromAnchorClientId: null,
			fromParentClientId: 'grp',
			fromIndex: 0,
		};
		const movedSibling = {
			clientId: 's1',
			name: 'core/paragraph',
			authorId: null,
			fromAnchorClientId: 'outside',
			fromParentClientId: 'grp',
			fromIndex: 1,
		};
		const { after, before } = buildMoveGhostIndex(
			[ movedFirst, movedSibling ],
			resolvers( [ 's1', 's2', 'outside' ], {
				grp: [ 'm1', 's1', 's2' ],
			} )
		);
		// `m1` skips the moved `s1` and lands on the surviving `s2`.
		expect( before.get( 's2' ) ).toEqual( [ movedFirst ] );
		expect( before.has( 's1' ) ).toBe( false );
		// `s1` itself anchors to its own surviving previous sibling.
		expect( after.get( 'outside' ) ).toEqual( [ movedSibling ] );
	} );

	it( 'renders no ghost when the old parent has no other children', () => {
		const moved = [
			{
				clientId: 'm1',
				name: 'core/paragraph',
				authorId: null,
				fromAnchorClientId: null,
				fromParentClientId: 'grp',
				fromIndex: 0,
			},
		];
		const { after, before } = buildMoveGhostIndex(
			moved,
			resolvers( [], { grp: [ 'm1' ] } )
		);
		expect( after.size ).toBe( 0 );
		expect( before.size ).toBe( 0 );
	} );
} );
