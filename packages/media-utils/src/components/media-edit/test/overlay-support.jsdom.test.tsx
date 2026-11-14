import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import MediaUpload from '../../media-upload';
import MediaEdit, { MediaEditControl } from '../index';

const namespace = 'test/media-overlay-support';

describe( 'Media edit overlay support', () => {
	afterEach( () => removeFilter( 'editor.MediaUpload', namespace ) );

	it( 'checks the filtered control with its actual original component', () => {
		const compatible = Object.assign( () => null, {
			supportsUiOverlays: true,
		} );
		addFilter( 'editor.MediaUpload', namespace, ( original ) =>
			original === MediaUpload ? compatible : () => null
		);
		expect( MediaEditControl.supportsUiOverlays ).toBe( false );
		expect( MediaEdit.supportsUiOverlays ).toBe( true );
	} );

	it( 'notifies its host when the filtered renderer loses support', async () => {
		const onChange = vi.fn();
		const unsubscribe =
			MediaEditControl.subscribeUiOverlaySupport( onChange );
		try {
			expect( MediaEditControl.supportsUiOverlays ).toBe( true );
			addFilter( 'editor.MediaUpload', namespace, () => () => null );
			await waitFor( () => expect( onChange ).toHaveBeenCalled() );
			expect( MediaEditControl.supportsUiOverlays ).toBe( false );
		} finally {
			unsubscribe();
		}
	} );
} );
