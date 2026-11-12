import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { select } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import MaybeCategoryPanel from '../maybe-category-panel';

vi.mock( import( '@wordpress/api-fetch' ) );

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const taxonomy = { types: [ 'post' ], rest_base: 'categories' };
const site = { default_category: 1 };
const defaultCategory = { id: 1 };
const categories = [ { id: 2, name: 'News', parent: 0 } ];
const noCategories = [];

describe( 'MaybeCategoryPanel', () => {
	beforeEach( () => {
		vi.spyOn( select( coreStore ), 'canUser' ).mockReturnValue( true );
		vi.spyOn( select( coreStore ), 'getEntityRecord' ).mockImplementation(
			( kind, name ) => {
				if ( 'root' === kind && 'taxonomy' === name ) {
					return taxonomy;
				}
				if ( 'root' === kind && 'site' === name ) {
					return site;
				}
				return defaultCategory;
			}
		);
		vi.spyOn( select( coreStore ), 'getEntityRecords' ).mockReturnValue(
			categories
		);
		vi.spyOn( select( editorStore ), 'getCurrentPostType' ).mockReturnValue(
			'post'
		);
		vi.spyOn(
			select( editorStore ),
			'getEditedPostAttribute'
		).mockReturnValue( [] );
	} );

	afterEach( () => {
		removeFilter(
			'editor.PrePublishPanel.showSuggestion',
			'test/show-suggestion'
		);
		removeFilter(
			'editor.PrePublishPanel.suggestionInitialOpen',
			'test/suggestion-initial-open'
		);
		vi.restoreAllMocks();
	} );

	it( 'should render nothing when the site has no other categories', () => {
		select( coreStore ).getEntityRecords.mockReturnValue( noCategories );

		const { container } = render( <MaybeCategoryPanel /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should show when the site has no other categories and the filter says so', () => {
		select( coreStore ).getEntityRecords.mockReturnValue( noCategories );
		const filter = vi.fn( () => true );
		addFilter(
			'editor.PrePublishPanel.showSuggestion',
			'test/show-suggestion',
			filter
		);

		render( <MaybeCategoryPanel /> );

		expect( filter ).toHaveBeenCalledWith( false, 'category' );
		expect(
			screen.getByRole( 'button', { name: /Assign a category/ } )
		).toBeInTheDocument();
	} );

	it( 'should start closed', () => {
		render( <MaybeCategoryPanel /> );

		expect(
			screen.getByRole( 'button', { name: /Assign a category/ } )
		).toHaveAttribute( 'aria-expanded', 'false' );
	} );

	it( 'should start open when the filter says so', () => {
		const filter = vi.fn( () => true );
		addFilter(
			'editor.PrePublishPanel.suggestionInitialOpen',
			'test/suggestion-initial-open',
			filter
		);

		render( <MaybeCategoryPanel /> );

		expect( filter ).toHaveBeenCalledWith( false, 'category' );
		expect(
			screen.getByRole( 'button', { name: /Assign a category/ } )
		).toHaveAttribute( 'aria-expanded', 'true' );
	} );
} );
