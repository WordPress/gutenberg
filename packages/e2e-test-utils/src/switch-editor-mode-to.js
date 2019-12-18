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
	await toggleMoreMenu();
	const [ button ] = await page.$x(
		`//button[contains(text(), '${ mode } editor')]`
	);
	await button.click( 'button' );
	await toggleMoreMenu();
	if ( mode === 'Code' ) {
		await page.waitForSelector( '.editor-post-text-editor' );
	}
}
