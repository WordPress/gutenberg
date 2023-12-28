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
	 * editor sidebar tab, or null if there is no active sidebar tab (closed).
	 *
	 * @return {Promise} Promise resolving to active tab.
	 */
	async function getActiveSidebarTabText() {
		try {
			return await page.$eval(
				'div[aria-label="Editor settings"] [role="tab"][aria-selected="true"]',
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
		const blockTab = await page.waitForXPath(
			`//button[@role="tab"][contains(text(), 'Block')]`
		);

		// Open by default.
		expect( await getActiveSidebarTabText() ).toBe( 'Post' );

		// Change to "Block" tab.
		await blockTab.click();
		expect( await getActiveSidebarTabText() ).toBe( 'Block' );

		// Regression test: Reload resets to document tab.
		//
		// See: https://github.com/WordPress/gutenberg/issues/6377
		// See: https://github.com/WordPress/gutenberg/pull/8995
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );
		expect( await getActiveSidebarTabText() ).toBe( 'Post' );

		// Dismiss.
		await page.click(
			'div[aria-label="Editor settings"] div[role="tablist"] + button[aria-label="Close Settings"]'
		);
		expect( await getActiveSidebarTabText() ).toBe( null );

		// Remember after reload.
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );
		expect( await getActiveSidebarTabText() ).toBe( null );
	} );
} );
