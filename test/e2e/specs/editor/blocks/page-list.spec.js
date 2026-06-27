/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Page List block', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
	} );

	test( 'renders HTML formatting and entities in page titles', async ( {
		editor,
		admin,
		requestUtils,
	} ) => {
		// Create a page with both HTML formatting and entities in the title
		await requestUtils.createPage( {
			title: '<strong>Bold &"qwerty"—</strong>',
			status: 'publish',
		} );

		// Insert Page List block directly
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/page-list' } );

		// Wait for Page List block to be visible
		const pageListBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Page List',
		} );

		await expect( pageListBlock ).toBeVisible( {
			// Wait for the Page List block API request to resolve.
			timeout: 10000,
		} );

		// Locate the page list item
		const pageItems = pageListBlock.locator( 'li' );

		// Wait for Page List to load pages
		await pageItems.first().waitFor( { state: 'visible' } );

		// Find the link element - try to find by text content
		const links = pageListBlock.locator( 'a' );
		const linkCount = await links.count();
		expect( linkCount ).toBeGreaterThan( 0 );

		// Find the link that contains our test page title
		let link = null;
		for ( let i = 0; i < linkCount; i++ ) {
			const currentLink = links.nth( i );
			const text = await currentLink.textContent();
			if (
				text &&
				( text.includes( 'qwerty' ) || text.includes( 'Bold' ) )
			) {
				link = currentLink;
				break;
			}
		}

		expect( link ).not.toBeNull();
		await expect( link ).toBeVisible();

		// Verify text content shows decoded text (not raw HTML or entity codes)
		const textContent = await link.textContent();
		expect( textContent ).toContain( 'Bold' );
		expect( textContent ).toContain( 'qwerty' );
		// Verify HTML tags are not shown as raw markup
		expect( textContent ).not.toContain( '<strong>' );
		expect( textContent ).not.toContain( '</strong>' );
		// Verify entity codes are not shown as raw codes
		expect( textContent ).not.toContain( '&amp;' );
		expect( textContent ).not.toContain( '&quot;' );
		expect( textContent ).not.toContain( '&mdash;' );

		// Verify HTML is rendered (check for strong tag)
		const strongElement = link.locator( 'css=strong' );
		await expect( strongElement ).toBeVisible();
		await expect( strongElement ).toContainText( 'Bold' );
		await expect( strongElement ).toContainText( 'qwerty' );

		// Verify innerHTML contains the strong tag (not escaped)
		const innerHTML = await link.innerHTML();
		expect( innerHTML ).toContain( '<strong>' );
		expect( innerHTML ).toContain( '</strong>' );
		// Ensure it's not showing raw HTML as text
		expect( innerHTML ).not.toContain( '&lt;strong&gt;' );
		expect( innerHTML ).not.toContain( '&lt;/strong&gt;' );
	} );

	test( 'does not crash when a page record has no title', async ( {
		editor,
		admin,
		page,
		requestUtils,
	} ) => {
		// Two published pages so the alphabetical title tie-break runs (pages
		// default to menu_order 0).
		const { id: pageId } = await requestUtils.createPage( {
			title: 'Alpha',
			status: 'publish',
		} );
		await requestUtils.createPage( { title: 'Beta', status: 'publish' } );

		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/page-list' } );

		const pageListBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Page List',
		} );
		const alphaItem = pageListBlock.getByText( 'Alpha', { exact: true } );
		await expect( alphaItem ).toBeVisible( { timeout: 10000 } );

		// Drop the title from a page record, reproducing a partial record that
		// reached the store without its title field. An empty title renders fine;
		// an undefined title is what trips the sort comparator.
		await page.evaluate( ( id ) => {
			window.wp.data
				.dispatch( 'core' )
				.receiveEntityRecords( 'postType', 'page', [
					{ id, title: undefined },
				] );
		}, pageId );

		// The mutation re-renders the block: the affected item falls back to the
		// localized "(no title)" label (matching the front end) — proving the
		// partial record reached it without leaking the literal string
		// "undefined" or falling into the error boundary.
		await expect( alphaItem ).toBeHidden();
		await expect(
			pageListBlock.getByText( '(no title)', { exact: true } )
		).toBeVisible();
		await expect( pageListBlock.getByText( 'undefined' ) ).toHaveCount( 0 );
		await expect(
			editor.canvas.getByText(
				'This block has encountered an error and cannot be previewed.'
			)
		).toBeHidden();
	} );
} );
