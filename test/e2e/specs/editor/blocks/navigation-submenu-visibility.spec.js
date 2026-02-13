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

	test( 'Page List exposes submenu visibility UI when page-list is present', async ( {
		editor,
		page,
		admin,
		requestUtils,
	} ) => {
		// Create parent and child pages for testing
		const parentPage = await requestUtils.createPage( {
			title: 'Test Parent Page',
			status: 'publish',
		} );

		await requestUtils.createPage( {
			title: 'Test Child Page',
			status: 'publish',
			parent: parentPage.id,
		} );

		// Create a new post with navigation + page-list
		await admin.createNewPost();

		// Insert navigation block with page-list
		await editor.insertBlock( {
			name: 'core/navigation',
			innerBlocks: [
				{
					name: 'core/page-list',
				},
			],
		} );

		// Wait for navigation block to be visible
		const navBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect( navBlock ).toBeVisible();

		// Wait for page list to load
		const pageListBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Page List',
		} );
		await expect( pageListBlock ).toBeVisible( { timeout: 10000 } );

		// Select navigation block and check settings
		await editor.selectBlocks( navBlock );
		await editor.openDocumentSettingsSidebar();

		// Click the Settings tab
		const settingsTab = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tab', { name: 'Settings' } );
		await settingsTab.click();

		const settingsPanel = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tabpanel', { name: 'Settings' } );

		// Check if Submenu Visibility control exists
		const submenuVisibilityGroup = settingsPanel.getByRole( 'radiogroup', {
			name: 'Submenu Visibility',
		} );

		const isVisible = await submenuVisibilityGroup.isVisible();

		// FIXED: Submenu Visibility control now appears when navigation contains page-list
		// This allows users to control submenu behavior for hierarchical pages
		expect( isVisible ).toBe( true );

		// Clean up
		await requestUtils.deleteAllPages();
	} );
} );
