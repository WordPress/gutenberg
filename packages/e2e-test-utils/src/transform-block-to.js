/**
 * Converts editor's block type.
 *
 * @param {string} name Block name.
 */
export async function transformBlockTo( name ) {
	await page.mouse.move( 200, 300, { steps: 10 } );
	await page.mouse.move( 250, 350, { steps: 10 } );
	await page.click( '.block-editor-block-switcher__toggle' );
	await page.waitForSelector( `.block-editor-block-types-list__item[aria-label="${ name }"]` );
	await page.click( `.block-editor-block-types-list__item[aria-label="${ name }"]` );
}
