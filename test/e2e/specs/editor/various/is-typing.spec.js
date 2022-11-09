/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'isTyping', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should hide the toolbar when typing', async ( { page, editor } ) => {
		const blockToolbar = page.locator( 'role=toolbar[name="Block tools"i]' );

		await page.click( 'role=button[name="Add default block"i]' );

		// Type in a paragraph.
		await page.keyboard.type( 'Type' );

		// Toolbar is hidden
		await expect( blockToolbar ).toBeHidden();

		// Moving the mouse shows the toolbar.
		await editor.showBlockToolbar();

		// Toolbar is visible.
		expect( blockToolbar ).not.toBe( null );

		// Typing again hides the toolbar
		await page.keyboard.type( ' and continue' );

		// Toolbar is hidden again
		await expect( blockToolbar ).toBeHidden();
	} );

	test( 'should not close the dropdown when typing in it', async ( {
		page,
		editor,
	} ) => {
		// Adds a Dropdown with an input to all blocks.
		const wp = '';
		await page.evaluate( () => {
			const { Dropdown, ToolbarButton, Fill } = wp.components;
			const { createElement: el, Fragment } = wp.element;
			function AddDropdown( BlockListBlock ) {
				return ( props ) => {
					return el(
						Fragment,
						{},
						el(
							Fill,
							{ name: 'BlockControls' },
							el( Dropdown, {
								renderToggle: ( { onToggle } ) =>
									el(
										ToolbarButton,
										{
											onClick: onToggle,
											className: 'dropdown-open',
										},
										'Open Dropdown'
									),
								renderContent: () =>
									el( 'input', {
										className: 'dropdown-input',
									} ),
							} )
						),
						el( BlockListBlock, props )
					);
				};
			}

			wp.hooks.addFilter(
				'editor.BlockListBlock',
				'e2e-test/add-dropdown',
				AddDropdown
			);
		} );

		await page.click( 'role=button[name="Add default block"i]' );

		// Type in a paragraph.
		await page.keyboard.type( 'Type' );

		// Show Toolbar.
		await editor.showBlockToolbar();

		// Open the dropdown.
		await page.click( '.dropdown-open' );

		// Type inside the dropdown's input
		await page.type( '.dropdown-input', 'Random' );

		// The input should still be visible.
		await expect( page.locator( '.dropdown-input' ) ).toBeVisible();
	} );
} );
