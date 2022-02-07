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
export const triggerGalleryLayout = ( galleryBlock, { width = 320 } = {} ) =>
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

export const initializeWithGalleryBlock = async (
	initialHtml,
	{ hasItems = true, deviceWidth = 320, selected = true } = {}
) => {
	const screen = await initializeEditor( { initialHtml } );
	const { getByA11yLabel } = screen;

	const galleryBlock = getByA11yLabel( /Gallery Block\. Row 1/ );

	if ( hasItems ) {
		triggerGalleryLayout( galleryBlock, { deviceWidth } );
	}

	if ( selected ) {
		fireEvent.press( galleryBlock );
	}

	return { ...screen, galleryBlock };
};

export const getGalleryItem = ( galleryBlock, rowPosition ) => {
	return within( galleryBlock ).getByA11yLabel(
		new RegExp( `Image Block\\. Row ${ rowPosition }` )
	);
};

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
