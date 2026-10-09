import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import * as Autocomplete from '../index';
import { addCanvasButton } from '../../../test/fixtures/iframe';

describe( 'Autocomplete iframe dismissal', () => {
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
