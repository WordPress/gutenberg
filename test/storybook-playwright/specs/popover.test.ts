/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { gotoStoryId } from '../utils';

test.describe( 'Popover', () => {
	test( 'should render', async ( { page } ) => {
		await gotoStoryId( page, 'components-popover--default' );

		await page.click( 'role=button' );

		expect( await page.screenshot() ).toMatchSnapshot();
	} );
} );
