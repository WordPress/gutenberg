const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const TEST_PAGE_TITLE = 'Test Page for Block Style Variations';

async function selectBlockStyleVariation( page, variationName ) {
	const editorSettings = page.getByRole( 'region', {
		name: 'Editor settings',
	} );
	// The sidebar can sit on the document tab (notably after a rendering
	// mode switch in the extensible site editor); the variation controls
	// live in the block inspector.
	const blockTab = editorSettings.getByRole( 'tab', {
		name: 'Block',
		exact: true,
	} );
	if ( await blockTab.isVisible() ) {
		await blockTab.click();
	}
	const stylesTab = editorSettings.getByRole( 'tab', { name: 'Styles' } );
	const variationRadio = editorSettings.getByRole( 'radio', {
		name: variationName,
	} );

	const visibleControl = await Promise.any( [
		stylesTab.waitFor( { state: 'visible' } ).then( () => 'styles-tab' ),
		variationRadio
			.waitFor( { state: 'visible' } )
			.then( () => 'variation-radio' ),
	] );

	if ( visibleControl === 'styles-tab' ) {
		await stylesTab.click();
	}

	await variationRadio.click();
}

test.use( {
	siteEditorBlockStyleVariations: async ( { page, editor }, use ) => {
		await use( new SiteEditorBlockStyleVariations( { page, editor } ) );
	},
} );

// Whether the run targets the extensible site editor (v2).
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

