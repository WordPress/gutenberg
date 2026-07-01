import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useId } from '@wordpress/element';
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
						prefix="Checkbox prefix"
					>
						Show sidebar
					</Menu.CheckboxItem>
					<Menu.RadioGroup
						value="comfortable"
						onValueChange={ onValueChange }
					>
						<Menu.RadioItem value="compact">Compact</Menu.RadioItem>
						<Menu.RadioItem
							value="comfortable"
							prefix="Radio prefix"
						>
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
		expect( checkbox ).toHaveAccessibleName( 'Show sidebar' );
		expect( radio ).toHaveAccessibleName( 'Comfortable' );
		expect( screen.getByText( 'Checkbox prefix' ) ).toBeVisible();
		expect( screen.getByText( 'Radio prefix' ) ).toBeVisible();

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

	it( 'supports link items that open in a new tab', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem href="https://wordpress.org" openInNewTab>
						WordPress.org
					</Menu.LinkItem>
					<Menu.LinkItem
						href="https://developer.wordpress.org"
						openInNewTab
						rel="nofollow"
					>
						Developer resources
					</Menu.LinkItem>
					<Menu.LinkItem
						aria-label="WordPress project"
						href="https://make.wordpress.org"
						openInNewTab
					>
						Make WordPress
					</Menu.LinkItem>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', {
			name: 'WordPress.org (opens in a new tab)',
		} );

		expect( item ).toHaveAttribute( 'target', '_blank' );
		expect( item ).toHaveAttribute( 'rel', 'noopener' );
		expect(
			screen.getAllByLabelText( '(opens in a new tab)' )
		).toHaveLength( 3 );
		expect(
			screen.getByRole( 'menuitem', {
				name: 'Developer resources (opens in a new tab)',
			} )
		).toHaveAttribute( 'rel', 'nofollow noopener' );
		expect(
			screen.getByRole( 'menuitem', { name: 'WordPress project' } )
		).not.toHaveAttribute( 'aria-labelledby' );
	} );

	it( 'uses custom item label and description ids for generated aria relationships', async () => {
		const user = userEvent.setup();

		function MenuWithCustomTextIds() {
			const externalDescriptionId = useId();
			const labelId = useId();
			const descriptionId = useId();

			return (
				<Menu.Root>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup>
						<span id={ externalDescriptionId }>
							Available offline.
						</span>
						<Menu.Item aria-describedby={ externalDescriptionId }>
							<Menu.ItemLabel id={ labelId }>
								Download
							</Menu.ItemLabel>
							<Menu.ItemDescription id={ descriptionId }>
								Save a local copy.
							</Menu.ItemDescription>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			);
		}

		render( <MenuWithCustomTextIds /> );

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await screen.findByRole( 'menu' );

		const label = screen.getByText( 'Download' );
		const externalDescription = screen.getByText( 'Available offline.' );
		const description = screen.getByText( 'Save a local copy.' );
		const item = await screen.findByRole( 'menuitem', {
			name: 'Download',
			description: 'Available offline. Save a local copy.',
		} );

		expect( item ).toHaveAttribute( 'aria-labelledby', label.id );
		expect( item ).toHaveAttribute(
			'aria-describedby',
			`${ externalDescription.id } ${ description.id }`
		);
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
