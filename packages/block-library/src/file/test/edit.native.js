/**
 * External dependencies
 */
import { render, fireEvent } from 'test/helpers';

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
import { FileEdit } from '../edit.native.js';

// eslint-disable-next-line @wordpress/comment-case
// react-native-aztec shouldn't be mocked because these tests are based on
// snapshot testing where we want to keep the original component.
jest.unmock( '@wordpress/react-native-aztec' );

const MEDIA_UPLOAD_STATE_FAILED = 3;

let uploadCallBack;
subscribeMediaUpload.mockImplementation( ( callback ) => {
	uploadCallBack = callback;
} );
sendMediaUpload.mockImplementation( ( payload ) => {
	uploadCallBack( payload );
} );

const getTestComponentWithContent = ( attributes = {} ) => {
	return render(
		<FileEdit
			attributes={ attributes }
			isSelected
			setAttributes={ jest.fn() }
			getMedia={ jest.fn() }
			getStylesFromColorScheme={ jest.fn() }
		/>
	);
};

describe( 'File block', () => {
	it( 'renders placeholder without crashing', () => {
		const component = getTestComponentWithContent();
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders file without crashing', () => {
		const component = getTestComponentWithContent( {
			showDownloadButton: true,
			downloadButtonText: 'Download',
			href: 'https://wordpress.org/latest.zip',
			fileName: 'File name',
			textLinkHref: 'https://wordpress.org/latest.zip',
			id: '1',
		} );

		fireEvent( component.getByTestId( 'file-edit-container' ), 'layout', {
			nativeEvent: { layout: { width: 100 } },
		} );

		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders file error state without crashing', () => {
		const MEDIA_ID = '1';
		const component = getTestComponentWithContent( {
			showDownloadButton: true,
			downloadButtonText: 'Download',
			href: 'https://wordpress.org/latest.zip',
			fileName: 'File name',
			textLinkHref: 'https://wordpress.org/latest.zip',
			id: MEDIA_ID,
		} );
		fireEvent( component.getByTestId( 'file-edit-container' ), 'layout', {
			nativeEvent: { layout: { width: 100 } },
		} );

		const payloadFail = {
			state: MEDIA_UPLOAD_STATE_FAILED,
			mediaId: MEDIA_ID,
		};
		sendMediaUpload( payloadFail );

		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );
} );
