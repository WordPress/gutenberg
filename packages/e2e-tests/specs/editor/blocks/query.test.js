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
		it( 'Carousel', async () => {
			await insertBlock( 'Query' );
			// Wait for pattern blocks to be loaded.
			await page.waitForSelector(
				'.block-editor-block-pattern-setup__container .wp-block-post-title'
			);
			/**
			 * Ensure that carousel is working by checking slider css classes
			 * and navigating to the next pattern.
			 */
			await page.waitForSelector(
				'li.pattern-slide.active-slide[aria-label="Query Test 1"]'
			);
			const nextPatternButton = await page.waitForSelector(
				'.block-editor-block-pattern-setup__navigation button[aria-label="Next pattern"]'
			);
			await nextPatternButton.click();
			await page.waitForSelector(
				'li.pattern-slide.active-slide[aria-label="Query Test 2"]'
			);
			// Choose the selected pattern.
			const chooseButton = await page.waitForXPath(
				'//div[contains(@class, "block-editor-block-pattern-setup__actions")]//button[text()="Choose"]'
			);
			chooseButton.click();
			// Wait for pattern setup to go away.
			await page.waitForSelector( '.block-editor-block-pattern-setup', {
				hidden: true,
			} );
			/**
			 * We can't use `getEditedPostContent` easily for now because
			 * `query` makes used of `instanceId` so it's not very reliable.
			 * This should be revisited.
			 */
			await page.waitForSelector( '.wp-block-post-date' );
			await page.waitForSelector( '.wp-block-post-title' );
		} );
		it( 'Grid view', async () => {
			await insertBlock( 'Query' );
			// Wait for patterns setup to be loaded.
			await page.waitForSelector(
				'.block-editor-block-pattern-setup__display-controls'
			);
			// Click the Grid view button.
			const gridViewButton = await page.waitForSelector(
				'.block-editor-block-pattern-setup__display-controls button[aria-label="Grid view"]'
			);
			await gridViewButton.click();
			// Wait for patterns to be loaded and click the wanted pattern.
			const gridPattern = await page.waitForXPath(
				'//div[@class="block-editor-block-pattern-setup-list__item-title" and contains(text(), "Query Test 2")]'
			);
			await gridPattern.click();
			// Wait for pattern setup to go away.
			await page.waitForSelector( '.block-editor-block-pattern-setup', {
				hidden: true,
			} );
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
