import { describe, expect, it, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { createPortal } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import { ThemeProvider } from '../../../../utils/theme-provider';
import * as Select from '../index';
import {
	addCanvasButton,
	addIframeButton,
	tapCanvasButton,
} from '../../../test/fixtures/iframe';

describe( 'Select interactions', () => {
	it( 'read-only Select allows browsing without changing the value', async () => {
		const onValueChange = vi.fn();
		await render(
			<Select.Root
				readOnly
				defaultValue="Apple"
				onValueChange={ onValueChange }
			>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value="Apple">
						<Select.ItemLabel>Apple</Select.ItemLabel>
					</Select.Item>
					<Select.Item value="Banana">
						<Select.ItemLabel>Banana</Select.ItemLabel>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		);

		const trigger = page.getByRole( 'combobox' );
		await trigger.click();
		const banana = page.getByRole( 'option', { name: 'Banana' } );
		await expect.element( banana ).toBeVisible();
		await userEvent.keyboard( '{End}' );
		await expect.element( banana ).toHaveAttribute( 'data-highlighted' );
		await userEvent.keyboard( '{Enter}' );
		await banana.click();
		await expect.element( trigger ).toHaveTextContent( 'Apple' );
		expect( onValueChange ).not.toHaveBeenCalled();
		await userEvent.keyboard( '{Escape}' );
		await expect.element( trigger ).toHaveFocus();
		await expect
			.element( trigger )
			.toHaveAttribute( 'aria-expanded', 'false' );
		await userEvent.keyboard( '{ArrowDown}' );
		await expect.element( banana ).toBeVisible();
	} );

	it.each( [
		{ interaction: 'click', touch: false },
		{ interaction: 'touch tap', touch: true },
	] )(
		'closes a non-modal Select and delivers the iframe $interaction',
		async ( { touch } ) => {
			const onCanvasClick = vi.fn();
			const onOpenChange = vi.fn();
			await render(
				<>
					<Select.Root modal={ false } onOpenChange={ onOpenChange }>
						<Select.Trigger>Select</Select.Trigger>
						<Select.Popup>
							<Select.Item value="first">
								<Select.ItemLabel>First</Select.ItemLabel>
							</Select.Item>
						</Select.Popup>
					</Select.Root>
					<iframe
						title="Editor canvas"
						style={ { position: 'fixed', left: 100, top: 300 } }
					/>
				</>
			);
			const canvasButton = addCanvasButton( onCanvasClick );

			await userEvent.click( screen.getByRole( 'combobox' ) );
			await expect
				.element( page.getByRole( 'option', { name: 'First' } ) )
				.toBeVisible();
			const option = screen.getByRole( 'option', { name: 'First' } );
			if ( touch ) {
				await tapCanvasButton();
			} else {
				await canvasButton.click();
			}

			await waitFor( () => {
				expect( option ).not.toBeVisible();
			} );
			expect( onCanvasClick ).toHaveBeenCalledTimes( 1 );
			expect( onOpenChange ).toHaveBeenLastCalledWith(
				false,
				expect.objectContaining( {
					reason: 'outside-press',
					event: expect.objectContaining( {
						type: touch ? 'mousedown' : 'pointerdown',
					} ),
				} )
			);
		}
	);

	it( 'keeps the default modal Select interaction on the backdrop', async () => {
		const onCanvasClick = vi.fn();
		await render(
			<>
				<Select.Root>
					<Select.Trigger>Select</Select.Trigger>
					<Select.Popup>
						<Select.Item value="first">
							<Select.ItemLabel>First</Select.ItemLabel>
						</Select.Item>
					</Select.Popup>
				</Select.Root>
				<iframe
					title="Editor canvas"
					style={ { position: 'fixed', left: 400, top: 300 } }
				/>
			</>
		);
		const canvasButton = addCanvasButton( onCanvasClick );

		await userEvent.click( screen.getByRole( 'combobox' ) );
		await expect
			.element( page.getByRole( 'option', { name: 'First' } ) )
			.toBeVisible();
		await canvasButton.click( { force: true } );

		expect( onCanvasClick ).toHaveBeenCalledTimes( 0 );
		await waitFor( () => {
			expect(
				screen.queryByRole( 'option', { name: 'First' } )
			).not.toBeInTheDocument();
		} );
	} );

	it.each( [
		{ sibling: false, touch: false },
		{ sibling: true, touch: false },
		{ sibling: false, touch: true },
		{ sibling: true, touch: true },
	] )(
		'closes a non-modal Select portaled to another document and delivers the iframe press (sibling: $sibling, touch: $touch)',
		async ( { sibling, touch } ) => {
			const onCanvasClick = vi.fn();
			const onPopupClick = vi.fn();
			const onOpenChange = vi.fn();
			await render(
				<>
					<iframe title="Component frame" width="400" height="250" />
					{ sibling && (
						<iframe
							title="Popup document"
							width="400"
							height="250"
						/>
					) }
				</>
			);
			const componentDocument =
				screen.getByTitle< HTMLIFrameElement >(
					'Component frame'
				).contentDocument;
			const popupDocument = sibling
				? screen.getByTitle< HTMLIFrameElement >( 'Popup document' )
						.contentDocument
				: document;
			if ( ! componentDocument || ! popupDocument ) {
				throw new Error( 'Expected same-origin iframe documents.' );
			}
			await render(
				createPortal(
					<>
						<Select.Root
							modal={ false }
							onOpenChange={ onOpenChange }
						>
							<Select.Trigger>Select</Select.Trigger>
							<Select.Popup
								portal={
									<Select.Portal
										container={ popupDocument.body }
									/>
								}
							>
								<Select.Item value="First">
									<Select.ItemLabel>First</Select.ItemLabel>
								</Select.Item>
								<iframe
									title="Popup frame"
									width="150"
									height="50"
								/>
							</Select.Popup>
						</Select.Root>
						<iframe
							title="Editor canvas"
							style={ { position: 'fixed', left: 200, top: 100 } }
						/>
					</>,
					componentDocument.body
				)
			);
			addIframeButton(
				within(
					componentDocument.body
				).getByTitle< HTMLIFrameElement >( 'Editor canvas' ),
				onCanvasClick
			);
			const componentFrame = page.frameLocator(
				page.getByTitle( 'Component frame' )
			);
			await componentFrame.getByRole( 'combobox' ).click();
			const popupFrame = sibling
				? page.frameLocator( page.getByTitle( 'Popup document' ) )
				: page;
			const option = popupFrame.getByRole( 'option', { name: 'First' } );
			await expect.element( option ).toBeVisible();
			const popupIframe = within(
				popupDocument.body
			).getByTitle< HTMLIFrameElement >( 'Popup frame' );
			addIframeButton( popupIframe, onPopupClick );
			await page
				.frameLocator( popupFrame.getByTitle( 'Popup frame' ) )
				.getByRole( 'button', { name: 'Edit block' } )
				.click();
			expect( onPopupClick ).toHaveBeenCalledTimes( 1 );
			await expect.element( option ).toBeVisible();

			if ( touch ) {
				await tapCanvasButton( componentDocument );
			} else {
				await page
					.frameLocator(
						componentFrame.getByTitle( 'Editor canvas' )
					)
					.getByRole( 'button', { name: 'Edit block' } )
					.click();
			}

			await expect.element( option ).not.toBeInTheDocument();
			expect( onCanvasClick ).toHaveBeenCalledTimes( 1 );
			expect( onOpenChange ).toHaveBeenLastCalledWith(
				false,
				expect.objectContaining( { reason: 'outside-press' } )
			);
		}
	);

	it( 'keeps long lists scrollable when item alignment falls back near a viewport edge', async () => {
		const items = Array.from( { length: 40 }, ( _, index ) => ( {
			value: String( index + 1 ),
			label: String( index + 1 ),
		} ) );
		await render(
			<ThemeProvider isRoot>
				<div style={ { position: 'fixed', left: 32, bottom: 32 } }>
					<Select.Root defaultValue="1" items={ items }>
						<Select.Trigger
							size="small"
							variant="minimal"
							aria-label="Page"
						/>
						<Select.Popup width="content">
							{ items.map( ( item ) => (
								<Select.Item
									key={ item.value }
									value={ item.value }
									size="small"
								>
									<Select.ItemLabel>
										{ item.label }
									</Select.ItemLabel>
								</Select.Item>
							) ) }
						</Select.Popup>
					</Select.Root>
				</div>
			</ThemeProvider>
		);

		const trigger = page.getByRole( 'combobox', { name: 'Page' } );
		await trigger.click();
		const list = screen.getByRole( 'listbox' );
		await expect.element( list ).toBeVisible();
		await expect
			.poll( () => list.clientHeight )
			.toBeLessThan( list.scrollHeight );
		await expect
			.poll( () => list.getBoundingClientRect().top )
			.toBeGreaterThanOrEqual( 0 );
		await expect
			.poll( () => list.getBoundingClientRect().bottom )
			.toBeLessThanOrEqual( window.innerHeight );

		list.scrollTop = list.scrollHeight;
		await expect.poll( () => list.scrollTop ).toBeGreaterThan( 0 );
		await page.getByRole( 'option', { name: '40', exact: true } ).click();
		await expect.element( trigger ).toHaveTextContent( '40' );
	} );
} );
