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

		const [ attachedImagesCategory ] = getInserterMediaCategories( 42 );
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

		const [ attachedImagesCategory ] = getInserterMediaCategories( 42 );
		const attachedCount = await attachedImagesCategory.attach( [
			{ id: 10 },
			{ id: 11 },
			{ id: 10 },
			{},
		] );
		await attachedImagesCategory.detach( { id: 11 } );

		expect( attachedCount ).toBe( 2 );
		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				id: 10,
				post: 42,
			}
		);
		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				id: 11,
				post: 42,
			}
		);
		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				id: 11,
				post: 0,
			}
		);
		expect( saveEntityRecord ).toHaveBeenCalledTimes( 3 );
	} );
} );