test.describe( 'Block Style Variations', () => {
	let stylesPostId;

	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme(
				'gutenberg-test-themes/style-variations'
			),
		] );
		stylesPostId = await requestUtils.getCurrentThemeGlobalStylesPostId();
	} );

	test.beforeEach( async ( { requestUtils, admin } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			admin.visitSiteEditor(),
		] );
	} );

	test.afterEach( async ( { page } ) => {
		await page.evaluate( async () => {
			window.wp.data
				.dispatch( 'core/editor' )
				.setRenderingMode( 'post-only' );
		}, [] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		// Reset the global styles saved by these tests so they don't leak
		// into other specs that share this theme's global styles.
		await requestUtils.resetThemeGlobalStyles();
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test( 'apply block styles variations to nested blocks', async ( {
		editor,
		page,
	} ) => {
		await draftNewPage( page );
		await addPageContent( editor, page );
		const firstGroup = editor.canvas
			.locator( '[data-type="core/group"]' )
			.first();
		const secondGroup = editor.canvas
			.locator( '[data-type="core/group"]' )
			.nth( 1 );
		const thirdGroup = editor.canvas
			.locator( '[data-type="core/group"]' )
			.nth( 2 );

		// Apply a block style to the parent Group block.
		await editor.selectBlocks( firstGroup );
		await editor.openDocumentSettingsSidebar();
		await selectBlockStyleVariation( page, 'Block Style Variation A' );

		// Check parent styles have variation A styles.
		await expect( firstGroup ).toHaveCSS( 'border-style', 'dotted' );
		await expect( firstGroup ).toHaveCSS( 'border-width', '1px' );

		// Check nested child and grandchild group block variation A inherited styles.
		await expect( secondGroup ).toHaveCSS( 'border-style', 'solid' );
		await expect( secondGroup ).toHaveCSS( 'border-width', '11px' );
		await expect( thirdGroup ).toHaveCSS( 'border-style', 'solid' );
		await expect( thirdGroup ).toHaveCSS( 'border-width', '11px' );

		// Apply a block style to the nested child Group block.
		await editor.selectBlocks( secondGroup );
		await selectBlockStyleVariation( page, 'Block Style Variation B' );

		// Check nested child styles have variation B styles.
		await expect( secondGroup ).toHaveCSS( 'border-style', 'dashed' );
		await expect( secondGroup ).toHaveCSS( 'border-width', '2px' );

		// Check nested grandchild Group block variation B inherited styles.
		await expect( thirdGroup ).toHaveCSS( 'border-style', 'groove' );
		await expect( thirdGroup ).toHaveCSS( 'border-width', '22px' );

		// Apply a block style to the nested grandchild Group block.
		await editor.selectBlocks( thirdGroup );
		await selectBlockStyleVariation( page, 'Block Style Variation A' );

		// Check that the child's inner block styles from variation B are overridden by the grandchild's block style variation A.
		await expect( thirdGroup ).toHaveCSS( 'border-style', 'dotted' );
		await expect( thirdGroup ).toHaveCSS( 'border-width', '1px' );
	} );

	// In the extensible site editor, programmatic block selection right
	// after switching the rendering mode to 'template-locked' does not
	// stick (the inspector stays on "No block selected") — needs its own
	// investigation before this scenario can run there.
	test( 'update block style variations in global styles and check revisions match styles @site-editor-v1-only', async ( {
		editor,
		page,
		siteEditorBlockStyleVariations,
	} ) => {
		await draftNewPage( page );
		await addPageContent( editor, page );
		// switch to template mode (access to global styles)
		await page.evaluate( async () => {
			window.wp.data
				.dispatch( 'core/editor' )
				.setRenderingMode( 'template-locked' );
		}, [] );
		// Wait for the template-locked canvas to re-render before selecting
		// blocks, so the re-render cannot drop the selection.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Content' } )
		).toBeVisible();
		const firstGroup = editor.canvas
			.locator( '[data-type="core/group"]' )
			.first();
		const secondGroup = editor.canvas
			.locator( '[data-type="core/group"]' )
			.nth( 1 );
		const thirdGroup = editor.canvas
			.locator( '[data-type="core/group"]' )
			.nth( 2 );

		// Apply a block style to the parent Group block.
		await editor.selectBlocks( firstGroup );
		await editor.openDocumentSettingsSidebar();
		await selectBlockStyleVariation( page, 'Block Style Variation A' );

		// Apply a block style to the first, nested Group block.
		await editor.selectBlocks( secondGroup );
		await selectBlockStyleVariation( page, 'Block Style Variation B' );

		// Update user global styles with new block style variation values.
		// First revision.
		await siteEditorBlockStyleVariations.saveRevision( stylesPostId, {
			blocks: {
				'core/group': {
					variations: {
						'block-style-variation-a': {
							border: {
								width: '3px',
								style: 'outset',
							},
						},
						'block-style-variation-b': {
							border: {
								width: '4px',
								style: 'double',
							},
						},
					},
				},
			},
		} );

		// Wait for the save button to be re-enabled.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save' } )
		).toBeVisible();

		// Second revision (current).
		await siteEditorBlockStyleVariations.saveRevision( stylesPostId, {
			blocks: {
				'core/group': {
					variations: {
						'block-style-variation-a': {
							border: {
								width: '7px',
								style: 'dotted',
							},
						},
						'block-style-variation-b': {
							border: {
								width: '8px',
								style: 'dotted',
							},
						},
					},
				},
			},
		} );

		// Check parent styles.
		await expect( firstGroup ).toHaveCSS( 'border-style', 'dotted' );
		await expect( firstGroup ).toHaveCSS( 'border-width', '7px' );

		// Check nested child styles.
		await expect( secondGroup ).toHaveCSS( 'border-style', 'dotted' );
		await expect( secondGroup ).toHaveCSS( 'border-width', '8px' );

		// Check nested grandchild group block inherited styles.
		await expect( thirdGroup ).toHaveCSS( 'border-style', 'groove' );
		await expect( thirdGroup ).toHaveCSS( 'border-width', '22px' );

		// The initial revision styles should match the editor canvas.
		await siteEditorBlockStyleVariations.openStylesPanel();
		const revisionsButton = page.getByRole( 'button', {
			name: 'Revisions',
			exact: true,
		} );
		await revisionsButton.click();
		await expect(
			page.locator( 'iframe[name="revisions"]' )
		).toBeVisible();
		const revisionIframe = page.frameLocator( '[name="revisions"]' );

		const revisionFirstGroup = revisionIframe
			.locator( '[data-type="core/group"]' )
			.first();
		const revisionSecondGroup = revisionIframe
			.locator( '[data-type="core/group"]' )
			.nth( 1 );
		const revisionThirdGroup = revisionIframe
			.locator( '[data-type="core/group"]' )
			.nth( 2 );

		// Check parent styles have current revision.
		await expect( revisionFirstGroup ).toHaveCSS(
			'border-style',
			'dotted'
		);
		await expect( revisionFirstGroup ).toHaveCSS( 'border-width', '7px' );

		// Check nested child styles have current revision.
		await expect( revisionSecondGroup ).toHaveCSS(
			'border-style',
			'dotted'
		);
		await expect( revisionSecondGroup ).toHaveCSS( 'border-width', '8px' );

		// Check nested grandchild group block inherited styles from current revision.
		await expect( revisionThirdGroup ).toHaveCSS(
			'border-style',
			'groove'
		);
		await expect( revisionThirdGroup ).toHaveCSS( 'border-width', '22px' );

		// Click on previous revision.
		await page
			.getByRole( 'option', {
				name: /^Changes saved by /,
			} )
			.nth( 1 )
			.click();

		// Check parent styles have previous revision.
		await expect( revisionFirstGroup ).toHaveCSS( 'border-width', '3px' );

		// Check nested child style have previous revision.
		await expect( revisionSecondGroup ).toHaveCSS(
			'border-style',
			'double'
		);
		await expect( revisionSecondGroup ).toHaveCSS( 'border-width', '4px' );

		// Check nested grandchild group block inherited styles from previous revision.
		await expect( revisionThirdGroup ).toHaveCSS(
			'border-style',
			'groove'
		);
		await expect( revisionThirdGroup ).toHaveCSS( 'border-width', '22px' );
	} );
} );

