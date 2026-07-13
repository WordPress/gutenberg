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
		// Creating a page does not create a revision, so update it twice.
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

		// The REST API returns revisions newest first, so the oldest is last.
		const revisions = await requestUtils.rest( {
			path: `/wp/v2/pages/${ post.id }/revisions`,
		} );
		const oldestRevisionId = revisions[ revisions.length - 1 ].id;
		const newestRevisionId = revisions[ 0 ].id;

		// `visitSiteEditor()` dismisses the welcome guide before opening the
		// revision URL directly.
		await admin.visitSiteEditor();
		await admin.visitAdminPage(
			'site-editor.php',
			`p=${ encodeURIComponent(
				`/page/${ post.id }`
			) }&canvas=edit&revision=${ oldestRevisionId }`
		);

		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'First revision' );

		const slider = page.getByRole( 'slider', { name: 'Revision' } );
		await slider.focus();
		await page.keyboard.press( 'End' );
		// Poll because URL writes are debounced.
		await expect
			.poll( () => new URL( page.url() ).searchParams.get( 'revision' ) )
			.toBe( String( newestRevisionId ) );

		await page.getByRole( 'button', { name: 'Exit' } ).click();
		await expect
			.poll( () => new URL( page.url() ).searchParams.get( 'revision' ) )
			.toBe( null );
		expect( new URL( page.url() ).searchParams.get( 'canvas' ) ).toBe(
			'edit'
		);
	} );
} );
