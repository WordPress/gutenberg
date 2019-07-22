/**
 * Asserts that a content block's inserter toggle has keyboard focus
 */

export async function inserterToggleHasFocus() {
	const isFocusedInserterToggle = await page.evaluate( () => document.activeElement.classList.contains( 'block-editor-inserter__toggle' ) );
	await expect( isFocusedInserterToggle ).toBe( true );
}
