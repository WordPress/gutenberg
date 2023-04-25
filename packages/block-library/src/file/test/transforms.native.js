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

const block = 'File';
const initialHtml = `
<!-- wp:file {"id":3,"href":"https://wordpress.org/latest.zip"} -->
<div class="wp-block-file"><a href="https://wordpress.org/latest.zip">WordPress.zip</a><a href="https://wordpress.org/latest.zip" class="wp-block-file__button wp-element-button" download>Download</a></div>
<!-- /wp:file -->`;

const tranformsWithInnerBlocks = [ 'Columns', 'Group' ];
const blockTransforms = [ ...tranformsWithInnerBlocks ];

setupCoreBlocks();

describe( `${ block } block transformations`, () => {
	test.each( blockTransforms )( 'to %s block', async ( blockTransform ) => {
		const screen = await initializeEditor( { initialHtml } );
		const newBlock = await transformBlock( screen, block, blockTransform, {
			isMediaBlock: false,
			hasInnerBlocks: tranformsWithInnerBlocks.includes( blockTransform ),
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
