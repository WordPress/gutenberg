/**
 * Function that waits until the page viewport has the required dimensions.
 * It is being used to address a problem where after using setViewport the execution may continue,
 * without the new dimensions being applied.
 * https://github.com/GoogleChrome/puppeteer/issues/1751
 *
 * @param {number} width  Width of the window.
 * @param {height} height Height of the window.
 */
export async function waitForWindowDimensions( width, height ) {
	await page
		.mainFrame()
		.waitForFunction(
			`window.innerWidth === ${ width } && window.innerHeight === ${ height }`
		);
}
