/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { gotoStoryId, waitForFMAnimation } from '../utils';

test.describe.parallel( 'FontSizePicker', () => {
	test.beforeEach( async ( { page } ) => {
		await gotoStoryId( page, 'components-fontsizepicker--default' );
	} );

	test( 'Renders with "Normal" size by default', async ( { page } ) => {
		const button = await page.locator( 'button[aria-label="Normal"]' );

		await waitForFMAnimation( { page } );
		expect( button ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );

	test( 'Can change size to "Small"', async ( { page } ) => {
		const button = await page.locator( 'button[aria-label="Small"]' );

		await button.click();

		await waitForFMAnimation( { page } );
		expect( button ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );

	test( 'Can change size to "Big"', async ( { page } ) => {
		const button = await page.locator( 'button[aria-label="Big"]' );

		await button.click();

		await waitForFMAnimation( { page } );
		expect( button ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );

	test( 'Can change size back to "Normal"', async ( { page } ) => {
		const button = await page.locator( 'button[aria-label="Normal"]' );

		await button.click();

		await waitForFMAnimation( { page } );
		expect( button ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );
} );
