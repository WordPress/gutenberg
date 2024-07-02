/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostTaxonomies from '../';

describe( 'PostTaxonomies', () => {
	const genresTaxonomy = {
		name: 'Genres',
		slug: 'genre',
		types: [ 'book' ],
		hierarchical: true,
		rest_base: 'genres',
		visibility: {
			show_ui: true,
		},
		labels: {
			add_new_item: 'Add new genre',
		},
	};

	const categoriesTaxonomy = {
		name: 'Categories',
		slug: 'category',
		types: [ 'post', 'page' ],
		hierarchical: true,
		rest_base: 'categories',
		visibility: {
			show_ui: true,
		},
		labels: {
			add_new_item: 'Add new category',
		},
	};

	beforeEach( () => {
		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {
				'wp:action-create-categories': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/foo/create-categories',
					},
				],
				'wp:action-create-genres': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/create-genres',
					},
				],
				'wp:action-assign-categories': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/foo/assign-categories',
					},
				],
				'wp:action-assign-genres': [
					{
						href: 'http://localhost:8889/index.php?rest_route=/wp/v2/assign-genres',
					},
				],
			},
		} );

		jest.spyOn( select( coreStore ), 'getTaxonomy' ).mockImplementation(
			( slug ) => {
				switch ( slug ) {
					case 'category': {
						return categoriesTaxonomy;
					}
					case 'genre': {
						return genresTaxonomy;
					}
				}
			}
		);
	} );

	it( 'should render no children if taxonomy data not available', () => {
		const taxonomies = null;

		jest.spyOn(
			select( editorStore ),
			'getCurrentPostType'
		).mockReturnValue( 'page' );
		jest.spyOn( select( coreStore ), 'getTaxonomies' ).mockReturnValue(
			taxonomies
		);

		const { container } = render( <PostTaxonomies /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render taxonomy components for taxonomies assigned to post type', () => {
		jest.spyOn(
			select( editorStore ),
			'getCurrentPostType'
		).mockReturnValue( 'book' );
		jest.spyOn( select( coreStore ), 'getTaxonomies' ).mockReturnValue( [
			genresTaxonomy,
			categoriesTaxonomy,
		] );

		render( <PostTaxonomies /> );

		expect( screen.getByRole( 'group', { name: 'Genres' } ) ).toBeVisible();
		expect(
			screen.queryByRole( 'group', { name: 'Categories' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Add new genre' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Add new category' } )
		).not.toBeInTheDocument();
	} );

	it( 'should not render taxonomy components that hide their ui', () => {
		jest.spyOn(
			select( editorStore ),
			'getCurrentPostType'
		).mockReturnValue( 'book' );
		jest.spyOn( select( coreStore ), 'getTaxonomies' ).mockReturnValue( [
			genresTaxonomy,
			{
				...categoriesTaxonomy,
				types: [ 'post', 'page', 'book' ],
				visibility: {
					show_ui: false,
				},
			},
		] );

		render( <PostTaxonomies /> );

		expect( screen.getByRole( 'group', { name: 'Genres' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Add new genre' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'group', { name: 'Categories' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Add new category' } )
		).not.toBeInTheDocument();
	} );
} );
