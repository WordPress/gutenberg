import type { Page } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

function optionsButton( page: Page ) {
	return page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } );
}

/*
 * A radio item keeps the Options menu open after a selection. Since Options
 * is a toggle, clicking it while the menu is still mounted closes the menu
 * rather than reopening it, and the assertion that follows fails with
 * "element not found". Only click when the menu is not already showing, so
 * the helper is safe to call either way.
 */
async function openIntentSwitcher( page: Page ) {
	const suggestChoice = page.getByRole( 'menuitemradio', {
		name: /^Suggesting/,
	} );

	if ( ! ( await suggestChoice.isVisible() ) ) {
		await optionsButton( page ).click();
	}

	await expect( suggestChoice ).toBeVisible();
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

		// Match the labels exactly: the sibling Visual/Code editor radio items
		// would otherwise match 'Editing' via Playwright's substring search.
		const editChoice = page.getByRole( 'menuitemradio', {
			name: 'Editing',
			exact: true,
		} );
		const suggestChoice = page.getByRole( 'menuitemradio', {
			name: /^Suggesting/,
		} );
		const viewChoice = page.getByRole( 'menuitemradio', {
			name: 'Viewing',
			exact: true,
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
				name: 'Editing',
				exact: true,
			} )
		).toHaveAttribute( 'aria-checked', 'true' );
	} );

	test( 'the active intent hides its keyboard shortcut', async ( {
		page,
		pageUtils,
	} ) => {
		// The menu exposes an item's shortcut through `aria-keyshortcuts`.
		const shortcut = 'aria-keyshortcuts';
		const editChoice = page.getByRole( 'menuitemradio', {
			name: 'Editing',
			exact: true,
		} );
		const suggestChoice = page.getByRole( 'menuitemradio', {
			name: /^Suggesting/,
		} );

		await openIntentSwitcher( page );

		/*
		 * A shortcut printed next to the checked choice reads as "press this
		 * to get where you already are". The other choices keep theirs, which
		 * is what makes the hint useful. `ModeSwitcher` behaves the same way.
		 */
		await expect( editChoice ).toHaveAttribute( 'aria-checked', 'true' );
		await expect( editChoice ).not.toHaveAttribute( shortcut );
		await expect( suggestChoice ).toHaveAttribute( shortcut, /.+/ );

		// The hint follows the selection rather than being dropped for good.
		await pageUtils.pressKeys( 'secondary+X' );
		await openIntentSwitcher( page );
		await expect( suggestChoice ).toHaveAttribute( 'aria-checked', 'true' );
		await expect( suggestChoice ).not.toHaveAttribute( shortcut );
		await expect( editChoice ).toHaveAttribute( shortcut, /.+/ );
	} );

	test( 'keyboard shortcut cycles between intents', async ( {
		page,
		pageUtils,
	} ) => {
		// The intent shortcuts are registered with the `secondary` modifier,
		// which is Ctrl+Alt+Shift on Windows and Linux but ⇧⌥⌘ on macOS.
		// Press it through `pageUtils` so the test exercises the shortcut the
		// current platform actually registered.

		// Default is Edit.
		await pageUtils.pressKeys( 'secondary+X' );
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', { name: /^Suggesting/ } )
		).toHaveAttribute( 'aria-checked', 'true' );

		// The menu stays open across the switch; the shortcut works from
		// inside it and the choice's state updates in place.
		await pageUtils.pressKeys( 'secondary+C' );
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', { name: 'Viewing', exact: true } )
		).toHaveAttribute( 'aria-checked', 'true' );

		// Back to Edit.
		await pageUtils.pressKeys( 'secondary+Z' );
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', {
				name: 'Editing',
				exact: true,
			} )
		).toHaveAttribute( 'aria-checked', 'true' );
	} );
} );
