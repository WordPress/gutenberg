/**
 * External dependencies
 */
import {
	fireEvent,
	getBlock,
	getEditorHtml,
	initializeEditor,
	screen,
	setupCoreBlocks,
	within,
} from 'test/helpers';

const CLASSIC_BLOCK_HTML = `<p>I'm classic!</p>`;
const DEFAULT_EDITOR_CAPABILITIES = {
	unsupportedBlockEditor: true,
	canEnableUnsupportedBlockEditor: true,
};

setupCoreBlocks();

describe( 'Classic block', () => {
	it( 'displays option to edit using web editor', async () => {
		await initializeEditor( {
			initialHtml: CLASSIC_BLOCK_HTML,
			capabilities: DEFAULT_EDITOR_CAPABILITIES,
		} );

		const block = getBlock( screen, 'Classic' );
		fireEvent.press( block );

		// Tap the block to open the unsupported block details
		fireEvent.press( within( block ).getByText( 'Unsupported' ) );

		const actionButton = screen.getByText( 'Edit using web editor' );
		expect( actionButton ).toBeVisible();
	} );

	it( 'converts content into blocks', async () => {
		await initializeEditor( {
			initialHtml: CLASSIC_BLOCK_HTML,
			capabilities: DEFAULT_EDITOR_CAPABILITIES,
		} );

		const block = getBlock( screen, 'Classic' );
		fireEvent.press( block );

		// Tap the block to open the unsupported block details
		fireEvent.press( within( block ).getByText( 'Unsupported' ) );

		const actionButton = screen.getByText( 'Convert to blocks' );
		expect( actionButton ).toBeVisible();

		fireEvent.press( actionButton );
		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
