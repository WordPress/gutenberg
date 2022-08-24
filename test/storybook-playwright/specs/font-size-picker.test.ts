/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { gotoStoryId } from '../utils';

const waitUntilButtonHighlightStable = async ( page ) => {
	const handle = await page.waitForSelector(
		'[aria-label="Font size"] > div[role=presentation]'
	);

	await handle?.waitForElementState( 'stable' );

	return handle;
};

test.describe.parallel( 'FontSizePicker', () => {
	test.beforeEach( async ( { page } ) => {
		await gotoStoryId( page, 'components-fontsizepicker--default' );
	} );

	test( 'Renders with "Normal" size by default', async ( { page } ) => {
		const button = await page.locator( 'button[aria-label="Normal"]' );

		await waitUntilButtonHighlightStable( page );

		expect( button ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );

	test( 'Can change size to "Small"', async ( { page } ) => {
		const button = await page.locator( 'button[aria-label="Small"]' );

		await button.click();
		await waitUntilButtonHighlightStable( page );

		expect( button ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );

	test( 'Can change size to "Big"', async ( { page } ) => {
		const button = await page.locator( 'button[aria-label="Big"]' );

		await button.click();
		await waitUntilButtonHighlightStable( page );

		expect( button ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );

	test( 'Can change size back to "Normal"', async ( { page } ) => {
		const button = await page.locator( 'button[aria-label="Normal"]' );

		await button.click();
		await waitUntilButtonHighlightStable( page );

		expect( button ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );
} );
