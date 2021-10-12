/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertPattern,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

describe( 'adding patterns', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should insert a block pattern', async () => {
		await insertPattern( 'Social links with a shared background color' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
