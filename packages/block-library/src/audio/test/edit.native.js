/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { BlockEdit } from '@wordpress/block-editor';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import {
	subscribeMediaUpload,
	sendMediaUpload,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { metadata, settings, name } from '../index';

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

const AudioEdit = ( { clientId, ...props } ) => (
	<BlockEdit name={ name } clientId={ clientId || 0 } { ...props } />
);

const getTestComponentWithContent = ( attributes = {} ) => {
	return render(
		<AudioEdit attributes={ attributes } setAttributes={ jest.fn() } />
	);
};

describe( 'Audio block', () => {
	beforeAll( () => {
		registerBlockType( name, {
			...metadata,
			...settings,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( name );
	} );

	it( 'renders placeholder without crashing', () => {
		const component = getTestComponentWithContent();
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders audio file without crashing', () => {
		const component = getTestComponentWithContent( {
			src: 'https://cldup.com/59IrU0WJtq.mp3',
			id: '1',
		} );

		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders audio block error state without crashing', () => {
		const MEDIA_ID = '1';
		const component = getTestComponentWithContent( {
			src: 'https://cldup.com/59IrU0WJtq.mp3',
			id: MEDIA_ID,
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
