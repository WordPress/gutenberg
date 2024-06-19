/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	userGlobalStylesRevisions: async (
		{ editor, page, requestUtils },
		use
	) => {
		await use(
			new UserGlobalStylesRevisions( { editor, page, requestUtils } )
		);
	},
} );

test.describe( 'Style Revisions', () => {
	let stylesPostId;
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
		stylesPostId = await requestUtils.getCurrentThemeGlobalStylesPostId();
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
		// Create a revision: change a style and save it.
		await userGlobalStylesRevisions.saveRevision( stylesPostId, {
			color: { background: 'blue' },
		} );
		await userGlobalStylesRevisions.openStylesPanel();

		// Now there should be enough revisions to show the revisions UI.
		await page.getByRole( 'button', { name: 'Revisions' } ).click();

		const revisionButtons = page.getByRole( 'button', {
			name: /^Changes saved by /,
		} );

		// Shows changes made in the revision.
		await expect(
			page
				.getByTestId( 'global-styles-revision-changes' )
				.getByRole( 'listitem' )
				.first()
		).toHaveText( 'Colors styles.' );

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
			/^Are you sure you want to apply this revision\? Any unsaved changes will be lost./
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

	test( 'should allow switching to style book view', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		await editor.canvas.locator( 'body' ).click();
		await userGlobalStylesRevisions.openStylesPanel();
		// Search for exact names to avoid selecting the command bar button in the header.
		const revisionsButton = page.getByRole( 'button', {
			name: 'Revisions',
			exact: true,
		} );
		const styleBookButton = page.getByRole( 'button', {
			name: 'Style Book',
			exact: true,
		} );
		await revisionsButton.click();
		// We can see the Revisions list.
		await expect(
			page.getByLabel( 'Global styles revisions list' )
		).toBeVisible();
		await expect(
			page.locator( 'iframe[name="revisions"]' )
		).toBeVisible();
		await expect(
			page.locator( 'iframe[name="style-book-canvas"]' )
		).toBeHidden();
		await styleBookButton.click();
		await expect(
			page.locator( 'iframe[name="style-book-canvas"]' )
		).toBeVisible();
		await expect( page.locator( 'iframe[name="revisions"]' ) ).toBeHidden();

		// Deactivating revisions view while the style book is open should close revisions,
		// but not the style book.
		await revisionsButton.click();

		// Style book is still visible but...
		await expect(
			page.locator( 'iframe[name="style-book-canvas"]' )
		).toBeVisible();
		// The Revisions list is hidden.
		await expect(
			page.getByLabel( 'Global styles revisions list' )
		).toBeHidden();
	} );

	test( 'should close revisions panel and leave style book open if activated', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		await editor.canvas.locator( 'body' ).click();
		await userGlobalStylesRevisions.openStylesPanel();
		const revisionsButton = page.getByRole( 'button', {
			name: 'Revisions',
		} );
		const styleBookButton = page.getByRole( 'button', {
			name: 'Style Book',
		} );
		await revisionsButton.click();
		await styleBookButton.click();

		await expect(
			page.getByLabel( 'Global styles revisions list' )
		).toBeVisible();

		await page.click( 'role=button[name="Back"]' );

		await expect(
			page.getByLabel( 'Global styles revisions list' )
		).toBeHidden();

		// The site editor canvas has been restored.
		await expect(
			page.locator( 'iframe[name="style-book-canvas"]' )
		).toBeVisible();
	} );

	test( 'should allow opening the command menu from the header when open', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		await editor.canvas.locator( 'body' ).click();
		await userGlobalStylesRevisions.openStylesPanel();
		await page
			.getByRole( 'button', {
				name: 'Revisions',
				exact: true,
			} )
			.click();

		// Open the command menu from the header.
		await page
			.getByRole( 'heading', {
				name: 'Style Revisions',
			} )
			.click();

		await expect(
			page.getByLabel( 'Search commands and settings' )
		).toBeVisible();
	} );

	test( 'should paginate', async ( {
		page,
		editor,
		userGlobalStylesRevisions,
	} ) => {
		await editor.canvas.locator( 'body' ).click();
		// Create > 10 revisions to display pagination navigation component.
		for ( let i = 9; i < 21; i++ ) {
			await userGlobalStylesRevisions.saveRevision( stylesPostId, {
				typography: { fontSize: `${ i }px` },
			} );
		}
		await userGlobalStylesRevisions.openStylesPanel();
		await page.getByRole( 'button', { name: 'Revisions' } ).click();
		const pagination = page.getByLabel(
			'Global Styles pagination navigation'
		);
		await expect( pagination ).toContainText( '1 of 2' );
		await pagination.getByRole( 'button', { name: 'Next page' } ).click();
		await expect( pagination ).toContainText( '2 of 2' );
	} );
} );

class UserGlobalStylesRevisions {
	constructor( { editor, page, requestUtils } ) {
		this.page = page;
		this.editor = editor;
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

	async saveRevision( stylesPostId, styles = {}, settings = {} ) {
		await this.page.evaluate(
			async ( [ _stylesPostId, _styles, _settings ] ) => {
				window.wp.data
					.dispatch( 'core' )
					.editEntityRecord( 'root', 'globalStyles', _stylesPostId, {
						id: _stylesPostId,
						settings: _settings,
						styles: _styles,
					} );
			},
			[ stylesPostId, styles, settings ]
		);
		await this.editor.saveSiteEditorEntities();
	}
}
