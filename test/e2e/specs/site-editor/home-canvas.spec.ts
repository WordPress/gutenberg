import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// Whether the run targets the extensible site editor (v2). Its navigation is a
// list of links that stays in place, where the classic editor's is a stack of
// screens with a back button, and its Pages list previews the first page of
// the list rather than one the URL names.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

test.describe( 'Home canvas', () => {
	let testPageId: number;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllPages(),
		] );
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'home',
			title: 'Blog Home',
			content:
				'<!-- wp:paragraph --><p>Home template</p><!-- /wp:paragraph -->',
		} );
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'page',
			title: 'Pages',
			content:
				'<!-- wp:paragraph --><p>Page template</p><!-- /wp:paragraph --><!-- wp:post-content /-->',
		} );
		const testPage = await requestUtils.createPage( {
			title: 'About',
			status: 'publish',
		} );
		testPageId = testPage.id;
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		// The rendering mode of pages is a preference, which the tests set.
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllPages(),
			requestUtils.resetPreferences(),
		] );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'shows the home template after a page shown inside its template', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Pages are shown inside their template, as they are once "Show
		// template" has been ticked for one.
		await admin.visitSiteEditor( { postType: 'page' } );
		await editor.setPreferences( 'core', {
			renderingModes: { emptytheme: { page: 'template-locked' } },
		} );

		// The page in the canvas of the Pages list.
		await admin.visitSiteEditor(
			isSiteEditorV2
				? { postType: 'page' }
				: { postType: 'page', postId: testPageId }
		);
		await expect(
			editor.canvas.getByText( 'Page template' )
		).toBeVisible();

		/*
		 * On to Home without a reload. Home asks for the mode that shows the
		 * template around whatever its canvas resolves to, which here is a
		 * template with none around it, so the mode the page left behind
		 * stays. The canvas still has to show Home rather than keep the page.
		 */
		if ( isSiteEditorV2 ) {
			await page
				.getByRole( 'link', { name: 'Home', exact: true } )
				.click();
		} else {
			await page
				.getByRole( 'button', { name: 'Back', exact: true } )
				.click();
		}

		await expect(
			editor.canvas.getByText( 'Home template' )
		).toBeVisible();
		await expect( editor.canvas.getByText( 'Page template' ) ).toBeHidden();
	} );

	// The canvas of Home is a preview in the extensible site editor, which
	// edits a template on a route of its own.
	test( 'edits the home template after a page shown inside its template @site-editor-v1-only', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( { postType: 'page' } );
		await editor.setPreferences( 'core', {
			renderingModes: { emptytheme: { page: 'template-locked' } },
		} );
		await admin.visitSiteEditor( {
			postType: 'page',
			postId: testPageId,
		} );
		await expect(
			editor.canvas.getByText( 'Page template' )
		).toBeVisible();

		await page.getByRole( 'button', { name: 'Back', exact: true } ).click();
		await expect(
			editor.canvas.getByText( 'Home template' )
		).toBeVisible();

		// Into the editor from the preview. Nothing is rendered around the
		// home template, so nothing of it is locked the way the template
		// around a page is.
		await editor.canvas.locator( 'body' ).click();
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '!' );
		await expect( paragraph ).toHaveText( 'Home template!' );
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save' } )
		).toBeEnabled();
	} );
} );
