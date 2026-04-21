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

const block = 'List';
const initialHtml = `
<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>First Item</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Second Item</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Third Item</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`;

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
