import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { select } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { unlock } from '../../../lock-unlock';
import MaybeUploadMediaPanel from '../maybe-upload-media';

vi.mock( import( '@wordpress/api-fetch' ) );

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const { mediaSideloadFromUrlKey } = unlock( blockEditorPrivateApis );

describe( 'MaybeUploadMediaPanel', () => {
	beforeEach( () => {
		vi.spyOn( select( blockEditorStore ), 'getBlocks' ).mockReturnValue( [
			{
				name: 'core/image',
				attributes: { url: 'https://example.com/image.jpg' },
				innerBlocks: [],
			},
		] );
		vi.spyOn( select( blockEditorStore ), 'getSettings' ).mockReturnValue( {
			[ mediaSideloadFromUrlKey ]: vi.fn(),
		} );
	} );

	afterEach( () => {
		removeFilter(
			'editor.PrePublishPanel.suggestionInitialOpen',
			'test/suggestion-initial-open'
		);
		vi.restoreAllMocks();
	} );

	it( 'should start open', () => {
		render( <MaybeUploadMediaPanel /> );

		expect(
			screen.getByRole( 'button', { name: /External media/ } )
		).toHaveAttribute( 'aria-expanded', 'true' );
	} );

	it( 'should start closed when the filter says so', () => {
		const filter = vi.fn( () => false );
		addFilter(
			'editor.PrePublishPanel.suggestionInitialOpen',
			'test/suggestion-initial-open',
			filter
		);

		render( <MaybeUploadMediaPanel /> );

		expect( filter ).toHaveBeenCalledWith( true, 'external-media' );
		expect(
			screen.getByRole( 'button', { name: /External media/ } )
		).toHaveAttribute( 'aria-expanded', 'false' );
	} );
} );
