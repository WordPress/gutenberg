/**
 * Clicks a block toolbar button.
 *
 * @this {import('./').PageUtils}
 * @param {string} label The text string of the button label.
 */
export async function clickBlockToolbarButton( label ) {
	await this.showBlockToolbar();

	const blockToolbar = this.page.locator(
		'role=toolbar[name="Block tools"i]'
	);
	const button = blockToolbar.locator( `role=button[name="${ label }"]` );

	await button.click();
}
