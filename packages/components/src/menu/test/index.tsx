/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import { press, click, hover, type } from '@ariakit/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Menu } from '..';

const delay = ( delayInMs: number ) => {
	return new Promise( ( resolve ) => setTimeout( resolve, delayInMs ) );
};

// Open dropdown => open menu
// Submenu trigger item => open submenu

describe( 'Menu', () => {
	// See https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
	it( 'should follow the WAI-ARIA spec', async () => {
		render(
			<Menu>
				<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item>Menu item</Menu.Item>
					<Menu.Separator />
					<Menu>
						<Menu.SubmenuTriggerItem>
							Submenu trigger item
						</Menu.SubmenuTriggerItem>
						<Menu.Popover>
							<Menu.Item>Submenu item 1</Menu.Item>
							<Menu.Item>Submenu item 2</Menu.Item>
						</Menu.Popover>
					</Menu>
				</Menu.Popover>
			</Menu>
		);

		const toggleButton = screen.getByRole( 'button', {
			name: 'Open dropdown',
		} );

		expect( toggleButton ).toHaveAttribute( 'aria-haspopup', 'menu' );
		expect( toggleButton ).toHaveAttribute( 'aria-expanded', 'false' );

		await click( toggleButton );

		expect( toggleButton ).toHaveAttribute( 'aria-expanded', 'true' );

		await waitFor( () =>
			expect(
				screen.getByRole( 'menu', {
					name: toggleButton.textContent ?? '',
				} )
			).toHaveFocus()
		);

		expect( screen.getByRole( 'separator' ) ).toHaveAttribute(
			'aria-orientation',
			'horizontal'
		);
		expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 2 );

		const submenuTrigger = screen.getByRole( 'menuitem', {
			name: 'Submenu trigger item',
		} );
		expect( submenuTrigger ).toHaveAttribute( 'aria-haspopup', 'menu' );
		expect( submenuTrigger ).toHaveAttribute( 'aria-expanded', 'false' );

		await hover( submenuTrigger );

		// Wait for the open animation after hovering
		await waitFor( () =>
			expect(
				screen.getByRole( 'menu', {
					name: submenuTrigger.textContent ?? '',
				} )
			).toBeVisible()
		);

		expect( submenuTrigger ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( submenuTrigger ).toHaveAttribute(
			'aria-controls',
			screen.getAllByRole( 'menu' )[ 1 ].id
		);
	} );

	describe( 'pointer and keyboard interactions', () => {
		it( 'should open and focus the menu when clicking the trigger', async () => {
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item>Menu item</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			const toggleButton = screen.getByRole( 'button', {
				name: 'Open dropdown',
			} );

			// Menu closed
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();

			// Click to open the menu
			await click( toggleButton );

			// Menu open, focus is on the menu wrapper
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();
		} );

		it( 'should open and focus the first item when pressing the arrow down key on the trigger', async () => {
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item disabled>First item</Menu.Item>
						<Menu.Item>Second item</Menu.Item>
						<Menu.Item>Third item</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			const toggleButton = screen.getByRole( 'button', {
				name: 'Open dropdown',
			} );

			// Move focus on the toggle
			await press.Tab();

			expect( toggleButton ).toHaveFocus();

			// Menu closed
			expect( screen.queryByRole( 'menuitem' ) ).not.toBeInTheDocument();

			await press.ArrowDown();

			// Menu open, focus is on the first focusable item
			// (disabled items are still focusable and accessible)
			expect(
				screen.getByRole( 'menuitem', { name: 'First item' } )
			).toHaveFocus();
		} );

		it( 'should open and focus the first item when pressing the space key on the trigger', async () => {
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item disabled>First item</Menu.Item>
						<Menu.Item>Second item</Menu.Item>
						<Menu.Item>Third item</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			const toggleButton = screen.getByRole( 'button', {
				name: 'Open dropdown',
			} );

			// Move focus on the toggle
			await press.Tab();

			expect( toggleButton ).toHaveFocus();

			// Menu closed
			expect( screen.queryByRole( 'menuitem' ) ).not.toBeInTheDocument();

			await press.Space();

			// Menu open, focus is on the first focusable item
			// (disabled items are still focusable and accessible
			expect(
				screen.getByRole( 'menuitem', { name: 'First item' } )
			).toHaveFocus();
		} );

		it( 'should close when pressing the escape key', async () => {
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item>Menu item</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			const trigger = screen.getByRole( 'button', {
				name: 'Open dropdown',
			} );

			await click( trigger );

			// Focuses menu on mouse click, focuses first item on keyboard press
			// Can be changed with a custom useEffect
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();

			// Pressing esc will close the menu and move focus to the toggle
			await press.Escape();

			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();

			await waitFor( () =>
				expect(
					screen.getByRole( 'button', { name: 'Open dropdown' } )
				).toHaveFocus()
			);
		} );

		it( 'should close when clicking outside of the content', async () => {
			render(
				<Menu defaultOpen>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item>Menu item</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();

			// Click on the body (ie. outside of the dropdown menu)
			await click( document.body );

			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );

		it( 'should close when clicking on a menu item', async () => {
			render(
				<Menu defaultOpen>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item>Menu item</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();

			// Clicking a menu item will close the menu
			await click( screen.getByRole( 'menuitem' ) );

			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );

		it( 'should not close when clicking on a menu item when the `hideOnClick` prop is set to `false`', async () => {
			render(
				<Menu defaultOpen>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item hideOnClick={ false }>Menu item</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			expect( screen.getByRole( 'menu' ) ).toBeVisible();

			// Clicking a menu item will close the menu
			await click( screen.getByRole( 'menuitem' ) );

			expect( screen.getByRole( 'menu' ) ).toBeVisible();
		} );

		it( 'should not close when clicking on a disabled menu item', async () => {
			render(
				<Menu defaultOpen>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item disabled>Menu item</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();

			// Clicking a disabled menu item won't close the menu
			await click( screen.getByRole( 'menuitem' ) );

			expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();
		} );

		it( 'should reveal submenu content when hovering over the submenu trigger', async () => {
			render(
				<Menu defaultOpen>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item>Menu item 1</Menu.Item>
						<Menu.Item>Menu item 2</Menu.Item>
						<Menu>
							<Menu.SubmenuTriggerItem>
								Submenu trigger item
							</Menu.SubmenuTriggerItem>
							<Menu.Popover>
								<Menu.Item>Submenu item 1</Menu.Item>
								<Menu.Item>Submenu item 2</Menu.Item>
							</Menu.Popover>
						</Menu>
						<Menu.Item>Menu item 3</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			// Before hover, submenu items are not rendered
			expect(
				screen.queryByRole( 'menuitem', {
					name: 'Submenu item 1',
				} )
			).not.toBeInTheDocument();

			await hover(
				screen.getByRole( 'menuitem', { name: 'Submenu trigger item' } )
			);

			// After hover, submenu items are rendered
			// Reason for `findByRole`: due to the animation, we've got to wait
			// a short amount of time for the submenu to appear
			await screen.findByRole( 'menuitem', {
				name: 'Submenu item 1',
			} );
		} );

		it( 'should navigate menu items and subitems using the arrow, spacebar and enter keys', async () => {
			render(
				<Menu defaultOpen>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item>Menu item 1</Menu.Item>
						<Menu.Item>Menu item 2</Menu.Item>
						<Menu>
							<Menu.SubmenuTriggerItem>
								Submenu trigger item
							</Menu.SubmenuTriggerItem>
							<Menu.Popover>
								<Menu.Item>Submenu item 1</Menu.Item>
								<Menu.Item>Submenu item 2</Menu.Item>
							</Menu.Popover>
						</Menu>
						<Menu.Item>Menu item 3</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			// The menu is focused automatically when `defaultOpen` is set.
			await waitFor( () =>
				expect( screen.getByRole( 'menu' ) ).toHaveFocus()
			);

			// Arrow up/down selects menu items
			// The selection wraps around from last to first and viceversa
			await press.ArrowDown();
			expect(
				screen.getByRole( 'menuitem', { name: 'Menu item 1' } )
			).toHaveFocus();

			await press.ArrowDown();
			expect(
				screen.getByRole( 'menuitem', { name: 'Menu item 2' } )
			).toHaveFocus();

			await press.ArrowDown();
			expect(
				screen.getByRole( 'menuitem', { name: 'Submenu trigger item' } )
			).toHaveFocus();

			await press.ArrowDown();
			expect(
				screen.getByRole( 'menuitem', { name: 'Menu item 3' } )
			).toHaveFocus();

			await press.ArrowDown();
			expect(
				screen.getByRole( 'menuitem', { name: 'Menu item 1' } )
			).toHaveFocus();

			await press.ArrowUp();
			expect(
				screen.getByRole( 'menuitem', { name: 'Menu item 3' } )
			).toHaveFocus();

			await press.ArrowUp();
			expect(
				screen.getByRole( 'menuitem', { name: 'Submenu trigger item' } )
			).toHaveFocus();

			// Arrow right/left can be used to enter/leave submenus
			await press.ArrowRight();
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Submenu item 1',
				} )
			).toHaveFocus();

			await press.ArrowDown();
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Submenu item 2',
				} )
			).toHaveFocus();

			await press.ArrowLeft();
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Submenu trigger item',
				} )
			).toHaveFocus();

			// Spacebar or enter key can also be used to enter a submenu
			await press.Enter();
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Submenu item 1',
				} )
			).toHaveFocus();

			await press.ArrowLeft();
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Submenu trigger item',
				} )
			).toHaveFocus();

			await press.Space();
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Submenu item 1',
				} )
			).toHaveFocus();

			await press.ArrowLeft();
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Submenu trigger item',
				} )
			).toHaveFocus();
		} );

		it( 'should check radio items and keep the menu open when clicking (controlled)', async () => {
			const onRadioValueChangeSpy = jest.fn();

			const ControlledRadioGroup = () => {
				const [ radioValue, setRadioValue ] = useState( 'two' );
				const onRadioChange: React.ComponentProps<
					typeof Menu.RadioItem
				>[ 'onChange' ] = ( e ) => {
					onRadioValueChangeSpy( e.target.value );
					setRadioValue( e.target.value );
				};
				return (
					<Menu>
						<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
						<Menu.Popover>
							<Menu.Group>
								<Menu.RadioItem
									name="radio-test"
									value="radio-one"
									checked={ radioValue === 'radio-one' }
									onChange={ onRadioChange }
								>
									Radio item one
								</Menu.RadioItem>
								<Menu.RadioItem
									name="radio-test"
									value="radio-two"
									checked={ radioValue === 'radio-two' }
									onChange={ onRadioChange }
								>
									Radio item two
								</Menu.RadioItem>
							</Menu.Group>
						</Menu.Popover>
					</Menu>
				);
			};

			render( <ControlledRadioGroup /> );

			// Open dropdown
			await click(
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
			await click(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			);
			expect( onRadioValueChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onRadioValueChangeSpy ).toHaveBeenLastCalledWith(
				'radio-one'
			);

			// Make sure that first radio is checked
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			).toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			).not.toBeChecked();

			// Click second radio item, make sure that the callback fires
			await click(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			);
			expect( onRadioValueChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onRadioValueChangeSpy ).toHaveBeenLastCalledWith(
				'radio-two'
			);

			// Make sure that second radio is selected
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			).not.toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			).toBeChecked();
		} );

		it( 'should check radio items and keep the menu open when clicking (uncontrolled)', async () => {
			const onRadioValueChangeSpy = jest.fn();
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Group>
							<Menu.RadioItem
								name="radio-test"
								value="radio-one"
								onChange={ ( e ) =>
									onRadioValueChangeSpy( e.target.value )
								}
							>
								Radio item one
							</Menu.RadioItem>
							<Menu.RadioItem
								name="radio-test"
								value="radio-two"
								defaultChecked
								onChange={ ( e ) =>
									onRadioValueChangeSpy( e.target.value )
								}
							>
								Radio item two
							</Menu.RadioItem>
						</Menu.Group>
					</Menu.Popover>
				</Menu>
			);

			// Open dropdown
			await click(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			);

			// Radio item two should be checked (`defaultChecked` prop)
			expect( screen.getAllByRole( 'menuitemradio' ) ).toHaveLength( 2 );
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			).not.toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			).toBeChecked();

			// Click first radio item, make sure that the callback fires
			await click(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			);
			expect( onRadioValueChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onRadioValueChangeSpy ).toHaveBeenLastCalledWith(
				'radio-one'
			);

			// Make sure that first radio is checked
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			).toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			).not.toBeChecked();

			// Click second radio item, make sure that the callback fires
			await click(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			);
			expect( onRadioValueChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onRadioValueChangeSpy ).toHaveBeenLastCalledWith(
				'radio-two'
			);

			// Make sure that second radio is selected
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item one' } )
			).not.toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Radio item two' } )
			).toBeChecked();
		} );

		it( 'should check checkbox items and keep the menu open when clicking (controlled)', async () => {
			const onCheckboxValueChangeSpy = jest.fn();

			const ControlledRadioGroup = () => {
				const [ itemOneChecked, setItemOneChecked ] =
					useState< boolean >();
				const [ itemTwoChecked, setItemTwoChecked ] =
					useState< boolean >();

				return (
					<Menu>
						<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
						<Menu.Popover>
							<Menu.CheckboxItem
								name="item-one"
								value="item-one-value"
								checked={ itemOneChecked }
								onChange={ ( e ) => {
									onCheckboxValueChangeSpy(
										e.target.name,
										e.target.value,
										e.target.checked
									);
									setItemOneChecked( e.target.checked );
								} }
							>
								Checkbox item one
							</Menu.CheckboxItem>

							<Menu.CheckboxItem
								name="item-two"
								value="item-two-value"
								checked={ itemTwoChecked }
								onChange={ ( e ) => {
									onCheckboxValueChangeSpy(
										e.target.name,
										e.target.value,
										e.target.checked
									);
									setItemTwoChecked( e.target.checked );
								} }
							>
								Checkbox item two
							</Menu.CheckboxItem>
						</Menu.Popover>
					</Menu>
				);
			};

			render( <ControlledRadioGroup /> );

			// Open dropdown
			await click(
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
			await click(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item one',
				} )
			);
			expect( onCheckboxValueChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onCheckboxValueChangeSpy ).toHaveBeenLastCalledWith(
				'item-one',
				'item-one-value',
				true
			);

			// Make sure that first checkbox is checked
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item one',
				} )
			).toBeChecked();

			// Click second checkbox item, make sure that the callback fires
			await click(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			);
			expect( onCheckboxValueChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onCheckboxValueChangeSpy ).toHaveBeenLastCalledWith(
				'item-two',
				'item-two-value',
				true
			);

			// Make sure that second checkbox is selected
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			).toBeChecked();

			// Click second checkbox item, make sure that the callback fires
			await click(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			);
			expect( onCheckboxValueChangeSpy ).toHaveBeenCalledTimes( 3 );
			expect( onCheckboxValueChangeSpy ).toHaveBeenLastCalledWith(
				'item-two',
				'item-two-value',
				false
			);

			// Make sure that second checkbox is unselected
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			).not.toBeChecked();
		} );

		it( 'should check checkbox items and keep the menu open when clicking (uncontrolled)', async () => {
			const onCheckboxValueChangeSpy = jest.fn();

			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.CheckboxItem
							name="item-one"
							value="item-one-value"
							onChange={ ( e ) => {
								onCheckboxValueChangeSpy(
									e.target.name,
									e.target.value,
									e.target.checked
								);
							} }
						>
							Checkbox item one
						</Menu.CheckboxItem>

						<Menu.CheckboxItem
							name="item-two"
							value="item-two-value"
							defaultChecked
							onChange={ ( e ) => {
								onCheckboxValueChangeSpy(
									e.target.name,
									e.target.value,
									e.target.checked
								);
							} }
						>
							Checkbox item two
						</Menu.CheckboxItem>
					</Menu.Popover>
				</Menu>
			);

			// Open dropdown
			await click(
				screen.getByRole( 'button', { name: 'Open dropdown' } )
			);

			// Checkbox item two should be checked (`defaultChecked`)
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
			).toBeChecked();

			// Click first checkbox item, make sure that the callback fires
			await click(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item one',
				} )
			);
			expect( onCheckboxValueChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onCheckboxValueChangeSpy ).toHaveBeenLastCalledWith(
				'item-one',
				'item-one-value',
				true
			);

			// Make sure that first checkbox is checked
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item one',
				} )
			).toBeChecked();

			// Click second checkbox item, make sure that the callback fires
			await click(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			);
			expect( onCheckboxValueChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onCheckboxValueChangeSpy ).toHaveBeenLastCalledWith(
				'item-two',
				'item-two-value',
				false
			);

			// Make sure that second checkbox is unchecked
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			).not.toBeChecked();

			// Click second checkbox item, make sure that the callback fires
			await click(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			);
			expect( onCheckboxValueChangeSpy ).toHaveBeenCalledTimes( 3 );
			expect( onCheckboxValueChangeSpy ).toHaveBeenLastCalledWith(
				'item-two',
				'item-two-value',
				true
			);

			// Make sure that second checkbox is unselected
			expect(
				screen.getByRole( 'menuitemcheckbox', {
					name: 'Checkbox item two',
				} )
			).toBeChecked();
		} );
	} );

	describe( 'modality', () => {
		it( 'should be modal by default', async () => {
			render(
				<>
					<Menu>
						<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
						<Menu.Popover>
							<Menu.Item>Menu item</Menu.Item>
						</Menu.Popover>
					</Menu>
					<button>Button outside of dropdown</button>
				</>
			);

			// Click to open the menu
			await click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);

			// Menu open, focus is on the menu wrapper
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();

			expect(
				screen.queryByRole( 'button', {
					name: 'Button outside of dropdown',
				} )
			).not.toBeInTheDocument();
		} );

		it( 'should not be modal when the `modal` prop is set to `false`', async () => {
			render(
				<>
					<Menu>
						<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
						<Menu.Popover modal={ false }>
							<Menu.Item>Menu item</Menu.Item>
						</Menu.Popover>
					</Menu>
					<button>Button outside of dropdown</button>
				</>
			);

			// Click to open the menu
			await click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);

			// Menu open, focus is on the menu wrapper
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();

			// Menu is not modal, therefore the outer button is part of the
			// accessibility tree and can be found.
			const outerButton = screen.getByRole( 'button', {
				name: 'Button outside of dropdown',
			} );

			// The outer button can be focused by pressing tab. Doing so will cause
			// the Menu to close.
			await press.Tab();
			expect( outerButton ).toBeInTheDocument();
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'items prefix and suffix', () => {
		it( 'should display a prefix on regular items', async () => {
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item prefix={ <>Item prefix</> }>
							Menu item
						</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			// Click to open the menu
			await click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);

			// The contents of the prefix are rendered before the item's children
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Item prefix Menu item',
				} )
			).toBeInTheDocument();
		} );

		it( 'should display a suffix on regular items', async () => {
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item suffix={ <>Item suffix</> }>
							Menu item
						</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			// Click to open the menu
			await click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);

			// The contents of the suffix are rendered after the item's children
			expect(
				screen.getByRole( 'menuitem', {
					name: 'Menu item Item suffix',
				} )
			).toBeInTheDocument();
		} );

		it( 'should display a suffix on radio items', async () => {
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.RadioItem
							name="radio-test"
							value="radio-one"
							suffix="Radio suffix"
						>
							Radio item one
						</Menu.RadioItem>
					</Menu.Popover>
				</Menu>
			);

			// Click to open the menu
			await click(
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
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.CheckboxItem
							name="checkbox-test"
							value="checkbox-one"
							suffix="Checkbox suffix"
						>
							Checkbox item one
						</Menu.CheckboxItem>
					</Menu.Popover>
				</Menu>
			);

			// Click to open the menu
			await click(
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
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item>One</Menu.Item>
						<Menu.Item>Two</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			// Click to open the menu
			await click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();

			// Type "tw", it should match and focus the item with content "Two"
			await type( 'tw' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Two' } )
			).toHaveFocus();

			// Wait for the typeahead timer to reset and interpret
			// the next keystrokes as a new search
			await delay( 500 );

			// Type "on", it should match and focus the item with content "One"
			await type( 'on' );
			expect(
				screen.getByRole( 'menuitem', { name: 'One' } )
			).toHaveFocus();
		} );

		it( 'should keep previous focus when no matches are found', async () => {
			render(
				<Menu>
					<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item>One</Menu.Item>
						<Menu.Item>Two</Menu.Item>
					</Menu.Popover>
				</Menu>
			);

			// Click to open the menu
			await click(
				screen.getByRole( 'button', {
					name: 'Open dropdown',
				} )
			);
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();

			// Type a string that doesn't match any items. Focus shouldn't move.
			await type( 'abc' );
			expect( screen.getByRole( 'menu' ) ).toHaveFocus();

			// Wait for the typeahead timer to reset and interpret
			// the next keystrokes as a new search
			await delay( 500 );

			// Type "on", it should match and focus the item with content "One"
			await type( 'on' );
			expect(
				screen.getByRole( 'menuitem', { name: 'One' } )
			).toHaveFocus();

			// Wait for the typeahead timer to reset and interpret
			// the next keystrokes as a new search
			await delay( 500 );

			// Type a string that doesn't match any items. Focus shouldn't move.
			await type( 'abc' );
			expect(
				screen.getByRole( 'menuitem', { name: 'One' } )
			).toHaveFocus();

			// Wait for the typeahead timer to reset and interpret
			// the next keystrokes as a new search
			await delay( 500 );

			// Type "tw", it should match and focus the item with content "Two"
			await type( 'tw' );
			expect(
				screen.getByRole( 'menuitem', { name: 'Two' } )
			).toHaveFocus();
		} );
	} );
} );
