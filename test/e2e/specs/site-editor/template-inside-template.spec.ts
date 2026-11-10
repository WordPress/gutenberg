import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

/**
 * Creates a template rendered inside the template it names.
 *
 * The `template` field belongs to the templates inside templates experiment,
 * so the payload the request utils take does not know it.
 *
 * @param requestUtils The request utils of the test.
 * @param payload      The template, with the slug of the template it is rendered inside.
 */
function createTemplateInside(
	requestUtils: RequestUtils,
	payload: Parameters< RequestUtils[ 'createTemplate' ] >[ 1 ] & {
		template: string;
	}
) {
	return requestUtils.createTemplate( 'wp_template', payload );
}

const LAYOUT_CONTENT = `<!-- wp:paragraph --><p>Shared header</p><!-- /wp:paragraph -->
<!-- wp:template-slot --><!-- wp:paragraph --><p>Shown on its own</p><!-- /wp:paragraph --><!-- /wp:template-slot -->
<!-- wp:paragraph --><p>Shared footer</p><!-- /wp:paragraph -->`;

const NOT_FOUND_CONTENT = `<!-- wp:heading --><h2 class="wp-block-heading">Nothing here</h2><!-- /wp:heading -->`;

test.describe( 'Template rendered inside another template', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-template-inheritance',
		] );
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		// "Show template" saves the rendering mode in the user's preferences,
		// so it is reset for each test rather than left to leak into the next.
		await requestUtils.resetPreferences();
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'layout',
			title: 'Layout',
			content: LAYOUT_CONTENT,
		} );
		await createTemplateInside( requestUtils, {
			slug: '404',
			title: '404',
			content: NOT_FOUND_CONTENT,
			template: 'layout',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.resetPreferences();
	} );

	test( 'renders the template inside the one it names', async ( {
		page,
	} ) => {
		await page.goto( '/a-page-that-does-not-exist/' );

		await expect(
			page.getByRole( 'heading', { name: 'Nothing here' } )
		).toBeVisible();
		await expect( page.getByText( 'Shared header' ) ).toBeVisible();
		await expect( page.getByText( 'Shared footer' ) ).toBeVisible();
		// The template takes the place of what the slot holds.
		await expect( page.getByText( 'Shown on its own' ) ).toBeHidden();
	} );

	test( 'shows the template it is rendered inside in the summary', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//404',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// The row shows the value beside its label, and describes the button
		// that opens the control with it.
		await expect(
			page.getByRole( 'button', { name: 'Edit Template' } )
		).toHaveAccessibleDescription( 'Layout' );
	} );

	test( 'renders the template inside it around the blocks being edited', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//404',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();

		// The blocks of the layout template are around the ones being edited.
		await expect(
			editor.canvas.getByText( 'Shared footer' )
		).toBeVisible();

		// The blocks being edited are the editable ones, in the template slot
		// block of the layout template, in place of what the slot holds.
		await expect(
			editor.canvas.getByText( 'Shown on its own' )
		).toBeHidden();
		const heading = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		await expect( heading ).toBeVisible();
		await heading.click();
		await page.keyboard.type( '!' );

		// The block carries the `document` role while it is edited, which stands
		// in for the role of the heading it renders, so the text is read from the
		// block rather than from a heading.
		await expect( heading ).toHaveText( 'Nothing here!' );
	} );

	test( 'renders the template on its own when it names none', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//404',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'Edit Template' } ).click();
		await page.getByRole( 'combobox', { name: 'Template' } ).click();
		await page.getByRole( 'option', { name: 'None' } ).click();
		await page.keyboard.press( 'Escape' );

		// The template is the only entity the change dirties, so it is saved
		// without the panel that lists several.
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		await page.goto( '/a-page-that-does-not-exist/' );

		await expect(
			page.getByRole( 'heading', { name: 'Nothing here' } )
		).toBeVisible();
		await expect( page.getByText( 'Shared footer' ) ).toBeHidden();
	} );

	test( 'edits a template on its own once it names none', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//404',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();
		await page.keyboard.press( 'Escape' );

		await expect(
			editor.canvas.getByText( 'Shared footer' )
		).toBeVisible();

		/*
		 * Naming no template leaves the canvas nothing to render around it, so
		 * the template is edited on its own rather than waiting for a template
		 * to render it inside that never arrives. The choice of showing the
		 * template is saved for every template, so it outlives the one that had
		 * one to show.
		 */
		await page.getByRole( 'button', { name: 'Edit Template' } ).click();
		await page.getByRole( 'combobox', { name: 'Template' } ).click();
		await page.getByRole( 'option', { name: 'None' } ).click();
		await page.keyboard.press( 'Escape' );

		await expect( editor.canvas.getByText( 'Shared footer' ) ).toBeHidden();

		const heading = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		await expect( heading ).toBeVisible();
		await heading.click();
		await page.keyboard.type( '!' );

		await expect( heading ).toHaveText( 'Nothing here!' );
	} );

	test( 'leaves the blocks of the template around it to that template', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'shell',
			title: 'Shell',
			content: '<!-- wp:post-title /--><!-- wp:template-slot /-->',
		} );
		await createTemplateInside( requestUtils, {
			slug: 'search',
			title: 'Search',
			content:
				'<!-- wp:heading --><h2 class="wp-block-heading">Results</h2><!-- /wp:heading -->',
			template: 'shell',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//search',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();
		await page.keyboard.press( 'Escape' );

		// The blocks being edited are the ones in the slot.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Heading' } )
		).toBeVisible();

		const editingModes = await page.evaluate( () => {
			const { getBlocksByName, getBlockEditingMode } =
				window.wp.data.select( 'core/block-editor' );
			return Object.fromEntries(
				[ 'core/post-title', 'core/template-slot' ].map( ( name ) => [
					name,
					getBlockEditingMode( getBlocksByName( name )[ 0 ] ),
				] )
			);
		} );

		expect( editingModes ).toEqual( {
			/*
			 * The title block of the template around it is that template's own,
			 * and the server substitutes the slot alone, so editing it here
			 * would rename the template being edited and change nothing on the
			 * front end.
			 */
			'core/post-title': 'disabled',
			'core/template-slot': 'contentOnly',
		} );
	} );

	test( 'edits the template parts of the template being edited as it does on its own', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'frame-header',
			title: 'Frame header',
			content:
				'<!-- wp:paragraph --><p>Frame header text</p><!-- /wp:paragraph -->',
		} );
		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'archive-sidebar',
			title: 'Archive sidebar',
			content:
				'<!-- wp:paragraph --><p>Archive sidebar text</p><!-- /wp:paragraph -->',
		} );
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'frame',
			title: 'Frame',
			content:
				'<!-- wp:template-part {"slug":"frame-header","theme":"emptytheme"} /--><!-- wp:template-slot /-->',
		} );
		await createTemplateInside( requestUtils, {
			slug: 'archive',
			title: 'Archive',
			content:
				'<!-- wp:heading --><h2 class="wp-block-heading">Archive</h2><!-- /wp:heading --><!-- wp:template-part {"slug":"archive-sidebar","theme":"emptytheme"} /-->',
			template: 'frame',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//archive',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// The editing modes of each template part, and of the first block in it,
		// keyed by the slug of the part.
		const getTemplatePartEditingModes = () =>
			page.evaluate( () => {
				const {
					getBlocksByName,
					getBlockAttributes,
					getBlockOrder,
					getBlockEditingMode,
				} = window.wp.data.select( 'core/block-editor' );
				return Object.fromEntries(
					getBlocksByName( 'core/template-part' ).map(
						( clientId: string ) => [
							getBlockAttributes( clientId ).slug,
							{
								part: getBlockEditingMode( clientId ),
								content: getBlockEditingMode(
									getBlockOrder( clientId )[ 0 ]
								),
							},
						]
					)
				);
			} );

		await expect(
			editor.canvas.getByText( 'Archive sidebar text' )
		).toBeVisible();
		const onItsOwn = await getTemplatePartEditingModes();

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();
		await page.keyboard.press( 'Escape' );

		await expect(
			editor.canvas.getByText( 'Frame header text' )
		).toBeVisible();
		await expect(
			editor.canvas.getByText( 'Archive sidebar text' )
		).toBeVisible();
		const insideFrame = await getTemplatePartEditingModes();

		// The part of the template being edited is edited as it is when that
		// template is edited on its own, rather than locked with the template
		// around it.
		expect( insideFrame[ 'archive-sidebar' ] ).toEqual(
			onItsOwn[ 'archive-sidebar' ]
		);
		expect( insideFrame[ 'archive-sidebar' ].content ).not.toBe(
			'disabled'
		);

		// The part of the template around it belongs to that template, which
		// is edited on its own screen, so neither it nor its blocks can be
		// selected, and it offers no section to edit.
		expect( insideFrame[ 'frame-header' ] ).toEqual( {
			part: 'disabled',
			content: 'disabled',
		} );

		// A template part covers its blocks until it is selected, as it does
		// wherever it is edited, so it is selected before its text is.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Archive sidebar' } )
			.click();
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Archive sidebar text' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '!' );
		await expect(
			editor.canvas.getByText( 'Archive sidebar text!' )
		).toBeVisible();
	} );

	test( 'labels the archive by the template being edited rather than the one around it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'archive-frame',
			title: 'Archive frame',
			content: '<!-- wp:template-slot /-->',
		} );
		await createTemplateInside( requestUtils, {
			slug: 'category',
			title: 'Category',
			content: '<!-- wp:query-title {"type":"archive"} /-->',
			template: 'archive-frame',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//category',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		const archiveTitle = editor.canvas.locator( '.wp-block-query-title' );
		await expect( archiveTitle ).toHaveText( 'Category: Name' );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();
		await page.keyboard.press( 'Escape' );

		// The title is still the category's, rather than the generic label of a
		// template, `archive-frame`, whose slug names no archive.
		await expect( archiveTitle ).toHaveText( 'Category: Name' );
	} );

	test( 'previews the blocks in the slot as the template they belong to', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'wrapper',
			title: 'Wrapper',
			content: '<!-- wp:post-title /--><!-- wp:template-slot /-->',
		} );
		await createTemplateInside( requestUtils, {
			slug: 'single',
			title: 'Single',
			content: '<!-- wp:post-title /--><!-- wp:post-content /-->',
			template: 'wrapper',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//single',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show template' } )
			.click();
		await page.keyboard.press( 'Escape' );

		/*
		 * The blocks in the slot are the ones of the template being edited, and
		 * they stand for the post it renders the way they do when it is edited on
		 * its own: the title is the one a post has yet to be given rather than the
		 * title of the template. So does the title in the template around it,
		 * which shows the title of the same post on the front end, rather than
		 * the title of the template being edited.
		 */
		const titles = editor.canvas.locator( '.wp-block-post-title' );
		await expect( titles ).toHaveCount( 2 );
		await expect( titles.nth( 0 ) ).toHaveText( 'Title' );
		await expect( titles.nth( 1 ) ).toHaveText( 'Title' );

		// The content block of the template being edited is where the content of
		// that post goes.
		await expect(
			editor.canvas.getByText( 'This is the Content block' )
		).toBeVisible();
		await expect(
			editor.canvas.getByText( 'Block cannot be rendered inside itself' )
		).toBeHidden();
	} );
} );
