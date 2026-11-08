import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { createElement } from '@wordpress/element';
import LivePhotoStillFrame from '../live-photo-still-frame';

globalThis.wpVitest.mockMatchMedia();

const mockCreateErrorNotice = vi.fn();

vi.mock( import( '@wordpress/api-fetch' ), () => ( { default: vi.fn() } ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useDispatch: () => ( { createErrorNotice: mockCreateErrorNotice } ),
} ) );

/*
 * jsdom's FormData only accepts its own Blob class, not the File the component
 * builds; this records what was appended instead.
 */
class RecordingFormData {
	fields = new Map();
	append( name, value ) {
		this.fields.set( name, value );
	}
	get( name ) {
		return this.fields.get( name );
	}
}

const STILL_IMAGE = {
	id: 42,
	source_url: 'https://example.com/wp-content/uploads/2026/09/live.jpg',
};

/**
 * Renders the picker and reports the preview video's metadata as loaded, so
 * the controls enable as they would once the companion is available.
 *
 * @param {Object} props Props to override.
 */
function renderPicker( props = {} ) {
	const onChange = vi.fn();
	render(
		createElement( LivePhotoStillFrame, {
			src: 'https://example.com/wp-content/uploads/2026/09/live.mp4',
			poster: STILL_IMAGE.source_url,
			stillImage: STILL_IMAGE,
			onChange,
			...props,
		} )
	);

	// A video without controls has no role to query it by.
	// eslint-disable-next-line testing-library/no-node-access
	const video = document.querySelector( 'video' );
	Object.defineProperties( video, {
		duration: { value: 3, configurable: true },
		videoWidth: { value: 256, configurable: true },
		videoHeight: { value: 144, configurable: true },
	} );
	fireEvent.loadedMetadata( video );

	return { onChange, video };
}

describe( 'LivePhotoStillFrame', () => {
	beforeEach( () => {
		vi.stubGlobal( 'FormData', RecordingFormData );
		vi.spyOn(
			window.HTMLCanvasElement.prototype,
			'getContext'
		).mockImplementation( () => ( { drawImage: vi.fn() } ) );
		vi.spyOn(
			window.HTMLCanvasElement.prototype,
			'toBlob'
		).mockImplementation( ( callback ) =>
			callback( new Blob( [ 'frame' ], { type: 'image/jpeg' } ) )
		);
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		vi.mocked( apiFetch ).mockReset();
		mockCreateErrorNotice.mockReset();
	} );

	it( 'stores the picked frame as a companion and rests the block on it', async () => {
		vi.mocked( apiFetch )
			.mockResolvedValueOnce( {
				image_size: 'live_photo_still',
				file: 'live-still.jpg',
			} )
			.mockResolvedValueOnce( {} );

		const { onChange } = renderPicker();

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Use this frame' } )
		);

		await waitFor( () =>
			expect( onChange ).toHaveBeenCalledWith(
				'https://example.com/wp-content/uploads/2026/09/live-still.jpg'
			)
		);

		const [ sideload, finalize ] = vi.mocked( apiFetch ).mock.calls;
		expect( sideload[ 0 ].path ).toBe( '/wp/v2/media/42/sideload' );
		expect( sideload[ 0 ].body.get( 'image_size' ) ).toBe(
			'live_photo_still'
		);
		expect( sideload[ 0 ].body.get( 'file' ).type ).toBe( 'image/jpeg' );
		// Finalize echoes what the sideload produced, which it verifies.
		expect( finalize[ 0 ] ).toMatchObject( {
			path: '/wp/v2/media/42/finalize',
			data: {
				sub_sizes: [
					{ image_size: 'live_photo_still', file: 'live-still.jpg' },
				],
			},
		} );
	} );

	it( 'keeps the current frame and reports the failure when saving fails', async () => {
		vi.mocked( apiFetch ).mockRejectedValueOnce( {
			code: 'rest_upload_unknown_error',
		} );

		const { onChange } = renderPicker();

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Use this frame' } )
		);

		await waitFor( () =>
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				'The still frame could not be saved. Please try again.',
				{ type: 'snackbar' }
			)
		);
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'offers a reset only once a frame has been picked', async () => {
		renderPicker();
		expect(
			screen.queryByRole( 'button', { name: 'Reset' } )
		).not.toBeInTheDocument();
	} );

	it( 'resets to the original still', async () => {
		const { onChange } = renderPicker( {
			poster: 'https://example.com/wp-content/uploads/2026/09/live-still.jpg',
		} );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Reset' } )
		);

		expect( onChange ).toHaveBeenCalledWith( STILL_IMAGE.source_url );
	} );
} );
