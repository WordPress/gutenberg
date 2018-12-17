/**
 * Converts editor's block type.
 *
 * @param {string} name Block name.
 */
export async function convertBlock( name ) {
	await page.mouse.move( 200, 300, { steps: 10 } );
	await page.mouse.move( 250, 350, { steps: 10 } );
	await page.click( '.editor-block-switcher__toggle' );
	await page.click( `.editor-block-types-list__item[aria-label="${ name }"]` );
}
