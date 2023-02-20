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

test.describe( 'HStack', () => {
	test.beforeEach( async ( { page } ) => {
		await gotoStoryId( page, 'components-experimental-hstack--default', {
			decorators: { marginChecker: 'show' },
		} );
	} );

	test( 'should render', async ( { page } ) => {
		// This test is going to run slow. Triple the default timeout.
		test.slow();

		await page.waitForSelector( '.components-h-stack' );

		await testAllSnapshotsCombinationsWithE2EControls( page );
	} );
} );
