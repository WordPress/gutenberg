/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const GUIDELINES_PAGE_QUERY = 'page=guidelines-wp-admin';
const GUIDELINES_REST_BASE = '/wp/v2/content-guidelines';

// Remove any existing singleton guideline post so each test starts from a
// clean slate. Uses REST for speed — this is test scaffolding, not the
// behavior under verification.
async function deleteAllGuidelines( requestUtils ) {
	const guidelines = await requestUtils.rest( {
		path: GUIDELINES_REST_BASE,
	} );

	if ( guidelines?.id ) {
		await requestUtils.rest( {
			path: `${ GUIDELINES_REST_BASE }/${ guidelines.id }`,
			method: 'DELETE',
			params: { force: true },
		} );
	}
}

// Locate the list item wrapping a category's Collapsible Card. Scoping
// subsequent queries to this locator isolates one category (its trigger,
// form, and Save button) from the others.
function getCategoryCard( page, title ) {
	return page.getByRole( 'listitem' ).filter( {
		has: page.getByRole( 'button', { name: title } ),
	} );
}

// Expand a category accordion and fill its textarea, then click Save and
// wait for the success snackbar.
async function saveCategoryGuidelines( page, title, text ) {
	const card = getCategoryCard( page, title );

	// Expand the accordion if it isn't already open.
	const trigger = card.getByRole( 'button', { name: title } );
	if ( ( await trigger.getAttribute( 'aria-expanded' ) ) !== 'true' ) {
		await trigger.click();
	}

	// The DataForm renders a textarea whose accessible name is
	// "<slug> guidelines" (lowercased slug from the field label).
	const textarea = card.getByRole( 'textbox', {
		name: `${ title.toLowerCase() } guidelines`,
	} );
	await expect( textarea ).toBeVisible();
	await textarea.fill( text );

	await card.getByRole( 'button', { name: 'Save guidelines' } ).click();

	// Success snackbar is rendered at the document root, not inside the card.
	// Scope to the snackbar testid to avoid matching the a11y-speak live region.
	await expect(
		page
			.getByTestId( 'snackbar' )
			.filter( { hasText: 'Guidelines saved.' } )
	).toBeVisible();
}

test.describe( 'Guidelines', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-guidelines',
		] );
		await deleteAllGuidelines( requestUtils );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await deleteAllGuidelines( requestUtils );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'shows a Guidelines link in the Settings menu', async ( {
		page,
		admin,
	} ) => {
		await admin.visitAdminPage( SETTINGS_PAGE_PATH );

		const guidelinesLink = page
			.getByRole( 'navigation', { name: 'Main menu' } )
			.getByRole( 'link', { name: 'Guidelines' } );
		await expect( guidelinesLink ).toBeVisible();
		await expect( guidelinesLink ).toHaveAttribute(
			'href',
			`${ SETTINGS_PAGE_PATH }?${ GUIDELINES_PAGE_QUERY }`
		);
	} );

	test( 'opens the Guidelines page from the Settings menu', async ( {
		page,
		admin,
	} ) => {
		await admin.visitAdminPage( SETTINGS_PAGE_PATH );
		await page
			.getByRole( 'navigation', { name: 'Main menu' } )
			.getByRole( 'link', { name: 'Guidelines' } )
			.click();

		// The page layout renders the "Guidelines" title as an h1 and
		// the category accordions load once the initial fetch resolves.
		await expect(
			page.getByRole( 'heading', { name: 'Guidelines', level: 1 } )
		).toBeVisible();
		await expect( getCategoryCard( page, 'Copy' ) ).toBeVisible();
		await expect( getCategoryCard( page, 'Images' ) ).toBeVisible();
	} );

	test( 'persists Copy and Images guidelines entered through the UI across a refresh', async ( {
		page,
		admin,
	} ) => {
		const copyText = 'Use plain, active language.';
		const imagesText = 'Always include descriptive alt text.';

		await admin.visitAdminPage( SETTINGS_PAGE_PATH, GUIDELINES_PAGE_QUERY );

		// Wait for the initial fetch to resolve — accordions only render
		// after the loading spinner disappears.
		await expect( getCategoryCard( page, 'Copy' ) ).toBeVisible();

		// Save Copy and Images through the UI, one category at a time.
		await saveCategoryGuidelines( page, 'Copy', copyText );
		await saveCategoryGuidelines( page, 'Images', imagesText );

		// Refresh the page — the "verify saved guidelines load correctly"
		// step from the PR's testing instructions.
		await page.reload();
		await expect( getCategoryCard( page, 'Copy' ) ).toBeVisible();

		// Re-expand each accordion and confirm the textareas were
		// rehydrated with the values that were saved. Reading back from
		// the UI (rather than REST) verifies the full round trip: the
		// wp_guideline CPT stored the post, the REST controller served
		// it, the app hydrated its store, and the DataForm populated.
		const copyCard = getCategoryCard( page, 'Copy' );
		await copyCard.getByRole( 'button', { name: 'Copy' } ).click();
		await expect(
			copyCard.getByRole( 'textbox', { name: 'copy guidelines' } )
		).toHaveValue( copyText );

		const imagesCard = getCategoryCard( page, 'Images' );
		await imagesCard.getByRole( 'button', { name: 'Images' } ).click();
		await expect(
			imagesCard.getByRole( 'textbox', { name: 'images guidelines' } )
		).toHaveValue( imagesText );
	} );
} );
