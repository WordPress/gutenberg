/**
 * WordPress dependencies
 */
import { test as base } from '@wordpress/e2e-test-utils-playwright';
export { expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import CollaborationUtils from './collaboration-utils';

type Fixtures = {
	collaborationUtils: CollaborationUtils;
};

export const test = base.extend< Fixtures >( {
	collaborationUtils: async (
		{ admin, editor, requestUtils, page },
		use
	) => {
		const utils = new CollaborationUtils( {
			admin,
			editor,
			requestUtils,
			page,
		} );
		await utils.enableCollaboration();
		await utils.createSecondUser();
		await use( utils );
		await utils.teardown();
	},
} );
