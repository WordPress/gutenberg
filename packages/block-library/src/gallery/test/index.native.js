/**
 * External dependencies
 */
import {
	act,
	getEditorHtml,
	initializeEditor,
	fireEvent,
	waitFor,
	within,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { Platform } from '@wordpress/element';
import {
	MEDIA_UPLOAD_STATE_UPLOADING,
	MEDIA_UPLOAD_STATE_SUCCEEDED,
} from '@wordpress/block-editor';
import { subscribeMediaUpload } from '@wordpress/react-native-bridge';

const GALLERY_WITH_ONE_IMAGE = `<!-- wp:gallery {"linkTo":"none"} -->
<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":1} -->
<figure class="wp-block-image"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></figure>
<!-- /wp:image --></figure>
<!-- /wp:gallery -->`;

const addGalleryBlock = async () => {
	const screen = initializeEditor();
	const { getByA11yLabel, getByTestId, getByText } = screen;

	fireEvent.press( getByA11yLabel( 'Add block' ) );

	const blockList = getByTestId( 'InserterUI-Blocks' );
	// onScroll event used to force the FlatList to render all items
	fireEvent.scroll( blockList, {
		nativeEvent: {
			contentOffset: { y: 0, x: 0 },
			contentSize: { width: 100, height: 100 },
			layoutMeasurement: { width: 100, height: 100 },
		},
	} );

	fireEvent.press( await waitFor( () => getByText( 'Gallery' ) ) );

	return screen;
};

const initializeWithGalleryBlock = async ( initialHtml ) => {
	const screen = initializeEditor( { initialHtml } );
	const { getByA11yLabel } = screen;

	const galleryBlock = getByA11yLabel( /Gallery Block\. Row 1/ );

	const innerBlockListWrapper = await waitFor( () =>
		within( galleryBlock ).getByTestId( 'block-list-wrapper' )
	);
	fireEvent( innerBlockListWrapper, 'layout', {
		nativeEvent: {
			layout: {
				width: 100,
			},
		},
	} );

	return { ...screen, galleryBlock };
};

beforeAll( () => {
	// Register all core blocks
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Gallery block', () => {
	it( 'inserts block', async () => {
		const { getByA11yLabel } = await addGalleryBlock();

		const galleryBlock = await waitFor( () =>
			getByA11yLabel( /Gallery Block\. Row 1/ )
		);

		expect( galleryBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'selects a gallery item', async () => {
		const { galleryBlock } = await initializeWithGalleryBlock(
			GALLERY_WITH_ONE_IMAGE
		);

		fireEvent.press( galleryBlock );

		const galleryItem = await waitFor( () =>
			within( galleryBlock ).getByA11yLabel( /Image Block\. Row 1/ )
		);
		fireEvent.press( galleryItem );

		expect( galleryItem ).toBeVisible();
	} );

	it( 'shows appender button when gallery has images', async () => {
		const { galleryBlock, getByText } = await initializeWithGalleryBlock(
			GALLERY_WITH_ONE_IMAGE
		);

		fireEvent.press( galleryBlock );

		const appenderButton = await waitFor( () =>
			within( galleryBlock ).getByA11yLabel( /Gallery block\. Empty/ )
		);
		fireEvent.press( appenderButton );

		expect( getByText( 'Choose from device' ) ).toBeDefined();
		expect( getByText( 'Take a Photo' ) ).toBeDefined();
		expect( getByText( 'WordPress Media Library' ) ).toBeDefined();
	} );

	// This case is disabled until the issue (https://github.com/WordPress/gutenberg/issues/38444)
	// is addressed.
	it.skip( 'displays media options picker when selecting the block', () => {
		// Initialize with an empty gallery
		const { getByA11yLabel, getByText, getByTestId } = initializeEditor( {
			initialHtml: `<!-- wp:gallery {"linkTo":"none"} -->
		<figure class="wp-block-gallery has-nested-images columns-default is-cropped"></figure>
		<!-- /wp:gallery -->`,
		} );

		// Tap on Gallery block
		fireEvent.press( getByText( 'ADD MEDIA' ) );

		// Observe that media options picker is displayed
		expect( getByText( 'Choose images' ) ).toBeDefined();
		expect( getByText( 'WordPress Media Library' ) ).toBeDefined();

		// Dimiss the picker
		if ( Platform.isIOS ) {
			fireEvent.press( getByText( 'Cancel' ) );
		} else {
			const mediaPicker = getByTestId( 'media-options-picker' );
			fireEvent( mediaPicker, 'backdropPress' );
		}

		// Observe that the block is selected, this is done by checking if the block settings
		// button is visible
		const blockActionsButton = getByA11yLabel( /Open Block Actions Menu/ );
		expect( blockActionsButton ).toBeVisible();
	} );

	it( 'finishes pending uploads upon opening the editor (TC001 - Close/Re-open post with an ongoing image upload)', async () => {
		const MEDIA = [
			{
				localId: 1,
				localUrl: 'file:///local-image-1.jpeg',
				serverId: 2000,
				serverUrl:
					'https://test-site.files.wordpress.com/local-image-1.jpeg',
			},
			{
				localId: 2,
				localUrl: 'file:///local-image-2.jpeg',
				serverId: 2001,
				serverUrl:
					'https://test-site.files.wordpress.com/local-image-2.jpeg',
			},
		];

		const mediaUploadListeners = [];
		subscribeMediaUpload.mockImplementation( ( callback ) => {
			mediaUploadListeners.push( callback );
		} );
		const triggerMediaUpload = ( payload ) =>
			mediaUploadListeners.forEach( ( listener ) => listener( payload ) );

		// Initialize with a gallery that contains two items that are being uploaded
		const {
			galleryBlock,
		} = await initializeWithGalleryBlock( `<!-- wp:gallery {"linkTo":"none"} -->
		<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":${ MEDIA[ 0 ].localId }} -->
		<figure class="wp-block-image"><img src="${ MEDIA[ 0 ].localUrl }" alt="" class="wp-image-${ MEDIA[ 0 ].localId }"/></figure>
		<!-- /wp:image -->
		
		<!-- wp:image {"id":${ MEDIA[ 1 ].localId }} -->
		<figure class="wp-block-image"><img src="${ MEDIA[ 1 ].localUrl }" alt="" class="wp-image-${ MEDIA[ 1 ].localId }"/></figure>
		<!-- /wp:image --></figure>
		<!-- /wp:gallery -->` );

		// Notify that the media items are uploading
		await act( async () => {
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_UPLOADING,
				mediaId: MEDIA[ 0 ].localId,
				progress: 0.5,
			} );
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_UPLOADING,
				mediaId: MEDIA[ 1 ].localId,
				progress: 0.25,
			} );
		} );

		// Check that images are showing a loading state
		const galleryItem1 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 1/
		);
		const galleryItem2 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 2/
		);
		expect( within( galleryItem1 ).getByTestId( 'spinner' ) ).toBeVisible();
		expect( within( galleryItem2 ).getByTestId( 'spinner' ) ).toBeVisible();

		// Notify that the media items upload succeeded
		await act( async () => {
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_SUCCEEDED,
				mediaId: MEDIA[ 0 ].localId,
				mediaUrl: MEDIA[ 0 ].serverUrl,
				mediaServerId: MEDIA[ 0 ].serverId,
			} );
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_SUCCEEDED,
				mediaId: MEDIA[ 1 ].localId,
				mediaUrl: MEDIA[ 1 ].serverUrl,
				mediaServerId: MEDIA[ 1 ].serverId,
			} );
		} );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'sets caption to gallery (TC003 - Add caption to gallery)', async () => {
		// Initialize with a gallery that contains one item
		const {
			galleryBlock,
			getByA11yLabel,
		} = await initializeWithGalleryBlock( GALLERY_WITH_ONE_IMAGE );

		// Select block
		fireEvent.press( galleryBlock );

		// Check gallery item caption is not visible
		const galleryItemCaption = getByA11yLabel( /Image caption. Empty/ );
		expect( galleryItemCaption ).not.toBeVisible();

		// Set gallery caption
		const galleryCaption = getByA11yLabel( /Gallery caption. Empty/ );
		const captionField = within( galleryCaption ).getByPlaceholderText(
			'Add caption'
		);
		fireEvent( captionField, 'focus' );
		fireEvent( captionField, 'onChange', {
			nativeEvent: {
				eventCount: 1,
				target: undefined,
				text:
					'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> gallery caption',
			},
		} );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'sets caption to gallery items (TC004 - Add caption to gallery images)', async () => {
		// Initialize with a gallery that contains one item
		const { galleryBlock } = await initializeWithGalleryBlock(
			GALLERY_WITH_ONE_IMAGE
		);

		// Select block
		fireEvent.press( galleryBlock );

		// Select gallery item
		const galleryItem = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 1/
		);
		fireEvent.press( galleryItem );

		// Set gallery item caption
		const captionField = within( galleryItem ).getByPlaceholderText(
			'Add caption'
		);
		fireEvent( captionField, 'focus' );
		fireEvent( captionField, 'onChange', {
			nativeEvent: {
				eventCount: 1,
				target: undefined,
				text:
					'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> image caption',
			},
		} );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
