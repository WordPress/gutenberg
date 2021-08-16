/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	saveDraft,
} from '@wordpress/e2e-test-utils';

describe( 'Post Title block', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Can edit the post title', async () => {
		await insertBlock( 'Post Title' );

		const titleText = 'Just tweaking the post title';

		await page.click( '[aria-label="Block: Post Title"]' );
		await page.keyboard.type( titleText );

		await saveDraft();
		await page.reload();

		await page.waitForSelector(
			`.editor-post-title >> text="${ titleText }"`
		);
	} );
} );
