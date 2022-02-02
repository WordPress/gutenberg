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
	MEDIA_UPLOAD_STATE_FAILED,
	MEDIA_UPLOAD_STATE_RESET,
} from '@wordpress/block-editor';
import {
	getOtherMediaOptions,
	requestMediaPicker,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
	subscribeMediaUpload,
} from '@wordpress/react-native-bridge';

const GALLERY_EMPTY = `<!-- wp:gallery {"linkTo":"none"} -->
<figure class="wp-block-gallery has-nested-images columns-default is-cropped"></figure>
<!-- /wp:gallery -->`;

const GALLERY_WITH_ONE_IMAGE = `<!-- wp:gallery {"linkTo":"none"} -->
<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":1} -->
<figure class="wp-block-image"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></figure>
<!-- /wp:image --></figure>
<!-- /wp:gallery -->`;

const MEDIA = [
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
];

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

const initializeWithGalleryBlock = (
	initialHtml,
	{ hasItems = true, deviceWidth = 320 } = {}
) => {
	const screen = initializeEditor( { initialHtml } );
	const { getByA11yLabel } = screen;

	const galleryBlock = getByA11yLabel( /Gallery Block\. Row 1/ );

	if ( hasItems ) {
		fireEvent(
			within( galleryBlock ).getByTestId( 'block-list-wrapper' ),
			'layout',
			{
				nativeEvent: {
					layout: {
						width: deviceWidth,
					},
				},
			}
		);
	}

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
		const { galleryBlock } = initializeWithGalleryBlock(
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
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
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
			initialHtml: GALLERY_EMPTY,
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
		const mediaUploadListeners = [];
		subscribeMediaUpload.mockImplementation( ( callback ) => {
			mediaUploadListeners.push( callback );
			return { remove: jest.fn() };
		} );
		const triggerMediaUpload = ( payload ) =>
			mediaUploadListeners.forEach( ( listener ) => listener( payload ) );

		// Initialize with a gallery that contains two items that are being uploaded
		const {
			galleryBlock,
		} = initializeWithGalleryBlock( `<!-- wp:gallery {"linkTo":"none"} -->
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

	it( 'sets caption to gallery (TC003 - Add caption to gallery)', () => {
		// Initialize with a gallery that contains one item
		const { galleryBlock, getByA11yLabel } = initializeWithGalleryBlock(
			GALLERY_WITH_ONE_IMAGE
		);

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

	it( 'sets caption to gallery items (TC004 - Add caption to gallery images)', () => {
		// Initialize with a gallery that contains one item
		const { galleryBlock } = initializeWithGalleryBlock(
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

	it( 'successfully uploads items (TC005 - Choose from device (stay in editor) - Successful upload)', async () => {
		const mediaUploadListeners = [];
		subscribeMediaUpload.mockImplementation( ( callback ) => {
			mediaUploadListeners.push( callback );
			return { remove: jest.fn() };
		} );
		const triggerMediaUpload = ( payload ) =>
			mediaUploadListeners.forEach( ( listener ) => listener( payload ) );

		let mediaPickerCallback;
		requestMediaPicker.mockImplementation(
			( source, filter, multiple, callback ) => {
				mediaPickerCallback = callback;
			}
		);

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			GALLERY_EMPTY,
			{
				hasItems: false,
			}
		);

		// Upload images from device
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Choose from device' ) );
		expect( requestMediaPicker ).toHaveBeenCalledWith(
			'DEVICE_MEDIA_LIBRARY',
			[ 'image' ],
			true,
			mediaPickerCallback
		);

		// Return media items picked
		await act( async () =>
			mediaPickerCallback( [
				{
					type: 'image',
					url: MEDIA[ 0 ].localUrl,
					id: MEDIA[ 0 ].localId,
				},
				{
					type: 'image',
					url: MEDIA[ 1 ].localUrl,
					id: MEDIA[ 1 ].localId,
				},
			] )
		);

		// Check that gallery items are visible
		fireEvent(
			within( galleryBlock ).getByTestId( 'block-list-wrapper' ),
			'layout',
			{
				nativeEvent: {
					layout: {
						width: 100,
					},
				},
			}
		);
		const galleryItem1 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 1/
		);
		const galleryItem2 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 2/
		);
		expect( galleryItem1 ).toBeVisible();
		expect( galleryItem2 ).toBeVisible();

		// Check that images are showing a loading state
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

	it( 'handles failed uploads (TC006 - Choose from device (stay in editor) - Failed upload)', async () => {
		const mediaUploadListeners = [];
		subscribeMediaUpload.mockImplementation( ( callback ) => {
			mediaUploadListeners.push( callback );
			return { remove: jest.fn() };
		} );
		const triggerMediaUpload = ( payload ) =>
			mediaUploadListeners.forEach( ( listener ) => listener( payload ) );

		let mediaPickerCallback;
		requestMediaPicker.mockImplementation(
			( source, filter, multiple, callback ) => {
				mediaPickerCallback = callback;
			}
		);

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			GALLERY_EMPTY,
			{
				hasItems: false,
			}
		);
		fireEvent.press( galleryBlock );

		// Upload images from device
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Choose from device' ) );
		expect( requestMediaPicker ).toHaveBeenCalledWith(
			'DEVICE_MEDIA_LIBRARY',
			[ 'image' ],
			true,
			mediaPickerCallback
		);

		// Return media items picked
		await act( async () =>
			mediaPickerCallback( [
				{
					type: 'image',
					url: MEDIA[ 0 ].localUrl,
					id: MEDIA[ 0 ].localId,
				},
				{
					type: 'image',
					url: MEDIA[ 1 ].localUrl,
					id: MEDIA[ 1 ].localId,
				},
			] )
		);

		// Check that gallery items are visible
		fireEvent(
			within( galleryBlock ).getByTestId( 'block-list-wrapper' ),
			'layout',
			{
				nativeEvent: {
					layout: {
						width: 100,
					},
				},
			}
		);
		const galleryItem1 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 1/
		);
		const galleryItem2 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 2/
		);
		expect( galleryItem1 ).toBeVisible();
		expect( galleryItem2 ).toBeVisible();

		// Check that images are showing a loading state
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
		expect( within( galleryItem1 ).getByTestId( 'spinner' ) ).toBeVisible();
		expect( within( galleryItem2 ).getByTestId( 'spinner' ) ).toBeVisible();

		// Notify that the media items uploads failed
		await act( async () => {
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_FAILED,
				mediaId: MEDIA[ 0 ].localId,
				progress: 0.5,
			} );
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_FAILED,
				mediaId: MEDIA[ 1 ].localId,
				progress: 0.25,
			} );
		} );

		// Check that failed images provide the option to retry the upload
		fireEvent.press( galleryItem1 );
		fireEvent.press(
			within( galleryItem1 ).getByText( /Failed to insert media/ )
		);
		expect( requestImageFailedRetryDialog ).toHaveBeenCalledWith(
			MEDIA[ 0 ].localId
		);
		fireEvent.press( galleryItem2 );
		fireEvent.press(
			within( galleryItem2 ).getByText( /Failed to insert media/ )
		);
		expect( requestImageFailedRetryDialog ).toHaveBeenCalledWith(
			MEDIA[ 1 ].localId
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'takes a photo (TC007 - Take a photo)', async () => {
		const mediaUploadListeners = [];
		subscribeMediaUpload.mockImplementation( ( callback ) => {
			mediaUploadListeners.push( callback );
			return { remove: jest.fn() };
		} );
		const triggerMediaUpload = ( payload ) =>
			mediaUploadListeners.forEach( ( listener ) => listener( payload ) );

		let mediaPickerCallback;
		requestMediaPicker.mockImplementation(
			( source, filter, multiple, callback ) => {
				mediaPickerCallback = callback;
			}
		);

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			GALLERY_EMPTY,
			{
				hasItems: false,
			}
		);

		// Take a photo
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Take a Photo' ) );
		expect( requestMediaPicker ).toHaveBeenCalledWith(
			'DEVICE_CAMERA',
			[ 'image' ],
			true,
			mediaPickerCallback
		);

		// Return media item from photo taken
		await act( async () =>
			mediaPickerCallback( [
				{
					type: 'image',
					url: MEDIA[ 0 ].localUrl,
					id: MEDIA[ 0 ].localId,
				},
			] )
		);

		// Check gallery item is visible
		fireEvent(
			within( galleryBlock ).getByTestId( 'block-list-wrapper' ),
			'layout',
			{
				nativeEvent: {
					layout: {
						width: 100,
					},
				},
			}
		);
		const galleryItem = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 1/
		);
		expect( galleryItem ).toBeVisible();

		// Check image is showing a loading state
		await act( async () => {
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_UPLOADING,
				mediaId: MEDIA[ 0 ].localId,
				progress: 0.5,
			} );
		} );
		expect( within( galleryItem ).getByTestId( 'spinner' ) ).toBeVisible();

		// Notify that the media item upload succeeded
		await act( async () => {
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_SUCCEEDED,
				mediaId: MEDIA[ 0 ].localId,
				mediaUrl: MEDIA[ 0 ].serverUrl,
				mediaServerId: MEDIA[ 0 ].serverId,
			} );
		} );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'uploads from free photo library (TC008 - Choose from the free photo library)', async () => {
		const mediaUploadListeners = [];
		subscribeMediaUpload.mockImplementation( ( callback ) => {
			mediaUploadListeners.push( callback );
			return { remove: jest.fn() };
		} );
		const triggerMediaUpload = ( payload ) =>
			mediaUploadListeners.forEach( ( listener ) => listener( payload ) );

		let mediaPickerCallback;
		requestMediaPicker.mockImplementation(
			( source, filter, multiple, callback ) => {
				mediaPickerCallback = callback;
			}
		);

		let otherMediaOptionsCallback;
		getOtherMediaOptions.mockImplementation( ( filter, callback ) => {
			otherMediaOptionsCallback = callback;
		} );

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			GALLERY_EMPTY,
			{
				hasItems: false,
			}
		);

		// Notify other media options
		act( () =>
			otherMediaOptionsCallback( [
				{
					label: 'Free Photo Library',
					value: 'wpios-stock-photo-library',
				},
				{ label: 'Free GIF Library', value: 'wpios-tenor' },
				{ label: 'Other Apps', value: 'wpios-other-files' },
			] )
		);

		// Upload images from free photo library
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Free Photo Library' ) );
		expect( requestMediaPicker ).toHaveBeenCalledWith(
			'wpios-stock-photo-library',
			[ 'image' ],
			true,
			mediaPickerCallback
		);

		// Return media items picked
		await act( async () =>
			mediaPickerCallback( [
				{
					type: 'image',
					url:
						'https://images.pexels.com/photos/110854/pexels-photo-110854.jpeg',
					id: MEDIA[ 0 ].localId,
				},
				{
					type: 'image',
					url:
						'https://images.pexels.com/photos/2150/sky-space-dark-galaxy.jpg',
					id: MEDIA[ 1 ].localId,
				},
			] )
		);

		// Check that gallery items are visible
		fireEvent(
			within( galleryBlock ).getByTestId( 'block-list-wrapper' ),
			'layout',
			{
				nativeEvent: {
					layout: {
						width: 100,
					},
				},
			}
		);
		const galleryItem1 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 1/
		);
		const galleryItem2 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 2/
		);
		expect( galleryItem1 ).toBeVisible();
		expect( galleryItem2 ).toBeVisible();

		// Check that images are showing a loading state
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

	it( 'cancels uploads (TC009 - Choose from device (stay in editor) - Cancel upload)', async () => {
		const mediaUploadListeners = [];
		subscribeMediaUpload.mockImplementation( ( callback ) => {
			mediaUploadListeners.push( callback );
			return { remove: jest.fn() };
		} );
		const triggerMediaUpload = ( payload ) =>
			mediaUploadListeners.forEach( ( listener ) => listener( payload ) );

		let mediaPickerCallback;
		requestMediaPicker.mockImplementation(
			( source, filter, multiple, callback ) => {
				mediaPickerCallback = callback;
			}
		);

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			GALLERY_EMPTY,
			{
				hasItems: false,
			}
		);
		fireEvent.press( galleryBlock );

		// Upload images from device
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Choose from device' ) );
		expect( requestMediaPicker ).toHaveBeenCalledWith(
			'DEVICE_MEDIA_LIBRARY',
			[ 'image' ],
			true,
			mediaPickerCallback
		);

		// Return media items picked
		await act( async () =>
			mediaPickerCallback( [
				{
					type: 'image',
					url: MEDIA[ 0 ].localUrl,
					id: MEDIA[ 0 ].localId,
				},
				{
					type: 'image',
					url: MEDIA[ 1 ].localUrl,
					id: MEDIA[ 1 ].localId,
				},
			] )
		);

		// Check that gallery items are visible
		fireEvent(
			within( galleryBlock ).getByTestId( 'block-list-wrapper' ),
			'layout',
			{
				nativeEvent: {
					layout: {
						width: 100,
					},
				},
			}
		);
		const galleryItem1 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 1/
		);
		const galleryItem2 = within( galleryBlock ).getByA11yLabel(
			/Image Block\. Row 2/
		);
		expect( galleryItem1 ).toBeVisible();
		expect( galleryItem2 ).toBeVisible();

		// Check that images are showing a loading state
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
		expect( within( galleryItem1 ).getByTestId( 'spinner' ) ).toBeVisible();
		expect( within( galleryItem2 ).getByTestId( 'spinner' ) ).toBeVisible();

		// Cancel uploads
		fireEvent.press( galleryItem1 );
		fireEvent.press( within( galleryItem1 ).getByTestId( 'spinner' ) );
		expect( requestImageUploadCancelDialog ).toHaveBeenCalledWith(
			MEDIA[ 0 ].localId
		);
		await act( async () =>
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_RESET,
				mediaId: MEDIA[ 0 ].localId,
				progress: 0,
			} )
		);

		fireEvent.press( galleryItem2 );
		fireEvent.press( within( galleryItem2 ).getByTestId( 'spinner' ) );
		expect( requestImageUploadCancelDialog ).toHaveBeenCalledWith(
			MEDIA[ 1 ].localId
		);
		await act( async () =>
			triggerMediaUpload( {
				state: MEDIA_UPLOAD_STATE_RESET,
				mediaId: MEDIA[ 1 ].localId,
				progress: 0,
			} )
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'rearranges gallery items (TC010 - Rearrange images in Gallery)', () => {
		// Initialize with a gallery that contains various items
		const {
			galleryBlock,
			getByA11yLabel,
		} = initializeWithGalleryBlock( `<!-- wp:gallery {"linkTo":"none"} -->
		<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":1} -->
		<figure class="wp-block-image"><img src="https://test-site.files.wordpress.com/image-1.jpeg" alt="" class="wp-image-1"/><figcaption>Image 1</figcaption></figure>
		<!-- /wp:image -->
		
		<!-- wp:image {"id":2} -->
		<figure class="wp-block-image"><img src="https://test-site.files.wordpress.com/image-2.jpeg" alt="" class="wp-image-2"/><figcaption>Image 2</figcaption></figure>
		<!-- /wp:image -->

		<!-- wp:image {"id":3} -->
		<figure class="wp-block-image"><img src="https://test-site.files.wordpress.com/image-3.jpeg" alt="" class="wp-image-3"/><figcaption>Image 3</figcaption></figure>
		<!-- /wp:image --></figure>
		<!-- /wp:gallery -->` );
		fireEvent.press( galleryBlock );

		// Rearrange items (final disposition will be: Image 3 - Image 1 - Image 2)
		const galleryItem1 = getByA11yLabel( /Image Block\. Row 1/ );
		const galleryItem3 = getByA11yLabel( /Image Block\. Row 3/ );

		fireEvent.press( galleryItem3 );
		fireEvent.press(
			within( galleryItem3 ).getByA11yLabel(
				/Move block left from position 3 to position 2/
			)
		);

		fireEvent.press( galleryItem1 );
		fireEvent.press(
			within( galleryItem1 ).getByA11yLabel(
				/Move block right from position 1 to position 2/
			)
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
