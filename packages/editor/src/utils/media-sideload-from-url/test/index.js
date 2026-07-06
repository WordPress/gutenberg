/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { transformAttachment } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import mediaSideloadFromUrl from '..';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
} ) );
/*
 * The store and transformAttachment are mocked so this unit test does not pull
 * in the full @wordpress/media-utils / core-data import chain (which needs the
 * real @wordpress/data). transformAttachment's mapping is covered in
 * @wordpress/media-utils; here we only verify mediaSideloadFromUrl forwards
 * whatever it returns.
 */
jest.mock( '../../../store', () => ( { store: 'core/editor' } ) );
jest.mock( '@wordpress/media-utils', () => ( {
	transformAttachment: jest.fn( ( attachment ) => ( {
		id: attachment.id,
		url: attachment.source_url,
		alt: attachment.alt_text,
	} ) ),
} ) );

const mockRestAttachment = {
	id: 123,
	alt_text: 'An external photo.',
	caption: { raw: '' },
	title: { raw: 'photo' },
	source_url: 'https://example.com/wp-content/uploads/photo.jpg',
};

/**
 * Sets the post returned by `getCurrentPost()` for a test.
 *
 * @param {Object|undefined} post The post object, or undefined for no post.
 */
function mockCurrentPost( post ) {
	select.mockReturnValue( {
		getCurrentPost: () => post,
	} );
}

describe( 'mediaSideloadFromUrl', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockCurrentPost( { id: 42 } );
	} );

	it( 'should POST to /wp/v2/media with the url, leaving sub-size generation to the server', async () => {
		apiFetch.mockResolvedValue( mockRestAttachment );

		await new Promise( ( resolve ) => {
			mediaSideloadFromUrl( {
				url: 'https://example.com/photo.jpg',
				onSuccess: resolve,
			} );
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media',
			method: 'POST',
			data: {
				url: 'https://example.com/photo.jpg',
				post: 42,
			},
		} );
	} );

	it( 'should pass the transformed attachment to onSuccess', async () => {
		apiFetch.mockResolvedValue( mockRestAttachment );

		const media = await new Promise( ( resolve ) => {
			mediaSideloadFromUrl( {
				url: 'https://example.com/photo.jpg',
				onSuccess: resolve,
			} );
		} );

		/*
		 * The raw REST attachment is run through transformAttachment, which maps
		 * it to the editor shape the image block expects (url, alt).
		 */
		expect( transformAttachment ).toHaveBeenCalledWith(
			mockRestAttachment
		);
		expect( media ).toMatchObject( {
			id: 123,
			url: 'https://example.com/wp-content/uploads/photo.jpg',
			alt: 'An external photo.',
		} );
	} );

	it( 'should fall back to wp_id when the post id is not numeric', async () => {
		apiFetch.mockResolvedValue( mockRestAttachment );
		// Templates and template parts expose their numeric id as `wp_id`.
		mockCurrentPost( { id: 'my-theme//header', wp_id: 99 } );

		await new Promise( ( resolve ) => {
			mediaSideloadFromUrl( {
				url: 'https://example.com/photo.jpg',
				onSuccess: resolve,
			} );
		} );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: expect.objectContaining( { post: 99 } ),
			} )
		);
	} );

	it( 'should omit the post param when there is no current post', async () => {
		apiFetch.mockResolvedValue( mockRestAttachment );
		mockCurrentPost( undefined );

		await new Promise( ( resolve ) => {
			mediaSideloadFromUrl( {
				url: 'https://example.com/photo.jpg',
				onSuccess: resolve,
			} );
		} );

		const { data } = apiFetch.mock.calls[ 0 ][ 0 ];
		expect( data ).not.toHaveProperty( 'post' );
	} );

	it( 'should pass the error message to onError on failure', async () => {
		apiFetch.mockRejectedValue(
			new Error( 'Could not download the image.' )
		);

		const message = await new Promise( ( resolve ) => {
			mediaSideloadFromUrl( {
				url: 'https://example.com/photo.jpg',
				onSuccess: () => {},
				onError: resolve,
			} );
		} );

		expect( message ).toBe( 'Could not download the image.' );
	} );

	it( 'should not throw when onError is omitted and the request fails', async () => {
		apiFetch.mockRejectedValue( new Error( 'Network error' ) );

		expect( () =>
			mediaSideloadFromUrl( { url: 'https://example.com/photo.jpg' } )
		).not.toThrow();

		// Let the rejected promise settle so the default noop onError runs.
		await Promise.resolve();
	} );
} );
