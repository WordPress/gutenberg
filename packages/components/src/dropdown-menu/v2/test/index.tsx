/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import {
	default as userEvent,
	PointerEventsCheckLevel,
} from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownSubMenu,
	DropdownSubMenuTrigger,
} from '..';

const delay = ( delayInMs: number ) => {
	return new Promise( ( resolve ) => setTimeout( resolve, delayInMs ) );
};

describe( 'DropdownMenu', () => {
	// See https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
	it( 'should follow the WAI-ARIA spec', async () => {
		// Radio and Checkbox items'
		const user = userEvent.setup();

		render(
			<DropdownMenu trigger={ <button>Open dropdown</button> }>
				<DropdownMenuItem>Dropdown menu item</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownSubMenu
					trigger={
						<DropdownSubMenuTrigger>
							Dropdown submenu
						</DropdownSubMenuTrigger>
					}
				>
					<DropdownMenuItem>Dropdown submenu item 1</DropdownMenuItem>
					<DropdownMenuItem>Dropdown submenu item 2</DropdownMenuItem>
				</DropdownSubMenu>
			</DropdownMenu>
		);

		const toggleButton = screen.getByRole( 'button', {
			name: 'Open dropdown',
		} );

		expect( toggleButton ).toHaveAttribute( 'aria-haspopup', 'menu' );
		expect( toggleButton ).toHaveAttribute( 'aria-expanded', 'false' );

		await user.click( toggleButton );

		expect( toggleButton ).toHaveAttribute( 'aria-expanded', 'true' );

		expect( screen.getByRole( 'menu' ) ).toHaveFocus();
		expect( screen.getByRole( 'separator' ) ).toHaveAttribute(
			'aria-orientation',
			'horizontal'
		);
		expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 2 );

		const submenuTrigger = screen.getByRole( 'menuitem', {
			name: 'Dropdown submenu',
		} );
		expect( submenuTrigger ).toHaveAttribute( 'aria-haspopup', 'menu' );
		expect( submenuTrigger ).toHaveAttribute( 'aria-expanded', 'false' );

		await user.hover( submenuTrigger );

		// Wait for the open animation after hovering
		await waitFor( () =>
			expect( screen.getAllByRole( 'menu' ) ).toHaveLength( 2 )
		);

		expect( submenuTrigger ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( submenuTrigger ).toHaveAttribute(
			'aria-controls',
			screen.getAllByRole( 'menu' )[ 1 ].id
		);
	} );

	describe( 'pointer and keyboard interactions', () => {
		it( 'should open when clicking the trigger', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu trigger={ <button>Open dropdown</button> }>
					<DropdownMenuItem>Dropdown menu item</DropdownMenuItem>
				</DropdownMenu>
			);

			const toggleButton = screen.getByRole( 'button', {
				name: 'Open dropdown',
			} );

			// DropdownMenu closed, the content is not displayed
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'menuitem' ) ).not.toBeInTheDocument();

			// Click to open the menu
			await user.click( toggleButton );

			// DropdownMenu open, the content is displayed
			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem' ) ).toBeInTheDocument();
		} );

		it( 'should open when pressing the arrow down key on the trigger', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu trigger={ <button>Open dropdown</button> }>
					<DropdownMenuItem>Dropdown menu item</DropdownMenuItem>
				</DropdownMenu>
			);

			const toggleButton = screen.getByRole( 'button', {
				name: 'Open dropdown',
			} );

			// Move focus on the toggle
			await user.keyboard( '{Tab}' );

			expect( toggleButton ).toHaveFocus();

			// DropdownMenu closed, the content is not displayed
			expect( screen.queryByRole( 'menuitem' ) ).not.toBeInTheDocument();

			await user.keyboard( '{ArrowDown}' );

			// DropdownMenu open, the content is displayed
			expect( screen.getByRole( 'menuitem' ) ).toBeInTheDocument();
		} );

		it( 'should close when pressing the escape key', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu
					defaultOpen
					trigger={ <button>Open dropdown</button> }
				>
					<DropdownMenuItem>Dropdown menu item</DropdownMenuItem>
				</DropdownMenu>
			);

			// The menu is focused automatically when `defaultOpen` is set.
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();

			// Pressing esc will close the menu and move focus to the toggle
			await user.keyboard( '{Escape}' );

			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			).toHaveFocus();
		} );

		it( 'should close when clicking outside of the content', async () => {
			const user = userEvent.setup( {
				// Disabling this check otherwise testing-library would complain
				// when clicking on document.body to close the dropdown menu.
				pointerEventsCheck: PointerEventsCheckLevel.Never,
			} );

			render(
				<DropdownMenu
					defaultOpen
					trigger={ <button>Open dropdown</button> }
				>
					<DropdownMenuItem>Dropdown menu item</DropdownMenuItem>
				</DropdownMenu>
			);

			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();

			// Click on the body (ie. outside of the dropdown menu)
			await user.click( document.body );

			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );

		it( 'should close when clicking on a menu item', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu
					defaultOpen
					trigger={ <button>Open dropdown</button> }
				>
					<DropdownMenuItem>Dropdown menu item</DropdownMenuItem>
				</DropdownMenu>
			);

			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();

			// Clicking a menu item will close the menu
			await user.click( screen.getByRole( 'menuitem' ) );

			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );

		it( 'should not close when clicking on a disabled menu item', async () => {
			const user = userEvent.setup( {
				// Disabling this check otherwise testing-library would complain
				// when clicking on a disabled element with pointer-events: none
				pointerEventsCheck: PointerEventsCheckLevel.Never,
			} );

			render(
				<DropdownMenu
					defaultOpen
					trigger={ <button>Open dropdown</button> }
				>
					<DropdownMenuItem disabled>
						Dropdown menu item
					</DropdownMenuItem>
				</DropdownMenu>
			);

			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();

			// Clicking a disabled menu item won't close the menu
			await user.click( screen.getByRole( 'menuitem' ) );

			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();
		} );

		it( 'should reveal submenu content when hovering over the submenu trigger', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu
					defaultOpen
					trigger={ <button>Open dropdown</button> }
				>
					<DropdownMenuItem>Dropdown menu item 1</DropdownMenuItem>
					<DropdownMenuItem>Dropdown menu item 2</DropdownMenuItem>
					<DropdownSubMenu
						trigger={
							<DropdownSubMenuTrigger>
								Dropdown submenu
							</DropdownSubMenuTrigger>
						}
					>
						<DropdownMenuItem>
							Dropdown submenu item 1
						</DropdownMenuItem>
						<DropdownMenuItem>
							Dropdown submenu item 2
						</DropdownMenuItem>
					</DropdownSubMenu>
					<DropdownMenuItem>Dropdown menu item 3</DropdownMenuItem>
				</DropdownMenu>
			);

			// Before hover, submenu items are not rendered
			expect(
				screen.queryByRole( 'menuitem', {
					name: 'Dropdown submenu item 1',
				} )
			).not.toBeInTheDocument();

			await user.hover(
				screen.getByRole( 'menuitem', { name: 'Dropdown submenu' } )
			);

			// After hover, submenu items are rendered
			// Reason for `findByRole`: due to the animation, we've got to wait
			// a short amount of time for the submenu to appear
			await screen.findByRole( 'menuitem', {
				name: 'Dropdown submenu item 1',
			} );
		} );

		it( 'should navigate menu items and subitems using the arrow, spacebar and enter keys', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu
					defaultOpen
					trigger={ <button>Open dropdown</button> }
				>
					<DropdownMenuItem>Dropdown menu item 1</DropdownMenuItem>
					<DropdownMenuItem>Dropdown menu item 2</DropdownMenuItem>
					<DropdownSubMenu
						trigger={
							<DropdownSubMenuTrigger>
								Dropdown submenu
							</DropdownSubMenuTrigger>
						}
					>
						<DropdownMenuItem>
							Dropdown submenu item 1
						</DropdownMenuItem>
						<DropdownMenuItem>
							Dropdown submenu item 2
						</DropdownMenuItem>
					</DropdownSubMenu>
					<DropdownMenuItem>Dropdown menu item 3</DropdownMenuItem>
				</DropdownMenu>
			);

			// The menu is focused automatically when `defaultOpen` is set.
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();

			// Arrow up/down selects menu items
			// The selection wraps around from last to first and viceversa
			await user.keyboard( '{ArrowDown}' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Dropdown menu item 1' } )
			).toHaveFocus();

			await user.keyboard( '{ArrowDown}' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Dropdown menu item 2' } )
			).toHaveFocus();

			await user.keyboard( '{ArrowDown}' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Dropdown submenu' } )
			).toHaveFocus();

			await user.keyboard( '{ArrowDown}' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Dropdown menu item 3' } )
			).toHaveFocus();

			await user.keyboard( '{ArrowDown}' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Dropdown menu item 1' } )
			).toHaveFocus();

			await user.keyboard( '{ArrowUp}' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Dropdown menu item 3' } )
			).toHaveFocus();

			await user.keyboard( '{ArrowUp}' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Dropdown submenu' } )
			).toHaveFocus();

			// Arrow right/left can be used to enter/leave submenus
			await user.keyboard( '{ArrowRight}' );
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Dropdown submenu item 1',
				} )
			).toHaveFocus();

			await user.keyboard( '{ArrowDown}' );
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Dropdown submenu item 2',
				} )
			).toHaveFocus();

			await user.keyboard( '{ArrowLeft}' );
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Dropdown submenu',
				} )
			).toHaveFocus();

			// Spacebar or enter key can also be used to enter a submenu
			await user.keyboard( '{Enter}' );
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Dropdown submenu item 1',
				} )
			).toHaveFocus();

			await user.keyboard( '{ArrowLeft}' );
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Dropdown submenu',
				} )
			).toHaveFocus();

			await user.keyboard( '{Spacebar}' );
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Dropdown submenu item 1',
				} )
			).toHaveFocus();

			await user.keyboard( '{ArrowLeft}' );
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Dropdown submenu',
				} )
			).toHaveFocus();
		} );

		it( 'should check menu radio items', async () => {
			const user = userEvent.setup();

			const onRadioValueChangeSpy = jest.fn();

			const ControlledRadioGroup = () => {
				const [ radioValue, setRadioValue ] = useState< string >();
				return (
					<DropdownMenu trigger={ <button>Open dropdown</button> }>
						<DropdownMenuRadioGroup
							value={ radioValue }
							onValueChange={ ( value ) => {
								onRadioValueChangeSpy( value );
								setRadioValue( value );
							} }
						>
							<DropdownMenuLabel>
								Radio group label
							</DropdownMenuLabel>
							<DropdownMenuRadioItem value="radio-one">
								Radio item one
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="radio-two">
								Radio item two
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenu>
				);
			};

			render( <ControlledRadioGroup /> );

			// Open dropdown
			await user.click(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			);

			// No radios should be checked at this point
			expect( screen.getAllByRole( 'menuitemradio' ) ).toHaveLength( 2 );
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			).not.toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			).not.toBeChecked();

			// Click first radio item, make sure that the callback fires
			await user.click(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			);
			expect( onRadioValueChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onRadioValueChangeSpy ).toHaveBeenLastCalledWith(
				'radio-one'
			);

			// Open dropdown
			await user.click(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			);

			// Make sure that first radio is checked
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			).toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			).not.toBeChecked();

			// Click second radio item, make sure that the callback fires
			await user.click(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			);
			expect( onRadioValueChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onRadioValueChangeSpy ).toHaveBeenLastCalledWith(
				'radio-two'
			);

			// Open dropdown
			await user.click(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			);

			// Make sure that second radio is selected
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			).not.toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			).toBeChecked();
		} );

		it( 'should check menu checkbox items', async () => {
			const user = userEvent.setup();

			const onCheckboxValueChangeSpy = jest.fn();

			const ControlledRadioGroup = () => {
				const [ itemOneChecked, setItemOneChecked ] =
					useState< boolean >();
				const [ itemTwoChecked, setItemTwoChecked ] =
					useState< boolean >();
				return (
					<DropdownMenu trigger={ <button>Open dropdown</button> }>
						<DropdownMenuLabel>
							Checkbox group label
						</DropdownMenuLabel>
						<DropdownMenuCheckboxItem
							checked={ itemOneChecked }
							onCheckedChange={ ( checked ) => {
								setItemOneChecked( checked );
								onCheckboxValueChangeSpy( 'item-one', checked );
							} }
						>
							Checkbox item one
						</DropdownMenuCheckboxItem>

						<DropdownMenuCheckboxItem
							checked={ itemTwoChecked }
							onCheckedChange={ ( checked ) => {
								setItemTwoChecked( checked );
								onCheckboxValueChangeSpy( 'item-two', checked );
							} }
						>
							Checkbox item two
						</DropdownMenuCheckboxItem>
					</DropdownMenu>
				);
			};

			render( <ControlledRadioGroup /> );

			// Open dropdown
			await user.click(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			);

			// No checkboxes should be checked at this point
			expect( screen.getAllByRole( 'menuitemcheckbox' ) ).toHaveLength(
				2
			);
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item one',
				} )
			).not.toBeChecked();
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			).not.toBeChecked();

			// Click first checkbox item, make sure that the callback fires
			await user.click(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item one',
				} )
			);
			expect( onCheckboxValueChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onCheckboxValueChangeSpy ).toHaveBeenLastCalledWith(
				'item-one',
				true
			);

			// Open dropdown
			await user.click(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			);

			// Make sure that first checkbox is checked
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item one',
				} )
			).toBeChecked();

			// Click second checkbox item, make sure that the callback fires
			await user.click(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			);
			expect( onCheckboxValueChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onCheckboxValueChangeSpy ).toHaveBeenLastCalledWith(
				'item-two',
				true
			);

			// Open dropdown
			await user.click(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			);

			// Make sure that second checkbox is selected
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			).toBeChecked();

			// Click second checkbox item, make sure that the callback fires
			await user.click(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			);
			expect( onCheckboxValueChangeSpy ).toHaveBeenCalledTimes( 3 );
			expect( onCheckboxValueChangeSpy ).toHaveBeenLastCalledWith(
				'item-two',
				false
			);

			// Open dropdown
			await user.click(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			);

			// Make sure that second checkbox is unselected
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			).not.toBeChecked();
		} );
	} );

	describe( 'items prefix and suffix', () => {
		it( 'should display a prefix on regular items', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu trigger={ <button>Open dropdown</button> }>
					<DropdownMenuItem prefix={ <>Item prefix</> }>
						Dropdown menu item
					</DropdownMenuItem>
				</DropdownMenu>
			);

			// Click to open the menu
			await user.click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);

			// The contents of the prefix are rendered before the item's children
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Item prefix Dropdown menu item',
				} )
			).toBeInTheDocument();
		} );

		it( 'should display a suffix on regular items', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu trigger={ <button>Open dropdown</button> }>
					<DropdownMenuItem suffix={ <>Item suffix</> }>
						Dropdown menu item
					</DropdownMenuItem>
				</DropdownMenu>
			);

			// Click to open the menu
			await user.click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);

			// The contents of the suffix are rendered after the item's children
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Dropdown menu item Item suffix',
				} )
			).toBeInTheDocument();
		} );

		it( 'should display a suffix on radio items', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu trigger={ <button>Open dropdown</button> }>
					<DropdownMenuRadioGroup>
						<DropdownMenuRadioItem
							value="radio-one"
							suffix="Radio suffix"
						>
							Radio item one
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenu>
			);

			// Click to open the menu
			await user.click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);

			// The contents of the suffix are rendered after the item's children
			expect(
				screen.getByRole( 'menuitemradio', {
					name: 'Radio item one Radio suffix',
				} )
			).toBeInTheDocument();
		} );

		it( 'should display a suffix on checkbox items', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu trigger={ <button>Open dropdown</button> }>
					<DropdownMenuCheckboxItem suffix={ 'Checkbox suffix' }>
						Checkbox item one
					</DropdownMenuCheckboxItem>
				</DropdownMenu>
			);

			// Click to open the menu
			await user.click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);

			// The contents of the suffix are rendered after the item's children
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item one Checkbox suffix',
				} )
			).toBeInTheDocument();
		} );
	} );

	describe( 'typeahead', () => {
		it( 'should highlight matching item', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu trigger={ <button>Open dropdown</button> }>
					<DropdownMenuItem>One</DropdownMenuItem>
					<DropdownMenuItem>Two</DropdownMenuItem>
				</DropdownMenu>
			);

			// Click to open the menu
			await user.click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);
			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();

			// Type "tw", it should match and focus the item with content "Two"
			await user.keyboard( 'tw' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Two' } )
			).toHaveFocus();

			// Wait for the typeahead timer to reset and interpret
			// the next keystrokes as a new search
			await delay( 1000 );

			// Type "on", it should match and focus the item with content "One"
			await user.keyboard( 'on' );
			expect(
				screen.getByRole( 'menuitem', { name: 'One' } )
			).toHaveFocus();
		} );

		it( 'should use the textValue prop if specificied', async () => {
			const user = userEvent.setup();

			render(
				<DropdownMenu trigger={ <button>Open dropdown</button> }>
					<DropdownMenuItem>One</DropdownMenuItem>
					<DropdownMenuItem textValue="Four">Two</DropdownMenuItem>
				</DropdownMenu>
			);

			// Click to open the menu
			await user.click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);
			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();

			// Type "tw", it should not match the item with content "Two" because it
			// that item specifies the "textValue" prop. Therefore, the menu container
			// retains focus.
			await user.keyboard( 'tw' );
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();

			// Wait for the typeahead timer to reset and interpret
			// the next keystrokes as a new search
			await delay( 1000 );

			// Type "fo", it should match and focus the item with textValue "Four"
			await user.keyboard( 'fo' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Two' } )
			).toHaveFocus();
		} );
	} );
} );
