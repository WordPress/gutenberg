/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	editorNavigationUtils: async ( { page, pageUtils }, use ) => {
		await use( new EditorNavigationUtils( { page, pageUtils } ) );
	},
} );

test.describe( 'Site editor navigation', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Can use keyboard to navigate the site editor', async ( {
		admin,
		editorNavigationUtils,
		page,
		pageUtils,
	} ) => {
		await admin.visitSiteEditor();

		// Test: Can navigate to a sidebar item and into its subnavigation frame without losing focus
		// Go to the Pages button

		await editorNavigationUtils.tabToLabel( 'Pages' );

		await expect(
			page.getByRole( 'button', { name: 'Pages' } )
		).toBeFocused();
		await pageUtils.pressKeys( 'Enter' );
		// We should be in the Pages sidebar
		await expect(
			page.getByRole( 'button', { name: 'Back', exact: true } )
		).toBeFocused();
		await pageUtils.pressKeys( 'Enter' );
		// Go back to the main navigation
		await expect(
			page.getByRole( 'button', { name: 'Pages' } )
		).toBeFocused();

		// Navigate to the Saved button first, as it precedes the editor iframe.
		await editorNavigationUtils.tabToLabel( 'Saved' );
		const savedButton = page.getByRole( 'button', {
			name: 'Saved',
		} );
		await expect( savedButton ).toBeFocused();

		// Get the iframe when it has a role=button and Edit label.
		const editorCanvasRegion = page.getByRole( 'region', {
			name: 'Editor content',
		} );
		const editorCanvasButton = editorCanvasRegion.getByRole( 'button', {
			name: 'Edit',
		} );

		// Test that there are no tab stops between the Saved button and the
		// focusable iframe with role=button.
		await pageUtils.pressKeys( 'Tab' );
		await expect( editorCanvasButton ).toBeFocused();

		// Tab to the Pages item to move focus back in the UI.
		await editorNavigationUtils.tabToLabel( 'Pages' );
		await expect(
			page.getByRole( 'button', { name: 'Pages' } )
		).toBeFocused();

		// Test again can navigate into the iframe using the keyboard.
		await editorNavigationUtils.tabToLabel( 'Edit' );

		// Enter into the site editor frame
		await pageUtils.pressKeys( 'Enter' );
		// Focus should be on the iframe without the button role
		await expect(
			page.locator( 'iframe[name="editor-canvas"]' )
		).toBeFocused();
		// The button role should have been removed from the iframe.
		await expect( editorCanvasButton ).toBeHidden();

		// Test to make sure a Tab keypress works as expected.
		// As of this writing, we are in select mode and a tab
		// keypress will reveal the header template select mode
		// button. This test is not documenting that we _want_
		// that action, but checking that we are within the site
		// editor and keypresses work as intened.
		await pageUtils.pressKeys( 'Tab' );
		await expect(
			page.getByRole( 'button', {
				name: 'Template Part Block. Row 1. header',
			} )
		).toBeFocused();

		// Test: We can go back to the main navigation from the editor frame
		// Move to the document toolbar
		await pageUtils.pressKeys( 'alt+F10' );
		// Go to the open navigation button
		await pageUtils.pressKeys( 'shift+Tab' );

		// Open the sidebar again
		await expect(
			page.getByRole( 'button', {
				name: 'Open Navigation',
				exact: true,
			} )
		).toBeFocused();
		await pageUtils.pressKeys( 'Enter' );

		await expect(
			page.getByLabel( 'Go to the Dashboard' ).first()
		).toBeFocused();
		// We should have our editor canvas button back
		await expect( editorCanvasButton ).toBeVisible();
	} );
} );

class EditorNavigationUtils {
	constructor( { page, pageUtils } ) {
		this.page = page;
		this.pageUtils = pageUtils;
	}

	async tabToLabel( label, times = 10 ) {
		for ( let i = 0; i < times; i++ ) {
			await this.pageUtils.pressKeys( 'Tab' );
			const activeLabel = await this.page.evaluate( () => {
				return (
					document.activeElement.getAttribute( 'aria-label' ) ||
					document.activeElement.textContent
				);
			} );
			if ( activeLabel === label ) {
				return;
			}
		}
	}
}
