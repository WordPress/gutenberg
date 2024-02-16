/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	postEditorTemplateMode: async (
		{ admin, editor, page, pageUtils, requestUtils },
		use
	) => {
		await use(
			new PostEditorTemplateMode( {
				admin,
				editor,
				page,
				pageUtils,
				requestUtils,
			} )
		);
	},
} );

test.describe( 'Post Editor Template mode', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-templates' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-templates' );
	} );

	test( 'Allow to switch to template mode, edit the template and check the result', async ( {
		editor,
		page,
		requestUtils,
		postEditorTemplateMode,
	} ) => {
		await requestUtils.activateTheme( 'emptytheme' );

		await postEditorTemplateMode.createPostAndSaveDraft();

		await page.reload();
		await postEditorTemplateMode.switchToTemplateMode();

		// Edit the template.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type(
			'Just a random paragraph added to the template'
		);

		// Save changes.
		await page.click( 'role=button[name="Back"i]' );
		await page.click( 'role=button[name="Publish"i]' );
		await page.click( 'role=button[name="Save"i]' );

		// Preview changes.
		const previewPage = await editor.openPreviewPage();

		await expect(
			previewPage.locator(
				'text="Just a random paragraph added to the template"'
			)
		).toBeVisible();
	} );

	test( 'Swap templates and proper template resolution when switching to default template', async ( {
		editor,
		page,
		requestUtils,
		postEditorTemplateMode,
	} ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await postEditorTemplateMode.createPostAndSaveDraft();
		await page.reload();
		await postEditorTemplateMode.disableTemplateWelcomeGuide();
		await postEditorTemplateMode.openTemplatePopover();
		// Swap to a custom template, save and reload.
		await page
			.getByRole( 'menuitem', {
				name: 'Swap template',
			} )
			.click();
		await page
			.getByRole( 'option', {
				name: 'Custom',
			} )
			.click();
		await editor.saveDraft();
		await page.reload();
		// Swap to the default template.
		await postEditorTemplateMode.openTemplatePopover();
		await page
			.getByRole( 'menuitem', {
				name: 'Use default template',
			} )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Template options' } )
		).toHaveText( 'Single Entries' );
	} );

	test( 'Allow creating custom block templates in classic themes', async ( {
		editor,
		page,
		requestUtils,
		postEditorTemplateMode,
	} ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );

		await postEditorTemplateMode.createPostAndSaveDraft();

		await page.reload();

		await postEditorTemplateMode.createNewTemplate( 'Blank Template' );

		// Edit the template.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type(
			'Just a random paragraph added to the template'
		);

		await postEditorTemplateMode.saveTemplateWithoutPublishing();

		// Preview changes.
		const previewPage = await editor.openPreviewPage();

		await expect(
			previewPage.locator(
				'text="Just a random paragraph added to the template"'
			)
		).toBeVisible();
	} );
} );

class PostEditorTemplateMode {
	constructor( { admin, editor, page, pageUtils, requestUtils } ) {
		this.admin = admin;
		this.editor = editor;
		this.page = page;
		this.pageUtils = pageUtils;
		this.requestUtils = requestUtils;

		this.editorSettingsSidebar = this.page.locator(
			'role=region[name="Editor settings"i]'
		);
		this.editorTopBar = this.page.locator(
			'role=region[name="Editor top bar"i]'
		);
	}

	async disableTemplateWelcomeGuide() {
		// Turn off the welcome guide.
		await this.editor.setPreferences( 'core/edit-post', {
			welcomeGuideTemplate: false,
		} );
	}

	async openTemplatePopover() {
		await this.editor.openDocumentSettingsSidebar();

		// Only match the beginning of Select template: because it contains the template name or slug afterwards.
		await this.editorSettingsSidebar
			.getByRole( 'button', {
				name: 'Template options',
			} )
			.click();
	}

	async switchToTemplateMode() {
		await this.disableTemplateWelcomeGuide();

		await this.openTemplatePopover();
		await this.page
			.getByRole( 'menuitem', {
				name: 'Edit template',
			} )
			.click();

		// Check that we switched properly to edit mode.
		await this.page.waitForSelector(
			'role=button[name="Dismiss this notice"] >> text=Editing template. Changes made here affect all posts and pages that use the template.'
		);

		const title = this.editorTopBar.getByRole( 'heading', {
			name: 'Editing template: Single Entries',
		} );

		await expect( title ).toBeVisible();
	}

	async createPostAndSaveDraft() {
		await this.admin.createNewPost();
		// Create a random post.
		await this.page.keyboard.type( 'Just an FSE Post' );
		await this.page.keyboard.press( 'Enter' );
		await this.page.keyboard.type( 'Hello World' );

		// Unselect the blocks.
		await this.page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );

		// Save the post
		// Saving shouldn't be necessary but unfortunately,
		// there's a template resolution bug forcing us to do so.
		await this.editor.saveDraft();
	}

	async createNewTemplate( templateName ) {
		await this.disableTemplateWelcomeGuide();

		await this.openTemplatePopover();

		const newTemplateButton = this.page.locator(
			'role=button[name="Add template"i]'
		);
		await newTemplateButton.click();

		// Fill the template title and submit.
		const newTemplateDialog = this.page.locator(
			'role=dialog[name="Create custom template"i]'
		);
		const templateNameInput = newTemplateDialog.locator(
			'role=textbox[name="Name"i]'
		);
		await templateNameInput.fill( templateName );
		await this.page.keyboard.press( 'Enter' );

		// Check that we switched properly to edit mode.
		await expect(
			this.page.locator(
				'role=button[name="Dismiss this notice"i] >> text=Custom template created. You\'re in template mode now.'
			)
		).toBeVisible();

		// Wait for the editor to be loaded and ready before making changes.
		// Without this, the editor will move focus to body while still typing.
		// And the save states will not be counted as dirty.
		// There is likely a bug in the code, waiting for the snackbar above should be enough.
		// eslint-disable-next-line playwright/no-networkidle
		await this.page.waitForLoadState( 'networkidle' );
	}

	async saveTemplateWithoutPublishing() {
		await this.page.click( 'role=button[name="Back"i]' );
		await this.page.click( 'role=button[name="Publish"i]' );
		const editorPublishRegion = this.page.locator(
			'role=region[name="Editor publish"i]'
		);
		const saveButton = editorPublishRegion.locator(
			'role=button[name="Save"i]'
		);
		await saveButton.click();
		// Avoid publishing the post.
		const cancelButton = editorPublishRegion.locator(
			'role=button[name="Cancel"i]'
		);
		await cancelButton.click();
	}
}
