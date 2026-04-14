/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const EDITOR_ZOOM_OUT_CONTENT = `
<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group"><!-- wp:group {"style":{"spacing":{"padding":{"top":"0","bottom":"0","left":"0","right":"0"}},"dimensions":{"minHeight":"100vh"}},"backgroundColor":"base-2","layout":{"type":"flex","orientation":"vertical","verticalAlignment":"space-between"}} -->
<div class="wp-block-group has-base-2-background-color has-background" style="min-height:100vh;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"><!-- wp:paragraph -->
<p>First Section Start</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"layout":{"selfStretch":"fit","flexSize":null}}} -->
<p>First Section Center</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>First Section End</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"0","bottom":"0","left":"0","right":"0"}},"dimensions":{"minHeight":"100vh"}},"backgroundColor":"base","layout":{"type":"flex","orientation":"vertical","verticalAlignment":"space-between"}} -->
<div class="wp-block-group has-base-background-color has-background" style="min-height:100vh;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"><!-- wp:paragraph -->
<p>Second Section Start</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"layout":{"selfStretch":"fit","flexSize":null}}} -->
<p>Second Section Center</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Second Section End</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"0","bottom":"0","left":"0","right":"0"}},"dimensions":{"minHeight":"100vh"}},"backgroundColor":"base-2","layout":{"type":"flex","orientation":"vertical","verticalAlignment":"space-between"}} -->
<div class="wp-block-group has-base-2-background-color has-background" style="min-height:100vh;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"><!-- wp:paragraph -->
<p>Third Section Start</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"layout":{"selfStretch":"fit","flexSize":null}}} -->
<p>Third Section Center</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Third Section End</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"0","bottom":"0","left":"0","right":"0"}},"dimensions":{"minHeight":"100vh"}},"backgroundColor":"base","layout":{"type":"flex","orientation":"vertical","verticalAlignment":"space-between"}} -->
<div class="wp-block-group has-base-background-color has-background" style="min-height:100vh;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"><!-- wp:paragraph -->
<p>Fourth Section Start</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"layout":{"selfStretch":"fit","flexSize":null}}} -->
<p>Fourth Section Center</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Fourth Section End</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></main>
<!-- /wp:group -->`;

