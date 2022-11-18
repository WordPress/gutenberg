/**
 * External dependencies
 */
import { initializeEditor, fireEvent, getBlock } from 'test/helpers';

/**
 * WordPress dependencies
 */
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
		const paragraphBlock = await getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );

		// Focus title
		fireEvent(
			screen.getAllByLabelText( 'Post title. test' )[ 0 ],
			'select'
		);

		// Add new Heading block
		fireEvent.press( screen.getByLabelText( 'Add block' ) );
		fireEvent.press( screen.getByText( 'Heading' ) );

		const headingBlock = await getBlock( screen, 'Heading' );
		expect( headingBlock ).toBeDefined();

		const secondParagraphBlock = await getBlock( screen, 'Paragraph', {
			rowIndex: 2,
		} );
		expect( secondParagraphBlock ).toBeDefined();

		const thirdParagraphBlock = await getBlock( screen, 'Paragraph', {
			rowIndex: 3,
		} );
		expect( thirdParagraphBlock ).toBeDefined();
	} );
} );

describe( 'when title is no longer focused', () => {
	it( 'new blocks are inserted after the currently focused block', async () => {
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Focus first block
		const paragraphBlock = await getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );

		// Focus title
		fireEvent(
			screen.getAllByLabelText( 'Post title. test' )[ 0 ],
			'select'
		);

		// Focus last block
		const secondParagraphBlock = await getBlock( screen, 'Paragraph', {
			rowIndex: 2,
		} );
		fireEvent.press( secondParagraphBlock );

		// Add new Heading block
		fireEvent.press( screen.getByLabelText( 'Add block' ) );
		fireEvent.press( screen.getByText( 'Heading' ) );

		expect( paragraphBlock ).toBeDefined();
		expect( secondParagraphBlock ).toBeDefined();

		const headingBlock = await getBlock( screen, 'Heading', {
			rowIndex: 3,
		} );
		expect( headingBlock ).toBeDefined();
	} );
} );
