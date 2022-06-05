/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Clicks the default block appender.
 *
 * @param {Editor} this
 * @param {string} name Block name.
 */
export async function transformBlockTo( this: Editor, name: string ) {
	await this.showBlockToolbar();

	const switcherToggle = await this.page.waitForSelector(
		'.block-editor-block-switcher__toggle'
	);
	await switcherToggle.evaluate( ( element ) => element.scrollIntoView() );
	await this.page.waitForSelector( '.block-editor-block-switcher__toggle', {
		state: 'visible',
	} );
	await switcherToggle.click();
	await this.page.waitForSelector(
		'.block-editor-block-switcher__container',
		{
			state: 'visible',
		}
	);

	// Find the block button option within the switcher popover.
	const xpath = `//*[contains(@class, "block-editor-block-switcher__popover")]//button[.='${ name }']`;
	const insertButton = await this.page.waitForSelector( xpath, {
		state: 'visible',
	} );
	// Clicks may fail if the button is out of view. Assure it is before click.
	await insertButton.evaluate( ( element ) => element.scrollIntoView() );
	await insertButton.click();

	// Wait for the transformed block to appear.
	const BLOCK_SELECTOR = '.block-editor-block-list__block';
	const BLOCK_NAME_SELECTOR = `[data-title="${ name }"]`;
	await this.page.waitForSelector(
		`${ BLOCK_SELECTOR }${ BLOCK_NAME_SELECTOR }`,
		{ strict: false, state: 'visible' }
	);
}
