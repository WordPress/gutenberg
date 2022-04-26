/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	publishPost,
} from '@wordpress/e2e-test-utils';

describe( 'Compatibility with classic editor', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should not apply autop when rendering blocks', async () => {
		await insertBlock( 'Custom HTML' );
		await page.keyboard.type( '<a>' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Random Link' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '</a>' );
		await publishPost();

		// View the post.
		const viewPostLinks = await page.$x(
			"//a[contains(text(), 'View Post')]"
		);
		await viewPostLinks[ 0 ].click();
		await page.waitForNavigation();

		// Check the the content doesn't contain <p> tags.
		await page.waitForSelector( '.entry-content' );
		const content = await page.$eval( '.entry-content', ( element ) =>
			element.innerHTML.trim()
		);
		expect( content ).toMatchSnapshot();
	} );
} );
