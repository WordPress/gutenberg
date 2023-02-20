/**
 * External dependencies
 */
import { test } from '@playwright/test';

/**
 * Internal dependencies
 */
import {
	gotoStoryId,
	testAllSnapshotsCombinationsWithE2EControls,
} from '../utils';

test.describe( 'VStack', () => {
	test.beforeEach( async ( { page } ) => {
		await gotoStoryId( page, 'components-experimental-vstack--default', {
			decorators: { marginChecker: 'show' },
		} );
	} );

	test( 'should render', async ( { page } ) => {
		// This test is going to run slow. Tripe the default timeout.
		test.slow();

		await page.waitForSelector( '.components-v-stack' );

		await testAllSnapshotsCombinationsWithE2EControls( page );
	} );
} );
