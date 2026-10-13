import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as Combobox from '../index';
import { addCanvasButton } from '../../../test/fixtures/iframe';

describe( 'Combobox interactions', () => {
	it( 'read-only Combobox allows browsing without changing the value', async () => {
		const onValueChange = vi.fn();
		await render(
			<Combobox.Root
				readOnly
				items={ [ 'Apple', 'Banana' ] }
				defaultValue="Apple"
				onValueChange={ onValueChange }
			>
				<Combobox.Trigger aria-label="Choose fruit" />
				<Combobox.Popup>
					<Combobox.Input aria-label="Search fruit" />
					<Combobox.List>
						<Combobox.Item value="Apple">
							<Combobox.ItemLabel>Apple</Combobox.ItemLabel>
						</Combobox.Item>
						<Combobox.Item value="Banana">
							<Combobox.ItemLabel>Banana</Combobox.ItemLabel>
						</Combobox.Item>
					</Combobox.List>
				</Combobox.Popup>
			</Combobox.Root>
		);

		const trigger = page.getByLabelText( 'Choose fruit' );
		await trigger.click();
		const banana = page.getByRole( 'option', { name: 'Banana' } );
		await expect.element( banana ).toBeVisible();
		await expect
			.element( page.getByLabelText( 'Search fruit' ) )
			.toHaveFocus();
		await userEvent.keyboard( '{ArrowDown}' );
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
} );
