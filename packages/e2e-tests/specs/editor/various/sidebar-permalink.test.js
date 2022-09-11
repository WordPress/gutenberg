/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	publishPost,
} from '@wordpress/e2e-test-utils';

const urlButtonSelector = '*[aria-label^="Change URL"]';

// This tests are not together with the remaining sidebar tests,
// because we need to publish/save a post, to correctly test the permalink row.
// The sidebar test suit enforces that focus is never lost, but during save operations
// the focus is lost and a new element is focused once the save is completed.
describe( 'Sidebar Permalink', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	it( 'should not render URL when post is publicly queryable but not public', async () => {
		await createNewPost( { postType: 'public_q_not_public' } );
		await page.keyboard.type( 'aaaaa' );
		await publishPost();
		// Start editing again.
		await page.type( '.editor-post-title__input', ' (Updated)' );
		expect( await page.$( urlButtonSelector ) ).toBeNull();
	} );

	it( 'should not render URL when post is public but not publicly queryable', async () => {
		await createNewPost( { postType: 'not_public_q_public' } );
		await page.keyboard.type( 'aaaaa' );
		await publishPost();
		// Start editing again.
		await page.type( '.editor-post-title__input', ' (Updated)' );
		expect( await page.$( urlButtonSelector ) ).toBeNull();
	} );

	it( 'should render URL when post is public and publicly queryable', async () => {
		await createNewPost( { postType: 'public_q_public' } );
		await page.keyboard.type( 'aaaaa' );
		await publishPost();
		// Start editing again.
		await page.type( '.editor-post-title__input', ' (Updated)' );
		expect( await page.$( urlButtonSelector ) ).not.toBeNull();
	} );
} );
