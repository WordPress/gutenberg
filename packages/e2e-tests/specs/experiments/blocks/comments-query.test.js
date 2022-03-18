/**
 * WordPress dependencies
 */
import {
	insertBlock,
	createNewPost,
	activateTheme,
	getEditedPostContent,
	clickBlockAppender,
} from '@wordpress/e2e-test-utils';
/**
 * WordPress dependencies
 */

// It might make sense to include a similar test in WP core (or move this one over).
// See discussion here: https://github.com/WordPress/gutenberg/pull/32797#issuecomment-864192088.
describe( 'Comment Query Loop', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		// await setOption( 'page_comments', true, 'options-discussion.php' );
		await createNewPost();
	} );
	it( 'Comment Query block insertion', async () => {
		// We won't select the option that we updated and will also remove some
		// _transient options that seem to change at every update.
		await insertBlock( 'Comments Query Loop' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
	it( 'can be created by typing "/comment query loop"', async () => {
		// Create a list with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/comments query loop' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Comments Query Loop')]`
		);
		await page.keyboard.press( 'Enter' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );
} );
