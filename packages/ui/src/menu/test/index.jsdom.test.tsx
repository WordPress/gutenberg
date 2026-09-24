import {
	afterEach,
	describe,
	expect,
	it,
	vi,
	type MockedFunction,
} from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useId, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import * as Menu from '../index';

vi.mock( import( '@wordpress/i18n' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	isRTL: vi.fn( () => false ),
} ) );

const mockedIsRTL = isRTL as MockedFunction< typeof isRTL >;

globalThis.wpVitest.mockPointerEvent();
globalThis.wpVitest.mockScrollIntoView();
afterEach( () => {
	mockedIsRTL.mockClear();
	mockedIsRTL.mockReturnValue( false );
} );

// The prefix slot is presentational, so this structural regression is not
// observable through Testing Library's semantic queries.
function queryItemPrefix( item: HTMLElement ) {
	return item.querySelector< HTMLElement >( '.style-item-prefix' );
}

function queryItemContent( item: HTMLElement ) {
	return item.querySelector< HTMLElement >( '.style-item-content' );
}

function queryItemSelectionIndicator( item: HTMLElement ) {
	return item.querySelector< HTMLElement >(
		'.style-item-selection-indicator'
	);
}

function queryItemLabel( item: HTMLElement ) {
	return item.querySelector< HTMLElement >( '.style-item-label' );
}

function queryItemShortcut( item: HTMLElement ) {
	return item.querySelector< HTMLElement >( '.style-item-shortcut' );
}

function queryItemShortcutDisplay( item: HTMLElement ) {
	return queryItemShortcut( item )?.querySelector< HTMLElement >(
		'[aria-hidden="true"]'
	);
}

function queryItemSuffix( item: HTMLElement ) {
	return item.querySelector< HTMLElement >( '.style-item-suffix' );
}

function queryItemTrailing( item: HTMLElement ) {
	return item.querySelector< HTMLElement >( '.style-item-trailing' );
}

function queryExternalLinkIndicator( item: HTMLElement ) {
	return item.querySelector< HTMLElement >(
		'.style-external-link-indicator'
	);
}

