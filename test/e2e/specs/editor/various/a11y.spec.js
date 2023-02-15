/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	// Make the viewport tall enough so that some tabs panels within the
	// Preferences modal are not scrollable and other tab panels are.
	viewport: {
		width: 1280,
		height: 1024,
	},
} );

test.describe( 'a11y (@firefox, @webkit)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'navigating through the Editor regions four times should land on the Editor top bar region', async ( {
		page,
		pageUtils,
	} ) => {
		// On a new post, initial focus is set on the Post title.
		await expect(
			page.locator( 'role=textbox[name=/Add title/i]' )
		).toBeFocused();
		// Navigate to the 'Editor settings' region.
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );
		// Navigate to the 'Editor publish' region.
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );
		// Navigate to the 'Editor footer' region.
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );
		// Navigate to the 'Editor top bar' region.
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );

		// This test assumes the Editor is not in Fullscreen mode. Check the
		// first tabbable element within the 'Editor top bar' region is the
		// 'Toggle block inserter' button.
		await page.keyboard.press( 'Tab' );
		await expect(
			page.locator( 'role=button[name=/Toggle block inserter/i]' )
		).toBeFocused();
	} );

	test( 'should constrain tabbing within a modal', async ( {
		page,
		pageUtils,
	} ) => {
		// Open keyboard shortcuts modal.
		await pageUtils.pressKeyWithModifier( 'access', 'h' );

		const modalContent = page.locator(
			'role=dialog[name="Keyboard shortcuts"i] >> role=document'
		);

		const closeButton = page.locator(
			'role=dialog[name="Keyboard shortcuts"i] >> role=button[name="Close"i]'
		);
		// The close button should not be focused by default; this is a strange UX
		// experience.
		// See: https://github.com/WordPress/gutenberg/issues/9410
		await expect( closeButton ).not.toBeFocused();

		// Open keyboard shortcuts modal.
		await page.keyboard.press( 'Tab' );
		await expect( modalContent ).toBeFocused();

		await page.keyboard.press( 'Tab' );
		await expect( closeButton ).toBeFocused();

		await page.keyboard.press( 'Tab' );
		await expect( modalContent ).toBeFocused();
	} );

	test( 'should return focus to the first tabbable in a modal after blurring a tabbable', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.pressKeyWithModifier( 'access', 'h' );

		// Click a non-focusable element after the last tabbable within the modal.
		const last = page
			.locator( 'role=dialog[name="Keyboard shortcuts"i] >> div' )
			.last();
		await last.click();

		await page.keyboard.press( 'Tab' );

		await expect(
			page.locator(
				'role=dialog[name="Keyboard shortcuts"i] >> role=button[name="Close"i]'
			)
		).toBeFocused();
	} );

	test( 'should return focus to the last tabbable in a modal after blurring a tabbable and tabbing in reverse direction', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.pressKeyWithModifier( 'access', 'h' );

		// Click a non-focusable element before the first tabbable within the modal.
		await page.click( 'role=heading[name="Keyboard shortcuts"i]' );

		await pageUtils.pressKeyWithModifier( 'shift', 'Tab' );

		await expect(
			page.locator(
				'role=dialog[name="Keyboard shortcuts"i] >> role=button[name="Close"i]'
			)
		).toBeFocused();
	} );

	test( 'should make the modal content focusable when it is scrollable', async ( {
		page,
	} ) => {
		// Open the top bar Options menu.
		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
		);

		// Open the Preferences modal.
		await page.click(
			'role=menu[name="Options"i] >> role=menuitem[name="Preferences"i]'
		);

		const preferencesModal = page.locator(
			'role=dialog[name="Preferences"i]'
		);
		const preferencesModalContent =
			preferencesModal.locator( 'role=document' );
		const closeButton = preferencesModal.locator(
			'role=button[name="Close"i]'
		);
		const generalTab = preferencesModal.locator(
			'role=tab[name="General"i]'
		);
		const blocksTab = preferencesModal.locator(
			'role=tab[name="Blocks"i]'
		);
		const panelsTab = preferencesModal.locator(
			'role=tab[name="Panels"i]'
		);

		// Check initial focus is on the modal dialog container.
		await expect( preferencesModal ).toBeFocused();

		// Check the General tab panel is visible by default.
		await expect(
			preferencesModal.locator( 'role=tabpanel[name="General"i]' )
		).toBeVisible();

		async function clickAndFocusTab( tab ) {
			// Some browsers, e.g. Safari, don't set focus after a click. We need
			// to ensure focus is set to start tabbing from a predictable place
			// in the UI. This isn't part of the user flow we want to test.
			await tab.click();
			await tab.focus();
		}

		// The General tab panel content is short and not scrollable.
		// Check it's not focusable.
		await clickAndFocusTab( generalTab );
		await page.keyboard.press( 'Shift+Tab' );
		await expect( closeButton ).toBeFocused();
		await page.keyboard.press( 'Shift+Tab' );
		await expect( preferencesModalContent ).not.toBeFocused();

		// The Blocks tab panel content is long and scrollable.
		// Check it's focusable.
		await clickAndFocusTab( blocksTab );
		await page.keyboard.press( 'Shift+Tab' );
		await expect( closeButton ).toBeFocused();
		await page.keyboard.press( 'Shift+Tab' );
		await expect( preferencesModalContent ).toBeFocused();

		// Make the Blocks tab panel content shorter by searching for a block
		// that doesn't exist. The content only shows 'No blocks found' and it's
		// not scrollable any longer. Check it's not focusable.
		await clickAndFocusTab( blocksTab );
		await page.type(
			'role=searchbox[name="Search for a block"i]',
			'qwerty'
		);
		await clickAndFocusTab( blocksTab );
		await page.keyboard.press( 'Shift+Tab' );
		await expect( closeButton ).toBeFocused();
		await page.keyboard.press( 'Shift+Tab' );
		await expect( preferencesModalContent ).not.toBeFocused();

		// The Panels tab panel content is short and not scrollable.
		// Check it's not focusable.
		await clickAndFocusTab( panelsTab );
		await page.keyboard.press( 'Shift+Tab' );
		await expect( closeButton ).toBeFocused();
		await page.keyboard.press( 'Shift+Tab' );
		await expect( preferencesModalContent ).not.toBeFocused();
	} );
} );
