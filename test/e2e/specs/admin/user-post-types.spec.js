/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const POST_TYPES_PAGE_QUERY = 'page=post-types-wp-admin';
const POST_TYPES_REST_BASE = 'user-post-types';

async function createUserPostType( requestUtils ) {
	return requestUtils.rest( {
		path: `/wp/v2/${ POST_TYPES_REST_BASE }`,
		method: 'POST',
		data: {
			title: 'Books',
			slug: 'book',
			status: 'publish',
			config: {
				labels: { singular_name: 'Book' },
			},
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

	test( 'creates a post type and registers it', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await admin.visitAdminPage( SETTINGS_PAGE_PATH, POST_TYPES_PAGE_QUERY );

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

		// `show_in_rest: true` is the default for user-defined post types,
		// so the type endpoint should resolve immediately after activation.
		const registered = await requestUtils.rest( {
			path: '/wp/v2/types/book',
			method: 'GET',
		} );
		expect( registered.slug ).toBe( 'book' );
	} );

	test( 'deactivating unregisters the post type and activating re-registers it', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await createUserPostType( requestUtils );
		await admin.visitAdminPage( SETTINGS_PAGE_PATH, POST_TYPES_PAGE_QUERY );

		const row = page.getByRole( 'row', { name: /Books/ } );
		await row.getByRole( 'button', { name: 'Actions' } ).click();
		await page.getByRole( 'menuitem', { name: 'Deactivate' } ).click();

		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			'Post type deactivated.'
		);
		await expect( row.getByText( 'Inactive' ) ).toBeVisible();

		// requestUtils.rest() throws on non-2xx — catch and inspect the
		// error code instead of relying on a status assertion.
		const deactivated = await requestUtils
			.rest( {
				path: '/wp/v2/types/book',
				method: 'GET',
			} )
			.catch( ( error ) => error );
		expect( deactivated.code ).toBe( 'rest_type_invalid' );

		await row.getByRole( 'button', { name: 'Actions' } ).click();
		await page.getByRole( 'menuitem', { name: 'Activate' } ).click();

		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			'Post type activated.'
		);
		await expect( row.getByText( 'Active' ) ).toBeVisible();

		const reactivated = await requestUtils.rest( {
			path: '/wp/v2/types/book',
			method: 'GET',
		} );
		expect( reactivated.slug ).toBe( 'book' );
	} );

	test( 'editing a post type persists changes to the registered post type', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const created = await createUserPostType( requestUtils );
		await admin.visitAdminPage(
			SETTINGS_PAGE_PATH,
			`${ POST_TYPES_PAGE_QUERY }&p=/edit/${ created.id }`
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

		const registered = await requestUtils.rest( {
			path: '/wp/v2/types/book',
			method: 'GET',
		} );
		expect( registered.hierarchical ).toBe( true );
		expect( registered.taxonomies ).toContain( 'category' );
	} );
} );
