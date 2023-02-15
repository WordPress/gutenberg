/**
 * External dependencies
 */
import {
	fireEvent,
	getBlock,
	measurePerformance,
	setupCoreBlocks,
	within,
} from 'test/helpers';

/**
 * Internal dependencies
 */
import {
	addGalleryBlock,
	initializeWithGalleryBlock,
	getGalleryItem,
} from './helpers';

const media = [
	{
		localId: 1,
		localUrl: 'file:///local-image-1.jpeg',
		serverId: 2000,
		serverUrl: 'https://test-site.files.wordpress.com/local-image-1.jpeg',
	},
	{
		localId: 2,
		localUrl: 'file:///local-image-2.jpeg',
		serverId: 2001,
		serverUrl: 'https://test-site.files.wordpress.com/local-image-2.jpeg',
	},
	{
		localId: 3,
		localUrl: 'file:///local-image-3.jpeg',
		serverId: 2002,
		serverUrl: 'https://test-site.files.wordpress.com/local-image-3.jpeg',
	},
];

setupCoreBlocks();

describe( 'Gallery block', () => {
	it( 'inserts block', async () => {
		const screen = await addGalleryBlock();

		expect( getBlock( screen, 'Gallery' ) ).toBeVisible();

		await measurePerformance( screen );
	} );

	it( 'selects a gallery item', async () => {
		const { galleryBlock } = await initializeWithGalleryBlock( {
			numberOfItems: 1,
			media,
			selected: false,
		} );

		const scenario = async () => {
			const galleryItem = getGalleryItem( galleryBlock, 1 );
			fireEvent.press( galleryItem );

			expect( galleryItem ).toBeVisible();
		};

		await measurePerformance( galleryBlock, { scenario } );
	} );

	it( 'shows appender button when gallery has images', async () => {
		const { galleryBlock } = await initializeWithGalleryBlock( {
			numberOfItems: 1,
			media,
		} );

		const scenario = async ( screen ) => {
			const appenderButton = within( galleryBlock ).getByTestId(
				'media-placeholder-appender-icon'
			);
			fireEvent.press( appenderButton );

			expect( screen.getByText( 'Choose from device' ) ).toBeVisible();
			expect( screen.getByText( 'Take a Photo' ) ).toBeVisible();
			expect(
				screen.getByText( 'WordPress Media Library' )
			).toBeVisible();
		};

		await measurePerformance( galleryBlock, { scenario } );
	} );
} );
