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

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor();
	} );

	test( 'should display revisions UI when there is 1 revision', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		await editor.canvas.locator( 'body' ).click();
		const currentRevisions =
			await userGlobalStylesRevisions.getGlobalStylesRevisions();
		await userGlobalStylesRevisions.openStylesPanel();

		// Change a style and save it.
		await page.getByRole( 'button', { name: 'Colors styles' } ).click();

		await page
			.getByRole( 'button', { name: 'Color Background styles' } )
			.click();
		await page
			.getByRole( 'option', { name: 'Color: Cyan bluish gray' } )
			.click( { force: true } );

		await editor.saveSiteEditorEntities();

		// Now there should be enough revisions to show the revisions UI.
		await page.getByRole( 'button', { name: 'Revisions' } ).click();

		const revisionButtons = page.getByRole( 'button', {
			name: /^Changes saved by /,
		} );

		// Shows changes made in the revision.
		await expect(
			page.getByTestId( 'global-styles-revision-changes' )
		).toHaveText( 'Colors' );

		// There should be 2 revisions not including the reset to theme defaults button.
		await expect( revisionButtons ).toHaveCount(
			currentRevisions.length + 1
		);
	} );

	test( 'should warn of unsaved changes before loading reset revision', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		await editor.canvas.locator( 'body' ).click();
		await userGlobalStylesRevisions.openStylesPanel();
		await page.getByRole( 'button', { name: 'Colors styles' } ).click();
		await page
			.getByRole( 'button', { name: 'Color Background styles' } )
			.click();
		await page
			.getByRole( 'option', { name: 'Color: Luminous vivid amber' } )
			.click( { force: true } );

		await page.getByRole( 'button', { name: 'Revisions' } ).click();

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
			/^Any unsaved changes will be lost when you apply this revision./
		);

		// This is to make sure there are no lingering unsaved changes.
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Cancel' } )
			.click();
		await editor.saveSiteEditorEntities();
	} );

	test( 'should have a reset to defaults button', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		await editor.canvas.locator( 'body' ).click();
		await userGlobalStylesRevisions.openStylesPanel();
		await page.getByRole( 'button', { name: 'Revisions' } ).click();
		const lastRevisionButton = page
			.getByLabel( 'Global styles revisions list' )
			.getByRole( 'button' )
			.last();
		await expect( lastRevisionButton ).toContainText( 'Default styles' );
		await lastRevisionButton.click();
		await expect(
			page.getByRole( 'button', { name: 'Reset to defaults' } )
		).toBeVisible();
	} );

	test( 'should access from the site editor sidebar', async ( { page } ) => {
		const navigationContainer = page.getByRole( 'region', {
			name: 'Navigation',
		} );
		await navigationContainer
			.getByRole( 'button', { name: 'Styles' } )
			.click();

		await navigationContainer
			.getByRole( 'button', { name: 'Revisions' } )
			.click();

		await expect(
			page.getByLabel( 'Global styles revisions list' )
		).toBeVisible();
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

	async openStylesPanel() {
		await this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
	}
}
