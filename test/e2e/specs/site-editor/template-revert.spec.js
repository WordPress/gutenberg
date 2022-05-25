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

		await page.click( '.edit-site-document-actions__get-info' );

		// The revert button isn't visible anymore.
		await expect(
			await page.locator( '.edit-site-template-details__revert-button' )
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

		await templateRevertUtils.revertTemplate();
		await templateRevertUtils.save();
		await page.click(
			'.edit-site-header__toolbar button[aria-label="Undo"]'
		);
		await page.waitForSelector(
			'.edit-site-save-button__button[aria-disabled="false"]'
		);

		const contentAfter = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toEqual( contentAfter );
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
		await page
			.locator( 'css=.components-snackbar__action >> text="Undo"' )
			.click();
		await page.waitForSelector(
			'.edit-site-save-button__button[aria-disabled="false"]'
		);

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
		await page.click(
			'.edit-site-header__toolbar button[aria-label="Undo"]'
		);
		await page.waitForSelector(
			'.edit-site-save-button__button[aria-disabled="false"]'
		);
		await page.waitForSelector(
			'.edit-site-header__toolbar button[aria-label="Redo"][aria-disabled="false"]'
		);
		await page.click(
			'.edit-site-header__toolbar button[aria-label="Redo"]'
		);

		const contentAfter = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toEqual( contentAfter );
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
		await page
			.locator( 'css=.components-snackbar__action >> text="Undo"' )
			.click();
		await page.waitForSelector(
			'.edit-site-save-button__button[aria-disabled="false"]'
		);
		await page.click(
			'.edit-site-header__toolbar button[aria-label="Undo"]'
		);
		await page.waitForSelector(
			'.edit-site-save-button__button[aria-disabled="false"]'
		);

		const contentAfter = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toBe( contentAfter );
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
		await page.click(
			'.edit-site-header__toolbar button[aria-label="Undo"]'
		);
		await templateRevertUtils.save();
		await page.waitForSelector(
			'.edit-site-save-button__button[aria-disabled="true"]'
		);
		await admin.visitSiteEditor();

		const contentAfter = await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentBefore ).toBe( contentAfter );
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

		await page
			.locator( 'css=.components-snackbar__action >> text="Undo"' )
			.click();
		await page.waitForSelector(
			'.edit-site-save-button__button[aria-disabled="false"]'
		);
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
		await this.page.click( '.edit-site-save-button__button' );
		await this.page.click( '.editor-entities-saved-states__save-button' );
		await this.page.waitForSelector(
			'.edit-site-save-button__button:not(.is-busy)'
		);
	}

	async revertTemplate() {
		await this.page.click( '.edit-site-document-actions__get-info' );
		await this.page.click( '.edit-site-template-details__revert-button' );
		await this.page.waitForSelector(
			'role=button[name="Dismiss this notice"] >> text="Template reverted."'
		);
		await this.page.waitForSelector(
			'.edit-site-save-button__button[aria-disabled="false"]'
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
