/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	setupCoreBlocks,
	transformBlock,
	getBlockTransformOptions,
} from 'test/helpers';

const block = 'Pullquote';
const initialHtml = `
<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>One of the hardest things to do in technology is disrupt yourself.</p><cite>Matt Mullenweg</cite></blockquote></figure>
<!-- /wp:pullquote -->`;

const transformsWithInnerBlocks = [ 'Quote', 'Columns', 'Group' ];
const blockTransforms = [
	'Paragraph',
	'Heading',
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

	it( 'matches expected transformation options', async () => {
		const screen = await initializeEditor( { initialHtml } );
		const transformOptions = await getBlockTransformOptions(
			screen,
			block
		);
		expect( transformOptions ).toHaveLength( blockTransforms.length );
	} );
} );