const EDITOR_ZOOM_OUT_CONTENT_NO_SECTION_ROOT = `<!-- wp:group {"style":{"spacing":{"padding":{"top":"0","bottom":"0","left":"0","right":"0"}},"dimensions":{"minHeight":"100vh"}},"backgroundColor":"base-2","layout":{"type":"flex","orientation":"vertical","verticalAlignment":"space-between"}} -->
<div class="wp-block-group has-base-2-background-color has-background" style="min-height:100vh;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"><!-- wp:paragraph -->
<p>First Section Start</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"layout":{"selfStretch":"fit","flexSize":null}}} -->
<p>First Section Center</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>First Section End</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

test.describe( 'Zoom Out', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfour' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( {
			postId: 'twentytwentyfour//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test( 'Entering zoomed out mode zooms the canvas', async ( {
		page,
		editor,
	} ) => {
		await page.getByLabel( 'Zoom Out' ).click();
		const iframe = page.locator( 'iframe[name="editor-canvas"]' );
		const html = editor.canvas.locator( 'html' );

		// Check that the html is scaled.
		await expect( html ).toHaveCSS(
			'scale',
			new RegExp( /0\.[5-8][0-9]*/, 'i' )
		);
		const iframeRect = await iframe.boundingBox();
		const htmlRect = await html.boundingBox();

		// Check that the iframe is larger than the html.
		expect( iframeRect.width ).toBeGreaterThan( htmlRect.width );

		// Check that the zoomed out content has a frame around it.
		const paddingTop = await html.evaluate( ( element ) => {
			const paddingValue = window.getComputedStyle( element ).paddingTop;
			return parseFloat( paddingValue );
		} );
		expect( htmlRect.y + paddingTop ).toBeGreaterThan( iframeRect.y );
		expect( htmlRect.x ).toBeGreaterThan( iframeRect.x );
	} );

	test( 'Toggling zoom state should keep content centered', async ( {
		page,
		editor,
	} ) => {
		// Add some patterns into the page.
		await editor.setContent( EDITOR_ZOOM_OUT_CONTENT );
		// Find the scroll container element
		await page.evaluate( () => {
			const { activeElement } =
				document.activeElement?.contentDocument ?? document;
			window.scrollContainer =
				window.wp.dom.getScrollContainer( activeElement );
			return window.scrollContainer;
		} );

		// Test: Test from top of page (scrollTop 0)
		// Enter Zoom Out
		await page.getByRole( 'button', { name: 'Zoom Out' } ).click();

		const scrollTopZoomed = await page.evaluate( () => {
			return window.scrollContainer.scrollTop;
		} );

		expect( scrollTopZoomed ).toBe( 0 );

		// Exit Zoom Out
		await page.getByRole( 'button', { name: 'Zoom Out' } ).click();

		const scrollTopNoZoom = await page.evaluate( () => {
			return window.scrollContainer.scrollTop;
		} );

		expect( scrollTopNoZoom ).toBe( 0 );

		// Test: Should center the scroll position when zooming out/in
		const firstSectionEnd = editor.canvas.locator(
			'text=First Section End'
		);
		const secondSectionStart = editor.canvas.locator(
			'text=Second Section Start'
		);
		const secondSectionCenter = editor.canvas.locator(
			'text=Second Section Center'
		);
		const secondSectionEnd = editor.canvas.locator(
			'text=Second Section End'
		);
		const thirdSectionStart = editor.canvas.locator(
			'text=Third Section Start'
		);
		const thirdSectionCenter = editor.canvas.locator(
			'text=Third Section Center'
		);
		const thirdSectionEnd = editor.canvas.locator(
			'text=Third Section End'
		);
		const fourthSectionStart = editor.canvas.locator(
			'text=Fourth Section Start'
		);

		// Test for second section
		// Playwright scrolls it to the center of the viewport, so this is what we scroll to.
		await secondSectionCenter.scrollIntoViewIfNeeded();

		// Because the text is spread with a group height of 100vh, they should both be visible.
		await expect( firstSectionEnd ).not.toBeInViewport();
		await expect( secondSectionStart ).toBeInViewport();
		await expect( secondSectionEnd ).toBeInViewport();
		await expect( thirdSectionStart ).not.toBeInViewport();

		// After zooming, if we zoomed out with the correct central point, they should both still be visible when toggling zoom out state
		// Enter Zoom Out
		await page.getByRole( 'button', { name: 'Zoom Out' } ).click();
		await expect( firstSectionEnd ).toBeInViewport();
		await expect( secondSectionStart ).toBeInViewport();
		await expect( secondSectionEnd ).toBeInViewport();
		await expect( thirdSectionStart ).toBeInViewport();

		// Exit Zoom Out
		await page.getByRole( 'button', { name: 'Zoom Out' } ).click();
		await expect( firstSectionEnd ).not.toBeInViewport();
		await expect( secondSectionStart ).toBeInViewport();
		await expect( secondSectionEnd ).toBeInViewport();
		await expect( thirdSectionStart ).not.toBeInViewport();

		// Test for third section
		// Playwright scrolls it to the center of the viewport, so this is what we scroll to.
		await thirdSectionCenter.scrollIntoViewIfNeeded();

		// Because the text is spread with a group height of 100vh, they should both be visible.
		await expect( secondSectionEnd ).not.toBeInViewport();
		await expect( thirdSectionStart ).toBeInViewport();
		await expect( thirdSectionEnd ).toBeInViewport();
		await expect( fourthSectionStart ).not.toBeInViewport();

		// After zooming, if we zoomed out with the correct central point, they should both still be visible when toggling zoom out state
		// Enter Zoom Out
		await page.getByRole( 'button', { name: 'Zoom Out' } ).click();
		await expect( secondSectionEnd ).toBeInViewport();
		await expect( thirdSectionStart ).toBeInViewport();
		await expect( thirdSectionEnd ).toBeInViewport();
		await expect( fourthSectionStart ).toBeInViewport();

		// Exit Zoom Out
		await page.getByRole( 'button', { name: 'Zoom Out' } ).click();
		await expect( secondSectionEnd ).not.toBeInViewport();
		await expect( thirdSectionStart ).toBeInViewport();
		await expect( thirdSectionEnd ).toBeInViewport();
		await expect( fourthSectionStart ).not.toBeInViewport();
	} );

	test( 'Zoom out selected section has four items in options menu', async ( {
		page,
	} ) => {
		// open the inserter
		await page
			.getByRole( 'button', {
				name: 'Block Inserter',
				exact: true,
			} )
			.click();
		// switch to patterns tab
		await page.getByRole( 'tab', { name: 'Patterns' } ).click();
		// search for a pattern
		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'Footer' );
		// click on Footer with colophon, 3 columns
		await page
			.getByRole( 'option', { name: 'Footer with colophon, 3 columns' } )
			.click();

		// open the block toolbar more settings menu
		await page.getByLabel( 'Block tools' ).getByLabel( 'Options' ).click();

		// get the length of the options menu
		const optionsMenu = page
			.getByRole( 'menu', { name: 'Options' } )
			.getByRole( 'menuitem' );

		// we expect 2 items in the options menu: Duplicate and Delete.
		await expect( optionsMenu ).toHaveCount( 2 );
	} );

	test( 'Zoom Out cannot be activated when the section root is missing', async ( {
		page,
		editor,
	} ) => {
		await editor.setContent( EDITOR_ZOOM_OUT_CONTENT_NO_SECTION_ROOT );

		// Check that the Zoom Out toggle button is not visible.
		await expect(
			page.getByRole( 'button', { name: 'Zoom Out' } )
		).toBeHidden();

		// Check that activating the Patterns tab in the Inserter does not activate
		// Zoom Out.
		await page
			.getByRole( 'button', {
				name: 'Block Inserter',
				exact: true,
			} )
			.click();

		await page.getByRole( 'tab', { name: 'Patterns' } ).click();

		await expect( page.locator( '.is-zoomed-out' ) ).toBeHidden();
	} );
} );
