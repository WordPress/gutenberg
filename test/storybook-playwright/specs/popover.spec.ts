/**
 * External dependencies
 */
import { test, expect } from '@playwright/test';

/**
 * Internal dependencies
 */
import { gotoStoryId } from '../utils';

test.describe( 'Popover', () => {
	// This isn't a meaningful test, just some example code.
	// We can remove it once we have real tests.
	test( 'should render', async ( { page } ) => {
		await gotoStoryId( page, 'components-popover--default', {
			decorators: { marginChecker: 'show' },
		} );

		await page.click( 'role=button' );
		const popover = await page.waitForSelector( '.components-popover' );
		await popover.waitForElementState( 'stable' );

		expect( await page.screenshot() ).toMatchSnapshot();
	} );
} );
