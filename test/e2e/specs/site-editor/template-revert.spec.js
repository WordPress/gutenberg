/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	templateRevertUtils: async ( { page }, use ) => {
		await use( new TemplateRevertUtils( { page } ) );
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
	test.beforeEach( async ( { admin, requestUtils, siteEditor } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await admin.visitSiteEditor();
		await siteEditor.enterEditMode();
	} );

	test( 'should delete the template after saving the reverted template', async ( {
		editor,
		page,
		templateRevertUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await editor.saveSiteEditorEntities();
		await templateRevertUtils.revertTemplate();
		await editor.saveSiteEditorEntities();

		await page.click( 'role=button[name="Show template details"i]' );

		// The revert button isn't visible anymore.
		await expect(
			page.locator( 'role=menuitem[name=/Clear customizations/i]' )
		).not.toBeVisible();
	} );

	test( 'should show the original content after revert', async ( {
		editor,
		templateRevertUtils,
	} ) => {
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await editor.saveSiteEditorEntities();
		await templateRevertUtils.revertTemplate();
		await editor.saveSiteEditorEntities();

		const contentAfter =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfter ).toEqual( contentBefore );
	} );

	test( 'should show the original content after revert and page reload', async ( {
		admin,
		editor,
		templateRevertUtils,
	} ) => {
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await editor.saveSiteEditorEntities();
		await templateRevertUtils.revertTemplate();
		await editor.saveSiteEditorEntities();
		await admin.visitSiteEditor();

		const contentAfter =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfter ).toEqual( contentBefore );
	} );

	test( 'should show the edited content after revert and clicking undo in the header toolbar', async ( {
		editor,
		page,
		templateRevertUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await editor.saveSiteEditorEntities();
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		// Revert template and check state.
		await templateRevertUtils.revertTemplate();
		await editor.saveSiteEditorEntities();
		const contentAfterSave =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfterSave ).not.toEqual( contentBefore );

		// Undo revert by clicking header button and check state again.
		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Undo"i]'
		);
		const contentAfterUndo =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfterUndo ).toEqual( contentBefore );
	} );

	test( 'should show the edited content after revert and clicking undo in the notice', async ( {
		editor,
		page,
		templateRevertUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await editor.saveSiteEditorEntities();
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.revertTemplate();
		await editor.saveSiteEditorEntities();

		// Click the snackbar "Undo" button.
		await page.click(
			'role=button[name="Dismiss this notice"i] >> role=button[name="Undo"i]'
		);

		const contentAfter =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfter ).toEqual( contentBefore );
	} );

	test( 'should show the original content after revert, clicking undo then redo in the header toolbar', async ( {
		editor,
		page,
		templateRevertUtils,
	} ) => {
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await editor.saveSiteEditorEntities();
		await templateRevertUtils.revertTemplate();
		await editor.saveSiteEditorEntities();
		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Undo"i]'
		);

		const contentAfterUndo =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfterUndo ).not.toEqual( contentBefore );

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Redo"i]'
		);

		const contentAfterRedo =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfterRedo ).toEqual( contentBefore );
	} );

	test( 'should show the original content after revert, clicking undo in the notice then undo in the header toolbar', async ( {
		editor,
		page,
		templateRevertUtils,
	} ) => {
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await editor.saveSiteEditorEntities();
		await templateRevertUtils.revertTemplate();
		await editor.saveSiteEditorEntities();

		// Click undo in the snackbar. This reverts revert template action.
		await page.click(
			'role=button[name="Dismiss this notice"i] >> role=button[name="Undo"i]'
		);

		//Check we have dummy content.
		const contentAfterFirstUndo =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfterFirstUndo ).not.toEqual( contentBefore );

		// Click undo again, this time in the header. Reverts initial dummy content.
		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Undo"i]'
		);

		// Check dummy content is gone.
		const contentAfterSecondUndo =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfterSecondUndo ).toEqual( contentBefore );
	} );

	test( 'should show the edited content after revert, clicking undo in the header toolbar, save and reload', async ( {
		admin,
		editor,
		page,
		templateRevertUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await editor.saveSiteEditorEntities();
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.revertTemplate();
		await editor.saveSiteEditorEntities();

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Undo"i]'
		);

		await editor.saveSiteEditorEntities();

		await admin.visitSiteEditor();

		const contentAfter =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfter ).toEqual( contentBefore );
	} );

	test( 'should show the edited content after revert, clicking undo in the notice and reload', async ( {
		admin,
		editor,
		page,
		templateRevertUtils,
		siteEditor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await editor.saveSiteEditorEntities();
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.revertTemplate();
		await editor.saveSiteEditorEntities();

		await page.click(
			'role=button[name="Dismiss this notice"i] >> role=button[name="Undo"i]'
		);

		await editor.saveSiteEditorEntities();
		await admin.visitSiteEditor();
		await siteEditor.enterEditMode();
		const contentAfter =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfter ).toEqual( contentBefore );
	} );
} );

class TemplateRevertUtils {
	constructor( { page } ) {
		this.page = page;
	}

	async revertTemplate() {
		await this.page.click( 'role=button[name="Show template details"i]' );
		await this.page.click( 'role=menuitem[name=/Clear customizations/i]' );
		await this.page.waitForSelector(
			'role=button[name="Dismiss this notice"i] >> text="Template reverted."'
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
