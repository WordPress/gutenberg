const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, openPostSummary } = require( './utils' );

/*
 * Mirrors `test/e2e/specs/editor/various/post-editor-template-mode.spec.js`
 * with the DataForm inspector experiment enabled; delete that spec when the
 * experiment graduates.
 */
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

test.describe( 'Post Editor Template mode (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-templates' );
		// Document-Isolation-Policy places the editor in its own agent cluster.
		// Template creation involves page reload and preview opens frontend
		// pages without the DIP header, creating an agent cluster mismatch
		// that breaks cross-window communication.
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.setGutenbergExperiments( [] ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-templates' );
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
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
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Back', exact: true } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor publish' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();

		// Preview changes.
		const previewPage = await editor.openPreviewPage();

		await expect(
			previewPage.getByText(
				'Just a random paragraph added to the template',
				{ exact: true }
			)
		).toBeVisible();
	} );

	test( 'Change templates and proper template resolution when switching to default template', async ( {
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
		// Change to a custom template, save and reload.
		await page
			.getByRole( 'combobox', { name: 'Template' } )
			.selectOption( { label: 'Custom' } );
		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'button', { name: 'Edit Template' } )
		).toHaveAccessibleDescription( 'Custom' );
		await editor.saveDraft();
		await page.reload();
		await expect(
			page.getByRole( 'button', { name: 'Edit Template' } )
		).toHaveAccessibleDescription( 'Custom' );
		// Change to the default template.
		await postEditorTemplateMode.openTemplatePopover();
		await page
			.getByRole( 'combobox', { name: 'Template' } )
			.selectOption( { label: 'Single Entries' } );
		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'button', { name: 'Edit Template' } )
		).toHaveAccessibleDescription( 'Single Entries' );
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
			previewPage.getByText(
				'Just a random paragraph added to the template',
				{ exact: true }
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

		this.editorSettingsSidebar = this.page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		this.editorTopBar = this.page.getByRole( 'region', {
			name: 'Editor top bar',
		} );
	}

	async disableTemplateWelcomeGuide() {
		// Turn off the welcome guide.
		await this.editor.setPreferences( 'core/edit-post', {
			welcomeGuideTemplate: false,
		} );
	}

	async openTemplatePopover() {
		await openPostSummary( { editor: this.editor, page: this.page } );

		await this.editorSettingsSidebar
			.getByRole( 'button', { name: 'Edit Template' } )
			.click();
	}

	async switchToTemplateMode() {
		await this.disableTemplateWelcomeGuide();

		await openPostSummary( { editor: this.editor, page: this.page } );
		await this.editorSettingsSidebar
			.getByRole( 'button', { name: 'Template: Single Entries' } )
			.click();
		await this.editorSettingsSidebar
			.getByRole( 'button', { name: 'Edit', exact: true } )
			.click();

		// Check that we switched properly to edit mode.
		await expect(
			this.page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.getByText(
					'Editing template. Changes made here affect all posts and pages that use the template.'
				)
		).toBeVisible();

		const title = this.editorTopBar.getByRole( 'heading', {
			name: 'Single Entries',
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

		await openPostSummary( { editor: this.editor, page: this.page } );
		await this.editorSettingsSidebar
			.getByRole( 'button', { name: 'Template', exact: true } )
			.click();
		await this.editorSettingsSidebar
			.getByRole( 'button', { name: 'Create block template' } )
			.click();

		// Fill the template title and submit.
		await this.page
			.getByRole( 'dialog', { name: 'Create custom template' } )
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( templateName );
		await this.page.keyboard.press( 'Enter' );

		// Check that we switched properly to edit mode.
		await expect(
			this.page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.getByText(
					"Custom template created. You're in template mode now."
				)
		).toBeVisible();

		// Wait for the editor to be fully loaded and ready before making changes.
		// Without this, the editor may move focus to body while still typing,
		// and save states will not be counted as dirty.
		await this.page.waitForFunction(
			() =>
				window.wp?.data?.select( 'core/block-editor' )?.getBlocks()
					?.length > 0
		);
	}

	async saveTemplateWithoutPublishing() {
		await this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Back', exact: true } )
			.click();
		await this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
		const editorPublishRegion = this.page.getByRole( 'region', {
			name: 'Editor publish',
		} );
		await editorPublishRegion
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
		// Avoid publishing the post.
		const cancelButton = editorPublishRegion.getByRole( 'button', {
			name: 'Cancel',
		} );
		await expect( cancelButton ).toBeEnabled();
		await cancelButton.click();
	}
}
