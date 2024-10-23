/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Editor Inserter', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor();
		await editor.canvas.locator( 'body' ).click();
	} );

	test.use( {
		InserterUtils: async ( { editor, page }, use ) => {
			await use( new InserterUtils( { editor, page } ) );
		},
	} );

	test( 'inserter toggle button should toggle global inserter', async ( {
		InserterUtils,
	} ) => {
		const inserterButton = InserterUtils.getInserterButton();

		await inserterButton.click();

		const blockLibrary = InserterUtils.getBlockLibrary();

		// Visibility check
		await expect( blockLibrary ).toBeVisible();
		await inserterButton.click();
		//Hidden State check
		await expect( blockLibrary ).toBeHidden();
	} );

	// A test for https://github.com/WordPress/gutenberg/issues/43090.
	test( 'should close the inserter when clicking on the toggle button', async ( {
		editor,
		InserterUtils,
	} ) => {
		const inserterButton = InserterUtils.getInserterButton();
		const blockLibrary = InserterUtils.getBlockLibrary();

		const beforeBlocks = await editor.getBlocks();

		await inserterButton.click();
		await InserterUtils.getBlockLibraryTab( 'Blocks' ).click();
		await blockLibrary.getByRole( 'option', { name: 'Buttons' } ).click();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ ...beforeBlocks, { name: 'core/buttons' } ] );

		await inserterButton.click();

		await expect( blockLibrary ).toBeHidden();
	} );

	test( 'should open the inserter to patterns tab if using zoom out', async ( {
		InserterUtils,
	} ) => {
		const zoomOutButton = InserterUtils.getZoomOutButton();
		const inserterButton = InserterUtils.getInserterButton();
		const blockLibrary = InserterUtils.getBlockLibrary();

		await zoomOutButton.click();
		await expect( await InserterUtils.getZoomCanvas() ).toBeVisible();

		await inserterButton.click();
		const patternsTab = InserterUtils.getBlockLibraryTab( 'Patterns' );
		await expect( patternsTab ).toHaveAttribute(
			'data-active-item',
			'true'
		);
		await expect( await InserterUtils.getZoomCanvas() ).toBeVisible();

		await inserterButton.click();

		await expect( blockLibrary ).toBeHidden();

		// We should still be in Zoom Out
		await expect( await InserterUtils.getZoomCanvas() ).toBeVisible();
	} );

	test( 'should enter zoom out from patterns tab and exit zoom out when closing the inserter', async ( {
		InserterUtils,
	} ) => {
		const inserterButton = InserterUtils.getInserterButton();
		const blockLibrary = InserterUtils.getBlockLibrary();

		await inserterButton.click();
		await expect( await InserterUtils.getZoomCanvas() ).toBeHidden();

		const blocksTab = InserterUtils.getBlockLibraryTab( 'Blocks' );
		await expect( blocksTab ).toHaveAttribute( 'data-active-item', 'true' );

		const patternsTab = InserterUtils.getBlockLibraryTab( 'Patterns' );
		await patternsTab.click();
		await expect( patternsTab ).toHaveAttribute(
			'data-active-item',
			'true'
		);
		await expect( await InserterUtils.getZoomCanvas() ).toBeVisible();

		await inserterButton.click();

		await expect( blockLibrary ).toBeHidden();

		await expect( await InserterUtils.getZoomCanvas() ).toBeHidden();
	} );

	test( 'should return you to zoom out if starting from zoom out', async ( {
		InserterUtils,
	} ) => {
		const zoomOutButton = InserterUtils.getZoomOutButton();
		const inserterButton = InserterUtils.getInserterButton();
		const blockLibrary = InserterUtils.getBlockLibrary();

		await zoomOutButton.click();
		await expect( await InserterUtils.getZoomCanvas() ).toBeVisible();

		await inserterButton.click();
		const patternsTab = InserterUtils.getBlockLibraryTab( 'Patterns' );
		await expect( patternsTab ).toHaveAttribute(
			'data-active-item',
			'true'
		);
		await expect( await InserterUtils.getZoomCanvas() ).toBeVisible();

		const blocksTab = InserterUtils.getBlockLibraryTab( 'Blocks' );
		await blocksTab.click();
		await expect( blocksTab ).toHaveAttribute( 'data-active-item', 'true' );

		await expect( await InserterUtils.getZoomCanvas() ).toBeHidden();

		// Close the inserter
		await inserterButton.click();

		await expect( blockLibrary ).toBeHidden();

		// We should return to zoom out since we started from there
		await expect( await InserterUtils.getZoomCanvas() ).toBeVisible();
	} );
} );

class InserterUtils {
	constructor( { editor, page } ) {
		this.editor = editor;
		this.page = page;
	}

	getInserterButton() {
		return this.page.getByRole( 'button', {
			name: 'Block Inserter',
			exact: true,
		} );
	}

	getBlockLibrary() {
		return this.page.getByRole( 'region', {
			name: 'Block Library',
		} );
	}

	getBlockLibraryTab( name ) {
		return this.page.getByRole( 'tab', { name } );
	}

	getZoomOutButton() {
		return this.page.getByRole( 'button', {
			name: 'Zoom Out',
			exact: true,
		} );
	}

	getZoomCanvas() {
		return this.page.locator( '.is-zoomed-out' );
	}
}
