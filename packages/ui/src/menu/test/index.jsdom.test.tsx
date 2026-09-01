import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFocusReturn } from '@wordpress/compose';
import {
	createRef,
	useCallback,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import type { ReactNode } from 'react';
import * as Menu from '../index';
import { useEnableWpCompatOverlaySlot } from '../../utils/use-enable-wp-compat-overlay-slot';

jest.mock( '@wordpress/i18n', () => ( {
	...jest.requireActual( '@wordpress/i18n' ),
	isRTL: jest.fn( () => false ),
} ) );

const mockedIsRTL = isRTL as jest.MockedFunction< typeof isRTL >;

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
	it( 'opens from the trigger and exposes menu semantics', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Separator />
					<Menu.LinkItem href="https://wordpress.org">
						<Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
					</Menu.LinkItem>
					<Menu.Item>
						<Menu.ItemLabel>Delete</Menu.ItemLabel>
					</Menu.Item>
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

	it( 'preserves the public imperative actions ref', async () => {
		const user = userEvent.setup();
		const actionsRef = createRef< {
			close: () => void;
			unmount: () => void;
		} >();

		render(
			<Menu.Root actionsRef={ actionsRef }>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();

		act( () => actionsRef.current?.close() );

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'closes when Escape is pressed', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
					</Menu.Item>
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

	it( 'closes a non-modal menu without consuming an iframe pointer interaction', async () => {
		const user = userEvent.setup();
		const onCanvasClick = jest.fn();

		function ControlledMenuWithIframes() {
			const [ open, setOpen ] = useState( false );

			return (
				<>
					<Menu.Root
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
					<iframe title="Secondary canvas" />
					<iframe title="Editor canvas" />
				</>
			);
		}

		render( <ControlledMenuWithIframes /> );

		const iframe = screen.getByTitle( 'Editor canvas' );
		const iframeDocument = document.implementation.createHTMLDocument();
		Object.defineProperty( iframe, 'contentDocument', {
			configurable: true,
			get: () => iframeDocument,
		} );
		const canvasTarget = iframeDocument.createElement( 'button' );
		canvasTarget.addEventListener( 'click', onCanvasClick );
		iframeDocument.body.appendChild( canvasTarget );

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();

		act( () => {
			canvasTarget.dispatchEvent(
				new MouseEvent( 'pointerdown', { bubbles: true } )
			);
			canvasTarget.click();
		} );

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
		expect( onCanvasClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'closes a non-modal menu on a nested same-origin iframe pointer interaction', async () => {
		const user = userEvent.setup();

		render(
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

		const editorIframe =
			screen.getByTitle< HTMLIFrameElement >( 'Editor canvas' );
		const editorDocument = editorIframe.contentDocument;

		if ( ! editorDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();

		const nestedIframe = editorDocument.createElement( 'iframe' );
		editorDocument.body.appendChild( nestedIframe );
		const nestedDocument = nestedIframe.contentDocument;

		if ( ! nestedDocument ) {
			throw new Error( 'Expected a nested same-origin iframe document.' );
		}

		const nestedAddEventListener = jest.spyOn(
			nestedDocument,
			'addEventListener'
		);
		await waitFor( () => {
			expect( nestedAddEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				expect.any( Function ),
				true
			);
		} );

		act( () => {
			nestedDocument.dispatchEvent(
				new MouseEvent( 'pointerdown', { bubbles: true } )
			);
		} );

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'does not close for pointer interactions inside a menu portaled to an iframe', async () => {
		const user = userEvent.setup();
		const iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );
		const iframeDocument = iframe.contentDocument;

		if ( ! iframeDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}
		const addEventListener = jest.spyOn(
			iframeDocument,
			'addEventListener'
		);

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
		const firstAddEventListener = jest.spyOn(
			firstDocument,
			'addEventListener'
		);
		const firstRemoveEventListener = jest.spyOn(
			firstDocument,
			'removeEventListener'
		);
		const reloadedAddEventListener = jest.spyOn(
			reloadedDocument,
			'addEventListener'
		);
		const reloadedRemoveEventListener = jest.spyOn(
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

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();
		unmount();
		expect( reloadedRemoveEventListener ).toHaveBeenCalledTimes( 2 );
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
		const firstRemoveEventListener = jest.spyOn(
			firstDocument,
			'removeEventListener'
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'menu' ) ).toBeVisible();

		rerender( <MenuWithIframe iframeKey="second" /> );
		await waitFor( () => {
			expect( firstRemoveEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				expect.any( Function ),
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

	it.each( [
		{ location: 'root menu', nested: false, checkbox: false },
		{ location: 'submenu', nested: true, checkbox: false },
		{
			location: 'closing checkbox item',
			nested: false,
			checkbox: true,
		},
	] )(
		'restores focus to the trigger after an overlay opened from the $location closes',
		async ( { nested, checkbox } ) => {
			const user = userEvent.setup();

			function FocusReturningOverlay( {
				onClose,
			}: {
				onClose: () => void;
			} ) {
				const focusReturnRef = useFocusReturn();
				const ref = useCallback(
					( node: HTMLDivElement | null ) => {
						focusReturnRef( node );
						node?.focus();
					},
					[ focusReturnRef ]
				);

				return (
					<div ref={ ref } role="dialog" tabIndex={ -1 }>
						<button onClick={ onClose }>Close overlay</button>
					</div>
				);
			}

			function MenuWithOverlay() {
				const [ isOverlayOpen, setIsOverlayOpen ] = useState( false );
				const overlayItem = checkbox ? (
					<Menu.CheckboxItem
						closeOnClick
						onCheckedChange={ () => setIsOverlayOpen( true ) }
					>
						<Menu.ItemLabel>Open overlay</Menu.ItemLabel>
					</Menu.CheckboxItem>
				) : (
					<Menu.Item onClick={ () => setIsOverlayOpen( true ) }>
						<Menu.ItemLabel>Open overlay</Menu.ItemLabel>
					</Menu.Item>
				);

				return (
					<>
						<Menu.Root>
							<Menu.Trigger>Actions</Menu.Trigger>
							<Menu.Popup>
								{ nested ? (
									<Menu.SubmenuRoot>
										<Menu.SubmenuTrigger
											openOnHover={ false }
										>
											<Menu.ItemLabel>
												More actions
											</Menu.ItemLabel>
										</Menu.SubmenuTrigger>
										<Menu.Popup>{ overlayItem }</Menu.Popup>
									</Menu.SubmenuRoot>
								) : (
									overlayItem
								) }
							</Menu.Popup>
						</Menu.Root>
						{ isOverlayOpen && (
							<FocusReturningOverlay
								onClose={ () => setIsOverlayOpen( false ) }
							/>
						) }
					</>
				);
			}

			render( <MenuWithOverlay /> );

			const trigger = screen.getByRole( 'button', { name: 'Actions' } );
			await user.click( trigger );
			if ( nested ) {
				await user.click(
					await screen.findByRole( 'menuitem', {
						name: 'More actions',
					} )
				);
			}
			await user.click(
				await screen.findByRole(
					checkbox ? 'menuitemcheckbox' : 'menuitem',
					{ name: 'Open overlay' }
				)
			);

			await waitFor( () => {
				expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
			} );
			expect( screen.getByRole( 'dialog' ) ).toHaveFocus();

			await user.click(
				screen.getByRole( 'button', { name: 'Close overlay' } )
			);

			await waitFor( () => expect( trigger ).toHaveFocus() );
		}
	);

	it( 'does not override focus moved by onOpenChange when an item closes', async () => {
		const user = userEvent.setup();

		function MenuWithExternalFocusDestination() {
			const destinationRef = useRef< HTMLButtonElement >( null );

			return (
				<>
					<Menu.Root
						onOpenChange={ ( open, eventDetails ) => {
							if (
								! open &&
								eventDetails.reason === 'item-press'
							) {
								destinationRef.current?.focus();
							}
						} }
					>
						<Menu.Trigger>Actions</Menu.Trigger>
						<Menu.Popup>
							<Menu.Item>
								<Menu.ItemLabel>Move focus</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popup>
					</Menu.Root>
					<button ref={ destinationRef }>Focus destination</button>
				</>
			);
		}

		render( <MenuWithExternalFocusDestination /> );

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Move focus' } )
		);

		expect(
			screen.getByRole( 'button', { name: 'Focus destination' } )
		).toHaveFocus();
	} );

	it( 'uses the WordPress text direction for submenu navigation', async () => {
		const user = userEvent.setup();
		mockedIsRTL.mockReturnValue( true );

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger openOnHover={ false }>
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

		const submenuTrigger = await screen.findByRole( 'menuitem', {
			name: 'Move to',
		} );
		act( () => submenuTrigger.focus() );
		expect( submenuTrigger ).toHaveFocus();

		await user.keyboard( '{ArrowLeft}' );

		expect(
			await screen.findByRole( 'menuitem', { name: 'Archive' } )
		).toBeVisible();
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
						<Menu.ItemLabel>Show sidebar</Menu.ItemLabel>
					</Menu.CheckboxItem>
					<Menu.RadioGroup
						value="comfortable"
						onValueChange={ onValueChange }
					>
						<Menu.RadioItem value="compact">
							<Menu.ItemLabel>Compact</Menu.ItemLabel>
						</Menu.RadioItem>
						<Menu.RadioItem
							value="comfortable"
							prefix="Radio prefix"
						>
							<Menu.ItemLabel>Comfortable</Menu.ItemLabel>
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
							Create a <strong>separate</strong> copy.
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
		expect( screen.getByText( 'separate' ).tagName ).toBe( 'STRONG' );
	} );

	it( 'combines multiple item descriptions in DOM order', async () => {
		const user = userEvent.setup();

		function MenuWithMultipleDescriptions() {
			const externalDescriptionId = useId();
			const firstDescriptionId = useId();

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
							<Menu.ItemDescription id={ firstDescriptionId }>
								Save to this device.
							</Menu.ItemDescription>
							<Menu.ItemDescription>
								Keeps the current version.
							</Menu.ItemDescription>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			);
		}

		render( <MenuWithMultipleDescriptions /> );

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', { name: 'Save' } );
		const externalDescription = screen.getByText( 'Available offline.' );
		const firstDescription = screen.getByText( 'Save to this device.' );
		const secondDescription = screen.getByText(
			'Keeps the current version.'
		);
		const shortcutDescription = screen.getByText(
			'Keyboard shortcut: Command S'
		);

		expect( item ).toHaveAccessibleDescription(
			'Available offline. Save to this device. Keeps the current version. Keyboard shortcut: Command S'
		);
		expect( firstDescription.id ).not.toBe( '' );
		expect( secondDescription.id ).not.toBe( '' );
		expect( secondDescription.id ).not.toBe( firstDescription.id );
		expect( item ).toHaveAttribute(
			'aria-describedby',
			`${ externalDescription.id } ${ firstDescription.id } ${ secondDescription.id } ${ shortcutDescription.id }`
		);
	} );

	it( 'deduplicates explicit and item description IDs', async () => {
		const user = userEvent.setup();
		const descriptionId = 'save-description';

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item aria-describedby={ descriptionId }>
						<Menu.ItemLabel>Save</Menu.ItemLabel>
						<Menu.ItemDescription id={ descriptionId }>
							Save the current file.
						</Menu.ItemDescription>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', { name: 'Save' } );

		expect( item ).toHaveAccessibleDescription( 'Save the current file.' );
		expect( item ).toHaveAttribute( 'aria-describedby', descriptionId );
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
							label: 'Command L',
						} }
					>
						<Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
					</Menu.LinkItem>
					<Menu.CheckboxItem
						checked
						shortcut={ {
							displayShortcut: '⌘B',
							ariaKeyShortcut: 'Meta+B',
							label: 'Command B',
						} }
					>
						<Menu.ItemLabel>Bookmarks</Menu.ItemLabel>
					</Menu.CheckboxItem>
					<Menu.RadioGroup value="list">
						<Menu.RadioItem
							value="list"
							shortcut={ {
								displayShortcut: '⌘1',
								ariaKeyShortcut: 'Meta+1',
								label: 'Command 1',
							} }
						>
							<Menu.ItemLabel>List</Menu.ItemLabel>
						</Menu.RadioItem>
					</Menu.RadioGroup>
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger
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

	it( 'ignores presentational prefixes during keyboard typeahead', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Item prefix="Decorative prefix">
						<Menu.ItemLabel>Archive</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await user.keyboard( '{ArrowDown}a' );

		expect(
			await screen.findByRole( 'menuitem', { name: 'Archive' } )
		).toHaveFocus();
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

	// Slot is identified by a data attribute, not a user-facing role/text.
	/* eslint-disable testing-library/no-node-access */
	describe( 'wp compat overlay slot', () => {
		const SLOT_SELECTOR = '[data-wp-compat-overlay-slot]';

		// Exercises the public opt-in path rather than poking the flag.
		function WithSlotEnabled( { children }: { children: ReactNode } ) {
			useEnableWpCompatOverlaySlot();
			return <>{ children }</>;
		}

		afterEach( () => {
			// The hook is one-way at runtime; reset explicitly between tests.
			delete ( window as { __wpUiCompatOverlaySlotEnabled?: boolean } )
				.__wpUiCompatOverlaySlotEnabled;
			document
				.querySelectorAll( SLOT_SELECTOR )
				.forEach( ( element ) => element.remove() );
		} );

		it( 'portals the popup into the slot when the consumer opts in', async () => {
			const user = userEvent.setup();

			render(
				<WithSlotEnabled>
					<Menu.Root>
						<Menu.Trigger>Actions</Menu.Trigger>
						<Menu.Popup>
							<Menu.Item>
								<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popup>
					</Menu.Root>
				</WithSlotEnabled>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Actions' } )
			);

			const item = await screen.findByRole( 'menuitem', {
				name: 'Duplicate',
			} );
			expect( item ).toBeVisible();

			const slot = document.querySelector( SLOT_SELECTOR );
			expect( slot ).not.toBeNull();
			expect( slot ).toContainElement( item );
		} );

		it( 'does not create a slot when the consumer has not opted in (dormant default)', async () => {
			const user = userEvent.setup();

			render(
				<Menu.Root>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup>
						<Menu.Item>
							<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Actions' } )
			);

			const item = await screen.findByRole( 'menuitem', {
				name: 'Duplicate',
			} );
			expect( item ).toBeVisible();
			expect( document.querySelector( SLOT_SELECTOR ) ).toBeNull();
		} );
	} );
	/* eslint-enable testing-library/no-node-access */

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
						<Menu.Item>
							<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
						</Menu.Item>
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
					<Menu.Item>
						<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
					</Menu.Item>
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger openOnHover={ false }>
							<Menu.ItemLabel>Move to</Menu.ItemLabel>
						</Menu.SubmenuTrigger>
						<Menu.Popup
							positioner={
								<Menu.Positioner data-testid="submenu-positioner" />
							}
						>
							<Menu.Item>
								<Menu.ItemLabel>Archive</Menu.ItemLabel>
							</Menu.Item>
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
