import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import * as Select from '../primitives/select';
import * as Combobox from '../primitives/combobox';
import * as Autocomplete from '../primitives/autocomplete';

function addCanvasButton( onClick: () => void ) {
	const iframe = screen.getByTitle< HTMLIFrameElement >( 'Editor canvas' );
	const iframeDocument = iframe.contentDocument;
	if ( ! iframeDocument ) {
		throw new Error( 'Expected a same-origin iframe document.' );
	}

	const button = iframeDocument.createElement( 'button' );
	button.textContent = 'Edit block';
	button.addEventListener( 'click', onClick );
	iframeDocument.body.appendChild( button );
	return page
		.frameLocator( page.getByTitle( 'Editor canvas' ) )
		.getByRole( 'button', { name: 'Edit block' } );
}

describe( 'form popup iframe dismissal', () => {
	it( 'closes a non-modal Select and delivers the iframe click', async () => {
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
					style={ { position: 'fixed', left: 400, top: 300 } }
				/>
			</>
		);
		const canvasButton = addCanvasButton( onCanvasClick );

		await userEvent.click( screen.getByRole( 'combobox' ) );
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
		expect( onOpenChange ).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining( { reason: 'outside-press' } )
		);
	} );

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

	it( 'keeps a non-modal Select open for a click in its own iframe', async () => {
		const onPopupClick = vi.fn();
		await render(
			<Select.Root modal={ false }>
				<Select.Trigger>Select</Select.Trigger>
				<Select.Popup>
					<Select.Item value="first">
						<Select.ItemLabel>First</Select.ItemLabel>
					</Select.Item>
					<iframe title="Popup frame" />
				</Select.Popup>
			</Select.Root>
		);

		await userEvent.click( screen.getByRole( 'combobox' ) );
		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Popup frame' );
		const iframeDocument = iframe.contentDocument;
		if ( ! iframeDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}
		const button = iframeDocument.createElement( 'button' );
		button.textContent = 'Inside popup';
		button.addEventListener( 'click', onPopupClick );
		iframeDocument.body.appendChild( button );

		await page
			.frameLocator( page.getByTitle( 'Popup frame' ) )
			.getByRole( 'button', { name: 'Inside popup' } )
			.click();

		expect( onPopupClick ).toHaveBeenCalledTimes( 1 );
		await expect
			.element( page.getByRole( 'option', { name: 'First' } ) )
			.toBeVisible();
	} );

	it( 'closes Combobox and delivers the iframe click', async () => {
		const onCanvasClick = vi.fn();
		await render(
			<>
				<Combobox.Root items={ [ 'First' ] }>
					<Combobox.Trigger>Select</Combobox.Trigger>
					<Combobox.Popup>
						<Combobox.Input placeholder="Search" />
						<Combobox.List>
							<Combobox.ListBody>
								<Combobox.Item value="First">
									<Combobox.ItemLabel>
										First
									</Combobox.ItemLabel>
								</Combobox.Item>
							</Combobox.ListBody>
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Root>
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
		await canvasButton.click();

		await waitFor( () => {
			expect(
				screen.queryByRole( 'option', { name: 'First' } )
			).not.toBeInTheDocument();
		} );
		expect( onCanvasClick ).toHaveBeenCalledTimes( 1 );
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
} );
