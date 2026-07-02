const clsx = require( 'clsx' );
const styles = require( '../scripts/style-mock' );

describe( 'style mock', () => {
	it( 'returns prefixed kebab-case class names for CSS Module properties', () => {
		expect( styles.root ).toBe( 'style-root' );
		expect( styles.className ).toBe( 'style-class-name' );
		expect( styles.singleLineClamp ).toBe( 'style-single-line-clamp' );
		expect( styles.Content ).toBe( 'style-content' );
		expect( styles[ 'already-kebab' ] ).toBe( 'style-already-kebab' );
	} );

	it( 'does not emit an undefined class when used with clsx object syntax', () => {
		const classes = clsx( {
			[ styles.conditionalClass ]: true,
		} );

		expect( classes ).toBe( 'style-conditional-class' );
		expect( classes ).not.toContain( 'undefined' );
	} );

	it( 'does not mark the CommonJS mock as an ES module', () => {
		expect( styles.__esModule ).toBeUndefined();
	} );

	it( 'ignores symbol property access', () => {
		expect( styles[ Symbol.toStringTag ] ).toBeUndefined();
	} );
} );
