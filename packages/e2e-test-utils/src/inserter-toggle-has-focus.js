/**
 * Asserts that a content block's inserter toggle has keyboard focus
 * @returns {Promise} A promise that's resolved when the active element is evaluated and asserted to have the inserter toggle's classname.
 */

export async function inserterToggleHasFocus() {
	const isFocusedInserterToggle = await page.evaluate( () => document.activeElement.classList.contains( 'block-editor-inserter__toggle' ) );
	expect( isFocusedInserterToggle ).toBe( true );
}
