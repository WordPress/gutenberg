/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Token coverage for the root-template feature: when the active theme has a
 * `root.html`, the Site Editor should wrap non-root templates inside it
 * (the regular editor stays in wrap mode rather than dropping into focus
 * mode). Root.html itself opens directly.
 *
 * Manually verifying the preview-picker, the chrome locking, and the
 * frontend `template_include` swap is out of scope here — those are
 * smoke-test territory. This spec guards the URL routing and that the
 * editor applies the wrap (via `__experimentalRootInnerTemplateId`).
 *
 * The root template is created via a direct REST POST rather than
 * `requestUtils.createTemplate`, because that helper hardcodes
 * `is_wp_suggestion: true`, which prevents the entity from showing up via
 * `useEntityRecord` lookup-by-id in the editor.
 */
test.describe( 'Root template: wrap routing', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/templates',
			params: {
				slug: 'root',
				title: 'Root',
				content:
					'<!-- wp:group {"tagName":"main"} --><main class="wp-block-group"><!-- wp:paragraph --><p>Root chrome paragraph</p><!-- /wp:paragraph --><!-- wp:template-content /--></main><!-- /wp:group -->',
				status: 'publish',
			},
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'wraps non-root templates inside root.html (no focus mode)', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		await page.click( 'role=button[name="Templates"]' );

		// Click any template other than Root. `Index` is the catch-all that
		// emptytheme always provides.
		await page
			.locator( '.fields-field__title', { hasText: 'Index' } )
			.click();

		// The user URL points at the inner template …
		// Path is URL-encoded in the `p=` query param.
		await expect( page ).toHaveURL( /wp_template%2Femptytheme%2F%2Findex/ );
		await expect( page ).not.toHaveURL( /focusMode=true/ );

		// … but the editor wraps it in root.html, exposed via the inner
		// template id setting. The block-editor settings can be polled via
		// `wp.data` once the editor has booted.
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSettings().__experimentalRootInnerTemplateId
				)
			)
			.toBe( 'emptytheme//index' );
	} );

	test( 'opens root.html itself in the regular editor (no focus mode)', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		await page.click( 'role=button[name="Templates"]' );

		await page
			.locator( '.fields-field__title', { hasText: 'Root' } )
			.click();

		// The path is URL-encoded in the `p=` query param.
		await expect( page ).toHaveURL( /wp_template%2Femptytheme%2F%2Froot/ );
		await expect( page ).not.toHaveURL( /focusMode=true/ );
	} );

	test( 'surfaces "Edit root template" only on chrome blocks', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		await page.click( 'role=button[name="Templates"]' );

		await page
			.locator( '.fields-field__title', { hasText: 'Index' } )
			.click();

		// Wait for wrap mode to apply. Chrome blocks should be 'contentOnly'.
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSettings().__experimentalRootInnerTemplateId
				)
			)
			.toBe( 'emptytheme//index' );

		// Select the root chrome paragraph (a chrome top, not template-part).
		const chromeParagraphId = await page.evaluate( () => {
			const sel = window.wp.data.select( 'core/block-editor' );
			// Walk the tree to find the chrome paragraph by its content.
			const walk = ( id ) => {
				const block = sel.getBlock( id );
				if (
					block?.name === 'core/paragraph' &&
					block?.attributes?.content?.includes?.( 'Root chrome' )
				) {
					return id;
				}
				for ( const child of sel.getBlockOrder( id ) ) {
					const found = walk( child );
					if ( found ) {
						return found;
					}
				}
				return null;
			};
			return walk( '' );
		} );
		await page.evaluate( ( id ) => {
			window.wp.data.dispatch( 'core/block-editor' ).selectBlock( id );
		}, chromeParagraphId );

		// The toolbar item shows up.
		await expect(
			page.getByRole( 'button', { name: 'Edit root template' } )
		).toBeVisible();

		// Now select the template-content block. The button should be gone.
		await page.evaluate( () => {
			const sel = window.wp.data.select( 'core/block-editor' );
			const walk = ( id ) => {
				if ( sel.getBlockName( id ) === 'core/template-content' ) {
					return id;
				}
				for ( const child of sel.getBlockOrder( id ) ) {
					const found = walk( child );
					if ( found ) {
						return found;
					}
				}
				return null;
			};
			const tcId = walk( '' );
			window.wp.data.dispatch( 'core/block-editor' ).selectBlock( tcId );
		} );

		await expect(
			page.getByRole( 'button', { name: 'Edit root template' } )
		).toBeHidden();
	} );
} );
