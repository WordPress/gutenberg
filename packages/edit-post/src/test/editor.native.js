/**
 * External dependencies
 */
import {
	act,
	addBlock,
	fireEvent,
	getBlock,
	getEditorHtml,
	getEditorTitle,
	initializeEditor,
	pasteIntoRichText,
	screen,
	setupCoreBlocks,
	within,
} from 'test/helpers';
import { BackHandler } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	requestMediaImport,
	subscribeMediaAppend,
	subscribeParentToggleHTMLMode,
	subscribeToContentUpdate,
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

let onContentUpdateCallback;
subscribeToContentUpdate.mockImplementation( ( callback ) => {
	onContentUpdateCallback = callback;
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

	it( 'adds empty image block when pasting unsupported HTML local image path', async () => {
		await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );

		pasteIntoRichText( paragraphTextInput, {
			text: '<div><img src="file:LOW-RES.png"></div>',
		} );

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'adds image block when pasting HTML local image path', async () => {
		await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );

		pasteIntoRichText( paragraphTextInput, {
			files: [ 'file:///path/to/file.png' ],
		} );

		expect( getEditorHtml() ).toMatchSnapshot();
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

	describe( 'on content update', () => {
		const MARKDOWN = `# Sample Document\nLorem ipsum dolor sit amet, consectetur adipiscing 
						elit.\n## Overview\n- Lorem ipsum dolor sit amet\n- Consectetur adipiscing
						 elit\n- Integer nec odio\n## Details\n1. Sed cursus ante dapibus diam\n2. 
						 Nulla quis sem at nibh elementum imperdiet\n3. Duis sagittis ipsum\n
						 ## Mixed Lists\n- Key Points:\n 1. Lorem ipsum dolor sit amet\n 2. 
						 Consectetur adipiscing elit\n 3. Integer nec odio\n- Additional Info:\n -
						  Sed cursus ante dapibus diam\n - Nulla quis sem at nibh elementum imperdiet\n`;

		it( 'parses markdown into blocks', async () => {
			// Arrange
			await initializeEditor( {
				initialTitle: null,
			} );

			// Act
			act( () => {
				onContentUpdateCallback( {
					content: MARKDOWN,
				} );
			} );

			// Assert
			// Needed to for the "Processed HTML piece" log.
			expect( console ).toHaveLogged();
			expect( getEditorTitle() ).toBe( 'Sample Document' );
			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'parses a markdown heading into a title', async () => {
			// Arrange
			await initializeEditor( {
				initialTitle: null,
			} );

			// Act
			act( () => {
				onContentUpdateCallback( {
					content: `# Sample Document`,
				} );
			} );

			// Assert
			// Needed to for the "Processed HTML piece" log.
			expect( console ).toHaveLogged();
			expect( getEditorTitle() ).toBe( 'Sample Document' );
			expect( getEditorHtml() ).toBe( '' );
		} );

		it( 'parses standard text into blocks', async () => {
			// Arrange
			await initializeEditor( {
				initialTitle: null,
			} );

			// Act
			act( () => {
				onContentUpdateCallback( {
					content: `Lorem ipsum dolor sit amet`,
				} );
			} );

			// Assert
			// Needed to for the "Processed HTML piece" log.
			expect( console ).toHaveLogged();
			expect( getEditorTitle() ).toBe( 'Lorem ipsum dolor sit amet' );
			expect( getEditorHtml() ).toBe( '' );
		} );
	} );
} );
