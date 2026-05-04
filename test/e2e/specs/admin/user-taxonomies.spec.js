/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const TAXONOMIES_PAGE_QUERY = 'page=taxonomies-wp-admin';
const TAXONOMIES_REST_BASE = 'user-taxonomies';

// TODO: once the user-taxonomies feature stabilizes, promote this seeding
// helper into packages/e2e-test-utils-playwright/src/request-utils/ alongside
// createPost / createPage so other specs can reuse it.
// Seeds all visibility booleans so the form's `toFormData` reads each toggle
// as a defined value — the form contract requires every flag present, to
// avoid passing `undefined` for unchecked toggles and relying on defaults
// in register_taxonomy.
async function createUserTaxonomy( requestUtils ) {
	return requestUtils.rest( {
		path: `/wp/v2/${ TAXONOMIES_REST_BASE }`,
		method: 'POST',
		data: {
			title: 'Genres',
			slug: 'genre',
			status: 'publish',
			object_type: [ 'post' ],
			config: {
				labels: { singular_name: 'Genre' },
				public: true,
				hierarchical: false,
				publicly_queryable: true,
				show_ui: true,
				show_in_menu: true,
				show_in_nav_menus: true,
				show_tagcloud: true,
				show_in_quick_edit: true,
				show_admin_column: false,
				show_in_rest: true,
			},
		},
	} );
}

async function visitTaxonomiesList( admin ) {
	await admin.visitAdminPage( SETTINGS_PAGE_PATH, TAXONOMIES_PAGE_QUERY );
}

async function visitTaxonomyEdit( admin, id ) {
	await admin.visitAdminPage(
		SETTINGS_PAGE_PATH,
		`${ TAXONOMIES_PAGE_QUERY }&p=/edit/${ id }`
	);
}

