import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { select } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import MaybeTagsPanel from '../maybe-tags-panel';

vi.mock( import( '@wordpress/api-fetch' ) );

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'MaybeTagsPanel', () => {
	beforeEach( () => {
		vi.spyOn( select( coreStore ), 'getEntityRecord' ).mockReturnValue( {
			types: [ 'post' ],
			rest_base: 'tags',
		} );
		vi.spyOn( select( coreStore ), 'getEntityRecords' ).mockReturnValue( [
			{ id: 1 },
		] );
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
			'editor.PrePublishPanel.suggestionInitialOpen',
			'test/suggestion-initial-open'
		);
		vi.restoreAllMocks();
	} );

	it( 'should start closed', () => {
		render( <MaybeTagsPanel /> );

		expect(
			screen.getByRole( 'button', { name: /Add tag/ } )
		).toHaveAttribute( 'aria-expanded', 'false' );
	} );

	it( 'should start open when the filter says so', () => {
		const filter = vi.fn( () => true );
		addFilter(
			'editor.PrePublishPanel.suggestionInitialOpen',
			'test/suggestion-initial-open',
			filter
		);

		render( <MaybeTagsPanel /> );

		expect( filter ).toHaveBeenCalledWith( false, 'tags' );
		expect(
			screen.getByRole( 'button', { name: /Add tag/ } )
		).toHaveAttribute( 'aria-expanded', 'true' );
	} );
} );
