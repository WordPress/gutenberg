/**
 * External dependencies
 */
import {
	fireEvent,
	getBlock,
	getEditorHtml,
	initializeEditor,
	setupCoreBlocks,
} from 'test/helpers';

setupCoreBlocks();

describe( 'Block invalid warning', () => {
	it( 'shows invalid placeholder', async () => {
		// Arrange
		const screen = await initializeEditor( {
			initialHtml: `<!-- wp:spacer -->
            <div styless="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
            <!-- /wp:spacer -->`,
		} );

		// Assert
		const warningElement = screen.getByText( /Problem displaying block./ );
		expect( warningElement ).toBeVisible();
	} );

	it( 'recovers a block successfully', async () => {
		// Arrange
		const screen = await initializeEditor( {
			initialHtml: `<!-- wp:spacer -->
            <div styless="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
            <!-- /wp:spacer -->`,
		} );

		// Act
		fireEvent.press( screen.getByText( /Problem displaying block./ ) );
		const spacerBlock = getBlock( screen, 'Spacer' );
		fireEvent.press( spacerBlock );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
        "<!-- wp:spacer -->
        <div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
        <!-- /wp:spacer -->"
        ` );
	} );
} );
