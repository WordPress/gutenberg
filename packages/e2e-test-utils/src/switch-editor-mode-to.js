/**
 * Switches editor mode.
 *
 * @param {string} mode String editor mode.
 */
export async function switchEditorModeTo( mode ) {
	await page.click(
		'.edit-post-more-menu [aria-label="Show more tools & options"]'
	);
	const [ button ] = await page.$x(
		`//button[contains(text(), '${ mode } Editor')]`
	);
	await button.click( 'button' );
}
