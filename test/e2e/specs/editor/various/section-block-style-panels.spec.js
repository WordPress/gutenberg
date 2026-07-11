/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// A top-level `contentOnly` locked Group is treated as a section block when
// selected, so it exercises the curated section-block inspector without
// needing the Site Editor. The non-locked Group is otherwise identical, so the
// content-only lock is the only variable between the two tests.
const SECTION_BLOCK = `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Section content</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

const NORMAL_BLOCK = `<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Normal content</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

test.describe( 'Section block style panels', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'a section block exposes curated Typography (text color), Background (color/gradient, no image) and Elements panels, each once', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert the section block via the code editor.
		await pageUtils.pressKeys( 'secondary+M' );
		await page
			.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( SECTION_BLOCK );
		await pageUtils.pressKeys( 'secondary+M' );

		await editor.openDocumentSettingsSidebar();

		// Select the section (contentOnly Group) block.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Group' } )
			.click();

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editorSettings.getByRole( 'tab', { name: 'Styles' } ).click();

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		// The three curated panels are present, each exactly once (guards
		// against duplication).
		await expect(
			editorSettings.getByRole( 'heading', {
				name: 'Typography',
				exact: true,
			} )
		).toHaveCount( 1 );
		await expect(
			editorSettings.getByRole( 'heading', {
				name: 'Background',
				exact: true,
			} )
		).toHaveCount( 1 );
		await expect(
			editorSettings.getByRole( 'heading', {
				name: 'Elements',
				exact: true,
			} )
		).toHaveCount( 1 );

		// The Typography panel exposes only the text color control — none of
		// the font controls (size/family/etc.) leak into a section block, so
		// the font-size control is absent from the whole Styles tab.
		await expect(
			typographyPanel.getByRole( 'button', {
				name: 'Color',
				exact: true,
			} )
		).toBeVisible();
		await expect(
			editorSettings.getByRole( 'group', { name: 'Font size' } )
		).toHaveCount( 0 );

		// The Background panel exposes color/gradient but not the background
		// image control.
		await expect(
			backgroundPanel.getByRole( 'button', {
				name: 'Color',
				exact: true,
			} )
		).toBeVisible();
		await expect(
			backgroundPanel.getByRole( 'button', {
				name: 'Image',
				exact: true,
			} )
		).toHaveCount( 0 );

		// The Typography color control writes to the section block, proving the
		// direct-rendered panel's round-trip works end to end (not just that it
		// renders).
		await typographyPanel
			.getByRole( 'button', { name: 'Color', exact: true } )
			.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return (
					block.attributes.textColor ||
					block.attributes.style?.color?.text
				);
			} )
			.toBeTruthy();
	} );

	test( 'a normal (non-section) block still shows the full Typography panel', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await pageUtils.pressKeys( 'secondary+M' );
		await page
			.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( NORMAL_BLOCK );
		await pageUtils.pressKeys( 'secondary+M' );

		await editor.openDocumentSettingsSidebar();

		// Select the Group (a normal, non-section block). `selectBlocks`
		// targets the Group itself rather than click-through to its content.
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Group' } )
		);

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// A normal (non-section) block renders the single-column block
		// inspector, where the full Typography panel — including the font
		// controls — is shown directly. The section-block curation must not
		// strip typography from regular blocks.
		await expect(
			editorSettings.getByRole( 'heading', {
				name: 'Typography',
				exact: true,
			} )
		).toBeVisible();
		await expect(
			editorSettings.getByRole( 'group', { name: 'Font size' } )
		).toBeVisible();
	} );
} );
