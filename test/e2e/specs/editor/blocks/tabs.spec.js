/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Builds a tabs block from tab labels and their panel contents.
 *
 * @param {string[]} labels Tab labels, in order.
 * @param {string[]} panels Paragraph content for each tab panel, in order.
 * @return {Object} The core/tabs block definition.
 */
function createTabs( labels, panels ) {
	return {
		name: 'core/tabs',
		innerBlocks: [
			{
				name: 'core/tab-list',
				attributes: {
					tabs: labels.map( ( label ) => ( { label } ) ),
				},
			},
			{
				name: 'core/tab-panels',
				innerBlocks: panels.map( ( content, index ) => ( {
					name: 'core/tab-panel',
					attributes: { label: labels[ index ] },
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content },
						},
					],
				} ) ),
			},
		],
	};
}

test.describe( 'Tabs', () => {
	test.describe( 'Editor functionality', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost();
		} );

		test( 'activates the next tab when the caret moves into its label with the right arrow key', async ( {
			editor,
			pageUtils,
		} ) => {
			await editor.insertBlock(
				createTabs( [ 'Tab 1', 'Tab 2' ], [ 'Panel 1', 'Panel 2' ] )
			);

			const tab1 = editor.canvas.getByRole( 'tab', { name: 'Tab 1' } );
			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );

			await tab1.click();
			await expect( tab1 ).toHaveAttribute( 'aria-selected', 'true' );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'false' );
			await expect( editor.canvas.getByText( 'Panel 1' ) ).toBeVisible();
			await expect( editor.canvas.getByText( 'Panel 2' ) ).toBeHidden();

			// Select all text, then arrow right twice to move the caret into the
			// next tab.
			await pageUtils.pressKeys( 'primary+a' );
			await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );

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
			pageUtils,
		} ) => {
			await editor.insertBlock(
				createTabs( [ 'Tab 1', 'Tab 2' ], [ 'Panel 1', 'Panel 2' ] )
			);

			const tab1 = editor.canvas.getByRole( 'tab', { name: 'Tab 1' } );
			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );

			await tab2.click();
			await expect( tab1 ).toHaveAttribute( 'aria-selected', 'false' );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );
			await expect( editor.canvas.getByText( 'Panel 1' ) ).toBeHidden();
			await expect( editor.canvas.getByText( 'Panel 2' ) ).toBeVisible();

			// Select all text, then arrow left twice to move the caret into the
			// previous tab.
			await pageUtils.pressKeys( 'primary+a' );
			await pageUtils.pressKeys( 'ArrowLeft', { times: 2 } );

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
			await editor.insertBlock(
				createTabs( [ 'Tab 1', 'Tab 2' ], [ 'Panel 1', 'Panel 2' ] )
			);

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
			await editor.insertBlock(
				createTabs( [ 'Tab 1', 'Tab 2' ], [ 'Panel 1', 'Panel 2' ] )
			);

			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );
			await tab2.click();
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );

			// Select all text, then arrow right to move the caret to the end of
			// the label.
			await pageUtils.pressKeys( 'primary+a' );
			await pageUtils.pressKeys( 'ArrowRight' );
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

			// FIXME: Undo should activate the tab the new one was inserted from
			// and focus its label, but the tab is left inactive and unfocused.
			// await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );
			// await expect(
			// 	tab2.locator( '[contenteditable="true"]' )
			// ).toBeFocused();
		} );

		test( 'removes the tab and activates the previous one when pressing Delete on an empty tab label', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock(
				createTabs( [ 'Tab 1', 'Tab 2' ], [ 'Panel 1', 'Panel 2' ] )
			);

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

			// FIXME: Undo should activate the restored tab and focus its label,
			// but the tab is left inactive and unfocused.
			// const restoredTab = tabs.nth( 1 );
			// await expect( restoredTab ).toHaveAttribute(
			// 	'aria-selected',
			// 	'true'
			// );
			// await expect(
			// 	restoredTab.locator( '[contenteditable="true"]' )
			// ).toBeFocused();
		} );

		test( 'keeps tab labels in sync when a panel is moved before', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock(
				createTabs(
					[ 'Tab 1', 'Tab 2', 'Tab 3' ],
					[ 'Panel 1', 'Panel 2', 'Panel 3' ]
				)
			);

			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );
			const panel2 = editor.canvas
				.getByRole( 'document', { name: 'Block: Tab Panels' } )
				.getByRole( 'document', { name: 'Block: Tab Panel' } )
				.filter( { hasText: 'Panel 2' } );

			// Click the second tab, then select its panel.
			await tab2.click();
			await editor.selectBlocks( panel2 );

			// Move the panel one position earlier.
			await editor.clickBlockToolbarButton( 'Move up' );

			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [
					createTabs(
						[ 'Tab 2', 'Tab 1', 'Tab 3' ],
						[ 'Panel 2', 'Panel 1', 'Panel 3' ]
					),
				] );

			// Undo restores the original order and the active tab.
			await pageUtils.pressKeys( 'primary+z' );

			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [
					createTabs(
						[ 'Tab 1', 'Tab 2', 'Tab 3' ],
						[ 'Panel 1', 'Panel 2', 'Panel 3' ]
					),
				] );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );

			// The focus stays on the mover button.
			await expect(
				page.getByRole( 'button', { name: 'Move up' } )
			).toBeFocused();
		} );

		test( 'keeps tab labels in sync when a panel is moved after', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock(
				createTabs(
					[ 'Tab 1', 'Tab 2', 'Tab 3' ],
					[ 'Panel 1', 'Panel 2', 'Panel 3' ]
				)
			);

			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );
			const panel2 = editor.canvas
				.getByRole( 'document', { name: 'Block: Tab Panels' } )
				.getByRole( 'document', { name: 'Block: Tab Panel' } )
				.filter( { hasText: 'Panel 2' } );

			// Click the second tab, then select its panel.
			await tab2.click();
			await editor.selectBlocks( panel2 );

			// Move the panel one position later.
			await editor.clickBlockToolbarButton( 'Move down' );

			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [
					createTabs(
						[ 'Tab 1', 'Tab 3', 'Tab 2' ],
						[ 'Panel 1', 'Panel 3', 'Panel 2' ]
					),
				] );

			// Undo restores the original order and the active tab.
			await pageUtils.pressKeys( 'primary+z' );

			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [
					createTabs(
						[ 'Tab 1', 'Tab 2', 'Tab 3' ],
						[ 'Panel 1', 'Panel 2', 'Panel 3' ]
					),
				] );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );

			// The focus stays on the mover button.
			await expect(
				page.getByRole( 'button', { name: 'Move down' } )
			).toBeFocused();
		} );

		test( 'keeps tab labels in sync when a panel is removed', async ( {
			editor,
			pageUtils,
		} ) => {
			await editor.insertBlock(
				createTabs(
					[ 'Tab 1', 'Tab 2', 'Tab 3' ],
					[ 'Panel 1', 'Panel 2', 'Panel 3' ]
				)
			);

			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );
			const panel2 = editor.canvas
				.getByRole( 'document', { name: 'Block: Tab Panels' } )
				.getByRole( 'document', { name: 'Block: Tab Panel' } )
				.filter( { hasText: 'Panel 2' } );

			// Click the second tab, then select its panel.
			await tab2.click();
			await editor.selectBlocks( panel2 );

			// Remove the panel.
			await editor.clickBlockOptionsMenuItem( 'Delete' );

			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [
					createTabs(
						[ 'Tab 1', 'Tab 3' ],
						[ 'Panel 1', 'Panel 3' ]
					),
				] );

			// Undo restores the removed panel and the active tab.
			await pageUtils.pressKeys( 'primary+z' );

			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [
					createTabs(
						[ 'Tab 1', 'Tab 2', 'Tab 3' ],
						[ 'Panel 1', 'Panel 2', 'Panel 3' ]
					),
				] );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );

			// The restored panel regains the focus.
			await expect( panel2 ).toBeFocused();
		} );

		test( 'keeps the tab label when a panel is duplicated', async ( {
			editor,
			pageUtils,
		} ) => {
			await editor.insertBlock(
				createTabs(
					[ 'Tab 1', 'Tab 2', 'Tab 3' ],
					[ 'Panel 1', 'Panel 2', 'Panel 3' ]
				)
			);

			const tab2 = editor.canvas.getByRole( 'tab', { name: 'Tab 2' } );
			const panel2 = editor.canvas
				.getByRole( 'document', { name: 'Block: Tab Panels' } )
				.getByRole( 'document', { name: 'Block: Tab Panel' } )
				.filter( { hasText: 'Panel 2' } );

			// Click the second tab, then select its panel.
			await tab2.click();
			await editor.selectBlocks( panel2 );

			// Duplicate the panel.
			await editor.clickBlockOptionsMenuItem( 'Duplicate' );

			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [
					createTabs(
						[ 'Tab 1', 'Tab 2', 'Tab 2', 'Tab 3' ],
						[ 'Panel 1', 'Panel 2', 'Panel 2', 'Panel 3' ]
					),
				] );

			// Undo removes the duplicated panel and restores the active tab.
			await pageUtils.pressKeys( 'primary+z' );

			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [
					createTabs(
						[ 'Tab 1', 'Tab 2', 'Tab 3' ],
						[ 'Panel 1', 'Panel 2', 'Panel 3' ]
					),
				] );
			await expect( tab2 ).toHaveAttribute( 'aria-selected', 'true' );

			// The original panel regains the focus.
			await expect( panel2 ).toBeFocused();
		} );
	} );

	// TODO: Add a `Frontend functionality` describe block for front-end
	// interaction tests (e.g. switching tabs on the published post).
} );
