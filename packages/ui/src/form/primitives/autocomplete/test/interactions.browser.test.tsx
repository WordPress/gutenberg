import { describe, expect, it, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { createPortal } from '@wordpress/element';
import * as Autocomplete from '../index';
import {
	addCanvasButton,
	addIframeButton,
} from '../../../test/fixtures/iframe';

describe( 'Autocomplete interactions', () => {
	it( 'read-only Autocomplete allows browsing without changing the input value', async () => {
		const onValueChange = vi.fn();
		await render(
			<Autocomplete.Root
				readOnly
				items={ [ 'Apple', 'Apple pie' ] }
				defaultValue="Apple"
				onValueChange={ onValueChange }
			>
				<Autocomplete.Input aria-label="Search fruit" />
				<Autocomplete.Popup>
					<Autocomplete.List>
						<Autocomplete.Item value="Apple">
							<Autocomplete.ItemLabel>
								Apple
							</Autocomplete.ItemLabel>
						</Autocomplete.Item>
						<Autocomplete.Item value="Apple pie">
							<Autocomplete.ItemLabel>
								Apple pie
							</Autocomplete.ItemLabel>
						</Autocomplete.Item>
					</Autocomplete.List>
				</Autocomplete.Popup>
			</Autocomplete.Root>
		);

		const input = page.getByRole( 'combobox', { name: 'Search fruit' } );
		await input.click();
		await userEvent.keyboard( '{ArrowDown}' );
		const suggestion = page.getByRole( 'option', { name: 'Apple pie' } );
		await expect.element( suggestion ).toBeVisible();
		await userEvent.keyboard( '{ArrowDown}' );
		await expect
			.element(
				page.getByRole( 'option', { name: 'Apple', exact: true } )
			)
			.toHaveAttribute( 'data-highlighted' );
		await userEvent.keyboard( '{ArrowDown}' );
		await expect
			.element( suggestion )
			.toHaveAttribute( 'data-highlighted' );
		await userEvent.keyboard( '{Enter}' );
		await suggestion.click();
		await input.click();
		await userEvent.keyboard( 's' );
		await expect.element( input ).toHaveValue( 'Apple' );
		expect( onValueChange ).not.toHaveBeenCalled();
		await userEvent.keyboard( '{Escape}' );
		await expect.element( input ).toHaveFocus();
		await expect
			.element( input )
			.toHaveAttribute( 'aria-expanded', 'false' );
		await userEvent.keyboard( '{ArrowDown}' );
		await expect.element( suggestion ).toBeVisible();
	} );

	it( 'closes Autocomplete and delivers the iframe click', async () => {
		const onCanvasClick = vi.fn();
		await render(
			<>
				<Autocomplete.Root items={ [ 'First' ] }>
					<Autocomplete.Input placeholder="Search" />
					<Autocomplete.Popup>
						<Autocomplete.List>
							<Autocomplete.ListBody>
								<Autocomplete.Item value="First">
									<Autocomplete.ItemLabel>
										First
									</Autocomplete.ItemLabel>
								</Autocomplete.Item>
							</Autocomplete.ListBody>
						</Autocomplete.List>
					</Autocomplete.Popup>
				</Autocomplete.Root>
				<iframe
					title="Editor canvas"
					style={ { position: 'fixed', left: 400, top: 300 } }
				/>
			</>
		);
		const canvasButton = addCanvasButton( onCanvasClick );

		await userEvent.type( screen.getByRole( 'combobox' ), 'F' );
		await expect
			.element( page.getByRole( 'option', { name: 'First' } ) )
			.toBeVisible();
		await canvasButton.click();

		await waitFor( () => {
			expect(
				screen.queryByRole( 'option', { name: 'First' } )
			).not.toBeInTheDocument();
		} );
		expect( onCanvasClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'closes a non-modal Autocomplete rendered in an iframe on nested iframe press', async () => {
		const onCanvasClick = vi.fn();
		await render(
			<iframe title="Component frame" width="800" height="600" />
		);
		const iframe =
			screen.getByTitle< HTMLIFrameElement >( 'Component frame' );
		const iframeDocument = iframe.contentDocument;
		if ( ! iframeDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}

		await render(
			createPortal(
				<>
					<Autocomplete.Root items={ [ 'First' ] } modal={ false }>
						<Autocomplete.Input aria-label="Search" />
						<Autocomplete.Popup
							portal={
								<Autocomplete.Portal
									container={ iframeDocument.body }
								/>
							}
						>
							<Autocomplete.List>
								<Autocomplete.Item value="First">
									<Autocomplete.ItemLabel>
										First
									</Autocomplete.ItemLabel>
								</Autocomplete.Item>
							</Autocomplete.List>
						</Autocomplete.Popup>
					</Autocomplete.Root>
					<iframe
						title="Nested canvas"
						style={ { position: 'fixed', left: 400, top: 300 } }
					/>
				</>,
				iframeDocument.body
			)
		);
		const nestedIframe = within(
			iframeDocument.body
		).getByTitle< HTMLIFrameElement >( 'Nested canvas' );
		const nestedDocument = nestedIframe.contentDocument;
		if ( ! nestedDocument ) {
			throw new Error( 'Expected a nested same-origin iframe document.' );
		}
		const button = nestedDocument.createElement( 'button' );
		button.textContent = 'Edit block';
		button.addEventListener( 'click', onCanvasClick );
		nestedDocument.body.appendChild( button );

		const frame = page.frameLocator( page.getByTitle( 'Component frame' ) );
		const option = frame.getByRole( 'option', { name: 'First' } );
		await frame.getByRole( 'combobox', { name: 'Search' } ).fill( 'F' );
		await expect.element( option ).toBeVisible();
		await page
			.frameLocator( frame.getByTitle( 'Nested canvas' ) )
			.getByRole( 'button', { name: 'Edit block' } )
			.click();

		await expect.element( option ).not.toBeInTheDocument();
		expect( onCanvasClick ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [ { sibling: false }, { sibling: true } ] )(
		'closes a non-modal Autocomplete portaled to another document and delivers the iframe click (sibling: $sibling)',
		async ( { sibling } ) => {
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
						<Autocomplete.Root
							items={ [ 'First' ] }
							modal={ false }
							onOpenChange={ onOpenChange }
						>
							<Autocomplete.Input aria-label="Search" />
							<Autocomplete.Popup
								portal={
									<Autocomplete.Portal
										container={ popupDocument.body }
									/>
								}
							>
								<Autocomplete.List>
									<Autocomplete.Item value="First">
										<Autocomplete.ItemLabel>
											First
										</Autocomplete.ItemLabel>
									</Autocomplete.Item>
									<iframe
										title="Popup frame"
										width="150"
										height="50"
									/>
								</Autocomplete.List>
							</Autocomplete.Popup>
						</Autocomplete.Root>
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
			await componentFrame
				.getByRole( 'combobox', { name: 'Search' } )
				.fill( 'F' );
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

			await page
				.frameLocator( componentFrame.getByTitle( 'Editor canvas' ) )
				.getByRole( 'button', { name: 'Edit block' } )
				.click();

			await expect.element( option ).not.toBeInTheDocument();
			expect( onCanvasClick ).toHaveBeenCalledTimes( 1 );
			expect( onOpenChange ).toHaveBeenLastCalledWith(
				false,
				expect.objectContaining( { reason: 'outside-press' } )
			);
		}
	);
} );
