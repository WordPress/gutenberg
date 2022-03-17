/**
 * WordPress dependencies
 */
import {
	insertBlock,
	setOption,
	createNewPost,
} from '@wordpress/e2e-test-utils';
/**
 * WordPress dependencies
 */

// It might make sense to include a similar test in WP core (or move this one over).
// See discussion here: https://github.com/WordPress/gutenberg/pull/32797#issuecomment-864192088.
describe( 'Comment Query Loop', () => {
	beforeAll( async () => {
		await setOption( 'page_comments', true, 'options-discussion.php' );
		await createNewPost();
	} );
	it( 'Comment Query block insertion', async () => {
		// We won't select the option that we updated and will also remove some
		// _transient options that seem to change at every update.
		await insertBlock( 'Comment Query' );
		await page.waitForSelector( '.wp-block-comments-query-loop' );
	} );
} );
