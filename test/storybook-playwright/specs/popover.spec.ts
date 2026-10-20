import { test, expect } from '@playwright/test';
import { gotoStoryId } from '../utils';

test.describe( 'Popover', () => {
	// This isn't a meaningful test, just some example code.
	// We can remove it once we have real tests.
	test( 'should render', async ( { page } ) => {
		await gotoStoryId( page, 'components-popover--default' );

		await page.click( 'role=button' );
		const popover = await page.waitForSelector( '.components-popover' );
		await popover.waitForElementState( 'stable' );

		expect( await page.screenshot() ).toMatchSnapshot();
	} );
} );