describe( 'Menu', () => {
	it( 'renders prefix icons at 24px by default', () => {
		render( <Menu.PrefixIcon icon={ <svg /> } role="img" /> );

		const icon = screen.getByRole( 'img', { hidden: true } );
		expect( icon ).toHaveAttribute( 'width', '24' );
		expect( icon ).toHaveAttribute( 'height', '24' );
	} );

	it( 'supports custom icon sizes and forwards SVG props and refs', () => {
		const ref = createRef< SVGSVGElement >();
		render(
			<Menu.PrefixIcon
				ref={ ref }
				icon={ <svg viewBox="0 0 24 24" style={ { fill: 'none' } } /> }
				size={ 32 }
				role="img"
				className="custom-icon"
				stroke="currentColor"
				style={ { opacity: 0.5 } }
			/>
		);

		const icon = screen.getByRole( 'img', { hidden: true } );
		expect( ref.current ).toBe( icon );
		expect( icon ).toHaveAttribute( 'width', '32' );
		expect( icon ).toHaveAttribute( 'height', '32' );
		expect( icon ).toHaveAttribute( 'viewBox', '0 0 24 24' );
		expect( icon ).toHaveAttribute( 'stroke', 'currentColor' );
		expect( icon ).toHaveClass( 'custom-icon' );
		// eslint-disable-next-line jest-dom/prefer-to-have-attribute
		expect( icon.getAttribute( 'style' ) ).toContain( 'fill: none;' );
		// eslint-disable-next-line jest-dom/prefer-to-have-attribute
		expect( icon.getAttribute( 'style' ) ).toContain( 'opacity: 0.5;' );
	} );

	it( 'supports rendering the trigger as a non-native button', () => {
		render(
			<Menu.Root>
				<Menu.Trigger nativeButton={ false } render={ <div /> }>
					Actions
				</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		expect( trigger.tagName ).toBe( 'DIV' );
	} );

	it( 'does not expose detached trigger props', () => {
		const triggerWithHandle = (
			// @ts-expect-error Menu does not expose Base UI's handle utility.
			<Menu.Trigger handle={ undefined }>Actions</Menu.Trigger>
		);
		const triggerWithPayload = (
			// @ts-expect-error Menu roots do not support trigger payloads.
			<Menu.Trigger payload={ undefined }>Actions</Menu.Trigger>
		);

		expect( triggerWithHandle ).toBeDefined();
		expect( triggerWithPayload ).toBeDefined();
	} );

	it( 'does not close for pointer interactions inside a menu portaled to an iframe', async () => {
		const user = userEvent.setup();
		const iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );
		const iframeDocument = iframe.contentDocument;

		if ( ! iframeDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}
		const addEventListener = vi.spyOn( iframeDocument, 'addEventListener' );

		try {
			const outsideTarget = iframeDocument.createElement( 'button' );
			iframeDocument.body.appendChild( outsideTarget );

			render(
				<Menu.Root modal={ false }>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup
						portal={
							<Menu.Portal container={ iframeDocument.body } />
						}
					>
						<Menu.Item>
							<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Actions' } )
			);
			const portaledMenu = await within( iframeDocument.body ).findByRole(
				'menu'
			);
			const item = within( portaledMenu ).getByRole( 'menuitem', {
				name: 'Duplicate',
			} );
			await waitFor( () => {
				expect( addEventListener ).toHaveBeenCalledWith(
					'pointerdown',
					expect.any( Function ),
					true
				);
			} );

			act( () => {
				item.dispatchEvent(
					new MouseEvent( 'pointerdown', { bubbles: true } )
				);
			} );
			expect( portaledMenu ).toBeVisible();

			act( () => {
				outsideTarget.dispatchEvent(
					new MouseEvent( 'pointerdown', { bubbles: true } )
				);
			} );
			await waitFor( () => {
				expect( portaledMenu ).not.toBeInTheDocument();
			} );
		} finally {
			iframe.remove();
		}
	} );

	it( 'does not close a disabled non-modal menu on iframe pointerdown', async () => {
		const user = userEvent.setup();

		function MenuDisabledWhileOpen() {
			const [ open, setOpen ] = useState( false );

			return (
				<>
					<Menu.Root
						disabled={ open }
						modal={ false }
						onOpenChange={ setOpen }
						open={ open }
					>
						<Menu.Trigger>Actions</Menu.Trigger>
						<Menu.Popup>
							<Menu.Item>
								<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popup>
					</Menu.Root>
					<iframe title="Editor canvas" />
				</>
			);
		}

		render( <MenuDisabledWhileOpen /> );
		const iframe = screen.getByTitle( 'Editor canvas' );
		const iframeDocument = document.implementation.createHTMLDocument();
		Object.defineProperty( iframe, 'contentDocument', {
			configurable: true,
			get: () => iframeDocument,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();

		act( () => {
			iframeDocument.dispatchEvent(
				new MouseEvent( 'pointerdown', { bubbles: true } )
			);
		} );
		expect( screen.getByRole( 'menu' ) ).toBeVisible();
	} );

	it( 'reattaches the iframe listener after reload and removes it when closed', async () => {
		const user = userEvent.setup();

		const { unmount } = render(
			<>
				<Menu.Root modal={ false }>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup>
						<Menu.Item>
							<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
				<iframe title="Editor canvas" />
			</>
		);

		const iframe = screen.getByTitle( 'Editor canvas' );
		const firstDocument = document.implementation.createHTMLDocument();
		const reloadedDocument = document.implementation.createHTMLDocument();
		let iframeDocument = firstDocument;
		Object.defineProperty( iframe, 'contentDocument', {
			configurable: true,
			get: () => iframeDocument,
		} );
		const firstAddEventListener = vi.spyOn(
			firstDocument,
			'addEventListener'
		);
		const firstRemoveEventListener = vi.spyOn(
			firstDocument,
			'removeEventListener'
		);
		const reloadedAddEventListener = vi.spyOn(
			reloadedDocument,
			'addEventListener'
		);
		const reloadedRemoveEventListener = vi.spyOn(
			reloadedDocument,
			'removeEventListener'
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();
		await waitFor( () => {
			expect( firstAddEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				expect.any( Function ),
				true
			);
		} );

		iframeDocument = reloadedDocument;
		act( () => iframe.dispatchEvent( new Event( 'load' ) ) );

		expect( firstRemoveEventListener ).toHaveBeenCalledWith(
			'pointerdown',
			expect.any( Function ),
			true
		);
		expect( reloadedAddEventListener ).toHaveBeenCalledWith(
			'pointerdown',
			expect.any( Function ),
			true
		);

		await user.keyboard( '{Escape}' );
		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
		expect( reloadedRemoveEventListener ).toHaveBeenCalledWith(
			'pointerdown',
			expect.any( Function ),
			true
		);
		reloadedAddEventListener.mockClear();
		reloadedRemoveEventListener.mockClear();

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();
		await waitFor( () => {
			expect( reloadedAddEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				expect.any( Function ),
				true
			);
		} );
		const reloadedPointerDownListener =
			reloadedAddEventListener.mock.calls.find(
				( [ type, , capture ] ) =>
					type === 'pointerdown' && capture === true
			)?.[ 1 ];
		unmount();
		expect( reloadedRemoveEventListener ).toHaveBeenCalledExactlyOnceWith(
			'pointerdown',
			reloadedPointerDownListener,
			true
		);
	} );

	it( 'moves the listener when an iframe remounts while the menu is open', async () => {
		const user = userEvent.setup();

		function MenuWithIframe( { iframeKey }: { iframeKey: string } ) {
			return (
				<>
					<Menu.Root modal={ false }>
						<Menu.Trigger>Actions</Menu.Trigger>
						<Menu.Popup>
							<Menu.Item>
								<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popup>
					</Menu.Root>
					<iframe key={ iframeKey } title="Editor canvas" />
				</>
			);
		}

		const { rerender } = render( <MenuWithIframe iframeKey="first" /> );
		const firstIframe = screen.getByTitle( 'Editor canvas' );
		const firstDocument = document.implementation.createHTMLDocument();
		Object.defineProperty( firstIframe, 'contentDocument', {
			configurable: true,
			get: () => firstDocument,
		} );
		const firstAddEventListener = vi.spyOn(
			firstDocument,
			'addEventListener'
		);
		const firstRemoveEventListener = vi.spyOn(
			firstDocument,
			'removeEventListener'
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();
		await waitFor( () => {
			expect( firstAddEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				expect.any( Function ),
				true
			);
		} );

		const firstPointerDownListener = firstAddEventListener.mock.calls.find(
			( [ type, , capture ] ) =>
				type === 'pointerdown' && capture === true
		)?.[ 1 ];
		rerender( <MenuWithIframe iframeKey="second" /> );
		await waitFor( () => {
			expect( firstRemoveEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				firstPointerDownListener,
				true
			);
		} );

		act( () => {
			firstDocument.dispatchEvent(
				new MouseEvent( 'pointerdown', { bubbles: true } )
			);
		} );
		expect( screen.getByRole( 'menu' ) ).toBeVisible();

		const secondIframe = screen.getByTitle( 'Editor canvas' );
		const secondDocument = document.implementation.createHTMLDocument();
		Object.defineProperty( secondIframe, 'contentDocument', {
			configurable: true,
			get: () => secondDocument,
		} );
		act( () => secondIframe.dispatchEvent( new Event( 'load' ) ) );
		act( () => {
			secondDocument.dispatchEvent(
				new MouseEvent( 'pointerdown', { bubbles: true } )
			);
		} );

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'throws when ItemDescription is outside a menu item', () => {
		expect( () =>
			render( <Menu.ItemDescription>Description</Menu.ItemDescription> )
		).toThrow(
			'Menu.ItemDescription: Missing direct menu item parent. Render <Menu.ItemDescription> as a direct child of a menu item.'
		);
		expect( console ).toHaveErrored();
	} );

	it( 'throws when ItemDescription is nested inside a menu item', () => {
		expect( () =>
			render(
				<Menu.Root defaultOpen>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup>
						<Menu.Item>
							<Menu.ItemLabel>
								Duplicate
								<Menu.ItemDescription>
									Description
								</Menu.ItemDescription>
							</Menu.ItemLabel>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			)
		).toThrow(
			'Menu.ItemDescription: Missing direct menu item parent. Render <Menu.ItemDescription> as a direct child of a menu item.'
		);
		expect( console ).toHaveErrored();
	} );

	it( 'throws when a nested ItemDescription reuses a direct sibling ID', () => {
		function MenuWithDuplicateDescriptionId() {
			const descriptionId = useId();

			return (
				<Menu.Root defaultOpen>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup>
						<Menu.Item>
							<Menu.ItemLabel>
								Duplicate
								<Menu.ItemDescription id={ descriptionId }>
									Nested description
								</Menu.ItemDescription>
							</Menu.ItemLabel>
							<Menu.ItemDescription id={ descriptionId }>
								Direct description
							</Menu.ItemDescription>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			);
		}

		expect( () => render( <MenuWithDuplicateDescriptionId /> ) ).toThrow(
			'Menu.ItemDescription: Missing direct menu item parent. Render <Menu.ItemDescription> as a direct child of a menu item.'
		);
		expect( console ).toHaveErrored();
	} );

	it( 'requires an ItemLabel as a direct child of every item', () => {
		expect( () =>
			render(
				<Menu.Root defaultOpen>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup>
						{ /* @ts-expect-error Intentionally exercise runtime validation. */ }
						<Menu.Item>Duplicate</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			)
		).toThrow( 'Menu.ItemLabel must be the first direct child' );
		expect( console ).toHaveErrored();
	} );

	it( 'rejects an ItemLabel wrapped in a fragment', () => {
		expect( () =>
			render(
				<Menu.Root defaultOpen>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup>
						<Menu.Item>
							<>
								<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
							</>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			)
		).toThrow( 'Menu.ItemLabel must be the first direct child' );
		expect( console ).toHaveErrored();
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
								label: 'Command S',
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
		const shortcutDisplay = queryItemShortcutDisplay( item );
		const externalDescription = screen.getByText( 'Available offline.' );
		const description = screen.getByText( 'Save the current file.' );
		const shortcutDescription = screen.getByText(
			'Keyboard shortcut: Command S'
		);

		expect( item ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );
		expect( shortcut ).toHaveTextContent( '⌘S' );
		expect( shortcutDisplay ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( shortcutDisplay ).toHaveAttribute( 'dir', 'ltr' );
		expect( item ).toHaveAttribute(
			'aria-describedby',
			`${ externalDescription.id } ${ description.id } ${ shortcutDescription.id }`
		);
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
								label: 'Command M',
							} }
						>
							<Menu.ItemLabel>Move to</Menu.ItemLabel>
						</Menu.SubmenuTrigger>
						<Menu.Popup>
							<Menu.Item>
								<Menu.ItemLabel>Archive</Menu.ItemLabel>
							</Menu.Item>
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
					<Menu.Item>
						<Menu.ItemLabel>No prefix</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Item prefix="Prefix">
						<Menu.ItemLabel>With prefix</Menu.ItemLabel>
					</Menu.Item>
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

	it( 'renders numeric zero in item layout slots', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item prefix={ 0 } suffix={ 0 }>
						<Menu.ItemLabel>Zero values</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', {
			name: 'Zero values',
		} );

		expect( queryItemPrefix( item ) ).toHaveTextContent( '0' );
		expect( queryItemSuffix( item ) ).toHaveTextContent( '0' );
	} );

	it( 'hides presentational prefixes from assistive technology', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item prefix="Decorative prefix">
						<Menu.ItemLabel>Item label</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', {
			name: 'Item label',
		} );

		expect( queryItemPrefix( item ) ).toHaveAttribute(
			'aria-hidden',
			'true'
		);
	} );

	it( 'keeps shared alignment slots outside the item-local content', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.CheckboxItem
						checked
						prefix="Prefix"
						shortcut={ {
							displayShortcut: '⌘S',
							ariaKeyShortcut: 'Meta+S',
							label: 'Command S',
						} }
						suffix="Suffix"
					>
						<Menu.ItemLabel>Save</Menu.ItemLabel>
					</Menu.CheckboxItem>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitemcheckbox', {
			name: 'Save',
		} );
		const content = queryItemContent( item );
		const prefix = queryItemPrefix( item );
		const selectionIndicator = queryItemSelectionIndicator( item );

		expect( selectionIndicator ).toBeInTheDocument();
		expect( prefix ).toBeInTheDocument();
		expect( content ).toBeInTheDocument();
		expect( content ).toContainElement( queryItemLabel( item ) );
		expect( content ).toContainElement( queryItemSuffix( item ) );
		expect( content ).toContainElement( queryItemShortcut( item ) );
		expect( content ).not.toContainElement( prefix );
		expect( content ).not.toContainElement( selectionIndicator );
	} );

	it( 'supports link items that open in a new tab', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem href="https://wordpress.org" openInNewTab>
						<Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
					</Menu.LinkItem>
					<Menu.LinkItem
						href="https://developer.wordpress.org"
						openInNewTab
						rel="nofollow"
						suffix="Docs"
					>
						<Menu.ItemLabel>Developer resources</Menu.ItemLabel>
					</Menu.LinkItem>
					<Menu.LinkItem
						aria-label="WordPress project"
						href="https://make.wordpress.org"
						openInNewTab
					>
						<Menu.ItemLabel>Make WordPress</Menu.ItemLabel>
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
		const developerItem = screen.getByRole( 'menuitem', {
			name: 'Developer resources (opens in a new tab)',
		} );
		const developerItemIndicator =
			queryExternalLinkIndicator( developerItem );
		expect( developerItem ).toHaveAttribute( 'rel', 'nofollow' );
		expect( queryItemLabel( developerItem ) ).toContainElement(
			developerItemIndicator
		);
		expect( queryItemSuffix( developerItem ) ).toHaveTextContent( 'Docs' );
		expect( queryItemSuffix( developerItem ) ).not.toContainElement(
			developerItemIndicator
		);
		expect(
			screen.getByRole( 'menuitem', { name: 'WordPress project' } )
		).not.toHaveAttribute( 'aria-labelledby' );
	} );

	it( 'supports custom rendering for item labels and descriptions', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel render={ <h2 /> }>
							Duplicate
						</Menu.ItemLabel>
						<Menu.ItemDescription render={ <h3 /> }>
							Create a separate copy.
						</Menu.ItemDescription>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', {
			name: 'Duplicate',
			description: 'Create a separate copy.',
		} );

		expect( queryItemLabel( item )?.tagName ).toBe( 'H2' );
		expect( screen.getByText( 'Create a separate copy.' ).tagName ).toBe(
			'H3'
		);
	} );
} );
