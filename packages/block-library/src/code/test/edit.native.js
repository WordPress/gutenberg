/**
 * External dependencies
 */
import {
	fireEvent,
	getEditorHtml,
	initializeEditor,
	addBlock,
	getBlock,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

describe( 'Code', () => {
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

	it( 'renders without crashing', async () => {
		const screen = await initializeEditor();

		// Add block
		await addBlock( screen, 'Code' );

		// Get block
		const codeBlock = await getBlock( screen, 'Code' );
		expect( codeBlock ).toBeVisible();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'renders given text without crashing', async () => {
		const initialHtml = `<!-- wp:code -->
		<pre class="wp-block-code"><code>Sample text</code></pre>
		<!-- /wp:code -->`;

		const screen = await initializeEditor( {
			initialHtml,
		} );
		const { getByDisplayValue } = screen;

		// Get block
		const codeBlock = await getBlock( screen, 'Code' );
		expect( codeBlock ).toBeVisible();
		fireEvent.press( codeBlock );

		// Get initial text
		const codeBlockText = getByDisplayValue( 'Sample text' );
		expect( codeBlockText ).toBeVisible();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
