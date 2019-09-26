/**
 * Jest matcher for asserting that blocks are multi-selected.
 *
 * @param {Array} selectors List of block selectors.
 */
export async function toBeMultiSelected( selectors ) {
	const multiSelectedCssClass = 'is-multi-selected';

	const result = {};

	try {
		for ( const selector of selectors ) {
			const className = await page.$eval( selector, ( element ) => element.className );
			expect( className ).toEqual( expect.stringContaining( multiSelectedCssClass ) );
		}
		result.pass = true;
		result.message = () => `Expected blocks not to be multi-selected.`;
	} catch {
		result.pass = false;
		result.message = () => `Expected blocks to be multi-selected.`;
	}

	return result;
}
