/**
 * Internal dependencies
 */
import { canvas } from './canvas';

/**
 * Clicks the default block appender.
 */
export async function clickBlockAppender() {
	const appender = await canvas().waitForSelector(
		'.block-editor-default-block-appender__content'
	);
	await appender.click();
}
