/**
 * WordPress dependencies
 */
import { createNewPost, insertBlock } from '@wordpress/e2e-test-utils';

describe( 'Validate multiple use', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	// Regression of: https://github.com/WordPress/gutenberg/pull/39813
	it( 'should display correct amount of warning message', async () => {
		const OPTIONS_SELECTOR =
			'//div[contains(@class, "block-editor-block-settings-menu")]//button[contains(@aria-label, "Options")]';
		const DUPLICATE_BUTTON_SELECTOR =
			'//button[contains(@class, "components-menu-item__button")][contains(., "Duplicate")]';

		// Insert a block with `multiple` feature enabled, such as `core/more`
		await insertBlock( 'More' );

		// Block toolbar options dropdown button
		let optionButton = await page.waitForXPath( OPTIONS_SELECTOR );
		await optionButton.click();

		const groupButton = await page.waitForXPath(
			'//button[contains(@class, "components-menu-item__button")][contains(., "Group")]'
		);

		await groupButton.click();

		// Block toolbar options dropdown button
		optionButton = await page.waitForXPath( OPTIONS_SELECTOR );
		await optionButton.click();

		// Duplicate block twice
		let duplicateButton = await page.waitForXPath(
			DUPLICATE_BUTTON_SELECTOR
		);
		await duplicateButton.click();

		optionButton = await page.waitForXPath( OPTIONS_SELECTOR );
		await optionButton.click();
		duplicateButton = await page.waitForXPath( DUPLICATE_BUTTON_SELECTOR );
		await duplicateButton.click();

		// Check if there are correct amount of warnings.
		expect(
			await page.$x(
				'//p[contains(@class, "block-editor-warning__message")][contains(., "More: This block can only be used once.")]'
			)
		).toHaveLength( 2 );
	} );
} );
