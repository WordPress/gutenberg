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
		await admin.visitSiteEditor( { canvas: 'edit' } );
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
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await templateRevertUtils.revertTemplate();

		const isTemplateTabVisible = await page
			.locator(
				'role=region[name="Editor settings"i] >> role=button[name="Template"i]'
			)
			.isVisible();
		if ( isTemplateTabVisible ) {
			await page.click(
				'role=region[name="Editor settings"i] >> role=button[name="Template"i]'
			);
		}

		// The revert button isn't visible anymore.
		await expect(
			page.locator(
				'role=region[name="Editor settings"i] >> role=button[name="Actions"i]'
			)
		).toBeDisabled();
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
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await templateRevertUtils.revertTemplate();

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
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await templateRevertUtils.revertTemplate();
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
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		// Revert template and check state.
		await templateRevertUtils.revertTemplate();
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
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await templateRevertUtils.revertTemplate();
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
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.getByText( /(updated|published)\./ )
			.click();
		const contentBefore =
			await templateRevertUtils.getCurrentSiteEditorContent();

		await templateRevertUtils.revertTemplate();

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Undo"i]'
		);
		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		await admin.visitSiteEditor();

		const contentAfter =
			await templateRevertUtils.getCurrentSiteEditorContent();
		expect( contentAfter ).toEqual( contentBefore );
	} );
} );

class TemplateRevertUtils {
	constructor( { editor, page } ) {
		this.editor = editor;
		this.page = page;
	}

	async revertTemplate() {
		await this.editor.openDocumentSettingsSidebar();
		const isTemplateTabVisible = await this.page
			.locator(
				'role=region[name="Editor settings"i] >> role=tab[name="Template"i]'
			)
			.isVisible();
		if ( isTemplateTabVisible ) {
			await this.page.click(
				'role=region[name="Editor settings"i] >> role=tab[name="Template"i]'
			);
		}
		await this.page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Actions"i]'
		);
		await this.page.click( 'role=menuitem[name=/Reset/i]' );
		await this.page.getByRole( 'button', { name: 'Reset' } ).click();
		await this.page.waitForSelector(
			'role=button[name="Dismiss this notice"i] >> text=/ reset./'
		);
	}

	async getCurrentSiteEditorContent() {
		return this.page.evaluate( () => {
			const postId = window.wp.data
				.select( 'core/editor' )
				.getCurrentPostId();
			const postType = window.wp.data
				.select( 'core/editor' )
				.getCurrentPostType();
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
