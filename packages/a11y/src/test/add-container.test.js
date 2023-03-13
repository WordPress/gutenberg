/**
 * Internal dependencies
 */
import addContainer from '../add-container';

describe( 'addContainer', () => {
	describe( 'with polite param', () => {
		it( 'should create an aria-live element with aria-live attr set to polite', () => {
			const container = addContainer( 'polite' );

			expect( container ).not.toBeNull();
			expect( container.className ).toBe( 'a11y-speak-region' );
			expect( container.id ).toBe( 'a11y-speak-polite' );
			expect( container ).toHaveAttribute( 'style' );
			expect( container ).toHaveAttribute( 'aria-live', 'polite' );
			expect( container ).toHaveAttribute(
				'aria-relevant',
				'additions text'
			);
			expect( container ).toHaveAttribute( 'aria-atomic', 'true' );
		} );
	} );

	describe( 'with assertive param', () => {
		it( 'should create an aria-live element with aria-live attr set to assertive', () => {
			const container = addContainer( 'assertive' );

			expect( container ).not.toBeNull();
			expect( container.className ).toBe( 'a11y-speak-region' );
			expect( container.id ).toBe( 'a11y-speak-assertive' );
			expect( container ).toHaveAttribute( 'style' );
			expect( container ).toHaveAttribute( 'aria-live', 'assertive' );
			expect( container ).toHaveAttribute(
				'aria-relevant',
				'additions text'
			);
			expect( container ).toHaveAttribute( 'aria-atomic', 'true' );
		} );
	} );

	describe( 'without param', () => {
		it( 'should default to creating an aria-live element with aria-live attr set to polite', () => {
			const container = addContainer( 'polite' );

			expect( container ).not.toBeNull();
			expect( container.className ).toBe( 'a11y-speak-region' );
			expect( container.id ).toBe( 'a11y-speak-polite' );
			expect( container ).toHaveAttribute( 'style' );
			expect( container ).toHaveAttribute( 'aria-live', 'polite' );
			expect( container ).toHaveAttribute(
				'aria-relevant',
				'additions text'
			);
			expect( container ).toHaveAttribute( 'aria-atomic', 'true' );
		} );
	} );
} );
