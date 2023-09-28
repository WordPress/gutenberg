/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Patterns', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllBlocks();
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
	} );

	test( 'create a new pattern', async ( { page, editor, admin } ) => {
		await admin.visitSiteEditor();

		const navigation = page.getByRole( 'region', { name: 'Navigation' } );
		const patternsContent = page.getByRole( 'region', {
			name: 'Patterns content',
		} );

		await navigation.getByRole( 'button', { name: 'Patterns' } ).click();

		await expect(
			navigation.getByRole( 'heading', { name: 'Patterns', level: 1 } )
		).toBeVisible();
		await expect( patternsContent ).toContainText( 'No patterns found.' );

		await navigation
			.getByRole( 'button', { name: 'Create pattern' } )
			.click();

		const createPatternMenu = page.getByRole( 'menu', {
			name: 'Create pattern',
		} );
		await expect(
			createPatternMenu.getByRole( 'menuitem', {
				name: 'Create pattern',
			} )
		).toBeFocused();
		await createPatternMenu
			.getByRole( 'menuitem', { name: 'Create pattern' } )
			.click();

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'Create pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'My pattern' );
		await page.keyboard.press( 'Enter' );
		await expect(
			createPatternDialog.getByRole( 'button', { name: 'Create' } )
		).toBeDisabled();

		await expect( page ).toHaveTitle( /^My pattern/ );
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'heading', { name: 'My pattern', level: 1 } )
		).toBeVisible();

		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'My pattern' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();
		await page
			.getByRole( 'region', { name: 'Save panel' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'Site updated' );

		await page.getByRole( 'button', { name: 'Open navigation' } ).click();
		await navigation.getByRole( 'button', { name: 'Back' } ).click();
		// TODO: await expect( page ).toHaveTitle( /^Patterns/ );

		await expect(
			navigation.getByRole( 'button', { name: 'All patterns' } )
		).toContainText( '1' );
		await expect(
			navigation.getByRole( 'button', { name: 'My patterns' } )
		).toContainText( '1' );
		await expect(
			navigation.getByRole( 'button', { name: 'Uncategorized' } )
		).toContainText( '1' );

		await expect(
			patternsContent.getByRole( 'heading', {
				name: 'All patterns',
				level: 2,
			} )
		).toBeVisible();
		const patternsList = patternsContent.getByRole( 'list', {
			name: 'All patterns',
		} );
		await expect( patternsList.getByRole( 'listitem' ) ).toHaveCount( 1 );
		await expect(
			patternsList
				.getByRole( 'heading', { name: 'My pattern' } )
				.getByRole( 'button', { name: 'My pattern', exact: true } )
		).toBeVisible();
	} );
} );
