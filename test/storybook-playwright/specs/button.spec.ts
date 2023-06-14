/**
 * External dependencies
 */
import { expect, test } from '@playwright/test';

/**
 * Internal dependencies
 */
import {
	gotoStoryId,
	getAllPropsPermutations,
	testSnapshotForPropsConfig,
} from '../utils';

test.describe( 'Button', () => {
	test.describe( 'variant states', () => {
		test.beforeEach( async ( { page } ) => {
			gotoStoryId( page, 'components-button--variant-states', {
				decorators: { customE2EControls: 'show' },
			} );
		} );

		getAllPropsPermutations( [
			{
				propName: '__next40pxDefaultSize',
				valuesToTest: [ true, false ],
			},
		] ).forEach( ( propsConfig ) => {
			test( `should render with ${ JSON.stringify(
				propsConfig
			) }`, async ( { page } ) => {
				await testSnapshotForPropsConfig( page, propsConfig );
			} );
		} );
	} );

	test.describe( 'icon', () => {
		test.beforeEach( async ( { page } ) => {
			gotoStoryId( page, 'components-button--icon', {
				decorators: { customE2EControls: 'show' },
			} );
		} );

		getAllPropsPermutations( [
			{
				propName: '__next40pxDefaultSize',
				valuesToTest: [ true, false ],
			},
		] ).forEach( ( propsConfig ) => {
			test( `should render with ${ JSON.stringify(
				propsConfig
			) }`, async ( { page } ) => {
				await testSnapshotForPropsConfig( page, propsConfig );
			} );
		} );
	} );
} );
