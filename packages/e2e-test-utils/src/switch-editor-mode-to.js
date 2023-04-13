/**
 * Internal dependencies
 */
import { toggleMoreMenu } from './toggle-more-menu';

/**
 * Switches editor mode.
 *
 * @param {string} mode String editor mode.
 */
export async function switchEditorModeTo( mode ) {
	await toggleMoreMenu( 'open' );
	const [ button ] = await page.$x(
		`//button/span[contains(text(), '${ mode } editor')]`
	);
	await button.click( 'button' );
	await toggleMoreMenu( 'close' );
	if ( mode === 'Code' ) {
		await page.waitForSelector( '.editor-post-text-editor' );
	}
}
