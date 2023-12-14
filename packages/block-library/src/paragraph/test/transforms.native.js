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

const block = 'Paragraph';
const initialHtml = `
<!-- wp:paragraph -->
<p>Example text</p>
<!-- /wp:paragraph -->`;

// NOTE: Paragraph block can be transformed to Buttons block in web,
// however this transform is not supported in the native version.
const transformsWithInnerBlocks = [ 'List', 'Quote', 'Columns', 'Group' ];
const blockTransforms = [
	'Heading',
	'Preformatted',
	'Pullquote',
	'Verse',
	'Code',
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
