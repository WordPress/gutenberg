/**
 * WordPress dependencies
 */
import { createNewPost } from '@wordpress/e2e-test-utils';

describe( 'preferences', () => {
	beforeAll( async () => {
		await createNewPost();
	} );

	/**
	 * Returns a promise which resolves to the text content of the active
	 * editor sidebar title, or null if there is no active sidebar.
	 *
	 * @return {Promise} Promise resolving to active sidebar title or null.
	 */
	async function getActiveSidebarTitle() {
		try {
			return await page.$eval(
				'.edit-post-sidebar > .interface-complementary-area-header > strong',
				( node ) => node.textContent
			);
		} catch ( error ) {
			// page.$eval throws when it does not find the selector, which we
			// can intentionally intercept and consider as there being no
			// active sidebar tab (no sidebar).
			return null;
		}
	}

	it( 'remembers sidebar dismissal between sessions', async () => {
		// Open by default.
		expect( await getActiveSidebarTitle() ).toBe( 'Block inspector' );

		// Dismiss
		await page.click(
			'.edit-post-sidebar .interface-complementary-area-header [aria-label="Close block inspector"]'
		);
		expect( await getActiveSidebarTitle() ).toBe( null );

		// Remember after reload.
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );
		expect( await getActiveSidebarTitle() ).toBe( null );
	} );
} );
