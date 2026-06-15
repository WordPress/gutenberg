/**
 * WordPress dependencies
 */
import { test as base } from '@wordpress/e2e-test-utils-playwright';
export { expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import InteractivityUtils from './interactivity-utils';

type Fixtures = {
	interactivityUtils: InteractivityUtils;
};

export const test = base.extend< Fixtures >( {
	interactivityUtils: [
		async ( { requestUtils }, use ) => {
			await use( new InteractivityUtils( { requestUtils } ) );
		},
		// This is a hack, 'worker' is a valid value but the type is wrong.
		// https://playwright.dev/docs/test-fixtures#worker-scoped-fixtures
		{ scope: 'worker' as 'test' },
	],
} );
