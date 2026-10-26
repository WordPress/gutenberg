import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import {
	buildScopedBlockSelector,
	buildRootStyleStateSelector,
} from '../state-utils';

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

describe( 'buildScopedBlockSelector with a block name', () => {
	const BASE = '.wp-elements-abc123';

	it.each( [
		[ 'core/paragraph', '.wp-block-paragraph', `${ BASE }:hover` ],
		[ 'core/paragraph', 'p', `${ BASE }:hover` ],
		[ 'core/x', '.wp-block-x.is-style-y', `${ BASE }.is-style-y:hover` ],
		[
			'core/search',
			'.wp-block-search .wp-block-search__input',
			`${ BASE } .wp-block-search__input:hover`,
		],
		[
			'core/list-item',
			'.wp-block-list > li',
			`.wp-block-list > ${ BASE }:hover`,
		],
		[
			'core/list-item',
			'.wp-block-list:not(.wp-block-list .wp-block-list) > li',
			`.wp-block-list:not(.wp-block-list .wp-block-list) > ${ BASE }:hover`,
		],
		[
			'core/list-item',
			'.wp-block-list > li a',
			`.wp-block-list > ${ BASE } a:hover`,
		],
		[
			'test/state-button',
			'.wp-block-button .wp-block-button__link',
			`${ BASE } .wp-block-button__link:hover`,
		],
		[
			'core/list-item',
			'.wp-block-list > li, .wp-block-list-item .inner',
			`.wp-block-list > ${ BASE }:hover, ${ BASE } .inner:hover`,
		],
	] )(
		'scopes %s selector %s to the block wrapper',
		( name, blockSelector, expected ) => {
			expect(
				buildScopedBlockSelector( BASE, blockSelector, ':hover', name )
			).toBe( expected );
		}
	);
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
} );
