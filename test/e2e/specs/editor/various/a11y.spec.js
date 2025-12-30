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
		editor,
	} ) => {
		// To do: run with iframe.
		await editor.switchToLegacyCanvas();

		// On a new post, initial focus is set on the Post title.
		await expect(
			page.locator( 'role=textbox[name=/Add title/i]' )
		).toBeFocused();
		// Navigate to the 'Editor settings' region.
		await pageUtils.pressKeys( 'ctrl+`' );
		// Navigate to the 'Editor publish' region.
		await pageUtils.pressKeys( 'ctrl+`' );
		// Navigate to the 'Editor footer' region.
		await pageUtils.pressKeys( 'ctrl+`' );
		// Navigate to the 'Editor top bar' region.
		await pageUtils.pressKeys( 'ctrl+`' );

		// This test assumes the Editor is not in Fullscreen mode. Check the
		// first tabbable element within the 'Editor top bar' region is the
		// 'Block Inserter' button.
		await pageUtils.pressKeys( 'Tab' );
		await expect(
			page.locator( 'role=button[name=/Block Inserter/i]' )
		).toBeFocused();
	} );

	test( 'should constrain tabbing within a modal', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		// To do: run with iframe.
		await editor.switchToLegacyCanvas();

		// Open keyboard shortcuts modal.
		await pageUtils.pressKeys( 'access+h' );

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
		await pageUtils.pressKeys( 'Tab' );
		await expect( modalContent ).toBeFocused();

		await pageUtils.pressKeys( 'Tab' );
		await expect( closeButton ).toBeFocused();

		await pageUtils.pressKeys( 'Tab' );
		await expect( modalContent ).toBeFocused();
	} );

	test( 'should return focus to the first tabbable in a modal after blurring a tabbable', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.pressKeys( 'access+h' );

		// Click a non-focusable element after the last tabbable within the modal.
		const last = page
			.locator( 'role=dialog[name="Keyboard shortcuts"i] >> div' )
			.last();
		await last.click();

		await pageUtils.pressKeys( 'Tab' );

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
		await pageUtils.pressKeys( 'access+h' );

		// Click a non-focusable element before the first tabbable within the modal.
		await page.click( 'role=heading[name="Keyboard shortcuts"i]' );

		await pageUtils.pressKeys( 'shift+Tab' );

		await expect(
			page.locator(
				'role=dialog[name="Keyboard shortcuts"i] >> role=button[name="Close"i]'
			)
		).toBeFocused();
	} );

	test( 'should make the modal content focusable when it is scrollable', async ( {
		page,
		pageUtils,
		browserName,
	} ) => {
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(
			browserName === 'webkit',
			'Known bug with focus order in Safari.'
		);

		// Note: this test depends on a particular viewport height to determine whether or not
		// the modal content is scrollable. If this tests fails and needs to be debugged locally,
		// double-check the viewport height when running locally versus in CI. Additionally,
		// when adding or removing items from the preference menu, this test may need to be updated
		// if the height of panels has changed. It would be good to find a more robust way to test
		// this behavior.

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
		const accessibilityTab = preferencesModal.locator(
			'role=tab[name="Accessibility"i]'
		);
		const blocksTab = preferencesModal.locator(
			'role=tab[name="Blocks"i]'
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

		// The Accessibility tab is currently short and not scrollable.
		// Check that it cannot be focused by tabbing. Note: this test depends
		// on a particular viewport height to determine whether or not the
		// modal content is scrollable. If additional Accessibility options are
		// added, then eventually this test will fail.
		// TODO: find a more robust way to test this behavior.
		await clickAndFocusTab( generalTab );
		// Navigate down to the Accessibility tab.
		await pageUtils.pressKeys( 'ArrowDown', { times: 2 } );
		// Check the Accessibility tab panel is visible.
		await expect(
			preferencesModal.locator( 'role=tabpanel[name="Accessibility"i]' )
		).toBeVisible();
		await expect( accessibilityTab ).toBeFocused();
		await pageUtils.pressKeys( 'Shift+Tab' );
		await expect( closeButton ).toBeFocused();
		await pageUtils.pressKeys( 'Shift+Tab' );
		await expect( preferencesModalContent ).not.toBeFocused();

		// The Blocks tab panel content is long and scrollable.
		// Check it's focusable.
		await clickAndFocusTab( blocksTab );
		// Explicitly wait for the modal content to be attached with certain attributes.
		// This is necessary for solving a flaky result where Playwright runs too fast
		// before DOM catching up.
		await expect( preferencesModalContent ).toHaveAttribute(
			'tabindex',
			'0'
		);
		await pageUtils.pressKeys( 'Shift+Tab' );
		await expect( closeButton ).toBeFocused();
		await pageUtils.pressKeys( 'Shift+Tab' );
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
		await pageUtils.pressKeys( 'Shift+Tab' );
		await expect( closeButton ).toBeFocused();
		await pageUtils.pressKeys( 'Shift+Tab' );
		await expect( preferencesModalContent ).not.toBeFocused();
	} );
} );
