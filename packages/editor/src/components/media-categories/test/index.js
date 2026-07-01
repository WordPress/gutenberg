/**
 * WordPress dependencies
 */
import { dispatch, resolveSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import getInserterMediaCategories from '..';

jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
	resolveSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

describe( 'getInserterMediaCategories', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'does not include attached images for non-numeric post IDs', () => {
		const categories = getInserterMediaCategories(
			'wp_template//theme//home'
		);

		expect(
			categories.some(
				( category ) => category.name === 'attached-images'
			)
		).toBe( false );
	} );

	it( 'fetches images attached to the current post', async () => {
		const getEntityRecords = jest.fn().mockResolvedValue( [
			{
				id: 10,
				source_url: 'https://example.com/image.jpg',
				alt_text: 'Alt text',
				media_details: {
					sizes: {
						medium: {
							source_url: 'https://example.com/image-medium.jpg',
						},
					},
				},
				caption: {
					raw: 'Caption',
				},
			},
		] );
		resolveSelect.mockReturnValue( { getEntityRecords } );

		const [ attachedImagesCategory ] = getInserterMediaCategories(
			42,
			'Post'
		);
		const results = await attachedImagesCategory.fetch( { per_page: 20 } );

		expect( getEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				per_page: 20,
				media_type: 'image',
				parent: 42,
				orderBy: 'date',
			}
		);
		expect( results ).toEqual( [
			expect.objectContaining( {
				id: 10,
				url: 'https://example.com/image.jpg',
				previewUrl: 'https://example.com/image-medium.jpg',
				alt: 'Alt text',
				caption: 'Caption',
			} ),
		] );
	} );

	it( 'attaches and detaches attachment records', async () => {
		const saveEntityRecord = jest.fn().mockResolvedValue( {} );
		dispatch.mockReturnValue( { saveEntityRecord } );

		const [ attachedImagesCategory ] = getInserterMediaCategories(
			42,
			'Post'
		);
		const attachedCount = await attachedImagesCategory.attach( [
			// Classic media modal items expose `type`.
			{ id: 10, type: 'image' },
			{ id: 11, type: 'image' },
			{ id: 10, type: 'image' },
			// Non-image (e.g. a PDF uploaded via the picker) is skipped.
			{ id: 12, type: 'application' },
			{},
			// DataViews-driven modal items are REST attachments: `type` is the
			// post type ('attachment'), and the media type lives in
			// `media_type`/`mime_type`. These must still gate to images.
			{
				id: 13,
				type: 'attachment',
				media_type: 'image',
				mime_type: 'image/png',
			},
			{ id: 14, type: 'attachment', mime_type: 'image/jpeg' },
			{
				id: 15,
				type: 'attachment',
				media_type: 'file',
				mime_type: 'application/pdf',
			},
		] );
		await attachedImagesCategory.detach( { id: 11 } );

		expect( attachedCount ).toBe( 4 );
		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				id: 10,
				post: 42,
			},
			{ throwOnError: true }
		);
		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				id: 11,
				post: 42,
			},
			{ throwOnError: true }
		);
		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				id: 11,
				post: 0,
			},
			{ throwOnError: true }
		);
		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				id: 13,
				post: 42,
			},
			{ throwOnError: true }
		);
		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				id: 14,
				post: 42,
			},
			{ throwOnError: true }
		);
		expect( saveEntityRecord ).not.toHaveBeenCalledWith(
			'postType',
			'attachment',
			expect.objectContaining( { id: 12 } ),
			expect.anything()
		);
		expect( saveEntityRecord ).not.toHaveBeenCalledWith(
			'postType',
			'attachment',
			expect.objectContaining( { id: 15 } ),
			expect.anything()
		);
		expect( saveEntityRecord ).toHaveBeenCalledTimes( 5 );
	} );

	it( 'words the empty state from the post type label', () => {
		const [ attachedImagesCategory ] = getInserterMediaCategories(
			42,
			'Page'
		);

		expect( attachedImagesCategory.emptyMessage ).toBe(
			'No images attached to this Page.'
		);
	} );

	it( 'excludes attached images when there is no viewable post type label', () => {
		// The label is empty for non-viewable post types (synced patterns,
		// navigation, templates) and before the record resolves.
		const categories = getInserterMediaCategories( 42, undefined );

		expect(
			categories.some(
				( category ) => category.name === 'attached-images'
			)
		).toBe( false );
	} );
} );
