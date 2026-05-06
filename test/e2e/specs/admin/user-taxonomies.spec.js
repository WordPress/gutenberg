/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const TAXONOMIES_PAGE_QUERY = 'page=taxonomies-wp-admin';
const TAXONOMIES_REST_BASE = 'user-taxonomies';

// Seeds all visibility booleans so the form's `toFormData` reads each toggle
// as a defined value — the form contract requires every flag present, to
// avoid passing `undefined` for unchecked toggles and relying on defaults
// in register_taxonomy.
async function createUserTaxonomy( requestUtils ) {
	return requestUtils.createRecord( TAXONOMIES_REST_BASE, {
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
	} );
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
	} ) => {
		await admin.visitAdminPage( SETTINGS_PAGE_PATH, TAXONOMIES_PAGE_QUERY );

		await page.getByRole( 'button', { name: 'Add taxonomy' } ).click();

		await page
			.getByRole( 'textbox', { name: 'Plural label' } )
			.fill( 'Genres' );
		await page
			.getByRole( 'textbox', { name: 'Singular label' } )
			.fill( 'Genre' );
		// Focusing the slug field auto-fills it from the singular label,
		// which also kicks off the async uniqueness check. The form's
		// `isValid` stays false while that's in flight, so wait for the
		// REST call to settle before submitting.
		// The button doesn't reflect form validity, so a UI-only wait
		// isn't possible.
		// TODO: expolore disabling the button based on the form validity.
		const slugField = page.getByRole( 'textbox', {
			name: 'Taxonomy key',
		} );
		await Promise.all( [
			page.waitForResponse(
				( resp ) =>
					resp.url().includes( `/${ TAXONOMIES_REST_BASE }` ) &&
					resp.url().includes( 'slug=genre' )
			),
			slugField.focus(),
		] );
		await expect( slugField ).toHaveValue( 'genre' );
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

		// Visiting the taxonomy's term-management screen for the attached
		// post type confirms registration end-to-end — an unregistered
		// taxonomy slug here would wp_die with "Invalid taxonomy."
		await admin.visitAdminPage(
			'edit-tags.php',
			'taxonomy=genre&post_type=post'
		);
		await expect(
			page.getByRole( 'heading', { level: 1, name: 'Genres' } )
		).toBeVisible();
	} );

	test( 'deactivating unregisters the taxonomy and activating re-registers it', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await createUserTaxonomy( requestUtils );
		await admin.visitAdminPage( SETTINGS_PAGE_PATH, TAXONOMIES_PAGE_QUERY );

		await page
			.getByRole( 'row', { name: 'Genres' } )
			.getByRole( 'button', { name: 'Actions' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Deactivate' } ).click();

		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			'Taxonomy deactivated.'
		);
		await expect(
			page.getByRole( 'row', { name: 'Genres' } ).getByText( 'Inactive' )
		).toBeVisible();

		// Unregistered taxonomies cause WP core to wp_die with "Invalid
		// taxonomy." when visiting their term-management URL.
		await admin.visitAdminPage(
			'edit-tags.php',
			'taxonomy=genre&post_type=post'
		);
		await expect( page.getByText( 'Invalid taxonomy.' ) ).toBeVisible();

		await admin.visitAdminPage( SETTINGS_PAGE_PATH, TAXONOMIES_PAGE_QUERY );
		await page
			.getByRole( 'row', { name: 'Genres' } )
			.getByRole( 'button', { name: 'Actions' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Activate' } ).click();

		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			'Taxonomy activated.'
		);
		await expect(
			page.getByRole( 'row', { name: 'Genres' } ).getByText( 'Active' )
		).toBeVisible();

		await admin.visitAdminPage(
			'edit-tags.php',
			'taxonomy=genre&post_type=post'
		);
		await expect(
			page.getByRole( 'heading', { level: 1, name: 'Genres' } )
		).toBeVisible();
	} );

	test.describe( 'Edit taxonomy', () => {
		test.beforeEach( async ( { requestUtils, admin } ) => {
			const created = await createUserTaxonomy( requestUtils );
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				`${ TAXONOMIES_PAGE_QUERY }&p=/edit/${ created.id }`
			);
		} );

		test( 'editing a taxonomy persists changes to the registered taxonomy', async ( {
			admin,
			page,
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

			await page.getByRole( 'button', { name: 'Save' } ).click();
			await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
				'"Genres" taxonomy updated.'
			);

			// Visiting the pages list confirms two persisted edits at once:
			// the taxonomy was re-attached from `post` to `page` (otherwise
			// the column wouldn't render here at all) and `show_admin_column`
			// was enabled (otherwise no column even when attached).
			await admin.visitAdminPage( 'edit.php', 'post_type=page' );
			await expect(
				page
					.getByRole( 'columnheader' )
					.filter( { hasText: 'Genres' } )
					.first()
			).toBeVisible();

			// Confirm Posts is no longer attached. With `show_admin_column`
			// enabled in this test, the column would still render on the
			// posts list if the taxonomy were attached to `post` — its
			// absence proves the detach.
			await admin.visitAdminPage( 'edit.php', 'post_type=post' );
			await expect(
				page.getByRole( 'columnheader' ).filter( { hasText: 'Genres' } )
			).toHaveCount( 0 );
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

		test( 'turning `Publicly queryable` off blocks the front-end term archive', async ( {
			page,
		} ) => {
			// Sanity baseline: with publicly_queryable on (from the seed),
			// WP::parse_request() routes the query vars through and 404s
			// for an unknown term.
			let response = await page.request.get(
				'/?taxonomy=genre&term=missing'
			);
			expect( response.status() ).toBe( 404 );

			await page.getByRole( 'button', { name: 'Visibility' } ).click();
			await page
				.getByRole( 'checkbox', { name: 'Publicly queryable' } )
				.click();
			await page.getByRole( 'button', { name: 'Save' } ).click();
			await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
				'"Genres" taxonomy updated.'
			);

			// With publicly_queryable off, WP::parse_request() unsets the
			// taxonomy/term query vars, so the same URL falls through to
			// the homepage (200) instead of resolving to a term archive.
			response = await page.request.get(
				'/?taxonomy=genre&term=missing'
			);
			expect( response.status() ).toBe( 200 );
		} );

		test( 'turning `Public` off does not cascade to `Show admin UI`', async ( {
			admin,
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

			// Confirm `public` actually flipped.
			const registered = await requestUtils.rest( {
				path: '/wp/v2/taxonomies/genre?context=edit',
				method: 'GET',
			} );
			expect( registered.visibility.public ).toBe( false );

			// `show_ui` should stay enabled even when `public` is off, so
			// the term-management screen should still load.
			await admin.visitAdminPage(
				'edit-tags.php',
				'taxonomy=genre&post_type=post'
			);
			await expect(
				page.getByRole( 'heading', { level: 1, name: 'Genres' } )
			).toBeVisible();
		} );
	} );
} );
