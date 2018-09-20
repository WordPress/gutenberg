/**
 * Internal dependencies
 */
import {
	newPost,
	insertBlock,
	switchToEditor,
	getEditedPostContent,
} from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

describe( 'Correctly Renders Block Icons on Inserter and Inspector', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-innerblocks-templates' );
	} );

	beforeEach( async () => {
		await newPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-innerblocks-templates' );
	} );

	describe( 'InnerBlocks Template Sync', () => {
		const insertBlockAndAddParagraphInside = async ( blockName, blockSlug ) => {
			const paragraphToAdd = `
			<!-- wp:paragraph -->
			<p>added paragraph</p>
			<!-- /wp:paragraph -->
			`;
			await insertBlock( blockName );
			await switchToEditor( 'Code' );
			await page.$eval( '.editor-post-text-editor', ( element, _paragraph, _blockSlug ) => {
				const blockDelimiter = `<!-- /wp:${ _blockSlug } -->`;
				element.value = element.value.replace( blockDelimiter, _paragraph + blockDelimiter );
			}, paragraphToAdd, blockSlug );
			// press enter inside the code editor so the onChange events for the new value trigger
			await page.click( '.editor-post-text-editor' );
			await page.keyboard.press( 'Enter' );
			await switchToEditor( 'Visual' );
		};

		it( 'Ensures blocks without locking are kept intact even if they do not match the template ', async () => {
			await insertBlockAndAddParagraphInside( 'Test Inner Blocks no locking', 'test/test-inner-blocks-no-locking' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'Removes blocks that are not expected by the template if a lock all exists ', async () => {
			await insertBlockAndAddParagraphInside( 'Test InnerBlocks locking all', 'test/test-inner-blocks-locking-all' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );
} );
