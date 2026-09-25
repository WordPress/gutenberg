import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as Select from '../index';

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
} );
