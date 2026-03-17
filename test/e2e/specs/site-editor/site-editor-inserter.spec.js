/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Editor Inserter', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// We need the theme to have a section root so zoom out is enabled
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyfour' ),
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
		page,
		editor,
	} ) => {
		await InserterUtils.openBlockLibrary();
		await InserterUtils.closeBlockLibrary();

		await test.step( 'should open the inserter via enter keypress on toggle button', async () => {
			await InserterUtils.inserterButton.focus();
			await page.keyboard.press( 'Enter' );
			await expect( InserterUtils.blockLibrary ).toBeVisible();
		} );

		await test.step( 'should set focus to the blocks tab when opening the inserter', async () => {
			await expect(
				InserterUtils.getBlockLibraryTab( 'Blocks' )
			).toBeFocused();
		} );

		await test.step( 'should close the inserter via escape keypress', async () => {
			await page.keyboard.press( 'Escape' );
			await expect( InserterUtils.blockLibrary ).toBeHidden();
		} );

		await test.step( 'should focus inserter toggle button after closing the inserter via escape keypress', async () => {
			await expect( InserterUtils.inserterButton ).toBeFocused();
		} );

		// A test for https://github.com/WordPress/gutenberg/issues/43090.
		await test.step( 'should close the inserter when clicking on the toggle button', async () => {
			const beforeBlocks = await editor.getBlocks();

			await InserterUtils.openBlockLibrary();
			await InserterUtils.expectActiveTab( 'Blocks' );
			await InserterUtils.blockLibrary
				.getByRole( 'option', { name: 'Buttons' } )
				.click();

			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [ ...beforeBlocks, { name: 'core/buttons' } ] );

			await InserterUtils.closeBlockLibrary();
		} );
	} );

	test.describe( 'Inserter Zoom Level UX', () => {
		test.use( {
			ZoomUtils: async ( { editor, page }, use ) => {
				await use( new ZoomUtils( { editor, page } ) );
			},
		} );

		test( 'should intialize correct active tab based on zoom level', async ( {
			InserterUtils,
			ZoomUtils,
		} ) => {
			await test.step( 'should open the inserter to blocks tab from default zoom level', async () => {
				await InserterUtils.openBlockLibrary();
				await InserterUtils.expectActiveTab( 'Blocks' );

				// Zoom canvas should not be active
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.closeBlockLibrary();

				// Zoom canvas should not be active
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();
			} );

			await test.step( 'should open the inserter to patterns tab if zoomed out', async () => {
				await ZoomUtils.enterZoomOut();
				await InserterUtils.openBlockLibrary();
				await InserterUtils.expectActiveTab( 'Patterns' );

				// Zoom canvas should still be active
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();

				await InserterUtils.closeBlockLibrary();

				// We should still be in Zoom Out
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();
			} );
		} );

		test( 'should set the correct zoom level when changing tabs', async ( {
			InserterUtils,
			ZoomUtils,
		} ) => {
			await InserterUtils.openBlockLibrary();
			await InserterUtils.expectActiveTab( 'Blocks' );
			await expect( ZoomUtils.zoomCanvas ).toBeHidden();

			await test.step( 'should zoom out when activating patterns tab', async () => {
				await InserterUtils.activateTab( 'Patterns' );
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();
			} );

			await test.step( 'should reset zoom level when activating blocks tab', async () => {
				await InserterUtils.activateTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();
			} );

			await test.step( 'should zoom out when activating media tab', async () => {
				await InserterUtils.activateTab( 'Media' );
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();
			} );
		} );

		test( 'should reset the zoom level when closing the inserter if we most recently changed the zoom level', async ( {
			InserterUtils,
			ZoomUtils,
		} ) => {
			await test.step( 'should reset zoom when closing from patterns tab', async () => {
				await InserterUtils.openBlockLibrary();
				await InserterUtils.expectActiveTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.activateTab( 'Patterns' );
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();

				await InserterUtils.closeBlockLibrary();

				// Zoom Level should be reset
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();
			} );

			await test.step( 'should preserve default zoom level when closing from blocks tab', async () => {
				await InserterUtils.openBlockLibrary();
				await InserterUtils.expectActiveTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.activateTab( 'Media' );
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();

				await InserterUtils.activateTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.closeBlockLibrary();

				// Zoom Level should stay at default level
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();
			} );

			await test.step( 'should preserve default zoom level when closing from blocks tab even if user manually toggled zoom level on previous tab', async () => {
				await InserterUtils.openBlockLibrary();
				await InserterUtils.expectActiveTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.activateTab( 'Media' );
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();

				// Toggle zoom level manually
				await ZoomUtils.exitZoomOut();

				await InserterUtils.activateTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.closeBlockLibrary();

				// Zoom Level should stay at default level
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();
			} );

			await test.step( 'should preserve default zoom level when closing from blocks tab even if user manually toggled zoom level on previous tab twice', async () => {
				// Open inserter
				await InserterUtils.openBlockLibrary();
				await InserterUtils.expectActiveTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.activateTab( 'Media' );
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();

				// Toggle zoom level manually twice
				await ZoomUtils.exitZoomOut();
				await ZoomUtils.enterZoomOut();

				await InserterUtils.activateTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.closeBlockLibrary();

				// Zoom Level should stay at default level
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();
			} );
		} );

		test( 'should keep the zoom level manually set by the user if the user most recently set the zoom level', async ( {
			InserterUtils,
			ZoomUtils,
		} ) => {
			await test.step( 'should respect manual zoom level set when closing from patterns tab', async () => {
				await InserterUtils.openBlockLibrary();
				await InserterUtils.expectActiveTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.activateTab( 'Patterns' );
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();

				await ZoomUtils.exitZoomOut();

				await InserterUtils.closeBlockLibrary();

				// Zoom Level should stay reset
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();
			} );

			await test.step( 'should respect manual zoom level set when closing from patterns tab when toggled twice', async () => {
				await InserterUtils.openBlockLibrary();
				await InserterUtils.expectActiveTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await InserterUtils.activateTab( 'Patterns' );
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();

				await ZoomUtils.exitZoomOut();

				await ZoomUtils.enterZoomOut();

				await InserterUtils.closeBlockLibrary();

				// Should stay zoomed out since it was manually engaged
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();

				// Reset test
				await ZoomUtils.exitZoomOut();
			} );

			await test.step( 'should not reset zoom level if zoom level manually changed from blocks tab', async () => {
				await InserterUtils.openBlockLibrary();
				await expect( InserterUtils.blockLibrary ).toBeVisible();

				await InserterUtils.expectActiveTab( 'Blocks' );
				await expect( ZoomUtils.zoomCanvas ).toBeHidden();

				await ZoomUtils.enterZoomOut();

				await InserterUtils.closeBlockLibrary();

				// Should stay zoomed out since it was manually engaged
				await expect( ZoomUtils.zoomCanvas ).toBeVisible();
			} );
		} );
	} );
} );

