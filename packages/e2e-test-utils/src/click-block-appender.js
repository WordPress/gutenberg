/**
 * Internal dependencies
 */
import { canvas } from './canvas';

/**
 * Clicks the default block appender.
 */
export async function clickBlockAppender() {
	// The block appender is only visible when there's no selection.
	await page.evaluate( () =>
		window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock()
	);
	const appender = await canvas().waitForSelector(
		'.block-editor-default-block-appender__content'
	);
	await appender.click();
	await page.evaluate( () => new Promise( window.requestIdleCallback ) );
}
