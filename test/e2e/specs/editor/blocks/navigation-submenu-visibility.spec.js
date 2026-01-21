/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation block - Submenu Visibility', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test.beforeEach( async ( { admin, editor, requestUtils } ) => {
		await admin.createNewPost();

		// Create a menu with a submenu for testing
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Test Menu with Submenu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"#"} /-->' +
				'<!-- wp:navigation-submenu {"label":"About"} -->' +
				'<!-- wp:navigation-link {"label":"Team","url":"#"} /-->' +
				'<!-- wp:navigation-link {"label":"Contact","url":"#"} /-->' +
				'<!-- /wp:navigation-submenu -->',
		} );

		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: {
				ref: menu.id,
			},
		} );

		// Wait for navigation block to be visible
		const navBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect( navBlock ).toBeVisible();
		await editor.selectBlocks( navBlock );
	} );

	test( 'Always option does not show on horizontal orientation and does show on vertical', async ( {
		editor,
		page,
	} ) => {
		await test.step( 'Open settings sidebar', async () => {
			await editor.openDocumentSettingsSidebar();

			// Click the Settings tab button
			const settingsTab = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tab', { name: 'Settings' } );
			await settingsTab.click();
		} );

		await test.step( 'Verify Always option is not visible with horizontal orientation', async () => {
			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			// Look for the Submenu Visibility radiogroup
			const submenuVisibilityGroup = settingsPanel.getByRole(
				'radiogroup',
				{
					name: 'Submenu Visibility',
				}
			);

			// The "Always" option should not be visible when orientation is horizontal
			const alwaysOption = submenuVisibilityGroup.getByRole( 'radio', {
				name: 'Always',
			} );

			await expect( alwaysOption ).toBeHidden();
		} );

		await test.step( 'Switch to vertical orientation', async () => {
			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			// Select vertical orientation - it's a radio button in the settings
			const verticalOption = settingsPanel.getByRole( 'radio', {
				name: 'Vertical',
			} );
			await verticalOption.click();
		} );

		await test.step( 'Verify Always option is now visible with vertical orientation', async () => {
			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			// Look for the Submenu Visibility radiogroup
			const submenuVisibilityGroup = settingsPanel.getByRole(
				'radiogroup',
				{
					name: 'Submenu Visibility',
				}
			);

			// The "Always" option should now be visible
			const alwaysOption = submenuVisibilityGroup.getByRole( 'radio', {
				name: 'Always',
			} );

			await expect( alwaysOption ).toBeVisible();
		} );
	} );

	test( 'Switching from Vertical + Always to Horizontal changes to Hover + Show Icons', async ( {
		editor,
		page,
	} ) => {
		await test.step( 'Open settings and switch to vertical orientation', async () => {
			await editor.openDocumentSettingsSidebar();

			// Click the Settings tab button
			const settingsTab = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tab', { name: 'Settings' } );
			await settingsTab.click();

			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			// Switch to vertical orientation
			const verticalOption = settingsPanel.getByRole( 'radio', {
				name: 'Vertical',
			} );
			await verticalOption.click();
		} );

		await test.step( 'Select Always submenu visibility', async () => {
			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			const submenuVisibilityGroup = settingsPanel.getByRole(
				'radiogroup',
				{
					name: 'Submenu Visibility',
				}
			);

			const alwaysOption = submenuVisibilityGroup.getByRole( 'radio', {
				name: 'Always',
			} );
			await alwaysOption.click();

			// Verify Always is selected
			await expect( alwaysOption ).toBeChecked();
		} );

		await test.step( 'Verify Show arrow checkbox is disabled when Always is selected', async () => {
			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			const showArrowCheckbox = settingsPanel.getByRole( 'checkbox', {
				name: 'Show arrow',
			} );

			// When Always is selected, Show arrow should be disabled and unchecked
			await expect( showArrowCheckbox ).toBeDisabled();
			await expect( showArrowCheckbox ).not.toBeChecked();
		} );

		await test.step( 'Switch back to horizontal orientation', async () => {
			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			const horizontalOption = settingsPanel.getByRole( 'radio', {
				name: 'Horizontal',
			} );
			await horizontalOption.click();
		} );

		await test.step( 'Verify submenu visibility changed to Hover', async () => {
			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			const submenuVisibilityGroup = settingsPanel.getByRole(
				'radiogroup',
				{
					name: 'Submenu Visibility',
				}
			);

			const hoverOption = submenuVisibilityGroup.getByRole( 'radio', {
				name: 'Hover',
			} );

			// Should automatically switch to Hover when switching to horizontal
			await expect( hoverOption ).toBeChecked();
		} );

		await test.step( 'Verify Show arrow checkbox is now enabled and checked', async () => {
			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			const showArrowCheckbox = settingsPanel.getByRole( 'checkbox', {
				name: 'Show arrow',
			} );

			// Should automatically enable and check Show arrow when switching away from Always
			await expect( showArrowCheckbox ).toBeEnabled();
			await expect( showArrowCheckbox ).toBeChecked();
		} );
	} );

	test( 'When Always is selected, submenus are visible on the page', async ( {
		editor,
		page,
	} ) => {
		await test.step( 'Switch to vertical orientation and select Always', async () => {
			await editor.openDocumentSettingsSidebar();

			// Click the Settings tab button
			const settingsTab = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tab', { name: 'Settings' } );
			await settingsTab.click();

			const settingsPanel = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			// Switch to vertical orientation
			const verticalOption = settingsPanel.getByRole( 'radio', {
				name: 'Vertical',
			} );
			await verticalOption.click();

			// Select Always from Submenu Visibility
			const submenuVisibilityGroup = settingsPanel.getByRole(
				'radiogroup',
				{
					name: 'Submenu Visibility',
				}
			);

			const alwaysOption = submenuVisibilityGroup.getByRole( 'radio', {
				name: 'Always',
			} );
			await alwaysOption.click();
		} );

		await test.step( 'Verify submenu child links are visible in canvas', async () => {
			// Find the submenu block
			const submenuBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Submenu',
			} );
			await expect( submenuBlock ).toBeVisible();

			// Find the child links within the submenu
			const teamLink = editor.canvas
				.getByRole( 'textbox', {
					name: 'Navigation link text',
				} )
				.filter( { hasText: 'Team' } );

			const contactLink = editor.canvas
				.getByRole( 'textbox', {
					name: 'Navigation link text',
				} )
				.filter( { hasText: 'Contact' } );

			// Both child links should be visible
			await expect( teamLink ).toBeVisible();
			await expect( contactLink ).toBeVisible();
		} );

		await test.step( 'Verify submenus are visible on frontend', async () => {
			const postId = await editor.publishPost();

			// Navigate to the frontend
			await page.goto( `/?p=${ postId }` );

			// Find the submenu container
			const submenu = page
				.locator( 'role=navigation' )
				.locator( 'ul.wp-block-navigation__submenu-container' );

			// Submenu should be visible without hover
			await expect( submenu ).toBeVisible();

			// Check that submenu items are visible
			const teamLink = page
				.locator( 'role=navigation' )
				.getByRole( 'link', { name: 'Team' } );
			const contactLink = page
				.locator( 'role=navigation' )
				.getByRole( 'link', { name: 'Contact' } );

			await expect( teamLink ).toBeVisible();
			await expect( contactLink ).toBeVisible();
		} );
	} );
} );
