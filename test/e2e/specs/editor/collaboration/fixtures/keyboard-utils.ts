/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * The key combination to move the cursor to the beginning of a line.
 * On macOS, the Home key doesn't move the cursor in a contenteditable,
 * so we use Meta+ArrowLeft (Cmd+Left) instead.
 * Ensures tests work with local and CI environments.
 */
export const LINE_START_KEY =
	process.platform === 'darwin' ? 'Meta+ArrowLeft' : 'Home';

/**
 * Press a keyboard key multiple times on the given page.
 *
 * @param page  Playwright page to send keys to.
 * @param key   Key or key combination (e.g. 'ArrowRight', 'Shift+ArrowLeft').
 * @param times Number of times to press the key.
 */
export async function pressKey( page: Page, key: string, times: number ) {
	for ( let i = 0; i < times; i++ ) {
		await page.keyboard.press( key );
	}
}
