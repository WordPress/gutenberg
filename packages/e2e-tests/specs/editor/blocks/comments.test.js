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
	saveDraft,
} from '@wordpress/e2e-test-utils';

describe( 'Comments', () => {
	let previousPageComments,
		previousCommentsPerPage,
		previousDefaultCommentsPage;
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		previousPageComments = await setOption( 'page_comments', '1' );
		previousCommentsPerPage = await setOption( 'comments_per_page', '1' );
		previousDefaultCommentsPage = await setOption(
			'default_comments_page',
			'newest'
		);
	} );
	it( 'We show no results message if there are no comments', async () => {
		await trashAllComments();
		await createNewPost();
		await insertBlock( 'Comments' );
		await page.waitForXPath( '//p[contains(text(), "No results found.")]' );
		// Prevent the "unsaved changes" warning dialog from opening.
		await saveDraft();
	} );
	it( 'Pagination links are working as expected', async () => {
		await createNewPost();
		await insertBlock( 'Comments' );
		await publishPost();
		// Visit the post that was just published.
		await page.click(
			'.post-publish-panel__postpublish-buttons .is-primary'
		);

		// TODO: We can extract this into a util once we find we need it elsewhere.
		// Create three comments for that post.
		for ( let i = 0; i < 3; i++ ) {
			await page.waitForSelector( 'textarea#comment' );
			await page.click( 'textarea#comment' );
			await page.type(
				`textarea#comment`,
				`This is an automated comment - ${ i }`
			);
			await pressKeyTimes( 'Tab', 1 );
			await Promise.all( [
				page.keyboard.press( 'Enter' ),
				page.waitForNavigation( { waitUntil: 'networkidle0' } ),
			] );
		}

		// We check that there is a previous comments page link.
		await expect( page ).toMatchElement(
			'.wp-block-comments-pagination-previous'
		);
		await expect( page ).not.toMatchElement(
			'.wp-block-comments-pagination-next'
		);

		await Promise.all( [
			page.click( '.wp-block-comments-pagination-previous' ),
			page.waitForNavigation( { waitUntil: 'networkidle0' } ),
		] );

		// We check that there are a previous and a next link.
		await expect( page ).toMatchElement(
			'.wp-block-comments-pagination-previous'
		);
		await expect( page ).toMatchElement(
			'.wp-block-comments-pagination-next'
		);

		await Promise.all( [
			page.click( '.wp-block-comments-pagination-previous' ),
			page.waitForNavigation( { waitUntil: 'networkidle0' } ),
		] );

		// We check that there is only a next comments page link.
		await expect( page ).not.toMatchElement(
			'.wp-block-comments-pagination-previous'
		);
		await expect( page ).toMatchElement(
			'.wp-block-comments-pagination-next'
		);
	} );
	it( 'Pagination links are not appearing if break comments is not enabled', async () => {
		await setOption( 'page_comments', '0' );
		await createNewPost();
		await insertBlock( 'Comments' );
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
			await Promise.all( [
				page.keyboard.press( 'Enter' ),
				page.waitForNavigation( { waitUntil: 'networkidle0' } ),
			] );
		}
		// We check that there are no comments page link.
		await expect( page ).not.toMatchElement(
			'.wp-block-comments-pagination-previous'
		);
		await expect( page ).not.toMatchElement(
			'.wp-block-comments-pagination-next'
		);
	} );
	afterAll( async () => {
		await trashAllComments();
		await activateTheme( 'twentytwentyone' );
		await setOption( 'page_comments', previousPageComments );
		await setOption( 'comments_per_page', previousCommentsPerPage );
		await setOption( 'default_comments_page', previousDefaultCommentsPage );
	} );
} );
