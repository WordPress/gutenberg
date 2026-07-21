import { ensureRelTokens } from '../ensure-rel-tokens';

describe( 'ensureRelTokens', () => {
	it( 'returns the required tokens when rel is undefined', () => {
		expect(
			ensureRelTokens( undefined, [ 'noopener', 'noreferrer' ] )
		).toBe( 'noopener noreferrer' );
	} );

	it( 'merges tokens into an existing rel value', () => {
		expect(
			ensureRelTokens( 'nofollow', [ 'noopener', 'noreferrer' ] )
				.split( /\s+/ )
				.sort()
		).toEqual( [ 'nofollow', 'noopener', 'noreferrer' ].sort() );
	} );

	it( 'deduplicates tokens already present in rel', () => {
		expect(
			ensureRelTokens( 'noopener nofollow', [ 'noopener', 'noreferrer' ] )
				.split( /\s+/ )
				.sort()
		).toEqual( [ 'nofollow', 'noopener', 'noreferrer' ].sort() );
	} );

	it( 'ignores empty tokens from a sparse rel string', () => {
		expect( ensureRelTokens( '  nofollow  ', [ 'noopener' ] ) ).toBe(
			'nofollow noopener'
		);
	} );
} );
