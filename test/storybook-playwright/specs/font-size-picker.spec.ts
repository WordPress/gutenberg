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

	// This isn't a meaningful test, just some example code to demonstrate a way to
	// wait until a certain element has finished animating.
	// We can remove it once we have real tests.
	test( 'with value', async ( { page } ) => {
		const button = await page.locator( 'button[aria-label="Normal"]' );

		await waitUntilButtonHighlightStable( page );

		expect( button ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );
} );
