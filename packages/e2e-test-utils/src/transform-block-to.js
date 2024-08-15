/**
 * Internal dependencies
 */
import { showBlockToolbar } from './show-block-toolbar';

/**
 * Converts editor's block type.
 *
 * @param {string} name Block name.
 */
export async function transformBlockTo( name ) {
	await showBlockToolbar();

	const switcherToggle = await page.waitForSelector(
		'.block-editor-block-switcher__toggle'
	);
	await switcherToggle.evaluate( ( element ) => element.scrollIntoView() );
	await page.waitForSelector( '.block-editor-block-switcher__toggle', {
		visible: true,
	} );
	await switcherToggle.click();
	await page.waitForSelector( '.block-editor-block-switcher__container', {
		visible: true,
	} );

	// Find the block button option within the switcher popover.
	const xpath = `//*[contains(@class, "block-editor-block-switcher__popover")]//button[.='${ name }']`;
	const insertButton = await page.waitForXPath( xpath, { visible: true } );
	// Clicks may fail if the button is out of view. Assure it is before click.
	await insertButton.evaluate( ( element ) => element.scrollIntoView() );
	await insertButton.click();

	await page.evaluate( () => new Promise( requestIdleCallback ) );
}
