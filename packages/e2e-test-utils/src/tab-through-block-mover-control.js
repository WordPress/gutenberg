/**
 * Navigate through the block mover control using the keyboard
 */
export async function tabThroughBlockMoverControl() {
	// Tab to focus on the 'move up' control
	await page.keyboard.press( 'Tab' );
	const isFocusedMoveUpControl = await page.evaluate( () =>
		document.activeElement.classList.contains( 'editor-block-mover__control' )
	);
	await expect( isFocusedMoveUpControl ).toBe( true );

	// Tab to focus on the 'move down' control
	await page.keyboard.press( 'Tab' );
	const isFocusedMoveDownControl = await page.evaluate( () =>
		document.activeElement.classList.contains( 'editor-block-mover__control' )
	);
	await expect( isFocusedMoveDownControl ).toBe( true );
}
