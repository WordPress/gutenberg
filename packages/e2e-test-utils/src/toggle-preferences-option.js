/**
 * Internal dependencies
 */
import { clickOnCloseModalButton } from './click-on-close-modal-button';
import { clickOnMoreMenuItem } from './click-on-more-menu-item';

/**
 * Toggles a preference option with the given tab label and the option label.
 *
 * @param {string} tabLabel The preferences tab label to click.
 * @param {string} optionLabel The option label to search the button for.
 * @param {boolean} [shouldBeChecked] If true, turns the option on. If false, off. If not provided, the option will be toggled.
 */
export async function togglePreferencesOption(
	tabLabel,
	optionLabel,
	shouldBeChecked
) {
	await clickOnMoreMenuItem( 'Preferences' );
	const [ tabHandle ] = await page.$x(
		`//button[contains(text(), "${ tabLabel }")]`
	);
	await tabHandle.click();
	const [ optionHandle ] = await page.$x(
		`//label[contains(text(), "${ optionLabel }")]`
	);
	const isChecked = await page.evaluate(
		( element ) => element.control.checked,
		optionHandle
	);
	if ( isChecked !== shouldBeChecked ) {
		await optionHandle.click();
	}

	await clickOnCloseModalButton();
}
