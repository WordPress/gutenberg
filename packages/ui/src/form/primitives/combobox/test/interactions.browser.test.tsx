import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as Combobox from '../index';

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
						<Combobox.Item value="Apple">Apple</Combobox.Item>
						<Combobox.Item value="Banana">Banana</Combobox.Item>
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
} );
