/**
 * External dependencies
 */
import { initializeEditor, fireEvent } from 'test/helpers';

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
} );
