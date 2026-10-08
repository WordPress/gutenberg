const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Meta boxes pane', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-meta-box-side-only'
		);
		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test( 'should not render the pane when there are no meta boxes', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost();

		await expect(
			page.getByRole( 'button', { name: 'Meta Boxes', exact: true } )
		).toBeHidden();
		await expect(
			page.getByRole( 'region', { name: 'Meta Boxes' } )
		).toBeHidden();
	} );

	test( 'should not render the pane when only side meta boxes are present', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-meta-box-side-only'
		);
		await admin.createNewPost();

		// The side meta box is rendered in the sidebar.
		await expect(
			page.getByRole( 'region', { name: 'Editor settings' } )
		).toContainText( 'Hello Side' );

		await expect(
			page.getByRole( 'button', { name: 'Meta Boxes', exact: true } )
		).toBeHidden();
		await expect(
			page.getByRole( 'region', { name: 'Meta Boxes' } )
		).toBeHidden();
	} );

	test( 'should render the pane when a normal meta box is present', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-meta-box' );
		await admin.createNewPost();

		await expect(
			page.getByRole( 'button', { name: 'Meta Boxes', exact: true } )
		).toBeVisible();
	} );

	test( 'should render the pane when normal and side meta boxes are present', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-meta-box' );
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-meta-box-side-only'
		);
		await admin.createNewPost();

		await expect(
			page.getByRole( 'button', { name: 'Meta Boxes', exact: true } )
		).toBeVisible();
	} );
} );
