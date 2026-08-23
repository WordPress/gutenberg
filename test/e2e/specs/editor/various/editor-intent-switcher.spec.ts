import type { Page } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

async function openIntentSwitcher( page: Page ) {
	await page.click(
		'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
	);
}

/*
 * `MenuItemsChoice` keeps its dropdown open on selection, and Escape does not
 * reliably dismiss it. Leaving it open is what made this test flaky: the
 * Options button toggles, so reopening a menu that never closed shuts it
 * instead, and the assertion that follows finds no menu item at all. Close it
 * through the same toggle and wait for it to actually go.
 */
async function closeIntentSwitcher( page ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	await expect(
		page.getByRole( 'menuitemradio', { name: /^Suggesting/ } )
	).toBeHidden();
}

test.describe( 'Editor intent switcher', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'defaults to Edit intent on every editor load', async ( {
		page,
		editor,
	} ) => {
		await openIntentSwitcher( page );

		// Use full accessible names (label + info) to disambiguate from the
		// sibling Visual/Code editor menuitemradios which would otherwise
		// match 'Editing' via Playwright's substring search.
		const editChoice = page.getByRole( 'menuitemradio', {
			name: /^Editing\s+Edit content directly/,
		} );
		const suggestChoice = page.getByRole( 'menuitemradio', {
			name: /^Suggesting/,
		} );
		const viewChoice = page.getByRole( 'menuitemradio', {
			name: /^Viewing\s+Read-only/,
		} );

		await expect( editChoice ).toBeVisible();
		await expect( suggestChoice ).toBeVisible();
		await expect( viewChoice ).toBeVisible();
		await expect( editChoice ).toHaveAttribute( 'aria-checked', 'true' );

		// The intent is session-scoped: switching to Suggest and reloading
		// must fall back to Edit rather than persist the previous choice.
		await suggestChoice.click();
		await page.reload();
		await editor.canvas.locator( 'body' ).waitFor();
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', {
				name: /^Editing\s+Edit content directly/,
			} )
		).toHaveAttribute( 'aria-checked', 'true' );
	} );

	test( 'View intent makes blocks read-only', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Initial content' },
		} );

		await openIntentSwitcher( page );
		await page
			.getByRole( 'menuitemradio', { name: /^Viewing\s+Read-only/ } )
			.click();

		// In preview mode, block content is not editable — the paragraph
		// should render but clicking and typing should not change it.
		const paragraph = editor.canvas.getByText( 'Initial content' );
		await expect( paragraph ).toBeVisible();
		await expect( paragraph ).not.toHaveAttribute(
			'contenteditable',
			'true'
		);
	} );

	test( 'keyboard shortcut cycles between intents', async ( {
		page,
		pageUtils,
	} ) => {
		/*
		 * The intent shortcuts are registered with the `secondary` modifier,
		 * which is Ctrl+Alt+Shift on Windows and Linux but Cmd+Opt+Shift on
		 * macOS. Press it through `pageUtils` so the test resolves the same
		 * combination the editor is listening for, rather than passing on
		 * every platform CI happens to run.
		 */
		// Default is Edit.
		await pageUtils.pressKeys( 'secondary+x' );
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', { name: /^Suggesting/ } )
		).toHaveAttribute( 'aria-checked', 'true' );

		// Close menu and switch to View via shortcut.
		await closeIntentSwitcher( page );
		await pageUtils.pressKeys( 'secondary+c' );
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', { name: /^Viewing\s+Read-only/ } )
		).toHaveAttribute( 'aria-checked', 'true' );

		// Back to Edit.
		await closeIntentSwitcher( page );
		await pageUtils.pressKeys( 'secondary+z' );
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', {
				name: /^Editing\s+Edit content directly/,
			} )
		).toHaveAttribute( 'aria-checked', 'true' );
	} );
} );
