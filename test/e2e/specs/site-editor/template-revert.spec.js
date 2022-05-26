/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	templateRevertUtils: async ( { editor, page }, use ) => {
		await use( new TemplateRevertUtils( { editor, page } ) );
	},
} );

test.describe( 'Template Revert', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await admin.visitSiteEditor();
	} );

	test( 'should delete the template after saving the reverted template', async ( {
		page,
		templateRevertUtils,
	} ) => {
		await templateRevertUtils.addDummyText();
		await templateRevertUtils.save();
		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();

		await page.click( 'role=button[name="Show template details"]' );

		// The revert button isn't visible anymore.
		await expect(
			page.locator( 'role=menuitem[name=/Clear customizations/i]' )
		).not.toBeVisible();
	} );

	test( 'should show the original content after revert', async ( {
		templateRevertUtils,
	} ) => {
		const contentBefore = await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.addDummyText();
		await templateRevertUtils.save();
		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();

		const contentAfter = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toEqual( contentAfter );
	} );

	test( 'should show the original content after revert and page reload', async ( {
		admin,
		templateRevertUtils,
	} ) => {
		const contentBefore = await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.addDummyText();
		await templateRevertUtils.save();
		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();
		await admin.visitSiteEditor();

		const contentAfter = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toEqual( contentAfter );
	} );

	test( 'should show the edited content after revert and clicking undo in the header toolbar', async ( {
		page,
		templateRevertUtils,
	} ) => {
		await templateRevertUtils.addDummyText();
		await templateRevertUtils.save();
		const contentBefore = await templateRevertUtils.getCurrentSiteEditorContent();

		// Revert template and check state.
		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();
		const contentAfterSave = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).not.toEqual( contentAfterSave );

		// Undo revert and check state again.
		await page.click( 'role=button >> text="Undo"' );
		const contentAfterUndo = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toEqual( contentAfterUndo );
	} );

	test( 'should show the edited content after revert and clicking undo in the notice', async ( {
		page,
		templateRevertUtils,
	} ) => {
		await templateRevertUtils.addDummyText();
		await templateRevertUtils.save();
		const contentBefore = await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();

		const snackBar = page.locator(
			'role=button[name="Dismiss this notice"]'
		);

		await snackBar.locator( 'role=button >> text="Undo"' ).click();

		const contentAfter = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toEqual( contentAfter );
	} );

	test( 'should show the original content after revert, clicking undo then redo in the header toolbar', async ( {
		page,
		templateRevertUtils,
	} ) => {
		const contentBefore = await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.addDummyText();
		await templateRevertUtils.save();
		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();
		const headerToolbar = page.locator( 'role=region[name="Header"]' );
		await headerToolbar.locator( '[aria-label="Undo"]' ).click();

		const contentAfterUndo = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).not.toEqual( contentAfterUndo );

		const redoButton = headerToolbar.locator( '[aria-label="Redo"]' );

		await redoButton.click();

		const contentAfterRedo = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toEqual( contentAfterRedo );
	} );

	test( 'should show the original content after revert, clicking undo in the notice then undo in the header toolbar', async ( {
		page,
		templateRevertUtils,
	} ) => {
		const contentBefore = await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.addDummyText();
		await templateRevertUtils.save();
		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();

		// Click undo in the snackbar. This reverts revert template action.
		const snackBar = page.locator(
			'role=button[name="Dismiss this notice"]'
		);
		await snackBar.locator( 'role=button >> text="Undo"' ).click();

		//Check we have dummy content.
		const contentAfterFirstUndo = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).not.toEqual( contentAfterFirstUndo );

		// Click undo again, this time in the header. Reverts initial dummy content.
		const headerToolbar = page.locator( 'role=region[name="Header"]' );
		await headerToolbar.locator( '[aria-label="Undo"]' ).click();

		// Check dummy content is gone.
		const contentAfterSecondUndo = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toEqual( contentAfterSecondUndo );
	} );

	test( 'should show the edited content after revert, clicking undo in the header toolbar, save and reload', async ( {
		admin,
		page,
		templateRevertUtils,
	} ) => {
		await templateRevertUtils.addDummyText();
		await templateRevertUtils.save();
		const contentBefore = await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();

		const headerToolbar = page.locator( 'role=region[name="Header"]' );
		await headerToolbar.locator( '[aria-label="Undo"]' ).click();

		await templateRevertUtils.save();

		await admin.visitSiteEditor();

		const contentAfter = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toEqual( contentAfter );
	} );

	test( 'should show the edited content after revert, clicking undo in the notice and reload', async ( {
		admin,
		page,
		templateRevertUtils,
	} ) => {
		await templateRevertUtils.addDummyText();
		await templateRevertUtils.save();
		const contentBefore = await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();

		const snackBar = page.locator(
			'role=button[name="Dismiss this notice"]'
		);
		await snackBar.locator( 'role=button >> text="Undo"' ).click();

		await templateRevertUtils.save();
		await admin.visitSiteEditor();

		const contentAfter = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toBe( contentAfter );
	} );
} );

class TemplateRevertUtils {
	constructor( { editor, page } ) {
		this.editor = editor;
		this.page = page;
	}

	async addDummyText() {
		await this.editor.insertBlock( { name: 'core/paragraph' } );
		await this.page.keyboard.type( 'Test' );
	}

	async save() {
		const headerToolbar = this.page.locator( 'role=region[name="Header"]' );
		await headerToolbar.locator( 'role=button[name="Save"]' ).click();
		// Second Save button in the entities panel.
		const publishToolbar = this.page.locator(
			'role=region[name="Publish"]'
		);
		await publishToolbar.locator( 'role=button[name="Save"]' ).click();
	}

	async revertTemplate() {
		await this.page.click( 'role=button[name="Show template details"]' );
		await this.page.click( 'role=menuitem[name=/Clear customizations/i]' );
		await this.page.waitForSelector(
			'role=button[name="Dismiss this notice"] >> text="Template reverted."'
		);
	}

	async getCurrentSiteEditorContent() {
		return this.page.evaluate( () => {
			const postId = window.wp.data
				.select( 'core/edit-site' )
				.getEditedPostId();
			const postType = window.wp.data
				.select( 'core/edit-site' )
				.getEditedPostType();
			const record = window.wp.data
				.select( 'core' )
				.getEditedEntityRecord( 'postType', postType, postId );
			if ( record ) {
				if ( typeof record.content === 'function' ) {
					return record.content( record );
				} else if ( record.blocks ) {
					return window.wp.blocks.__unstableSerializeAndClean(
						record.blocks
					);
				} else if ( record.content ) {
					return record.content;
				}
			}
			return '';
		} );
	}
}
