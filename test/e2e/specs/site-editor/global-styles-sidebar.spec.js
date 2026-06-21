/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function openCSSClassesPanel( page ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Styles' } )
		.click();
	await page.getByRole( 'button', { name: 'CSS classes' } ).click();
}

async function updateGlobalStyles( requestUtils, styles ) {
	const globalStylesId =
		await requestUtils.getCurrentThemeGlobalStylesPostId();
	await requestUtils.rest( {
		method: 'PUT',
		path: `/wp/v2/global-styles/${ globalStylesId }`,
		data: { styles },
	} );
}

async function enableShowTemplate( editor, page ) {
	await page.evaluate( () => {
		window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
	} );
	await editor.openDocumentSettingsSidebar();

	const settingsPanel = page.getByRole( 'region', {
		name: 'Editor settings',
	} );
	await settingsPanel
		.getByRole( 'button', { name: 'Template options' } )
		.click();

	const showTemplateButton = page.getByRole( 'menuitemcheckbox', {
		name: 'Show template',
	} );
	if (
		( await showTemplateButton.getAttribute( 'aria-checked' ) ) !== 'true'
	) {
		await showTemplateButton.click();
	} else {
		await page.keyboard.press( 'Escape' );
	}
}

test.describe( 'Global styles sidebar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
		const globalStylesId =
			await requestUtils.getCurrentThemeGlobalStylesPostId();
		if ( globalStylesId ) {
			await requestUtils.rest( {
				method: 'PUT',
				path: `/wp/v2/global-styles/${ globalStylesId }`,
				data: {
					styles: {},
					settings: {},
				},
			} );
		}
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'should filter blocks list results', async ( { page } ) => {
		// Navigate to Styles -> Blocks.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Blocks' } )
			.click();

		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'heading' );

		// Matches both Heading and Accordion Item blocks.
		// The latter contains "heading" in its description.
		await expect(
			page.getByRole( 'button', { name: 'Heading', exact: true } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Accordion Item' } )
		).toBeVisible();
	} );

	test( 'should create CSS classes and show current usages', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Styled paragraph',
				className: 'featured-card',
			},
		} );

		const paragraph = editor.canvas.getByText( 'Styled paragraph' );

		await openCSSClassesPanel( page );
		await page.getByRole( 'button', { name: 'Add class' } ).click();
		await page
			.getByRole( 'textbox', { name: 'Class name' } )
			.fill( 'featured-card' );
		await page
			.getByRole( 'textbox', { name: 'CSS' } )
			.fill( 'color: rgb(255, 0, 0);' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await expect(
			page.getByRole( 'button', { name: '.featured-card' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: '1 use' } )
		).toBeVisible();
		await expect( paragraph ).toHaveCSS( 'color', 'rgb(255, 0, 0)' );

		await page.getByRole( 'button', { name: '1 use' } ).click();
		await expect(
			page.getByRole( 'heading', { name: 'Usages of .featured-card' } )
		).toBeVisible();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Paragraph' } )
		).toBeVisible();
	} );

	test( 'should count CSS classes used in edited page content', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.activateTheme( 'twentytwentythree' );
		const { id } = await requestUtils.createPage( {
			title: 'CSS class page usage',
			content: `<!-- wp:paragraph {"className":"featured-card"} -->
<p class="featured-card">Styled page paragraph</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.visitSiteEditor( {
			postId: id,
			postType: 'page',
			canvas: 'edit',
		} );
		await enableShowTemplate( editor, page );
		await expect
			.poll( async () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).getRenderingMode()
				)
			)
			.toBe( 'template-locked' );

		await openCSSClassesPanel( page );
		await page.getByRole( 'button', { name: 'Add class' } ).click();
		await page
			.getByRole( 'textbox', { name: 'Class name' } )
			.fill( 'featured-card' );
		await page
			.getByRole( 'textbox', { name: 'CSS' } )
			.fill( 'color: rgb(255, 0, 0);' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await expect(
			page.getByRole( 'button', { name: '1 use' } )
		).toBeVisible();
	} );

	test( 'should suggest managed CSS classes in block Advanced settings without limiting custom classes', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await updateGlobalStyles( requestUtils, {
			cssClasses: [
				{
					name: 'featured-card',
					css: 'color: rgb(255, 0, 0);',
				},
			],
		} );
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Class suggestions paragraph' },
		} );

		const paragraph = editor.canvas.getByText(
			'Class suggestions paragraph'
		);
		const settingsPanel = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await editor.openDocumentSettingsSidebar();
		await settingsPanel.getByRole( 'button', { name: 'Advanced' } ).click();

		const classField = settingsPanel.getByRole( 'combobox', {
			name: 'Additional CSS class(es)',
		} );
		await classField.fill( 'featured' );
		await page.getByRole( 'option', { name: 'featured-card' } ).click();
		await classField.fill( 'handmade-card' );
		await classField.press( 'Enter' );

		await expect( paragraph ).toHaveCSS( 'color', 'rgb(255, 0, 0)' );
		await expect
			.poll( async () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlock().attributes.className
				)
			)
			.toBe( 'featured-card handmade-card' );
	} );
} );
