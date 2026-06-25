const styles = require( '../style-mock' );

describe( 'style mock', () => {
	it( 'returns identity class names for CSS Module properties', () => {
		expect( styles.root ).toBe( 'root' );
		expect( styles.className ).toBe( 'className' );
		expect( styles.singleLineClamp ).toBe( 'singleLineClamp' );
		expect( styles[ 'already-kebab' ] ).toBe( 'already-kebab' );
	} );

	it( 'does not emit an undefined class when used as an object key', () => {
		const classes = {
			[ styles.conditionalClass ]: true,
		};

		expect(
			Object.keys( classes ).filter(
				( className ) => classes[ className ]
			)
		).toEqual( [ 'conditionalClass' ] );
		expect( classes ).not.toHaveProperty( 'undefined' );
	} );

	it( 'does not mark the CommonJS mock as an ES module', () => {
		expect( styles.__esModule ).toBe( false );
	} );

	it( 'ignores symbol property access', () => {
		expect( styles[ Symbol.toStringTag ] ).toBeUndefined();
	} );
} );
