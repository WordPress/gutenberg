/**
 * WordPress dependencies
 */
import {
	activateTheme,
	createNewPost,
	insertBlock,
	pressKeyTimes,
	publishPost,
	setOption,
	trashAllComments,
} from '@wordpress/e2e-test-utils';

describe( 'Comment Query Loop', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await setOption( 'page_comments', true, 'options-discussion.php' );
		await setOption( 'comments_per_page', '1', 'options-discussion.php' );
		await createNewPost();
	} );
	it( 'Pagination links are working as expected', async () => {
		// Insert the Query Comment Loop block.
		await insertBlock( 'Comments Query Loop' );
		// Insert the Comment Loop form.
		await insertBlock( 'Post Comments Form' );
		await publishPost();
		// Visit the post that was just published.
		await page.click(
			'.post-publish-panel__postpublish-buttons .is-primary'
		);

		// Create three comments for that post.
		for ( let i = 0; i < 3; i++ ) {
			await page.waitForSelector( 'textarea#comment' );
			await page.click( 'textarea#comment' );
			await page.type(
				`textarea#comment`,
				`This is an automated comment - ${ i }`
			);
			await pressKeyTimes( 'Tab', 1 );
			await page.keyboard.press( 'Enter' );
			await page.waitForNavigation();
		}

		// We should have a previous comments page link.
		await page.waitForSelector( '.wp-block-comments-pagination-previous' );
		expect(
			await page.$( '.wp-block-comments-pagination-previous' )
		).not.toBeNull();
		expect(
			await page.$( '.wp-block-comments-pagination-next' )
		).toBeNull();

		await page.click( '.wp-block-comments-pagination-previous' );

		// We should have a previous and a next link.
		expect(
			await page.$( '.wp-block-comments-pagination-previous' )
		).not.toBeNull();
		expect(
			await page.$( '.wp-block-comments-pagination-next' )
		).not.toBeNull();
		await page.click( '.wp-block-comments-pagination-previous' );

		// We should only have a next link
		expect(
			await page.$( '.wp-block-comments-pagination-previous' )
		).toBeNull();
		expect(
			await page.$( '.wp-block-comments-pagination-next' )
		).not.toBeNull();
		// Return to the editor and trash all comments.
	} );
	afterAll( async () => {
		await trashAllComments();
		await activateTheme( 'twentytwentyone' );
		await setOption( 'page_comments', false, 'options-discussion.php' );
		await setOption( 'comments_per_page', '50', 'options-discussion.php' );
	} );
} );
