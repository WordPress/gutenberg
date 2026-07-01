/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const GUIDELINES_PAGE_QUERY = 'page=guidelines-wp-admin';
const KNOWLEDGE_REST_BASE = '/wp/v2/knowledge';

// Remove any existing guideline rows so each test starts from a clean slate.
// Uses REST for speed — this is test scaffolding, not the behavior under
// verification. Guideline rows are the `wp_knowledge` posts whose slug begins
// with `guideline-` (scopes and per-block rows alike).
async function deleteAllGuidelines( requestUtils ) {
	const rows = await requestUtils.rest( {
		path: KNOWLEDGE_REST_BASE,
		params: {
			per_page: 100,
			context: 'edit',
			status: [ 'publish', 'draft', 'private' ],
		},
	} );

	for ( const row of rows ?? [] ) {
		if (
			typeof row?.slug === 'string' &&
			row.slug.startsWith( 'guideline-' )
		) {
			await requestUtils.rest( {
				path: `${ KNOWLEDGE_REST_BASE }/${ row.id }`,
				method: 'DELETE',
				params: { force: true },
			} );
		}
	}
}

// Locate the list item wrapping a section's Collapsible Card. Scoping
// subsequent queries to this locator isolates one section (its trigger,
// form, and Save button) from the others.
function getSectionCard( page, title ) {
	return page.getByRole( 'listitem' ).filter( {
		has: page.getByRole( 'button', { name: title, exact: true } ),
	} );
}

// Wait for the Guidelines React app to mount and finish its first data load.
// The native wp-admin wrapper is hidden by the boot layout, and the app boots
// asynchronously after visitAdminPage() has resolved.
async function waitForGuidelinesApp( page ) {
	await expect(
		page
			.locator( '#guidelines-wp-admin-app' )
			.getByRole( 'heading', { name: 'Guidelines', level: 1 } )
	).toBeVisible( { timeout: 10_000 } );

	await expect( getSectionCard( page, 'Copy' ) ).toBeVisible( {
		timeout: 10_000,
	} );
}

async function visitGuidelinesPage( page, admin ) {
	await admin.visitAdminPage( SETTINGS_PAGE_PATH, GUIDELINES_PAGE_QUERY );
	await waitForGuidelinesApp( page );
}

