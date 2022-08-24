/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { gotoStoryId, waitForFMAnimation } from '../utils';

test.describe( 'Popover', () => {
	test( 'should render', async ( { page } ) => {
		await gotoStoryId( page, 'components-popover--default' );

		await page.click( 'role=button' );

		await waitForFMAnimation( { page } );
		expect( await page.screenshot() ).toMatchSnapshot();
	} );
} );
