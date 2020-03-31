/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	getEditedPostContent,
	pressKeyTimes,
	switchEditorModeTo,
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	enableExperimentalFeatures,
	disableExperimentalFeatures,
} from '../../../experimental-features';

describe( 'entities saved states', () => {
	const experimentsSettings = [ '#gutenberg-full-site-editing' ];

	beforeAll( async () => {
		await enableExperimentalFeatures( experimentsSettings );
	} );

	afterAll( async () => {
		await disableExperimentalFeatures( experimentsSettings );
	} );

	it( 'should run in suite', () => {
		expect( true ).toBe( true );
	} );
} );
