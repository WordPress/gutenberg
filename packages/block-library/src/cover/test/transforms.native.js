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

const block = 'Cover';
const initialHtmlWithImage = `
<!-- wp:cover {"url":"https://cldup.com/cXyG__fTLN.jpg","id":890,"dimRatio":20,"overlayColor":"luminous-vivid-orange","focalPoint":{"x":"0.63","y":"0.83"},"minHeight":219} -->
<div class="wp-block-cover" style="min-height:219px"><span aria-hidden="true" class="wp-block-cover__background has-luminous-vivid-orange-background-color has-background-dim-20 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-890" alt="" src="https://cldup.com/cXyG__fTLN.jpg" style="object-position:63% 83%" data-object-fit="cover" data-object-position="63% 83%"/><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","className":"has-text-color has-very-light-gray-color","fontSize":"large"} -->
<p class="has-text-align-center has-text-color has-very-light-gray-color has-large-font-size">Cool cover</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->`;
const initialHtmlWithVideo = `
<!-- wp:cover {"url":"https://i.cloudup.com/YtZFJbuQCE.mov","id":891,"dimRatio":20,"overlayColor":"luminous-vivid-orange","backgroundType":"video","focalPoint":{"x":"0.63","y":"0.83"},"minHeight":219,"isDark":false} -->
<div class="wp-block-cover is-light" style="min-height:219px"><span aria-hidden="true" class="wp-block-cover__background has-luminous-vivid-orange-background-color has-background-dim-20 has-background-dim"></span><video class="wp-block-cover__video-background intrinsic-ignore" autoplay muted loop playsinline src="https://i.cloudup.com/YtZFJbuQCE.mov" style="object-position:63% 83%" data-object-fit="cover" data-object-position="63% 83%"></video><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","className":"has-text-color has-very-light-gray-color","fontSize":"large"} -->
<p class="has-text-align-center has-text-color has-very-light-gray-color has-large-font-size">Cool cover</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->`;

const tranformsWithInnerBlocks = [ 'Columns', 'Group' ];
const blockTransformsWithImage = [
	'Image',
	'Media & Text',
	...tranformsWithInnerBlocks,
];
const blockTransformsWithVideo = [
	'Video',
	'Media & Text',
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
