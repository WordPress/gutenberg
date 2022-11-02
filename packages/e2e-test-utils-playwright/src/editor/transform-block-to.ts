/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Clicks the default block appender.
 *
 * @param {Editor} this
 * @param {string} name Block name or title.
 */
export async function transformBlockTo( this: Editor, name: string ) {
	await this.showBlockToolbar();

	if ( name.includes( '/' ) ) {
		name = await this.page.evaluate( () => {
			// @ts-ignore (Reason: wp isn't typed).
			return window.wp.blocks.getBlockType( name ).title;
		} );
	}

	const switcherToggle = await this.page.waitForSelector(
		'.block-editor-block-switcher__toggle'
	);
	await switcherToggle.evaluate( ( element ) => element.scrollIntoView() );
	await this.page.waitForSelector( '.block-editor-block-switcher__toggle' );
	await switcherToggle.click();
	await this.page.waitForSelector(
		'.block-editor-block-switcher__container'
	);

	// Find the block button option within the switcher popover.
	const xpath = `//*[contains(@class, "block-editor-block-switcher__popover")]//button[.='${ name }']`;
	const insertButton = await this.page.waitForSelector( xpath );
	// Clicks may fail if the button is out of view. Assure it is before click.
	await insertButton.evaluate( ( element ) => element.scrollIntoView() );
	await insertButton.click();

	await this.page.evaluate(
		() =>
			// @ts-ignore (Reason: window global).
			new Promise( requestIdleCallback )
	);
}
