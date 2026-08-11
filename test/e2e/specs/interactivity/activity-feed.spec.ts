/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

// How the feed cards are identified in the list markup. The same journey
// runs for every variant: `data-wp-key` (the user key `renderHTML`
// prefers), `id` (its fallback), or neither (`none` — synthetic keys only,
// applied at splice time). The `id`/`none` variants are EXPECTED failures:
// only `data-wp-key` survives router navigation (plan.md §9).
//
// Why the split: `data-wp-key` is read into `vnode.key` at PARSE time
// (the `options.vnode` hook in hooks.tsx), so keyed cards are keyed in the
// tree from hydration AND in the router's re-parse of fetched regions —
// keys never match across a navigation, so keyed cards remount fresh (init
// re-runs, context resets). `id` is read ONLY at splice time
// (`applyKeyFallback` in render.ts): SSR'd cards and router-parsed regions
// are unkeyed in the tree, so navigation matches them positionally and
// reuses them (state preserved, no re-init). Within renderHTML splices —
// the unit tests' world — both fallbacks behave identically; navigation is
// outside renderHTML, so only parse-time keys survive it.
const identities = [ 'data-wp-key', 'id', 'none' ];

// The journey itself, shared by every identity variant: like a post, load
// more (append), create a post (prepend), switch filters (router region
// swap), load more + create again, then switch filters twice more.
const browseFeed = async ( page: Page ) => {
	// --- Start on the "all" feed: two SSR'd cards. ---
	await expect( page.getByTestId( 'post-1' ) ).toBeVisible();
	await expect( page.getByTestId( 'post-2' ) ).toBeVisible();

	// Like the first card; state sticks.
	await page.getByTestId( 'post-1-like' ).click();
	await expect( page.getByTestId( 'post-1-like' ) ).toHaveText( '1' );

	// --- Add a comment INTO the card: a splice below a keyed item. ---
	// The card's identity must survive: the like stays, no re-init.
	await page.getByTestId( 'post-1-comment' ).click();
	await expect( page.getByTestId( 'comment-9001' ) ).toBeVisible();
	await expect( page.getByTestId( 'comment-9001' ) ).toHaveText(
		'a fresh comment on post 1'
	);
	// The like survived the splice into the card.
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
	// The photos card initialized once (5 + 1 = 6).
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
	// The photo card's like reset: the region re-hydrated fresh server
	// content, so the keyed card mounted as a new instance.
	await expect( page.getByTestId( 'post-11-like' ) ).toHaveText( '0' );

	// Like the freshly mounted card.
	await page.getByTestId( 'post-11-like' ).click();
	await expect( page.getByTestId( 'post-11-like' ) ).toHaveText( '1' );

	// --- Re-visit the same page: the same keys exist on both sides. ---
	// A keyed item is reused when the new page carries the same key: the
	// element keeps its identity and its state (the like survives), and
	// init does not re-run. The videos→photos swap re-inited the card (11)
	// because post-11's key matched nothing in the videos tree; this
	// same-key swap must NOT re-init (stays 11).
	await page.getByTestId( 'tab-photos' ).click();
	await expect( page.getByTestId( 'post-11' ) ).toBeVisible();
	await expect( page.getByTestId( 'post-11-like' ) ).toHaveText( '1' );
	await expect( page.getByTestId( 'init-total' ) ).toHaveText( '11' );
};

test.describe( 'activity feed', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	for ( const identity of identities ) {
		test.describe( `identity: ${ identity }`, () => {
			test.beforeAll( async ( { interactivityUtils: utils } ) => {
				// The `photos` and `videos` pages are navigation targets for
				// the filter tabs on the main (`all`) page. They are created
				// first so their URLs can be passed to the main page's tabs
				// attribute.
				const photosUrl = await utils.addPostWithBlock(
					'test/activity-feed',
					{
						alias: `activity feed - photos - ${ identity }`,
						attributes: {
							identity,
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
					}
				);
				const videosUrl = await utils.addPostWithBlock(
					'test/activity-feed',
					{
						alias: `activity feed - videos - ${ identity }`,
						attributes: {
							identity,
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
					}
				);
				await utils.addPostWithBlock( 'test/activity-feed', {
					alias: `activity feed - all - ${ identity }`,
					attributes: {
						identity,
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
				await page.goto(
					utils.getLink( `activity feed - all - ${ identity }` )
				);
				// Both SSR'd cards are hydrated (each init'd once).
				await expect( page.getByTestId( 'init-total' ) ).toHaveText(
					'2'
				);
			} );

			// All assertions live in `browseFeed`, which the journey calls.
			// eslint-disable-next-line playwright/expect-expect
			test( 'a user browses the feed end to end', async ( { page } ) => {
				// Only `data-wp-key` survives router navigation: unkeyed
				// cards (id or none) are reused positionally by the router,
				// so their init never re-runs and their context carries
				// over (state preservation — plan.md §9). These variants are
				// EXPECTED failures demonstrating that limitation; if they
				// ever pass, the limitation is gone.
				test.fail(
					identity !== 'data-wp-key',
					'router navigation does not remount unkeyed cards (plan.md §9)'
				);
				await browseFeed( page );
			} );
		} );
	}
} );
