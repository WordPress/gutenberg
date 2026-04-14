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

// Locate an accordion card (Card container) for a given category title. Each
// card wraps both the trigger button and the collapsible form body, so
// scoping subsequent queries to this locator isolates one category from the
// others.
function getCategoryCard( page, title ) {
	return page
		.locator( '.content-guidelines__accordion' )
		.filter( {
			has: page.getByRole( 'button', {
				name: `Expand ${ title } guidelines`,
			} ),
		} )
		.or(
			page.locator( '.content-guidelines__accordion' ).filter( {
				has: page.getByRole( 'button', {
					name: `Collapse ${ title } guidelines`,
				} ),
			} )
		)
		.first();
}

// Expand a category accordion and fill its textarea, then click Save and
// wait for the success snackbar.
async function saveCategoryGuidelines( page, title, text ) {
	const card = getCategoryCard( page, title );

	// Expand the accordion if it isn't already open.
	const expandButton = card.getByRole( 'button', {
		name: `Expand ${ title } guidelines`,
	} );
	if ( await expandButton.isVisible() ) {
		await expandButton.click();
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
			'gutenberg-content-guidelines',
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

		const settingsMenu = page.locator( '#menu-settings' );
		const guidelinesLink = settingsMenu.getByRole( 'link', {
			name: 'Guidelines',
		} );
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
			.locator( '#menu-settings' )
			.getByRole( 'link', { name: 'Guidelines' } )
			.click();

		// The page layout renders the "Guidelines" title as an h2 (the
		// Page component defaults headingLevel to 2) and the category
		// accordions load once the initial fetch resolves.
		await expect(
			page.getByRole( 'heading', { name: 'Guidelines', level: 2 } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Expand Copy guidelines' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Expand Images guidelines' } )
		).toBeVisible();
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
		await expect(
			page.getByRole( 'button', { name: 'Expand Copy guidelines' } )
		).toBeVisible();

		// Save Copy and Images through the UI, one category at a time.
		await saveCategoryGuidelines( page, 'Copy', copyText );
		await saveCategoryGuidelines( page, 'Images', imagesText );

		// Refresh the page — the "verify saved guidelines load correctly"
		// step from the PR's testing instructions.
		await page.reload();
		await expect(
			page.getByRole( 'button', { name: 'Expand Copy guidelines' } )
		).toBeVisible();

		// Re-expand each accordion and confirm the textareas were
		// rehydrated with the values that were saved. Reading back from
		// the UI (rather than REST) verifies the full round trip: the
		// wp_guideline CPT stored the post, the REST controller served
		// it, the app hydrated its store, and the DataForm populated.
		const copyCard = getCategoryCard( page, 'Copy' );
		await copyCard
			.getByRole( 'button', { name: 'Expand Copy guidelines' } )
			.click();
		await expect(
			copyCard.getByRole( 'textbox', { name: 'copy guidelines' } )
		).toHaveValue( copyText );

		const imagesCard = getCategoryCard( page, 'Images' );
		await imagesCard
			.getByRole( 'button', { name: 'Expand Images guidelines' } )
			.click();
		await expect(
			imagesCard.getByRole( 'textbox', { name: 'images guidelines' } )
		).toHaveValue( imagesText );
	} );
} );
