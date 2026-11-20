/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Full-page navigation', () => {
	let post1link: string;
	test.beforeAll( async ( { requestUtils, interactivityUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-full-page-client-side-navigation',
		] );

		await interactivityUtils.activatePlugins();

		// We create the second page first because the first page will link to it.
		const { link: page2link } = await requestUtils.createPost( {
			content: `<!-- wp:paragraph --><p>Page 2</p><!-- /wp:paragraph -->`,
			status: 'publish',
			date_gmt: '2023-01-01T00:00:00',
			title: 'World',
		} );

		const { link } = await requestUtils.createPost( {
			content: `<!-- wp:paragraph -->
<p>Page 1</p>
<p><a data-testid="page-2-link" href="${ page2link }">Page 2 link</a></p>
<!-- /wp:paragraph -->`,
			status: 'publish',
			date_gmt: '2023-01-01T00:00:00',
			title: 'Hello',
		} );
		post1link = link;
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'The <head> element is presered during navigation', async ( {
		page,
	} ) => {
		await page.goto( post1link );

		// Get a reference to the <head> element before navigation
		const initialHeadHandle = await page.evaluateHandle(
			() => document.head
		);

		// Navigate to page 2
		await page.getByTestId( 'page-2-link' ).click();
		await page.waitForLoadState( 'load' );

		// Get a reference to the <head> element after navigation
		const newHeadHandle = await page.evaluateHandle( () => document.head );

		// Compare the two references in the browser context
		const isSameHead = await page.evaluate(
			( [ initialHead, newHead ] ) => initialHead === newHead,
			[ initialHeadHandle, newHeadHandle ]
		);

		expect( isSameHead, 'The <head> should be the same' ).toBe( true );
	} );
} );
