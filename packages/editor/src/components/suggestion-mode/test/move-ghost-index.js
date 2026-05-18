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
