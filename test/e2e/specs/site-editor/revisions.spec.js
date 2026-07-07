/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor revisions shareable URLs', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'should open the revision from the URL and keep it in sync', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// Revisions are only created on updates, so update the page twice
		// to get two revisions with distinct content.
		const post = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/pages',
			data: {
				title: 'Revisions URL Page',
				content:
					'<!-- wp:paragraph --><p>Original content</p><!-- /wp:paragraph -->',
				status: 'publish',
			},
		} );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/pages/${ post.id }`,
			data: {
				content:
					'<!-- wp:paragraph --><p>First revision</p><!-- /wp:paragraph -->',
			},
		} );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/pages/${ post.id }`,
			data: {
				content:
					'<!-- wp:paragraph --><p>Second revision</p><!-- /wp:paragraph -->',
			},
		} );

		// The REST API returns revisions newest first.
		const revisions = await requestUtils.rest( {
			path: `/wp/v2/pages/${ post.id }/revisions`,
		} );
		const oldestRevisionId = revisions[ revisions.length - 1 ].id;
		const newestRevisionId = revisions[ 0 ].id;

		// Visit once without the arg so the editor can save the welcome
		// guide preference before the deep link.
		await admin.visitSiteEditor();
		await admin.visitAdminPage(
			'site-editor.php',
			`p=${ encodeURIComponent(
				`/page/${ post.id }`
			) }&canvas=edit&revision=${ oldestRevisionId }`
		);

		// The revisions screen is active at the linked revision.
		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'First revision' );

		// Moving to another revision updates the URL (writes are debounced).
		const slider = page.getByRole( 'slider', { name: 'Revision' } );
		await slider.focus();
		await page.keyboard.press( 'End' );
		await expect
			.poll( () => new URL( page.url() ).searchParams.get( 'revision' ) )
			.toBe( String( newestRevisionId ) );

		// Exiting revisions mode removes the arg but stays in edit mode.
		await page.getByRole( 'button', { name: 'Exit' } ).click();
		await expect
			.poll( () => new URL( page.url() ).searchParams.get( 'revision' ) )
			.toBe( null );
		expect( new URL( page.url() ).searchParams.get( 'canvas' ) ).toBe(
			'edit'
		);
	} );
} );
