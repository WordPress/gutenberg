import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { screen } from '@testing-library/react';
import '@wordpress/theme/design-tokens.css';
import { ThemeProvider } from '../../../../utils/theme-provider';
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
