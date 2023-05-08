/**
 * WordPress dependencies
 */
const {
	test,
	expect,
	Editor,
} = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	editor: async ( { page }, use ) => {
		await use( new Editor( { page } ) );
	},
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
		await admin.visitSiteEditor( {
			canvas: 'edit',
		} );
	} );

	test( 'should display revisions UI when there is more than 1 revision', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		const currentRevisions =
			await userGlobalStylesRevisions.getGlobalStylesRevisions();

		// Navigates to Styles -> Typography -> Text and click on a size.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();

		/*
		 * There are not enough revisions to show the revisions UI yet, so let's create some.
		 * The condition exists until we have way (and the requirement) to delete global styles revisions.
		 */
		if ( currentRevisions.length < 1 ) {
			// Change a style and save it.
			await page
				.getByRole( 'button', { name: 'Typography styles' } )
				.click();
			await page
				.getByRole( 'button', { name: 'Typography Text styles' } )
				.click();
			await page
				.getByRole( 'radiogroup', { name: 'Font size' } )
				.getByRole( 'radio', { name: 'Large', exact: true } )
				.click();
			await editor.saveSiteEditorEntities();

			// Change a style and save it again just for good luck.
			// We need more than 2 revisions to show the UI.
			await page
				.getByRole( 'radiogroup', { name: 'Font size' } )
				.getByRole( 'radio', { name: 'Medium', exact: true } )
				.click();

			await editor.saveSiteEditorEntities();

			// Now there should be enough revisions to show the revisions UI.
			await page
				.getByRole( 'button', { name: 'Styles actions' } )
				.click();
			await page.getByRole( 'menuitem', { name: 'Revisions' } ).click();

			const revisionButtons = page.getByRole( 'button', {
				name: /^Changes saved by /,
			} );

			await expect( revisionButtons ).toHaveCount(
				currentRevisions.length + 2
			);
		}

		const updatedCurrentRevisions =
			await userGlobalStylesRevisions.getGlobalStylesRevisions();
		// There are some revisions. Let's check that the UI looks how we expect it to.
		await page.getByRole( 'button', { name: 'Styles actions' } ).click();
		await page.getByRole( 'menuitem', { name: 'Revisions' } ).click();
		const revisionButtons = page.getByRole( 'button', {
			name: /^Changes saved by /,
		} );

		await expect( revisionButtons ).toHaveCount(
			updatedCurrentRevisions.length
		);
	} );

	test( 'should warn of unsaved changes before loading reset revision', async ( {
		page,
	} ) => {
		// Navigates to Styles -> Typography -> Text and click on a size.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();

		await page.getByRole( 'button', { name: 'Colors styles' } ).click();
		await page
			.getByRole( 'button', { name: 'Color Background styles' } )
			.click();
		await page.getByRole( 'button', { name: 'Color: Black' } ).click();
		await page.getByRole( 'button', { name: 'Styles actions' } ).click();
		await page.getByRole( 'menuitem', { name: 'Revisions' } ).click();
		const unSavedButton = page.getByRole( 'button', {
			name: /^Unsaved changes/,
		} );

		await expect( unSavedButton ).toBeVisible();

		// await expect( image ).toHaveCSS( 'height', '3px' );
		await page
			.getByRole( 'button', { name: /^Changes saved by / } )
			.last()
			.click();

		await page.getByRole( 'button', { name: 'Load revision' } ).click();

		const confirm = page.getByRole( 'dialog' );
		await expect( confirm ).toBeVisible();
		await expect( confirm ).toHaveText(
			/^Loading this revision will discard all unsaved changes/
		);
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
}
