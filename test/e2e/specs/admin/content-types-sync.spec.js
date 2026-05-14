/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const POST_TYPES_PAGE_QUERY = 'page=content-types-wp-admin&p=/post-types';
const TAXONOMIES_PAGE_QUERY = 'page=content-types-wp-admin&p=/taxonomies';
const POST_TYPES_REST_BASE = 'user-post-types';
const TAXONOMIES_REST_BASE = 'user-taxonomies';

async function createUserTaxonomyViaUI( {
	page,
	plural,
	singular,
	slug,
	objectTypes,
} ) {
	await page.getByRole( 'button', { name: 'Add taxonomy' } ).click();
	await page.getByRole( 'textbox', { name: 'Plural label' } ).fill( plural );
	await page
		.getByRole( 'textbox', { name: 'Singular label' } )
		.fill( singular );
	const slugField = page.getByRole( 'textbox', { name: 'Taxonomy key' } );
	await Promise.all( [
		page.waitForResponse(
			( resp ) =>
				resp.url().includes( `/${ TAXONOMIES_REST_BASE }` ) &&
				resp.url().includes( `slug=${ slug }` )
		),
		slugField.focus(),
	] );
	for ( const objectType of objectTypes ) {
		await page.getByRole( 'combobox', { name: 'Post types' } ).click();
		await page.getByRole( 'option', { name: objectType } ).click();
	}
	await page.getByRole( 'button', { name: 'Create' } ).click();
	await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
		`"${ plural }" taxonomy created.`
	);
}

async function createUserPostTypeViaUI( {
	page,
	plural,
	singular,
	slug,
	taxonomies,
} ) {
	await page.getByRole( 'button', { name: 'Add post type' } ).click();
	await page.getByRole( 'textbox', { name: 'Plural label' } ).fill( plural );
	await page
		.getByRole( 'textbox', { name: 'Singular label' } )
		.fill( singular );
	const slugField = page.getByRole( 'textbox', { name: 'Post type key' } );
	await Promise.all( [
		page.waitForResponse(
			( resp ) =>
				resp.url().includes( `/${ POST_TYPES_REST_BASE }` ) &&
				resp.url().includes( `slug=${ slug }` )
		),
		slugField.focus(),
	] );
	for ( const taxonomy of taxonomies ) {
		await page.getByRole( 'combobox', { name: 'Taxonomies' } ).click();
		await page.getByRole( 'option', { name: taxonomy } ).click();
	}
	await page.getByRole( 'button', { name: 'Create' } ).click();
	await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
		`"${ plural }" post type created.`
	);
}

test.describe( 'Content types sync', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-content-types',
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts( POST_TYPES_REST_BASE );
		await requestUtils.deleteAllPosts( TAXONOMIES_REST_BASE );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'attaching a user taxonomy on the post type form surfaces the link in the taxonomies list', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage( SETTINGS_PAGE_PATH, TAXONOMIES_PAGE_QUERY );
		await createUserTaxonomyViaUI( {
			page,
			plural: 'Genres',
			singular: 'Genre',
			slug: 'genre',
			objectTypes: [ 'Posts' ],
		} );

		await page.getByRole( 'link', { name: 'Taxonomies' } ).click();
		await page.getByRole( 'tab', { name: 'Post Types' } ).click();
		await createUserPostTypeViaUI( {
			page,
			plural: 'Albums',
			singular: 'Album',
			slug: 'album',
			taxonomies: [ 'Genres' ],
		} );

		await page.getByRole( 'link', { name: 'Post Types' } ).click();
		await page.getByRole( 'tab', { name: 'Taxonomies' } ).click();
		await expect(
			page
				.getByRole( 'row', { name: 'Genres' } )
				.getByText( 'Albums', { exact: true } )
		).toBeVisible();
	} );

	test( 'attaching a user post type on the taxonomy form surfaces the link in the post types list', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage( SETTINGS_PAGE_PATH, POST_TYPES_PAGE_QUERY );
		await createUserPostTypeViaUI( {
			page,
			plural: 'Albums',
			singular: 'Album',
			slug: 'album',
			taxonomies: [],
		} );

		await page.getByRole( 'link', { name: 'Post Types' } ).click();
		await page.getByRole( 'tab', { name: 'Taxonomies' } ).click();
		await createUserTaxonomyViaUI( {
			page,
			plural: 'Genres',
			singular: 'Genre',
			slug: 'genre',
			objectTypes: [ 'Albums' ],
		} );

		await page.getByRole( 'link', { name: 'Taxonomies' } ).click();
		await page.getByRole( 'tab', { name: 'Post Types' } ).click();
		await expect(
			page
				.getByRole( 'row', { name: 'Albums' } )
				.getByText( 'Genres', { exact: true } )
		).toBeVisible();
	} );
} );
