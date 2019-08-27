/**
 * Navigates through the block mover control using the keyboard. Asserts that the 'move up' and 'move down' controls receive focus.
 *
 * @return {Promise} A promise that's resolved when the browser has finished tabbing throught the block mover controls.
 */

export async function tabThroughBlockMovers() {
	// Tab to focus on the 'move up' control
	await page.keyboard.press( 'Tab' );
	const isFocusedMoveUpControl = await page.evaluate( () =>
		document.activeElement.classList.contains( 'block-editor-block-mover__control' )
	);
	expect( isFocusedMoveUpControl ).toBe( true );

	// Tab to focus on the 'move down' control
	await page.keyboard.press( 'Tab' );
	const isFocusedMoveDownControl = await page.evaluate( () =>
		document.activeElement.classList.contains( 'block-editor-block-mover__control' )
	);
	expect( isFocusedMoveDownControl ).toBe( true );
}
