import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import { check } from '@wordpress/icons';
import '@wordpress/theme/design-tokens.css';
import DropdownMenu from '..';
import MenuItem from '../../menu-item';
import MenuItemsChoice from '../../menu-items-choice';
import { NavigableMenu } from '../../navigable-container';
import '../../style.scss';

describe( 'DropdownMenu hover navigation', () => {
	it( 'moves focus to a hovered control and continues keyboard navigation from it', async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		await render(
			<DropdownMenu
				label="Open dropdown"
				controls={ [
					{ title: 'First' },
					{ title: 'Second' },
					{ title: 'Third', onClick },
				] }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open dropdown' } )
		);
		await user.hover( screen.getByRole( 'menuitem', { name: 'Second' } ) );
		expect(
			screen.getByRole( 'menuitem', { name: 'Second' } )
		).toHaveFocus();

		await user.keyboard( '[ArrowDown]' );
		expect(
			screen.getByRole( 'menuitem', { name: 'Third' } )
		).toHaveFocus();
		await user.keyboard( '[Enter]' );
		expect( onClick ).toHaveBeenCalledOnce();
	} );

	it( 'focuses hovered child items without replacing consumer hover handlers', async () => {
		const user = userEvent.setup();
		const onMouseEnter = vi.fn();
		const onMouseMove = vi.fn();
		await render(
			<DropdownMenu label="Open dropdown">
				{ () => (
					<>
						<MenuItem>First</MenuItem>
						<MenuItem
							onMouseEnter={ onMouseEnter }
							onMouseMove={ onMouseMove }
						>
							<span>Second</span>
						</MenuItem>
					</>
				) }
			</DropdownMenu>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open dropdown' } )
		);
		await user.hover( screen.getByText( 'Second' ) );
		expect(
			screen.getByRole( 'menuitem', { name: 'Second' } )
		).toHaveFocus();
		expect( onMouseEnter ).toHaveBeenCalledOnce();
		expect( onMouseMove ).toHaveBeenCalled();
	} );

	it( 'keeps disabled hovered controls focusable without activating them', async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		await render(
			<DropdownMenu
				label="Open dropdown"
				controls={ [
					{ title: 'First' },
					{ title: 'Unavailable', isDisabled: true, onClick },
				] }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open dropdown' } )
		);
		const unavailable = screen.getByRole( 'menuitem', {
			name: 'Unavailable',
		} );
		await user.hover( unavailable );
		expect( unavailable ).toHaveFocus();
		await user.keyboard( '[Enter]' );
		expect( onClick ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();
	} );

	it( 'lets item hover handlers prevent moving focus', async () => {
		const user = userEvent.setup();
		await render(
			<DropdownMenu label="Open dropdown">
				{ () => (
					<>
						<MenuItem>First</MenuItem>
						<MenuItem
							onMouseMove={ ( event ) => event.preventDefault() }
						>
							Second
						</MenuItem>
					</>
				) }
			</DropdownMenu>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open dropdown' } )
		);
		await user.keyboard( '[ArrowDown]' );
		const first = screen.getByRole( 'menuitem', { name: 'First' } );
		await expect.element( first ).toHaveFocus();
		await user.hover( screen.getByRole( 'menuitem', { name: 'Second' } ) );
		expect( first ).toHaveFocus();
	} );

	it( 'does not scroll a partially visible item into view on hover', async () => {
		const user = userEvent.setup();
		await render(
			<NavigableMenu
				aria-label="Scrollable"
				tabIndex={ -1 }
				style={ { height: 40, overflow: 'auto' } }
			>
				<div style={ { height: 30 } } />
				<MenuItem aria-label="Item" style={ { position: 'relative' } }>
					{ /* Keep the pointer target fully visible without scrolling the partially visible item. */ }
					<span
						style={ {
							position: 'absolute',
							top: 2,
							left: 4,
							height: 4,
							overflow: 'hidden',
						} }
					>
						Item
					</span>
				</MenuItem>
				<div style={ { height: 100 } } />
			</NavigableMenu>
		);
		const container = screen.getByLabelText( 'Scrollable' );
		const item = screen.getByRole( 'menuitem', { name: 'Item' } );
		expect( item.getBoundingClientRect().bottom ).toBeGreaterThan(
			container.getBoundingClientRect().bottom
		);
		container.focus();
		await user.hover( screen.getByText( 'Item' ) );
		expect( item ).toHaveFocus();
		expect( container.scrollTop ).toBe( 0 );
	} );
} );

