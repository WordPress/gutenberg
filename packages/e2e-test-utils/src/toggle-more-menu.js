/**
 * Toggles the More Menu.
 *
 * @param {'open' | 'close'} [waitFor] Whether it should wait for the menu to open or close. If `undefined` it won't wait for anything.
 */
export async function toggleMoreMenu( waitFor ) {
	const menuSelector = '.interface-more-menu-dropdown [aria-label="Options"]';

	const menuToggle = await page.waitForSelector( menuSelector );

	const isOpen = await menuToggle.evaluate( ( el ) =>
		el.getAttribute( 'aria-expanded' )
	);

	// If opening and it's already open then exit early.
	if ( isOpen === 'true' && waitFor === 'open' ) {
		return;
	}

	// If closing and it's already closed then exit early.
	if ( isOpen === 'false' && waitFor === 'close' ) {
		return;
	}

	await page.click( menuSelector );

	if ( waitFor ) {
		const opts = waitFor === 'close' ? { hidden: true } : {};
		const menuContentSelector = '.interface-more-menu-dropdown__content';
		await page.waitForSelector( menuContentSelector, opts );
	}
}
