import { describe, expect, it } from 'vitest';
import {
	addBlockSuggestions,
	BLOCK_SUGGESTION_TYPE,
	MAX_BLOCK_SUGGESTIONS,
} from '../block-suggestions';

const homeLink = {
	id: 'core/home-link',
	name: 'core/home-link',
	title: 'Home Link',
	icon: { src: 'home' },
};
const pageList = {
	id: 'core/page-list',
	name: 'core/page-list',
	title: 'Page List',
	icon: { src: 'list' },
	keywords: [ 'menu', 'navigation' ],
};
const pageLinkVariation = {
	id: 'core/navigation-link/page',
	name: 'core/navigation-link',
	title: 'Page Link',
	icon: { src: 'page' },
};
const homePage = {
	id: 1,
	title: 'Home Office',
	type: 'page',
	kind: 'post-type',
	url: '/home-office',
};
const menuPage = {
	id: 2,
	title: 'Menu',
	type: 'page',
	kind: 'post-type',
	url: '/menu',
};

describe( 'addBlockSuggestions', () => {
	it( 'describes a block as a suggestion that is not a link', () => {
		const [ suggestion ] = addBlockSuggestions( [], [ homeLink ], 'Home' );

		expect( suggestion ).toEqual( {
			id: 'core/home-link',
			type: BLOCK_SUGGESTION_TYPE,
			title: 'Home Link',
			icon: homeLink.icon,
			typeLabel: 'Block',
		} );
	} );

	it( 'puts a block whose title starts with the search before the links', () => {
		const suggestions = addBlockSuggestions(
			[ homePage ],
			[ homeLink ],
			'home'
		);

		expect( suggestions.map( ( { title } ) => title ) ).toEqual( [
			'Home Link',
			'Home Office',
		] );
	} );

	it( 'puts a block that matches any other way after the links', () => {
		// Page List matches "menu" by keyword, not by title.
		const suggestions = addBlockSuggestions(
			[ menuPage ],
			[ pageList ],
			'menu'
		);

		expect( suggestions.map( ( { title } ) => title ) ).toEqual( [
			'Menu',
			'Page List',
		] );
	} );

	it( 'leaves out the link variations, which the links already cover', () => {
		const suggestions = addBlockSuggestions(
			[],
			[ pageLinkVariation ],
			'page'
		);

		expect( suggestions ).toEqual( [] );
	} );

	it( 'leaves out blocks that cannot be inserted', () => {
		const suggestions = addBlockSuggestions(
			[],
			[ { ...homeLink, isDisabled: true } ],
			'home'
		);

		expect( suggestions ).toEqual( [] );
	} );

	it( `adds no more than ${ MAX_BLOCK_SUGGESTIONS } blocks`, () => {
		const items = Array.from( { length: 5 }, ( _, index ) => ( {
			id: `test/home-${ index }`,
			name: `test/home-${ index }`,
			title: `Home ${ index }`,
		} ) );

		expect( addBlockSuggestions( [], items, 'home' ) ).toHaveLength(
			MAX_BLOCK_SUGGESTIONS
		);
	} );

	it( 'returns the links unchanged when no block matches', () => {
		const suggestions = [ homePage ];

		expect(
			addBlockSuggestions( suggestions, [ homeLink ], 'office' )
		).toBe( suggestions );
	} );

	it( 'returns the links unchanged when nothing is searched', () => {
		const suggestions = [ homePage ];

		expect( addBlockSuggestions( suggestions, [ homeLink ], '' ) ).toBe(
			suggestions
		);
	} );
} );
