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
		await act( () => mediaAppendCallback( MEDIA[ 0 ] ) );
		await act( () => mediaAppendCallback( MEDIA[ 2 ] ) );

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
		await act( () => mediaAppendCallback( MEDIA[ 0 ] ) );
		// Unsupported type (PDF file)
		await act( () => mediaAppendCallback( MEDIA[ 1 ] ) );
		await act( () => mediaAppendCallback( MEDIA[ 3 ] ) );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
