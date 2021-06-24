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
		const {
			getByA11yLabel,
			getAllByA11yLabel,
			getByText,
		} = await initializeEditor( {
			initialHtml,
		} );

		// Focus first block
		fireEvent.press( getByA11yLabel( /Paragraph Block. Row 1/ ) );

		// Focus title
		fireEvent( getAllByA11yLabel( 'Post title. test' )[ 0 ], 'select' );

		// Add new Heading block
		fireEvent.press( getByA11yLabel( 'Add block' ) );
		fireEvent.press( getByText( 'Heading' ) );

		expect( getByA11yLabel( /Heading Block. Row 1/ ) ).toBeDefined();
		expect( getByA11yLabel( /Paragraph Block. Row 2/ ) ).toBeDefined();
		expect( getByA11yLabel( /Paragraph Block. Row 3/ ) ).toBeDefined();
	} );
} );

describe( 'when title is no longer focused', () => {
	it( 'new blocks are inserted after the currently focused block', async () => {
		const {
			getByA11yLabel,
			getAllByA11yLabel,
			getByText,
		} = await initializeEditor( {
			initialHtml,
		} );

		// Focus first block
		fireEvent.press( getByA11yLabel( /Paragraph Block. Row 1/ ) );

		// Focus title
		fireEvent( getAllByA11yLabel( 'Post title. test' )[ 0 ], 'select' );

		// Focus last block
		fireEvent.press( getByA11yLabel( /Paragraph Block. Row 2/ ) );

		// Add new Heading block
		fireEvent.press( getByA11yLabel( 'Add block' ) );
		fireEvent.press( getByText( 'Heading' ) );

		expect( getByA11yLabel( /Paragraph Block. Row 1/ ) ).toBeDefined();
		expect( getByA11yLabel( /Paragraph Block. Row 2/ ) ).toBeDefined();
		expect( getByA11yLabel( /Heading Block. Row 3/ ) ).toBeDefined();
	} );
} );
