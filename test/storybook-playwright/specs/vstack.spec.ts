/**
 * External dependencies
 */
import { test } from '@playwright/test';

/**
 * Internal dependencies
 */
import {
	gotoStoryId,
	getAllPropsPermutations,
	testSnapshotForPropsConfig,
} from '../utils';

const PROP_VALUES_TO_TEST = [
	{
		propName: 'alignment',
		valuesToTest: [
			undefined,
			'top',
			'topLeft',
			'topRight',
			'left',
			'center',
			'right',
			'bottom',
			'bottomLeft',
			'bottomRight',
			'edge',
			'stretch',
		],
	},
	{
		propName: 'direction',
		valuesToTest: [ undefined, 'row', 'column' ],
	},
];

test.describe( 'VStack', () => {
	test.beforeEach( async ( { page } ) => {
		await gotoStoryId( page, 'components-experimental-vstack--default', {
			decorators: { marginChecker: 'show', customE2EControls: 'show' },
		} );
	} );

	getAllPropsPermutations( PROP_VALUES_TO_TEST ).forEach( ( propsConfig ) => {
		test( `should render with ${ JSON.stringify( propsConfig ) }`, async ( {
			page,
		} ) => {
			await page.waitForSelector( '.components-v-stack' );

			await testSnapshotForPropsConfig( page, propsConfig );
		} );
	} );
} );
