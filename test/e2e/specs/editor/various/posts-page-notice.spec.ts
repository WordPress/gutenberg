import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const NOTICE =
	'You are currently editing the page that shows your latest posts.';

test.describe( 'Posts page notice', () => {
	let postsPageId: number;
	let otherPageId: number;

	test.beforeAll( async ( { requestUtils } ) => {
		const [ postsPage, otherPage ] = await Promise.all( [
			requestUtils.createPage( { title: 'Blog', status: 'publish' } ),
			requestUtils.createPage( { title: 'About', status: 'publish' } ),
		] );
		postsPageId = postsPage.id;
		otherPageId = otherPage.id;
		await requestUtils.updateSiteSettings( {
			show_on_front: 'page',
			page_on_front: otherPageId,
			page_for_posts: postsPageId,
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.updateSiteSettings( {
			show_on_front: 'posts',
			page_on_front: 0,
			page_for_posts: 0,
		} );
		await requestUtils.deleteAllPages();
	} );

	test( 'should show the notice once while editing the posts page', async ( {
		admin,
		page,
	} ) => {
		const editorContent = page.getByRole( 'region', {
			name: 'Editor content',
		} );
		const notice = editorContent.getByText( NOTICE );

		await admin.editPost( postsPageId );
		await expect( notice ).toBeVisible();

		// WordPress adds the same notice from the server, through the notices
		// store. Only the editor's own should show.
		const storedNotices = await page.evaluate( () =>
			window.wp.data
				.select( 'core/notices' )
				.getNotices()
				.map( ( { content }: { content: string } ) => content )
		);
		expect( storedNotices ).not.toContain( NOTICE );

		await admin.editPost( otherPageId );
		await expect( editorContent ).toBeVisible();
		await expect( notice ).toBeHidden();
	} );
} );
