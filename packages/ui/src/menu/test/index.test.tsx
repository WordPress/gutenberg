import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Menu from '../index';

describe( 'Menu', () => {
	it( 'opens from the trigger and exposes menu semantics', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>Duplicate</Menu.Item>
					<Menu.Separator />
					<Menu.LinkItem href="https://wordpress.org">
						WordPress.org
					</Menu.LinkItem>
					<Menu.Item>Delete</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		expect( trigger ).toHaveAttribute( 'aria-haspopup', 'menu' );
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );

		await user.click( trigger );

		expect( await screen.findByRole( 'menu' ) ).toBeVisible();
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
		expect(
			screen.getByRole( 'menuitem', { name: 'Duplicate' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'menuitem', { name: 'WordPress.org' } )
		).toHaveAttribute( 'href', 'https://wordpress.org' );
		expect( screen.getByRole( 'separator' ) ).toBeVisible();
	} );

	it( 'closes when Escape is pressed', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>Duplicate</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();

		await user.keyboard( '{Escape}' );

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
		expect(
			screen.getByRole( 'button', { name: 'Actions' } )
		).toHaveFocus();
	} );

	it( 'renders checkbox and radio item roles', async () => {
		const user = userEvent.setup();
		const onCheckedChange = jest.fn();
		const onValueChange = jest.fn();

		render(
			<Menu.Root>
				<Menu.Trigger>View</Menu.Trigger>
				<Menu.Popup>
					<Menu.CheckboxItem
						checked
						onCheckedChange={ onCheckedChange }
					>
						Show sidebar
					</Menu.CheckboxItem>
					<Menu.RadioGroup
						value="comfortable"
						onValueChange={ onValueChange }
					>
						<Menu.RadioItem value="compact">Compact</Menu.RadioItem>
						<Menu.RadioItem value="comfortable">
							Comfortable
						</Menu.RadioItem>
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'View' } ) );

		const checkbox = await screen.findByRole( 'menuitemcheckbox', {
			name: 'Show sidebar',
		} );
		const radio = screen.getByRole( 'menuitemradio', {
			name: 'Comfortable',
		} );

		expect( checkbox ).toBeChecked();
		expect( radio ).toBeChecked();

		await user.click( checkbox );
		expect( onCheckedChange ).toHaveBeenCalledWith(
			false,
			expect.objectContaining( { reason: expect.any( String ) } )
		);
	} );

	it( 'uses item descriptions as accessible descriptions', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
						<Menu.ItemDescription>
							Create a separate copy.
						</Menu.ItemDescription>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', {
			name: 'Duplicate',
		} );

		expect( item ).toHaveAccessibleDescription( 'Create a separate copy.' );
	} );

	it( 'does not generate a label relationship when an explicit aria-label is provided', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item aria-label="Archive current item">
						<Menu.ItemLabel>Archive</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		expect(
			await screen.findByRole( 'menuitem', {
				name: 'Archive current item',
			} )
		).not.toHaveAttribute( 'aria-labelledby' );
	} );

	it( 'supports custom portal and positioner elements', async () => {
		const user = userEvent.setup();
		const containerRef = createRef< HTMLDivElement >();

		render(
			<div data-testid="wrapper">
				<Menu.Root>
					<Menu.Trigger>Actions</Menu.Trigger>
					<div ref={ containerRef } data-testid="custom-container" />
					<Menu.Popup
						portal={ <Menu.Portal container={ containerRef } /> }
						positioner={
							<Menu.Positioner data-testid="custom-positioner" />
						}
					>
						<Menu.Item>Duplicate</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			</div>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const menu = await screen.findByRole( 'menu' );
		expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
			menu
		);
		expect( screen.getByTestId( 'custom-positioner' ) ).toContainElement(
			menu
		);
	} );

	it( 'uses Menu placement defaults from @wordpress/components', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup
					positioner={
						<Menu.Positioner data-testid="root-positioner" />
					}
				>
					<Menu.Item>Duplicate</Menu.Item>
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger openOnHover={ false }>
							Move to
						</Menu.SubmenuTrigger>
						<Menu.Popup
							positioner={
								<Menu.Positioner data-testid="submenu-positioner" />
							}
						>
							<Menu.Item>Archive</Menu.Item>
						</Menu.Popup>
					</Menu.SubmenuRoot>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Move to' } )
		);

		expect(
			await screen.findByRole( 'menuitem', { name: 'Archive' } )
		).toBeVisible();
		expect( screen.getByTestId( 'root-positioner' ) ).toHaveAttribute(
			'data-side',
			'bottom'
		);
		expect( screen.getByTestId( 'root-positioner' ) ).toHaveAttribute(
			'data-align',
			'start'
		);
		expect( screen.getByTestId( 'submenu-positioner' ) ).toHaveAttribute(
			'data-side',
			expect.stringMatching( /^inline-/ )
		);
		expect( screen.getByTestId( 'submenu-positioner' ) ).toHaveAttribute(
			'data-align',
			'start'
		);
	} );

	it( 'forwards refs', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();
		const itemLabelRef = createRef< HTMLSpanElement >();
		const itemDescriptionRef = createRef< HTMLSpanElement >();

		render(
			<Menu.Root>
				<Menu.Trigger ref={ triggerRef }>Actions</Menu.Trigger>
				<Menu.Popup ref={ popupRef }>
					<Menu.Item ref={ itemRef }>
						<Menu.ItemLabel ref={ itemLabelRef }>
							Duplicate
						</Menu.ItemLabel>
						<Menu.ItemDescription ref={ itemDescriptionRef }>
							Create a copy.
						</Menu.ItemDescription>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		await waitFor( () => {
			expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( itemRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( itemLabelRef.current ).toBeInstanceOf( HTMLSpanElement );
			expect( itemDescriptionRef.current ).toBeInstanceOf(
				HTMLSpanElement
			);
		} );
	} );
} );