describe( 'DropdownMenu checkbox items', () => {
	const CheckboxMenu = () => {
		const [ selected, setSelected ] = useState( [ 'First', 'Second' ] );

		return (
			<DropdownMenu label="Open dropdown">
				{ () =>
					[ 'First', 'Second' ].map( ( option ) => {
						const isSelected = selected.includes( option );

						return (
							<MenuItem
								key={ option }
								role="menuitemcheckbox"
								isSelected={ isSelected }
								icon={ isSelected ? check : null }
								onClick={ () =>
									setSelected( ( options ) =>
										isSelected
											? options.filter(
													( item ) => item !== option
												)
											: [ ...options, option ]
									)
								}
							>
								{ option }
							</MenuItem>
						);
					} )
				}
			</DropdownMenu>
		);
	};

	it( 'keeps the menu width stable when an item is unchecked', async () => {
		const user = userEvent.setup();
		await render( <CheckboxMenu /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Open dropdown' } )
		);
		const menu = screen.getByRole( 'menu' );
		const initialWidth = menu.getBoundingClientRect().width;

		const first = screen.getByRole( 'menuitemcheckbox', { name: 'First' } );
		await user.click( first );
		await expect
			.element( first )
			.toHaveAttribute( 'aria-checked', 'false' );

		expect( menu.getBoundingClientRect().width ).toBe( initialWidth );
	} );
} );

it( 'keeps choice labels and menu width stable when the selection changes', async () => {
	const { innerWidth, innerHeight } = window;
	onTestFinished( () => page.viewport( innerWidth, innerHeight ) );
	await page.viewport( 800, 600 );
	const ChoicesMenu = () => {
		const [ value, setValue ] = useState( 'visual' );
		return (
			<DropdownMenu label="Choose editor">
				{ () => (
					<MenuItemsChoice
						value={ value }
						onSelect={ setValue }
						choices={ [
							{
								value: 'visual',
								label: 'Visual editor',
								shortcut: 'Ctrl+Shift+V',
							},
							{
								value: 'code',
								label: 'Code editor',
								info: 'Edit the source of your content.',
								shortcut: 'Ctrl+Shift+C',
							},
						] }
					/>
				) }
			</DropdownMenu>
		);
	};
	const user = userEvent.setup();
	await render( <ChoicesMenu /> );
	await user.click( screen.getByRole( 'button', { name: 'Choose editor' } ) );

	const menu = screen.getByRole( 'menu' );
	const visual = screen.getByRole( 'menuitemradio', {
		name: /Visual editor/,
	} );
	const code = screen.getByRole( 'menuitemradio', { name: /Code editor/ } );
	const visualLabel = screen.getByText( 'Visual editor' );
	const codeLabel = screen.getByText( 'Code editor' );
	const initialWidth = menu.getBoundingClientRect().width;
	const labelLeft = visualLabel.getBoundingClientRect().left;
	// The decorative selection marks have no accessible role to query.
	// eslint-disable-next-line testing-library/no-node-access
	const visualIcon = visual.querySelector( 'svg' )!;
	// eslint-disable-next-line testing-library/no-node-access
	const codeIcon = code.querySelector( 'svg' )!;
	// The popup owns the inset outside the menu's items.
	// eslint-disable-next-line testing-library/no-node-access
	const popup = menu.closest( '.components-popover__content' )!;

	expect( codeLabel.getBoundingClientRect().left ).toBe( labelLeft );
	expect(
		visualIcon.getBoundingClientRect().left -
			popup.getBoundingClientRect().left
	).toBe( 7 );
	expect( visualIcon.getBoundingClientRect().right ).toBeLessThanOrEqual(
		labelLeft
	);
	expect( visualIcon ).toBeVisible();
	expect( codeIcon ).not.toBeVisible();
	expect(
		screen.getByText( 'Ctrl+Shift+V' ).getBoundingClientRect().left
	).toBeGreaterThan( visualLabel.getBoundingClientRect().right );

	await user.click( code );
	await expect.element( code ).toBeChecked();
	expect( visual ).not.toBeChecked();
	expect( visualIcon ).not.toBeVisible();
	expect( codeIcon ).toBeVisible();
	expect( menu.getBoundingClientRect().width ).toBe( initialWidth );
	expect( visualLabel.getBoundingClientRect().left ).toBe( labelLeft );
	expect( codeLabel.getBoundingClientRect().left ).toBe( labelLeft );
} );
