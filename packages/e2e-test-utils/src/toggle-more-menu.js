/**
 * Toggles the More Menu.
 *
 * @param {'open' | 'close'} [waitFor] Whether it should wait for the menu to open or close. If `undefined` it won't wait for anything.
 */
export async function toggleMoreMenu( waitFor ) {
	const menuSelector = '.interface-more-menu-dropdown [aria-label="Options"]';

	await page.click( menuSelector );

	if ( waitFor ) {
		const opts = waitFor === 'close' ? { hidden: true } : {};
		const menuContentSelector = '.interface-more-menu-dropdown__content';
		await page.waitForSelector( menuContentSelector, opts );
	}
}
