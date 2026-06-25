const clsx = require( 'clsx' );
const styles = require( '../style-mock' );

describe( 'style mock', () => {
	it( 'returns prefixed class names for CSS Module properties', () => {
		expect( styles.root ).toBe( 'style-root' );
		expect( styles.className ).toBe( 'style-className' );
	} );

	it( 'does not emit an undefined class when used with clsx object syntax', () => {
		const classes = clsx( {
			[ styles.conditionalClass ]: true,
		} );

		expect( classes ).toBe( 'style-conditionalClass' );
		expect( classes ).not.toContain( 'undefined' );
	} );

	it( 'does not mark the CommonJS mock as an ES module', () => {
		expect( styles.__esModule ).toBeUndefined();
	} );

	it( 'ignores symbol property access', () => {
		expect( styles[ Symbol.toStringTag ] ).toBeUndefined();
	} );
} );