// Expand a section accordion and fill its textarea, then click Save and
// wait for the success snackbar.
async function saveSectionGuidelines( page, title, text ) {
	const card = getSectionCard( page, title );

	const trigger = card.getByRole( 'button', { name: title, exact: true } );
	if ( ( await trigger.getAttribute( 'aria-expanded' ) ) !== 'true' ) {
		await trigger.click();
	}

	// The DataForm renders a textarea whose accessible name is the field label
	// "<Title> guidelines" (the registry scope title).
	const textarea = card.getByRole( 'textbox', {
		name: `${ title } guidelines`,
	} );
	await expect( textarea ).toBeVisible();
	await textarea.fill( text );

	await card.getByRole( 'button', { name: 'Save guidelines' } ).click();

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

	test( 'opens the Guidelines page and renders registry sections', async ( {
		page,
		admin,
	} ) => {
		await visitGuidelinesPage( page, admin );

		// Sections come from the wp_guideline_scopes registry plus the Blocks
		// section the client injects.
		await expect( getSectionCard( page, 'Site' ) ).toBeVisible();
		await expect( getSectionCard( page, 'Copy' ) ).toBeVisible();
		await expect( getSectionCard( page, 'Images' ) ).toBeVisible();
		await expect( getSectionCard( page, 'Blocks' ) ).toBeVisible();
		await expect( getSectionCard( page, 'Additional' ) ).toBeVisible();
	} );

	test( 'does not expose revision history', async ( { page, admin } ) => {
		await visitGuidelinesPage( page, admin );

		// The Actions card offers Import and Export, but not Revert / history.
		await expect(
			page.getByRole( 'button', { name: 'Export guidelines' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Import guidelines' } )
		).toBeVisible();
		await expect( page.getByText( 'Revert' ) ).toHaveCount( 0 );
		await expect(
			page.getByRole( 'button', { name: 'View history' } )
		).toHaveCount( 0 );
	} );

	test( 'persists Copy and Images guidelines across a refresh', async ( {
		page,
		admin,
	} ) => {
		const copyText = 'Use plain, active language.';
		const imagesText = 'Always include descriptive alt text.';

		await visitGuidelinesPage( page, admin );

		await saveSectionGuidelines( page, 'Copy', copyText );
		await saveSectionGuidelines( page, 'Images', imagesText );

		await page.reload();
		await waitForGuidelinesApp( page );

		// Reading back from the UI verifies the full round trip: a per-scope
		// wp_knowledge row was created, the standard collection served it, and
		// core-data hydrated the form.
		const copyCard = getSectionCard( page, 'Copy' );
		await copyCard
			.getByRole( 'button', { name: 'Copy', exact: true } )
			.click();
		await expect(
			copyCard.getByRole( 'textbox', { name: 'Copy guidelines' } )
		).toHaveValue( copyText );

		const imagesCard = getSectionCard( page, 'Images' );
		await imagesCard
			.getByRole( 'button', { name: 'Images', exact: true } )
			.click();
		await expect(
			imagesCard.getByRole( 'textbox', { name: 'Images guidelines' } )
		).toHaveValue( imagesText );
	} );

	test( 'edits a scope guideline after a reload', async ( {
		page,
		admin,
	} ) => {
		await visitGuidelinesPage( page, admin );

		// Create the row in this session.
		await saveSectionGuidelines( page, 'Copy', 'First version.' );

		// Reload so the row is only available from the collection request
		// (edit context via the entity's baseURLParams). Editing it must still
		// work — a regression guard for reading the wrong cache bucket.
		await page.reload();
		await waitForGuidelinesApp( page );

		await saveSectionGuidelines( page, 'Copy', 'Second version.' );

		await page.reload();
		await waitForGuidelinesApp( page );
		const copyCard = getSectionCard( page, 'Copy' );
		await copyCard
			.getByRole( 'button', { name: 'Copy', exact: true } )
			.click();
		await expect(
			copyCard.getByRole( 'textbox', { name: 'Copy guidelines' } )
		).toHaveValue( 'Second version.' );
	} );

	test( 'reclaims an existing non-public row on save instead of duplicating', async ( {
		page,
		admin,
		requestUtils,
	} ) => {
		// Seed a private row that already owns the canonical slug. The page
		// reads only published rows, so the Copy section starts empty.
		await requestUtils.rest( {
			path: KNOWLEDGE_REST_BASE,
			method: 'POST',
			data: {
				slug: 'guideline-copy',
				content: 'Old private guidance.',
				status: 'private',
			},
		} );

		await visitGuidelinesPage( page, admin );
		const copyCard = getSectionCard( page, 'Copy' );
		await copyCard
			.getByRole( 'button', { name: 'Copy', exact: true } )
			.click();
		await expect(
			copyCard.getByRole( 'textbox', { name: 'Copy guidelines' } )
		).toHaveValue( '' );

		// Saving reclaims the private row (republish + overwrite) rather than
		// creating a second row.
		await saveSectionGuidelines( page, 'Copy', 'New guidance.' );

		const rows = await requestUtils.rest( {
			path: KNOWLEDGE_REST_BASE,
			params: {
				slug: 'guideline-copy',
				status: [ 'publish', 'private', 'draft' ],
				context: 'edit',
				per_page: 100,
			},
		} );
		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ].status ).toBe( 'publish' );
		expect( rows[ 0 ].content.raw ).toBe( 'New guidance.' );
	} );

	test( 'clears a scope guideline', async ( { page, admin } ) => {
		await visitGuidelinesPage( page, admin );

		await saveSectionGuidelines( page, 'Copy', 'Temporary copy guidance.' );

		const copyCard = getSectionCard( page, 'Copy' );
		await copyCard
			.getByRole( 'button', { name: 'Clear guidelines' } )
			.click();

		// Confirm the clear in the dialog.
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Clear guidelines' } )
			.click();

		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'Guidelines cleared.' } )
		).toBeVisible();

		await page.reload();
		await waitForGuidelinesApp( page );
		const reopened = getSectionCard( page, 'Copy' );
		await reopened
			.getByRole( 'button', { name: 'Copy', exact: true } )
			.click();
		await expect(
			reopened.getByRole( 'textbox', { name: 'Copy guidelines' } )
		).toHaveValue( '' );
	} );

	test( 'adds a block guideline', async ( { page, admin } ) => {
		await visitGuidelinesPage( page, admin );

		const blocksCard = getSectionCard( page, 'Blocks' );
		await blocksCard
			.getByRole( 'button', { name: 'Blocks', exact: true } )
			.click();
		await blocksCard
			.getByRole( 'button', { name: 'Add guidelines' } )
			.click();

		const dialog = page.getByRole( 'dialog', { name: 'Add guidelines' } );
		await expect( dialog ).toBeVisible();

		// Pick a content block in the combobox.
		const combobox = dialog.getByRole( 'combobox', { name: 'Block' } );
		await combobox.click();
		await combobox.fill( 'Paragraph' );
		await page
			.getByRole( 'option', { name: 'Paragraph', exact: true } )
			.click();

		await dialog
			.getByRole( 'textbox', { name: 'Guideline text' } )
			.fill( 'Keep paragraphs short.' );
		await dialog.getByRole( 'button', { name: 'Save guidelines' } ).click();

		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'Guidelines saved.' } )
		).toBeVisible();

		// The block now appears in the Blocks list.
		await expect(
			getSectionCard( page, 'Blocks' ).getByText( 'Paragraph' )
		).toBeVisible();
	} );

	test( 'exports and re-imports guidelines', async ( { page, admin } ) => {
		const copyText = 'Round-trip copy guidance.';

		await visitGuidelinesPage( page, admin );
		await saveSectionGuidelines( page, 'Copy', copyText );

		// Export and capture the downloaded file.
		const downloadPromise = page.waitForEvent( 'download' );
		await page.getByRole( 'button', { name: 'Export guidelines' } ).click();
		const download = await downloadPromise;
		const exportPath = await download.path();

		// Wipe everything, then import the file back.
		await page.evaluate( async () => {
			const rows = await window.wp.apiFetch( {
				path: '/wp/v2/knowledge?per_page=100&context=edit&status=publish,draft,private',
			} );
			for ( const row of rows ) {
				if ( row.slug && row.slug.startsWith( 'guideline-' ) ) {
					await window.wp.apiFetch( {
						path: `/wp/v2/knowledge/${ row.id }?force=true`,
						method: 'DELETE',
					} );
				}
			}
		} );
		await page.reload();
		await waitForGuidelinesApp( page );

		const fileChooserPromise = page.waitForEvent( 'filechooser' );
		await page.getByRole( 'button', { name: 'Import guidelines' } ).click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles( exportPath );

		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Continue' } )
			.click();

		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'Guidelines imported.' } )
		).toBeVisible();

		const copyCard = getSectionCard( page, 'Copy' );
		await copyCard
			.getByRole( 'button', { name: 'Copy', exact: true } )
			.click();
		await expect(
			copyCard.getByRole( 'textbox', { name: 'Copy guidelines' } )
		).toHaveValue( copyText );
	} );
} );
