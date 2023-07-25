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

const block = 'Gallery';
const initialHtml = `
<!-- wp:gallery {"columns":8,"linkTo":"none","className":"alignfull"} -->
<figure class="wp-block-gallery has-nested-images columns-8 is-cropped alignfull"><!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon.png" alt=""/><figcaption class="wp-element-caption">Paragraph</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Heading.png" alt=""/><figcaption class="wp-element-caption">Heading</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Subheading.png" alt=""/><figcaption class="wp-element-caption">Subheading</figcaption></figure>
<!-- /wp:image --></figure>
<!-- /wp:gallery -->`;

const tranformsWithInnerBlocks = [ 'Columns', 'Group' ];
const blockTransforms = [ 'Image', ...tranformsWithInnerBlocks ];

setupCoreBlocks();

describe( `${ block } block transformations`, () => {
	test.each( blockTransforms )( 'to %s block', async ( blockTransform ) => {
		const screen = await initializeEditor( { initialHtml } );
		const newBlock = await transformBlock( screen, block, blockTransform, {
			isMediaBlock: true,
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
