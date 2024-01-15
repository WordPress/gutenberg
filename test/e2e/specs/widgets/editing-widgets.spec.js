/**
 * WordPress dependencies
 */
const {
	test: base,
	expect,
} = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@wordpress/e2e-test-utils-playwright').Editor} Editor */
/** @typedef {import('@playwright/test').Locator} Locator */

/** @type {ReturnType<typeof base.extend<{widgetsScreen: WidgetsScreen}>>} */
const test = base.extend( {
	widgetsScreen: async ( { page, editor }, use ) => {
		await use( new WidgetsScreen( { page, editor } ) );
	},
} );

test.describe( 'Widgets screen', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitAdminPage( 'widgets.php' );

		await editor.setPreferences( 'core/edit-widgets', {
			welcomeGuide: false,
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllWidgets();
	} );

	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			// TODO: Ideally we can bundle our test theme directly in the repo.
			requestUtils.activateTheme( 'twentytwenty' ),
			requestUtils.deleteAllWidgets(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Should insert content using the global inserter', async ( {
		page,
		pageUtils,
		widgetsScreen,
	} ) => {
		await expect(
			widgetsScreen.updateButton,
			'Update button should start out disabled'
		).toBeDisabled();

		const [ firstWidgetArea, secondWidgetArea ] =
			await widgetsScreen.widgetAreas.all();

		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Toggle block inserter' } )
			.click();
		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await expect(
			blockLibrary.getByRole( 'heading', { level: 2 } ).nth( 0 ),
			'Check that there are categorizations in the inserter (#26329)'
		).toBeVisible();

		const addParagraphBlock =
			await widgetsScreen.getBlockInGlobalInserter( 'Paragraph' );
		await addParagraphBlock.hover();
		// TODO: We can add a test for the insertion indicator here.
		await addParagraphBlock.click();

		await expect(
			widgetsScreen.updateButton,
			'Adding content should enable the Update button'
		).toBeEnabled();

		const addedParagraphBlockInFirstWidgetArea = firstWidgetArea.getByRole(
			'document',
			{ name: /^Empty block/ }
		);

		await addedParagraphBlockInFirstWidgetArea.focus();
		await page.keyboard.type( 'First Paragraph' );

		await widgetsScreen.getBlockInGlobalInserter( 'Paragraph' );
		await pageUtils.pressKeys( 'Tab', { times: 2 } );
		// TODO: We can add a test for the insertion indicator here.
		await addParagraphBlock.click();

		await addedParagraphBlockInFirstWidgetArea.focus();
		await page.keyboard.type( 'Second Paragraph' );

		const addShortCodeBlock =
			await widgetsScreen.getBlockInGlobalInserter( 'Shortcode' );
		await addShortCodeBlock.click();

		const shortCodeInput = page.getByRole( 'textbox', {
			name: 'Shortcode text',
		} );
		await shortCodeInput.focus();
		// The famous Big Buck Bunny video.
		await shortCodeInput.type(
			'[video src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"]'
		);

		// Add to the second widget area.
		await secondWidgetArea.click();
		await widgetsScreen.getBlockInGlobalInserter( 'Paragraph' );
		await addParagraphBlock.click();

		const addedParagraphBlockInSecondWidgetArea =
			secondWidgetArea.getByRole( 'document', {
				name: /^Empty block/,
			} );
		await addedParagraphBlockInSecondWidgetArea.focus();
		await page.keyboard.type( 'Third Paragraph' );

		await expect.poll( widgetsScreen.getWidgetAreaBlocks ).toMatchObject( {
			'sidebar-1': [
				{
					name: 'core/paragraph',
					attributes: { content: 'First Paragraph' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Second Paragraph' },
				},
				{
					name: 'core/shortcode',
					attributes: {
						text: '[video src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"]',
					},
				},
			],
			'sidebar-2': [
				{
					name: 'core/paragraph',
					attributes: { content: 'Third Paragraph' },
				},
			],
		} );
	} );

	test( 'Should insert content using the inline inserter', async ( {
		page,
		widgetsScreen,
	} ) => {
		const firstWidgetArea = widgetsScreen.widgetAreas.first();

		const inlineInserterButton = firstWidgetArea.getByRole( 'button', {
			name: 'Add block',
		} );
		await inlineInserterButton.click();

		const inlineQuickInserter = page.getByRole( 'listbox', {
			name: 'Blocks',
		} );

		const paragraphBlock = inlineQuickInserter.getByRole( 'option', {
			name: 'Paragraph',
		} );
		await paragraphBlock.click();

		const firstParagraphBlock = firstWidgetArea.getByRole( 'document', {
			name: /^Empty block/,
		} );
		await firstParagraphBlock.focus();
		await page.keyboard.type( 'First Paragraph' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second Paragraph' );

		const secondParagraphBlock = firstWidgetArea
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Second Paragraph' } );

		const secondParagraphBlockBoundingBox =
			await secondParagraphBlock.boundingBox();

		// Click outside the block to move the focus back to the widget area.
		await firstWidgetArea.click( {
			position: {
				x: 0,
				y: ( await firstWidgetArea.boundingBox() ).height - 1,
			},
		} );

		// Hover above the last block to trigger the inline inserter between blocks.
		await page.mouse.move(
			secondParagraphBlockBoundingBox.x +
				secondParagraphBlockBoundingBox.width / 2,
			secondParagraphBlockBoundingBox.y - 10
		);

		// There will be 2 matches here.
		// One is the in-between inserter,
		// and the other one is the button block appender.
		const inBetweenInserterButton = page
			.getByRole( 'button', {
				name: 'Add block',
			} )
			.first();
		await inBetweenInserterButton.click();

		const inserterSearchBox = page.getByRole( 'searchbox', {
			name: 'Search for blocks and patterns',
		} );
		await expect( inserterSearchBox ).toBeFocused();

		await page.keyboard.type( 'Heading' );

		await inlineQuickInserter
			.getByRole( 'option', { name: 'Heading' } )
			.click();

		await expect(
			firstWidgetArea.getByRole( 'document', {
				name: 'Block: Heading',
			} )
		).toBeFocused();
		await page.keyboard.type( 'My Heading' );

		await widgetsScreen.saveWidgets();

		await expect.poll( widgetsScreen.getWidgetAreaBlocks ).toMatchObject( {
			'sidebar-1': [
				{
					name: 'core/paragraph',
					attributes: { content: 'First Paragraph' },
				},
				{
					name: 'core/heading',
					attributes: { content: 'My Heading' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Second Paragraph' },
				},
			],
		} );
	} );

	// This test is broken because the REST API endpoint to delete the marquee doesn't work.
	// eslint-disable-next-line playwright/no-skipped-test
	test.describe.skip( 'Function widgets', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllWidgets();
			await requestUtils.activatePlugin(
				'gutenberg-test-marquee-widget'
			);
		} );

		test.beforeEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllWidgets();
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-marquee-widget'
			);
		} );

		test( 'Should add and save the marquee widget', async ( {
			page,
			editor,
			widgetsScreen,
		} ) => {
			const firstWidgetArea = widgetsScreen.widgetAreas.first();
			await firstWidgetArea.waitFor();
			{
				const [ { clientId: firstWidgetAreaClientId } ] =
					await editor.getBlocks( { full: true } );

				await editor.insertBlock(
					{
						name: 'core/legacy-widget',
						attributes: { id: 'marquee_greeting' },
					},
					{ clientId: firstWidgetAreaClientId }
				);
			}

			const marqueeInputs = page.getByTestId( 'marquee-greeting' );

			await marqueeInputs.fill( 'Howdy' );

			// The first marquee is saved after clicking the form save button.
			await page
				.getByRole( 'document', { name: 'Block: Legacy Widget' } )
				.getByRole( 'button', { name: 'Save' } )
				.click();

			await widgetsScreen.saveWidgets();

			await expect
				.poll( widgetsScreen.getWidgetAreaBlocks )
				.toMatchObject( {
					'sidebar-1': [
						{
							name: 'core/legacy-widget',
							attributes: {
								id: 'marquee_greeting',
								instance: { raw: { title: 'Howdy' } },
							},
						},
					],
				} );

			await page.reload();

			await expect
				.poll( widgetsScreen.getWidgetAreaBlocks )
				.toMatchObject( {
					'sidebar-1': [
						{
							name: 'core/legacy-widget',
							attributes: {
								id: 'marquee_greeting',
								instance: { raw: { title: 'Howdy' } },
							},
						},
					],
				} );

			await firstWidgetArea.waitFor();
			{
				const [ { clientId: firstWidgetAreaClientId } ] =
					await editor.getBlocks( { full: true } );

				await editor.insertBlock(
					{
						name: 'core/legacy-widget',
						attributes: { id: 'marquee_greeting' },
					},
					{ clientId: firstWidgetAreaClientId }
				);
			}

			await expect( marqueeInputs ).toHaveCount( 2 );
			await marqueeInputs.first().fill( 'first Howdy' );
			await marqueeInputs.last().fill( 'Second Howdy' );

			// No marquee should be changed without clicking on their "save" button.
			// The second marquee shouldn't be stored as a widget.
			// See #32978 for more info.
			{
				await widgetsScreen.saveWidgets();

				await page.reload();

				await expect( marqueeInputs ).toHaveCount( 1 );
				await expect
					.poll( widgetsScreen.getWidgetAreaBlocks )
					.toMatchObject( {
						'sidebar-1': [
							{
								name: 'core/legacy-widget',
								attributes: {
									id: 'marquee_greeting',
									instance: { raw: { title: 'Howdy' } },
								},
							},
						],
					} );
			}
		} );
	} );

	test( 'Should duplicate the widgets', async ( {
		page,
		editor,
		widgetsScreen,
	} ) => {
		const firstWidgetArea = widgetsScreen.widgetAreas.first();
		await firstWidgetArea.waitFor();
		const [ { clientId: firstWidgetAreaClientId } ] =
			await editor.getBlocks( { full: true } );

		await editor.insertBlock(
			{
				name: 'core/paragraph',
				attributes: { content: 'First Paragraph' },
			},
			{ clientId: firstWidgetAreaClientId }
		);

		const firstParagraphBlock = firstWidgetArea.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await firstParagraphBlock.focus();

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'Options' );
		await page
			.getByRole( 'menu', { name: 'Options' } )
			.getByRole( 'menuitem', { name: 'Duplicate' } )
			.click();

		const firstWidgetAreaBlocks = await editor.getBlocks( {
			clientId: firstWidgetAreaClientId,
			full: true,
		} );
		expect( firstWidgetAreaBlocks[ 0 ].name ).toBe(
			firstWidgetAreaBlocks[ 1 ].name
		);
		expect( firstWidgetAreaBlocks[ 0 ].content ).toBe(
			firstWidgetAreaBlocks[ 1 ].content
		);
		expect( firstWidgetAreaBlocks[ 0 ].clientId ).not.toBe(
			firstWidgetAreaBlocks[ 1 ].clientId
		);
	} );

	test( 'Should display legacy widgets', async ( {
		page,
		requestUtils,
		widgetsScreen,
	} ) => {
		// Get the default empty instance of a legacy search widget.
		const { instance: defaultSearchInstance } = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/widget-types/search/encode',
			data: { instance: {} },
		} );

		// Create a search widget in the first sidebar using the default instance.
		const widget = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/widgets',
			data: {
				id_base: 'search',
				sidebar: 'sidebar-1',
				instance: defaultSearchInstance,
			},
		} );
		// Add it to the first widget area. The above request for some reason isn't enough.
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/sidebars/sidebar-1',
			data: {
				widgets: [ widget.id ],
			},
		} );

		await page.reload();

		const legacyWidgetPreviewFrame = page.frameLocator(
			'[title="Legacy Widget Preview"]'
		);

		// Expect to have search input.
		await expect(
			legacyWidgetPreviewFrame.getByRole( 'searchbox', {
				includeHidden: true,
			} )
		).toBeVisible();

		// Focus the Legacy Widget block.
		const legacyWidget = page.getByRole( 'document', {
			name: 'Block: Legacy Widget',
		} );
		await legacyWidget.focus();

		// There should be a title at the top of the widget form.
		await expect(
			legacyWidget.getByRole( 'heading', { level: 3 } )
		).toHaveText( 'Search' );

		// Update the widget form.
		await legacyWidget
			.getByRole( 'textbox', { name: 'Title' } )
			.fill( 'Search Title' );

		// Switch to Navigation mode.
		await page.keyboard.press( 'Escape' );

		// Expect to have search title.
		await expect(
			legacyWidgetPreviewFrame.getByRole( 'heading', {
				includeHidden: true,
			} )
		).toHaveText( 'Search Title' );

		await expect.poll( widgetsScreen.getWidgetAreaBlocks ).toMatchObject( {
			'sidebar-1': [
				{
					name: 'core/legacy-widget',
					attributes: {
						idBase: 'search',
						instance: { raw: { title: 'Search Title' } },
					},
				},
			],
		} );
	} );

	test( 'allows widgets to be moved between widget areas using the dropdown in the block toolbar', async ( {
		page,
		editor,
		widgetsScreen,
	} ) => {
		const firstWidgetArea = widgetsScreen.widgetAreas.first();
		await firstWidgetArea.waitFor();
		const [ { clientId: firstWidgetAreaClientId } ] =
			await editor.getBlocks( { full: true } );

		// Insert a paragraph in the first widget area.
		await editor.insertBlock(
			{
				name: 'core/paragraph',
				attributes: { content: 'First Paragraph' },
			},
			{ clientId: firstWidgetAreaClientId }
		);

		const firstParagraphBlock = firstWidgetArea.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await firstParagraphBlock.focus();
		// Move the block to the second widget area.
		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'Move to widget area' );
		await page
			.getByRole( 'menu', { name: 'Move to widget area' } )
			.getByRole( 'menuitemradio', { name: 'Footer #2' } )
			.click();

		await expect.poll( widgetsScreen.getWidgetAreaBlocks ).toMatchObject( {
			'sidebar-1': [],
			'sidebar-2': [
				{
					name: 'core/paragraph',
					attributes: { content: 'First Paragraph' },
				},
			],
		} );
	} );

	test( 'Allows widget deletion to be undone', async ( {
		page,
		editor,
		pageUtils,
		widgetsScreen,
	} ) => {
		const firstWidgetArea = widgetsScreen.widgetAreas.first();
		await firstWidgetArea.waitFor();
		const [ { clientId: firstWidgetAreaClientId } ] =
			await editor.getBlocks( { full: true } );

		await editor.insertBlock(
			{
				name: 'core/paragraph',
				attributes: { content: 'First Paragraph' },
			},
			{ clientId: firstWidgetAreaClientId }
		);
		await editor.insertBlock(
			{
				name: 'core/paragraph',
				attributes: { content: 'Second Paragraph' },
			},
			{ clientId: firstWidgetAreaClientId }
		);

		await widgetsScreen.saveWidgets();

		// Delete the last block and save again.
		await firstWidgetArea
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Second Paragraph' } )
			.focus();
		await pageUtils.pressKeys( 'access+z' );
		await widgetsScreen.saveWidgets();

		await expect.poll( widgetsScreen.getWidgetAreaBlocks ).toMatchObject( {
			'sidebar-1': [
				{
					name: 'core/paragraph',
					attributes: { content: 'First Paragraph' },
				},
			],
		} );

		// Undo block deletion and save again.
		await pageUtils.pressKeys( 'primary+z' );
		await widgetsScreen.saveWidgets();

		// Reload the page to make sure changes were actually saved.
		await page.reload();

		await expect.poll( widgetsScreen.getWidgetAreaBlocks ).toMatchObject( {
			'sidebar-1': [
				{
					name: 'core/paragraph',
					attributes: { content: 'First Paragraph' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Second Paragraph' },
				},
			],
		} );
	} );

	test( 'can toggle sidebar list view', async ( { page } ) => {
		const toggleListViewButton = page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'List View' } );
		await toggleListViewButton.click();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		await expect( listView ).toBeVisible();

		await expect( listView.getByRole( 'gridcell' ) ).toHaveCount( 3 );

		await toggleListViewButton.click();
		await expect( listView ).toBeHidden();
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/38002.
	test( 'allows blocks to be added on mobile viewports', async ( {
		page,
		pageUtils,
		widgetsScreen,
	} ) => {
		await pageUtils.setBrowserViewport( 'small' );

		const firstWidgetArea = widgetsScreen.widgetAreas.first();

		const addParagraphBlock =
			await widgetsScreen.getBlockInGlobalInserter( 'Paragraph' );
		await addParagraphBlock.click();

		await firstWidgetArea
			.getByRole( 'document', {
				name: /^Empty block/,
			} )
			.focus();
		await page.keyboard.type( 'First Paragraph' );

		await expect.poll( widgetsScreen.getWidgetAreaBlocks ).toMatchObject( {
			'sidebar-1': [
				{
					name: 'core/paragraph',
					attributes: { content: 'First Paragraph' },
				},
			],
		} );
	} );
} );

