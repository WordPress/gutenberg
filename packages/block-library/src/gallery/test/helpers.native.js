/**
 * External dependencies
 */
import {
	act,
	initializeEditor,
	fireEvent,
	waitFor,
	within,
	executeStoreResolvers,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import {
	requestMediaPicker,
	subscribeMediaUpload,
} from '@wordpress/react-native-bridge';
import {
	MEDIA_UPLOAD_STATE_UPLOADING,
	MEDIA_UPLOAD_STATE_SUCCEEDED,
	MEDIA_UPLOAD_STATE_FAILED,
	MEDIA_UPLOAD_STATE_RESET,
} from '@wordpress/block-editor';

/**
 * Adds a Gallery block via the block picker.
 *
 * @return {import('@testing-library/react-native').RenderAPI} A Testing Library screen.
 */
export const addGalleryBlock = async () => {
	const screen = await initializeEditor();
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

/**
 * The gallery items are rendered via the FlatList of the inner block list.
 * In order to render the items of a FlatList, it's required to trigger the
 * "onLayout" event. Additionally, the call is wrapped over "executeStoreResolvers"
 * because the gallery items request the media data associated with the image to
 * be rendered via the "getMedia" selector.
 *
 * @param {import('react-test-renderer').ReactTestInstance} galleryBlock    Gallery block instance to trigger layout event.
 * @param {Object}                                          [options]       Configuration options for the event.
 * @param {number}                                          [options.width] Width value to be passed to the event.
 */
export const triggerGalleryLayout = async (
	galleryBlock,
	{ width = 320 } = {}
) =>
	executeStoreResolvers( () =>
		fireEvent(
			within( galleryBlock ).getByTestId( 'block-list-wrapper' ),
			'layout',
			{
				nativeEvent: {
					layout: {
						width,
					},
				},
			}
		)
	);

/**
 * Initialize the editor with HTML generated of Gallery block.
 *
 * @param {Object}  [options]               Configuration options for the initialization.
 * @param {string}  [options.html]          String of block editor HTML to parse and render.
 * @param {number}  [options.numberOfItems] Number of gallery items to generate or already included in the provided block editor HTML.
 * @param {Object}  [options.media]         Contains media data to be used in the generation.
 * @param {number}  [options.width]         Width to be passed when triggering the "onLayout" event on the Gallery block.
 * @param {boolean} [options.selected]      Specifies if the Gallery block included in the initial HTML should be automatically selected.
 * @param {boolean} [options.useLocalUrl]   Specifies if the items should use the local URL instead of the server URL.
 *
 * @return {import('@testing-library/react-native').RenderAPI} The Testing Library screen plus the Gallery block React Test instance.
 */
export const initializeWithGalleryBlock = async ( {
	html,
	numberOfItems = 0,
	media = [],
	width = 320,
	selected = true,
	useLocalUrl = false,
} = {} ) => {
	const initialHtml =
		html ||
		generateGalleryBlock( numberOfItems, media, {
			useLocalUrl,
		} );
	const screen = await initializeEditor( { initialHtml } );
	const { getByA11yLabel } = screen;

	const galleryBlock = getByA11yLabel( /Gallery Block\. Row 1/ );

	if ( numberOfItems > 0 ) {
		await triggerGalleryLayout( galleryBlock, { width } );
	}

	if ( selected ) {
		fireEvent.press( galleryBlock );
	}

	return { ...screen, galleryBlock };
};

/**
 * Gets a gallery item within a Gallery block.
 *
 * @param {import('react-test-renderer').ReactTestInstance} galleryBlock Gallery block instance.
 * @param {number}                                          rowPosition  Row position within the Gallery block.
 * @return {import('react-test-renderer').ReactTestInstance} Gallery item.
 */
export const getGalleryItem = ( galleryBlock, rowPosition ) => {
	return within( galleryBlock ).getByA11yLabel(
		new RegExp( `Image Block\\. Row ${ rowPosition }` )
	);
};

/**
 * Sets up the media upload mock functions for testing.
 *
 * @typedef {Object} MediaUploadMockFunctions
 * @property {Function} notifyUploadingState Notify uploading state for a media item.
 * @property {Function} notifySucceedState   Notify succeed state for a media item.
 * @property {Function} notifyFailedState    Notify failed state for a media item.
 * @property {Function} notifyResetState     Notify reset state for a media item.
 *
 * @return {MediaUploadMockFunctions} Notify state functions.
 */
export const setupMediaUpload = () => {
	const mediaUploadListeners = [];
	subscribeMediaUpload.mockImplementation( ( callback ) => {
		mediaUploadListeners.push( callback );
		return { remove: jest.fn() };
	} );
	const notifyMediaUpload = ( payload ) =>
		mediaUploadListeners.forEach( ( listener ) => listener( payload ) );

	return {
		notifyUploadingState: async ( mediaItem ) =>
			act( async () => {
				notifyMediaUpload( {
					state: MEDIA_UPLOAD_STATE_UPLOADING,
					mediaId: mediaItem.localId,
					progress: 0.25,
				} );
			} ),
		notifySucceedState: async ( mediaItem ) =>
			act( async () => {
				notifyMediaUpload( {
					state: MEDIA_UPLOAD_STATE_SUCCEEDED,
					mediaId: mediaItem.localId,
					mediaUrl: mediaItem.serverUrl,
					mediaServerId: mediaItem.serverId,
				} );
			} ),
		notifyFailedState: async ( mediaItem ) =>
			act( async () => {
				notifyMediaUpload( {
					state: MEDIA_UPLOAD_STATE_FAILED,
					mediaId: mediaItem.localId,
					progress: 0.5,
				} );
			} ),
		notifyResetState: async ( mediaItem ) =>
			act( async () => {
				notifyMediaUpload( {
					state: MEDIA_UPLOAD_STATE_RESET,
					mediaId: mediaItem.localId,
					progress: 0,
				} );
			} ),
	};
};

/**
 *
 * Sets up Media Picker mock functions.
 *
 * @typedef {Object} MediaPickerMockFunctions
 * @property {Function} expectMediaPickerCall Checks if the request media picker function has been called with specific arguments.
 * @property {Function} mediaPickerCallback   Callback function to notify the media items picked from the media picker.
 *
 * @return {MediaPickerMockFunctions} Media picker mock functions.
 */
export const setupMediaPicker = () => {
	let mediaPickerCallback;
	requestMediaPicker.mockImplementation(
		( source, filter, multiple, callback ) => {
			mediaPickerCallback = callback;
		}
	);
	return {
		expectMediaPickerCall: ( source, filter, multiple ) =>
			expect( requestMediaPicker ).toHaveBeenCalledWith(
				source,
				filter,
				multiple,
				mediaPickerCallback
			),
		mediaPickerCallback: async ( ...mediaItems ) =>
			act( async () =>
				mediaPickerCallback(
					mediaItems.map( ( { localId, localUrl } ) => ( {
						type: 'image',
						url: localUrl,
						id: localId,
					} ) )
				)
			),
	};
};

/**
 * Generates the HTML of a Gallery block.
 *
 * @param {number}  numberOfItems         Number of gallery items to generate.
 * @param {Object}  media                 Contains media data to be used in the generation.
 * @param {Object}  [options]             Configuration options for the generation.
 * @param {boolean} [options.useLocalUrl] Specifies if the items should use the local URL instead of the server URL.
 * @return {string} Gallery block HTML.
 */
export const generateGalleryBlock = (
	numberOfItems,
	media,
	{ useLocalUrl = false } = {}
) => {
	const galleryItems = [ ...Array( numberOfItems ) ]
		.map( ( _, index ) => {
			const id = useLocalUrl
				? media[ index ].localId
				: media[ index ].serverId;
			const url = useLocalUrl
				? media[ index ].localUrl
				: media[ index ].serverUrl;
			return `<!-- wp:image {"id":${ id }} -->
            <figure class="wp-block-image"><img src="${ url }" alt="" class="wp-image-${ id }"/></figure>
            <!-- /wp:image -->`;
		} )
		.join( '\n\n' );

	return `<!-- wp:gallery {"linkTo":"none"} -->
    <figure class="wp-block-gallery has-nested-images columns-default is-cropped">${ galleryItems }</figure>
    <!-- /wp:gallery -->`;
};

/**
 * Sets the text of a caption.
 *
 * @param {import('react-test-renderer').ReactTestInstance} element Caption test instance.
 * @param {string}                                          text    Text to be set.
 */
export const setCaption = ( element, text ) => {
	fireEvent( element, 'focus' );
	fireEvent( element, 'onChange', {
		nativeEvent: {
			eventCount: 1,
			target: undefined,
			text,
		},
	} );
};

/**
 * Opens the block settings of the current selected block.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen The Testing Library screen.
 */
export const openBlockSettings = async ( screen ) => {
	const { getByA11yLabel, getByTestId } = screen;
	fireEvent.press( getByA11yLabel( 'Open Settings' ) );
	await waitFor(
		() => getByTestId( 'block-settings-modal' ).props.isVisible
	);
};
