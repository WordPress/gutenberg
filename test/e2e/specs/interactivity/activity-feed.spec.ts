/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'activity feed', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();

		// The `photos` and `videos` pages are navigation targets for the
		// filter tabs on the main (`all`) page. They are created first so
		// their URLs can be passed to the main page's tabs attribute.
		const photosUrl = await utils.addPostWithBlock( 'test/activity-feed', {
			alias: 'activity feed - photos',
			attributes: {
				filter: 'photos',
				posts: [
					{
						id: 11,
						title: 'Photo post',
						text: 'a nice photo',
						comments: { 111: 'nice shot!' },
					},
				],
				tabs: {},
			},
		} );
		const videosUrl = await utils.addPostWithBlock( 'test/activity-feed', {
			alias: 'activity feed - videos',
			attributes: {
				filter: 'videos',
				posts: [
					{
						id: 21,
						title: 'Video post',
						text: 'a great video',
						comments: {},
					},
				],
				tabs: {},
			},
		} );
		await utils.addPostWithBlock( 'test/activity-feed', {
			alias: 'activity feed - all',
			attributes: {
				filter: 'all',
				posts: [
					{
						id: 1,
						title: 'First post',
						text: 'hello world',
						comments: { 101: 'first comment' },
					},
					{
						id: 2,
						title: 'Second post',
						text: 'second post text',
						comments: {},
					},
				],
				tabs: { photos: photosUrl, videos: videosUrl },
			},
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'activity feed - all' ) );
		// Both SSR'd cards are hydrated (each init'd once).
		await expect( page.getByTestId( 'init-total' ) ).toHaveText( '2' );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'filter navigation swaps the whole feed via the router', async ( {
		page,
	} ) => {
		await expect( page.getByTestId( 'post-1' ) ).toBeVisible();
		await expect( page.getByTestId( 'post-2' ) ).toBeVisible();

		await page.getByTestId( 'tab-photos' ).click();

		// The region swapped to the photos feed: the photo card is present,
		// the all-feed cards are gone, and the new content initialized.
		await expect( page.getByTestId( 'post-11' ) ).toBeVisible();
		await expect( page.getByTestId( 'post-11-text' ) ).toHaveText(
			'a nice photo'
		);
		await expect( page.getByTestId( 'post-1' ) ).toHaveCount( 0 );
		await expect( page.getByTestId( 'post-2' ) ).toHaveCount( 0 );
		await expect( page.getByTestId( 'init-total' ) ).toHaveText( '3' );

		// The photos card is fully interactive.
		await page.getByTestId( 'post-11-like' ).click();
		await expect( page.getByTestId( 'post-11-like' ) ).toHaveText( '1' );
	} );

	test( 'load more appends older posts without disturbing existing ones', async ( {
		page,
	} ) => {
		await expect( page.getByTestId( 'post-1' ) ).toBeVisible();

		// Existing card state before the splice.
		await page.getByTestId( 'post-1-like' ).click();
		await expect( page.getByTestId( 'post-1-like' ) ).toHaveText( '1' );

		await page.getByTestId( 'load-more' ).click();

		// Older posts appended at the end, fully interactive.
		await expect( page.getByTestId( 'post-101' ) ).toBeVisible();
		await expect( page.getByTestId( 'post-102' ) ).toBeVisible();
		await page.getByTestId( 'post-101-like' ).click();
		await expect( page.getByTestId( 'post-101-like' ) ).toHaveText( '1' );

		// Appended at the END (after the two existing cards).
		const articles = page.getByTestId( 'feed-list' ).locator( 'article' );
		await expect( articles ).toHaveCount( 4 );
		await expect( articles.nth( 0 ) ).toHaveAttribute(
			'data-testid',
			'post-1'
		);
		await expect( articles.nth( 2 ) ).toHaveAttribute(
			'data-testid',
			'post-101'
		);

		// The existing card kept its element identity: like state survived
		// the splice, and no re-init happened (2 SSR + 2 appended = 4).
		await expect( page.getByTestId( 'post-1-like' ) ).toHaveText( '1' );
		await page.getByTestId( 'post-1-like' ).click();
		await expect( page.getByTestId( 'post-1-like' ) ).toHaveText( '2' );
		await expect( page.getByTestId( 'init-total' ) ).toHaveText( '4' );
	} );

	test( 'creating a new post prepends it and initializes it', async ( {
		page,
	} ) => {
		await expect( page.getByTestId( 'post-1' ) ).toBeVisible();

		await page
			.getByTestId( 'new-post-title' )
			.fill( 'Breaking news' );
		await page.getByTestId( 'create-post' ).click();

		// The new card is at the TOP with the typed title, and is fully
		// interactive.
		const articles = page.getByTestId( 'feed-list' ).locator( 'article' );
		await expect( articles ).toHaveCount( 3 );
		await expect( articles.nth( 0 ) ).toHaveAttribute(
			'data-testid',
			'post-900'
		);
		await expect( articles.nth( 0 ).locator( 'h3' ) ).toHaveText(
			'Breaking news'
		);
		await expect( page.getByTestId( 'post-900-text' ) ).toHaveText(
			'just published'
		);
		await page.getByTestId( 'post-900-like' ).click();
		await expect( page.getByTestId( 'post-900-like' ) ).toHaveText( '1' );

		// Existing cards are untouched: identity + like state preserved, no
		// re-init (2 SSR + 1 new = 3).
		await expect( page.getByTestId( 'post-1-like' ) ).toHaveText( '0' );
		await page.getByTestId( 'post-1-like' ).click();
		await expect( page.getByTestId( 'post-1-like' ) ).toHaveText( '1' );
		await expect( page.getByTestId( 'init-total' ) ).toHaveText( '3' );
	} );
} );