test.describe( 'User taxonomies', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-content-types',
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts( TAXONOMIES_REST_BASE );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'creates a taxonomy attached to posts and registers it', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await visitTaxonomiesList( admin );

		await page.getByRole( 'button', { name: 'Add taxonomy' } ).click();

		await page
			.getByRole( 'textbox', { name: 'Plural label' } )
			.fill( 'Genres' );
		await page
			.getByRole( 'textbox', { name: 'Singular label' } )
			.fill( 'Genre' );
		// The slug field runs an async uniqueness check; the form's
		// `isValid` stays false while it's in flight, so wait for the
		// REST call to settle before submitting.
		// The button doesn't reflect form validity, so a UI-only wait
		// isn't possible.
		// TODO: expolore disabling the button based on the form validity.
		await Promise.all( [
			page.waitForResponse(
				( resp ) =>
					resp.url().includes( `/${ TAXONOMIES_REST_BASE }` ) &&
					resp.url().includes( 'slug=genre' )
			),
			page
				.getByRole( 'textbox', { name: 'Taxonomy key' } )
				.fill( 'genre' ),
		] );
		await page.getByRole( 'combobox', { name: 'Post types' } ).click();
		await page.getByRole( 'option', { name: 'Posts' } ).click();
		await expect(
			page.locator( '.components-form-token-field__token', {
				hasText: 'Posts',
			} )
		).toBeVisible();

		await page.getByRole( 'button', { name: 'Create' } ).click();

		await expect( page.getByTestId( 'snackbar' ) ).toContainText(
			'"Genres" taxonomy created.'
		);

		// Relies on `show_in_rest: true`, which is the current default
		// for user-defined taxonomies.
		const registered = await requestUtils.rest( {
			path: '/wp/v2/taxonomies/genre',
			method: 'GET',
		} );
		expect( registered.slug ).toBe( 'genre' );
		expect( registered.types ).toContain( 'post' );
	} );

	test( 'deactivating unregisters the taxonomy and activating re-registers it', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await createUserTaxonomy( requestUtils );
		await visitTaxonomiesList( admin );

		const row = page.getByRole( 'row', { name: /Genres/ } );
		await row.getByRole( 'button', { name: 'Actions' } ).click();
		await page.getByRole( 'menuitem', { name: 'Deactivate' } ).click();

		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			'Taxonomy deactivated.'
		);
		await expect( row.getByText( 'Inactive' ) ).toBeVisible();

		// requestUtils.rest() throws on non-2xx — catch and inspect the
		// error code instead of relying on a status assertion.
		const deactivated = await requestUtils
			.rest( {
				path: '/wp/v2/taxonomies/genre',
				method: 'GET',
			} )
			.catch( ( error ) => error );
		expect( deactivated.code ).toBe( 'rest_taxonomy_invalid' );

		await row.getByRole( 'button', { name: 'Actions' } ).click();
		await page.getByRole( 'menuitem', { name: 'Activate' } ).click();

		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			'Taxonomy activated.'
		);
		await expect( row.getByText( 'Active' ) ).toBeVisible();

		const reactivated = await requestUtils.rest( {
			path: '/wp/v2/taxonomies/genre',
			method: 'GET',
		} );
		expect( reactivated.slug ).toBe( 'genre' );
	} );

	test.describe( 'Edit taxonomy', () => {
		test.beforeEach( async ( { requestUtils, admin } ) => {
			const created = await createUserTaxonomy( requestUtils );
			await visitTaxonomyEdit( admin, created.id );
		} );

		test( 'editing a taxonomy persists changes to the registered taxonomy', async ( {
			page,
			requestUtils,
		} ) => {
			const postsToken = page.locator(
				'.components-form-token-field__token',
				{ hasText: 'Posts' }
			);
			await postsToken
				.getByRole( 'button', { name: 'Remove item' } )
				.click();
			await page.getByRole( 'combobox', { name: 'Post types' } ).click();
			await page.getByRole( 'option', { name: 'Pages' } ).click();
			await expect(
				page.locator( '.components-form-token-field__token', {
					hasText: 'Pages',
				} )
			).toBeVisible();

			await page.getByRole( 'button', { name: 'Visibility' } ).click();
			await page
				.getByRole( 'checkbox', { name: 'Show admin column' } )
				.click();
			await page
				.getByRole( 'checkbox', { name: 'Publicly queryable' } )
				.click();

			await page.getByRole( 'button', { name: 'Save' } ).click();
			await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
				'"Genres" taxonomy updated.'
			);

			const registered = await requestUtils.rest( {
				path: '/wp/v2/taxonomies/genre?context=edit',
				method: 'GET',
			} );
			expect( registered.types ).toEqual( [ 'page' ] );
			expect( registered.visibility.show_admin_column ).toBe( true );
			expect( registered.visibility.publicly_queryable ).toBe( false );
		} );

		test( 'turning `Show in REST API` off blocks the taxonomy from the REST API', async ( {
			page,
			requestUtils,
		} ) => {
			await page.getByRole( 'button', { name: 'Visibility' } ).click();
			await page
				.getByRole( 'checkbox', { name: 'Show in REST API' } )
				.click();
			await page.getByRole( 'button', { name: 'Save' } ).click();
			await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
				'"Genres" taxonomy updated.'
			);

			const result = await requestUtils
				.rest( {
					path: '/wp/v2/taxonomies/genre',
					method: 'GET',
				} )
				.catch( ( error ) => error );
			expect( result.code ).toBe( 'rest_forbidden' );
		} );

		test( 'turning `Public` off does not cascade to `Show admin UI` or REST exposure', async ( {
			page,
			requestUtils,
		} ) => {
			await page.getByRole( 'button', { name: 'Visibility' } ).click();
			await page
				.getByRole( 'checkbox', { name: 'Public', exact: true } )
				.click();
			await page.getByRole( 'button', { name: 'Save' } ).click();
			await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
				'"Genres" taxonomy updated.'
			);

			const registered = await requestUtils.rest( {
				path: '/wp/v2/taxonomies/genre?context=edit',
				method: 'GET',
			} );
			expect( registered.visibility.public ).toBe( false );
			expect( registered.visibility.show_ui ).toBe( true );
		} );
	} );
} );
