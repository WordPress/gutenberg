/**
 * Internal dependencies
 */
import {
	createRevertToken,
	matchesRevertToken,
	createRevertGuard,
} from '../revert-guard';

/**
 * Structural-ish comparator mirroring the interceptor's contract closely
 * enough for the guard's needs: strict equality with an array/plain-object
 * value compare, so object-valued attributes match by value.
 *
 * @param {*} a First value.
 * @param {*} b Second value.
 * @return {boolean} True when equal.
 */
function valueEquals( a, b ) {
	if ( a === b ) {
		return true;
	}
	if ( typeof a !== 'object' || typeof b !== 'object' || ! a || ! b ) {
		return false;
	}
	return JSON.stringify( a ) === JSON.stringify( b );
}

describe( 'createRevertToken', () => {
	it( 'captures the clientId and a copy of the restore values', () => {
		const restore = { level: 2 };
		const token = createRevertToken( 'a', restore );
		expect( token ).toEqual( { clientId: 'a', values: { level: 2 } } );
		// The token snapshots the values (mutating the source doesn't change it).
		restore.level = 3;
		expect( token.values.level ).toBe( 2 );
	} );
} );

describe( 'matchesRevertToken', () => {
	it( 'matches when every restored key holds the expected value', () => {
		const token = createRevertToken( 'a', { level: 2, align: null } );
		expect(
			matchesRevertToken( token, 'a', { level: 2, align: null } )
		).toBe( true );
	} );

	it( 'ignores attributes the revert did not touch', () => {
		const token = createRevertToken( 'a', { level: 2 } );
		// A concurrent edit to an unrelated key doesn't break the match.
		expect(
			matchesRevertToken( token, 'a', { level: 2, content: 'edited' } )
		).toBe( true );
	} );

	it( 'does not match a different block', () => {
		const token = createRevertToken( 'a', { level: 2 } );
		expect( matchesRevertToken( token, 'b', { level: 2 } ) ).toBe( false );
	} );

	it( 'does not match when a restored value differs', () => {
		const token = createRevertToken( 'a', { level: 2 } );
		expect( matchesRevertToken( token, 'a', { level: 3 } ) ).toBe( false );
	} );

	it( 'treats an undefined restored value as an absent key', () => {
		// diffAttributes emits `restore[key] = undefined` for a key the mutation
		// added; the echo restores the block to not having that key.
		const token = createRevertToken( 'a', { newKey: undefined } );
		expect( matchesRevertToken( token, 'a', {} ) ).toBe( true );
		expect( matchesRevertToken( token, 'a', { newKey: 'x' } ) ).toBe(
			false
		);
	} );

	it( 'uses the supplied comparator for object-valued attributes', () => {
		const token = createRevertToken( 'a', { style: { color: 'red' } } );
		// Strict default: a fresh-but-equal object does not match.
		expect(
			matchesRevertToken( token, 'a', { style: { color: 'red' } } )
		).toBe( false );
		// Structural comparator: it matches.
		expect(
			matchesRevertToken(
				token,
				'a',
				{ style: { color: 'red' } },
				valueEquals
			)
		).toBe( true );
	} );
} );

describe( 'createRevertGuard', () => {
	it( 'recognizes a revert echo and consumes the token', () => {
		const guard = createRevertGuard( valueEquals );
		guard.expect( 'a', { level: 2 } );
		expect( guard.size() ).toBe( 1 );

		// The revert dispatch lands: the block is now back at level 2.
		expect( guard.isEcho( 'a', { level: 2 } ) ).toBe( true );
		// The token is consumed, so a later change back to level 2 is a real edit.
		expect( guard.size() ).toBe( 0 );
		expect( guard.isEcho( 'a', { level: 2 } ) ).toBe( false );
	} );

	it( 'does not swallow an unrelated change in the same tick', () => {
		const guard = createRevertGuard( valueEquals );
		guard.expect( 'a', { level: 2 } );
		// A different block changing is never an echo of block a's revert.
		expect( guard.isEcho( 'b', { level: 5 } ) ).toBe( false );
		// Block a changing to a value other than the expected revert is a real
		// edit, not the echo.
		expect( guard.isEcho( 'a', { level: 4 } ) ).toBe( false );
		// The token is still pending for the real echo.
		expect( guard.size() ).toBe( 1 );
		expect( guard.isEcho( 'a', { level: 2 } ) ).toBe( true );
	} );

	it( 'matches a delayed echo (arrives a tick later, not in a window)', () => {
		const guard = createRevertGuard( valueEquals );
		guard.expect( 'a', { align: 'left' } );
		// Several unrelated fires happen before the echo lands.
		guard.isEcho( 'c', { level: 1 } );
		guard.isEcho( 'd', { level: 1 } );
		// The echo is still recognized whenever it finally arrives.
		expect( guard.isEcho( 'a', { align: 'left' } ) ).toBe( true );
	} );

	it( 'queues multiple reverts for one block and consumes them FIFO', () => {
		const guard = createRevertGuard( valueEquals );
		guard.expect( 'a', { level: 2 } );
		guard.expect( 'a', { align: 'center' } );
		expect( guard.pending( 'a' ) ).toBe( 2 );

		// Each echo consumes exactly one matching token.
		expect( guard.isEcho( 'a', { align: 'center' } ) ).toBe( true );
		expect( guard.pending( 'a' ) ).toBe( 1 );
		expect( guard.isEcho( 'a', { level: 2 } ) ).toBe( true );
		expect( guard.pending( 'a' ) ).toBe( 0 );
	} );

	it( 'clears all pending tokens', () => {
		const guard = createRevertGuard( valueEquals );
		guard.expect( 'a', { level: 2 } );
		guard.expect( 'b', { level: 3 } );
		guard.clear();
		expect( guard.size() ).toBe( 0 );
		expect( guard.isEcho( 'a', { level: 2 } ) ).toBe( false );
	} );
} );
