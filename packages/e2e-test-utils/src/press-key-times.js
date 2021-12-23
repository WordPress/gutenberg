/**
 * Presses the given keyboard key a number of times in sequence.
 *
 * @param {string} key   Key to press.
 * @param {number} count Number of times to press.
 */
export async function pressKeyTimes(key, count) {
	while (count--) {
		await page.keyboard.press(key);
	}
}
