/**
 * Clicks a button based on the text on the button.
 *
 * @this {import('./').TestUtils}
 *
 * @param {string} buttonText The text that appears on the button to click.
 */
export async function clickButton( buttonText ) {
	const button = await this.page.locator( `button >> text=${ buttonText }` );
	await button.click();
}
