/**
 * External dependencies
 */
import {
	addBlock,
	dismissModal,
	fireEvent,
	initializeEditor,
	screen,
	setupCoreBlocks,
} from 'test/helpers';

setupCoreBlocks( [ 'core/video' ] );

describe( 'Video block', () => {
	it( 'should gracefully handle invalid URLs', async () => {
		await initializeEditor();

		await addBlock( screen, 'Video' );
		fireEvent.press( screen.getByText( 'Insert from URL' ) );
		fireEvent.changeText(
			screen.getByPlaceholderText( 'Type a URL' ),
			'h://wordpress.org/video.mp4'
		);
		dismissModal( screen.getByTestId( 'bottom-sheet' ) );

		expect( screen.getByText( 'Invalid URL.' ) ).toBeVisible();
		// Expecations added due to a 17.5.1-specific hotifx: https://github.com/WordPress/gutenberg/pull/58031
		expect( console ).toHaveWarnedWith(
			"wp.data.select( 'core/preferences' ).get( 'core/edit-post', 'editorMode' ) is deprecated since version 6.5. Please use wp.data.select( 'core/preferences' ).get( 'core', 'editorMode' ) instead."
		);
		expect( console ).toHaveWarnedWith(
			"wp.data.select( 'core/preferences' ).get( 'core/edit-post', 'hiddenBlockTypes' ) is deprecated since version 6.5. Please use wp.data.select( 'core/preferences' ).get( 'core', 'hiddenBlockTypes' ) instead."
		);
	} );
} );
