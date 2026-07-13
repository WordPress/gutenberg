/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const CONTENT_TYPES_PAGE_QUERY = 'page=content-types-wp-admin&p=/taxonomies';
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
		await admin.visitAdminPage(
			SETTINGS_PAGE_PATH,
			CONTENT_TYPES_PAGE_QUERY
		);

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
		await admin.visitAdminPage(
			SETTINGS_PAGE_PATH,
			CONTENT_TYPES_PAGE_QUERY
		);

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

		await admin.visitAdminPage(
			SETTINGS_PAGE_PATH,
			CONTENT_TYPES_PAGE_QUERY
		);
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
				`page=content-types-wp-admin&p=/taxonomies/${ created.id }`
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

	test.describe( 'Default term', () => {
		// Nonsense slug to minimize the chance of collision with terms left
		// behind by other specs that touch built-in taxonomies.
		const SLUG = 'xyzzy';
		const PLURAL = 'Xyzzies';
		const SINGULAR = 'Xyzzy';

		// Outer `afterEach` deletes the wp_user_taxonomy record; this
		// additionally cleans up the posts the tests publish. The terms
		// auto-created by WP's default-term mechanism are intentionally
		// left in place — the current default term is protected from REST
		// deletion (`rest_cannot_delete`), and tests are resilient to the
		// leftover terms since `register_taxonomy()` reuses terms by name.
		// TODO: once wp_user_taxonomy deletion cascades to the
		// `default_term_{slug}` option and orphan terms, drop this comment
		// and explicitly clean the terms here.
		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts( 'posts' );
		} );

		async function createHierarchicalTaxonomyWithDefaultTerm( {
			admin,
			page,
			defaultTermName,
		} ) {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONTENT_TYPES_PAGE_QUERY
			);
			await page.getByRole( 'button', { name: 'Add taxonomy' } ).click();
			await page
				.getByRole( 'textbox', { name: 'Plural label' } )
				.fill( PLURAL );
			await page
				.getByRole( 'textbox', { name: 'Singular label' } )
				.fill( SINGULAR );
			const slugField = page.getByRole( 'textbox', {
				name: 'Taxonomy key',
			} );
			await Promise.all( [
				page.waitForResponse(
					( resp ) =>
						resp.url().includes( `/${ TAXONOMIES_REST_BASE }` ) &&
						resp.url().includes( `slug=${ SLUG }` )
				),
				slugField.focus(),
			] );
			await page
				.getByRole( 'checkbox', { name: 'Hierarchical' } )
				.click();
			await page.getByRole( 'combobox', { name: 'Post types' } ).click();
			await page.getByRole( 'option', { name: 'Posts' } ).click();

			await page.getByRole( 'button', { name: 'Advanced' } ).click();
			await page
				.getByRole( 'checkbox', { name: 'Set a default term' } )
				.click();
			await page
				.getByRole( 'textbox', { name: 'Default term name' } )
				.fill( defaultTermName );
			await page.getByRole( 'button', { name: 'Create' } ).click();
			await expect( page.getByTestId( 'snackbar' ) ).toContainText(
				`"${ PLURAL }" taxonomy created.`
			);
		}

		async function expandTaxonomyPanel( page ) {
			const button = page.getByRole( 'button', { name: PLURAL } );
			const expanded = await button.getAttribute( 'aria-expanded' );
			if ( expanded === 'false' ) {
				await button.click();
			}
		}

		// Resolves the wp_user_taxonomy record id so a test can navigate
		// back to its edit page. Slug-based lookup avoids depending on the
		// post-create redirect URL.
		async function getTaxonomyId( requestUtils ) {
			const records = await requestUtils.rest( {
				path: `/wp/v2/${ TAXONOMIES_REST_BASE }?slug=${ SLUG }&status=publish`,
				method: 'GET',
			} );
			return records[ 0 ].id;
		}

		test( 'auto-applies the default term, and stops after the toggle is disabled', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await createHierarchicalTaxonomyWithDefaultTerm( {
				admin,
				page,
				defaultTermName: 'Default Xyzzy A',
			} );

			// Publish a post without touching the taxonomy panel.
			await admin.createNewPost();
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( 'Post one' );
			await editor.publishPost();
			await page.reload();
			await editor.openDocumentSettingsSidebar();
			await expandTaxonomyPanel( page );
			const genresGroup = page.getByRole( 'group', { name: PLURAL } );
			await expect(
				genresGroup.getByRole( 'checkbox', { name: 'Default Xyzzy A' } )
			).toBeChecked();

			// Disable the default-term toggle via the edit page.
			const taxonomyId = await getTaxonomyId( requestUtils );
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				`page=content-types-wp-admin&p=/taxonomies/${ taxonomyId }`
			);
			await page.getByRole( 'button', { name: 'Advanced' } ).click();
			await page
				.getByRole( 'checkbox', { name: 'Set a default term' } )
				.click();
			await page.getByRole( 'button', { name: 'Save' } ).click();
			await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
				`"${ PLURAL }" taxonomy updated.`
			);

			// Publish another post — the default term must no longer
			// auto-attach, so no checkbox in the term group is checked.
			await admin.createNewPost();
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( 'Post two' );
			await editor.publishPost();
			await page.reload();
			await editor.openDocumentSettingsSidebar();
			await expandTaxonomyPanel( page );
			const genresGroupTwo = page.getByRole( 'group', { name: PLURAL } );
			await expect(
				genresGroupTwo.getByRole( 'checkbox', { checked: true } )
			).toHaveCount( 0 );
		} );

		test( 'renaming the default term creates a new term and preserves the old', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await createHierarchicalTaxonomyWithDefaultTerm( {
				admin,
				page,
				defaultTermName: 'Original Xyzzy',
			} );

			// Publish post A — the original default term should be checked.
			await admin.createNewPost();
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( 'Post A' );
			await editor.publishPost();
			await page.reload();
			await editor.openDocumentSettingsSidebar();
			await expandTaxonomyPanel( page );
			const postAGroup = page.getByRole( 'group', { name: PLURAL } );
			await expect(
				postAGroup.getByRole( 'checkbox', { name: 'Original Xyzzy' } )
			).toBeChecked();

			// Rename the default term via the edit page.
			const taxonomyId = await getTaxonomyId( requestUtils );
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				`page=content-types-wp-admin&p=/taxonomies/${ taxonomyId }`
			);
			await page.getByRole( 'button', { name: 'Advanced' } ).click();
			await page
				.getByRole( 'textbox', { name: 'Default term name' } )
				.fill( 'Renamed Xyzzy' );
			await page.getByRole( 'button', { name: 'Save' } ).click();
			await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
				`"${ PLURAL }" taxonomy updated.`
			);

			// Publish post B — the newly created term should be checked,
			// and the original term should still appear in the panel
			// (preserved, not deleted), just unchecked.
			await admin.createNewPost();
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( 'Post B' );
			await editor.publishPost();
			await page.reload();
			await editor.openDocumentSettingsSidebar();
			await expandTaxonomyPanel( page );
			const postBGroup = page.getByRole( 'group', { name: PLURAL } );
			await expect(
				postBGroup.getByRole( 'checkbox', { name: 'Renamed Xyzzy' } )
			).toBeChecked();
			await expect(
				postBGroup.getByRole( 'checkbox', { name: 'Original Xyzzy' } )
			).not.toBeChecked();
		} );
	} );
} );
