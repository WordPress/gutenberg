/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Clicks the default block appender.
 *
 * @param {Editor} this
 */
export async function clickBlockAppender( this: Editor ) {
	// The block appender is only visible when there's no selection.
	await this.page.evaluate( () =>
		// @ts-ignore (Reason: wp isn't typed)
		window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock()
	);
	const appender = await this.page.waitForSelector(
		'.block-editor-default-block-appender__content'
	);
	await appender.click();
}
