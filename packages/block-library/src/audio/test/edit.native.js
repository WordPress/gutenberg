/**
 * External dependencies
 */
import {
	addBlock,
	dismissModal,
	fireEvent,
	getBlock,
	getEditorHtml,
	initializeEditor,
	openBlockSettings,
	render,
	screen,
	setupCoreBlocks,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { BlockEdit } from '@wordpress/block-editor';
import {
	subscribeMediaUpload,
	sendMediaUpload,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { name } from '../index';

// react-native-aztec shouldn't be mocked because these tests are based on
// snapshot testing where we want to keep the original component.
jest.unmock( '@wordpress/react-native-aztec' );

const MEDIA_UPLOAD_STATE_FAILED = 3;

const AUDIO_BLOCK = `<!-- wp:audio {"id":5} -->
<figure class="wp-block-audio"><audio controls src="https://cldup.com/59IrU0WJtq.mp3"></audio></figure>
<!-- /wp:audio -->`;

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

setupCoreBlocks( [ 'core/audio' ] );

describe( 'Audio block', () => {
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

	it( 'should gracefully handle invalid URLs', async () => {
		await initializeEditor();

		await addBlock( screen, 'Audio' );
		fireEvent.press( screen.getByText( 'Insert from URL' ) );
		fireEvent.changeText(
			screen.getByPlaceholderText( 'Type a URL' ),
			'h://wordpress.org/audio.mp3'
		);
		dismissModal( screen.getByTestId( 'bottom-sheet' ) );

		expect(
			screen.getByText( 'Invalid URL. Audio file not found.' )
		).toBeVisible();
	} );

	it( 'should enable autoplay setting', async () => {
		await initializeEditor( { initialHtml: AUDIO_BLOCK } );

		const audioBlock = getBlock( screen, 'Audio' );
		fireEvent.press( audioBlock );
		await openBlockSettings( screen );

		fireEvent.press( screen.getByText( 'Autoplay' ) );
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should enable loop setting', async () => {
		await initializeEditor( { initialHtml: AUDIO_BLOCK } );

		const audioBlock = getBlock( screen, 'Audio' );
		fireEvent.press( audioBlock );
		await openBlockSettings( screen );

		fireEvent.press( screen.getByText( 'Loop' ) );
		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
