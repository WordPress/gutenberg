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

	test( 'should edit CSS class pseudo-states', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Interactive paragraph',
				className: 'interactive-card',
			},
		} );

		const paragraph = editor.canvas.getByText( 'Interactive paragraph' );

		await openCSSClassesPanel( page );
		await page.getByRole( 'button', { name: 'Add class' } ).click();
		await page
			.getByRole( 'textbox', { name: 'Class name' } )
			.fill( 'interactive-card' );
		await page
			.getByRole( 'textbox', { name: 'CSS' } )
			.fill( 'color: rgb(255, 0, 0);' );
		await page.getByRole( 'tab', { name: 'Hover' } ).click();
		await page
			.getByRole( 'textbox', { name: 'Hover CSS' } )
			.fill( 'color: rgb(0, 0, 255);' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await expect( paragraph ).toHaveCSS( 'color', 'rgb(255, 0, 0)' );
		await paragraph.hover();
		await expect( paragraph ).toHaveCSS( 'color', 'rgb(0, 0, 255)' );
	} );

	test( 'should copy CSS class rules', async ( { page } ) => {
		await page.evaluate( () => {
			Object.defineProperty( window.navigator, 'clipboard', {
				configurable: true,
				value: {
					writeText: async ( text ) => {
						window.__copiedCSSClassRules = text;
					},
				},
			} );
		} );

		await openCSSClassesPanel( page );
		await page.getByRole( 'button', { name: 'Add class' } ).click();
		await page
			.getByRole( 'textbox', { name: 'Class name' } )
			.fill( 'copy-card' );
		await page
			.getByRole( 'textbox', { name: 'CSS' } )
			.fill( 'color: rgb(255, 0, 0);' );
		await page.getByRole( 'tab', { name: 'Hover' } ).click();
		await page
			.getByRole( 'textbox', { name: 'Hover CSS' } )
			.fill( 'color: rgb(0, 0, 255);' );
		await page.getByRole( 'button', { name: 'Copy CSS' } ).click();

		await expect(
			page.getByRole( 'button', { name: 'Copied' } )
		).toBeVisible();
		await expect
			.poll( () => page.evaluate( () => window.__copiedCSSClassRules ) )
			.toBe(
				'.copy-card {\n\tcolor: rgb(255, 0, 0);\n}\n\n.copy-card:hover {\n\tcolor: rgb(0, 0, 255);\n}'
			);
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

	test( 'should count CSS class usages across site content', async ( {
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
		await requestUtils.createPage( {
			title: 'Usage page one',
			content: `<!-- wp:paragraph {"className":"featured-card"} -->
<p class="featured-card">First page first usage</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"className":"featured-card"} -->
<p class="featured-card">First page second usage</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Usage page two',
			content: `<!-- wp:paragraph {"className":"featured-card"} -->
<p class="featured-card">Second page first usage</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"className":"featured-card"} -->
<p class="featured-card">Second page second usage</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await openCSSClassesPanel( page );

		await expect(
			page.getByRole( 'button', { name: '4 uses' } )
		).toBeVisible();

		await page.getByRole( 'button', { name: '4 uses' } ).click();
		await expect( page.getByText( '4 total usages found.' ) ).toBeVisible();
		await expect(
			page.getByText( 'Elsewhere on this site' )
		).toBeVisible();
		await expect( page.getByText( 'Usage page one' ) ).toHaveCount( 2 );
		await expect( page.getByText( 'Usage page two' ) ).toHaveCount( 2 );

		await page
			.getByRole( 'button', { name: /Usage page one/ } )
			.nth( 1 )
			.click();
		await expect(
			editor.canvas.getByText( 'First page second usage' )
		).toBeVisible();
		await expect
			.poll( async () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlock()?.attributes?.content
				)
			)
			.toBe( 'First page second usage' );
	} );

	test( 'should show CSS class conflicts only for managed classes', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await updateGlobalStyles( requestUtils, {
			cssClasses: [
				{
					name: 'wp-block-button',
					css: 'color: rgb(255, 0, 0);',
				},
			],
		} );
		await requestUtils.createPage( {
			title: 'Unmanaged class usage',
			content: `<!-- wp:paragraph {"className":"raw-card"} -->
<p class="raw-card">Unmanaged class paragraph</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await openCSSClassesPanel( page );

		const settingsPanel = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			settingsPanel.getByText( 'Class conflicts and provenance' )
		).toBeVisible();
		await expect(
			settingsPanel.getByText(
				'".wp-block-button" looks like a core block class and may collide with WordPress generated markup.'
			)
		).toBeVisible();
		await expect(
			settingsPanel.getByText(
				'".raw-card" is used in content but is not managed by global styles.'
			)
		).toHaveCount( 0 );
		await expect(
			settingsPanel.getByText( 'Defined by user global styles.' )
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

	test( 'should browse managed, document, and site CSS classes from block Advanced settings', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await updateGlobalStyles( requestUtils, {
			cssClasses: [
				{
					name: 'managed-card',
					css: 'color: rgb(255, 0, 0);',
				},
			],
		} );
		await requestUtils.createPage( {
			title: 'Elsewhere class usage',
			content: `<!-- wp:paragraph {"className":"elsewhere-card"} -->
<p class="elsewhere-card">Elsewhere class paragraph</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Document class source',
				className: 'current-card',
			},
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Class browser target' },
		} );

		const settingsPanel = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editor.openDocumentSettingsSidebar();
		await settingsPanel.getByRole( 'button', { name: 'Advanced' } ).click();
		await settingsPanel
			.getByRole( 'button', { name: 'Browse existing classes' } )
			.click();

		await expect(
			settingsPanel.getByText( 'Managed classes' )
		).toBeVisible();
		await expect(
			settingsPanel.getByText( 'Used in this document' )
		).toBeVisible();
		await expect(
			settingsPanel.getByText( 'Used elsewhere on this site' )
		).toBeVisible();

		await settingsPanel
			.getByRole( 'button', { name: '.managed-card' } )
			.click();
		await settingsPanel
			.getByRole( 'button', { name: '.current-card' } )
			.click();
		await settingsPanel
			.getByRole( 'button', { name: '.elsewhere-card' } )
			.click();

		await expect
			.poll( async () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlock().attributes.className
				)
			)
			.toBe( 'managed-card current-card elsewhere-card' );
	} );

	test( 'should rename CSS classes and update persisted usages', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await updateGlobalStyles( requestUtils, {
			cssClasses: [
				{
					name: 'rename-card',
					css: 'color: rgb(255, 0, 0);',
				},
			],
		} );
		const { id } = await requestUtils.createPage( {
			title: 'Rename class usage',
			content: `<!-- wp:paragraph {"className":"rename-card"} -->
<p class="rename-card">First rename usage</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"className":"rename-card"} -->
<p class="rename-card">Second rename usage</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await openCSSClassesPanel( page );

		await page.getByRole( 'button', { name: '.rename-card' } ).click();
		await page
			.getByRole( 'textbox', { name: 'Class name' } )
			.fill( 'renamed-card' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await expect(
			page.getByText(
				'Rename ".rename-card" to ".renamed-card" and update all existing usages?'
			)
		).toBeVisible();
		await expect(
			page.getByText( '2 existing usages will be affected.' )
		).toBeVisible();
		await page
			.getByRole( 'button', { name: 'Rename and update usages' } )
			.click();

		await expect(
			page.getByRole( 'button', { name: '.renamed-card' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: '2 uses' } )
		).toBeVisible();

		await expect
			.poll( async () => {
				const updatedPage = await requestUtils.rest( {
					path: `/wp/v2/pages/${ id }?context=edit`,
				} );
				return updatedPage.content.raw;
			} )
			.toContain( 'renamed-card' );
		const updatedPage = await requestUtils.rest( {
			path: `/wp/v2/pages/${ id }?context=edit`,
		} );
		expect( updatedPage.content.raw ).not.toContain( 'rename-card' );
	} );

	test( 'should warn about affected usages before deleting CSS classes', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await updateGlobalStyles( requestUtils, {
			cssClasses: [
				{
					name: 'delete-card',
					css: 'color: rgb(255, 0, 0);',
				},
			],
		} );
		await requestUtils.createPage( {
			title: 'Delete class usage',
			content: `<!-- wp:paragraph {"className":"delete-card"} -->
<p class="delete-card">Delete usage paragraph</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await openCSSClassesPanel( page );

		await page.getByRole( 'button', { name: '.delete-card' } ).click();
		await page
			.getByRole( 'button', { name: 'Delete', exact: true } )
			.click();

		await expect(
			page.getByText(
				'Are you sure you want to delete ".delete-card"? Blocks using this class will keep the class name, but it will no longer be managed by global styles.'
			)
		).toBeVisible();
		await expect(
			page.getByText( '1 existing usage will be affected.' )
		).toBeVisible();
		await expect( page.getByText( 'Delete class usage' ) ).toBeVisible();

		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Delete' } )
			.click();
		await expect( page.getByText( 'No CSS classes yet.' ) ).toBeVisible();
	} );
} );
