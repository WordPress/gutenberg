import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as Autocomplete from '../index';
import { addCanvasButton } from '../../../test/fixtures/iframe';

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
} );
