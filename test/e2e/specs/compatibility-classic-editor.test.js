/**
 * Internal dependencies
 */
import { newPost, insertBlock, publishPost } from '../support/utils';

describe( 'Compatibility with Classic Editor', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'Should not apply autop when rendering blocks', async () => {
		// Save should not be an option for new empty post.
		expect( await page.$( '.editor-post-save-draft' ) ).toBe( null );

		// Add title to enable valid non-empty post save.
		await insertBlock( 'Custom HTML' );
		await page.keyboard.type( '<a>' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Random Link' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '</a>' );
		await publishPost();

		// View the post.
		const viewPostLinks = await page.$x( "//a[contains(text(), 'View Post')]" );
		await viewPostLinks[ 0 ].click();
		await page.waitForNavigation();

		// Check the the dynamic block appears.
		const content = await page.$eval( '.entry-content', ( element ) => element.innerHTML );
		expect( content ).toMatchSnapshot();
	} );
} );
