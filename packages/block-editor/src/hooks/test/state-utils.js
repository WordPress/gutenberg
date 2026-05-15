/**
 * Internal dependencies
 */
import {
	getRelativeRootSelector,
	buildScopedBlockSelector,
} from '../state-utils';

describe( 'getRelativeRootSelector', () => {
	it( 'returns the descendant part of a space-combinator selector', () => {
		expect(
			getRelativeRootSelector( '.wp-block-button .wp-block-button__link' )
		).toBe( '.wp-block-button__link' );
	} );

	it( 'preserves explicit child combinators', () => {
		expect( getRelativeRootSelector( '.wp-block-foo > .inner' ) ).toBe(
			'> .inner'
		);
	} );

	it( 'preserves multi-level descendants', () => {
		expect( getRelativeRootSelector( '.wp-block-foo .bar .baz' ) ).toBe(
			'.bar .baz'
		);
	} );

	it( 'returns null for a single-class selector', () => {
		expect( getRelativeRootSelector( '.wp-block-foo' ) ).toBeNull();
	} );
} );

describe( 'buildScopedBlockSelector', () => {
	const BASE = '.wp-elements-abc123';

	it( 'scopes a suffix to the descendant element from a block selector', () => {
		expect(
			buildScopedBlockSelector(
				BASE,
				'.wp-block-button .wp-block-button__link',
				':hover'
			)
		).toBe( `${ BASE } .wp-block-button__link:hover` );
	} );

	it( 'works for :focus and :active states', () => {
		expect(
			buildScopedBlockSelector(
				BASE,
				'.wp-block-button .wp-block-button__link',
				':focus'
			)
		).toBe( `${ BASE } .wp-block-button__link:focus` );
		expect(
			buildScopedBlockSelector(
				BASE,
				'.wp-block-button .wp-block-button__link',
				':active'
			)
		).toBe( `${ BASE } .wp-block-button__link:active` );
	} );

	it( 'falls back to appending the suffix to the base selector when there is no descendant', () => {
		expect(
			buildScopedBlockSelector( BASE, '.wp-block-button', ':hover' )
		).toBe( `${ BASE }:hover` );
	} );

	it( 'falls back to appending the suffix to the base selector when the block selector is missing', () => {
		expect( buildScopedBlockSelector( BASE, undefined, ':hover' ) ).toBe(
			`${ BASE }:hover`
		);
	} );
} );
