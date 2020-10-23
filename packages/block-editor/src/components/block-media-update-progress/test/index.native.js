/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { sendMediaUpload } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import {
	BlockMediaUpdateProgress,
	MEDIA_UPLOAD_STATE_UPLOADING,
	MEDIA_UPLOAD_STATE_SUCCEEDED,
	MEDIA_UPLOAD_STATE_FAILED,
	MEDIA_UPLOAD_STATE_RESET,
} from '../';

jest.mock( '@wordpress/react-native-bridge', () => {
	const callUploadCallback = ( payload ) => {
		this.uploadCallBack( payload );
	};
	const subscribeMediaUpload = ( callback ) => {
		this.uploadCallBack = callback;
	};
	const mediaSources = {
		deviceCamera: 'DEVICE_CAMERA',
		deviceLibrary: 'DEVICE_MEDIA_LIBRARY',
		siteMediaLibrary: 'SITE_MEDIA_LIBRARY',
	};
	return {
		subscribeMediaUpload,
		sendMediaUpload: callUploadCallback,
		mediaSources,
	};
} );

// const MEDIA_ID_REMOTE = 123;
const MEDIA_ID_LOCAL = 2;
// const MEDIA_ID_TEMP = 'tempid-0-1';

// const tempMediaFiles = [{'alt':'','caption':'','id':'tempid-0-1','link':'','mime':'image/jpeg','type':'image','url':''},
// {'alt':'','caption':'','id':'tempid-0-2','link':'','mime':'image/jpeg','type':'image','url':''}];

const localMediaFiles = [
	{
		alt: '',
		caption: '',
		id: 2,
		link: '',
		mime: 'image/jpeg',
		type: 'image',
		url: '',
	},
	{
		alt: '',
		caption: '',
		id: 3,
		link: '',
		mime: 'image/jpeg',
		type: 'image',
		url: '',
	},
];

// const remoteMediaFiles = [{'alt':'','caption':'','id':122,'link':'','mime':'image/jpeg','type':'image','url':''},
// {'alt':'','caption':'','id':123,'link':'','mime':'image/jpeg','type':'image','url':''}];

describe( 'BlockMediaUpdateProgress component', () => {
	it( 'renders without crashing', () => {
		const wrapper = shallow(
			<BlockMediaUpdateProgress renderContent={ () => {} } />
		);
		expect( wrapper ).toBeTruthy();
	} );

	it( 'upload: listens media upload progress for local file', () => {
		const progress = 10;
		const payload = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: MEDIA_ID_LOCAL,
			progress,
		};

		const onUpdateMediaProgress = jest.fn();

		const wrapper = shallow(
			<BlockMediaUpdateProgress
				onUpdateMediaProgress={ onUpdateMediaProgress }
				mediaFiles={ localMediaFiles }
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

	it( 'upload does not get affected by unrelated media uploads', () => {
		const payload = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: 432, // id not belonging to assigned mediaFiles collection in test
			progress: 20,
		};
		const onUpdateMediaProgress = jest.fn();
		const wrapper = shallow(
			<BlockMediaUpdateProgress
				onUpdateMediaProgress={ onUpdateMediaProgress }
				mediaFiles={ localMediaFiles }
				renderContent={ () => {} }
			/>
		);

		sendMediaUpload( payload );

		expect( wrapper.instance().state.progress ).toEqual( 0 );
		expect( onUpdateMediaProgress ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'upload: listens media upload success', () => {
		const progress = 10;
		const payloadSuccess = {
			state: MEDIA_UPLOAD_STATE_SUCCEEDED,
			mediaId: MEDIA_ID_LOCAL,
		};
		const payloadUploading = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: MEDIA_ID_LOCAL,
			progress,
		};

		const onFinishMediaUploadWithSuccess = jest.fn();

		const wrapper = shallow(
			<BlockMediaUpdateProgress
				onFinishMediaUploadWithSuccess={
					onFinishMediaUploadWithSuccess
				}
				mediaFiles={ localMediaFiles }
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

	it( 'upload: listens media upload fail', () => {
		const progress = 10;
		const payloadFail = {
			state: MEDIA_UPLOAD_STATE_FAILED,
			mediaId: MEDIA_ID_LOCAL,
		};
		const payloadUploading = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: MEDIA_ID_LOCAL,
			progress,
		};

		const onFinishMediaUploadWithFailure = jest.fn();

		const wrapper = shallow(
			<BlockMediaUpdateProgress
				onFinishMediaUploadWithFailure={
					onFinishMediaUploadWithFailure
				}
				mediaFiles={ localMediaFiles }
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

	it( 'upload: listens media upload reset', () => {
		const progress = 10;
		const payloadReset = {
			state: MEDIA_UPLOAD_STATE_RESET,
			mediaId: MEDIA_ID_LOCAL,
		};
		const payloadUploading = {
			state: MEDIA_UPLOAD_STATE_UPLOADING,
			mediaId: MEDIA_ID_LOCAL,
			progress,
		};

		const onMediaUploadStateReset = jest.fn();

		const wrapper = shallow(
			<BlockMediaUpdateProgress
				onMediaUploadStateReset={ onMediaUploadStateReset }
				mediaFiles={ localMediaFiles }
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
