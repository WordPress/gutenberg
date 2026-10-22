const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// The styles route of the extensible site editor shows the front end; the
// classic site editor has no equivalent, so its run excludes the tag.
test.describe( 'Styles site preview @site-editor-v2-only', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'shows unsaved global styles on the front end', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( { path: '/styles' } );

		const previewBody = page
			.frameLocator( 'iframe[title="Site preview"]' )
			.locator( 'body' );
		await expect( previewBody ).toBeVisible();

		// Edited through the store, as the styles UI would, without saving.
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const id =
				select( 'core' ).__experimentalGetCurrentGlobalStylesId();
			dispatch( 'core' ).editEntityRecord( 'root', 'globalStyles', id, {
				styles: { color: { background: '#ff0000' } },
			} );
		} );

		await expect( previewBody ).toHaveCSS(
			'background-color',
			'rgb(255, 0, 0)'
		);
	} );

	test( 'keeps the previewed location in the URL', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const { link } = await requestUtils.createPage( {
			title: 'Previewed page',
			status: 'publish',
		} );

		try {
			const { pathname, search } = new URL( link );
			await admin.visitSiteEditor( { path: '/styles' } );
			await page
				.frameLocator( 'iframe[title="Site preview"]' )
				.locator( 'body' )
				.evaluate( ( body, href ) => {
					const anchor = body.ownerDocument.createElement( 'a' );
					anchor.href = href;
					anchor.textContent = 'Go to the page';
					body.prepend( anchor );
				}, link );
			await page
				.frameLocator( 'iframe[title="Site preview"]' )
				.getByRole( 'link', { name: 'Go to the page' } )
				.click();

			await expect(
				page
					.getByRole( 'region', { name: 'Preview address bar' } )
					.getByText( 'Page: Previewed page' )
			).toBeVisible();
			// The route's search params are nested in the encoded `p` arg.
			await expect
				.poll( () =>
					decodeURIComponent( decodeURIComponent( page.url() ) )
				)
				.toContain( `url=${ pathname }${ search }` );
		} finally {
			await requestUtils.deleteAllPages();
		}
	} );
} );
