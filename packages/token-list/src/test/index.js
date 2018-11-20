/**
 * Internal dependencies
 */
import TokenList from '../';

describe( 'token-list', () => {
	describe( 'constructor', () => {
		it( 'should instantiate instance with no initial value', () => {
			const list = new TokenList();

			expect( list.value ).toBe( '' );
			expect( list ).toHaveLength( 0 );
		} );

		it( 'should instantiate instance with empty initial value', () => {
			const list = new TokenList( '' );

			expect( list.value ).toBe( '' );
			expect( list ).toHaveLength( 0 );
		} );

		it( 'should instantiate instance with initial value', () => {
			const list = new TokenList( 'abc   ' );

			expect( list.value ).toBe( 'abc' );
			expect( list ).toHaveLength( 1 );
		} );

		describe( 'array method inheritence', () => {
			it( 'entries', () => {
				const list = new TokenList( 'abc   ' );

				expect( [ ...list.entries() ] ).toEqual( [ [ 0, 'abc' ] ] );
			} );

			it( 'forEach', () => {
				expect.assertions( 1 );

				const list = new TokenList( 'abc   ' );

				list.forEach( ( item ) => expect( item ).toBe( 'abc' ) );
			} );

			it( 'values', () => {
				const list = new TokenList( 'abc   ' );

				expect( [ ...list.values() ] ).toEqual( [ 'abc' ] );
			} );

			it( 'keys', () => {
				const list = new TokenList( 'abc   ' );

				expect( [ ...list.keys() ] ).toEqual( [ 0 ] );
			} );
		} );
	} );

	describe( 'value', () => {
		it( 'gets the stringified value', () => {
			const list = new TokenList( 'abc   ' );

			expect( list.value ).toBe( 'abc' );
		} );

		it( 'sets to stringified value', () => {
			const list = new TokenList();
			list.value = undefined;

			expect( list.value ).toBe( 'undefined' );
		} );

		it( 'is the stringifier of the instance', () => {
			const list = new TokenList( 'abc   ' );

			expect( String( list ) ).toBe( 'abc' );
		} );
	} );

	describe( 'Symbol.iterator', () => {
		it( 'returns a generator', () => {
			const list = new TokenList();

			expect( list[ Symbol.iterator ]().next ).toEqual( expect.any( Function ) );
		} );

		it( 'yields entries', () => {
			expect.assertions( 2 );

			const classes = [ 'abc', 'def' ];
			const list = new TokenList( classes.join( ' ' ) );

			let i = 0;
			for ( const item of list ) {
				expect( item ).toBe( classes[ i++ ] );
			}
		} );
	} );

	describe( 'item', () => {
		it( 'should return undefined if item at index does not exist', () => {
			const list = new TokenList();

			expect( list.item( 0 ) ).toBeUndefined();
		} );

		it( 'should return item at index', () => {
			const list = new TokenList( 'abc' );

			expect( list.item( 0 ) ).toBe( 'abc' );
		} );
	} );

	describe( 'contains', () => {
		it( 'should return false if token does not exist', () => {
			const list = new TokenList();

			expect( list.contains( 'abc' ) ).toBe( false );
		} );

		it( 'should return true if token exists', () => {
			const list = new TokenList( 'abc' );

			expect( list.contains( 'abc' ) ).toBe( true );
		} );
	} );

	describe( 'add', () => {
		it( 'does nothing if token already exists', () => {
			const list = new TokenList( 'abc' );
			const returnValue = list.add( 'abc' );

			expect( list.value ).toBe( 'abc' );
			expect( list ).toHaveLength( 1 );
			expect( returnValue ).toBeUndefined();
		} );

		it( 'does nothing if token already exists (whitespace variation)', () => {
			const list = new TokenList( 'abc   ' );
			const returnValue = list.add( '' );

			expect( list.value ).toBe( 'abc' );
			expect( list ).toHaveLength( 1 );
			expect( returnValue ).toBeUndefined();
		} );

		it( 'does not add an empty token', () => {
			const list = new TokenList( 'abc' );
			const returnValue = list.add( '' );

			expect( list.value ).toBe( 'abc' );
			expect( list ).toHaveLength( 1 );
			expect( returnValue ).toBeUndefined();
		} );

		it( 'adds token to empty initial value', () => {
			const list = new TokenList();
			const returnValue = list.add( 'abc' );

			expect( list.value ).toBe( 'abc' );
			expect( list ).toHaveLength( 1 );
			expect( returnValue ).toBeUndefined();
		} );

		it( 'adds token to non-empty initial value', () => {
			const list = new TokenList( 'abc' );
			const returnValue = list.add( 'def' );

			expect( list.value ).toBe( 'abc def' );
			expect( list ).toHaveLength( 2 );
			expect( returnValue ).toBeUndefined();
		} );

		it( 'adds multiple tokens, uniquely', () => {
			const list = new TokenList( 'abc' );
			const returnValue = list.add( 'abc', 'def', 'ghi' );

			expect( list.value ).toBe( 'abc def ghi' );
			expect( list ).toHaveLength( 3 );
			expect( returnValue ).toBeUndefined();
		} );
	} );

	describe( 'remove', () => {
		it( 'does nothing if token does not exist', () => {
			const list = new TokenList( 'abc' );
			const returnValue = list.remove( 'def' );

			expect( list.value ).toBe( 'abc' );
			expect( list ).toHaveLength( 1 );
			expect( returnValue ).toBeUndefined();
		} );

		it( 'removes token', () => {
			const list = new TokenList( 'abc def' );
			const returnValue = list.remove( 'def' );

			expect( list.value ).toBe( 'abc' );
			expect( list ).toHaveLength( 1 );
			expect( returnValue ).toBeUndefined();
		} );

		it( 'removes multiple tokens', () => {
			const list = new TokenList( 'abc def' );
			const returnValue = list.remove( 'abc', 'def' );

			expect( list.value ).toBe( '' );
			expect( list ).toHaveLength( 0 );
			expect( returnValue ).toBeUndefined();
		} );
	} );

	describe( 'replace', () => {
		it( 'does nothing if token does not exist', () => {
			const list = new TokenList( 'abc' );
			const returnValue = list.replace( 'def', 'ghi' );

			expect( list.value ).toBe( 'abc' );
			expect( list ).toHaveLength( 1 );
			expect( returnValue ).toBe( false );
		} );

		it( 'removes token', () => {
			const list = new TokenList( 'abc def' );
			const returnValue = list.replace( 'def', 'ghi' );

			expect( list.value ).toBe( 'abc ghi' );
			expect( list ).toHaveLength( 2 );
			expect( returnValue ).toBe( true );
		} );
	} );

	describe( 'supports', () => {
		it( 'returns true', () => {
			const list = new TokenList( 'abc def' );

			expect( list.supports( 'does-not-matter' ) ).toBe( true );
		} );
	} );

	describe( 'toggle', () => {
		describe( 'without force', () => {
			it( 'toggles off', () => {
				const list = new TokenList( 'abc' );
				const returnValue = list.toggle( 'abc' );

				expect( list.value ).toBe( '' );
				expect( list ).toHaveLength( 0 );
				expect( returnValue ).toBe( false );
			} );

			it( 'toggles on', () => {
				const list = new TokenList();
				const returnValue = list.toggle( 'abc' );

				expect( list.value ).toBe( 'abc' );
				expect( list ).toHaveLength( 1 );
				expect( returnValue ).toBe( true );
			} );
		} );

		describe( 'with force', () => {
			it( 'toggles off', () => {
				const list = new TokenList( 'abc' );
				const returnValue = list.toggle( 'abc', false );

				expect( list.value ).toBe( '' );
				expect( list ).toHaveLength( 0 );
				expect( returnValue ).toBe( false );
			} );

			it( 'toggles on', () => {
				const list = new TokenList( 'abc' );
				const returnValue = list.toggle( 'abc', true );

				expect( list.value ).toBe( 'abc' );
				expect( list ).toHaveLength( 1 );
				expect( returnValue ).toBe( true );
			} );
		} );
	} );
} );
