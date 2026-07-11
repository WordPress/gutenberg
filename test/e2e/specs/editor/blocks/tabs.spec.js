/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Tabs', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-block-experiments',
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.describe( 'Editor functionality', () => {
		test.beforeEach( async ( { admin, editor } ) => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/tabs',
				innerBlocks: [
					{ name: 'core/tab-list' },
					{
						name: 'core/tab-panels',
						innerBlocks: [
							{
								name: 'core/tab-panel',
								attributes: { label: 'Tab 1' },
								innerBlocks: [
									{
										name: 'core/paragraph',
										attributes: { content: 'Panel 1' },
									},
								],
							},
							{
								name: 'core/tab-panel',
								attributes: { label: 'Tab 2' },
								innerBlocks: [
									{
										name: 'core/paragraph',
										attributes: { content: 'Panel 2' },
									},
								],
							},
						],
					},
				],
			} );
		} );

		test( 'activates the next tab when the caret moves into its label with the right arrow key', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const tab1 = editor.canvas.getByRole( 'tab', { name: 'Tab 1' } );
			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );

			await tab1.click();
			await expect( tab1 ).toHaveAttribute( 'aria-selected', 'true' );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'false' );
			await expect( editor.canvas.getByText( 'Panel 1' ) ).toBeVisible();
			await expect( editor.canvas.getByText( 'Panel 2' ) ).toBeHidden();

			await page.keyboard.press( 'End' );
			await page.keyboard.press( 'ArrowRight' );

			await expect( tab1 ).toHaveAttribute( 'aria-selected', 'false' );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );
			await expect(
				tab2.locator( '[contenteditable="true"]' )
			).toBeFocused();
			await expect( editor.canvas.getByText( 'Panel 1' ) ).toBeHidden();
			await expect( editor.canvas.getByText( 'Panel 2' ) ).toBeVisible();

			// Switching the active tab is non-persistent, so undo clears the
			// inserted block instead of only reverting the tab switch.
			await pageUtils.pressKeys( 'primary+z' );
			await expect.poll( editor.getBlocks ).toEqual( [] );
		} );

		test( 'activates the previous tab when the caret moves into its label with the left arrow key', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const tab1 = editor.canvas.getByRole( 'tab', { name: 'Tab 1' } );
			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );

			await tab2.click();
			await expect( tab1 ).toHaveAttribute( 'aria-selected', 'false' );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );
			await expect( editor.canvas.getByText( 'Panel 1' ) ).toBeHidden();
			await expect( editor.canvas.getByText( 'Panel 2' ) ).toBeVisible();

			await page.keyboard.press( 'Home' );
			await page.keyboard.press( 'ArrowLeft' );

			await expect( tab1 ).toHaveAttribute( 'aria-selected', 'true' );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'false' );
			await expect(
				tab1.locator( '[contenteditable="true"]' )
			).toBeFocused();
			await expect( editor.canvas.getByText( 'Panel 1' ) ).toBeVisible();
			await expect( editor.canvas.getByText( 'Panel 2' ) ).toBeHidden();

			// Switching the active tab is non-persistent, so undo clears the
			// inserted block instead of only reverting the tab switch.
			await pageUtils.pressKeys( 'primary+z' );
			await expect.poll( editor.getBlocks ).toEqual( [] );
		} );

		test( 'switches the active tab and selects the tab list when a tab is clicked while a block in another panel is selected', async ( {
			editor,
			pageUtils,
		} ) => {
			const tab1 = editor.canvas.getByRole( 'tab', { name: 'Tab 1' } );
			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );

			// Select the paragraph inside the first (active) panel.
			await editor.canvas.getByText( 'Panel 1' ).click();
			await expect( tab1 ).toHaveAttribute( 'aria-selected', 'true' );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'false' );

			await tab2.click();

			await expect( tab1 ).toHaveAttribute( 'aria-selected', 'false' );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );
			await expect( editor.canvas.getByText( 'Panel 1' ) ).toBeHidden();
			await expect( editor.canvas.getByText( 'Panel 2' ) ).toBeVisible();

			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Tab List',
				} )
			).toHaveClass( /is-selected/ );

			// Switching the active tab is non-persistent, so undo clears the
			// inserted block instead of only reverting the tab switch.
			await pageUtils.pressKeys( 'primary+z' );
			await expect.poll( editor.getBlocks ).toEqual( [] );
		} );

		test( 'adds and activates a new tab when pressing Enter at the end of a tab label', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );
			await tab2.click();
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );

			await page.keyboard.press( 'End' );
			await page.keyboard.press( 'Enter' );

			const tabs = editor.canvas.getByRole( 'tab' );
			await expect( tabs ).toHaveCount( 3 );

			await expect( tabs.nth( 0 ) ).toHaveAttribute(
				'aria-selected',
				'false'
			);
			await expect( tabs.nth( 1 ) ).toHaveAttribute(
				'aria-selected',
				'false'
			);

			const newTab = tabs.nth( 2 );
			await expect( newTab ).toHaveAttribute( 'aria-selected', 'true' );
			await expect(
				newTab.locator( '[contenteditable="true"]' )
			).toBeFocused();

			// The new tab's panel is the active one and is visible.
			const panels = editor.canvas.getByRole( 'document', {
				name: 'Block: Tab Panel',
			} );
			await expect( panels ).toHaveCount( 3 );
			await expect( panels.nth( 2 ) ).toBeVisible();

			// The tab insertion is persistent, so undo removes the new tab
			await pageUtils.pressKeys( 'primary+z' );
			await expect( tabs ).toHaveCount( 2 );
		} );

		test( 'removes the tab and activates the previous one when pressing Delete on an empty tab label', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );
			await tab2.click();
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );

			// Empty the tab label, then delete again to remove the tab.
			await pageUtils.pressKeys( 'primary+a' );
			await page.keyboard.press( 'Delete' );
			await page.keyboard.press( 'Backspace' );

			const tabs = editor.canvas.getByRole( 'tab' );
			await expect( tabs ).toHaveCount( 1 );

			const tab1 = editor.canvas.getByRole( 'tab', { name: 'Tab 1' } );
			await expect( tab1 ).toHaveAttribute( 'aria-selected', 'true' );
			await expect(
				tab1.locator( '[contenteditable="true"]' )
			).toBeFocused();
			await expect( editor.canvas.getByText( 'Panel 1' ) ).toBeVisible();

			// The tab removal is persistent, so undo brings the tab back.
			await pageUtils.pressKeys( 'primary+z' );
			await expect( tabs ).toHaveCount( 2 );
		} );
	} );

	// TODO: Add a `Frontend functionality` describe block for front-end
	// interaction tests (e.g. switching tabs on the published post).
} );
