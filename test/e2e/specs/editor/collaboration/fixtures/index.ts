/**
 * WordPress dependencies
 */
import { test as base } from '@wordpress/e2e-test-utils-playwright';
export { expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import CollaborationUtils, { SECOND_USER } from './collaboration-utils';

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
		await utils.setCollaboration( true );
		await requestUtils.createUser( SECOND_USER );
		await use( utils );
		await utils.teardown();
	},
} );
