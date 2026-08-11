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

	test( 'a user browses the feed end to end', async ( { page } ) => {
		// --- Start on the "all" feed: two SSR'd cards. ---
		await expect( page.getByTestId( 'post-1' ) ).toBeVisible();
		await expect( page.getByTestId( 'post-2' ) ).toBeVisible();

		// Like the first card; state sticks.
		await page.getByTestId( 'post-1-like' ).click();
		await expect( page.getByTestId( 'post-1-like' ) ).toHaveText( '1' );

		// --- Load more: older posts appended at the end. ---
		await page.getByTestId( 'load-more' ).click();
		await expect( page.getByTestId( 'post-101' ) ).toBeVisible();
		await expect( page.getByTestId( 'post-102' ) ).toBeVisible();
		let articles = page.getByTestId( 'feed-list' ).locator( 'article' );
		await expect( articles ).toHaveCount( 4 );
		await expect( articles.nth( 0 ) ).toHaveAttribute(
			'data-testid',
			'post-1'
		);
		await expect( articles.nth( 3 ) ).toHaveAttribute(
			'data-testid',
			'post-102'
		);
		await page.getByTestId( 'post-101-like' ).click();
		await expect( page.getByTestId( 'post-101-like' ) ).toHaveText( '1' );
		// The first card's like survived the splice (identity preserved).
		await expect( page.getByTestId( 'post-1-like' ) ).toHaveText( '1' );
		// No re-init of existing cards (2 SSR + 2 appended = 4).
		await expect( page.getByTestId( 'init-total' ) ).toHaveText( '4' );

		// --- Create a new post: prepended at the top. ---
		await page.getByTestId( 'new-post-title' ).fill( 'Breaking news' );
		await page.getByTestId( 'create-post' ).click();
		await expect( page.getByTestId( 'post-900' ) ).toBeVisible();
		articles = page.getByTestId( 'feed-list' ).locator( 'article' );
		await expect( articles ).toHaveCount( 5 );
		await expect( articles.nth( 0 ) ).toHaveAttribute(
			'data-testid',
			'post-900'
		);
		await expect( articles.nth( 0 ).locator( 'h3' ) ).toHaveText(
			'Breaking news'
		);
		await page.getByTestId( 'post-900-like' ).click();
		await expect( page.getByTestId( 'post-900-like' ) ).toHaveText( '1' );
		// The older card's like survived the prepend.
		await expect( page.getByTestId( 'post-1-like' ) ).toHaveText( '1' );
		// 2 SSR + 2 load-more + 1 new = 5 init runs.
		await expect( page.getByTestId( 'init-total' ) ).toHaveText( '5' );

		// --- Switch to the photos filter (router swaps the whole region). ---
		await page.getByTestId( 'tab-photos' ).click();
		await expect( page.getByTestId( 'post-11' ) ).toBeVisible();
		await expect( page.getByTestId( 'post-11-text' ) ).toHaveText(
			'a nice photo'
		);
		// The all-feed cards are gone.
		await expect( page.getByTestId( 'post-1' ) ).toHaveCount( 0 );
		await expect( page.getByTestId( 'post-900' ) ).toHaveCount( 0 );
		// The photos card initialized once (5 + 1).
		await expect( page.getByTestId( 'init-total' ) ).toHaveText( '6' );
		await page.getByTestId( 'post-11-like' ).click();
		await expect( page.getByTestId( 'post-11-like' ) ).toHaveText( '1' );

		// --- Load more + create post on the photos feed too. ---
		await page.getByTestId( 'load-more' ).click();
		await expect( page.getByTestId( 'post-101' ) ).toBeVisible();
		await page.getByTestId( 'new-post-title' ).fill( 'Photo news' );
		await page.getByTestId( 'create-post' ).click();
		await expect( page.getByTestId( 'post-900' ) ).toBeVisible();
		articles = page.getByTestId( 'feed-list' ).locator( 'article' );
		await expect( articles ).toHaveCount( 4 );
		await expect( articles.nth( 0 ) ).toHaveAttribute(
			'data-testid',
			'post-900'
		);
		await expect( articles.nth( 0 ).locator( 'h3' ) ).toHaveText(
			'Photo news'
		);
		// 6 + 2 load-more + 1 new = 9.
		await expect( page.getByTestId( 'init-total' ) ).toHaveText( '9' );

		// --- Switch to videos, then back to photos. ---
		await page.getByTestId( 'tab-videos' ).click();
		await expect( page.getByTestId( 'post-21' ) ).toBeVisible();
		await expect( page.getByTestId( 'post-21-text' ) ).toHaveText(
			'a great video'
		);
		await page.getByTestId( 'post-21-like' ).click();
		await expect( page.getByTestId( 'post-21-like' ) ).toHaveText( '1' );
		// 9 + 1 = 10.
		await expect( page.getByTestId( 'init-total' ) ).toHaveText( '10' );

		await page.getByTestId( 'tab-photos' ).click();
		await expect( page.getByTestId( 'post-11' ) ).toBeVisible();
		// The photo card's like survived the round trip (region re-hydrated
		// with fresh server content, so like state resets — the fresh card
		// is a new instance).
		await expect( page.getByTestId( 'post-11-like' ) ).toHaveText( '0' );
	} );
} );
