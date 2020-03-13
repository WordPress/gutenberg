/**
 * WordPress dependencies
 */
import { createNewPost, saveDraft } from '@wordpress/e2e-test-utils';

describe( 'capabilities', () => {
	// Purpose: These tests verify sufficient accommodations for users based on
	// their user role and corresponding capabilities. For example, if a user
	// does not have permission to upload files, any UI interactions where an
	// upload would take place should make affordances for that user. The tests
	// verify the existence of such affordances.
	//
	// See: https://wordpress.org/support/article/roles-and-capabilities/
	//
	// Note: There is only value in these tests if they are run under users of
	// different roles and capabiliities. As an example, refer to the `E2E_ROLE`
	// environment variable in Gutenberg's Travis configuration.
	//
	// See: https://github.com/WordPress/gutenberg/blob/42d2b36/.travis.yml#L97-L100

	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should retain title escaping exactly as the user entered', async () => {
		// See: https://github.com/WordPress/gutenberg/issues/20490

		await page.type( '.editor-post-title__input', 'A & B &amp; C' );

		const getTitleValue = () =>
			page.$eval(
				'.editor-post-title__input',
				( input ) => input.textContent
			);

		// Verify that no unescaping occurred.
		expect( await getTitleValue() ).toBe( 'A & B &amp; C' );

		// Save draft, and verify that no escaping or unescaping occurred.
		await saveDraft();
		expect( await getTitleValue() ).toBe( 'A & B &amp; C' );

		// Reload the page, and verify that no escaping or unescaping occurred.
		await page.reload();
		expect( await getTitleValue() ).toBe( 'A & B &amp; C' );
	} );
} );
