/**
 * WordPress dependencies
 */
import {
	activateTheme,
	createNewPost,
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
	it( 'Pagination links are working as expected', async () => {
		await insertBlock( 'Comments Query Loop' );
		// To implement
	} );
	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
		await setOption( 'page_comments', false, 'options-discussion.php' );
		await setOption( 'comments_per_page', '50', 'options-discussion.php' );
	} );
} );
