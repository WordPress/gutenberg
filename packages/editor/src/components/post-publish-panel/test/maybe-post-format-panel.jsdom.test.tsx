import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { select } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import MaybePostFormatPanel from '../maybe-post-format-panel';

vi.mock( import( '@wordpress/api-fetch' ) );

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'MaybePostFormatPanel', () => {
	beforeEach( () => {
		vi.spyOn( select( coreStore ), 'getThemeSupports' ).mockReturnValue( {
			formats: [ 'gallery', 'image' ],
		} );
		vi.spyOn( select( editorStore ), 'getCurrentPostId' ).mockReturnValue(
			1
		);
		vi.spyOn(
			select( editorStore ),
			'getEditedPostAttribute'
		).mockReturnValue( 'standard' );
		vi.spyOn(
			select( editorStore ),
			'getSuggestedPostFormat'
		).mockReturnValue( null );
	} );

	afterEach( () => {
		removeFilter(
			'editor.PrePublishPanel.suggestedPostFormat',
			'test/suggested-post-format'
		);
		removeFilter(
			'editor.PrePublishPanel.suggestionInitialOpen',
			'test/suggestion-initial-open'
		);
		vi.restoreAllMocks();
	} );

	it( 'should render nothing without a suggestion', () => {
		const { container } = render( <MaybePostFormatPanel /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should suggest the post format from the filter', () => {
		const filter = vi.fn( () => 'gallery' );
		addFilter(
			'editor.PrePublishPanel.suggestedPostFormat',
			'test/suggested-post-format',
			filter
		);

		render( <MaybePostFormatPanel /> );

		expect( filter ).toHaveBeenCalledWith( null, 1 );
		expect(
			screen.getByRole( 'button', { name: /Use a post format/ } )
		).toBeInTheDocument();
	} );

	it( 'should not suggest a filtered post format the theme does not support', () => {
		addFilter(
			'editor.PrePublishPanel.suggestedPostFormat',
			'test/suggested-post-format',
			() => 'video'
		);

		const { container } = render( <MaybePostFormatPanel /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should start closed', () => {
		select( editorStore ).getSuggestedPostFormat.mockReturnValue( 'image' );

		render( <MaybePostFormatPanel /> );

		expect(
			screen.getByRole( 'button', { name: /Use a post format/ } )
		).toHaveAttribute( 'aria-expanded', 'false' );
	} );

	it( 'should start open when the filter says so', () => {
		select( editorStore ).getSuggestedPostFormat.mockReturnValue( 'image' );
		const filter = vi.fn( () => true );
		addFilter(
			'editor.PrePublishPanel.suggestionInitialOpen',
			'test/suggestion-initial-open',
			filter
		);

		render( <MaybePostFormatPanel /> );

		expect( filter ).toHaveBeenCalledWith( false, 'post-format' );
		expect(
			screen.getByRole( 'button', { name: /Use a post format/ } )
		).toHaveAttribute( 'aria-expanded', 'true' );
		expect(
			screen.getByRole( 'button', { name: 'Apply the "Image" format.' } )
		).toBeInTheDocument();
	} );
} );
