/**
 * Clicks a button based on the text on the button.
 *
 * @param {string} buttonText The text that appears on the button to click.
 */
export async function clickButton( buttonText ) {
	const button = await page.waitForXPath( `//button[contains(text(), '${ buttonText }')]` );
	await button.click();
}
