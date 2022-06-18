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

	const switcherToggle = this.page.locator(
		'.block-editor-block-switcher__toggle'
	);
	await switcherToggle.click();

	// Find the block button option within the switcher popover.
	const insertButton = this.page.locator(
		`.block-editor-block-switcher__popover >> role=menuitem[name="${ name }"i]`
	);
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
