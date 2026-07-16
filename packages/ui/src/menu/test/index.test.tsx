import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useId } from '@wordpress/element';
import * as Menu from '../index';

// The prefix slot is presentational, so this structural regression is not
// observable through Testing Library's semantic queries.
function queryItemPrefix( item: HTMLElement ) {
	return item.querySelector( '.style-item-prefix' );
}

function queryItemShortcut( item: HTMLElement ) {
	return item.querySelector( '.style-item-shortcut' );
}

function queryItemSuffix( item: HTMLElement ) {
	return item.querySelector( '.style-item-suffix' );
}

function queryItemTrailing( item: HTMLElement ) {
	return item.querySelector( '.style-item-trailing' );
}

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

	it( 'uses shortcut metadata for visual and accessible item descriptions', async () => {
		const user = userEvent.setup();

		function MenuWithShortcutDescription() {
			const externalDescriptionId = useId();

			return (
				<Menu.Root>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup>
						<span id={ externalDescriptionId }>
							Available offline.
						</span>
						<Menu.Item
							aria-describedby={ externalDescriptionId }
							shortcut={ {
								displayShortcut: '⌘S',
								ariaKeyShortcut: 'Meta+S',
								description: 'Command S',
							} }
						>
							<Menu.ItemLabel>Save</Menu.ItemLabel>
							<Menu.ItemDescription>
								Save the current file.
							</Menu.ItemDescription>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			);
		}

		render( <MenuWithShortcutDescription /> );

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', {
			name: 'Save',
			description:
				'Available offline. Save the current file. Keyboard shortcut: Command S',
		} );
		const shortcut = queryItemShortcut( item );
		const externalDescription = screen.getByText( 'Available offline.' );
		const description = screen.getByText( 'Save the current file.' );
		const shortcutDescription = screen.getByText(
			'Keyboard shortcut: Command S'
		);

		expect( item ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );
		expect( shortcut ).toHaveTextContent( '⌘S' );
		expect( shortcut ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( item ).toHaveAttribute(
			'aria-describedby',
			`${ externalDescription.id } ${ description.id } ${ shortcutDescription.id }`
		);
	} );

	it( 'supports shortcut metadata across menu item variants', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem
						href="https://wordpress.org"
						shortcut={ {
							displayShortcut: '⌘L',
							ariaKeyShortcut: 'Meta+L',
							description: 'Command L',
						} }
					>
						WordPress.org
					</Menu.LinkItem>
					<Menu.CheckboxItem
						checked
						shortcut={ {
							displayShortcut: '⌘B',
							ariaKeyShortcut: 'Meta+B',
							description: 'Command B',
						} }
					>
						Bookmarks
					</Menu.CheckboxItem>
					<Menu.RadioGroup value="list">
						<Menu.RadioItem
							value="list"
							shortcut={ {
								displayShortcut: '⌘1',
								ariaKeyShortcut: 'Meta+1',
								description: 'Command 1',
							} }
						>
							List
						</Menu.RadioItem>
					</Menu.RadioGroup>
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger
							shortcut={ {
								displayShortcut: '⌘M',
								ariaKeyShortcut: 'Meta+M',
								description: 'Command M',
							} }
						>
							Move to
						</Menu.SubmenuTrigger>
						<Menu.Popup>
							<Menu.Item>Archive</Menu.Item>
						</Menu.Popup>
					</Menu.SubmenuRoot>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		expect(
			await screen.findByRole( 'menuitem', { name: 'WordPress.org' } )
		).toHaveAttribute( 'aria-keyshortcuts', 'Meta+L' );
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Bookmarks' } )
		).toHaveAttribute( 'aria-keyshortcuts', 'Meta+B' );
		expect(
			screen.getByRole( 'menuitemradio', { name: 'List' } )
		).toHaveAttribute( 'aria-keyshortcuts', 'Meta+1' );
		expect(
			screen.getByRole( 'menuitem', { name: 'Move to' } )
		).toHaveAttribute( 'aria-keyshortcuts', 'Meta+M' );
	} );

	it( 'renders submenu suffixes before shortcuts and chevrons after shortcuts', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger
							suffix="Recent"
							shortcut={ {
								displayShortcut: '⌘M',
								ariaKeyShortcut: 'Meta+M',
								description: 'Command M',
							} }
						>
							Move to
						</Menu.SubmenuTrigger>
						<Menu.Popup>
							<Menu.Item>Archive</Menu.Item>
						</Menu.Popup>
					</Menu.SubmenuRoot>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', {
			name: 'Move to',
		} );
		const suffix = queryItemSuffix( item );
		const shortcut = queryItemShortcut( item );
		const trailing = queryItemTrailing( item );

		expect( suffix ).toHaveTextContent( 'Recent' );
		expect( shortcut ).toHaveTextContent( '⌘M' );
		expect( trailing ).toBeInTheDocument();
		expect( suffix?.compareDocumentPosition( shortcut as Node ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect( shortcut?.compareDocumentPosition( trailing as Node ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );

	it( 'does not render empty prefix slots', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>No prefix</Menu.Item>
					<Menu.Item prefix="Prefix">With prefix</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const itemWithoutPrefix = await screen.findByRole( 'menuitem', {
			name: 'No prefix',
		} );
		const itemWithPrefix = screen.getByRole( 'menuitem', {
			name: 'With prefix',
		} );

		expect( queryItemPrefix( itemWithoutPrefix ) ).not.toBeInTheDocument();
		expect( queryItemPrefix( itemWithPrefix ) ).toHaveTextContent(
			'Prefix'
		);
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
		expect( item ).not.toHaveAttribute( 'rel' );
		expect( item ).not.toHaveAttribute(
			'rel',
			expect.stringContaining( 'noreferrer' )
		);
		expect( item ).not.toHaveAttribute(
			'rel',
			expect.stringContaining( 'noopener' )
		);
		expect(
			screen.getAllByLabelText( '(opens in a new tab)' )
		).toHaveLength( 3 );
		expect(
			screen.getByRole( 'menuitem', {
				name: 'Developer resources (opens in a new tab)',
			} )
		).toHaveAttribute( 'rel', 'nofollow' );
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
