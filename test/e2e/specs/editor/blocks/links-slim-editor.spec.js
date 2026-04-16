/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Tests for link behavior in a standalone BlockEditorProvider setup
 * (no iframe, no full editor chrome). This mirrors how Press This and
 * other minimal integrations consume the block editor packages.
 *
 * See https://github.com/WordPress/press-this/issues/116
 */
test.describe( 'Links in standalone BlockEditorProvider', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-slim-editor-block-editor'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-slim-editor-block-editor'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitAdminPage( 'admin.php', 'page=slim-editor-test' );
	} );

	test( 'should preserve cursor position after Escape closes link popover', async ( {
		page,
	} ) => {
		// Wait for the editor to render with its "Type here…" appender.
		const appender = page.locator(
			'#slim-editor-root .block-editor-default-block-appender'
		);
		await expect( appender ).toBeVisible( { timeout: 10000 } );

		// Click the appender to create a paragraph block.
		await appender.click();

		// Wait for the contenteditable to appear.
		const richText = page.locator(
			'#slim-editor-root [contenteditable="true"]'
		);
		await expect( richText ).toBeVisible( { timeout: 5000 } );

		// Type text.
		await page.keyboard.type( 'Before link text after' );
		await expect( richText ).toContainText( 'Before link text after' );

		// Select "link text" by arrowing left past " after", then
		// shift-selecting 9 characters ("link text").
		for ( let i = 0; i < ' after'.length; i++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}
		await page.keyboard.down( 'Shift' );
		for ( let i = 0; i < 'link text'.length; i++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}
		await page.keyboard.up( 'Shift' );

		// Open link popover via keyboard shortcut. We dispatch the event
		// directly on the contenteditable to bypass the admin command
		// palette which intercepts Ctrl+K at the document level.
		await richText.press( 'ControlOrMeta+k' );

		// Wait for the URL input to appear.
		const urlInput = page.getByRole( 'combobox', {
			name: 'Search or type URL',
		} );
		await expect( urlInput ).toBeVisible();

		// Enter a URL and submit.
		await urlInput.fill( 'https://example.com' );
		await page.keyboard.press( 'Enter' );

		// Close the link popover with Escape.
		await page.keyboard.press( 'Escape' );

		// Wait for popover to close and focus to return to the rich text.
		await expect( urlInput ).toBeHidden();
		await expect( richText ).toBeFocused();

		// Type a marker character. If the cursor jumped to position 0,
		// MARKER would appear at the very start of the paragraph.
		await page.keyboard.type( 'MARKER' );

		const textContent = await richText.textContent();

		// The selection should be restored to "link text" (which was
		// selected before the popover opened), so typing MARKER replaces
		// the selected text. Without the fix, the cursor jumps to
		// position 0 and MARKER appears at the start.
		expect( textContent ).toBe( 'Before MARKER after' );
	} );
} );
