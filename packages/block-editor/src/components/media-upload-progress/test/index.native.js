/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { sendMediaUpload } from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import {
	MediaUploadProgress,
	MEDIA_UPLOAD_STATE_UPLOADING,
	MEDIA_UPLOAD_STATE_SUCCEEDED,
	MEDIA_UPLOAD_STATE_FAILED,
	MEDIA_UPLOAD_STATE_RESET,
} from '../';

jest.mock( 'react-native-gutenberg-bridge', () => {
	const callUploadCallback = ( payload ) => {
		this.uploadCallBack( payload );
	};
	const subscribeMediaUpload = ( callback ) => {
		this.uploadCallBack = callback;
	};
	return {
		subscribeMediaUpload,
		sendMediaUpload: callUploadCallback,
	};
} );

const MEDIA_ID = 123;

describe( 'MediaUploadProgress component', () => {
	it( 'renders without crashing', () => {
		const wrapper = shallow(
			<MediaUploadProgress renderContent={ () => {} } />
		);
		expect( wrapper ).toBeTruthy();
	} );

	it( 'listens media upload progress', () => {
		const progress = 10;
		const payload = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: MEDIA_ID,
			progress,
		};

		const onUpdateMediaProgress = jest.fn();

		const wrapper = shallow(
			<MediaUploadProgress
				onUpdateMediaProgress={ onUpdateMediaProgress }
				mediaId={ MEDIA_ID }
				renderContent={ () => {} }
			/>
		);

		sendMediaUpload( payload );

		expect( wrapper.instance().state.progress ).toEqual( progress );
		expect( wrapper.instance().state.isUploadInProgress ).toEqual( true );
		expect( wrapper.instance().state.isUploadFailed ).toEqual( false );
		expect( onUpdateMediaProgress ).toHaveBeenCalledTimes( 1 );
		expect( onUpdateMediaProgress ).toHaveBeenCalledWith( payload );
	} );

	it( 'does not get affected by unrelated media uploads', () => {
		const payload = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: 1,
			progress: 20,
		};
		const onUpdateMediaProgress = jest.fn();
		const wrapper = shallow(
			<MediaUploadProgress
				onUpdateMediaProgress={ onUpdateMediaProgress }
				mediaId={ MEDIA_ID }
				renderContent={ () => {} }
			/>
		);

		sendMediaUpload( payload );

		expect( wrapper.instance().state.progress ).toEqual( 0 );
		expect( onUpdateMediaProgress ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'listens media upload success', () => {
		const progress = 10;
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

		const wrapper = shallow(
			<MediaUploadProgress
				onFinishMediaUploadWithSuccess={
					onFinishMediaUploadWithSuccess
				}
				mediaId={ MEDIA_ID }
				renderContent={ () => {} }
			/>
		);

		sendMediaUpload( payloadUploading );

		expect( wrapper.instance().state.progress ).toEqual( progress );

		sendMediaUpload( payloadSuccess );

		expect( wrapper.instance().state.isUploadInProgress ).toEqual( false );
		expect( onFinishMediaUploadWithSuccess ).toHaveBeenCalledTimes( 1 );
		expect( onFinishMediaUploadWithSuccess ).toHaveBeenCalledWith(
			payloadSuccess
		);
	} );

	it( 'listens media upload fail', () => {
		const progress = 10;
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

		const wrapper = shallow(
			<MediaUploadProgress
				onFinishMediaUploadWithFailure={
					onFinishMediaUploadWithFailure
				}
				mediaId={ MEDIA_ID }
				renderContent={ () => {} }
			/>
		);

		sendMediaUpload( payloadUploading );

		expect( wrapper.instance().state.progress ).toEqual( progress );

		sendMediaUpload( payloadFail );

		expect( wrapper.instance().state.isUploadInProgress ).toEqual( false );
		expect( wrapper.instance().state.isUploadFailed ).toEqual( true );
		expect( onFinishMediaUploadWithFailure ).toHaveBeenCalledTimes( 1 );
		expect( onFinishMediaUploadWithFailure ).toHaveBeenCalledWith(
			payloadFail
		);
	} );

	it( 'listens media upload reset', () => {
		const progress = 10;
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

		const wrapper = shallow(
			<MediaUploadProgress
				onMediaUploadStateReset={ onMediaUploadStateReset }
				mediaId={ MEDIA_ID }
				renderContent={ () => {} }
			/>
		);

		sendMediaUpload( payloadUploading );

		expect( wrapper.instance().state.progress ).toEqual( progress );

		sendMediaUpload( payloadReset );

		expect( wrapper.instance().state.isUploadInProgress ).toEqual( false );
		expect( wrapper.instance().state.isUploadFailed ).toEqual( false );
		expect( onMediaUploadStateReset ).toHaveBeenCalledTimes( 1 );
		expect( onMediaUploadStateReset ).toHaveBeenCalledWith( payloadReset );
	} );
} );
