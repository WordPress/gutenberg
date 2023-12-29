/**
 * External dependencies
 */
import { initializeEditor, getEditorHtml, fireEvent } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

beforeAll( () => {
	// Register all core blocks
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

const MEDIA_OPTIONS = [
	'Choose from device',
	'Take a Photo',
	'WordPress Media Library',
];

const initialHtml = `
<!-- wp:paragraph -->
<p>First example paragraph.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Second example paragraph.</p>
<!-- /wp:paragraph -->
`;

describe( 'when title is focused', () => {
	it( 'new blocks are inserted after the title', async () => {
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Focus first block
		fireEvent.press(
			screen.getAllByLabelText( /Paragraph Block. Row 1/ )[ 0 ]
		);

		// Focus title
		fireEvent(
			screen.getAllByLabelText( 'Post title. test' )[ 0 ],
			'select'
		);

		// Add new Heading block
		fireEvent.press( screen.getByLabelText( 'Add block' ) );
		fireEvent.press( screen.getByText( 'Heading' ) );

		expect(
			screen.getAllByLabelText( /Heading Block. Row 1/ )[ 0 ]
		).toBeDefined();
		expect(
			screen.getAllByLabelText( /Paragraph Block. Row 2/ )[ 0 ]
		).toBeDefined();

		expect(
			screen.getAllByLabelText( /Paragraph Block. Row 3/ )[ 0 ]
		).toBeDefined();
	} );

	it( 'media blocks should be displayed', async () => {
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Focus first block
		fireEvent.press(
			screen.getAllByLabelText( /Paragraph Block. Row 1/ )[ 0 ]
		);

		// Focus title
		fireEvent(
			screen.getAllByLabelText( 'Post title. test' )[ 0 ],
			'select'
		);

		// Assert that the media buttons are visible
		const imageButton = await screen.findByTestId( 'insert-image-button' );
		expect( imageButton ).toBeVisible();

		const videoButton = await screen.findByTestId( 'insert-video-button' );
		expect( videoButton ).toBeVisible();

		const galleryButton = await screen.findByTestId(
			'insert-gallery-button'
		);
		expect( galleryButton ).toBeVisible();

		const audioButton = await screen.findByTestId( 'insert-audio-button' );
		expect( audioButton ).toBeVisible();
	} );
} );

describe( 'when title is no longer focused', () => {
	it( 'new blocks are inserted after the currently focused block', async () => {
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Focus first block
		fireEvent.press(
			screen.getAllByLabelText( /Paragraph Block. Row 1/ )[ 0 ]
		);

		// Focus title
		fireEvent(
			screen.getAllByLabelText( 'Post title. test' )[ 0 ],
			'select'
		);

		// Focus last block
		fireEvent.press(
			screen.getAllByLabelText( /Paragraph Block. Row 2/ )[ 0 ]
		);

		// Add new Heading block
		fireEvent.press( screen.getByLabelText( 'Add block' ) );
		fireEvent.press( screen.getByText( 'Heading' ) );

		expect(
			screen.getAllByLabelText( /Paragraph Block. Row 1/ )[ 0 ]
		).toBeDefined();
		expect(
			screen.getAllByLabelText( /Paragraph Block. Row 2/ )[ 0 ]
		).toBeDefined();
		expect(
			screen.getAllByLabelText( /Heading Block. Row 3/ )[ 0 ]
		).toBeDefined();
	} );

	it( 'media blocks should not be displayed', async () => {
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Focus first block
		fireEvent.press(
			screen.getAllByLabelText( /Paragraph Block. Row 1/ )[ 0 ]
		);

		// Focus title
		fireEvent(
			screen.getAllByLabelText( 'Post title. test' )[ 0 ],
			'select'
		);

		// Focus last block
		fireEvent.press(
			screen.getAllByLabelText( /Paragraph Block. Row 2/ )[ 0 ]
		);

		// Assert that the media buttons are not visible
		const imageButton = screen.queryByTestId( 'insert-image-button' );
		expect( imageButton ).toBeNull();

		const videoButton = screen.queryByTestId( 'insert-video-button' );
		expect( videoButton ).toBeNull();

		const galleryButton = screen.queryByTestId( 'insert-gallery-button' );
		expect( galleryButton ).toBeNull();

		const audioButton = screen.queryByTestId( 'insert-audio-button' );
		expect( audioButton ).toBeNull();
	} );
} );

describe( 'when nothing is selected', () => {
	it( 'media buttons and picker display correctly', async () => {
		const screen = await initializeEditor( {
			initialHtml,
		} );

		const { getByText, getByTestId } = screen;

		// Check that the gallery button is visible within the toolbar
		const galleryButton = await screen.queryByTestId(
			'insert-gallery-button'
		);
		expect( galleryButton ).toBeVisible();

		// Press the toolbar Gallery button
		fireEvent.press( galleryButton );

		// Expect the block to be created
		expect(
			screen.getAllByLabelText( /Gallery Block. Row 3/ )[ 0 ]
		).toBeDefined();

		expect( getByText( 'Choose images' ) ).toBeVisible();
		MEDIA_OPTIONS.forEach( ( option ) =>
			expect( getByText( option ) ).toBeVisible()
		);

		// Dismiss the picker
		if ( Platform.isIOS ) {
			fireEvent.press( getByText( 'Cancel' ) );
		} else {
			fireEvent( getByTestId( 'media-options-picker' ), 'backdropPress' );
		}

		// Expect the Gallery block to remain
		expect(
			screen.getAllByLabelText( /Gallery Block. Row 3/ )[ 0 ]
		).toBeDefined();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
