/**
 * External dependencies
 */
import {
	addBlock,
	getEditorHtml,
	initializeEditor,
	getBlock,
} from 'test/helpers';

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

describe( 'Verse block', () => {
	it( 'inserts block', async () => {
		const screen = await initializeEditor();

		// Add block
		await addBlock( screen, 'Verse' );

		// Get block
		const verseBlock = await getBlock( screen, 'Verse' );
		expect( verseBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'renders block text set as initial content', async () => {
		const screen = await initializeEditor( {
			initialHtml: `<!-- wp:verse -->
			<pre class="wp-block-verse">Sample text</pre>
			<!-- /wp:verse -->`,
		} );

		// Get block
		const verseBlock = await getBlock( screen, 'Verse' );
		expect( verseBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
