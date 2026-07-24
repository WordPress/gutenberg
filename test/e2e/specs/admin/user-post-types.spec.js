/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const CONTENT_TYPES_PAGE_QUERY = 'page=content-types-wp-admin&p=/post-types';
const POST_TYPES_REST_BASE = 'user-post-types';

async function createUserPostType( requestUtils ) {
	return requestUtils.createRecord( POST_TYPES_REST_BASE, {
		title: 'Books',
		slug: 'book',
		status: 'publish',
		config: {
			labels: { singular_name: 'Book' },
			public: true, // mirrors the form's Create defaults
		},
	} );
}

test.describe( 'User post types', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-content-types',
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts( POST_TYPES_REST_BASE );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'creates a post type and registers it', async ( { admin, page } ) => {
		await admin.visitAdminPage(
			SETTINGS_PAGE_PATH,
			CONTENT_TYPES_PAGE_QUERY
		);

		await page.getByRole( 'button', { name: 'Add post type' } ).click();

		await page
			.getByRole( 'textbox', { name: 'Plural label' } )
			.fill( 'Books' );
		await page
			.getByRole( 'textbox', { name: 'Singular label' } )
			.fill( 'Book' );
		// Focusing the slug field auto-fills it from the singular label and
		// kicks off the async draft-uniqueness check. The form's `isValid`
		// stays false while that's in flight, so wait for the REST call to
		// settle before submitting. See user-taxonomies.spec.js for the same
		// pattern.
		const slugField = page.getByRole( 'textbox', {
			name: 'Post type key',
		} );
		await Promise.all( [
			page.waitForResponse(
				( resp ) =>
					resp.url().includes( `/${ POST_TYPES_REST_BASE }` ) &&
					resp.url().includes( 'slug=book' )
			),
			slugField.focus(),
		] );
		await expect( slugField ).toHaveValue( 'book' );

		await page.getByRole( 'button', { name: 'Create' } ).click();

		await expect( page.getByTestId( 'snackbar' ) ).toContainText(
			'"Books" post type created.'
		);

		await admin.visitAdminPage( 'edit.php', 'post_type=book' );
		await expect(
			page.getByRole( 'heading', { level: 1, name: 'Books' } )
		).toBeVisible();
	} );

	test( 'deactivating unregisters the post type and activating re-registers it', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await createUserPostType( requestUtils );
		await admin.visitAdminPage(
			SETTINGS_PAGE_PATH,
			CONTENT_TYPES_PAGE_QUERY
		);

		await page
			.getByRole( 'row', { name: 'Books' } )
			.getByRole( 'button', { name: 'Actions' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Deactivate' } ).click();

		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			'Post type deactivated.'
		);
		await expect(
			page.getByRole( 'row', { name: 'Books' } ).getByText( 'Inactive' )
		).toBeVisible();

		// Unregistered post types cause WP core to wp_die with "Invalid post
		// type." when visiting their admin list URL.
		await admin.visitAdminPage( 'edit.php', 'post_type=book' );
		await expect( page.getByText( 'Invalid post type.' ) ).toBeVisible();

		await admin.visitAdminPage(
			SETTINGS_PAGE_PATH,
			CONTENT_TYPES_PAGE_QUERY
		);
		await page
			.getByRole( 'row', { name: 'Books' } )
			.getByRole( 'button', { name: 'Actions' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Activate' } ).click();

		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			'Post type activated.'
		);
		await expect(
			page.getByRole( 'row', { name: 'Books' } ).getByText( 'Active' )
		).toBeVisible();

		await admin.visitAdminPage( 'edit.php', 'post_type=book' );
		await expect(
			page.getByRole( 'heading', { level: 1, name: 'Books' } )
		).toBeVisible();
	} );

	test( 'editing a post type persists changes to the registered post type', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const created = await createUserPostType( requestUtils );
		await admin.visitAdminPage(
			SETTINGS_PAGE_PATH,
			`page=content-types-wp-admin&p=/post-types/${ created.id }`
		);

		await page
			.getByRole( 'checkbox', { name: 'Hierarchical', exact: true } )
			.click();
		await page.getByRole( 'combobox', { name: 'Taxonomies' } ).click();
		await page.getByRole( 'option', { name: 'Categories' } ).click();
		await expect(
			page.locator( '.components-form-token-field__token', {
				hasText: 'Categories',
			} )
		).toBeVisible();

		await page.getByRole( 'button', { name: 'Save' } ).click();
		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			'"Books" post type updated.'
		);

		// Open the post editor for the registered type and confirm the saved
		// config reached register_post_type():
		// - Hierarchical post types render a "Parent" row in the document
		//   sidebar.
		// - Associating the `category` taxonomy adds a "Categories" panel.
		await admin.createNewPost( { postType: 'book' } );
		await editor.openDocumentSettingsSidebar();
		await expect(
			page.getByRole( 'button', { name: /Change parent:/ } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Categories' } )
		).toBeVisible();
	} );
} );
