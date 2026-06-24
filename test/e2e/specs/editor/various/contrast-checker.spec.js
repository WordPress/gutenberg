/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Per-context warning messages rendered inside the color popover's notice.
const TEXT_CONTRAST_WARNING =
	'This color has poor contrast against the background.';
const BACKGROUND_CONTRAST_WARNING = 'This color combination has poor contrast.';
const LINK_CONTRAST_WARNING =
	'This link color has poor contrast against the background.';

// Selector for the icon-only "Low contrast" warning shown on a color
// control's toggle when its selection has insufficient contrast. It is the
// at-a-glance panel-level indicator (an icon button whose accessible name and
// tooltip are "Low contrast"); the full warning message is rendered inside the
// color popover.
const WARNING_SELECTOR =
	'.block-editor-panel-color-gradient-settings__contrast-warning';
// Selector for the full warning notice rendered within the color popover.
const POPOVER_NOTICE_SELECTOR =
	'.block-editor-panel-color-gradient-settings__contrast-notice';

test.describe( 'Contrast Checker', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should show warning in both the Typography and Background panels for insufficient contrast', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Black text on Black background' },
		} );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );

		// The icon-only "Low contrast" warning is shown on the affected color
		// control in each panel, visible without opening the popovers.
		const typographyWarning = typographyPanel.locator( WARNING_SELECTOR );
		const backgroundWarning = backgroundPanel.locator( WARNING_SELECTOR );

		// Set text color to black.
		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		// Close the text color popover before opening background.
		await textButton.click();

		// Open background color popover and set to black.
		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		// Close the background color popover.
		await backgroundButton.click();

		// The warning should appear on both color controls even with the
		// popovers closed, exposing its "Low contrast" accessible name.
		await expect( typographyWarning ).toBeVisible();
		await expect( backgroundWarning ).toBeVisible();
		await expect( typographyWarning ).toHaveAccessibleName(
			'Low contrast'
		);
		await expect( backgroundWarning ).toHaveAccessibleName(
			'Low contrast'
		);

		// The full warning message is shown inside the color popover.
		await textButton.click();
		await expect( page.locator( POPOVER_NOTICE_SELECTOR ) ).toContainText(
			TEXT_CONTRAST_WARNING
		);
		await textButton.click();
	} );

	test( 'should not show warning for sufficient contrast', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Black text on White background' },
		} );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );

		const typographyWarning = typographyPanel.locator( WARNING_SELECTOR );
		const backgroundWarning = backgroundPanel.locator( WARNING_SELECTOR );

		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();

		// Close the text color popover before opening background.
		await textButton.click();
		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'White' } ).click();
		await backgroundButton.click();

		// No warning should appear on either control — contrast is sufficient.
		await expect( typographyWarning ).toBeHidden();
		await expect( backgroundWarning ).toBeHidden();
	} );

	test( 'should hide warning when contrast is fixed', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Text with poor contrast' },
		} );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );

		const typographyWarning = typographyPanel.locator( WARNING_SELECTOR );
		const backgroundWarning = backgroundPanel.locator( WARNING_SELECTOR );

		// Set poor contrast: black text on black background.
		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await textButton.click();

		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();

		// Verify the warning appears on both color controls.
		await expect( typographyWarning ).toBeVisible();
		await expect( backgroundWarning ).toBeVisible();

		// Fix contrast: change background to white while popover is still open.
		await page.getByRole( 'option', { name: 'White' } ).click();

		// Verify the warning disappears once contrast is sufficient.
		await expect( typographyWarning ).toBeHidden();
		await expect( backgroundWarning ).toBeHidden();

		await backgroundButton.click();
	} );

	test( 'should show warning for insufficient contrast on buttons', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		// Insert a button block.
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Button text' );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const typographyWarning = typographyPanel.locator( WARNING_SELECTOR );
		const backgroundWarning = backgroundPanel.locator( WARNING_SELECTOR );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await textButton.click();

		// Set background to black (poor contrast with black text).
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await backgroundButton.click();

		// Verify the warning appears on both color controls.
		await expect( typographyWarning ).toBeVisible();
		await expect( backgroundWarning ).toBeVisible();

		// The full warning message is shown inside the color popover.
		await backgroundButton.click();
		await expect( page.locator( POPOVER_NOTICE_SELECTOR ) ).toContainText(
			BACKGROUND_CONTRAST_WARNING
		);
		await backgroundButton.click();
	} );

	test( 'should not show warning for sufficient contrast on buttons', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		// Insert a button block.
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Button text' );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const typographyWarning = typographyPanel.locator( WARNING_SELECTOR );
		const backgroundWarning = backgroundPanel.locator( WARNING_SELECTOR );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await textButton.click();

		// Set background to white (good contrast with black text).
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'White' } ).click();
		await backgroundButton.click();

		// No warning should appear on either control — contrast is sufficient.
		await expect( typographyWarning ).toBeHidden();
		await expect( backgroundWarning ).toBeHidden();
	} );

	test( 'should show warning for insufficient link color contrast in the Elements panel', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		// A paragraph containing a link exercises the Elements-panel Link
		// control, whose link-only contrast check (against the background) is
		// not covered by the Typography or Background panels. The rendered
		// `<a>` is required for the contrast check to read a link color.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content:
					'Text with a <a href="https://wordpress.org">link</a>.',
			},
		} );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const elementsPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Elements' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const linkWarning = elementsPanel.locator( WARNING_SELECTOR );

		// The Link control is hidden by default; enable it via the Elements
		// panel options menu.
		await elementsPanel
			.getByRole( 'button', { name: 'Elements options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Link' } )
			.click();
		await elementsPanel
			.getByRole( 'button', { name: 'Elements options' } )
			.click();

		// Set the link color to black.
		const linkButton = elementsPanel.getByRole( 'button', {
			name: 'Link',
			exact: true,
		} );
		await expect( linkButton ).toBeVisible();
		await linkButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await linkButton.click();

		// Set the background to black (poor contrast with the black link).
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await backgroundButton.click();

		// The icon-only "Low contrast" warning is shown on the Link control.
		await expect( linkWarning ).toBeVisible();

		// The full, link-specific warning message is shown inside the popover.
		await linkButton.click();
		await expect( page.locator( POPOVER_NOTICE_SELECTOR ) ).toContainText(
			LINK_CONTRAST_WARNING
		);
		await linkButton.click();
	} );
} );
