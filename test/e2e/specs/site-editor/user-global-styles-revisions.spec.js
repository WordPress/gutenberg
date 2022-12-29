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
		await use( new Editor( { page, hasIframe: true } ) );
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

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.beforeEach( async ( { admin, siteEditor } ) => {
		await admin.visitSiteEditor();
		await siteEditor.enterEditMode();
	} );

	test( 'should display revisions UI when there is more than 1 revision', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		await userGlobalStylesRevisions.disableWelcomeGuide();
		// Navigates to Styles -> Typography -> Text and click on a size.
		await page.getByRole( 'button', { name: 'Styles' } ).click();

		// This is fugly right now because there's seemingly no way to
		// delete global styles custom post type revisions using the REST API.
		// See: https://developer.wordpress.org/rest-api/reference/post-revisions/#delete-a-post-revision
		// And: https://developer.wordpress.org/rest-api/reference/posts/#delete-a-post
		// @TODO add a DELETE /revisions endpoint to class-gutenberg-rest-global-styles-controller-6-2.php.
		const currentRevisions =
			await userGlobalStylesRevisions.getGlobalStylesRevisions();

		if ( currentRevisions.length < 2 ) {
			await expect(
				page.getByRole( 'button', {
					name: 'Styles revisions',
				} )
			).not.toBeVisible();
			await page
				.getByRole( 'button', { name: 'Typography styles' } )
				.click();
			await page
				.getByRole( 'button', { name: 'Typography Text styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Appearance' } ).click();
			await page.getByRole( 'option', { name: 'Thin' } ).click();
			await editor.saveSiteEditorEntities();
			await page.getByRole( 'button', { name: 'Appearance' } ).click();
			await page.getByRole( 'option', { name: 'Light' } ).click();
			await editor.saveSiteEditorEntities();
			await page.click(
				'role=button[name="Navigate to the previous view"i]'
			);
			await page.click(
				'role=button[name="Navigate to the previous view"i]'
			);
			await expect(
				page.getByRole( 'button', {
					name: 'Styles revisions',
				} )
			).toBeVisible();
		} else {
			await expect(
				page.getByRole( 'button', {
					name: 'Styles revisions',
				} )
			).toBeVisible();
			await page
				.getByRole( 'button', { name: 'Styles revisions' } )
				.click();
			const revisionButtons = page.locator(
				'role=button[name=/^Restore revision/]'
			);

			await expect( revisionButtons ).toHaveCount(
				currentRevisions.length
			);
		}
	} );
} );

class UserGlobalStylesRevisions {
	constructor( { page, requestUtils } ) {
		this.page = page;
		this.requestUtils = requestUtils;
	}
	async disableWelcomeGuide() {
		// Turn off the welcome guide.
		await this.page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuideStyles', false );
		} );
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
