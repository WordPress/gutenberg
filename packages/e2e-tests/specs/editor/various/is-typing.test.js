/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	showBlockToolbar,
} from '@wordpress/e2e-test-utils';

describe( 'isTyping', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should hide the toolbar when typing', async () => {
		const blockToolbarSelector = '.block-editor-block-toolbar';

		await clickBlockAppender();

		// Type in a paragraph.
		await page.keyboard.type( 'Type' );

		// Toolbar is hidden
		let blockToolbar = await page.$( blockToolbarSelector );
		expect( blockToolbar ).toBe( null );

		// Moving the mouse shows the toolbar.
		await showBlockToolbar();

		// Toolbar is visible.
		blockToolbar = await page.$( blockToolbarSelector );
		expect( blockToolbar ).not.toBe( null );

		// Typing again hides the toolbar
		await page.keyboard.type( ' and continue' );

		// Toolbar is hidden again
		blockToolbar = await page.$( blockToolbarSelector );
		expect( blockToolbar ).toBe( null );
	} );

	it( 'should not close the dropdown when typing in it', async () => {
		// Adds a Dropdown with an input to all blocks.
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

		await clickBlockAppender();

		// Type in a paragraph.
		await page.keyboard.type( 'Type' );

		// Show Toolbar.
		await showBlockToolbar();

		// Open the dropdown.
		await page.click( '.dropdown-open' );

		// Type inside the dropdown's input
		await page.type( '.dropdown-input', 'Random' );

		// The input should still be visible.
		const input = await page.$( '.dropdown-input' );
		expect( input ).not.toBe( null );
	} );
} );
