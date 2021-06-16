/**
 * Internal dependencies
 */
import compose from '../';

describe( 'compose', () => {
	it( 'composes empty array to identity that returns the first arg', () => {
		const id = compose();
		expect( id( 1 ) ).toBe( 1 );
		expect( id( 'a', 'b' ) ).toBe( 'a' );
	} );

	it( 'composes functions together', () => {
		const sumSquareInc = compose(
			( a ) => a + 1,
			( a ) => a ** 2,
			( a, b ) => a + b
		);
		expect( sumSquareInc( 2, 3 ) ).toBe( 26 );
	} );

	it( 'composes while maintaining the this binding', () => {
		const decorate = compose(
			function ( s ) {
				return s + this.suffix;
			},
			function ( s ) {
				return this.prefix + s;
			}
		);
		const obj = {
			prefix: 'pre-',
			suffix: '-ation',
			decorate,
		};
		expect( obj.decorate( 'serv' ) ).toBe( 'pre-serv-ation' );
	} );
} );
