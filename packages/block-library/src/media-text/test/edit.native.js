/**
 * External dependencies
 */
import {
	addBlock,
	fireEvent,
	initializeEditor,
	screen,
	setupCoreBlocks,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import {
	requestMediaPicker,
	sendMediaUpload,
	subscribeMediaUpload,
} from '@wordpress/react-native-bridge';
import { MEDIA_UPLOAD_STATE_PAUSED } from '@wordpress/block-editor';

let uploadCallBack;
subscribeMediaUpload.mockImplementation( ( callback ) => {
	uploadCallBack = callback;
} );
sendMediaUpload.mockImplementation( ( payload ) => {
	uploadCallBack( payload );
} );

setupCoreBlocks( [ 'core/media-text' ] );

describe( 'Media & Text block edit', () => {
	it( 'should display an error message for failed video uploads', async () => {
		requestMediaPicker.mockImplementation(
			( source, filter, multiple, callback ) => {
				callback( {
					id: 1,
					url: 'file://video.mp4',
					type: 'video',
				} );
			}
		);
		await initializeEditor();
		await addBlock( screen, 'Media & Text' );
		fireEvent.press( screen.getByText( 'Add image or video' ) );
		fireEvent.press( screen.getByText( 'Choose from device' ) );

		sendMediaUpload( {
			mediaId: 1,
			state: MEDIA_UPLOAD_STATE_PAUSED,
			progress: 0,
		} );

		expect(
			screen.getByText( 'Failed to insert media.\nTap for more info.' )
		).toBeVisible();
	} );
} );
