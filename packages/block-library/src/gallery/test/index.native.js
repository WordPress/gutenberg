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
	getOtherMediaOptions,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import {
	addGalleryBlock,
	initializeWithGalleryBlock,
	getGalleryItem,
	setupMediaUpload,
	generateGalleryBlock,
	setCaption,
	setupMediaPicker,
	triggerGalleryLayout,
} from './helpers';

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
	{
		localId: 3,
		localUrl: 'file:///local-image-3.jpeg',
		serverId: 2002,
		serverUrl: 'https://test-site.files.wordpress.com/local-image-3.jpeg',
	},
];

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

		expect( getByA11yLabel( /Gallery Block\. Row 1/ ) ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'selects a gallery item', async () => {
		const { galleryBlock } = initializeWithGalleryBlock(
			generateGalleryBlock( 1, MEDIA ),
			{
				selected: false,
			}
		);

		const galleryItem = getGalleryItem( galleryBlock, 1 );
		fireEvent.press( galleryItem );

		expect( galleryItem ).toBeVisible();
	} );

	it( 'shows appender button when gallery has images', () => {
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			generateGalleryBlock( 1, MEDIA )
		);

		const appenderButton = within( galleryBlock ).getByA11yLabel(
			/Gallery block\. Empty/
		);
		fireEvent.press( appenderButton );

		expect( getByText( 'Choose from device' ) ).toBeVisible();
		expect( getByText( 'Take a Photo' ) ).toBeVisible();
		expect( getByText( 'WordPress Media Library' ) ).toBeVisible();
	} );

	// This case is disabled until the issue (https://github.com/WordPress/gutenberg/issues/38444)
	// is addressed.
	it.skip( 'displays media options picker when selecting the block', () => {
		// Initialize with an empty gallery
		const { getByA11yLabel, getByText, getByTestId } = initializeEditor( {
			initialHtml: generateGalleryBlock( 0 ),
		} );

		// Tap on Gallery block
		fireEvent.press( getByText( 'ADD MEDIA' ) );

		// Observe that media options picker is displayed
		expect( getByText( 'Choose images' ) ).toBeVisible();
		expect( getByText( 'WordPress Media Library' ) ).toBeVisible();

		// Dimiss the picker
		if ( Platform.isIOS ) {
			fireEvent.press( getByText( 'Cancel' ) );
		} else {
			fireEvent( getByTestId( 'media-options-picker' ), 'backdropPress' );
		}

		// Observe that the block is selected, this is done by checking if the block settings
		// button is visible
		const blockActionsButton = getByA11yLabel( /Open Block Actions Menu/ );
		expect( blockActionsButton ).toBeVisible();
	} );

	it( 'finishes pending uploads upon opening the editor (TC001 - Close/Re-open post with an ongoing image upload)', async () => {
		const { notifyUploadingState, notifySucceedState } = setupMediaUpload();

		// Initialize with a gallery that contains two items that are being uploaded
		const { galleryBlock } = initializeWithGalleryBlock(
			generateGalleryBlock( 2, MEDIA, { useLocalUrl: true } )
		);

		// Notify that the media items are uploading
		await notifyUploadingState( MEDIA[ 0 ] );
		await notifyUploadingState( MEDIA[ 1 ] );

		// Check that images are showing a loading state
		expect(
			within( getGalleryItem( galleryBlock, 1 ) ).getByTestId( 'spinner' )
		).toBeVisible();
		expect(
			within( getGalleryItem( galleryBlock, 2 ) ).getByTestId( 'spinner' )
		).toBeVisible();

		// Notify that the media items upload succeeded
		await notifySucceedState( MEDIA[ 0 ] );
		await notifySucceedState( MEDIA[ 1 ] );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'sets caption to gallery (TC003 - Add caption to gallery)', () => {
		// Initialize with a gallery that contains one item
		const { getByA11yLabel } = initializeWithGalleryBlock(
			generateGalleryBlock( 1, MEDIA )
		);

		// Check gallery item caption is not visible
		const galleryItemCaption = getByA11yLabel( /Image caption. Empty/ );
		expect( galleryItemCaption ).not.toBeVisible();

		// Set gallery caption
		const captionField = within(
			getByA11yLabel( /Gallery caption. Empty/ )
		).getByPlaceholderText( 'Add caption' );
		setCaption(
			captionField,
			'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> gallery caption'
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'sets caption to gallery items (TC004 - Add caption to gallery images)', () => {
		// Initialize with a gallery that contains one item
		const { galleryBlock } = initializeWithGalleryBlock(
			generateGalleryBlock( 1, MEDIA )
		);

		// Select gallery item
		const galleryItem = getGalleryItem( galleryBlock, 1 );
		fireEvent.press( galleryItem );

		// Set gallery item caption
		const captionField = within( galleryItem ).getByPlaceholderText(
			'Add caption'
		);
		setCaption(
			captionField,
			'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> image caption'
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'successfully uploads items (TC005 - Choose from device (stay in editor) - Successful upload)', async () => {
		const { notifyUploadingState, notifySucceedState } = setupMediaUpload();
		const {
			expectMediaPickerCall,
			mediaPickerCallback,
		} = setupMediaPicker();

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			generateGalleryBlock( 0 ),
			{
				hasItems: false,
			}
		);

		// Upload images from device
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Choose from device' ) );
		expectMediaPickerCall( 'DEVICE_MEDIA_LIBRARY', [ 'image' ], true );

		// Return media items picked
		await mediaPickerCallback( MEDIA[ 0 ], MEDIA[ 1 ] );

		// Check that gallery items are visible
		triggerGalleryLayout( galleryBlock );
		const galleryItem1 = getGalleryItem( galleryBlock, 1 );
		const galleryItem2 = getGalleryItem( galleryBlock, 2 );
		expect( galleryItem1 ).toBeVisible();
		expect( galleryItem2 ).toBeVisible();

		// Check that images are showing a loading state
		await notifyUploadingState( MEDIA[ 0 ] );
		await notifyUploadingState( MEDIA[ 1 ] );
		expect( within( galleryItem1 ).getByTestId( 'spinner' ) ).toBeVisible();
		expect( within( galleryItem2 ).getByTestId( 'spinner' ) ).toBeVisible();

		// Notify that the media items upload succeeded
		await notifySucceedState( MEDIA[ 0 ] );
		await notifySucceedState( MEDIA[ 1 ] );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'handles failed uploads (TC006 - Choose from device (stay in editor) - Failed upload)', async () => {
		const { notifyUploadingState, notifyFailedState } = setupMediaUpload();
		const {
			expectMediaPickerCall,
			mediaPickerCallback,
		} = setupMediaPicker();

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			generateGalleryBlock( 0 ),
			{
				hasItems: false,
			}
		);
		fireEvent.press( galleryBlock );

		// Upload images from device
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Choose from device' ) );
		expectMediaPickerCall( 'DEVICE_MEDIA_LIBRARY', [ 'image' ], true );

		// Return media items picked
		await mediaPickerCallback( MEDIA[ 0 ], MEDIA[ 1 ] );

		// Check that gallery items are visible
		triggerGalleryLayout( galleryBlock );
		const galleryItem1 = getGalleryItem( galleryBlock, 1 );
		const galleryItem2 = getGalleryItem( galleryBlock, 2 );
		expect( galleryItem1 ).toBeVisible();
		expect( galleryItem2 ).toBeVisible();

		// Check that images are showing a loading state
		await notifyUploadingState( MEDIA[ 0 ] );
		await notifyUploadingState( MEDIA[ 1 ] );
		expect( within( galleryItem1 ).getByTestId( 'spinner' ) ).toBeVisible();
		expect( within( galleryItem2 ).getByTestId( 'spinner' ) ).toBeVisible();

		// Notify that the media items uploads failed
		await notifyFailedState( MEDIA[ 0 ] );
		await notifyFailedState( MEDIA[ 1 ] );

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
		const { notifyUploadingState, notifySucceedState } = setupMediaUpload();
		const {
			expectMediaPickerCall,
			mediaPickerCallback,
		} = setupMediaPicker();

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			generateGalleryBlock( 0 ),
			{
				hasItems: false,
			}
		);

		// Take a photo
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Take a Photo' ) );
		expectMediaPickerCall( 'DEVICE_CAMERA', [ 'image' ], true );

		// Return media item from photo taken
		await mediaPickerCallback( MEDIA[ 0 ] );

		// Check gallery item is visible
		triggerGalleryLayout( galleryBlock );
		const galleryItem = getGalleryItem( galleryBlock, 1 );
		expect( galleryItem ).toBeVisible();

		// Check image is showing a loading state
		await notifyUploadingState( MEDIA[ 0 ] );
		expect( within( galleryItem ).getByTestId( 'spinner' ) ).toBeVisible();

		// Notify that the media item upload succeeded
		await notifySucceedState( MEDIA[ 0 ] );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'uploads from free photo library (TC008 - Choose from the free photo library)', async () => {
		const freePhotoMedia = [ ...MEDIA ].map( ( item, index ) => ( {
			...item,
			localUrl: `https://images.pexels.com/photos/110854/pexels-photo-${
				index + 1
			}.jpeg`,
		} ) );
		const { notifyUploadingState, notifySucceedState } = setupMediaUpload();
		const {
			expectMediaPickerCall,
			mediaPickerCallback,
		} = setupMediaPicker();

		let otherMediaOptionsCallback;
		getOtherMediaOptions.mockImplementation( ( filter, callback ) => {
			otherMediaOptionsCallback = callback;
		} );

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			generateGalleryBlock( 0 ),
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
		expectMediaPickerCall( 'wpios-stock-photo-library', [ 'image' ], true );

		// Return media items picked
		await act( async () =>
			mediaPickerCallback( freePhotoMedia[ 0 ], freePhotoMedia[ 1 ] )
		);

		// Check that gallery items are visible
		triggerGalleryLayout( galleryBlock );
		const galleryItem1 = getGalleryItem( galleryBlock, 1 );
		const galleryItem2 = getGalleryItem( galleryBlock, 2 );
		expect( galleryItem1 ).toBeVisible();
		expect( galleryItem2 ).toBeVisible();

		// Check that images are showing a loading state
		await notifyUploadingState( freePhotoMedia[ 0 ] );
		await notifyUploadingState( freePhotoMedia[ 1 ] );
		expect( within( galleryItem1 ).getByTestId( 'spinner' ) ).toBeVisible();
		expect( within( galleryItem2 ).getByTestId( 'spinner' ) ).toBeVisible();

		// Notify that the media items upload succeeded
		await notifySucceedState( freePhotoMedia[ 0 ] );
		await notifySucceedState( freePhotoMedia[ 1 ] );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'cancels uploads (TC009 - Choose from device (stay in editor) - Cancel upload)', async () => {
		const { notifyUploadingState, notifyResetState } = setupMediaUpload();
		const {
			expectMediaPickerCall,
			mediaPickerCallback,
		} = setupMediaPicker();

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			generateGalleryBlock( 0 ),
			{
				hasItems: false,
			}
		);

		// Upload images from device
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Choose from device' ) );
		expectMediaPickerCall( 'DEVICE_MEDIA_LIBRARY', [ 'image' ], true );

		// Return media items picked
		await mediaPickerCallback( MEDIA[ 0 ], MEDIA[ 1 ] );

		// Check that gallery items are visible
		triggerGalleryLayout( galleryBlock );
		const galleryItem1 = getGalleryItem( galleryBlock, 1 );
		const galleryItem2 = getGalleryItem( galleryBlock, 2 );
		expect( galleryItem1 ).toBeVisible();
		expect( galleryItem2 ).toBeVisible();

		// Check that images are showing a loading state
		await notifyUploadingState( MEDIA[ 0 ] );
		await notifyUploadingState( MEDIA[ 1 ] );
		expect( within( galleryItem1 ).getByTestId( 'spinner' ) ).toBeVisible();
		expect( within( galleryItem2 ).getByTestId( 'spinner' ) ).toBeVisible();

		// Cancel uploads
		fireEvent.press( galleryItem1 );
		fireEvent.press( within( galleryItem1 ).getByTestId( 'spinner' ) );
		expect( requestImageUploadCancelDialog ).toHaveBeenCalledWith(
			MEDIA[ 0 ].localId
		);
		await notifyResetState( MEDIA[ 0 ] );

		fireEvent.press( galleryItem2 );
		fireEvent.press( within( galleryItem2 ).getByTestId( 'spinner' ) );
		expect( requestImageUploadCancelDialog ).toHaveBeenCalledWith(
			MEDIA[ 1 ].localId
		);
		await notifyResetState( MEDIA[ 1 ] );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'rearranges gallery items (TC010 - Rearrange images in Gallery)', async () => {
		// Initialize with a gallery that contains various items
		const { galleryBlock } = initializeWithGalleryBlock(
			generateGalleryBlock( 3, MEDIA )
		);

		// Rearrange items (final disposition will be: Image 3 - Image 1 - Image 2)
		const galleryItem1 = getGalleryItem( galleryBlock, 1 );
		const galleryItem3 = getGalleryItem( galleryBlock, 3 );

		fireEvent.press( galleryItem3 );
		await act( () =>
			fireEvent.press(
				within( galleryItem3 ).getByA11yLabel(
					/Move block left from position 3 to position 2/
				)
			)
		);

		fireEvent.press( galleryItem1 );
		await act( () =>
			fireEvent.press(
				within( galleryItem1 ).getByA11yLabel(
					/Move block right from position 1 to position 2/
				)
			)
		);

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'uploads from other apps (TC011 - Choose from Other Apps (iOS Files App)', async () => {
		const otherAppsMedia = [ ...MEDIA ].map( ( item, index ) => ( {
			...item,
			localUrl: `file:///IMG_${ index + 1 }.JPG`,
		} ) );
		const { notifyUploadingState, notifySucceedState } = setupMediaUpload();
		const {
			expectMediaPickerCall,
			mediaPickerCallback,
		} = setupMediaPicker();

		let otherMediaOptionsCallback;
		getOtherMediaOptions.mockImplementation( ( filter, callback ) => {
			otherMediaOptionsCallback = callback;
		} );

		// Initialize with an empty gallery
		const { galleryBlock, getByText } = initializeWithGalleryBlock(
			generateGalleryBlock( 0 ),
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

		// Upload images from other apps
		fireEvent.press( getByText( 'ADD MEDIA' ) );
		fireEvent.press( getByText( 'Other Apps' ) );
		expectMediaPickerCall( 'wpios-other-files', [ 'image' ], true );

		// Return media items picked
		await mediaPickerCallback( otherAppsMedia[ 0 ], otherAppsMedia[ 1 ] );

		// Check that gallery items are visible
		triggerGalleryLayout( galleryBlock );
		const galleryItem1 = getGalleryItem( galleryBlock, 1 );
		const galleryItem2 = getGalleryItem( galleryBlock, 2 );
		expect( galleryItem1 ).toBeVisible();
		expect( galleryItem2 ).toBeVisible();

		// Check that images are showing a loading state
		await notifyUploadingState( otherAppsMedia[ 0 ] );
		await notifyUploadingState( otherAppsMedia[ 1 ] );
		expect( within( galleryItem1 ).getByTestId( 'spinner' ) ).toBeVisible();
		expect( within( galleryItem2 ).getByTestId( 'spinner' ) ).toBeVisible();

		// Notify that the media items upload succeeded
		await notifySucceedState( otherAppsMedia[ 0 ] );
		await notifySucceedState( otherAppsMedia[ 1 ] );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'overrides "Link to" setting of gallery items (TC012 - Settings - Link to', async () => {
		// Initialize with a gallery that contains two items, the latter includes "linkDestination" attribute
		const {
			galleryBlock,
			getByA11yLabel,
			getByTestId,
			getByText,
		} = initializeWithGalleryBlock( `<!-- wp:gallery {"linkTo":"none"} -->
		<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":${ MEDIA[ 0 ].localId }} -->
		<figure class="wp-block-image"><img src="${ MEDIA[ 0 ].localUrl }" alt="" class="wp-image-${ MEDIA[ 0 ].localId }"/></figure>
		<!-- /wp:image -->
		
		<!-- wp:image {"id":${ MEDIA[ 1 ].localId },"linkDestination":"attachment"} -->
		<figure class="wp-block-image"><img src="${ MEDIA[ 1 ].localUrl }" alt="" class="wp-image-${ MEDIA[ 1 ].localId }"/></figure>
		<!-- /wp:image --></figure>
		<!-- /wp:gallery -->` );
		fireEvent.press( galleryBlock );

		// Set "Link to" setting via Gallery block settings
		fireEvent.press( getByA11yLabel( 'Open Settings' ) );
		await waitFor(
			() => getByTestId( 'block-settings-modal' ).props.isVisible
		);
		fireEvent.press( getByText( 'Link to' ) );
		fireEvent.press( getByText( 'Media File' ) );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'changes columns setting (TC013 - Settings - Columns', async () => {
		// Initialize with a gallery that contains three items
		const {
			galleryBlock,
			getByA11yLabel,
			getByTestId,
		} = initializeWithGalleryBlock( `<!-- wp:gallery {"linkTo":"none"} -->
		<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":${ MEDIA[ 0 ].localId }} -->
		<figure class="wp-block-image"><img src="${ MEDIA[ 0 ].localUrl }" alt="" class="wp-image-${ MEDIA[ 0 ].localId }"/></figure>
		<!-- /wp:image -->
		
		<!-- wp:image {"id":${ MEDIA[ 1 ].localId }} -->
		<figure class="wp-block-image"><img src="${ MEDIA[ 1 ].localUrl }" alt="" class="wp-image-${ MEDIA[ 1 ].localId }"/></figure>
		<!-- /wp:image -->
		
		<!-- wp:image {"id":${ MEDIA[ 2 ].localId }} -->
		<figure class="wp-block-image"><img src="${ MEDIA[ 2 ].localUrl }" alt="" class="wp-image-${ MEDIA[ 2 ].localId }"/></figure>
		<!-- /wp:image --></figure>
		<!-- /wp:gallery -->` );
		fireEvent.press( galleryBlock );

		// Open block settings
		fireEvent.press( getByA11yLabel( 'Open Settings' ) );
		await waitFor(
			() => getByTestId( 'block-settings-modal' ).props.isVisible
		);

		// Can't increment due to maximum value
		// NOTE: Default columns value is 3
		fireEvent(
			getByA11yLabel( /Columns\. Value is 3/ ),
			'accessibilityAction',
			{
				nativeEvent: { actionName: 'increment' },
			}
		);
		expect( getEditorHtml() ).toMatchSnapshot();

		// Decrement columns
		fireEvent(
			getByA11yLabel( /Columns\. Value is 3/ ),
			'accessibilityAction',
			{
				nativeEvent: { actionName: 'decrement' },
			}
		);
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'disables crop images setting (TC014 - Settings - Crop images', async () => {
		// Initialize with a gallery that contains one item
		const {
			galleryBlock,
			getByA11yLabel,
			getByTestId,
			getByText,
		} = initializeWithGalleryBlock( generateGalleryBlock( 1, MEDIA ) );
		fireEvent.press( galleryBlock );

		// Open block settings
		fireEvent.press( getByA11yLabel( 'Open Settings' ) );
		await waitFor(
			() => getByTestId( 'block-settings-modal' ).props.isVisible
		);

		// Disable crop images setting
		fireEvent.press( getByText( 'Crop images' ) );
		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
