/**
 * Toggles a preference option with the given tab label and the option label.
 *
 * @this {import('./').PageUtils}
 * @param {string}  tabLabel          The preferences tab label to click.
 * @param {string}  optionLabel       The option label to search the button for.
 * @param {boolean} [shouldBeChecked] If true, turns the option on. If false, off. If not provided, the option will be toggled.
 */
export async function togglePreferencesOption(
	tabLabel,
	optionLabel,
	shouldBeChecked
) {
	await this.clickOnMoreMenuItem( 'Preferences' );
	const tabHandle = this.page.locator(
		`button[role="tab"]:has-text("${ tabLabel }")`
	);
	await tabHandle.click();

	const optionHandle = await this.page.$( `text=${ optionLabel }` );
	const snapshot = await this.page.accessibility.snapshot( {
		root: optionHandle,
	} );
	const isOptionChecked = snapshot.checked;

	if ( isOptionChecked !== shouldBeChecked ) {
		await optionHandle.click();
	}

	await this.clickOnCloseModalButton();
}
