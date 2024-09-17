/**
 * Internal dependencies
 */
import { insertBlock } from './inserter';
import { clickMenuItem } from './click-menu-item';
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { canvas } from './canvas';

/**
 * Creates a simple reusable block with a paragraph block.
 *
 * @param {string} content Paragraph block's content
 * @param {title}  title   Reusable block's name.
 */
export const createReusableBlock = async ( content, title ) => {
	const reusableBlockNameInputSelector =
		'.patterns-menu-items__convert-modal .components-text-control__input';
	const syncToggleSelectorChecked =
		'.patterns-menu-items__convert-modal .components-form-toggle.is-checked';
	// Insert a paragraph block
	await insertBlock( 'Paragraph' );
	await page.keyboard.type( content );

	await clickBlockToolbarButton( 'Options' );
	await clickMenuItem( 'Create pattern' );
	const nameInput = await page.waitForSelector(
		reusableBlockNameInputSelector
	);
	await nameInput.click();
	await page.keyboard.type( title );

	await page.waitForSelector( syncToggleSelectorChecked );
	await page.keyboard.press( 'Enter' );

	// Wait for creation to finish
	await page.waitForXPath(
		'//*[contains(@class, "components-snackbar")]/*[contains(text(),"pattern created:")]'
	);

	// Check that we have a reusable block on the page
	const block = await canvas().waitForSelector(
		'.block-editor-block-list__block[data-type="core/block"]'
	);
	expect( block ).not.toBeNull();
};
