const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS } = require( './utils' );

/*
 * Mirrors the 'should be possible to programmatically remove Document Settings
 * panels' test of `test/e2e/specs/editor/various/sidebar.spec.js` with the
 * DataForm inspector experiment enabled; delete that test there when the
 * experiment graduates. The other tests of that classic file don't drive the
 * summary and stay where they are.
 */
test.describe( 'Sidebar (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// The test expects clean user preferences.
		await requestUtils.resetPreferences();
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
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
			name: 'Edit Excerpt',
		} );
		const postFeaturedImagePanel = page.getByRole( 'button', {
			name: 'Set featured image',
		} );
		const postDiscussionPanel = page.getByRole( 'button', {
			name: 'Edit Discussion',
		} );
		const postAuthorPanel = page.getByRole( 'button', {
			name: 'Edit Author',
		} );

		await expect( postExcerptPanel ).toBeVisible();
		await expect( postFeaturedImagePanel ).toBeVisible();
		await expect( postAuthorPanel ).toBeVisible();
		// The description also carries the alt text of the author's avatar.
		await expect( postAuthorPanel ).toHaveAccessibleDescription( /admin$/ );
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
