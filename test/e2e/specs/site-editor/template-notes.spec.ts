const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const TEMPLATE_CONTENT =
	'<!-- wp:paragraph --><p>Template content</p><!-- /wp:paragraph -->';

// Adds a note to the currently selected block and waits for its thread.
async function addNoteToSelectedBlock( { page, editor, content } ) {
	await editor.clickBlockOptionsMenuItem( 'Add note' );
	await page
		.getByRole( 'textbox', { name: 'New note', exact: true } )
		.pressSequentially( content );
	await page
		.getByRole( 'region', { name: 'Editor settings' } )
		.getByRole( 'button', { name: 'Add note', exact: true } )
		.click();
	await expect(
		page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', { name: `Note: ${ content }` } )
	).toBeVisible();
}

test.describe( 'Notes in the site editor', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		// Opening the notes sidebar persists it as the active complementary
		// area, which would follow the admin user into other specs.
		await requestUtils.resetPreferences();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'adds a note to a block in a saved template and persists it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const template = await requestUtils.createTemplate( 'wp_template', {
			slug: 'notes-template',
			title: 'Notes Template',
			content: TEMPLATE_CONTENT,
		} );

		await admin.visitSiteEditor( {
			postId: template.id,
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		await addNoteToSelectedBlock( {
			page,
			editor,
			content: 'A note on a template block',
		} );

		// The note is attached to the template's post, so it survives a reload.
		await admin.visitSiteEditor( {
			postId: template.id,
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// A fresh load opens the settings panel, so switch back to the notes one.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes', exact: true } )
			.click();

		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: A note on a template block',
				} )
		).toBeVisible();
	} );

	test( 'replies to and resolves a note on a template', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const template = await requestUtils.createTemplate( 'wp_template', {
			slug: 'notes-template-replies',
			title: 'Notes Template Replies',
			content: TEMPLATE_CONTENT,
		} );

		await admin.visitSiteEditor( {
			postId: template.id,
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		await addNoteToSelectedBlock( {
			page,
			editor,
			content: 'Needs a second opinion',
		} );

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const replyForm = page.getByRole( 'textbox', { name: 'Reply to' } );
		await replyForm.click();
		await replyForm.pressSequentially( 'Agreed, changing it' );
		await settings
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();
		await expect(
			page.locator( '.editor-collab-sidebar-panel__note-content' ).last()
		).toHaveText( 'Agreed, changing it' );

		await page.getByRole( 'button', { name: 'Resolve' } ).first().click();
		await expect(
			settings.getByRole( 'treeitem', {
				name: 'Note: Needs a second opinion',
			} )
		).toBeHidden();
	} );

	test( 'adds a note to a block in a saved template part', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const templatePart = await requestUtils.createTemplate(
			'wp_template_part',
			{
				slug: 'notes-template-part',
				title: 'Notes Template Part',
				content: TEMPLATE_CONTENT,
			}
		);

		await admin.visitSiteEditor( {
			postId: templatePart.id,
			postType: 'wp_template_part',
			canvas: 'edit',
		} );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		await addNoteToSelectedBlock( {
			page,
			editor,
			content: 'A note on a template part',
		} );

		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: A note on a template part',
				} )
		).toBeVisible();
	} );

	test( 'does not offer notes on a pristine theme template', async ( {
		admin,
		editor,
		page,
	} ) => {
		// A theme-provided template has no post backing it, so there is nothing
		// for a note to attach to and the Notes UI stays hidden.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// Inserting a block does not create the template post; only saving does.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Unsaved content' },
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		await editor.clickBlockToolbarButton( 'Options' );
		await expect(
			page.getByRole( 'menuitem', { name: 'Add note' } )
		).toBeHidden();
		await page.keyboard.press( 'Escape' );

		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'All notes', exact: true } )
		).toBeHidden();
	} );

	test( 'offers notes once a theme template is customized and saved', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// Saving a customization creates the post that notes attach to.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Customized content' },
		} );
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		await editor.clickBlockToolbarButton( 'Options' );
		await expect(
			page.getByRole( 'menuitem', { name: 'Add note' } )
		).toBeVisible();
	} );
} );
