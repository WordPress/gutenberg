/**
 * WordPress dependencies
 */
import {
	activateTheme,
	clickBlockAppender,
	createNewPost,
	getEditedPostContent,
	insertBlock,
	setOption,
} from '@wordpress/e2e-test-utils';

describe( 'Comment Query Loop', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await setOption( 'page_comments', true, 'options-discussion.php' );
		await setOption( 'comments_per_page', '2', 'options-discussion.php' );
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
		await setOption( 'page_comments', false, 'options-discussion.php' );
		await setOption( 'comments_per_page', '50', 'options-discussion.php' );
	} );
} );
