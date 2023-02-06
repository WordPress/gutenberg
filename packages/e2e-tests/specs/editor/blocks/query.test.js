/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	deactivatePlugin,
	createNewPost,
	insertBlock,
	publishPost,
	trashAllPosts,
} from '@wordpress/e2e-test-utils';

const createDemoPosts = async () => {
	await createNewPost( { postType: 'post', title: `Post 1` } );
	await publishPost();
};

describe( 'Query block', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-query-block' );
		await createDemoPosts();
	} );
	afterAll( async () => {
		await trashAllPosts();
		await deactivatePlugin( 'gutenberg-test-query-block' );
	} );
	beforeEach( async () => {
		await createNewPost( { postType: 'page', title: `Query Page` } );
	} );
	afterEach( async () => {
		await trashAllPosts( 'page' );
	} );
	describe( 'Query block insertion', () => {
		it( 'List', async () => {
			await insertBlock( 'Query' );
			// Wait for the choose pattern button
			const choosePatternButton = await page.waitForSelector(
				'div[data-type="core/query"] button.is-primary'
			);
			await choosePatternButton.click();
			// Wait for pattern blocks to be loaded.
			await page.waitForSelector(
				'.block-library-query-pattern__selection-content iframe[title="Editor canvas"]'
			);
			// Choose the standard pattern.
			const chosenPattern = await page.waitForSelector(
				'.block-editor-block-patterns-list__item[aria-label="Standard"]'
			);
			chosenPattern.click();
			// Wait for pattern setup to go away.
			await page.waitForSelector(
				'.block-library-query-pattern__selection-content',
				{
					hidden: true,
				}
			);
			/**
			 * We can't use `getEditedPostContent` easily for now because
			 * `query` makes used of `instanceId` so it's not very reliable.
			 * This should be revisited.
			 */
			await page.waitForSelector( '.wp-block-post-date' );
			await page.waitForSelector( '.wp-block-post-title' );
		} );
	} );
} );
