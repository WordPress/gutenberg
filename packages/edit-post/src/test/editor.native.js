/**
 * External dependencies
 */
import {
	act,
	addBlock,
	fireEvent,
	getBlock,
	getEditorHtml,
	initializeEditor,
	screen,
	setupCoreBlocks,
} from 'test/helpers';
import { BackHandler } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	requestMediaImport,
	subscribeMediaAppend,
	subscribeParentToggleHTMLMode,
} from '@wordpress/react-native-bridge';

setupCoreBlocks();

let toggleModeCallback;
subscribeParentToggleHTMLMode.mockImplementation( ( callback ) => {
	toggleModeCallback = callback;
} );

let mediaAppendCallback;
subscribeMediaAppend.mockImplementation( ( callback ) => {
	mediaAppendCallback = callback;
} );

const MEDIA = [
	{
		localId: 1,
		mediaUrl: 'file:///local-image-1.jpeg',
		mediaType: 'image',
		serverId: 2000,
		serverUrl: 'https://test-site.files.wordpress.com/local-image-1.jpeg',
	},
	{
		localId: 2,
		mediaUrl: 'file:///local-file-1.pdf',
		mediaType: 'other',
		serverId: 2001,
		serverUrl: 'https://test-site.files.wordpress.com/local-file-1.pdf',
	},
	{
		localId: 3,
		mediaUrl: 'file:///local-image-3.jpeg',
		mediaType: 'image',
		serverId: 2002,
		serverUrl: 'https://test-site.files.wordpress.com/local-image-3.jpeg',
	},
	{
		localId: 4,
		mediaUrl: 'file:///local-video-4.mp4',
		mediaType: 'video',
		serverId: 2003,
		serverUrl: 'https://test-site.files.wordpress.com/local-video-4.mp4',
	},
];

describe( 'Editor', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'toggles the editor from Visual to HTML mode', async () => {
		// Arrange
		await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		act( () => {
			toggleModeCallback();
		} );

		// Assert
		const htmlEditor = screen.getByLabelText( 'html-view-content' );
		expect( htmlEditor ).toBeVisible();

		act( () => {
			toggleModeCallback();
		} );
	} );

	it( 'appends media correctly for allowed types', async () => {
		// Arrange
		requestMediaImport
			.mockImplementationOnce( ( _, callback ) =>
				callback( MEDIA[ 0 ].id, MEDIA[ 0 ].serverUrl )
			)
			.mockImplementationOnce( ( _, callback ) =>
				callback( MEDIA[ 2 ].id, MEDIA[ 2 ].serverUrl )
			);
		await initializeEditor();

		// Act
		act( () => mediaAppendCallback( MEDIA[ 0 ] ) );
		act( () => mediaAppendCallback( MEDIA[ 2 ] ) );
		await screen.findByTestId( `network-image-${ MEDIA[ 0 ].serverUrl }` );
		await screen.findByTestId( `network-image-${ MEDIA[ 2 ].serverUrl }` );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'appends media correctly for allowed types and skips unsupported ones', async () => {
		// Arrange
		requestMediaImport
			.mockImplementationOnce( ( _, callback ) =>
				callback( MEDIA[ 0 ].id, MEDIA[ 0 ].serverUrl )
			)
			.mockImplementationOnce( ( _, callback ) =>
				callback( MEDIA[ 3 ].id, MEDIA[ 3 ].serverUrl )
			);
		await initializeEditor();

		// Act
		act( () => mediaAppendCallback( MEDIA[ 0 ] ) );
		// Unsupported type (PDF file)
		act( () => mediaAppendCallback( MEDIA[ 1 ] ) );
		act( () => mediaAppendCallback( MEDIA[ 3 ] ) );
		await screen.findByTestId( `network-image-${ MEDIA[ 0 ].serverUrl }` );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'unselects current block when tapping on the hardware back button', async () => {
		// Arrange
		await initializeEditor();
		await addBlock( screen, 'Spacer' );

		// Act
		act( () => {
			BackHandler.mockPressBack();
		} );

		// Assert
		const openBlockSettingsButton =
			screen.queryAllByLabelText( 'Open Settings' );
		expect( openBlockSettingsButton.length ).toBe( 0 );
	} );
} );
