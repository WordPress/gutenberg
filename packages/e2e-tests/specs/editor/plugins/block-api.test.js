/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Using Block API', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-block-api' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-block-api' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	test( 'Inserts the filtered hello world block even when filter added after block registration', async () => {
		await insertBlock( 'Filtered Hello World' );

		const blockContent = await page.$eval(
			'div[data-type="e2e-tests/hello-world"]',
			( element ) => element.textContent
		);
		expect( blockContent ).toEqual( 'Hello Editor!' );
	} );
} );
