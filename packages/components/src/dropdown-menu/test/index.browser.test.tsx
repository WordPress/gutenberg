import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import { check } from '@wordpress/icons';
import DropdownMenu from '..';
import MenuItem from '../../menu-item';
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
