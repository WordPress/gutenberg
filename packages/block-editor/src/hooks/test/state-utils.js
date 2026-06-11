/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getRelativeRootSelector,
	buildScopedBlockSelector,
	buildRootStyleStateSelector,
	buildPseudoStyleStateSelector,
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

	it( 'preserves modifier classes on the first compound selector', () => {
		expect(
			buildScopedBlockSelector(
				BASE,
				'.wp-block-search.wp-block-search__button-outside .wp-block-search__input',
				':hover'
			)
		).toBe(
			`${ BASE }.wp-block-search__button-outside .wp-block-search__input:hover`
		);
	} );

	it( 'preserves child combinators without surrounding spaces', () => {
		expect(
			buildScopedBlockSelector( BASE, '.wp-block-foo>.inner', ':hover' )
		).toBe( `${ BASE }>.inner:hover` );
	} );

	it( 'splits selector lists without splitting selector-function arguments', () => {
		expect(
			buildScopedBlockSelector(
				BASE,
				'.wp-block-example:not(.foo, .bar) .inner, .wp-block-example .fallback',
				':hover'
			)
		).toBe(
			`${ BASE }:not(.foo, .bar) .inner:hover, ${ BASE } .fallback:hover`
		);
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

	it( 'does not split selector lists on commas inside pseudo-class arguments', () => {
		expect(
			buildScopedBlockSelector(
				BASE,
				'.wp-block-navigation :is(.current-menu-item, .current-menu-ancestor)',
				':hover'
			)
		).toBe(
			`${ BASE } :is(.current-menu-item, .current-menu-ancestor):hover`
		);
	} );
} );

describe( 'state selector builders', () => {
	const BASE = '.wp-elements-abc123';

	beforeEach( () => {
		registerBlockType( 'test/button', {
			apiVersion: 3,
			title: 'Button',
			category: 'text',
			attributes: {},
			edit: () => null,
			save: () => null,
			selectors: {
				root: '.wp-block-button .wp-block-button__link',
			},
		} );
		registerBlockType( 'test/plain', {
			apiVersion: 3,
			title: 'Plain',
			category: 'text',
			attributes: {},
			edit: () => null,
			save: () => null,
		} );
	} );

	afterEach( () => {
		unregisterBlockType( 'test/button' );
		unregisterBlockType( 'test/plain' );
	} );

	it( 'scopes root state styles to the descendant element from selectors.root', () => {
		expect( buildRootStyleStateSelector( BASE, 'test/button' ) ).toBe(
			`${ BASE } .wp-block-button__link`
		);
	} );

	it( 'falls back to the base selector when block has no selectors.root', () => {
		expect( buildRootStyleStateSelector( BASE, 'test/plain' ) ).toBe(
			BASE
		);
	} );

	it( 'scopes pseudo states to the descendant element from selectors.root', () => {
		expect(
			buildPseudoStyleStateSelector( BASE, 'test/button', ':hover' )
		).toBe( `${ BASE } .wp-block-button__link:hover` );
	} );

	it( 'works for :focus and :active states', () => {
		expect(
			buildPseudoStyleStateSelector( BASE, 'test/button', ':focus' )
		).toBe( `${ BASE } .wp-block-button__link:focus` );
		expect(
			buildPseudoStyleStateSelector( BASE, 'test/button', ':active' )
		).toBe( `${ BASE } .wp-block-button__link:active` );
	} );

	it( 'falls back to appending state to the base selector when block has no selectors.root', () => {
		expect(
			buildPseudoStyleStateSelector( BASE, 'test/plain', ':hover' )
		).toBe( `${ BASE }:hover` );
	} );

	it( 'falls back to appending state to the base selector for an unknown block name', () => {
		expect(
			buildPseudoStyleStateSelector( BASE, 'test/unknown', ':hover' )
		).toBe( `${ BASE }:hover` );
	} );
} );
