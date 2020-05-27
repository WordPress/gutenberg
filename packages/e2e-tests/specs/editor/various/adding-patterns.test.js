/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertPattern,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

describe( 'adding blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should insert a block pattern', async () => {
		await insertPattern( 'Two Buttons' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
