/**
 * Clicks a block toolbar button.
 *
 * @this {import('./').TestUtils}
 * @param {string} label  The text string of the button label.
 * @param {string} [type] The type of button label: 'ariaLabel' or 'content'.
 */
export async function clickBlockToolbarButton( label, type = 'ariaLabel' ) {
	await this.showBlockToolbar();
	const blockToolbar = this.page.locator( '.block-editor-block-toolbar' );
	let button;

	if ( type === 'ariaLabel' ) {
		button = await blockToolbar.locator(
			`button[aria-label=${ JSON.stringify( label ) }]`
		);
	}

	if ( type === 'content' ) {
		button = await blockToolbar.locator(
			`button:has-text(${ JSON.stringify( label ) })`
		);
	}

	await button.click();
}
