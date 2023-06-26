/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	userGlobalStylesRevisions: async ( { page, requestUtils }, use ) => {
		await use( new UserGlobalStylesRevisions( { page, requestUtils } ) );
	},
} );

test.describe( 'Global styles revisions', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor();
		await editor.canvas.click( 'body' );
	} );

	test( 'should display revisions UI when there is more than 1 revision', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		const currentRevisions =
			await userGlobalStylesRevisions.getGlobalStylesRevisions();
		await userGlobalStylesRevisions.openStylesPanel();

		// Change a style and save it.
		await page.getByRole( 'button', { name: 'Colors styles' } ).click();

		await page
			.getByRole( 'button', { name: 'Color Background styles' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Color: Black' } )
			.click( { force: true } );

		await editor.saveSiteEditorEntities();

		/*
		 * Change a style and save it again.
		 * We need more than 2 revisions to show the UI.
		 */
		await page
			.getByRole( 'button', { name: 'Color Background styles' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Color: Cyan bluish gray' } )
			.click( { force: true } );

		await editor.saveSiteEditorEntities();

		// Now there should be enough revisions to show the revisions UI.
		await userGlobalStylesRevisions.openRevisions();

		const revisionButtons = page.getByRole( 'button', {
			name: /^Changes saved by /,
		} );

		await expect( revisionButtons ).toHaveCount(
			currentRevisions.length + 2
		);
	} );

	test( 'should warn of unsaved changes before loading reset revision', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		await userGlobalStylesRevisions.openStylesPanel();
		await page.getByRole( 'button', { name: 'Colors styles' } ).click();
		await page
			.getByRole( 'button', { name: 'Color Background styles' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Color: Luminous vivid amber' } )
			.click( { force: true } );

		await userGlobalStylesRevisions.openRevisions();

		const unSavedButton = page.getByRole( 'button', {
			name: /^Unsaved changes/,
		} );

		await expect( unSavedButton ).toBeVisible();

		await page
			.getByRole( 'button', { name: /^Changes saved by / } )
			.last()
			.click();

		await page.getByRole( 'button', { name: 'Apply' } ).click();

		const confirm = page.getByRole( 'dialog' );
		await expect( confirm ).toBeVisible();
		await expect( confirm ).toHaveText(
			/^Loading this revision will discard all unsaved changes/
		);

		// This is to make sure there are no lingering unsaved changes.
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Cancel' } )
			.click();
		await editor.saveSiteEditorEntities();
	} );
} );

class UserGlobalStylesRevisions {
	constructor( { page, requestUtils } ) {
		this.page = page;
		this.requestUtils = requestUtils;
	}

	async getGlobalStylesRevisions() {
		const stylesPostId =
			await this.requestUtils.getCurrentThemeGlobalStylesPostId();
		if ( stylesPostId ) {
			return await this.requestUtils.getThemeGlobalStylesRevisions(
				stylesPostId
			);
		}
		return [];
	}

	async openRevisions() {
		await this.page
			.getByRole( 'menubar', { name: 'Styles actions' } )
			.click();
		await this.page.getByRole( 'button', { name: 'Revisions' } ).click();
		await this.page
			.getByRole( 'menuitem', { name: /^Revision history/ } )
			.click();
	}

	async openStylesPanel() {
		await this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
	}
}