class SiteEditorBlockStyleVariations {
	constructor( { page, editor } ) {
		this.page = page;
		this.editor = editor;
	}

	async openStylesPanel() {
		await this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
	}

	async saveRevision( stylesPostId, styles = {}, settings = {} ) {
		await this.page.evaluate(
			async ( [ _stylesPostId, _styles, _settings ] ) => {
				window.wp.data
					.dispatch( 'core' )
					.editEntityRecord( 'root', 'globalStyles', _stylesPostId, {
						id: _stylesPostId,
						settings: _settings,
						styles: _styles,
					} );
			},
			[ stylesPostId, styles, settings ]
		);
		await this.editor.saveSiteEditorEntities();
	}
}

async function draftNewPage( page ) {
	// The extensible site editor's Add Page opens a fresh page directly in
	// the editor instead of prompting for a title in a dialog.
	if ( isSiteEditorV2 ) {
		await page.getByRole( 'link', { name: 'Pages' } ).click();
		await page.getByRole( 'button', { name: 'Add Page' } ).click();
		await page
			.frameLocator( '[name="editor-canvas"]' )
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( TEST_PAGE_TITLE );
		// Persist the draft, like the classic editor's creation dialog does —
		// switching to template mode later needs a saved page to resolve its
		// template.
		await page.getByRole( 'button', { name: 'Save draft' } ).click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'saved' );
		return;
	}
	await page.getByRole( 'button', { name: 'Pages' } ).click();
	await page.getByRole( 'button', { name: 'Add page' } ).click();
	await page
		.locator( 'role=dialog[name="Draft new: page"i]' )
		.locator( 'role=textbox[name="title"i]' )
		.fill( TEST_PAGE_TITLE );
	await page.keyboard.press( 'Enter' );
	await expect(
		page.locator(
			`role=button[name="Dismiss this notice"i] >> text='"${ TEST_PAGE_TITLE }" successfully created.'`
		)
	).toBeVisible();
}

// Create a Group block with 2 nested Group blocks.
async function addPageContent( editor, page ) {
	const inserterButton = page.locator(
		'role=button[name="Block Inserter"i]'
	);
	await inserterButton.click();
	await page.getByRole( 'searchbox', { name: 'Search' } ).type( 'Group' );
	await page
		.getByRole( 'listbox', { name: 'Blocks' } )
		.getByRole( 'option', { name: 'Group' } )
		.click();
	await editor.canvas
		.locator( 'role=button[name="Group: Gather blocks in a container."i]' )
		.click();
	await editor.canvas.locator( 'role=button[name="Add block"i]' ).click();
	await page
		.getByRole( 'listbox', { name: 'Blocks' } )
		.getByRole( 'option', { name: 'Paragraph' } )
		.click();
	await page.keyboard.type( 'Parent Group Block with a Paragraph' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( '/group' );
	await expect(
		page.locator( 'role=option[name="Group"i][selected]' )
	).toBeVisible();
	await page.keyboard.press( 'Enter' );
	await editor.canvas
		.locator( 'role=button[name="Group: Gather blocks in a container."i]' )
		.click();
	await editor.canvas.locator( 'role=button[name="Add block"i]' ).click();
	await page
		.getByRole( 'listbox', { name: 'Blocks' } )
		.getByRole( 'option', { name: 'Paragraph' } )
		.click();
	await page.keyboard.type( 'Child Group Block with a Paragraph' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( '/group' );
	await expect(
		page.locator( 'role=option[name="Group"i][selected]' )
	).toBeVisible();
	await page.keyboard.press( 'Enter' );
	await editor.canvas
		.locator( 'role=button[name="Group: Gather blocks in a container."i]' )
		.click();
	await editor.canvas.locator( 'role=button[name="Add block"i]' ).click();
	await page
		.getByRole( 'listbox', { name: 'Blocks' } )
		.getByRole( 'option', { name: 'Paragraph' } )
		.click();
	await page.keyboard.type( 'Grandchild Group Block with a Paragraph' );
	await page.getByRole( 'button', { name: 'Publish', exact: true } ).click();
}
