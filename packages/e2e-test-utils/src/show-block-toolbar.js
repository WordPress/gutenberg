/**
 * The block toolbar is not always visible while typing.
 * Call this function to reveal it.
 */
export async function showBlockToolbar() {
	// Move the mouse to disable the isTyping mode
	await page.mouse.move( 50, 50 );
	await page.mouse.move( 100, 100 );
}
