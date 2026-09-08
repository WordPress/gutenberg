import { describe, expect, it } from 'vitest';
import { arrayMoveWithPinned } from '../array-move-with-pinned';

const pinned = new Set( [ 'p' ] );
const isPinned = ( key: string ) => pinned.has( key );

describe( 'arrayMoveWithPinned', () => {
	it( 'moves like arrayMove when nothing is pinned', () => {
		expect(
			arrayMoveWithPinned( [ 'a', 'b', 'c' ], 2, 0, () => false )
		).toEqual( [ 'c', 'a', 'b' ] );
	} );

	it( 'keeps a pinned item at its index when another crosses it', () => {
		expect(
			arrayMoveWithPinned( [ 'a', 'p', 'b' ], 2, 0, isPinned )
		).toEqual( [ 'b', 'p', 'a' ] );
	} );

	it( 'keeps a pinned first item first', () => {
		expect(
			arrayMoveWithPinned( [ 'p', 'a', 'b' ], 2, 0, isPinned )
		).toEqual( [ 'p', 'b', 'a' ] );
	} );

	it( 'does not move a pinned item', () => {
		expect(
			arrayMoveWithPinned( [ 'a', 'p', 'b' ], 1, 2, isPinned )
		).toEqual( [ 'a', 'p', 'b' ] );
	} );

	it( 'holds several pinned items at once', () => {
		const many = new Set( [ 'p', 'q' ] );
		expect(
			arrayMoveWithPinned( [ 'p', 'a', 'q', 'b', 'c' ], 4, 1, ( key ) =>
				many.has( key )
			)
		).toEqual( [ 'p', 'c', 'q', 'a', 'b' ] );
	} );
} );