class WidgetsScreen {
	/** @type {import('@playwright/test').Page} */
	#page;
	/** @type {Editor} */
	#editor;

	constructor( { page, editor } ) {
		this.#page = page;
		this.#editor = editor;

		/** @type {Locator} */
		this.widgetAreas = this.#page.getByRole( 'document', {
			name: 'Block: Widget Area',
		} );
		/** @type {Locator} */
		this.updateButton = this.#page.getByRole( 'button', {
			name: 'Update',
		} );
	}

	getWidgetAreaBlocks = async () => {
		const widgetAreas = await this.#editor.getBlocks( { full: true } );
		/** @type {Record<string, Awaited<ReturnType<Editor['getBlocks']>>>} */
		const widgetAreaBlocks = {};
		for ( const widgetArea of widgetAreas ) {
			const widgetAreaId = widgetArea.attributes.id;
			widgetAreaBlocks[ widgetAreaId ] = await this.#editor.getBlocks( {
				clientId: widgetArea.clientId,
			} );
		}
		return widgetAreaBlocks;
	};

	/**
	 * @param {string} blockName
	 */
	getBlockInGlobalInserter = async ( blockName ) => {
		const blockLibrary = this.#page.getByRole( 'region', {
			name: 'Block Library',
		} );
		if ( await blockLibrary.isHidden() ) {
			await this.#page
				.getByRole( 'toolbar', { name: 'Document tools' } )
				.getByRole( 'button', { name: 'Toggle block inserter' } )
				.click();
		}

		await blockLibrary
			.getByRole( 'searchbox', {
				name: 'Search for blocks and patterns',
			} )
			.fill( blockName );

		return blockLibrary.getByRole( 'option', { name: blockName } );
	};

	saveWidgets = async () => {
		await test.step(
			'save widgets',
			async () => {
				await this.updateButton.click();
				await expect( this.updateButton ).toBeDisabled();
			},
			{ box: true }
		);
	};
}
