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
	} );
} );
