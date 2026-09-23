import type { ReactNode } from 'react';
import {
	afterEach,
	describe,
	expect,
	it,
	vi,
	type MockedFunction,
} from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { useFocusReturn } from '@wordpress/compose';
import {
	createRef,
	useCallback,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import * as Menu from '../index';
import { useEnableWpCompatOverlaySlot } from '../../utils/use-enable-wp-compat-overlay-slot';

vi.mock( import( '@wordpress/i18n' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	isRTL: vi.fn( () => false ),
} ) );

const mockedIsRTL = isRTL as MockedFunction< typeof isRTL >;

afterEach( () => {
	mockedIsRTL.mockClear();
	mockedIsRTL.mockReturnValue( false );
} );

describe( 'Menu', () => {
	it( 'closes a non-modal menu without consuming an iframe pointer interaction', async () => {
		const user = userEvent;
		const onCanvasClick = vi.fn();

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
					<iframe
						title="Editor canvas"
						style={ { display: 'block', marginTop: 200 } }
					/>
				</>
			);
		}

		await render( <ControlledMenuWithIframes /> );

		const iframe =
			screen.getByTitle< HTMLIFrameElement >( 'Editor canvas' );
		const iframeDocument = iframe.contentDocument;
		if ( ! iframeDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}
		const canvasTarget = iframeDocument.createElement( 'button' );
		canvasTarget.textContent = 'Edit block';
		canvasTarget.addEventListener( 'click', onCanvasClick );
		iframeDocument.body.appendChild( canvasTarget );

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await expect.element( page.getByRole( 'menu' ) ).toBeVisible();

		const frame = page.frameLocator( page.getByTitle( 'Editor canvas' ) );
		await frame.getByRole( 'button', { name: 'Edit block' } ).click();

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
		expect( onCanvasClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'closes a non-modal menu on a nested same-origin iframe pointer interaction', async () => {
		const user = userEvent;

		await render(
			<>
				<Menu.Root modal={ false }>
					<Menu.Trigger>Actions</Menu.Trigger>
					<Menu.Popup>
						<Menu.Item>
							<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
				<iframe
					title="Editor canvas"
					style={ { display: 'block', marginTop: 200 } }
				/>
			</>
		);

		const editorIframe =
			screen.getByTitle< HTMLIFrameElement >( 'Editor canvas' );
		const editorDocument = editorIframe.contentDocument;

		if ( ! editorDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await expect.element( page.getByRole( 'menu' ) ).toBeVisible();

		const nestedIframe = editorDocument.createElement( 'iframe' );
		nestedIframe.title = 'Nested canvas';
		editorDocument.body.appendChild( nestedIframe );
		const nestedDocument = nestedIframe.contentDocument;

		if ( ! nestedDocument ) {
			throw new Error( 'Expected a nested same-origin iframe document.' );
		}

		const canvasTarget = nestedDocument.createElement( 'button' );
		canvasTarget.textContent = 'Edit nested block';
		nestedDocument.body.appendChild( canvasTarget );

		const nestedAddEventListener = vi.spyOn(
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

		const editorFrame = page.frameLocator(
			page.getByTitle( 'Editor canvas' )
		);
		const nestedFrame = page.frameLocator(
			editorFrame.getByTitle( 'Nested canvas' )
		);
		await nestedFrame
			.getByRole( 'button', { name: 'Edit nested block' } )
			.click();

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'keeps prefix icons hidden from assistive technology', async () => {
		const user = userEvent;
		await render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item
						prefix={
							<Menu.PrefixIcon
								icon={ <svg /> }
								role="img"
								aria-label="Decorative icon"
							/>
						}
					>
						<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		const item = await screen.findByRole( 'menuitem', {
			name: 'Duplicate',
		} );
		await expect
			.element( within( item ).getByRole( 'img', { hidden: true } ) )
			.toBeVisible();
		expect( within( item ).queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );

	it( 'opens from the trigger and exposes menu semantics', async () => {
		const user = userEvent;

		await render(
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

		await expect.element( await screen.findByRole( 'menu' ) ).toBeVisible();
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect
			.element( screen.getByRole( 'menuitem', { name: 'Duplicate' } ) )
			.toBeVisible();
		expect(
			screen.getByRole( 'menuitem', { name: 'WordPress.org' } )
		).toHaveAttribute( 'href', 'https://wordpress.org' );
		await expect.element( screen.getByRole( 'separator' ) ).toBeVisible();
	} );

	it( 'preserves the public imperative actions ref', async () => {
		const user = userEvent;
		const actionsRef = createRef< {
			close: () => void;
			unmount: () => void;
		} >();

		await render(
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
		await expect.element( await screen.findByRole( 'menu' ) ).toBeVisible();

		act( () => actionsRef.current?.close() );

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'closes when Escape is pressed', async () => {
		const user = userEvent;

		await render(
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
		await expect.element( await screen.findByRole( 'menu' ) ).toBeVisible();

		await user.keyboard( '{Escape}' );

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
		expect(
			screen.getByRole( 'button', { name: 'Actions' } )
		).toHaveFocus();
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
			const user = userEvent;

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

			await render( <MenuWithOverlay /> );

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
		const user = userEvent;

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

		await render( <MenuWithExternalFocusDestination /> );

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Move focus' } )
		);

		expect(
			screen.getByRole( 'button', { name: 'Focus destination' } )
		).toHaveFocus();
	} );

	it( 'uses the WordPress text direction for submenu navigation', async () => {
		const user = userEvent;
		mockedIsRTL.mockReturnValue( true );

		await render(
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

		await expect
			.element(
				await screen.findByRole( 'menuitem', { name: 'Archive' } )
			)
			.toBeVisible();
	} );

	it( 'renders checkbox and radio item roles', async () => {
		const user = userEvent;
		const onCheckedChange = vi.fn();
		const onValueChange = vi.fn();

		await render(
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
		await expect
			.element( screen.getByText( 'Checkbox prefix' ) )
			.toBeVisible();
		await expect
			.element( screen.getByText( 'Radio prefix' ) )
			.toBeVisible();

		await user.click( checkbox );
		expect( onCheckedChange ).toHaveBeenCalledWith(
			false,
			expect.objectContaining( { reason: expect.any( String ) } )
		);
	} );

	it( 'uses item descriptions as accessible descriptions', async () => {
		const user = userEvent;

		await render(
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
		const user = userEvent;

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

		await render( <MenuWithMultipleDescriptions /> );

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
		const user = userEvent;
		const descriptionId = 'save-description';

		await render(
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

	it( 'supports shortcut metadata across menu item variants', async () => {
		const user = userEvent;

		await render(
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

	it( 'ignores presentational prefixes during keyboard typeahead', async () => {
		const user = userEvent;

		await render(
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

	it( 'closes after activating a link item when closeOnClick is true', async () => {
		const user = userEvent;

		await render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem href="#destination" closeOnClick>
						<Menu.ItemLabel>Destination</Menu.ItemLabel>
					</Menu.LinkItem>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Destination' } )
		);

		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'stays open after activating a link item by default', async () => {
		const user = userEvent;

		await render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem href="#destination">
						<Menu.ItemLabel>Destination</Menu.ItemLabel>
					</Menu.LinkItem>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Destination' } )
		);

		await expect.element( screen.getByRole( 'menu' ) ).toBeVisible();
	} );

	it( 'treats target="_blank" on link items as opening in a new tab', async () => {
		const user = userEvent;

		await render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem href="https://wordpress.org" target="_blank">
						<Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
					</Menu.LinkItem>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		expect(
			await screen.findByRole( 'menuitem', {
				name: 'WordPress.org (opens in a new tab)',
			} )
		).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'treats target="_BLANK" on link items as opening in a new tab', async () => {
		const user = userEvent;

		await render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem href="https://wordpress.org" target="_BLANK">
						<Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
					</Menu.LinkItem>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		expect(
			await screen.findByRole( 'menuitem', {
				name: 'WordPress.org (opens in a new tab)',
			} )
		).toHaveAttribute( 'target', '_BLANK' );
	} );

	it( 'forwards a named target on link items without adding a new tab notice', async () => {
		const user = userEvent;

		await render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem
						href="https://wordpress.org"
						target="wp-preview-123"
					>
						<Menu.ItemLabel>Preview</Menu.ItemLabel>
					</Menu.LinkItem>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		const item = await screen.findByRole( 'menuitem', { name: 'Preview' } );
		expect( item ).toHaveAttribute( 'target', 'wp-preview-123' );
		expect(
			screen.queryByLabelText( '(opens in a new tab)' )
		).not.toBeInTheDocument();
	} );

	it( 'preserves an explicit link item target when openInNewTab is true', async () => {
		const user = userEvent;

		await render(
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem
						href="https://wordpress.org"
						target="wp-preview-123"
						openInNewTab
					>
						<Menu.ItemLabel>Preview</Menu.ItemLabel>
					</Menu.LinkItem>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );

		expect(
			await screen.findByRole( 'menuitem', {
				name: 'Preview (opens in a new tab)',
			} )
		).toHaveAttribute( 'target', 'wp-preview-123' );
	} );

	it( 'uses custom item label and description ids for generated aria relationships', async () => {
		const user = userEvent;

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

		await render( <MenuWithCustomTextIds /> );

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
		const user = userEvent;

		await render(
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
			const user = userEvent;

			await render(
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
			await expect.element( item ).toBeVisible();

			const slot = document.querySelector( SLOT_SELECTOR );
			expect( slot ).not.toBeNull();
			expect( slot ).toContainElement( item );
		} );

		it( 'does not create a slot when the consumer has not opted in (dormant default)', async () => {
			const user = userEvent;

			await render(
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
			await expect.element( item ).toBeVisible();
			expect( document.querySelector( SLOT_SELECTOR ) ).toBeNull();
		} );
	} );
	/* eslint-enable testing-library/no-node-access */

	it( 'supports custom portal and positioner elements', async () => {
		const user = userEvent;
		const containerRef = createRef< HTMLDivElement >();

		await render(
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
		const user = userEvent;

		await render(
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

		await expect
			.element(
				await screen.findByRole( 'menuitem', { name: 'Archive' } )
			)
			.toBeVisible();
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
		const user = userEvent;
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();
		const itemLabelRef = createRef< HTMLSpanElement >();
		const itemDescriptionRef = createRef< HTMLSpanElement >();

		await render(
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