class InserterUtils {
	constructor( { editor, page } ) {
		this.editor = editor;
		this.page = page;
		this.blockLibrary = this.page.getByRole( 'region', {
			name: 'Block Library',
		} );
		this.inserterButton = this.page.getByRole( 'button', {
			name: 'Block Inserter',
			exact: true,
		} );
	}

	// Manually naming as open and close these makes it clearer when reading
	// through the test instead of using a toggle method with a boolean
	async openBlockLibrary() {
		await this.inserterButton.click();
		await expect( this.blockLibrary ).toBeVisible();
	}

	async closeBlockLibrary() {
		await this.inserterButton.click();
		await expect( this.blockLibrary ).toBeHidden();
	}

	getBlockLibraryTab( name ) {
		return this.page.getByRole( 'tab', { name } );
	}

	async expectActiveTab( name ) {
		await expect( this.getBlockLibraryTab( name ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	}

	async activateTab( name ) {
		await this.getBlockLibraryTab( name ).click();
		// For brevity, adding this check here. It should always be done after the tab is clicked
		await this.expectActiveTab( name );
	}
}

class ZoomUtils {
	constructor( { editor, page } ) {
		this.editor = editor;
		this.page = page;
		this.zoomCanvas = this.page.locator( '.is-zoomed-out' );
		this.zoomButton = this.page.getByRole( 'button', {
			name: 'Zoom Out',
			exact: true,
		} );
	}

	// Manually naming as enter and exit these makes it clearer when reading
	// through the test instead of using a toggle method with a boolean
	async enterZoomOut() {
		await this.zoomButton.click();
		await expect( this.zoomCanvas ).toBeVisible();
	}

	async exitZoomOut() {
		await this.zoomButton.click();
		await expect( this.zoomCanvas ).toBeHidden();
	}
}
