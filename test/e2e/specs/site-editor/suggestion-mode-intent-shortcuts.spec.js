/**
 * The intent shortcuts (Edit / Suggest / View) are only usable where the
 * Mode menu is offered: the Suggestion Mode experiment on AND the current
 * post type supporting `editor.notes`. Registering them lists them in the
 * Keyboard Shortcuts help modal, so registration has to follow the same
 * gate. `wp_template` has no notes support, so the Site Editor is the
 * screen where advertising them is wrong.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SUGGEST_SHORTCUT = 'Switch to Suggest mode.';

async function openShortcutHelp( page, pageUtils ) {
	await pageUtils.pressKeys( 'access+h' );
	const dialog = page.getByRole( 'dialog', { name: 'Keyboard shortcuts' } );
	await expect( dialog ).toBeVisible();
	return dialog;
}

test.describe( 'Suggest mode intent shortcuts', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfour' );
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'are listed in the post editor, where the Mode menu is offered', async ( {
		admin,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();

		const dialog = await openShortcutHelp( page, pageUtils );
		// Anchor on a shortcut that is always registered before asserting
		// on the one under test, so the list is known to have rendered.
		await expect(
			dialog.getByText( 'Show or hide the List View.' )
		).toBeVisible();
		await expect( dialog.getByText( SUGGEST_SHORTCUT ) ).toBeVisible();
	} );

	test( 'still switch the intent in the post editor', async ( {
		admin,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();

		// The mode change also fires an a11y live-region announcement
		// carrying the same text, so scope to the snackbar list.
		const snackbarList = page.locator( '.components-snackbar-list' );
		await pageUtils.pressKeys( 'secondary+x' );
		await expect(
			snackbarList.getByText( "You're suggesting" )
		).toBeVisible();
	} );

	test( 'are not listed in the Site Editor, where no post type supports notes', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.visitAdminPage( 'site-editor.php?canvas=edit' );
		await editor.setPreferences( 'core/edit-site', {
			welcomeGuide: false,
		} );
		await expect( page.locator( 'h1' ) ).toContainText( 'Template' );

		const dialog = await openShortcutHelp( page, pageUtils );
		await expect(
			dialog.getByText( 'Show or hide the List View.' )
		).toBeVisible();
		await expect( dialog.getByText( SUGGEST_SHORTCUT ) ).toBeHidden();
	} );
} );
