/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Sidebar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// The test expects clean user preferences.
		await requestUtils.resetPreferences();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should have sidebar visible at the start with document sidebar active on desktop', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.setBrowserViewport( 'large' );

		const activeTab = page
			.getByRole( 'region', {
				name: 'Editor settings',
			} )
			.getByRole( 'tab', { selected: true } );

		await expect( activeTab ).toBeVisible();
		await expect( activeTab ).toHaveText( 'Post' );
	} );

	test( 'should have the sidebar closed by default on mobile', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.setBrowserViewport( 'small' );

		await expect(
			page.getByRole( 'region', {
				name: 'Editor settings',
			} )
		).toBeHidden();
	} );

	test( 'should close the sidebar when resizing from desktop to mobile', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.setBrowserViewport( 'large' );
		const settingsSideber = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await expect( settingsSideber ).toBeVisible();

		await pageUtils.setBrowserViewport( 'small' );

		// Sidebar should be closed when resizing to mobile.
		await expect( settingsSideber ).toBeHidden();
	} );

	test( 'should reopen sidebar the sidebar when resizing from mobile to desktop if the sidebar was closed automatically', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.setBrowserViewport( 'large' );
		await pageUtils.setBrowserViewport( 'small' );
		const settingsSideber = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await expect( settingsSideber ).toBeHidden();
		await pageUtils.setBrowserViewport( 'large' );
		await expect( settingsSideber ).toBeVisible();
	} );

	test( 'should preserve tab order while changing active tab', async ( {
		page,
		pageUtils,
	} ) => {
		// Region navigate to Sidebar.
		await pageUtils.pressKeys( 'ctrl+`' );

		// Tab lands at first (presumed selected) option "Post".
		await page.keyboard.press( 'Tab' );

		const activeTab = page
			.getByRole( 'region', {
				name: 'Editor settings',
			} )
			.getByRole( 'tab', { selected: true } );

		// The Post tab should be focused and selected.
		await expect( activeTab ).toHaveText( 'Post' );
		await expect( activeTab ).toBeFocused();

		// Arrow key into and activate "Block".
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Space' );

		// The Block tab should be focused and selected.
		await expect( activeTab ).toHaveText( 'Block' );
		await expect( activeTab ).toBeFocused();
	} );

	test( 'should be possible to programmatically remove Document Settings panels', async ( {
		page,
	} ) => {
		const documentSettingsPanels = page
			.getByRole( 'tabpanel', { name: 'Post' } )
			.getByRole( 'heading', { level: 2 } );

		await expect( documentSettingsPanels ).toHaveText( [
			'No title',
			'Categories',
			'Tags',
		] );
		// Also check 'panels' that are not rendered as TabPanels.
		const postExcerptPanel = page.getByRole( 'button', {
			name: 'Add an excerpt…',
		} );
		const postFeaturedImagePanel = page.getByRole( 'button', {
			name: 'Set featured image',
		} );
		const postDiscussionPanel = page.getByRole( 'button', {
			name: 'Change discussion options',
		} );
		const postAuthorPanel = page.getByRole( 'button', {
			name: 'admin',
		} );

		await expect( postExcerptPanel ).toBeVisible();
		await expect( postFeaturedImagePanel ).toBeVisible();
		await expect( postAuthorPanel ).toBeVisible();
		await expect( postDiscussionPanel ).toHaveCount( 1 );

		await page.evaluate( () => {
			const { removeEditorPanel } =
				window.wp.data.dispatch( 'core/editor' );

			removeEditorPanel( 'taxonomy-panel-category' );
			removeEditorPanel( 'taxonomy-panel-post_tag' );
			removeEditorPanel( 'featured-image' );
			removeEditorPanel( 'post-excerpt' );
			removeEditorPanel( 'discussion-panel' );
			removeEditorPanel( 'post-status' );
		} );

		await expect( documentSettingsPanels ).toHaveCount( 1 );
		await expect( postExcerptPanel ).toBeHidden();
		await expect( postFeaturedImagePanel ).toBeHidden();
		await expect( postAuthorPanel ).toBeHidden();
		await expect( postDiscussionPanel ).toHaveCount( 0 );
	} );
} );
