/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * WordPress dependencies
 */
import {
	subscribeMediaUpload,
	sendMediaUpload,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { MediaUploadProgress } from '../';
import {
	MEDIA_UPLOAD_STATE_UPLOADING,
	MEDIA_UPLOAD_STATE_SUCCEEDED,
	MEDIA_UPLOAD_STATE_FAILED,
	MEDIA_UPLOAD_STATE_RESET,
} from '../constants';

let uploadCallBack;
subscribeMediaUpload.mockImplementation( ( callback ) => {
	uploadCallBack = callback;
} );
sendMediaUpload.mockImplementation( ( payload ) => {
	uploadCallBack( payload );
} );

const MEDIA_ID = 123;

describe( 'MediaUploadProgress component', () => {
	it( 'renders without crashing', () => {
		const wrapper = render(
			<MediaUploadProgress renderContent={ () => {} } />
		);
		expect( wrapper ).toBeTruthy();
	} );

	it( 'listens media upload progress', () => {
		const renderContentMock = jest.fn();
		const progress = 0.1;
		const payload = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: MEDIA_ID,
			progress,
		};

		const onUpdateMediaProgress = jest.fn();

		const wrapper = render(
			<MediaUploadProgress
				onUpdateMediaProgress={ onUpdateMediaProgress }
				mediaId={ MEDIA_ID }
				renderContent={ renderContentMock }
			/>
		);

		sendMediaUpload( payload );

		expect( wrapper.getByTestId( 'spinner' ) ).toBeTruthy();
		expect( renderContentMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isUploadInProgress: true,
				isUploadFailed: false,
			} )
		);
		expect( onUpdateMediaProgress ).toHaveBeenCalledTimes( 1 );
		expect( onUpdateMediaProgress ).toHaveBeenCalledWith( payload );
	} );

	it( 'does not get affected by unrelated media uploads', () => {
		const renderContentMock = jest.fn();
		const payload = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: 1,
			progress: 0.2,
		};
		const onUpdateMediaProgress = jest.fn();
		const wrapper = render(
			<MediaUploadProgress
				onUpdateMediaProgress={ onUpdateMediaProgress }
				mediaId={ MEDIA_ID }
				renderContent={ renderContentMock }
			/>
		);

		sendMediaUpload( payload );

		expect( wrapper.queryByTestId( 'spinner' ) ).toBeNull();
		expect( onUpdateMediaProgress ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'listens media upload success', () => {
		const renderContentMock = jest.fn();
		const progress = 0.1;
		const payloadSuccess = {
			state: MEDIA_UPLOAD_STATE_SUCCEEDED,
			mediaId: MEDIA_ID,
		};
		const payloadUploading = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: MEDIA_ID,
			progress,
		};

		const onFinishMediaUploadWithSuccess = jest.fn();

		const wrapper = render(
			<MediaUploadProgress
				onFinishMediaUploadWithSuccess={
					onFinishMediaUploadWithSuccess
				}
				mediaId={ MEDIA_ID }
				renderContent={ renderContentMock }
			/>
		);

		sendMediaUpload( payloadUploading );

		expect( wrapper.getByTestId( 'spinner' ) ).toBeTruthy();

		sendMediaUpload( payloadSuccess );

		expect( renderContentMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isUploadInProgress: false,
			} )
		);
		expect( onFinishMediaUploadWithSuccess ).toHaveBeenCalledTimes( 1 );
		expect( onFinishMediaUploadWithSuccess ).toHaveBeenCalledWith(
			payloadSuccess
		);
	} );

	it( 'listens media upload fail', () => {
		const renderContentMock = jest.fn();
		const progress = 0.1;
		const payloadFail = {
			state: MEDIA_UPLOAD_STATE_FAILED,
			mediaId: MEDIA_ID,
		};
		const payloadUploading = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: MEDIA_ID,
			progress,
		};

		const onFinishMediaUploadWithFailure = jest.fn();

		const wrapper = render(
			<MediaUploadProgress
				onFinishMediaUploadWithFailure={
					onFinishMediaUploadWithFailure
				}
				mediaId={ MEDIA_ID }
				renderContent={ renderContentMock }
			/>
		);

		sendMediaUpload( payloadUploading );

		expect( wrapper.getByTestId( 'spinner' ) ).toBeTruthy();

		sendMediaUpload( payloadFail );

		expect( renderContentMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isUploadInProgress: false,
				isUploadFailed: true,
			} )
		);
		expect( onFinishMediaUploadWithFailure ).toHaveBeenCalledTimes( 1 );
		expect( onFinishMediaUploadWithFailure ).toHaveBeenCalledWith(
			payloadFail
		);
	} );

	it( 'listens media upload reset', () => {
		const renderContentMock = jest.fn();
		const progress = 0.1;
		const payloadReset = {
			state: MEDIA_UPLOAD_STATE_RESET,
			mediaId: MEDIA_ID,
		};
		const payloadUploading = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: MEDIA_ID,
			progress,
		};

		const onMediaUploadStateReset = jest.fn();

		const wrapper = render(
			<MediaUploadProgress
				onMediaUploadStateReset={ onMediaUploadStateReset }
				mediaId={ MEDIA_ID }
				renderContent={ renderContentMock }
			/>
		);

		sendMediaUpload( payloadUploading );

		expect( wrapper.getByTestId( 'spinner' ) ).toBeTruthy();

		sendMediaUpload( payloadReset );

		expect( renderContentMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isUploadInProgress: false,
				isUploadFailed: false,
			} )
		);
		expect( onMediaUploadStateReset ).toHaveBeenCalledTimes( 1 );
		expect( onMediaUploadStateReset ).toHaveBeenCalledWith( payloadReset );
	} );
} );
