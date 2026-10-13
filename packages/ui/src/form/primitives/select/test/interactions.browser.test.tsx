import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as Select from '../index';
import { addCanvasButton } from '../../../test/fixtures/iframe';

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
} );
