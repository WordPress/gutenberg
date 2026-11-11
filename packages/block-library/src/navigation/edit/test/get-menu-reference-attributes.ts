import { describe, expect, it } from 'vitest';
import getMenuReferenceAttributes from '../get-menu-reference-attributes';

const headerMenu = { id: 10, slug: 'header' };
const footerMenu = { id: 11, slug: 'footer' };

describe( 'getMenuReferenceAttributes', () => {
	it( 'references a selected menu by post ID', () => {
		expect( getMenuReferenceAttributes( { menu: footerMenu } ) ).toEqual( {
			ref: 11,
			slug: undefined,
		} );
	} );

	it( 'drops the reference when no menu is selected', () => {
		expect( getMenuReferenceAttributes( { menu: undefined } ) ).toEqual( {
			ref: undefined,
			slug: undefined,
		} );
	} );

	it( 'replaces a post ID reference with the newly selected one', () => {
		expect(
			getMenuReferenceAttributes( {
				menu: footerMenu,
				ref: 10,
				navigationMenuId: 10,
			} )
		).toEqual( { ref: 11, slug: undefined } );
	} );

	it( 'keeps referencing by slug when another menu is selected', () => {
		expect(
			getMenuReferenceAttributes( {
				menu: footerMenu,
				slug: 'header',
				navigationMenuId: 10,
			} )
		).toEqual( { ref: undefined, slug: 'footer' } );
	} );

	it( 'leaves the authored slug alone when the menu it resolves to is selected', () => {
		expect(
			getMenuReferenceAttributes( {
				menu: headerMenu,
				slug: 'Header',
				navigationMenuId: 10,
			} )
		).toBeUndefined();
	} );

	it( 'leaves a slug alone when it normalizes to the selected menu', () => {
		// The menu a hand authored `Header Menu` slug created is stored as
		// `header-menu`, so the reference already resolves to it.
		expect(
			getMenuReferenceAttributes( {
				menu: { id: 12, slug: 'header-menu' },
				slug: 'Header Menu',
			} )
		).toBeUndefined();
	} );

	it( 'clears a post ID left beside a slug reference', () => {
		// A block carrying both resolves by slug, so the post ID is dead
		// weight that would outlive the menu it points at.
		expect(
			getMenuReferenceAttributes( {
				menu: headerMenu,
				ref: 11,
				slug: 'header',
				navigationMenuId: 10,
			} )
		).toEqual( { ref: undefined, slug: 'header' } );
	} );

	it( 'references the Navigation fallback by post ID, as it has no slug', () => {
		expect(
			getMenuReferenceAttributes( {
				menu: { id: 13 },
				slug: 'header',
			} )
		).toEqual( { ref: 13, slug: undefined } );
	} );
} );
