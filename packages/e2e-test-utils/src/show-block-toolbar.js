/**
 * The block toolbar is not always visible while typing.
 * Call this function to reveal it.
 */
export async function showBlockToolbar() {
	const content = await page.$( '.interface-interface-skeleton__content' );
	const { x, y } = await content.boundingBox();
	// Move the mouse to disable the isTyping mode
	await page.mouse.move( x + 50, y + 50 );
	await page.mouse.move( x + 100, y + 100 );
}
