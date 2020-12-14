/**
 * Clicks a button based on the text on the button.
 *
 * @param {string} buttonText The text that appears on the button to click.
 * @param {Object} frame
 */
export async function clickButton( buttonText, frame = page ) {
	const button = await frame.waitForXPath(
		`//button[contains(text(), '${ buttonText }')]`
	);
	await button.evaluate( ( element ) => element.scrollIntoView() );
	await button.click();
}
