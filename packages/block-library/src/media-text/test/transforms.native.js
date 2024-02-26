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

const block = 'Media & Text';
const initialHtmlWithImage = `
<!-- wp:media-text {"mediaId":4674,"mediaType":"image","isStackedOnMobile":false,"className":"is-stacked-on-mobile"} -->
<div class="wp-block-media-text alignwide is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="https://cldup.com/cXyG__fTLN.jpg" class="wp-image-4674 size-full"/></figure><div class="wp-block-media-text__content"><!-- wp:paragraph {"className":"has-large-font-size"} -->
<p class="has-large-font-size">Mountain</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->`;
const initialHtmlWithVideo = `
<!-- wp:media-text {"mediaId":4675,"mediaType":"video","isStackedOnMobile":false,"className":"is-stacked-on-mobile"} -->
<div class="wp-block-media-text alignwide is-stacked-on-mobile"><figure class="wp-block-media-text__media"><video controls src="https://i.cloudup.com/YtZFJbuQCE.mov"></video></figure><div class="wp-block-media-text__content"><!-- wp:paragraph {"className":"has-large-font-size"} -->
<p class="has-large-font-size">Cloudup</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->`;

const tranformsWithInnerBlocks = [ 'Columns', 'Group' ];
const blockTransformsWithImage = [
	'Image',
	'Cover',
	...tranformsWithInnerBlocks,
];
const blockTransformsWithVideo = [
	'Video',
	'Cover',
	...tranformsWithInnerBlocks,
];

setupCoreBlocks();

describe( `${ block } block transformations`, () => {
	describe( 'with Image', () => {
		test.each( blockTransformsWithImage )(
			'to %s block',
			async ( blockTransform ) => {
				const screen = await initializeEditor( {
					initialHtml: initialHtmlWithImage,
				} );
				const newBlock = await transformBlock(
					screen,
					block,
					blockTransform,
					{
						isMediaBlock: true,
						hasInnerBlocks:
							tranformsWithInnerBlocks.includes( blockTransform ),
					}
				);
				expect( newBlock ).toBeVisible();
				expect( getEditorHtml() ).toMatchSnapshot();
			}
		);

		it( 'matches expected transformation options', async () => {
			const screen = await initializeEditor( {
				initialHtml: initialHtmlWithImage,
			} );
			const transformOptions = await getBlockTransformOptions(
				screen,
				block
			);
			expect( transformOptions ).toHaveLength(
				blockTransformsWithImage.length
			);
		} );
	} );

	describe( 'with Video', () => {
		test.each( blockTransformsWithVideo )(
			'to %s block',
			async ( blockTransform ) => {
				const screen = await initializeEditor( {
					initialHtml: initialHtmlWithVideo,
				} );
				const newBlock = await transformBlock(
					screen,
					block,
					blockTransform,
					{
						isMediaBlock: true,
						hasInnerBlocks:
							tranformsWithInnerBlocks.includes( blockTransform ),
					}
				);
				expect( newBlock ).toBeVisible();
				expect( getEditorHtml() ).toMatchSnapshot();
			}
		);

		it( 'matches expected transformation options', async () => {
			const screen = await initializeEditor( {
				initialHtml: initialHtmlWithVideo,
			} );
			const transformOptions = await getBlockTransformOptions(
				screen,
				block
			);
			expect( transformOptions ).toHaveLength(
				blockTransformsWithVideo.length
			);
		} );
	} );
} );
