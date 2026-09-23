const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Title block', () => {
	let originalSiteTitle;

	test.beforeAll( async ( { requestUtils } ) => {
		originalSiteTitle = ( await requestUtils.getSiteSettings() ).title;
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.updateSiteSettings( { title: originalSiteTitle } );
	} );

	test( 'Can edit the site title as admin', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/site-title' } );

		const siteTitleBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Site Title',
		} );

		// Update the site title
		await siteTitleBlock
			.getByRole( 'textbox', {
				name: 'Site title text',
			} )
			.fill( 'New Site Title' );

		await editor.publishPost();
		await page.reload();

		await expect( siteTitleBlock ).toBeVisible();
		await expect( siteTitleBlock ).toHaveText( 'New Site Title' );
	} );

	test( 'Undoes a typed site title in one step and redoes it', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/site-title' } );

		const siteTitle = editor.canvas.getByRole( 'textbox', {
			name: 'Site title text',
		} );
		const initialTitle = await siteTitle.textContent();

		await siteTitle.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' abc' );
		await pageUtils.pressKeys( 'primary+z' );

		await expect( siteTitle ).toHaveText( initialTitle );

		// The typing timer fires after the undo too, and must not drop the
		// redo.
		await editor.page.waitForTimeout( 1100 );
		await pageUtils.pressKeys( 'primaryShift+z' );

		await expect( siteTitle ).toHaveText( `${ initialTitle } abc` );
	} );

	test( 'Keeps paragraph and site title typing in separate undo steps', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello' },
		} );
		await editor.insertBlock( { name: 'core/site-title' } );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const siteTitle = editor.canvas.getByRole( 'textbox', {
			name: 'Site title text',
		} );
		const initialTitle = await siteTitle.textContent();

		// Paragraph, site title, and paragraph again, each inside the other's
		// typing window.
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' world' );
		await siteTitle.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' X' );
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '!' );

		await pageUtils.pressKeys( 'primary+z' );

		await expect( paragraph ).toHaveText( 'Hello world' );
		await expect( siteTitle ).toHaveText( `${ initialTitle } X` );
	} );

	// Reason: Needs `RichText` to end the run on blur, split into a follow-up.
	test.fixme( 'Ends the site title undo step when leaving the field', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello' },
		} );
		await editor.insertBlock( { name: 'core/site-title' } );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const siteTitle = editor.canvas.getByRole( 'textbox', {
			name: 'Site title text',
		} );
		const initialTitle = await siteTitle.textContent();

		// Leave and return within the typing window.
		await siteTitle.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' X' );
		await paragraph.click();
		await siteTitle.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' Y' );

		await pageUtils.pressKeys( 'primary+z' );

		await expect( siteTitle ).toHaveText( `${ initialTitle } X` );
	} );

	// Reason: The current e2e test setup doesn't provide an easy way to switch between user roles.
	// eslint-disable-next-line playwright/expect-expect
	test.fixme( 'Cannot edit the site title as editor', async () => {} );
} );
