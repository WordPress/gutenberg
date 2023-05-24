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

const block = 'Group';
const initialHtml = `
<!-- wp:group -->
<div id="this-is-another-anchor" class="wp-block-group"><!-- wp:paragraph -->
<p>One.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Two</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Three.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

const transformsWithInnerBlocks = [ 'Columns' ];
const blockTransforms = [ ...transformsWithInnerBlocks ];

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
