/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const dashIconRegex = /<span.*?class=".*?dashicons-cart.*?">.*?<\/span>/;
const circleString =
	'<circle cx="10" cy="10" r="10" fill="red" stroke="blue" stroke-width="10"></circle>';
const svgIcon = new RegExp(
	`<svg.*?viewBox="0 0 20 20".*?>${ circleString }</svg>`
);

test.describe( 'Block Icons', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-icons' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-icons' );
	} );

	test( 'Block with svg icon', async ( { editor, page } ) => {
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await blockLibrary.getByRole( 'searchbox' ).fill( 'TestSimpleSvgIcon' );

		const blockOption = blockLibrary.getByRole( 'option', {
			name: 'TestSimpleSvgIcon',
		} );
		const blockIcon = blockOption.locator( '.block-editor-block-icon' );

		// Renders correctly the icon in the inserter.
		await expect.poll( () => blockIcon.innerHTML() ).toMatch( svgIcon );

		// Can insert the block.
		await blockOption.click();
		await expect(
			page.getByRole( 'document', { name: 'Block: TestSimpleSvgIcon' } )
		).toBeVisible();

		// Renders correctly the icon on the inspector.
		await editor.openDocumentSettingsSidebar();
		const inspectorIcon = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.block-editor-block-icon' );
		await expect.poll( () => inspectorIcon.innerHTML() ).toMatch( svgIcon );
	} );

	test( 'Block with dash icon', async ( { editor, page } ) => {
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await blockLibrary
			.getByRole( 'searchbox' )
			.fill( 'TestSimpleDashIcon' );

		const blockOption = blockLibrary.getByRole( 'option', {
			name: 'TestSimpleDashIcon',
		} );
		const blockIcon = blockOption.locator( '.block-editor-block-icon' );

		// Renders correctly the icon in the inserter.
		await expect
			.poll( () => blockIcon.innerHTML() )
			.toMatch( dashIconRegex );

		// Can insert the block
		await blockOption.click();
		await expect(
			page.getByRole( 'document', { name: 'Block: TestSimpleDashIcon' } )
		).toBeVisible();

		// Renders correctly the icon on the inspector.
		await editor.openDocumentSettingsSidebar();
		const inspectorIcon = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.block-editor-block-icon' );
		await expect
			.poll( () => inspectorIcon.innerHTML() )
			.toMatch( dashIconRegex );
	} );

	test( 'Block with function icon', async ( { editor, page } ) => {
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await blockLibrary.getByRole( 'searchbox' ).fill( 'TestFunctionIcon' );

		const blockOption = blockLibrary.getByRole( 'option', {
			name: 'TestFunctionIcon',
		} );
		const blockIcon = blockOption.locator( '.block-editor-block-icon' );

		// Renders correctly the icon in the inserter.
		await expect.poll( () => blockIcon.innerHTML() ).toMatch( svgIcon );

		// Can insert the block.
		await blockOption.click();
		await expect(
			page.getByRole( 'document', { name: 'Block: TestFunctionIcon' } )
		).toBeVisible();

		// Renders correctly the icon on the inspector.
		await editor.openDocumentSettingsSidebar();
		const inspectorIcon = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.block-editor-block-icon' );
		await expect.poll( () => inspectorIcon.innerHTML() ).toMatch( svgIcon );
	} );

	test( 'Block with dash icon and background/foreground colors', async ( {
		editor,
		page,
	} ) => {
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await blockLibrary
			.getByRole( 'searchbox' )
			.fill( 'TestDashIconColors' );

		const blockOption = blockLibrary.getByRole( 'option', {
			name: 'TestDashIconColors',
		} );
		const blockIcon = blockOption.locator( '.block-editor-block-icon' );

		await expect( blockIcon ).toHaveCSS(
			'background-color',
			'rgb(1, 0, 0)'
		);
		await expect( blockIcon ).toHaveCSS( 'color', 'rgb(254, 0, 0)' );
		await expect
			.poll( () => blockIcon.innerHTML() )
			.toMatch( dashIconRegex );

		await blockOption.click();
		await editor.openDocumentSettingsSidebar();

		const inspectorIcon = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.block-editor-block-icon' );

		await expect( inspectorIcon ).toHaveCSS(
			'background-color',
			'rgb(1, 0, 0)'
		);
		await expect( inspectorIcon ).toHaveCSS( 'color', 'rgb(254, 0, 0)' );
		await expect
			.poll( () => inspectorIcon.innerHTML() )
			.toMatch( dashIconRegex );
	} );

	test( 'Block with svg icon and background should compute a readable foreground color', async ( {
		editor,
		page,
	} ) => {
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await blockLibrary
			.getByRole( 'searchbox' )
			.fill( 'TestSvgIconBackground' );

		const blockOption = blockLibrary.getByRole( 'option', {
			name: 'TestSvgIconBackground',
		} );
		const blockIcon = blockOption.locator( '.block-editor-block-icon' );

		await expect( blockIcon ).toHaveCSS(
			'background-color',
			'rgb(1, 0, 0)'
		);
		await expect( blockIcon ).toHaveCSS( 'color', 'rgb(248, 249, 249)' );
		await expect.poll( () => blockIcon.innerHTML() ).toMatch( svgIcon );

		await blockOption.click();
		await editor.openDocumentSettingsSidebar();

		const inspectorIcon = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.block-editor-block-icon' );

		await expect( inspectorIcon ).toHaveCSS(
			'background-color',
			'rgb(1, 0, 0)'
		);
		await expect( inspectorIcon ).toHaveCSS(
			'color',
			'rgb(248, 249, 249)'
		);
		await expect.poll( () => inspectorIcon.innerHTML() ).toMatch( svgIcon );
	} );
} );
