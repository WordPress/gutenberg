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

const block = 'Image';
const initialHtml = `
<!-- wp:image {"id":1,"sizeSlug":"large","linkDestination":"media","className":"is-style-default"} -->
<figure class="wp-block-image size-large is-style-default"><a href="https://cldup.com/cXyG__fTLN.jpg"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" class="wp-image-1"/></a><figcaption class="wp-element-caption">Mountain</figcaption></figure>
<!-- /wp:image -->`;

const tranformsWithInnerBlocks = [ 'Gallery', 'Columns', 'Group' ];
const nonMediaTransforms = [ 'File' ];
const blockTransforms = [
	'Cover',
	'Media & Text',
	...tranformsWithInnerBlocks,
	...nonMediaTransforms,
];

setupCoreBlocks();

describe( `${ block } block transformations`, () => {
	test.each( blockTransforms )( 'to %s block', async ( blockTransform ) => {
		const screen = await initializeEditor( { initialHtml } );
		const newBlock = await transformBlock( screen, block, blockTransform, {
			isMediaBlock: ! nonMediaTransforms.includes( blockTransform ),
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
