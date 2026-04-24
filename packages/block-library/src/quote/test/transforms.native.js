/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	setupCoreBlocks,
	transformBlock,
	getBlock,
	openBlockActionsMenu,
	fireEvent,
	getBlockTransformOptions,
} from 'test/helpers';

const block = 'Quote';
const initialHtml = `
<!-- wp:quote {"textAlign":"left","className":"is-style-large"} -->
<blockquote class="wp-block-quote has-text-align-left is-style-large"><!-- wp:paragraph -->
<p>"This will make running your own blog a viable alternative again."</p>
<!-- /wp:paragraph --><cite>— <a href="https://twitter.com/azumbrunnen_/status/1019347243084800005">Adrian Zumbrunnen</a></cite></blockquote>
<!-- /wp:quote -->`;

const transformsWithInnerBlocks = [ 'Columns', 'Group' ];
const blockTransforms = [
	'Pullquote',
	'Paragraph',
	...transformsWithInnerBlocks,
];

setupCoreBlocks();

describe( `${ block } block transforms`, () => {
	test.each( blockTransforms )( 'to %s block', async ( blockTransform ) => {
		const screen = await initializeEditor( { initialHtml } );
		const newBlock = await transformBlock( screen, block, blockTransform, {
			hasInnerBlocks:
				transformsWithInnerBlocks.includes( blockTransform ),
		} );
		expect( newBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'ungroups block', async () => {
		const screen = await initializeEditor( { initialHtml } );
		const { getByText } = screen;
		fireEvent.press( getBlock( screen, block ) );

		await openBlockActionsMenu( screen );
		fireEvent.press( getByText( 'Ungroup' ) );

		// The first block created is the content of the Paragraph block.
		const paragraph = getBlock( screen, 'Paragraph', 0 );
		expect( paragraph ).toBeVisible();
		// The second block created is the content of the citation element.
		const citation = getBlock( screen, 'Paragraph', 1 );
		expect( citation ).toBeVisible();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'matches expected transformation options', async () => {
		const screen = await initializeEditor( { initialHtml } );
		const transformOptions = await getBlockTransformOptions(
			screen,
			block
		);
		expect( transformOptions ).toHaveLength( blockTransforms.length );
	} );
} );
